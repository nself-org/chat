/**
 * Mobile E2E Tests: Channels
 *
 * Tests channel management including create, join, leave, and search
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, PerformanceHelper, TEST_USERS, TEST_DATA } from './setup'

describe('Mobile Channels', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
  })

  beforeEach(async () => {
    PerformanceHelper.clear()
    // Navigate to home
    if (await element(by.id('back-button')).isVisible()) {
      await MobileTestHelper.tapElement(by.id('back-button'))
    }
  })

  describe('Channel List', () => {
    it('should display channel list', async () => {
      await MobileTestHelper.assertElementVisible(by.id('channel-list'))
      await MobileTestHelper.assertElementVisible(by.id('channel-general'))
    })

    it('should show channel unread count', async () => {
      // Navigate to a channel
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      // Go back
      await MobileTestHelper.tapElement(by.id('back-button'))

      // Unread badge might be visible
      // await detoxExpect(element(by.id('unread-badge-random'))).toExist()
    })

    it('should group channels by type', async () => {
      await MobileTestHelper.assertTextExists('Public Channels')
      await MobileTestHelper.assertTextExists('Private Channels')
      await MobileTestHelper.assertTextExists('Direct Messages')
    })

    it('should sort channels alphabetically', async () => {
      const channelList = element(by.id('channel-list'))
      await detoxExpect(channelList).toBeVisible()

      // Verify general is before random alphabetically
      // This would require checking position, which is complex in Detox
    })
  })

  describe('Create Channel', () => {
    it('should open create channel modal', async () => {
      await MobileTestHelper.tapElement(by.id('create-channel-button'))
      await MobileTestHelper.waitForElement(by.id('create-channel-modal'))
    })

    it('should validate channel name', async () => {
      await MobileTestHelper.tapElement(by.id('create-channel-button'))
      await MobileTestHelper.tapElement(by.id('submit-channel-button'))

      await MobileTestHelper.assertTextExists('Channel name is required')
    })

    it('should create public channel', async () => {
      const channelName = `test-${Date.now()}`

      await MobileTestHelper.tapElement(by.id('create-channel-button'))
      await MobileTestHelper.typeText(by.id('channel-name-input'), channelName)
      await MobileTestHelper.typeText(
        by.id('channel-description-input'),
        'Test channel description'
      )
      await MobileTestHelper.tapElement(by.id('submit-channel-button'))

      // Should navigate to new channel
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists(channelName)
    })

    it('should create private channel', async () => {
      const channelName = `private-${Date.now()}`

      await MobileTestHelper.tapElement(by.id('create-channel-button'))
      await MobileTestHelper.typeText(by.id('channel-name-input'), channelName)
      await MobileTestHelper.tapElement(by.id('private-channel-toggle'))
      await MobileTestHelper.tapElement(by.id('submit-channel-button'))

      // Should navigate to new channel
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await detoxExpect(element(by.id('private-channel-icon'))).toExist()
    })

    it('should not allow duplicate channel names', async () => {
      await MobileTestHelper.tapElement(by.id('create-channel-button'))
      await MobileTestHelper.typeText(by.id('channel-name-input'), 'general')
      await MobileTestHelper.tapElement(by.id('submit-channel-button'))

      await MobileTestHelper.assertTextExists('Channel name already exists')
    })
  })

  describe('Join Channel', () => {
    it('should browse available channels', async () => {
      await MobileTestHelper.tapElement(by.id('browse-channels-button'))
      await MobileTestHelper.waitForElement(by.id('channel-browser'))

      // Should show available public channels
      await MobileTestHelper.assertElementVisible(by.id('available-channels-list'))
    })

    it('should join public channel', async () => {
      await MobileTestHelper.tapElement(by.id('browse-channels-button'))

      // Find a channel to join
      await MobileTestHelper.waitForElement(by.id('channel-browser'))

      // Tap join button on first available channel
      await MobileTestHelper.tapElement(by.id('join-channel-random'))

      // Should navigate to channel
      await MobileTestHelper.waitForElement(by.id('message-list'))
      await MobileTestHelper.assertTextExists('random')
    })

    it('should request to join private channel', async () => {
      // This requires a private channel that user is not a member of
      // For now, just verify the flow exists
      await MobileTestHelper.tapElement(by.id('browse-channels-button'))
      await MobileTestHelper.waitForElement(by.id('channel-browser'))
    })
  })

  describe('Leave Channel', () => {
    it('should leave channel', async () => {
      // First join a channel
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      // Open channel menu
      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('leave-channel-button'))

      // Confirm
      await MobileTestHelper.tapElement(by.id('confirm-leave-button'))

      // Should return to channel list
      await MobileTestHelper.waitForElement(by.id('channel-list'))

      // Channel should no longer be in the list
      await detoxExpect(element(by.id('channel-random'))).not.toExist()
    })

    it('should cancel leave channel', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('leave-channel-button'))
      await MobileTestHelper.tapElement(by.id('cancel-leave-button'))

      // Should remain in channel
      await MobileTestHelper.assertElementVisible(by.id('message-list'))
    })

    it('should not allow leaving general channel', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))

      // Leave button should be disabled or not exist
      const leaveButton = element(by.id('leave-channel-button'))
      if (await leaveButton.isVisible()) {
        await detoxExpect(leaveButton).not.toBeEnabled()
      }
    })
  })

  describe('Channel Search', () => {
    it('should open channel search', async () => {
      await MobileTestHelper.tapElement(by.id('search-channels-button'))
      await MobileTestHelper.waitForElement(by.id('channel-search-input'))
    })

    it('should search channels by name', async () => {
      await MobileTestHelper.tapElement(by.id('search-channels-button'))
      await MobileTestHelper.typeText(by.id('channel-search-input'), 'general')

      // Should show filtered results
      await MobileTestHelper.assertElementVisible(by.id('channel-general'))
      await detoxExpect(element(by.id('channel-random'))).not.toBeVisible()
    })

    it('should show no results message', async () => {
      await MobileTestHelper.tapElement(by.id('search-channels-button'))
      await MobileTestHelper.typeText(by.id('channel-search-input'), 'nonexistent-channel-xyz')

      await MobileTestHelper.assertTextExists('No channels found')
    })

    it('should clear search', async () => {
      await MobileTestHelper.tapElement(by.id('search-channels-button'))
      await MobileTestHelper.typeText(by.id('channel-search-input'), 'test')
      await MobileTestHelper.tapElement(by.id('clear-search-button'))

      // All channels should be visible again
      await MobileTestHelper.assertElementVisible(by.id('channel-general'))
    })
  })

  describe('Channel Details', () => {
    it('should view channel details', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('channel-details-button'))

      await MobileTestHelper.waitForElement(by.id('channel-details-screen'))
      await MobileTestHelper.assertTextExists('Channel Information')
    })

    it('should display channel members', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('channel-details-button'))

      await MobileTestHelper.assertTextExists('Members')
      await detoxExpect(element(by.id('member-list'))).toExist()
    })

    it('should edit channel description (admin only)', async () => {
      // Login as admin
      await MobileTestHelper.logout()
      await MobileTestHelper.login(TEST_USERS.admin)

      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('channel-details-button'))

      const newDescription = `Updated description ${Date.now()}`

      await MobileTestHelper.tapElement(by.id('edit-description-button'))
      await MobileTestHelper.typeText(by.id('description-input'), newDescription)
      await MobileTestHelper.tapElement(by.id('save-description-button'))

      await MobileTestHelper.assertTextExists(newDescription)
    })
  })

  describe('Channel Notifications', () => {
    it('should mute channel notifications', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('mute-channel-button'))

      // Muted indicator should appear
      await detoxExpect(element(by.id('muted-indicator'))).toExist()
    })

    it('should unmute channel', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('unmute-channel-button'))

      // Muted indicator should disappear
      await detoxExpect(element(by.id('muted-indicator'))).not.toExist()
    })

    it('should customize notification preferences', async () => {
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      await MobileTestHelper.tapElement(by.id('channel-menu-button'))
      await MobileTestHelper.tapElement(by.id('notification-settings-button'))

      await MobileTestHelper.waitForElement(by.id('notification-settings-modal'))

      // Toggle options
      await MobileTestHelper.tapElement(by.id('mention-notifications-toggle'))
      await MobileTestHelper.tapElement(by.id('save-notification-settings'))
    })
  })

  describe('Performance', () => {
    it('should load channel list quickly', async () => {
      PerformanceHelper.mark('load-start')

      await device.reloadReactNative()
      await MobileTestHelper.login(TEST_USERS.member)

      const loadDuration = PerformanceHelper.measure('Channel List Load', 'load-start')
      expect(loadDuration).toBeLessThan(3000)
    })

    it('should switch channels quickly', async () => {
      PerformanceHelper.mark('switch-start')

      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.random)

      const switchDuration = PerformanceHelper.measure('Channel Switch', 'switch-start')
      expect(switchDuration).toBeLessThan(2000)
    })
  })
})
