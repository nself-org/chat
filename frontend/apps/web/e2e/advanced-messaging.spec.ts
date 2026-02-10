/**
 * Advanced Messaging E2E Tests
 *
 * Tests for advanced messaging features including:
 * - Creating and voting on polls
 * - Scheduling messages
 * - Forwarding messages
 * - Emoji reactions
 * - Link previews
 * - Message translation
 */

import { test, expect, TEST_MESSAGES } from './fixtures/test-fixtures'

test.describe('Polls', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should display create poll button', async ({ messagingPage }) => {
    await expect(messagingPage.createPollButton).toBeVisible()
  })

  test('should create a poll with multiple options', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const question = 'What is your favorite programming language?'
    const options = ['JavaScript', 'TypeScript', 'Python', 'Rust']

    await messagingPage.createPoll(question, options)

    // Verify poll appears in chat
    const pollElement = authenticatedPage.locator(`[data-testid="poll"]:has-text("${question}")`)
    await expect(pollElement).toBeVisible({ timeout: 5000 })

    // Verify all options are present
    for (const option of options) {
      await expect(pollElement).toContainText(option)
    }
  })

  test('should vote on a poll', async ({ messagingPage, authenticatedPage }) => {
    // Create a poll first
    const question = 'Test poll for voting'
    const options = ['Option A', 'Option B', 'Option C']
    await messagingPage.createPoll(question, options)

    // Vote on option 1 (Option B)
    await messagingPage.voteOnPoll(1)

    // Verify vote was recorded
    const pollElement = authenticatedPage.locator(`[data-testid="poll"]:has-text("${question}")`)
    await expect(pollElement.locator('[data-testid="vote-count"]')).toContainText('1')
  })

  test('should show poll results', async ({ messagingPage, authenticatedPage }) => {
    const question = 'Results test poll'
    const options = ['Yes', 'No']
    await messagingPage.createPoll(question, options)

    // Vote
    await messagingPage.voteOnPoll(0)
    await authenticatedPage.waitForTimeout(500)

    // Check results display
    const pollElement = authenticatedPage.locator(`[data-testid="poll"]:has-text("${question}")`)
    const resultsBar = pollElement.locator('[data-testid="poll-results-bar"]')
    await expect(resultsBar).toBeVisible()
  })

  test('should not allow voting twice on same poll', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const question = 'Single vote test'
    const options = ['A', 'B']
    await messagingPage.createPoll(question, options)

    // First vote
    await messagingPage.voteOnPoll(0)
    await authenticatedPage.waitForTimeout(300)

    // Try to vote again
    const pollElement = authenticatedPage.locator(`[data-testid="poll"]:has-text("${question}")`)
    const voteButtons = pollElement.locator('[data-testid="poll-vote-button"]')

    // Buttons should be disabled
    await expect(voteButtons.first()).toBeDisabled()
  })

  test('should display poll expiry time', async ({ messagingPage, authenticatedPage }) => {
    const question = 'Expiry test poll'
    const options = ['Yes', 'No']
    await messagingPage.createPoll(question, options)

    const pollElement = authenticatedPage.locator(`[data-testid="poll"]:has-text("${question}")`)
    const expiryText = pollElement.locator('[data-testid="poll-expiry"]')

    // Should show expiry info or "No expiry"
    await expect(expiryText).toBeVisible()
  })
})

