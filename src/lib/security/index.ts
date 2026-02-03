/**
 * Security Module Index
 *
 * Exports all security-related utilities, stores, and hooks
 */

import { authConfig } from '@/config/auth.config'

import { logger } from '@/lib/logger'

// ============================================================================
// Production Security Guards
// ============================================================================

/**
 * CRITICAL: Verify that dev auth is not enabled in production
 * Call this at application startup
 */
export function assertProductionSecurity(): void {
  if (process.env.NODE_ENV === 'production') {
    // Check dev auth is disabled
    if (authConfig.useDevAuth) {
      throw new Error(
        '[SECURITY] FATAL: Dev auth is enabled in production. ' +
          'This is a critical security vulnerability. Shutting down.'
      )
    }

    // Check JWT secret is set and strong enough
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('[SECURITY] FATAL: JWT_SECRET environment variable is not set in production.')
    }

    if (jwtSecret.length < 32) {
      throw new Error('[SECURITY] FATAL: JWT_SECRET must be at least 32 characters in production.')
    }

    // Check for common weak secrets
    const weakSecrets = ['secret', 'jwt_secret', 'your-secret', 'change-me', 'development', 'test']

    if (weakSecrets.some((weak) => jwtSecret.toLowerCase().includes(weak))) {
      throw new Error(
        '[SECURITY] FATAL: JWT_SECRET appears to be a weak or default value. ' +
          'Use a cryptographically secure random string.'
      )
    }

    // REMOVED: console.log('[SECURITY] Production security checks passed.')
  }
}

/**
 * Check if dev auth is safely disabled
 * Returns true if safe (production without dev auth, or development)
 */
export function isDevAuthSafe(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return !authConfig.useDevAuth
  }
  return true // Always safe in development/test
}

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }),
  }
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  event: string,
  level: 'info' | 'warning' | 'error' | 'critical',
  details?: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
    env: process.env.NODE_ENV,
  }

  if (level === 'critical' || level === 'error') {
    logger.error(`[SECURITY ${level.toUpperCase()}]`, undefined, logEntry)
  } else if (level === 'warning') {
    logger.warn(`[SECURITY ${level.toUpperCase()}]`, logEntry)
  } else {
    // REMOVED: console.log(`[SECURITY ${level.toUpperCase()}]`, JSON.stringify(logEntry))
  }
}

// ============================================================================
// Module Exports
// ============================================================================

// Session Store
export {
  useSessionStore,
  parseUserAgent,
  formatLocation,
  formatSessionTime,
  getDeviceIcon,
  getBrowserIcon,
  type Session,
  type LoginAttempt,
  type SessionLocation,
  type SessionState,
  type SessionActions,
  type SessionStore,
} from './session-store'

// Two-Factor Authentication
export {
  // Base32 encoding
  base32Encode,
  base32Decode,
  // TOTP
  generateSecret,
  generateOtpauthUrl,
  generateTOTP,
  verifyTOTP,
  // Backup codes
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  // QR code
  generateQRCodeDataUrl,
  // Complete setup
  generateTwoFactorSetup,
  // Validation
  isValidTOTPFormat,
  isValidBackupCodeFormat,
  // Password strength
  calculatePasswordStrength,
  getStrengthColor,
  type TwoFactorSecret,
  type TwoFactorSetupData,
  type BackupCode,
  type PasswordStrength,
} from './two-factor'

// Security Hook
export {
  useSecurity,
  type ChangePasswordResult,
  type TwoFactorSetupResult,
  type TwoFactorVerifyResult,
  type RevokeSessionResult,
  type SecurityAlertPreferences,
} from './use-security'

// PIN Lock
export {
  // Validation
  isValidPinFormat,
  getPinStrength,
  // Hashing
  generateSalt,
  hashPin,
  verifyPin,
  // Storage
  storePinSettings,
  loadPinSettings,
  clearPinSettings,
  hasPinConfigured,
  // Attempts
  recordLocalPinAttempt,
  getRecentFailedAttempts,
  clearAttemptHistory,
  checkLocalLockout,
  // Setup/Change
  setupPin,
  changePin,
  updatePinSettings,
  disablePin,
  type PinSettings,
  type PinAttempt,
  type LockoutStatus,
  type PinSetupResult,
} from './pin'

// Session Management
export {
  // Activity tracking
  updateLastActivity,
  getLastActivityTime,
  getTimeSinceLastActivity,
  getMinutesSinceLastActivity,
  // Visibility
  getVisibilityState,
  setupVisibilityListener,
  // Timeout checking
  checkSessionTimeout,
  shouldLockOnBackground,
  shouldLockOnClose,
  // Lock state
  getLockState,
  lockSession,
  unlockSession,
  isSessionLocked,
  clearLockState,
  // Auto-lock
  checkAndLockIfNeeded,
  setupAutoLockChecker,
  setupActivityListeners,
  setupBeforeUnloadListener,
  // App lifecycle
  handleAppVisible,
  handleAppHidden,
  handleAppClose,
  // Session info
  getSessionActivity,
  getFormattedTimeSinceActivity,
  // Debug
  forceLock,
  getSessionDebugInfo,
  type LockState,
  type SessionActivity,
} from './session'

// Biometric Authentication
export {
  // Availability
  isWebAuthnSupported,
  isBiometricAvailable,
  getBiometricType,
  // Registration
  registerBiometric,
  // Verification
  verifyBiometric,
  // Credentials
  getStoredCredentials,
  removeCredential,
  clearAllCredentials,
  hasRegisteredCredentials,
  // Utilities
  getCredentialIcon,
  getCredentialTypeDescription,
  formatLastUsed,
  type BiometricCredential,
  type BiometricSetupResult,
  type BiometricVerifyResult,
} from './biometric'
