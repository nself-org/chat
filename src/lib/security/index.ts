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
