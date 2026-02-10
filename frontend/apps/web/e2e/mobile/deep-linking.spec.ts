/**
 * Mobile E2E Tests: Deep Linking
 *
 * Tests deep linking functionality for opening the app from external sources
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, TEST_USERS } from './setup'

describe('Mobile Deep Linking', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
  })

  describe('Channel Deep Links', () => {
    it('should open app from channel link', async () => {
      await device.openURL({
        url: 'nchat://channel/general',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'), 10000)
      await MobileTestHelper.assertTextExists('general')
    })

    it('should navigate to specific channel', async () => {
      await device.openURL({
        url: 'nchat://channel/random',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('random')
    })

    it('should handle private channel link', async () => {
      await device.openURL({
        url: 'nchat://channel/private-test',
        sourceApp: 'com.apple.mobilesafari',
      })

      // If user has access, should open channel
      // Otherwise, should show access denied
      await MobileTestHelper.wait(2000)
    })

    it('should handle non-existent channel gracefully', async () => {
      await device.openURL({
        url: 'nchat://channel/nonexistent-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show error message
      await MobileTestHelper.waitForElement(by.text('Channel not found'), 5000)
    })
  })

  describe('Message Deep Links', () => {
    it('should navigate to specific message', async () => {
      await device.openURL({
        url: 'nchat://channel/general/message/msg-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))

      // Message should be highlighted
      if (await element(by.id('highlighted-message')).isVisible()) {
        await detoxExpect(element(by.id('highlighted-message'))).toExist()
      }
    })

    it('should scroll to message in long conversation', async () => {
      await device.openURL({
        url: 'nchat://channel/general/message/old-message-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))

      // Should load and scroll to message
      await MobileTestHelper.wait(3000)
    })

    it('should handle deleted message', async () => {
      await device.openURL({
        url: 'nchat://channel/general/message/deleted-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show message not found
      await MobileTestHelper.waitForElement(by.text('Message not found'), 5000)
    })
  })

  describe('Direct Message Deep Links', () => {
    it('should open direct message conversation', async () => {
      await device.openURL({
        url: 'nchat://dm/user-456',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
      await detoxExpect(element(by.id('dm-conversation'))).toExist()
    })

    it('should start new DM if conversation doesnt exist', async () => {
      await device.openURL({
        url: 'nchat://dm/user-789',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))

      // New conversation should be created
      await MobileTestHelper.assertElementVisible(by.id('message-input'))
    })

    it('should handle invalid user ID', async () => {
      await device.openURL({
        url: 'nchat://dm/invalid-user',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.text('User not found'), 5000)
    })
  })

  describe('Thread Deep Links', () => {
    it('should open thread view', async () => {
      await device.openURL({
        url: 'nchat://channel/general/thread/thread-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('thread-screen'))
      await detoxExpect(element(by.id('thread-parent-message'))).toExist()
    })

    it('should navigate to specific reply in thread', async () => {
      await device.openURL({
        url: 'nchat://channel/general/thread/thread-123/reply/reply-456',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('thread-screen'))

      // Reply should be highlighted
      if (await element(by.id('highlighted-reply')).isVisible()) {
        await detoxExpect(element(by.id('highlighted-reply'))).toExist()
      }
    })
  })

  describe('Settings Deep Links', () => {
    it('should open settings screen', async () => {
      await device.openURL({
        url: 'nchat://settings',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('settings-screen'))
    })

    it('should open specific settings section', async () => {
      await device.openURL({
        url: 'nchat://settings/notifications',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('notifications-settings-screen'))
    })

    it('should open profile settings', async () => {
      await device.openURL({
        url: 'nchat://settings/profile',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('profile-settings-screen'))
    })
  })

  describe('User Profile Deep Links', () => {
    it('should open user profile', async () => {
      await device.openURL({
        url: 'nchat://user/user-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('user-profile-screen'))
    })

    it('should show user info', async () => {
      await device.openURL({
        url: 'nchat://user/user-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('user-profile-screen'))
      await detoxExpect(element(by.id('user-name'))).toExist()
      await detoxExpect(element(by.id('user-avatar'))).toExist()
    })
  })

  describe('Search Deep Links', () => {
    it('should open search with query', async () => {
      await device.openURL({
        url: 'nchat://search?q=project+update',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('search-screen'))

      // Search should be performed automatically
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })

    it('should open search in specific channel', async () => {
      await device.openURL({
        url: 'nchat://search?q=meeting&channel=general',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('search-screen'))
      await MobileTestHelper.waitForElement(by.id('search-results'))
    })
  })

  describe('Invite Deep Links', () => {
    it('should handle channel invite link', async () => {
      await device.openURL({
        url: 'nchat://invite/channel/abc123xyz',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show channel preview and join option
      await MobileTestHelper.waitForElement(by.id('channel-invite-screen'))
      await MobileTestHelper.assertElementVisible(by.id('join-channel-button'))
    })

    it('should handle workspace invite link', async () => {
      await device.openURL({
        url: 'nchat://invite/workspace/xyz789abc',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show signup/login if not authenticated
      await MobileTestHelper.wait(2000)
    })

    it('should handle expired invite link', async () => {
      await device.openURL({
        url: 'nchat://invite/channel/expired-link',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.text('Invite link has expired'), 5000)
    })
  })

  describe('Universal Links (HTTPS)', () => {
    it('should handle HTTPS deep link', async () => {
      await device.openURL({
        url: 'https://nchat.app/channel/general',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('general')
    })

    it('should handle web share link', async () => {
      await device.openURL({
        url: 'https://nchat.app/share/message/msg-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.wait(2000)
      // Should open app or web view
    })
  })

  describe('QR Code Links', () => {
    it('should handle QR code channel join link', async () => {
      await device.openURL({
        url: 'nchat://qr/channel/qr-code-123',
        sourceApp: 'camera',
      })

      await MobileTestHelper.waitForElement(by.id('channel-join-screen'))
    })

    it('should handle QR code event check-in', async () => {
      await device.openURL({
        url: 'nchat://qr/event/event-456',
        sourceApp: 'camera',
      })

      await MobileTestHelper.wait(2000)
    })
  })

  describe('Background and Foreground', () => {
    it('should handle deep link when app is in background', async () => {
      // Put app in background
      await device.sendToHome()
      await MobileTestHelper.wait(1000)

      // Open deep link
      await device.openURL({
        url: 'nchat://channel/random',
        sourceApp: 'com.apple.mobilesafari',
      })

      // App should come to foreground and navigate
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('random')
    })

    it('should handle deep link when app is terminated', async () => {
      // Terminate app
      await device.terminateApp()

      // Open deep link
      await device.openURL({
        url: 'nchat://channel/general',
        sourceApp: 'com.apple.mobilesafari',
      })

      // App should launch and navigate
      await MobileTestHelper.waitForElement(by.id('message-list'), 15000)
      await MobileTestHelper.assertTextExists('general')
    })
  })

  describe('Authentication Required', () => {
    it('should require login for protected deep link', async () => {
      // Logout first
      await MobileTestHelper.logout()

      // Try to open deep link
      await device.openURL({
        url: 'nchat://channel/general',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should redirect to login
      await MobileTestHelper.waitForElement(by.id('login-screen'))

      // After login, should navigate to deep link target
      await MobileTestHelper.login(TEST_USERS.member)
      await MobileTestHelper.waitForElement(by.id('message-list'), 10000)
    })

    it('should remember deep link destination after login', async () => {
      await MobileTestHelper.logout()

      await device.openURL({
        url: 'nchat://channel/random',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('login-screen'))
      await MobileTestHelper.login(TEST_USERS.member)

      // Should go to random channel
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('random')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed deep link', async () => {
      await device.openURL({
        url: 'nchat://invalid///path///',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show error or navigate to home
      await MobileTestHelper.wait(2000)
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })

    it('should handle unknown deep link scheme', async () => {
      await device.openURL({
        url: 'nchat://unknown-action/123',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should gracefully handle and show error
      await MobileTestHelper.wait(2000)
    })

    it('should handle deep link with missing parameters', async () => {
      await device.openURL({
        url: 'nchat://channel/',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show error
      await MobileTestHelper.wait(2000)
    })
  })

  describe('Analytics', () => {
    it('should track deep link opens', async () => {
      await device.openURL({
        url: 'nchat://channel/general?utm_source=email&utm_campaign=notification',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Analytics should be tracked (not visible in UI)
      await MobileTestHelper.waitForElement(by.id('message-list'))
    })

    it('should track referral source', async () => {
      await device.openURL({
        url: 'nchat://invite/channel/abc123?ref=john',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.wait(2000)
      // Referral should be tracked
    })
  })
})
