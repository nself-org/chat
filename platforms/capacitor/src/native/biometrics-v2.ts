/**
 * Enhanced Biometric Authentication for Capacitor v2
 *
 * Full biometric authentication support with:
 * - Face ID (iOS)
 * - Touch ID (iOS)
 * - Fingerprint (Android)
 * - Iris Scanner (Android)
 * - Device Credential fallback
 * - Keychain/Keystore integration
 */

import { registerPlugin, PluginListenerHandle } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// =============================================================================
// Types
// =============================================================================

export type BiometryType = 'none' | 'touchId' | 'faceId' | 'fingerprint' | 'iris' | 'multiple'

export type BiometryStrength = 'strong' | 'weak' | 'none'

export interface BiometryInfo {
  isAvailable: boolean
  biometryType: BiometryType
  biometryTypes: BiometryType[]
  isEnrolled: boolean
  strongAuthenticatorAvailable: boolean
  deviceCredentialAvailable: boolean
  reason?: string
}

export interface BiometricAuthOptions {
  /** Title for the authentication dialog */
  title?: string
  /** Subtitle (Android only) */
  subtitle?: string
  /** Description/reason for authentication */
  reason?: string
  /** Cancel button text */
  cancelTitle?: string
  /** Fallback button text (iOS) / Negative button (Android) */
  fallbackTitle?: string
  /** Allow device credential (PIN/Pattern/Password) as fallback */
  allowDeviceCredential?: boolean
  /** Require confirmation after successful biometric (Android) */
  confirmationRequired?: boolean
  /** Use strong biometrics only (Android) */
  strongAuthenticationRequired?: boolean
  /** Invalidate on biometric enrollment change */
  invalidateOnBiometryChange?: boolean
}

export interface BiometricAuthResult {
  success: boolean
  error?: BiometricError
  errorCode?: string
  errorMessage?: string
}

export type BiometricError =
  | 'userCancel'
  | 'userFallback'
  | 'systemCancel'
  | 'passcodeNotSet'
  | 'biometryNotAvailable'
  | 'biometryNotEnrolled'
  | 'biometryLockout'
  | 'authenticationFailed'
  | 'invalidContext'
  | 'unknown'

export interface SecureStorageOptions {
  /** Key identifier */
  key: string
  /** Require biometric authentication to access */
  requireBiometry?: boolean
  /** Invalidate on biometric enrollment change */
  invalidateOnBiometryChange?: boolean
  /** Access control flags (iOS) */
  accessControl?: 'userPresence' | 'biometryAny' | 'biometryCurrentSet' | 'devicePasscode'
}

export interface BiometricSettings {
  enabled: boolean
  userId?: string
  lastAuthenticated?: number
  failedAttempts: number
  lockedUntil?: number
}

// =============================================================================
// Biometric Plugin Interface
// =============================================================================

export interface BiometricPlugin {
  /**
   * Check biometry availability
   */
  checkBiometry(): Promise<BiometryInfo>

  /**
   * Authenticate using biometrics
   */
  authenticate(options: BiometricAuthOptions): Promise<BiometricAuthResult>

  /**
   * Set item in secure storage (Keychain/Keystore)
   */
  setSecureItem(options: {
    key: string
    value: string
    options?: SecureStorageOptions
  }): Promise<void>

  /**
   * Get item from secure storage
   */
  getSecureItem(options: {
    key: string
    authOptions?: BiometricAuthOptions
  }): Promise<{ value: string | null }>

  /**
   * Remove item from secure storage
   */
  removeSecureItem(options: { key: string }): Promise<void>

  /**
   * Check if secure item exists
   */
  hasSecureItem(options: { key: string }): Promise<{ exists: boolean }>

