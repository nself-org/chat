/**
 * Biometric Authentication for Capacitor
 * Supports Face ID, Touch ID (iOS) and Fingerprint (Android)
 */

import { Capacitor } from '@capacitor/core';

// Note: Biometric authentication requires a community plugin
// Install: npm install @aparajita/capacitor-biometric-auth

export interface BiometricType {
  face: boolean;
  fingerprint: boolean;
  iris: boolean;
}

export interface BiometricAuthOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  cancelTitle?: string;
  fallbackTitle?: string;
  confirmationRequired?: boolean;
}

class BiometricService {
  private isAvailable = false;
  private biometricTypes: BiometricType = {
    face: false,
    fingerprint: false,
    iris: false,
  };

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Biometric authentication not available on web');
      return;
    }

    await this.checkAvailability();
  }

  /**
   * Check if biometric authentication is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Note: This is a placeholder implementation
      // The actual implementation depends on the plugin used
      // Example using @aparajita/capacitor-biometric-auth:

      // const result = await BiometricAuth.checkBiometry();
      // this.isAvailable = result.isAvailable;
      // this.biometricTypes = {
      //   face: result.biometryType === BiometryType.faceId,
      //   fingerprint: result.biometryType === BiometryType.touchId ||
      //                result.biometryType === BiometryType.fingerprint,
      //   iris: result.biometryType === BiometryType.iris,
      // };

      console.log('Biometric availability check:', this.isAvailable);
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(options?: BiometricAuthOptions): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('Biometric authentication not available');
      return false;
    }

    try {
      const defaultOptions: BiometricAuthOptions = {
        title: 'Authenticate',
        subtitle: 'Verify your identity',
        description: 'Use biometrics to authenticate',
        cancelTitle: 'Cancel',
        fallbackTitle: 'Use Password',
        confirmationRequired: true,
        ...options,
      };

      // Note: This is a placeholder implementation
      // Example using @aparajita/capacitor-biometric-auth:

      // const result = await BiometricAuth.authenticate({
      //   reason: defaultOptions.description,
      //   cancelTitle: defaultOptions.cancelTitle,
      //   fallbackTitle: defaultOptions.fallbackTitle,
      //   iosFallbackTitle: defaultOptions.fallbackTitle,
      //   androidTitle: defaultOptions.title,
      //   androidSubtitle: defaultOptions.subtitle,
      //   androidConfirmationRequired: defaultOptions.confirmationRequired,
      // });

      // return result.authenticated;

      console.log('Biometric authentication attempt with options:', defaultOptions);
      return true; // Placeholder
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Get available biometric types
   */
  getAvailableBiometricTypes(): BiometricType {
    return this.biometricTypes;
  }

  /**
   * Check if Face ID is available (iOS)
   */
  isFaceIDAvailable(): boolean {
    return this.biometricTypes.face;
  }

  /**
   * Check if Touch ID is available (iOS)
   */
  isTouchIDAvailable(): boolean {
    return Capacitor.getPlatform() === 'ios' && this.biometricTypes.fingerprint;
  }

  /**
   * Check if Fingerprint is available (Android)
   */
  isFingerprintAvailable(): boolean {
    return Capacitor.getPlatform() === 'android' && this.biometricTypes.fingerprint;
  }

  /**
   * Get biometric type description
   */
  getBiometricTypeDescription(): string {
    if (this.biometricTypes.face) {
      return 'Face ID';
    } else if (this.biometricTypes.fingerprint) {
      return Capacitor.getPlatform() === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (this.biometricTypes.iris) {
      return 'Iris';
    }
    return 'Biometric';
  }

  /**
   * Enable biometric authentication for user
   */
  async enableBiometricAuth(userId: string): Promise<boolean> {
    try {
      // Authenticate first to ensure user can use biometrics
      const authenticated = await this.authenticate({
        title: 'Enable Biometric Authentication',
        description: 'Verify your identity to enable biometric login',
      });

      if (authenticated) {
        // Store user preference
        await this.saveBiometricPreference(userId, true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication for user
   */
  async disableBiometricAuth(userId: string): Promise<void> {
    await this.saveBiometricPreference(userId, false);
  }

  /**
   * Check if biometric auth is enabled for user
   */
  async isBiometricAuthEnabled(userId: string): Promise<boolean> {
    try {
      // Get preference from storage
      const preference = await this.getBiometricPreference(userId);
      return preference === 'true';
    } catch (error) {
      console.error('Error checking biometric auth preference:', error);
      return false;
    }
  }

  /**
   * Save biometric preference to storage
   */
  private async saveBiometricPreference(userId: string, enabled: boolean): Promise<void> {
    try {
      // Use Capacitor Preferences plugin
      // await Preferences.set({
      //   key: `biometric_enabled_${userId}`,
      //   value: enabled.toString(),
      // });
      console.log(`Biometric preference saved for user ${userId}:`, enabled);
    } catch (error) {
      console.error('Error saving biometric preference:', error);
    }
  }

  /**
   * Get biometric preference from storage
   */
  private async getBiometricPreference(userId: string): Promise<string | null> {
    try {
      // Use Capacitor Preferences plugin
      // const result = await Preferences.get({
      //   key: `biometric_enabled_${userId}`,
      // });
      // return result.value;
      return null; // Placeholder
    } catch (error) {
      console.error('Error getting biometric preference:', error);
      return null;
    }
  }

  /**
   * Remove biometric preference
   */
  async removeBiometricPreference(userId: string): Promise<void> {
    try {
      // Use Capacitor Preferences plugin
      // await Preferences.remove({
      //   key: `biometric_enabled_${userId}`,
      // });
      console.log(`Biometric preference removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing biometric preference:', error);
    }
  }
}

// Export singleton instance
export const biometrics = new BiometricService();
