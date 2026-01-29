/**
 * Biometrics - Face ID / Touch ID / Fingerprint authentication
 */

import * as LocalAuthentication from 'expo-local-authentication'

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none'

export interface BiometricAuthResult {
  success: boolean
  error?: string
  errorCode?: string
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  return hasHardware && isEnrolled
}

/**
 * Check if device has biometric hardware
 */
export async function hasBiometricHardware(): Promise<boolean> {
  return LocalAuthentication.hasHardwareAsync()
}

/**
 * Check if user has enrolled biometrics
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  return LocalAuthentication.isEnrolledAsync()
}

/**
 * Get supported biometric types
 */
export async function getSupportedBiometricTypes(): Promise<BiometricType[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
  return types.map((type) => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'fingerprint'
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'facial'
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'iris'
      default:
        return 'none'
    }
  })
}

/**
 * Get the primary biometric type
 */
export async function getPrimaryBiometricType(): Promise<BiometricType> {
  const types = await getSupportedBiometricTypes()
  // Prefer facial recognition, then fingerprint, then iris
  if (types.includes('facial')) return 'facial'
  if (types.includes('fingerprint')) return 'fingerprint'
  if (types.includes('iris')) return 'iris'
  return 'none'
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return 'Face ID'
    case 'fingerprint':
      return 'Touch ID'
    case 'iris':
      return 'Iris scan'
    default:
      return 'Biometric'
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string,
  fallbackLabel?: string
): Promise<BiometricAuthResult> {
  const isAvailable = await isBiometricAvailable()
  if (!isAvailable) {
    return {
      success: false,
      error: 'Biometric authentication is not available',
      errorCode: 'NOT_AVAILABLE',
    }
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to continue',
      fallbackLabel: fallbackLabel || 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    })

    if (result.success) {
      return { success: true }
    }

    // Handle specific errors
    switch (result.error) {
      case 'user_cancel':
        return {
          success: false,
          error: 'Authentication cancelled',
          errorCode: 'USER_CANCEL',
        }
      case 'system_cancel':
        return {
          success: false,
          error: 'Authentication cancelled by system',
          errorCode: 'SYSTEM_CANCEL',
        }
      case 'not_enrolled':
        return {
          success: false,
          error: 'No biometrics enrolled',
          errorCode: 'NOT_ENROLLED',
        }
      case 'lockout':
        return {
          success: false,
          error: 'Too many attempts. Biometrics locked.',
          errorCode: 'LOCKOUT',
        }
      default:
        return {
          success: false,
          error: result.error || 'Authentication failed',
          errorCode: 'UNKNOWN',
        }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Authentication error',
      errorCode: 'ERROR',
    }
  }
}

/**
 * Authenticate for app unlock
 */
export async function authenticateForAppUnlock(): Promise<BiometricAuthResult> {
  const biometricType = await getPrimaryBiometricType()
  const typeName = getBiometricTypeName(biometricType)
  return authenticateWithBiometrics(`Unlock nChat with ${typeName}`, 'Use passcode')
}

/**
 * Authenticate for sensitive action
 */
export async function authenticateForSensitiveAction(
  actionDescription: string
): Promise<BiometricAuthResult> {
  return authenticateWithBiometrics(
    `Authenticate to ${actionDescription}`,
    'Use passcode'
  )
}

/**
 * Check security level
 */
export async function getSecurityLevel(): Promise<LocalAuthentication.SecurityLevel> {
  return LocalAuthentication.getEnrolledLevelAsync()
}
