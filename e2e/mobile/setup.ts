/**
 * Mobile E2E Test Setup
 *
 * Global setup and utilities for Detox mobile testing
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

// Test user credentials
export const TEST_USERS = {
  owner: {
    email: 'owner@nself.org',
    password: 'password123',
    displayName: 'Test Owner',
  },
  admin: {
    email: 'admin@nself.org',
    password: 'password123',
    displayName: 'Test Admin',
  },
  member: {
    email: 'member@nself.org',
    password: 'password123',
    displayName: 'Test Member',
  },
}

// Test data
export const TEST_DATA = {
  channels: {
    general: 'general',
    random: 'random',
    test: 'e2e-test-channel',
  },
  messages: {
    simple: 'Hello, world!',
    long: 'This is a longer message with multiple words that should wrap across lines and test the message rendering system.',
    emoji: 'Hello 👋 World 🌍',
    markdown: '**Bold** and *italic* text with `code`',
    mention: '@TestUser how are you?',
  },
}

/**
 * Helper class for common mobile test actions
 */
export class MobileTestHelper {
  /**
   * Wait for element with retry logic
   */
  static async waitForElement(matcher: Detox.NativeMatcher, timeout = 10000) {
    await waitFor(element(matcher)).toBeVisible().withTimeout(timeout)
  }

  /**
   * Tap element with wait
   */
  static async tapElement(matcher: Detox.NativeMatcher, timeout = 10000) {
    await this.waitForElement(matcher, timeout)
    await element(matcher).tap()
  }

  /**
   * Type text into input
   */
  static async typeText(matcher: Detox.NativeMatcher, text: string, timeout = 10000) {
    await this.waitForElement(matcher, timeout)
    await element(matcher).clearText()
    await element(matcher).typeText(text)

    // Hide keyboard on iOS
    if (device.getPlatform() === 'ios') {
      await element(matcher).tapReturnKey()
    }
  }

  /**
   * Scroll to element
   */
  static async scrollToElement(
    scrollMatcher: Detox.NativeMatcher,
    elementMatcher: Detox.NativeMatcher,
    direction: 'up' | 'down' = 'down',
    distance = 200
  ) {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollMatcher)
      .scroll(distance, direction)
  }

  /**
   * Login to app
   */
  static async login(user = TEST_USERS.member) {
    // Wait for login screen
    await this.waitForElement(by.id('email-input'), 15000)

    // Enter credentials
    await this.typeText(by.id('email-input'), user.email)
    await this.typeText(by.id('password-input'), user.password)

    // Submit
    await this.tapElement(by.id('login-button'))

    // Wait for home screen
    await this.waitForElement(by.id('channel-list'), 15000)
  }

  /**
   * Logout from app
   */
  static async logout() {
    // Open settings
    await this.tapElement(by.id('settings-button'))

    // Tap logout
    await this.tapElement(by.id('logout-button'))

    // Wait for login screen
    await this.waitForElement(by.id('email-input'), 10000)
  }

  /**
   * Navigate to channel
   */
  static async navigateToChannel(channelName: string) {
    // Wait for channel list
    await this.waitForElement(by.id('channel-list'))

    // Find and tap channel
    await this.tapElement(by.id(`channel-${channelName}`))

    // Wait for message list
    await this.waitForElement(by.id('message-list'))
  }

  /**
   * Send message
   */
  static async sendMessage(text: string) {
    // Wait for message input
    await this.waitForElement(by.id('message-input'))

    // Type message
    await this.typeText(by.id('message-input'), text)

    // Send
    await this.tapElement(by.id('send-button'))

    // Wait for message to appear
    await this.waitForElement(by.text(text), 5000)
  }

  /**
   * Take screenshot
   */
  static async screenshot(name: string) {
    await device.takeScreenshot(name)
  }

  /**
   * Reload app
   */
  static async reloadApp() {
    await device.reloadReactNative()
  }

  /**
   * Launch app with permissions
   */
  static async launchWithPermissions(permissions: Record<string, string> = {}) {
    await device.launchApp({
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        photos: 'YES',
        ...permissions,
      },
      newInstance: true,
    })
  }

  /**
   * Simulate network condition
   */
  static async setNetworkCondition(condition: 'wifi' | '3g' | 'offline') {
    if (device.getPlatform() === 'ios') {
      // iOS network conditioning
      await device.setURLBlacklist(condition === 'offline' ? ['.*'] : [])
    } else {
      // Android network conditioning
      // Note: Requires additional setup with Android emulator
      console.warn('Network conditioning not fully supported on Android')
    }
  }

  /**
   * Wait for time (use sparingly)
   */
  static async wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Assert element exists
   */
  static async assertElementExists(matcher: Detox.NativeMatcher) {
    await detoxExpect(element(matcher)).toExist()
  }

  /**
   * Assert element visible
   */
  static async assertElementVisible(matcher: Detox.NativeMatcher) {
    await detoxExpect(element(matcher)).toBeVisible()
  }

  /**
   * Assert text exists
   */
  static async assertTextExists(text: string) {
    await detoxExpect(element(by.text(text))).toExist()
  }
}

/**
 * Performance measurement helper
 */
export class PerformanceHelper {
  private static marks: Map<string, number> = new Map()

  static mark(name: string) {
    this.marks.set(name, Date.now())
  }

  static measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`)
    }
    const duration = Date.now() - start
    console.log(`[Performance] ${name}: ${duration}ms`)
    return duration
  }

  static clear() {
    this.marks.clear()
  }
}

/**
 * Network testing helper
 */
export class NetworkHelper {
  /**
   * Simulate slow network (3G)
   */
  static async simulate3G() {
    await MobileTestHelper.setNetworkCondition('3g')
  }

  /**
   * Simulate offline mode
   */
  static async simulateOffline() {
    await MobileTestHelper.setNetworkCondition('offline')
  }

  /**
   * Restore normal network
   */
  static async restoreNetwork() {
    await MobileTestHelper.setNetworkCondition('wifi')
  }
}

// Global test lifecycle hooks
beforeAll(async () => {
  console.log('🚀 Starting mobile E2E tests...')
  console.log(`Platform: ${device.getPlatform()}`)

  // Launch app
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  })
})

beforeEach(async () => {
  // Clear performance marks
  PerformanceHelper.clear()
})

afterEach(async function () {
  // Take screenshot on failure
  if (this.currentTest?.state === 'failed') {
    const testName = this.currentTest.title.replace(/\s+/g, '-')
    await MobileTestHelper.screenshot(`FAIL-${testName}`)
  }
})

afterAll(async () => {
  console.log('✅ Mobile E2E tests completed')
})
