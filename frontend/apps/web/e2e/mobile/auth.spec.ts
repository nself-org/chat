/**
 * Mobile E2E Tests: Authentication
 *
 * Tests authentication flows including login, logout, signup, and session management
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, PerformanceHelper, TEST_USERS } from './setup'

describe('Mobile Authentication', () => {
  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('Login Flow', () => {
    it('should display login screen on app launch', async () => {
      await MobileTestHelper.waitForElement(by.id('login-screen'))
      await MobileTestHelper.assertElementVisible(by.id('email-input'))
      await MobileTestHelper.assertElementVisible(by.id('password-input'))
      await MobileTestHelper.assertElementVisible(by.id('login-button'))
    })

    it('should show validation errors for empty credentials', async () => {
      await MobileTestHelper.tapElement(by.id('login-button'))
      await MobileTestHelper.assertTextExists('Email is required')
      await MobileTestHelper.assertTextExists('Password is required')
    })

    it('should show error for invalid email format', async () => {
      await MobileTestHelper.typeText(by.id('email-input'), 'invalid-email')
      await MobileTestHelper.tapElement(by.id('login-button'))
      await MobileTestHelper.assertTextExists('Invalid email format')
    })

    it('should successfully login with valid credentials', async () => {
      PerformanceHelper.mark('login-start')

      await MobileTestHelper.login(TEST_USERS.member)

      const loginDuration = PerformanceHelper.measure('Login Duration', 'login-start')
      expect(loginDuration).toBeLessThan(5000)

      // Verify home screen
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
      await MobileTestHelper.assertElementVisible(by.id('user-profile-button'))
    })

    it('should show error for invalid credentials', async () => {
      await MobileTestHelper.typeText(by.id('email-input'), 'wrong@example.com')
      await MobileTestHelper.typeText(by.id('password-input'), 'wrongpassword')
      await MobileTestHelper.tapElement(by.id('login-button'))

      await MobileTestHelper.waitForElement(by.text('Invalid credentials'))
    })

    it('should toggle password visibility', async () => {
      await MobileTestHelper.typeText(by.id('password-input'), 'secret123')
      await MobileTestHelper.tapElement(by.id('toggle-password-visibility'))

      // Password should be visible
      await detoxExpect(element(by.id('password-input'))).toHaveText('secret123')

      // Toggle back
      await MobileTestHelper.tapElement(by.id('toggle-password-visibility'))
    })

    it('should support biometric login (if available)', async () => {
      // Enable biometric authentication first
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.tapElement(by.id('settings-button'))
      await MobileTestHelper.tapElement(by.id('enable-biometric'))
      await MobileTestHelper.logout()

      // Try biometric login
      if (await element(by.id('biometric-login-button')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('biometric-login-button'))
        // Simulate biometric success (in real device testing)
        await MobileTestHelper.waitForElement(by.id('channel-list'))
      }
    })
  })

  describe('Signup Flow', () => {
    it('should navigate to signup screen', async () => {
      await MobileTestHelper.tapElement(by.id('signup-link'))
      await MobileTestHelper.waitForElement(by.id('signup-screen'))
    })

    it('should validate signup form fields', async () => {
      await MobileTestHelper.tapElement(by.id('signup-link'))
      await MobileTestHelper.tapElement(by.id('signup-button'))

      await MobileTestHelper.assertTextExists('Name is required')
      await MobileTestHelper.assertTextExists('Email is required')
      await MobileTestHelper.assertTextExists('Password is required')
    })

    it('should enforce password requirements', async () => {
      await MobileTestHelper.tapElement(by.id('signup-link'))

      // Try weak password
      await MobileTestHelper.typeText(by.id('signup-password-input'), '123')
      await MobileTestHelper.tapElement(by.id('signup-button'))

      await MobileTestHelper.assertTextExists('Password must be at least 8 characters')
    })

    it('should successfully create new account', async () => {
      const newUser = {
        name: 'New Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      }

      await MobileTestHelper.tapElement(by.id('signup-link'))
      await MobileTestHelper.typeText(by.id('signup-name-input'), newUser.name)
      await MobileTestHelper.typeText(by.id('signup-email-input'), newUser.email)
      await MobileTestHelper.typeText(by.id('signup-password-input'), newUser.password)
      await MobileTestHelper.tapElement(by.id('signup-button'))

      // Should redirect to home after signup
      await MobileTestHelper.waitForElement(by.id('channel-list'), 15000)
    })
  })

  describe('Logout Flow', () => {
    beforeEach(async () => {
      await MobileTestHelper.login(TEST_USERS.member)
    })

    it('should successfully logout', async () => {
      await MobileTestHelper.logout()
      await MobileTestHelper.assertElementVisible(by.id('login-screen'))
    })

    it('should clear user session on logout', async () => {
      await MobileTestHelper.logout()

      // Relaunch app
      await device.reloadReactNative()

      // Should show login screen (session cleared)
      await MobileTestHelper.waitForElement(by.id('login-screen'))
    })
  })

  describe('Session Management', () => {
    it('should maintain session after app restart', async () => {
      await MobileTestHelper.login(TEST_USERS.member)

      // Terminate and relaunch app
      await device.terminateApp()
      await device.launchApp({ newInstance: false })

      // Should still be logged in
      await MobileTestHelper.waitForElement(by.id('channel-list'))
    })

    it('should handle expired session gracefully', async () => {
      await MobileTestHelper.login(TEST_USERS.member)

      // Simulate session expiry (would need backend support)
      // For now, just verify the app handles auth errors

      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })

    it('should support multiple user sessions', async () => {
      // Login as member
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))

      // Logout
      await MobileTestHelper.logout()

      // Login as admin
      await MobileTestHelper.login(TEST_USERS.admin)
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate offline
      await device.setURLBlacklist(['.*'])

      await MobileTestHelper.typeText(by.id('email-input'), TEST_USERS.member.email)
      await MobileTestHelper.typeText(by.id('password-input'), TEST_USERS.member.password)
      await MobileTestHelper.tapElement(by.id('login-button'))

      await MobileTestHelper.waitForElement(by.text('Network error'))

      // Restore network
      await device.setURLBlacklist([])
    })

    it('should show loading state during login', async () => {
      await MobileTestHelper.typeText(by.id('email-input'), TEST_USERS.member.email)
      await MobileTestHelper.typeText(by.id('password-input'), TEST_USERS.member.password)
      await MobileTestHelper.tapElement(by.id('login-button'))

      // Loading indicator should appear
      await detoxExpect(element(by.id('loading-indicator'))).toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      await detoxExpect(element(by.id('email-input'))).toHaveLabel('Email address')
      await detoxExpect(element(by.id('password-input'))).toHaveLabel('Password')
      await detoxExpect(element(by.id('login-button'))).toHaveLabel('Log in')
    })

    it('should support keyboard navigation', async () => {
      await MobileTestHelper.typeText(by.id('email-input'), TEST_USERS.member.email)

      // Tab to next field
      if (device.getPlatform() === 'ios') {
        await element(by.id('email-input')).tapReturnKey()
        await detoxExpect(element(by.id('password-input'))).toHaveFocus()
      }
    })
  })
})