  /**
   * Add listener for biometry changes
   */
  addListener(
    eventName: 'biometryChanged',
    listenerFunc: (data: { available: boolean; type: BiometryType }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>
}

// =============================================================================
// Register Plugin
// =============================================================================

const Biometric = registerPlugin<BiometricPlugin>('Biometric', {
  web: () => import('./biometrics-v2-web').then((m) => new m.BiometricWeb()),
})

// =============================================================================
// Constants
// =============================================================================

const SETTINGS_KEY = 'biometric_settings'
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes
const AUTH_SESSION_DURATION = 5 * 60 * 1000 // 5 minutes

// =============================================================================
// Biometric Service
// =============================================================================

class BiometricService {
  private initialized = false
  private biometryInfo: BiometryInfo | null = null
  private settings: BiometricSettings = {
    enabled: false,
    failedAttempts: 0,
  }
  private listeners: PluginListenerHandle[] = []
  private lastAuthTime: number | null = null

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<BiometryInfo> {
    if (this.initialized && this.biometryInfo) {
      return this.biometryInfo
    }

    try {
      // Load settings
      await this.loadSettings()

      // Check biometry
      this.biometryInfo = await Biometric.checkBiometry()

      // Set up listeners
      await this.setupListeners()

      this.initialized = true
      console.log('Biometric service initialized', this.biometryInfo)

      return this.biometryInfo
    } catch (error) {
      console.error('Failed to initialize biometric service:', error)
      this.biometryInfo = {
        isAvailable: false,
        biometryType: 'none',
        biometryTypes: [],
        isEnrolled: false,
        strongAuthenticatorAvailable: false,
        deviceCredentialAvailable: false,
        reason: error instanceof Error ? error.message : 'Initialization failed',
      }
      return this.biometryInfo
    }
  }

  /**
   * Set up event listeners
   */
  private async setupListeners(): Promise<void> {
    const listener = await Biometric.addListener('biometryChanged', (data) => {
      console.log('Biometry changed:', data)
      this.biometryInfo = {
        ...this.biometryInfo!,
        isAvailable: data.available,
        biometryType: data.type,
      }
    })
    this.listeners.push(listener)
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.biometryInfo) {
      await this.initialize()
    }
    return this.biometryInfo?.isAvailable === true && this.biometryInfo?.isEnrolled === true
  }

  /**
   * Get biometry information
   */
  async getBiometryInfo(): Promise<BiometryInfo> {
    if (!this.biometryInfo) {
      await this.initialize()
    }
    return this.biometryInfo!
  }

  /**
   * Get human-readable biometry type name
   */
  getBiometryTypeName(): string {
    if (!this.biometryInfo) return 'Biometrics'

    const platform = Capacitor.getPlatform()

    switch (this.biometryInfo.biometryType) {
      case 'faceId':
        return 'Face ID'
      case 'touchId':
        return 'Touch ID'
      case 'fingerprint':
        return platform === 'ios' ? 'Touch ID' : 'Fingerprint'
      case 'iris':
        return 'Iris'
      case 'multiple':
        return 'Biometrics'
      default:
        return 'Biometrics'
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(options?: Partial<BiometricAuthOptions>): Promise<BiometricAuthResult> {
    // Check if locked out
    if (await this.isLockedOut()) {
      return {
        success: false,
        error: 'biometryLockout',
        errorMessage: 'Too many failed attempts. Please try again later.',
      }
    }

    // Check availability
    if (!(await this.isAvailable())) {
      return {
        success: false,
        error: 'biometryNotAvailable',
        errorMessage: 'Biometric authentication is not available',
      }
    }

    const defaultOptions: BiometricAuthOptions = {
      title: 'Authenticate',
      subtitle: '',
      reason: `Use ${this.getBiometryTypeName()} to continue`,
      cancelTitle: 'Cancel',
      fallbackTitle: 'Use Password',
      allowDeviceCredential: true,
      confirmationRequired: false,
      strongAuthenticationRequired: false,
      invalidateOnBiometryChange: false,
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
      const result = await Biometric.authenticate(mergedOptions)

      if (result.success) {
        // Reset failed attempts
        this.settings.failedAttempts = 0
        this.settings.lockedUntil = undefined
        this.lastAuthTime = Date.now()
        await this.saveSettings()
      } else {
        // Track failed attempt
        this.settings.failedAttempts++
        if (this.settings.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          this.settings.lockedUntil = Date.now() + LOCKOUT_DURATION
        }
        await this.saveSettings()
      }

      return result
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return {
        success: false,
        error: 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check if authentication session is still valid
   */
  isAuthSessionValid(): boolean {
    if (!this.lastAuthTime) return false
    return Date.now() - this.lastAuthTime < AUTH_SESSION_DURATION
  }

  /**
   * Enable biometric authentication for user
   */
  async enable(userId: string): Promise<BiometricAuthResult> {
    const result = await this.authenticate({
      title: 'Enable Biometric Login',
      reason: `Enable ${this.getBiometryTypeName()} for quick sign in`,
    })

    if (result.success) {
      this.settings.enabled = true
      this.settings.userId = userId
      await this.saveSettings()
    }

    return result
  }

  /**
   * Disable biometric authentication
   */
  async disable(): Promise<void> {
    this.settings.enabled = false
    this.settings.userId = undefined
    await this.saveSettings()
  }

  /**
   * Check if biometric authentication is enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled
  }

  /**
   * Get enabled user ID
   */
  getEnabledUserId(): string | undefined {
    return this.settings.userId
  }

  /**
   * Check if locked out due to failed attempts
   */
  private async isLockedOut(): Promise<boolean> {
    if (!this.settings.lockedUntil) return false

    if (Date.now() > this.settings.lockedUntil) {
      // Lockout expired
      this.settings.failedAttempts = 0
      this.settings.lockedUntil = undefined
      await this.saveSettings()
      return false
    }

    return true
  }

  /**
   * Get remaining lockout time in seconds
   */
  getRemainingLockoutTime(): number {
    if (!this.settings.lockedUntil) return 0
    const remaining = this.settings.lockedUntil - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
  }

  // =========================================================================
  // Secure Storage Methods
  // =========================================================================

  /**
   * Store credentials securely with biometric protection
   */
  async storeCredentials(
    userId: string,
    token: string,
    requireBiometry: boolean = true
  ): Promise<void> {
    await Biometric.setSecureItem({
      key: `credentials_${userId}`,
      value: JSON.stringify({ userId, token, timestamp: Date.now() }),
      options: {
        key: `credentials_${userId}`,
        requireBiometry,
        invalidateOnBiometryChange: true,
        accessControl: requireBiometry ? 'biometryCurrentSet' : 'devicePasscode',
      },
    })
  }

  /**
   * Retrieve credentials with biometric authentication
   */
  async getCredentials(
    userId: string,
    authOptions?: BiometricAuthOptions
  ): Promise<{ userId: string; token: string; timestamp: number } | null> {
    try {
      const { value } = await Biometric.getSecureItem({
        key: `credentials_${userId}`,
        authOptions: authOptions || {
          title: 'Sign In',
          reason: `Use ${this.getBiometryTypeName()} to sign in`,
        },
      })

      if (value) {
        return JSON.parse(value)
      }
      return null
    } catch (error) {
      console.error('Failed to get credentials:', error)
      return null
    }
  }

  /**
   * Remove stored credentials
   */
  async removeCredentials(userId: string): Promise<void> {
    await Biometric.removeSecureItem({ key: `credentials_${userId}` })
  }

  /**
   * Check if credentials exist
   */
  async hasCredentials(userId: string): Promise<boolean> {
    const { exists } = await Biometric.hasSecureItem({ key: `credentials_${userId}` })
    return exists
  }

  /**
   * Store sensitive data with biometric protection
   */
  async setSecureItem(key: string, value: string, requireBiometry: boolean = true): Promise<void> {
    await Biometric.setSecureItem({
      key,
      value,
      options: {
        key,
        requireBiometry,
        accessControl: requireBiometry ? 'biometryCurrentSet' : 'devicePasscode',
      },
    })
  }

  /**
   * Get sensitive data with biometric authentication
   */
  async getSecureItem(key: string, authOptions?: BiometricAuthOptions): Promise<string | null> {
    const { value } = await Biometric.getSecureItem({ key, authOptions })
    return value
  }

  /**
   * Remove sensitive data
   */
  async removeSecureItem(key: string): Promise<void> {
    await Biometric.removeSecureItem({ key })
  }

  // =========================================================================
  // Settings Management
  // =========================================================================

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SETTINGS_KEY })
      if (value) {
        this.settings = JSON.parse(value)
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error)
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      this.settings.lastAuthenticated = this.lastAuthTime || undefined
      await Preferences.set({
        key: SETTINGS_KEY,
        value: JSON.stringify(this.settings),
      })
    } catch (error) {
      console.error('Error saving biometric settings:', error)
    }
  }

  /**
   * Reset all settings
   */
  async resetSettings(): Promise<void> {
    this.settings = {
      enabled: false,
      failedAttempts: 0,
    }
    this.lastAuthTime = null
    await this.saveSettings()
  }

  /**
   * Clean up
   */
  async cleanup(): Promise<void> {
    await Biometric.removeAllListeners()
    this.listeners = []
    this.initialized = false
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const biometricAuth = new BiometricService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UseBiometricAuthResult {
  isAvailable: boolean
  isEnabled: boolean
  biometryType: BiometryType
  biometryTypeName: string
  isLoading: boolean
  isLockedOut: boolean
  remainingLockoutTime: number
  authenticate: (reason?: string) => Promise<BiometricAuthResult>
  enable: (userId: string) => Promise<BiometricAuthResult>
  disable: () => Promise<void>
  storeCredentials: (userId: string, token: string) => Promise<void>
  getCredentials: (userId: string) => Promise<{ userId: string; token: string } | null>
  hasCredentials: (userId: string) => Promise<boolean>
}

export function useBiometricAuth(): UseBiometricAuthResult {
  const [isAvailable, setIsAvailable] = React.useState(false)
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [biometryType, setBiometryType] = React.useState<BiometryType>('none')
  const [biometryTypeName, setBiometryTypeName] = React.useState('Biometrics')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLockedOut, setIsLockedOut] = React.useState(false)
  const [remainingLockoutTime, setRemainingLockoutTime] = React.useState(0)

  React.useEffect(() => {
    let mounted = true
    let lockoutInterval: NodeJS.Timeout | null = null

    async function init() {
      const info = await biometricAuth.initialize()

      if (!mounted) return

      setIsAvailable(info.isAvailable && info.isEnrolled)
      setBiometryType(info.biometryType)
      setBiometryTypeName(biometricAuth.getBiometryTypeName())
      setIsEnabled(biometricAuth.isEnabled())
      setIsLoading(false)

      // Check lockout status
      const lockoutTime = biometricAuth.getRemainingLockoutTime()
      setIsLockedOut(lockoutTime > 0)
      setRemainingLockoutTime(lockoutTime)

      // Update lockout countdown
      if (lockoutTime > 0) {
        lockoutInterval = setInterval(() => {
          const remaining = biometricAuth.getRemainingLockoutTime()
          setRemainingLockoutTime(remaining)
          setIsLockedOut(remaining > 0)

          if (remaining <= 0 && lockoutInterval) {
            clearInterval(lockoutInterval)
          }
        }, 1000)
      }
    }

    init()

    return () => {
      mounted = false
      if (lockoutInterval) {
        clearInterval(lockoutInterval)
      }
    }
  }, [])

  const authenticate = React.useCallback(async (reason?: string) => {
    const result = await biometricAuth.authenticate({ reason })

    // Update lockout state
    const lockoutTime = biometricAuth.getRemainingLockoutTime()
    setIsLockedOut(lockoutTime > 0)
    setRemainingLockoutTime(lockoutTime)

    return result
  }, [])

  const enable = React.useCallback(async (userId: string) => {
    const result = await biometricAuth.enable(userId)
    if (result.success) {
      setIsEnabled(true)
    }
    return result
  }, [])

  const disable = React.useCallback(async () => {
    await biometricAuth.disable()
    setIsEnabled(false)
  }, [])

  const storeCredentials = React.useCallback(async (userId: string, token: string) => {
    await biometricAuth.storeCredentials(userId, token)
  }, [])

  const getCredentials = React.useCallback(async (userId: string) => {
    const creds = await biometricAuth.getCredentials(userId)
    return creds ? { userId: creds.userId, token: creds.token } : null
  }, [])

  const hasCredentials = React.useCallback(async (userId: string) => {
    return biometricAuth.hasCredentials(userId)
  }, [])

  return {
    isAvailable,
    isEnabled,
    biometryType,
    biometryTypeName,
    isLoading,
    isLockedOut,
    remainingLockoutTime,
    authenticate,
    enable,
    disable,
    storeCredentials,
    getCredentials,
    hasCredentials,
  }
}