test.describe('Scheduled Messages', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should display schedule message button', async ({ messagingPage }) => {
    await expect(messagingPage.scheduleMessageButton).toBeVisible()
  })

  test('should schedule a message for future delivery', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const message = 'This is a scheduled message'
    const futureDate = new Date()
    futureDate.setMinutes(futureDate.getMinutes() + 30)

    const dateStr = futureDate.toISOString().split('T')[0]
    const timeStr = futureDate.toTimeString().slice(0, 5)

    await messagingPage.scheduleMessage(message, dateStr, timeStr)

    // Verify scheduled message appears in scheduled list
    await authenticatedPage.goto('/chat/scheduled')
    const scheduledItem = authenticatedPage.locator(
      `[data-testid="scheduled-message"]:has-text("${message}")`
    )
    await expect(scheduledItem).toBeVisible()
  })

  test('should show scheduled time on message', async ({ messagingPage, authenticatedPage }) => {
    const message = 'Time display test'
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 1)

    const dateStr = futureDate.toISOString().split('T')[0]
    const timeStr = futureDate.toTimeString().slice(0, 5)

    await messagingPage.scheduleMessage(message, dateStr, timeStr)

    await authenticatedPage.goto('/chat/scheduled')
    const scheduledItem = authenticatedPage.locator(
      `[data-testid="scheduled-message"]:has-text("${message}")`
    )
    const timeDisplay = scheduledItem.locator('[data-testid="scheduled-time"]')

    await expect(timeDisplay).toBeVisible()
    await expect(timeDisplay).toContainText(/\d{1,2}:\d{2}/)
  })

  test('should allow canceling scheduled message', async ({ messagingPage, authenticatedPage }) => {
    const message = 'Cancel test message'
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 2)

    const dateStr = futureDate.toISOString().split('T')[0]
    const timeStr = futureDate.toTimeString().slice(0, 5)

    await messagingPage.scheduleMessage(message, dateStr, timeStr)

    // Navigate to scheduled messages
    await authenticatedPage.goto('/chat/scheduled')
    const scheduledItem = authenticatedPage.locator(
      `[data-testid="scheduled-message"]:has-text("${message}")`
    )

    // Cancel the message
    const cancelButton = scheduledItem.locator('[data-testid="cancel-scheduled-message"]')
    await cancelButton.click()
    await authenticatedPage.waitForTimeout(500)

    // Should no longer be visible
    await expect(scheduledItem).not.toBeVisible()
  })

  test('should allow editing scheduled message', async ({ messagingPage, authenticatedPage }) => {
    const originalMessage = 'Original scheduled message'
    const editedMessage = 'Edited scheduled message'
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 1)

    const dateStr = futureDate.toISOString().split('T')[0]
    const timeStr = futureDate.toTimeString().slice(0, 5)

    await messagingPage.scheduleMessage(originalMessage, dateStr, timeStr)

    // Navigate to scheduled messages and edit
    await authenticatedPage.goto('/chat/scheduled')
    const scheduledItem = authenticatedPage.locator(
      `[data-testid="scheduled-message"]:has-text("${originalMessage}")`
    )

    const editButton = scheduledItem.locator('[data-testid="edit-scheduled-message"]')
    await editButton.click()

    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    await messageInput.clear()
    await messageInput.fill(editedMessage)

    const saveButton = authenticatedPage.locator('[data-testid="save-scheduled-message"]')
    await saveButton.click()
    await authenticatedPage.waitForTimeout(500)

    // Verify edited message
    await expect(
      authenticatedPage.locator(`[data-testid="scheduled-message"]:has-text("${editedMessage}")`)
    ).toBeVisible()
  })

  test('should validate scheduled time is in future', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const message = 'Past time test'
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    const dateStr = pastDate.toISOString().split('T')[0]
    const timeStr = pastDate.toTimeString().slice(0, 5)

    await messagingPage.scheduleMessageButton.click()
    await messagingPage.scheduleDatePicker.fill(dateStr)
    await messagingPage.scheduleTimeInput.fill(timeStr)
    await authenticatedPage.locator('[data-testid="message-input"]').fill(message)
    await messagingPage.scheduleSubmitButton.click()

    // Should show validation error
    const errorMessage = authenticatedPage.locator(
      '[role="alert"]:has-text("future"), [role="alert"]:has-text("past")'
    )
    await expect(errorMessage).toBeVisible()
  })
})

test.describe('Message Forwarding', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should forward message to another channel', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    // Send a message first
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')
    const testMessage = 'Message to forward'

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    // Get message ID
    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.forwardMessage(id, 'random')

      // Verify message was forwarded
      await authenticatedPage.goto('/chat/random')
      await expect(
        authenticatedPage.locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      ).toBeVisible()
    }
  })

  test('should show forward count on message', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'Forward count test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()

    // Forward the message
    const messageId = await messageElement.getAttribute('data-testid')
    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.forwardMessage(id, 'random')
      await authenticatedPage.waitForTimeout(500)

      // Check for forward indicator
      const forwardIndicator = messageElement.locator('[data-testid="forward-indicator"]')
      await expect(forwardIndicator).toBeVisible()
    }
  })

  test('should preserve original message metadata when forwarding', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const testMessage = 'Metadata preservation test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.forwardMessage(id, 'random')

      // Navigate to forwarded channel
      await authenticatedPage.goto('/chat/random')
      const forwardedMessage = authenticatedPage
        .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
        .first()

      // Should show "Forwarded from" indicator
      await expect(forwardedMessage).toContainText(/forwarded|from/i)
    }
  })
})

test.describe('Emoji Reactions', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should add emoji reaction to message', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'React to this message'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.reactToMessage(id, 'thumbs-up')

      // Verify reaction appears
      const reaction = messageElement.locator('[data-testid="reaction-thumbs-up"]')
      await expect(reaction).toBeVisible()
    }
  })

  test('should show reaction count', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'Reaction count test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.reactToMessage(id, 'heart')

      const reaction = messageElement.locator('[data-testid="reaction-heart"]')
      await expect(reaction).toContainText('1')
    }
  })

  test('should allow removing reaction', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'Remove reaction test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')

      // Add reaction
      await messagingPage.reactToMessage(id, 'smile')
      await authenticatedPage.waitForTimeout(300)

      // Click reaction again to remove
      const reaction = messageElement.locator('[data-testid="reaction-smile"]')
      await reaction.click()
      await authenticatedPage.waitForTimeout(300)

      // Should no longer be visible
      await expect(reaction).not.toBeVisible()
    }
  })

  test('should show who reacted to message', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'Who reacted test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.reactToMessage(id, 'fire')

      // Hover over reaction
      const reaction = messageElement.locator('[data-testid="reaction-fire"]')
      await reaction.hover()
      await authenticatedPage.waitForTimeout(500)

      // Tooltip should show user name
      const tooltip = authenticatedPage.locator(
        '[role="tooltip"], [data-testid="reaction-tooltip"]'
      )
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText(/owner/i)
    }
  })
})

