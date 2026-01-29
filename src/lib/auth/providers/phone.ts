/**
 * Phone/SMS Authentication Provider
 *
 * Supports phone number verification via SMS OTP codes.
 * Can be used with various SMS providers (Twilio, AWS SNS, etc.)
 */

import { AuthProvider, AuthResult, AuthProviderConfig } from './types';

export interface PhoneAuthConfig extends AuthProviderConfig {
  provider: 'twilio' | 'aws-sns' | 'messagebird' | 'vonage' | 'custom';
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioVerifyServiceSid?: string;
  // AWS SNS
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  // Custom webhook
  sendCodeWebhook?: string;
  verifyCodeWebhook?: string;
  // Options
  codeLength?: number;
  codeExpiry?: number; // seconds
  maxAttempts?: number;
  cooldownPeriod?: number; // seconds between resends
}

export interface PhoneVerificationState {
  phoneNumber: string;
  codeSentAt: number;
  attempts: number;
  verified: boolean;
}

// In-memory store for verification states (use Redis in production)
const verificationStates = new Map<string, PhoneVerificationState>();

export class PhoneAuthProvider implements AuthProvider {
  private config: PhoneAuthConfig;

  constructor(config: PhoneAuthConfig) {
    this.config = {
      codeLength: 6,
      codeExpiry: 300, // 5 minutes
      maxAttempts: 3,
      cooldownPeriod: 60, // 1 minute
      ...config,
    };
  }

  get id() {
    return 'phone';
  }

  get name() {
    return 'Phone';
  }

  get icon() {
    return 'phone';
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');

    // Add + if not present
    if (!formatted.startsWith('+')) {
      // Assume US number if no country code
      if (formatted.length === 10) {
        formatted = '+1' + formatted;
      } else {
        formatted = '+' + formatted;
      }
    }

    return formatted;
  }

  /**
   * Generate a random OTP code
   */
  private generateCode(): string {
    const length = this.config.codeLength || 6;
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Send verification code via configured provider
   */
  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message?: string }> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Check cooldown
    const existingState = verificationStates.get(formattedPhone);
    if (existingState) {
      const timeSinceLastCode = (Date.now() - existingState.codeSentAt) / 1000;
      if (timeSinceLastCode < (this.config.cooldownPeriod || 60)) {
        return {
          success: false,
          message: `Please wait ${Math.ceil((this.config.cooldownPeriod || 60) - timeSinceLastCode)} seconds before requesting a new code`,
        };
      }
    }

    const code = this.generateCode();

