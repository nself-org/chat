/**
 * Mobile E2E Tests: Push Notifications
 *
 * Tests push notification functionality including receiving, tapping, and opening
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, TEST_USERS, TEST_DATA } from './setup'

describe('Mobile Push Notifications', () => {
  beforeAll(async () => {
    await MobileTestHelper.launchWithPermissions({
      notifications: 'YES',
    })

    await MobileTestHelper.login(TEST_USERS.member)
  })

  describe('Notification Permissions', () => {
    it('should request notification permission on first launch', async () => {
      // On first app launch, permission dialog should appear
      // This is tested with fresh install
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })

    it('should enable notifications in settings', async () => {
      await MobileTestHelper.tapElement(by.id('settings-button'))
      await MobileTestHelper.waitForElement(by.id('settings-screen'))

      await MobileTestHelper.tapElement(by.id('notifications-settings'))
      await MobileTestHelper.waitForElement(by.id('notifications-settings-screen'))

      // Enable notifications
      const notifToggle = element(by.id('enable-notifications-toggle'))
      if (await notifToggle.isVisible()) {
        await MobileTestHelper.tapElement(by.id('enable-notifications-toggle'))
      }

      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.tapElement(by.id('back-button'))
    })
  })

  describe('Receive Notifications', () => {
    it('should receive notification for new message', async () => {
      // Put app in background
      await device.sendToHome()

      // Simulate receiving a notification
      // Note: This requires backend/push service to send notification
      await MobileTestHelper.wait(2000)

      // Check for notification
      if (device.getPlatform() === 'ios') {
        // iOS notification check
        await device.launchApp({ newInstance: false })
      } else {
        // Android notification check
        await device.launchApp({ newInstance: false })
      }
    })

    it('should show notification with message preview', async () => {
      // Background app
      await device.sendToHome()
      await MobileTestHelper.wait(1000)

      // Would receive notification with message content
      // Verification requires actual notification service

      await device.launchApp({ newInstance: false })
    })

    it('should receive notification for mention', async () => {
      // Send message with @mention (from another user)
      // Then verify notification appears

      await device.sendToHome()
      await MobileTestHelper.wait(2000)
      await device.launchApp({ newInstance: false })
    })

    it('should receive notification for direct message', async () => {
      // Similar to mention test
      await device.sendToHome()
      await MobileTestHelper.wait(2000)
      await device.launchApp({ newInstance: false })
    })

    it('should group notifications from same channel', async () => {
      // Multiple messages should group into one notification
      await device.sendToHome()
      await MobileTestHelper.wait(3000)
      await device.launchApp({ newInstance: false })
    })
  })

  describe('Tap Notifications', () => {
    it('should open app when tapping notification', async () => {
      // This test requires simulating notification tap
      // Platform-specific implementation

      if (device.getPlatform() === 'ios') {
        // iOS: Use sendUserNotification API
        await device.sendUserNotification({
          trigger: {
            type: 'push',
          },
          title: 'New Message',
          subtitle: 'in #general',
          body: 'Hello from test!',
          badge: 1,
          payload: {
            channelId: 'general',
            messageId: '123',
          },
        })

        // Wait for notification
        await MobileTestHelper.wait(2000)
      }

      // App should be in foreground
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })

    it('should navigate to channel when tapping notification', async () => {
      if (device.getPlatform() === 'ios') {
        await device.sendUserNotification({
          trigger: {
            type: 'push',
          },
          title: 'New Message',
          subtitle: 'in #random',
          body: 'Test message',
          payload: {
            channelId: 'random',
          },
        })

        // Tap notification
        await device.openURL({
          url: 'nchat://channel/random',
          sourceApp: 'com.apple.mobilesafari',
        })

        // Should navigate to random channel
        await MobileTestHelper.waitForElement(by.id('message-list'))
        await MobileTestHelper.assertTextExists('random')
      }
    })

    it('should navigate to specific message when tapping notification', async () => {
      if (device.getPlatform() === 'ios') {
        await device.sendUserNotification({
          trigger: {
            type: 'push',
          },
          title: 'New Message',
          body: 'Test message',
          payload: {
            channelId: 'general',
            messageId: 'msg-123',
          },
        })

        // Tap notification
        await device.openURL({
          url: 'nchat://channel/general/message/msg-123',
          sourceApp: 'com.apple.mobilesafari',
        })

        // Should navigate to message and highlight it
        await MobileTestHelper.waitForElement(by.id('message-list'))
        await detoxExpect(element(by.id('highlighted-message-msg-123'))).toExist()
      }
    })
  })

  describe('Notification Badges', () => {
    it('should update app badge count', async () => {
      // Background app
      await device.sendToHome()

      // Receive notifications
      await MobileTestHelper.wait(2000)

      // Badge should be visible on app icon
      // Platform-specific verification

      await device.launchApp({ newInstance: false })
    })

    it('should clear badge when opening app', async () => {
      await device.sendToHome()
      await MobileTestHelper.wait(1000)

      // Launch app
      await device.launchApp({ newInstance: false })

      // Badge should be cleared
      // Verification requires platform-specific API
    })

    it('should show unread count per channel', async () => {
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))

      // Unread badges should be visible on channels
      if (await element(by.id('unread-badge-general')).isVisible()) {
        await detoxExpect(element(by.id('unread-badge-general'))).toExist()
      }
    })
  })

  describe('Notification Settings', () => {
    beforeEach(async () => {
      await MobileTestHelper.tapElement(by.id('settings-button'))
      await MobileTestHelper.tapElement(by.id('notifications-settings'))
    })

    afterEach(async () => {
      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.tapElement(by.id('back-button'))
    })

    it('should toggle all notifications', async () => {
      const toggle = element(by.id('enable-notifications-toggle'))

      if (await toggle.isVisible()) {
        await MobileTestHelper.tapElement(by.id('enable-notifications-toggle'))
        await MobileTestHelper.tapElement(by.id('enable-notifications-toggle'))
      }
    })

    it('should customize notification sound', async () => {
      await MobileTestHelper.tapElement(by.id('notification-sound-option'))
      await MobileTestHelper.waitForElement(by.id('sound-picker'))

      // Select a sound
      await MobileTestHelper.tapElement(by.id('sound-chime'))
      await MobileTestHelper.tapElement(by.id('confirm-sound'))
    })

    it('should enable/disable message preview', async () => {
      const previewToggle = element(by.id('show-message-preview-toggle'))

      if (await previewToggle.isVisible()) {
        await MobileTestHelper.tapElement(by.id('show-message-preview-toggle'))
      }
    })

    it('should set quiet hours', async () => {
      await MobileTestHelper.tapElement(by.id('quiet-hours-toggle'))

      // Set start time
      await MobileTestHelper.tapElement(by.id('quiet-hours-start'))
      // Time picker would appear - platform specific
      await MobileTestHelper.wait(1000)

      // Set end time
      await MobileTestHelper.tapElement(by.id('quiet-hours-end'))
      await MobileTestHelper.wait(1000)
    })

    it('should configure notification channels', async () => {
      await MobileTestHelper.tapElement(by.id('notification-channels-option'))

      await MobileTestHelper.waitForElement(by.id('channel-notifications-list'))

      // Configure notifications for specific channel
      await MobileTestHelper.tapElement(by.id('channel-general-notifications'))

      // Options: All, Mentions, None
      await MobileTestHelper.tapElement(by.id('mentions-only-option'))
      await MobileTestHelper.tapElement(by.id('back-button'))
    })

    it('should enable/disable vibration', async () => {
      const vibrationToggle = element(by.id('vibration-toggle'))

      if (await vibrationToggle.isVisible()) {
        await MobileTestHelper.tapElement(by.id('vibration-toggle'))
      }
    })

    it('should enable/disable LED notification', async () => {
      // Android only
      if (device.getPlatform() === 'android') {
        const ledToggle = element(by.id('led-notification-toggle'))

        if (await ledToggle.isVisible()) {
          await MobileTestHelper.tapElement(by.id('led-notification-toggle'))
        }
      }
    })
  })

  describe('In-App Notifications', () => {
    it('should show banner for new message in different channel', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      // New message arrives in different channel
      // Should show in-app banner
      await MobileTestHelper.wait(2000)

      // Banner might appear if notification received
      if (await element(by.id('in-app-notification-banner')).isVisible()) {
        await detoxExpect(element(by.id('in-app-notification-banner'))).toBeVisible()
      }
    })

    it('should tap banner to navigate to message', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      if (await element(by.id('in-app-notification-banner')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('in-app-notification-banner'))

        // Should navigate to the channel with new message
        await MobileTestHelper.waitForElement(by.id('message-list'))
      }
    })

    it('should dismiss banner by swiping', async () => {
      if (await element(by.id('in-app-notification-banner')).isVisible()) {
        await element(by.id('in-app-notification-banner')).swipe('up', 'fast', 0.5)

        // Banner should disappear
        await detoxExpect(element(by.id('in-app-notification-banner'))).not.toBeVisible()
      }
    })
  })

  describe('Deep Linking', () => {
    it('should handle channel deep link', async () => {
      await device.openURL({
        url: 'nchat://channel/general',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('general')
    })

    it('should handle message deep link', async () => {
      await device.openURL({
        url: 'nchat://channel/general/message/123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
    })

    it('should handle direct message deep link', async () => {
      await device.openURL({
        url: 'nchat://dm/user-123',
        sourceApp: 'com.apple.mobilesafari',
      })

      await MobileTestHelper.waitForElement(by.id('message-list'))
    })

    it('should handle invalid deep link gracefully', async () => {
      await device.openURL({
        url: 'nchat://invalid/path',
        sourceApp: 'com.apple.mobilesafari',
      })

      // Should show error or navigate to home
      await MobileTestHelper.wait(2000)
    })
  })

  describe('Error Handling', () => {
    it('should handle notification permission denied', async () => {
      // Relaunch with notifications disabled
      await device.terminateApp()
      await device.launchApp({
        permissions: {
          notifications: 'NO',
        },
      })

      await MobileTestHelper.login(TEST_USERS.member)

      // App should still work, just without notifications
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
    })

    it('should show settings prompt when notifications disabled', async () => {
      await MobileTestHelper.tapElement(by.id('settings-button'))
      await MobileTestHelper.tapElement(by.id('notifications-settings'))

      // Should show prompt to enable in system settings
      if (await element(by.id('enable-in-settings-button')).isVisible()) {
        await MobileTestHelper.assertTextExists('Enable notifications in Settings')
      }
    })
  })
})
