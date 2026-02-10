/**
 * Message Factory
 *
 * Factory functions for creating message test data with deterministic IDs and timestamps.
 *
 * @module @nself-chat/testing/factories/message
 */

import type { TestUser } from './user.factory'
import { predefinedUsers } from './user.factory'

export interface TestMessage {
  id: string
  channelId: string
  content: string
  type?: 'text' | 'system' | 'file' | 'image'
  userId: string
  user?: Partial<TestUser>
  createdAt?: Date
  updatedAt?: Date
  isEdited?: boolean
  isDeleted?: boolean
  reactions?: Array<{ emoji: string; count: number; users: string[] }>
  parentId?: string | null
  threadCount?: number
}

// Counter for deterministic ID generation
let messageIdCounter = 3000

// Base timestamp for deterministic message creation (2024-01-01 12:00:00 UTC)
const BASE_TIMESTAMP = new Date('2024-01-01T12:00:00Z').getTime()

function generateMessageId(): string {
  return `msg-${String(messageIdCounter++).padStart(6, '0')}`
}

export function resetMessageIdCounter() {
  messageIdCounter = 3000
}

export interface MessageFactoryOptions extends Partial<TestMessage> {}

/**
 * Create a test message with default values
 */
export function createMessage(options: MessageFactoryOptions = {}): TestMessage {
  const id = options.id || generateMessageId()
  const user = options.user || predefinedUsers.alice
  const userId = options.userId ?? user.id ?? 'user-default'
  const messageNumber = messageIdCounter - 3000

  return {
    id,
    channelId: options.channelId || 'channel-general',
    content: options.content || `Test message ${messageNumber}`,
    type: options.type || 'text',
    userId,
    user,
    createdAt: options.createdAt || new Date(BASE_TIMESTAMP + messageNumber * 60000),
    updatedAt: options.updatedAt || new Date(BASE_TIMESTAMP + messageNumber * 60000),
    isEdited: options.isEdited ?? false,
    isDeleted: options.isDeleted ?? false,
    reactions: options.reactions || [],
    parentId: options.parentId || null,
    threadCount: options.threadCount || 0,
  }
}

export function createMessages(count: number, options: MessageFactoryOptions = {}): TestMessage[] {
  const baseTime = options.createdAt?.getTime() || BASE_TIMESTAMP

  return Array.from({ length: count }, (_, i) =>
    createMessage({
      ...options,
      content: options.content || `Message ${i + 1}`,
      createdAt: new Date(baseTime + i * 60000), // 1 minute apart
    })
  )
}

export function createTextMessage(content: string, options: Omit<MessageFactoryOptions, 'content' | 'type'> = {}): TestMessage {
  return createMessage({ ...options, content, type: 'text' })
}

export function createSystemMessage(content: string, options: Omit<MessageFactoryOptions, 'type' | 'user' | 'userId'> = {}): TestMessage {
  return createMessage({
    ...options,
    content,
    type: 'system',
    userId: 'system',
    user: { id: 'system', username: 'system', displayName: 'System', email: '', role: 'member' },
  })
}

export function createFileMessage(fileName: string, options: Omit<MessageFactoryOptions, 'type'> = {}): TestMessage {
  return createMessage({ ...options, content: `Uploaded file: ${fileName}`, type: 'file' })
}

export function createImageMessage(imageUrl: string, options: Omit<MessageFactoryOptions, 'type'> = {}): TestMessage {
  return createMessage({ ...options, content: imageUrl, type: 'image' })
}

export function createEditedMessage(options: Omit<MessageFactoryOptions, 'isEdited'> = {}): TestMessage {
  return createMessage({ content: 'This message was edited', ...options, isEdited: true })
}

export function createMessageWithReactions(reactions: Array<{ emoji: string; count: number; users: string[] }>, options: Omit<MessageFactoryOptions, 'reactions'> = {}): TestMessage {
  return createMessage({ content: 'Message with reactions', ...options, reactions })
}

