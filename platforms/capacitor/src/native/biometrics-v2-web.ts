/**
 * Biometric Authentication Web Fallback
 *
 * Provides Web Authentication API (WebAuthn) fallback for biometric authentication.
 * Supports platform authenticators like Windows Hello, Touch ID (Safari), etc.
 */

import type {
  BiometricPlugin,
  BiometryInfo,
  BiometricAuthOptions,
  BiometricAuthResult,
  SecureStorageOptions,
  BiometryType,
} from './biometrics-v2'
import type { PluginListenerHandle } from '@capacitor/core'

// =============================================================================
// Web Authentication Helpers
// =============================================================================

const CREDENTIAL_STORAGE_PREFIX = 'biometric_credential_'
const SECURE_STORAGE_PREFIX = 'secure_storage_'

export class BiometricWeb implements BiometricPlugin {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()
  private credentialId: ArrayBuffer | null = null

  /**
   * Check biometry availability using WebAuthn
   */
  async checkBiometry(): Promise<BiometryInfo> {
    const info: BiometryInfo = {
      isAvailable: false,
      biometryType: 'none',
      biometryTypes: [],
      isEnrolled: false,
      strongAuthenticatorAvailable: false,
      deviceCredentialAvailable: false,
    }

    // Check for WebAuthn support
    if (!window.PublicKeyCredential) {
      info.reason = 'WebAuthn not supported'
      return info
    }

    try {
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

      if (available) {
        info.isAvailable = true
        info.isEnrolled = true
        info.strongAuthenticatorAvailable = true
        info.deviceCredentialAvailable = true

        // Detect biometry type based on platform
        const biometryType = this.detectBiometryType()
        info.biometryType = biometryType
        info.biometryTypes = [biometryType]
      } else {
        info.reason = 'Platform authenticator not available'
      }
    } catch (error) {
      info.reason = error instanceof Error ? error.message : 'Unknown error'
    }

    return info
  }

  /**
   * Detect biometry type from user agent
   */
  private detectBiometryType(): BiometryType {
    const userAgent = navigator.userAgent.toLowerCase()

    // macOS with Touch ID
    if (
      userAgent.includes('mac') &&
      (userAgent.includes('safari') || userAgent.includes('chrome'))
    ) {
      return 'touchId'
    }

    // iOS
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // Face ID on iPhone X and later, Touch ID on earlier
      // Can't reliably detect, default to faceId for newer devices
      return 'faceId'
    }

    // Windows Hello
    if (userAgent.includes('windows')) {
      return 'fingerprint' // Windows Hello supports face and fingerprint
    }

    // Android
    if (userAgent.includes('android')) {
      return 'fingerprint'
    }

    return 'fingerprint'
  }

  /**
   * Authenticate using WebAuthn
   */
  async authenticate(options: BiometricAuthOptions): Promise<BiometricAuthResult> {
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        error: 'biometryNotAvailable',
        errorMessage: 'WebAuthn not supported',
      }
    }

    try {
      // Check if we have stored credential
      const storedCredentialId = localStorage.getItem(`${CREDENTIAL_STORAGE_PREFIX}id`)

      if (storedCredentialId) {
        // Use existing credential
        return this.authenticateWithCredential(storedCredentialId, options)
      } else {
        // Create new credential
        return this.createAndAuthenticate(options)
      }
    } catch (error) {
      console.error('WebAuthn authentication error:', error)

      const errorResult: BiometricAuthResult = {
        success: false,
        error: 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }

      // Map DOMException to biometric errors
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorResult.error = 'userCancel'
            break
          case 'NotSupportedError':
            errorResult.error = 'biometryNotAvailable'
            break
          case 'SecurityError':
            errorResult.error = 'invalidContext'
            break
          case 'AbortError':
            errorResult.error = 'systemCancel'
            break
        }
      }

      return errorResult
    }
  }

  /**
   * Authenticate with existing credential
   */
  private async authenticateWithCredential(
    credentialIdBase64: string,
    _options: BiometricAuthOptions
  ): Promise<BiometricAuthResult> {
    const credentialId = this.base64ToArrayBuffer(credentialIdBase64)

    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [
        {
          type: 'public-key',
          id: credentialId,
        },
      ],
    }

    const assertion = await navigator.credentials.get({
      publicKey: assertionOptions,
    })

    if (assertion) {
      return { success: true }
    }

    return {
      success: false,
      error: 'authenticationFailed',
      errorMessage: 'Authentication failed',
    }
  }

  /**
   * Create new credential and authenticate
   */
  private async createAndAuthenticate(options: BiometricAuthOptions): Promise<BiometricAuthResult> {
    const userId = crypto.getRandomValues(new Uint8Array(16))
    const userName = 'user@nchat.local'

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: options.title || 'nChat',
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    }

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null

    if (credential) {
      // Store credential ID
      const credentialIdBase64 = this.arrayBufferToBase64(credential.rawId)
      localStorage.setItem(`${CREDENTIAL_STORAGE_PREFIX}id`, credentialIdBase64)

      return { success: true }
    }

    return {
      success: false,
      error: 'authenticationFailed',
      errorMessage: 'Failed to create credential',
    }
  }

  /**
   * Set item in secure storage (encrypted localStorage fallback)
   */
  async setSecureItem(options: {
    key: string
    value: string
    options?: SecureStorageOptions
  }): Promise<void> {
    // On web, we use localStorage with simple obfuscation
    // Real security requires WebAuthn credential storage or server-side
    const key = `${SECURE_STORAGE_PREFIX}${options.key}`
    const encrypted = this.simpleEncrypt(options.value)
    localStorage.setItem(key, encrypted)
  }

  /**
   * Get item from secure storage
   */
  async getSecureItem(options: {
    key: string
    authOptions?: BiometricAuthOptions
  }): Promise<{ value: string | null }> {
    // Optionally authenticate first
    if (options.authOptions) {
      const authResult = await this.authenticate(options.authOptions)
      if (!authResult.success) {
        return { value: null }
      }
    }

    const key = `${SECURE_STORAGE_PREFIX}${options.key}`
    const encrypted = localStorage.getItem(key)

    if (encrypted) {
      const decrypted = this.simpleDecrypt(encrypted)
      return { value: decrypted }
    }

    return { value: null }
  }

  /**
   * Remove item from secure storage
   */
  async removeSecureItem(options: { key: string }): Promise<void> {
    const key = `${SECURE_STORAGE_PREFIX}${options.key}`
    localStorage.removeItem(key)
  }

  /**
   * Check if secure item exists
   */
  async hasSecureItem(options: { key: string }): Promise<{ exists: boolean }> {
    const key = `${SECURE_STORAGE_PREFIX}${options.key}`
    return { exists: localStorage.getItem(key) !== null }
  }

  /**
   * Add event listener
   */
  async addListener(
    eventName: string,
    listenerFunc: (...args: unknown[]) => void
  ): Promise<PluginListenerHandle> {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(listenerFunc)

    return {
      remove: async () => {
        this.listeners.get(eventName)?.delete(listenerFunc)
      },
    }
  }

  /**
   * Remove all listeners
   */
  async removeAllListeners(): Promise<void> {
    this.listeners.clear()
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Simple encryption (NOT secure, just obfuscation for demo)
   * In production, use Web Crypto API or server-side encryption
   */
  private simpleEncrypt(value: string): string {
    // Simple base64 encoding with prefix reversal
    const encoded = btoa(value)
    return encoded.split('').reverse().join('')
  }

  /**
   * Simple decryption
   */
  private simpleDecrypt(encrypted: string): string {
    const reversed = encrypted.split('').reverse().join('')
    return atob(reversed)
  }
}