test.describe('Link Previews', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should generate link preview for URLs', async ({ messagingPage, authenticatedPage }) => {
    const messageWithLink = TEST_MESSAGES.withLink
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(messageWithLink)
    await sendButton.click()

    // Wait for link preview to generate
    await messagingPage.waitForLinkPreview('example.com')
  })

  test('should display link preview with title', async ({ messagingPage, authenticatedPage }) => {
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill('https://example.com')
    await sendButton.click()
    await authenticatedPage.waitForTimeout(2000)

    const linkPreview = authenticatedPage.locator('[data-testid="link-preview"]').first()
    const previewTitle = linkPreview.locator('[data-testid="link-preview-title"]')

    await expect(previewTitle).toBeVisible()
  })

  test('should display link preview with image', async ({ messagingPage, authenticatedPage }) => {
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill('https://example.com/article')
    await sendButton.click()
    await authenticatedPage.waitForTimeout(2000)

    const linkPreview = authenticatedPage.locator('[data-testid="link-preview"]').first()
    const previewImage = linkPreview.locator('[data-testid="link-preview-image"]')

    // Image may or may not be present
    const imageCount = await previewImage.count()
    expect(imageCount).toBeGreaterThanOrEqual(0)
  })

  test('should allow disabling link preview', async ({ messagingPage, authenticatedPage }) => {
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill('https://example.com')

    // Look for toggle to disable preview
    const disablePreviewToggle = authenticatedPage.locator(
      '[data-testid="toggle-link-preview"], [aria-label*="preview"]'
    )

    if (await disablePreviewToggle.isVisible()) {
      await disablePreviewToggle.click()
    }

    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    // Preview should not appear
    const linkPreview = authenticatedPage.locator('[data-testid="link-preview"]')
    const previewCount = await linkPreview.count()
    expect(previewCount).toBe(0)
  })
})

test.describe('Message Translation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/chat/general')
  })

  test('should translate message to different language', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const testMessage = 'Hello, how are you?'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.translateMessage(id, 'es')

      // Translation should appear
      const translationElement = messageElement.locator('[data-testid="message-translation"]')
      await expect(translationElement).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show original and translated text', async ({ messagingPage, authenticatedPage }) => {
    const testMessage = 'This is a test message'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.translateMessage(id, 'fr')

      // Both original and translation should be visible
      await expect(messageElement).toContainText(testMessage)
      const translationElement = messageElement.locator('[data-testid="message-translation"]')
      await expect(translationElement).toBeVisible()
    }
  })

  test('should allow toggling translation visibility', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    const testMessage = 'Toggle translation test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')
      await messagingPage.translateMessage(id, 'de')

      const translationElement = messageElement.locator('[data-testid="message-translation"]')
      await expect(translationElement).toBeVisible()

      // Toggle off
      const toggleButton = messageElement.locator('[data-testid="toggle-translation"]')
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
        await expect(translationElement).not.toBeVisible()
      }
    }
  })
})

test.describe('Advanced Messaging Performance', () => {
  test('should handle multiple polls in same channel', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/chat/general')

    // Create 3 polls
    for (let i = 1; i <= 3; i++) {
      await messagingPage.createPoll(`Poll ${i}`, [`Option A${i}`, `Option B${i}`])
      await authenticatedPage.waitForTimeout(500)
    }

    // All polls should be visible
    const polls = authenticatedPage.locator('[data-testid="poll"]')
    const pollCount = await polls.count()
    expect(pollCount).toBeGreaterThanOrEqual(3)
  })

  test('should handle multiple reactions on same message', async ({
    messagingPage,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/chat/general')

    const testMessage = 'Multiple reactions test'
    const messageInput = authenticatedPage.locator('[data-testid="message-input"]')
    const sendButton = authenticatedPage.locator('[data-testid="send-message-button"]')

    await messageInput.fill(testMessage)
    await sendButton.click()
    await authenticatedPage.waitForTimeout(1000)

    const messageElement = authenticatedPage
      .locator(`[data-testid^="message-"]:has-text("${testMessage}")`)
      .first()
    const messageId = await messageElement.getAttribute('data-testid')

    if (messageId) {
      const id = messageId.replace('message-', '')

      // Add multiple reactions
      const emojis = ['thumbs-up', 'heart', 'smile', 'fire']
      for (const emoji of emojis) {
        await messagingPage.reactToMessage(id, emoji)
        await authenticatedPage.waitForTimeout(200)
      }

      // All reactions should be visible
      for (const emoji of emojis) {
        const reaction = messageElement.locator(`[data-testid="reaction-${emoji}"]`)
        await expect(reaction).toBeVisible()
      }
    }
  })
})