    try {
      switch (this.config.provider) {
        case 'twilio':
          await this.sendViaTwilio(formattedPhone, code);
          break;
        case 'aws-sns':
          await this.sendViaAwsSns(formattedPhone, code);
          break;
        case 'custom':
          await this.sendViaCustomWebhook(formattedPhone, code);
          break;
        default:
          // Development mode - log code to console
          console.log(`[Phone Auth] Verification code for ${formattedPhone}: ${code}`);
      }

      // Store verification state
      verificationStates.set(formattedPhone, {
        phoneNumber: formattedPhone,
        codeSentAt: Date.now(),
        attempts: 0,
        verified: false,
      });

      // Store code securely (in production, use encrypted storage)
      // For demo purposes, we store it in the state
      (verificationStates.get(formattedPhone) as any)._code = code;

      return { success: true };
    } catch (error) {
      console.error('[Phone Auth] Failed to send code:', error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  /**
   * Send code via Twilio Verify
   */
  private async sendViaTwilio(phone: string, code: string): Promise<void> {
    if (!this.config.twilioAccountSid || !this.config.twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    const url = this.config.twilioVerifyServiceSid
      ? `https://verify.twilio.com/v2/Services/${this.config.twilioVerifyServiceSid}/Verifications`
      : `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioAccountSid}/Messages.json`;

    const auth = Buffer.from(
      `${this.config.twilioAccountSid}:${this.config.twilioAuthToken}`
    ).toString('base64');

    if (this.config.twilioVerifyServiceSid) {
      // Use Twilio Verify service
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          Channel: 'sms',
        }),
      });
    } else {
      // Use regular SMS
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: process.env.TWILIO_PHONE_NUMBER || '',
          Body: `Your nChat verification code is: ${code}`,
        }),
      });
    }
  }

  /**
   * Send code via AWS SNS
   */
  private async sendViaAwsSns(phone: string, code: string): Promise<void> {
    // In production, use AWS SDK
    console.log(`[AWS SNS] Would send code ${code} to ${phone}`);
    throw new Error('AWS SNS integration requires @aws-sdk/client-sns');
  }

  /**
   * Send code via custom webhook
   */
  private async sendViaCustomWebhook(phone: string, code: string): Promise<void> {
    if (!this.config.sendCodeWebhook) {
      throw new Error('Custom webhook URL not configured');
    }

    const response = await fetch(this.config.sendCodeWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      throw new Error('Custom webhook failed');
    }
  }

  /**
   * Verify the OTP code
   */
  async verifyCode(phoneNumber: string, code: string): Promise<AuthResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const state = verificationStates.get(formattedPhone);

    if (!state) {
      return {
        success: false,
        error: 'No verification in progress for this phone number',
      };
    }

    // Check expiry
    const elapsed = (Date.now() - state.codeSentAt) / 1000;
    if (elapsed > (this.config.codeExpiry || 300)) {
      verificationStates.delete(formattedPhone);
      return {
        success: false,
        error: 'Verification code has expired',
      };
    }

    // Check attempts
    if (state.attempts >= (this.config.maxAttempts || 3)) {
      verificationStates.delete(formattedPhone);
      return {
        success: false,
        error: 'Too many failed attempts',
      };
    }

    // Verify code
    const storedCode = (state as any)._code;
    if (code !== storedCode) {
      state.attempts++;
      return {
        success: false,
        error: 'Invalid verification code',
      };
    }

    // Mark as verified
    state.verified = true;
    verificationStates.delete(formattedPhone);

    return {
      success: true,
      user: {
        id: '', // Will be set by auth system
        email: '', // Phone users may not have email
        displayName: formattedPhone,
        provider: 'phone',
        providerUserId: formattedPhone,
        verified: true,
        phoneNumber: formattedPhone,
        metadata: {
          phone: {
            number: formattedPhone,
            verifiedAt: new Date().toISOString(),
          },
        },
      },
      tokens: {
        accessToken: '', // Will be generated by auth system
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  }

  /**
   * Authenticate with phone (two-step process)
   * Step 1: Call sendVerificationCode
   * Step 2: Call verifyCode with the received code
   */
  async authenticate(phoneNumber: string, code?: string): Promise<AuthResult> {
    if (!code) {
      // Step 1: Send code
      const result = await this.sendVerificationCode(phoneNumber);
      if (!result.success) {
        return { success: false, error: result.message };
      }
      return {
        success: true,
        requiresVerification: true,
        user: null as any,
        tokens: null as any,
      };
    }

    // Step 2: Verify code
    return this.verifyCode(phoneNumber, code);
  }

  /**
   * Sign out (no-op for phone auth)
   */
  async signOut(): Promise<void> {
    // Phone auth is stateless on the provider side
  }
}

// Helper to create phone auth provider
export function createPhoneAuthProvider(
  provider: PhoneAuthConfig['provider'],
  options?: Partial<PhoneAuthConfig>
): PhoneAuthProvider {
  return new PhoneAuthProvider({
    provider,
    ...options,
  });
}

// Development phone auth provider (logs codes to console)
export function createDevPhoneAuthProvider(): PhoneAuthProvider {
  return new PhoneAuthProvider({
    provider: 'custom',
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 5,
    cooldownPeriod: 10, // Short cooldown for testing
  });
}
