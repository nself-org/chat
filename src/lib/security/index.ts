/**
 * Security Module Index
 *
 * Exports all security-related utilities, stores, and hooks
 */

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
