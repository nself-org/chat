/**
 * Biometric Authentication Hook
 *
 * React hook for biometric authentication (Face ID, Touch ID, fingerprint)
 */

import { useState, useEffect, useCallback } from 'react'
import { BiometryType } from '@aparajita/capacitor-biometric-auth'
import { mobileAuth, biometricHelpers } from '../adapters/auth'

/**
 * Biometric authentication state
 */
export interface BiometricState {
  available: boolean
  type: BiometryType | null
  error: string | null
  loading: boolean
}

/**
 * Use biometric authentication
 *
 * @example
 * ```typescript
 * function LoginScreen() {
 *   const { available, type, authenticate, loading } = useBiometric()
 *
 *   if (available) {
 *     return (
 *       <button onClick={authenticate} disabled={loading}>
 *         Unlock with {biometricHelpers.getBiometricTypeName(type)}
 *       </button>
 *     )
 *   }
 * }
 * ```
 */
export function useBiometric() {
  const [state, setState] = useState<BiometricState>({
    available: false,
    type: null,
    error: null,
    loading: true,
  })

  // Check biometric availability on mount
  useEffect(() => {
    checkAvailability()
  }, [])

  const checkAvailability = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))

    const result = await mobileAuth.checkBiometric()

    setState({
      available: result.available,
      type: result.type,
      error: result.error || null,
      loading: false,
    })
  }, [])

  const authenticate = useCallback(
    async (options?: { reason?: string; title?: string }) => {
      if (!state.available) {
        return false
      }

      setState((prev) => ({ ...prev, loading: true }))

      try {
        const success = await mobileAuth.authenticateBiometric(options)
        setState((prev) => ({ ...prev, loading: false }))
        return success
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        }))
        return false
      }
    },
    [state.available]
  )

  return {
    ...state,
    authenticate,
    refresh: checkAvailability,
    typeName: biometricHelpers.getBiometricTypeName(state.type),
    isStrongBiometric: biometricHelpers.hasStrongBiometric(state.type),
  }
}
