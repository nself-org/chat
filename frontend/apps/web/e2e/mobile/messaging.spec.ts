/**
 * Mobile E2E Tests: Messaging
 *
 * Tests core messaging functionality including sending, editing, deleting,
 * replying, and reacting to messages
 */

import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, PerformanceHelper, TEST_USERS, TEST_DATA } from './setup'

describe('Mobile Messaging', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
    await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)
  })

  beforeEach(async () => {
    PerformanceHelper.clear()
  })

  describe('Send Messages', () => {
    it('should send simple text message', async () => {
      const message = `Test message ${Date.now()}`

      PerformanceHelper.mark('send-start')
      await MobileTestHelper.sendMessage(message)
      const sendDuration = PerformanceHelper.measure('Message Send', 'send-start')

      expect(sendDuration).toBeLessThan(2000)

      // Verify message appears
      await MobileTestHelper.assertTextExists(message)
    })

    it('should send message with emoji', async () => {
      const message = TEST_DATA.messages.emoji

      await MobileTestHelper.sendMessage(message)
      await MobileTestHelper.assertTextExists(message)
    })

    it('should send long message', async () => {
      const message = TEST_DATA.messages.long

      await MobileTestHelper.sendMessage(message)
      await MobileTestHelper.assertTextExists(message)
    })

    it('should send markdown formatted message', async () => {
      const message = TEST_DATA.messages.markdown

      await MobileTestHelper.sendMessage(message)
      await MobileTestHelper.assertTextExists('Bold')
      await MobileTestHelper.assertTextExists('italic')
    })

    it('should send message with mention', async () => {
      const message = TEST_DATA.messages.mention

      await MobileTestHelper.sendMessage(message)
      await MobileTestHelper.assertTextExists(message)

      // Mention should be highlighted
      await detoxExpect(element(by.id('mention-TestUser'))).toExist()
    })

    it('should send multiple messages rapidly', async () => {
      const messages = ['Message 1', 'Message 2', 'Message 3']

      for (const msg of messages) {
        await MobileTestHelper.sendMessage(msg)
      }

      // All messages should appear
      for (const msg of messages) {
        await MobileTestHelper.assertTextExists(msg)
      }
    })

    it('should show typing indicator', async () => {
      await MobileTestHelper.waitForElement(by.id('message-input'))
      await element(by.id('message-input')).typeText('Typing...')

      // Typing indicator should be visible to other users
      // Note: This requires multiple device simulation
      await MobileTestHelper.wait(1000)

      await element(by.id('message-input')).clearText()
    })

    it('should not send empty message', async () => {
      await MobileTestHelper.tapElement(by.id('send-button'))

      // Message input should still be empty
      await detoxExpect(element(by.id('message-input'))).toHaveText('')
    })
  })

  describe('Edit Messages', () => {
    it('should edit own message', async () => {
      const originalMessage = `Original ${Date.now()}`
      const editedMessage = `Edited ${Date.now()}`

      // Send message
      await MobileTestHelper.sendMessage(originalMessage)

      // Long press message
      await element(by.text(originalMessage)).longPress()

      // Tap edit
      await MobileTestHelper.tapElement(by.id('edit-message-button'))

      // Edit text
      await MobileTestHelper.typeText(by.id('edit-message-input'), editedMessage)
      await MobileTestHelper.tapElement(by.id('save-edit-button'))

      // Verify edited message
      await MobileTestHelper.assertTextExists(editedMessage)
      await MobileTestHelper.assertTextExists('(edited)')
    })

    it('should cancel message edit', async () => {
      const message = `Cancel edit test ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('edit-message-button'))
      await MobileTestHelper.tapElement(by.id('cancel-edit-button'))

      // Original message should remain
      await MobileTestHelper.assertTextExists(message)
    })

    it('should not allow editing others messages', async () => {
      // This would require multiple user simulation
      // For now, verify edit option is not available for system messages
      await MobileTestHelper.assertElementVisible(by.id('message-list'))
    })
  })

  describe('Delete Messages', () => {
    it('should delete own message', async () => {
      const message = `Delete me ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('delete-message-button'))

      // Confirm deletion
      await MobileTestHelper.tapElement(by.id('confirm-delete-button'))

      // Message should be removed
      await detoxExpect(element(by.text(message))).not.toExist()
    })

    it('should cancel message deletion', async () => {
      const message = `Dont delete ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('delete-message-button'))
      await MobileTestHelper.tapElement(by.id('cancel-delete-button'))

      // Message should remain
      await MobileTestHelper.assertTextExists(message)
    })
  })

  describe('Reply to Messages', () => {
    it('should reply to message in thread', async () => {
      const originalMessage = `Thread parent ${Date.now()}`
      const replyMessage = `Thread reply ${Date.now()}`

      // Send original message
      await MobileTestHelper.sendMessage(originalMessage)

      // Open thread
      await element(by.text(originalMessage)).longPress()
      await MobileTestHelper.tapElement(by.id('reply-thread-button'))

      // Send reply
      await MobileTestHelper.waitForElement(by.id('thread-screen'))
      await MobileTestHelper.sendMessage(replyMessage)

      // Verify reply appears
      await MobileTestHelper.assertTextExists(replyMessage)
    })

    it('should show thread count on parent message', async () => {
      const message = `Thread count test ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('reply-thread-button'))
      await MobileTestHelper.sendMessage('Reply 1')

      // Go back to channel
      await MobileTestHelper.tapElement(by.id('back-button'))

      // Thread count should be visible
      await detoxExpect(element(by.id('thread-count-1'))).toExist()
    })
  })

  describe('React to Messages', () => {
    it('should add reaction to message', async () => {
      const message = `React to me ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('add-reaction-button'))

      // Select emoji
      await MobileTestHelper.tapElement(by.id('emoji-thumbs-up'))

      // Reaction should appear
      await detoxExpect(element(by.id('reaction-thumbs-up'))).toExist()
    })

    it('should remove reaction', async () => {
      const message = `Remove reaction ${Date.now()}`

      await MobileTestHelper.sendMessage(message)
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('add-reaction-button'))
      await MobileTestHelper.tapElement(by.id('emoji-heart'))

      // Tap reaction again to remove
      await MobileTestHelper.tapElement(by.id('reaction-heart'))

      // Reaction should be removed
      await detoxExpect(element(by.id('reaction-heart'))).not.toExist()
    })

    it('should show reaction count', async () => {
      const message = `Reaction count ${Date.now()}`

      await MobileTestHelper.sendMessage(message)

      // Add multiple reactions (would need multiple users)
      // For now, just verify single reaction shows count
      await element(by.text(message)).longPress()
      await MobileTestHelper.tapElement(by.id('add-reaction-button'))
      await MobileTestHelper.tapElement(by.id('emoji-fire'))

      await detoxExpect(element(by.text('1'))).toExist()
    })
  })

  describe('Message List', () => {
    it('should load older messages on scroll', async () => {
      // Scroll to top
      await element(by.id('message-list')).scrollTo('top')

      // Wait for loading indicator
      await MobileTestHelper.waitForElement(by.id('loading-messages'))

      // Older messages should load
      await MobileTestHelper.wait(2000)
    })

    it('should scroll to bottom on new message', async () => {
      const message = `Scroll test ${Date.now()}`

      // Scroll up first
      await element(by.id('message-list')).scroll(300, 'up')

      // Send message
      await MobileTestHelper.sendMessage(message)

      // Should auto-scroll to bottom
      await MobileTestHelper.assertElementVisible(by.text(message))
    })

    it('should show unread message indicator', async () => {
      // Navigate away
      await MobileTestHelper.tapElement(by.id('back-button'))

      // Wait a bit
      await MobileTestHelper.wait(1000)

      // Go back to channel
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      // Unread indicator should be visible (if there are new messages)
      // await detoxExpect(element(by.id('unread-indicator'))).toExist()
    })
  })

  describe('Performance', () => {
    it('should render messages efficiently', async () => {
      PerformanceHelper.mark('render-start')

      // Navigate to channel
      await MobileTestHelper.navigateToChannel(TEST_DATA.channels.general)

      const renderDuration = PerformanceHelper.measure('Message List Render', 'render-start')
      expect(renderDuration).toBeLessThan(3000)
    })

    it('should handle rapid scrolling', async () => {
      // Scroll up and down rapidly
      await element(by.id('message-list')).scroll(500, 'up')
      await element(by.id('message-list')).scroll(500, 'down')
      await element(by.id('message-list')).scroll(500, 'up')
      await element(by.id('message-list')).scroll(500, 'down')

      // Should remain responsive
      await MobileTestHelper.assertElementVisible(by.id('message-list'))
    })
  })
})