export function createPopularMessage(options: Omit<MessageFactoryOptions, 'reactions'> = {}): TestMessage {
  return createMessageWithReactions(
    [
      { emoji: '👍', count: 5, users: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'] },
      { emoji: '❤️', count: 3, users: ['user-1', 'user-2', 'user-3'] },
      { emoji: '🎉', count: 2, users: ['user-1', 'user-2'] },
    ],
    options
  )
}

export function createMessageFrom(user: TestUser, options: Omit<MessageFactoryOptions, 'user' | 'userId'> = {}): TestMessage {
  return createMessage({ ...options, user, userId: user.id })
}

export function createMessageWithMention(mentionedUsername: string, options: MessageFactoryOptions = {}): TestMessage {
  return createMessage({ ...options, content: options.content || `Hey @${mentionedUsername}, check this out!` })
}

export function createCodeMessage(code: string, language: string = 'typescript', options: Omit<MessageFactoryOptions, 'content'> = {}): TestMessage {
  return createMessage({ ...options, content: `\`\`\`${language}\n${code}\n\`\`\`` })
}

export function createLinkMessage(url: string, text: string = url, options: Omit<MessageFactoryOptions, 'content'> = {}): TestMessage {
  return createMessage({ ...options, content: `Check this out: [${text}](${url})` })
}

export function createConversation(
  participants: TestUser[] = [predefinedUsers.alice, predefinedUsers.bob],
  messageCount: number = 5,
  channelId: string = 'channel-general'
): TestMessage[] {
  const baseTime = BASE_TIMESTAMP

  return Array.from({ length: messageCount }, (_, i) => {
    const user = participants[i % participants.length]
    return createMessage({
      channelId,
      user,
      userId: user.id,
      content: `${user.displayName}: Message ${i + 1}`,
      createdAt: new Date(baseTime + i * 60000),
    })
  })
}

export function createThread(parentMessage: TestMessage, replyCount: number = 3, participants: TestUser[] = [predefinedUsers.alice, predefinedUsers.bob]): TestMessage[] {
  const replies = createConversation(participants, replyCount, parentMessage.channelId)
  return replies.map((msg) => ({ ...msg, parentId: parentMessage.id }))
}

export function createMessagesOverTime(
  days: number,
  messagesPerDay: number = 10,
  channelId: string = 'channel-general',
  users: TestUser[] = [predefinedUsers.alice, predefinedUsers.bob, predefinedUsers.charlie]
): TestMessage[] {
  const messages: TestMessage[] = []
  const now = BASE_TIMESTAMP

  for (let d = 0; d < days; d++) {
    const dayStart = now + d * 24 * 60 * 60 * 1000

    for (let m = 0; m < messagesPerDay; m++) {
      const userIndex = (d * messagesPerDay + m) % users.length
      const user = users[userIndex]
      messages.push(
        createMessage({
          channelId,
          user,
          userId: user.id,
          createdAt: new Date(dayStart + m * ((24 * 60 * 60 * 1000) / messagesPerDay)),
        })
      )
    }
  }

  return messages
}

export const predefinedMessages = {
  welcome: createSystemMessage('Welcome to the channel!', { id: 'msg-welcome', channelId: 'channel-general' }),
  greeting: createTextMessage('Hello everyone!', {
    id: 'msg-greeting',
    user: predefinedUsers.alice,
    userId: predefinedUsers.alice.id,
    channelId: 'channel-general',
  }),
  withReactions: createPopularMessage({
    id: 'msg-popular',
    content: 'This is a popular message!',
    user: predefinedUsers.bob,
    userId: predefinedUsers.bob.id,
    channelId: 'channel-general',
  }),
  edited: createEditedMessage({
    id: 'msg-edited',
    user: predefinedUsers.charlie,
    userId: predefinedUsers.charlie.id,
    channelId: 'channel-general',
  }),
  code: createCodeMessage('const hello = "world";', 'typescript', {
    id: 'msg-code',
    user: predefinedUsers.alice,
    userId: predefinedUsers.alice.id,
    channelId: 'channel-general',
  }),
}
