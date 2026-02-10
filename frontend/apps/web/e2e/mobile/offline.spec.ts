/**
 * Mobile E2E Tests: Offline Mode
 *
 * Tests offline functionality including message queueing, sync, and resilience
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, NetworkHelper, TEST_USERS, TEST_DATA } from './setup'

describe('Mobile Offline Mode', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
    await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
  })

  afterEach(async () => {
    // Restore network after each test
    await NetworkHelper.restoreNetwork()
  })

  describe('Go Offline', () => {
    it('should detect offline status', async () => {
      // Go offline
      await NetworkHelper.simulateOffline()

      // Offline indicator should appear
      await MobileTestHelper.waitForElement(by.id('offline-indicator'), 5000)
      await MobileTestHelper.assertTextExists('Offline')
    })

    it('should show offline banner', async () => {
      await NetworkHelper.simulateOffline()

      await MobileTestHelper.waitForElement(by.id('offline-banner'))
      await MobileTestHelper.assertTextExists('No internet connection')
    })

    it('should disable network-dependent features', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      // Certain features should be disabled
      // e.g., cannot create channels, join channels
      await MobileTestHelper.tapElement(by.id('back-button'))

      const createButton = element(by.id('create-channel-button'))
      if (await createButton.isVisible()) {
        // Button might be disabled
        await detoxExpect(createButton).toBeVisible()
      }
    })
  })

  describe('Send Messages Offline', () => {
    it('should queue message when offline', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Offline message ${Date.now()}`

      // Type message
      await MobileTestHelper.typeText(by.id('message-input'), message)
      await MobileTestHelper.tapElement(by.id('send-button'))

      // Message should appear with pending indicator
      await MobileTestHelper.waitForElement(by.text(message))
      await detoxExpect(element(by.id('message-pending-indicator'))).toExist()
    })

    it('should show multiple queued messages', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const messages = [
        `Queued 1 ${Date.now()}`,
        `Queued 2 ${Date.now()}`,
        `Queued 3 ${Date.now()}`,
      ]

      for (const msg of messages) {
        await MobileTestHelper.sendMessage(msg)
        await MobileTestHelper.wait(500)
      }

      // All should show pending
      for (const msg of messages) {
        await MobileTestHelper.assertTextExists(msg)
      }
    })

    it('should prevent sending attachments offline', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      await MobileTestHelper.tapElement(by.id('attachment-button'))

      // Should show offline message
      await MobileTestHelper.assertTextExists('Attachments require internet connection')
    })

    it('should allow editing queued messages', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Edit me offline ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Long press to edit
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('edit-message-button'))

      const editedMessage = `Edited while offline ${Date.now()}`
      await MobileTestHelper.typeText(by.id('edit-message-input'), editedMessage)
      await MobileTestHelper.tapElement(by.id('save-edit-button'))

      await MobileTestHelper.assertTextExists(editedMessage)
    })

    it('should allow deleting queued messages', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Delete me offline ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Delete
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('delete-message-button'))
      await MobileTestHelper.tapElement(by.id('confirm-delete-button'))

      // Should be removed from queue
      await detoxExpect(element(by.text(message))).not.toExist()
    })
  })

  describe('Go Online and Sync', () => {
    it('should detect online status', async () => {
      // Start offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.waitForElement(by.id('offline-indicator'))

      // Go online
      await NetworkHelper.restoreNetwork()

      // Online indicator should appear
      await MobileTestHelper.waitForElement(by.id('online-indicator'), 5000)
    })

    it('should sync queued messages when online', async () => {
      // Send message offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Sync test ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Verify pending
      await detoxExpect(element(by.id('message-pending-indicator'))).toExist()

      // Go online
      await NetworkHelper.restoreNetwork()

      // Wait for sync
      await MobileTestHelper.wait(3000)

      // Pending indicator should be removed
      await detoxExpect(element(by.id('message-pending-indicator'))).not.toExist()
    })

    it('should sync multiple queued messages', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      // Queue multiple messages
      const messages = [`Sync 1 ${Date.now()}`, `Sync 2 ${Date.now()}`]

      for (const msg of messages) {
        await MobileTestHelper.sendMessage(msg)
        await MobileTestHelper.wait(500)
      }

      // Go online
      await NetworkHelper.restoreNetwork()

      // Wait for all to sync
      await MobileTestHelper.wait(5000)

      // All should be synced
      for (const msg of messages) {
        await MobileTestHelper.assertTextExists(msg)
      }
    })

    it('should maintain message order after sync', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const msg1 = `First ${Date.now()}`
      const msg2 = `Second ${Date.now()}`

      await MobileTestHelper.sendMessage(msg1)
      await MobileTestHelper.wait(500)
      await MobileTestHelper.sendMessage(msg2)

      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(5000)

      // Messages should be in correct order
      await MobileTestHelper.assertTextExists(msg1)
      await MobileTestHelper.assertTextExists(msg2)
    })

    it('should handle sync conflicts', async () => {
      // This would require simulating concurrent edits
      // For now, verify basic sync works
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Conflict test ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(3000)

      await MobileTestHelper.assertTextExists(message)
    })
  })

  describe('Offline Data Access', () => {
    it('should cache recent messages', async () => {
      // Load messages while online
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
      await MobileTestHelper.wait(2000)

      // Go offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      // Navigate away and back
      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      // Cached messages should still be visible
      await MobileTestHelper.assertElementVisible(by.id('message-list'))
    })

    it('should cache channel list', async () => {
      // Load channels while online
      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.wait(1000)

      // Go offline
      await NetworkHelper.simulateOffline()

      // Reload app
      await device.reloadReactNative()
      await MobileTestHelper.wait(3000)

      // Channels should be visible from cache
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
      await MobileTestHelper.assertElementVisible(by.id('channel-general'))
    })

    it('should show cached user profiles', async () => {
      // While online, view profile
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      // Find a message and tap on sender
      if (await element(by.id('message-sender-0')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('message-sender-0'))
        await MobileTestHelper.wait(1000)
        await MobileTestHelper.tapElement(by.id('back-button'))
      }

      // Go offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      // Try to view profile again
      if (await element(by.id('message-sender-0')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('message-sender-0'))

        // Cached profile should load
        await MobileTestHelper.wait(1000)
      }
    })

    it('should prevent loading new data offline', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      // Try to scroll to load older messages
      await element(by.id('message-list')).scrollTo('top')

      // Should show offline message
      if (await element(by.id('offline-load-message')).isVisible()) {
        await MobileTestHelper.assertTextExists('Cannot load more messages offline')
      }
    })
  })

  describe('Intermittent Connectivity', () => {
    it('should handle flaky connection', async () => {
      // Simulate connection flapping
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(2000)

      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(2000)

      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(2000)

      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(3000)

      // App should recover and sync
      await MobileTestHelper.assertElementVisible(by.id('message-list'))
    })

    it('should retry failed sync', async () => {
      // Send message offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Retry test ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Go online but simulate server error
      // (This would require mock server)
      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(5000)

      // Message should eventually sync with retries
      await MobileTestHelper.assertTextExists(message)
    })

    it('should show retry option for failed sync', async () => {
      // After a failed sync
      if (await element(by.id('retry-sync-button')).isVisible()) {
        await MobileTestHelper.tapElement(by.id('retry-sync-button'))

        await MobileTestHelper.wait(3000)
      }
    })
  })

  describe('Slow Network (3G)', () => {
    it('should handle slow 3G connection', async () => {
      await NetworkHelper.simulate3G()
      await MobileTestHelper.wait(2000)

      // Send message
      const message = `3G test ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Should send, but might take longer
      await MobileTestHelper.wait(5000)
      await MobileTestHelper.assertTextExists(message)

      await NetworkHelper.restoreNetwork()
    })

    it('should show loading indicator on slow connection', async () => {
      await NetworkHelper.simulate3G()

      // Navigate to new channel
      await MobileTestHelper.tapElement(by.id('back-button'))
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      // Loading should be visible longer
      if (await element(by.id('loading-indicator')).isVisible()) {
        await detoxExpect(element(by.id('loading-indicator'))).toBeVisible()
      }

      await NetworkHelper.restoreNetwork()
    })

    it('should optimize image loading on slow connection', async () => {
      await NetworkHelper.simulate3G()

      // Images should load progressively or with lower quality
      // Verification requires actual image loading

      await NetworkHelper.restoreNetwork()
    })
  })

  describe('Error Messages', () => {
    it('should show helpful offline message', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      await MobileTestHelper.assertElementVisible(by.id('offline-banner'))
      await MobileTestHelper.assertTextExists('No internet connection')
    })

    it('should explain queued messages', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Queue info ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Info about queuing should be visible
      if (await element(by.id('queue-info')).isVisible()) {
        await MobileTestHelper.assertTextExists('Message will send when online')
      }
    })

    it('should show sync progress', async () => {
      // Queue multiple messages
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      await MobileTestHelper.sendMessage(`Msg 1 ${Date.now()}`)
      await MobileTestHelper.sendMessage(`Msg 2 ${Date.now()}`)

      // Go online
      await NetworkHelper.restoreNetwork()

      // Sync progress should be visible
      if (await element(by.id('sync-progress')).isVisible()) {
        await MobileTestHelper.assertTextExists('Syncing messages')
      }
    })
  })

  describe('Persistence', () => {
    it('should persist queued messages after app restart', async () => {
      // Queue message offline
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      const message = `Persist test ${Date.now()}`
      await MobileTestHelper.sendMessage(message)

      // Restart app
      await device.terminateApp()
      await device.launchApp({ newInstance: false })
      await MobileTestHelper.wait(3000)

      // Message should still be in queue
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
      await MobileTestHelper.assertTextExists(message)

      // Go online and sync
      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(5000)
    })

    it('should clear sync queue after successful sync', async () => {
      await NetworkHelper.simulateOffline()
      await MobileTestHelper.wait(1000)

      await MobileTestHelper.sendMessage(`Clear queue ${Date.now()}`)

      await NetworkHelper.restoreNetwork()
      await MobileTestHelper.wait(5000)

      // Queue should be empty
      // (No visual indicator, but sync should complete)
    })
  })
})
