/**
 * @jest-environment node
 */
import { MessageService } from '../message.service'
import { createMessage, createUser, createChannel } from '@/test-utils'

describe('MessageService', () => {
  let service: MessageService

  beforeEach(() => {
    service = new MessageService()
  })

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const user = createUser()
      const channel = createChannel()
      const messageData = {
        channelId: channel.id,
        userId: user.id,
        content: 'Hello, world!',
        type: 'text' as const,
      }

      const message = await service.sendMessage(messageData)

      expect(message).toMatchObject({
        channelId: channel.id,
        userId: user.id,
        content: 'Hello, world!',
        type: 'text',
      })
      expect(message.id).toBeDefined()
      expect(message.createdAt).toBeInstanceOf(Date)
    })

    it('should send a message with mentions', async () => {
      const user = createUser()
      const mentionedUser = createUser()
      const channel = createChannel()

      const messageData = {
        channelId: channel.id,
        userId: user.id,
        content: `Hey @${mentionedUser.username}!`,
        type: 'text' as const,
        mentions: [mentionedUser.id],
      }

      const message = await service.sendMessage(messageData)

      expect(message.mentions).toContain(mentionedUser.id)
    })

    it('should send a message with attachments', async () => {
      const user = createUser()
      const channel = createChannel()

      const messageData = {
        channelId: channel.id,
        userId: user.id,
        content: 'Check out this file',
        type: 'text' as const,
        attachments: [
          {
            id: 'file-1',
            name: 'document.pdf',
            size: 1024,
            mimeType: 'application/pdf',
            url: 'https://example.com/document.pdf',
          },
        ],
      }

      const message = await service.sendMessage(messageData)

      expect(message.attachments).toHaveLength(1)
      expect(message.attachments[0].name).toBe('document.pdf')
    })

    it('should throw error for empty message', async () => {
      const user = createUser()
      const channel = createChannel()

      const messageData = {
        channelId: channel.id,
        userId: user.id,
        content: '',
        type: 'text' as const,
      }

      await expect(service.sendMessage(messageData)).rejects.toThrow()
    })

    it('should throw error for message exceeding max length', async () => {
      const user = createUser()
      const channel = createChannel()

      const messageData = {
        channelId: channel.id,
        userId: user.id,
        content: 'a'.repeat(10001), // Exceeds typical max length
        type: 'text' as const,
      }

      await expect(service.sendMessage(messageData)).rejects.toThrow()
    })
  })

  describe('getMessage', () => {
    it('should retrieve a message by ID', async () => {
      const user = createUser()
      const channel = createChannel()

      const sent = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test message',
        type: 'text',
      })

      const retrieved = await service.getMessage(sent.id)

      expect(retrieved).toMatchObject({
        id: sent.id,
        content: 'Test message',
      })
    })

    it('should return null for non-existent message', async () => {
      const result = await service.getMessage('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateMessage', () => {
    it('should update message content', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Original',
        type: 'text',
      })

      const updated = await service.updateMessage(message.id, {
        content: 'Updated',
      })

      expect(updated.content).toBe('Updated')
      expect(updated.editedAt).toBeInstanceOf(Date)
    })

    it('should track edit history', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Original',
        type: 'text',
      })

      await service.updateMessage(message.id, { content: 'Edit 1' })
      await service.updateMessage(message.id, { content: 'Edit 2' })

      const history = await service.getMessageEditHistory(message.id)

      expect(history).toHaveLength(2)
      expect(history[0].content).toBe('Original')
    })

    it('should not allow updating deleted message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test',
        type: 'text',
      })

      await service.deleteMessage(message.id)

      await expect(service.updateMessage(message.id, { content: 'Updated' })).rejects.toThrow()
    })
  })

  describe('deleteMessage', () => {
    it('should soft delete a message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'To delete',
        type: 'text',
      })

      await service.deleteMessage(message.id)

      const retrieved = await service.getMessage(message.id)
      expect(retrieved.deletedAt).toBeDefined()
      expect(retrieved.content).toBe('[deleted]')
    })

    it('should handle deleting non-existent message', async () => {
      await expect(service.deleteMessage('non-existent')).rejects.toThrow()
    })
  })

  describe('getChannelMessages', () => {
    it('should retrieve messages for a channel', async () => {
      const user = createUser()
      const channel = createChannel()

      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Message 1',
        type: 'text',
      })
      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Message 2',
        type: 'text',
      })

      const messages = await service.getChannelMessages(channel.id)

      expect(messages.length).toBeGreaterThanOrEqual(2)
    })

    it('should support pagination', async () => {
      const user = createUser()
      const channel = createChannel()

      for (let i = 0; i < 20; i++) {
        await service.sendMessage({
          channelId: channel.id,
          userId: user.id,
          content: `Message ${i}`,
          type: 'text',
        })
      }

      const page1 = await service.getChannelMessages(channel.id, { limit: 10, offset: 0 })
      const page2 = await service.getChannelMessages(channel.id, { limit: 10, offset: 10 })

      expect(page1.length).toBe(10)
      expect(page2.length).toBe(10)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('should filter by date range', async () => {
      const user = createUser()
      const channel = createChannel()

      const startDate = new Date()

      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Recent message',
        type: 'text',
      })

      const messages = await service.getChannelMessages(channel.id, {
        after: startDate.toISOString(),
      })

      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages.every((m) => new Date(m.createdAt) >= startDate)).toBe(true)
    })
  })

  describe('addReaction', () => {
    it('should add a reaction to a message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test',
        type: 'text',
      })

      const reaction = await service.addReaction(message.id, {
        userId: user.id,
        emoji: '👍',
      })

      expect(reaction).toMatchObject({
        messageId: message.id,
        userId: user.id,
        emoji: '👍',
      })
    })

    it('should not allow duplicate reactions', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test',
        type: 'text',
      })

      await service.addReaction(message.id, { userId: user.id, emoji: '👍' })

      await expect(
        service.addReaction(message.id, { userId: user.id, emoji: '👍' })
      ).rejects.toThrow()
    })
  })

  describe('removeReaction', () => {
    it('should remove a reaction from a message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test',
        type: 'text',
      })

      await service.addReaction(message.id, { userId: user.id, emoji: '👍' })
      await service.removeReaction(message.id, { userId: user.id, emoji: '👍' })

      const reactions = await service.getMessageReactions(message.id)
      expect(reactions.find((r) => r.userId === user.id && r.emoji === '👍')).toBeUndefined()
    })
  })

  describe('pinMessage', () => {
    it('should pin a message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Important',
        type: 'text',
      })

      const pinned = await service.pinMessage(message.id)

      expect(pinned.isPinned).toBe(true)
      expect(pinned.pinnedAt).toBeInstanceOf(Date)
    })
  })

  describe('unpinMessage', () => {
    it('should unpin a message', async () => {
      const user = createUser()
      const channel = createChannel()

      const message = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Test',
        type: 'text',
      })

      await service.pinMessage(message.id)
      const unpinned = await service.unpinMessage(message.id)

      expect(unpinned.isPinned).toBe(false)
      expect(unpinned.pinnedAt).toBeNull()
    })
  })

  describe('searchMessages', () => {
    it('should search messages by content', async () => {
      const user = createUser()
      const channel = createChannel()

      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'JavaScript is great',
        type: 'text',
      })
      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Python is awesome',
        type: 'text',
      })

      const results = await service.searchMessages('JavaScript')

      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].content).toContain('JavaScript')
    })

    it('should return empty array for no matches', async () => {
      const results = await service.searchMessages('nonexistent-xyz-abc-123')
      expect(results).toEqual([])
    })
  })

  describe('getThreadMessages', () => {
    it('should retrieve messages in a thread', async () => {
      const user = createUser()
      const channel = createChannel()

      const parent = await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Parent message',
        type: 'text',
      })

      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Reply 1',
        type: 'text',
        threadId: parent.id,
      })
      await service.sendMessage({
        channelId: channel.id,
        userId: user.id,
        content: 'Reply 2',
        type: 'text',
        threadId: parent.id,
      })

      const thread = await service.getThreadMessages(parent.id)

      expect(thread.length).toBe(2)
      expect(thread.every((m) => m.threadId === parent.id)).toBe(true)
    })
  })
})
