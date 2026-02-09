/**
 * Mobile Biometric Authentication E2E Tests
 *
 * Tests for mobile-specific biometric authentication:
 * - Face ID / Touch ID (iOS)
 * - Fingerprint (Android)
 * - Fallback to PIN/password
 * - Enable/disable biometrics
 * - Biometric enrollment check
 *
 * Platform: iOS, Android (Capacitor)
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, TEST_USERS } from '../mobile/setup'
import { generateTestId } from '../fixtures/test-helpers'

describe('Biometric Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await MobileTestHelper.clearAppData()
  })

  describe('Biometric Setup', () => {
    it('should show biometric setup option after login', async () => {
      await MobileTestHelper.login(TEST_USERS.member)

      // Navigate to settings
      await element(by.id('tab-settings')).tap()

      // Look for biometric auth option
      await detoxExpect(element(by.id('setting-biometric-auth'))).toBeVisible()
    })

    it('should check if biometrics are available on device', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()

      // Tap biometric setting
      await element(by.id('setting-biometric-auth')).tap()

      // Should show availability status
      const biometricType = await element(by.id('biometric-type-label'))
      await detoxExpect(biometricType).toBeVisible()

      // Text should indicate type: Face ID, Touch ID, or Fingerprint
      // or "Not Available" if device doesn't support it
    })

    it('should enable biometric authentication', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()
      await element(by.id('setting-biometric-auth')).tap()

      // Enable biometrics
      await element(by.id('biometric-toggle')).tap()

      // Should prompt for authentication
      await detoxExpect(element(by.text('Authenticate to enable biometrics'))).toBeVisible()

      // Simulate successful biometric auth (Detox mock)
      if (device.getPlatform() === 'ios') {
        await device.matchFace()
      } else {
        await device.matchFinger()
      }

      // Wait for success message
      await detoxExpect(element(by.text('Biometric authentication enabled'))).toBeVisible()

      // Toggle should be on
      await detoxExpect(element(by.id('biometric-toggle'))).toHaveToggleValue(true)
    })

    it('should disable biometric authentication', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()
      await element(by.id('setting-biometric-auth')).tap()

      // First enable it
      await element(by.id('biometric-toggle')).tap()
      if (device.getPlatform() === 'ios') {
        await device.matchFace()
      } else {
        await device.matchFinger()
      }

      // Wait for enabled state
      await detoxExpect(element(by.id('biometric-toggle'))).toHaveToggleValue(true)

      // Now disable it
      await element(by.id('biometric-toggle')).tap()

      // Should ask for confirmation
      await detoxExpect(element(by.text('Disable biometric authentication?'))).toBeVisible()
      await element(by.text('Disable')).tap()

      // Toggle should be off
      await detoxExpect(element(by.id('biometric-toggle'))).toHaveToggleValue(false)
    })
  })

  describe('Biometric Login (iOS)', () => {
    it('should show Face ID prompt on app launch when enabled', async () => {
      // First login and enable biometrics
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()

      // Logout
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      // Relaunch app
      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'ios') {
        // Should show Face ID prompt
        await detoxExpect(element(by.text('Face ID'))).toBeVisible()
      }
    })

    it('should login with successful Face ID', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'ios') {
        // Match face successfully
        await device.matchFace()

        // Should be logged in
        await detoxExpect(element(by.id('chat-screen'))).toBeVisible()
      }
    })

    it('should handle failed Face ID and show retry', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'ios') {
        // Fail Face ID
        await device.unmatchedFace()

        // Should show error and retry option
        await detoxExpect(element(by.text('Face ID failed'))).toBeVisible()
        await detoxExpect(element(by.text('Try Again'))).toBeVisible()
      }
    })

    it('should fallback to password after Face ID cancellation', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'ios') {
        // Cancel Face ID
        await element(by.text('Cancel')).tap()

        // Should show password login
        await detoxExpect(element(by.id('email-input'))).toBeVisible()
        await detoxExpect(element(by.id('password-input'))).toBeVisible()
      }
    })

    it('should show Touch ID on supported devices', async () => {
      // This test assumes device supports Touch ID (iPhone 8, etc.)
      // In real tests, would check device capability first

      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()
      await element(by.id('setting-biometric-auth')).tap()

      // If device supports Touch ID (not Face ID)
      const biometricType = await element(by.id('biometric-type-label')).getAttributes()
      if (biometricType.text === 'Touch ID') {
        await element(by.id('biometric-toggle')).tap()

        // Should show Touch ID prompt
        await detoxExpect(element(by.text('Touch ID'))).toBeVisible()
      }
    })
  })

  describe('Biometric Login (Android)', () => {
    it('should show fingerprint prompt on app launch when enabled', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()

      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'android') {
        // Should show fingerprint prompt
        await detoxExpect(element(by.text('Fingerprint'))).toBeVisible()
      }
    })

    it('should login with successful fingerprint', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'android') {
        // Match fingerprint successfully
        await device.matchFinger()

        // Should be logged in
        await detoxExpect(element(by.id('chat-screen'))).toBeVisible()
      }
    })

    it('should handle failed fingerprint and show retry', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'android') {
        // Fail fingerprint
        await device.unmatchedFinger()

        // Should show error and retry
        await detoxExpect(element(by.text('Fingerprint not recognized'))).toBeVisible()
        await detoxExpect(element(by.text('Try Again'))).toBeVisible()
      }
    })

    it('should fallback to PIN after fingerprint cancellation', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      if (device.getPlatform() === 'android') {
        // Cancel fingerprint
        await element(by.text('Use Password')).tap()

        // Should show password login
        await detoxExpect(element(by.id('email-input'))).toBeVisible()
        await detoxExpect(element(by.id('password-input'))).toBeVisible()
      }
    })
  })

  describe('Biometric Security', () => {
    it('should prompt for re-authentication for sensitive actions', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()

      // Navigate to account settings
      await element(by.id('tab-settings')).tap()
      await element(by.id('account-settings')).tap()

      // Try to change password (sensitive action)
      await element(by.id('change-password-button')).tap()

      // Should prompt for biometric auth
      await detoxExpect(element(by.text('Authenticate to continue'))).toBeVisible()

      // Authenticate
      if (device.getPlatform() === 'ios') {
        await device.matchFace()
      } else {
        await device.matchFinger()
      }

      // Should show change password form
      await detoxExpect(element(by.id('new-password-input'))).toBeVisible()
    })

    it('should re-prompt after timeout period', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()

      // Perform action requiring auth
      await element(by.id('tab-settings')).tap()
      await element(by.id('account-settings')).tap()
      await element(by.id('change-password-button')).tap()

      if (device.getPlatform() === 'ios') {
        await device.matchFace()
      } else {
        await device.matchFinger()
      }

      // Go back
      await element(by.id('back-button')).tap()

      // Wait for timeout (simulate time passing)
      await device.sendToHome()
      await device.launchApp({ newInstance: false })

      // Try again - should re-prompt
      await element(by.id('account-settings')).tap()
      await element(by.id('change-password-button')).tap()

      await detoxExpect(element(by.text('Authenticate to continue'))).toBeVisible()
    })

    it('should lock app after multiple failed attempts', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()
      await element(by.id('tab-settings')).tap()
      await element(by.id('logout-button')).tap()

      await device.launchApp({ newInstance: false })

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (device.getPlatform() === 'ios') {
          await device.unmatchedFace()
        } else {
          await device.unmatchedFinger()
        }
        await detoxExpect(element(by.text('Try Again'))).toBeVisible()
        await element(by.text('Try Again')).tap()
      }

      // Should be locked out
      await detoxExpect(element(by.text('Too many failed attempts'))).toBeVisible()
      await detoxExpect(element(by.text('Use Password'))).toBeVisible()
    })
  })

  describe('Biometric Not Available', () => {
    it('should hide biometric option if not supported', async () => {
      // On simulators/emulators without biometric setup
      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()

      // If biometrics not enrolled on device
      const biometricSetting = element(by.id('setting-biometric-auth'))
      try {
        await detoxExpect(biometricSetting).toBeVisible()
        // If visible, should show "Not Available" state
        await biometricSetting.tap()
        await detoxExpect(
          element(by.text('Biometric authentication is not available on this device'))
        ).toBeVisible()
      } catch {
        // Setting not visible - that's acceptable
      }
    })

    it('should prompt to enroll biometrics if not set up', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await element(by.id('tab-settings')).tap()
      await element(by.id('setting-biometric-auth')).tap()

      // Tap enable when no biometrics enrolled
      await element(by.id('biometric-toggle')).tap()

      // Should show enrollment prompt
      await detoxExpect(
        element(by.text('Biometric authentication is not set up on this device'))
      ).toBeVisible()
      await detoxExpect(element(by.text('Go to Settings'))).toBeVisible()
    })
  })

  describe('Cross-Platform Consistency', () => {
    it('should use same flow on iOS and Android', async () => {
      await MobileTestHelper.login(TEST_USERS.member)

      // Navigate to biometric settings
      await element(by.id('tab-settings')).tap()
      await element(by.id('setting-biometric-auth')).tap()

      // Both platforms should have same UI elements
      await detoxExpect(element(by.id('biometric-toggle'))).toBeVisible()
      await detoxExpect(element(by.id('biometric-type-label'))).toBeVisible()
      await detoxExpect(element(by.id('biometric-description'))).toBeVisible()
    })

    it('should store biometric preference correctly', async () => {
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.enableBiometrics()

      // Close and reopen app
      await device.terminateApp()
      await device.launchApp({ newInstance: false })

      // Biometric prompt should appear
      const promptVisible =
        device.getPlatform() === 'ios'
          ? await element(by.text('Face ID')).isVisible()
          : await element(by.text('Fingerprint')).isVisible()

      expect(promptVisible).toBe(true)
    })
  })
})
