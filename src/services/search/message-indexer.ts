/**
 * Message Indexer Service
 *
 * Handles indexing of messages to MeiliSearch for full-text search.
 * Supports real-time indexing, batch operations, and reindexing.
 *
 * @module services/search/message-indexer
 */

import type { Message } from '@/types/message'
import type { Channel } from '@/types/channel'
import type { User } from '@/types/user'
import {
  getMessagesIndex,
  INDEXES,
  getMeiliClient,
  type MeiliMessageDocument,
} from '@/lib/search/meilisearch-config'

// ============================================================================
// Types
// ============================================================================

export interface IndexingStatus {
  indexed: number
  pending: number
  failed: number
  lastIndexedAt: Date | null
  isIndexing: boolean
}

export interface IndexingResult {
  success: boolean
  taskId?: number
  error?: string
}

export interface BatchIndexingResult {
  total: number
  successful: number
  failed: number
  errors: { id: string; error: string }[]
  taskIds: number[]
}

export interface MessageWithContext {
  message: Message
  channel?: Pick<Channel, 'id' | 'name'>
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

// ============================================================================
// Message Transformation
// ============================================================================

/**
 * Strip HTML tags from content for plain text indexing
 */
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Detect if content contains a URL
 */
function hasLink(content: string): boolean {
  const urlPattern = /https?:\/\/[^\s]+/i
  return urlPattern.test(content)
}

/**
 * Transform a Message to MeiliSearch document format
 */
export function transformMessageToDocument(
  message: Message,
  channel?: Pick<Channel, 'id' | 'name'>,
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
): MeiliMessageDocument {
  const attachments = message.attachments || []
  const hasImage = attachments.some((a) => a.type === 'image')
  const hasVideo = attachments.some((a) => a.type === 'video')
  const hasFile = attachments.some((a) => a.type === 'file' || a.type === 'audio')

  return {
    id: message.id,
    content: message.content,
    content_plain: stripHtml(message.contentHtml || message.content),
    channel_id: message.channelId,
    channel_name: channel?.name || '',
    author_id: message.userId,
    author_name: author?.displayName || message.user?.displayName || '',
    author_username: author?.username || message.user?.username || '',
    author_avatar_url: author?.avatarUrl || message.user?.avatarUrl,
    created_at: Math.floor(new Date(message.createdAt).getTime() / 1000),
    updated_at: message.updatedAt
      ? Math.floor(new Date(message.updatedAt).getTime() / 1000)
      : undefined,
    message_type: message.type,
    has_attachment: attachments.length > 0,
    has_link: hasLink(message.content),
    has_image: hasImage,
    has_video: hasVideo,
    has_file: hasFile,
    is_pinned: message.isPinned || false,
    is_edited: message.isEdited || false,
    is_deleted: message.isDeleted || false,
    thread_id: message.threadInfo ? message.id : undefined,
    parent_thread_id: message.parentThreadId,
    mentioned_users: message.mentionedUsers || [],
    mentions_everyone: message.mentionsEveryone || false,
    mentions_here: message.mentionsHere || false,
    attachment_count: attachments.length,
    reaction_count: message.reactions?.length || 0,
  }
}

// ============================================================================
// Message Indexer Class
// ============================================================================

export class MessageIndexer {
  private batchQueue: MeiliMessageDocument[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private batchSize: number
  private flushInterval: number
  private isProcessing = false

  constructor(options?: { batchSize?: number; flushInterval?: number }) {
    this.batchSize = options?.batchSize || 100
    this.flushInterval = options?.flushInterval || 1000 // 1 second
  }

  /**
   * Index a single message
   */
  async indexMessage(
    message: Message,
    channel?: Pick<Channel, 'id' | 'name'>,
    author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  ): Promise<IndexingResult> {
    try {
      const document = transformMessageToDocument(message, channel, author)
      const index = getMessagesIndex()
      const task = await index.addDocuments([document])

      return {
        success: true,
        taskId: task.taskUid,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Index multiple messages at once
   */
  async indexMessages(messagesWithContext: MessageWithContext[]): Promise<BatchIndexingResult> {
    const documents: MeiliMessageDocument[] = []
    const errors: { id: string; error: string }[] = []

    for (const { message, channel, author } of messagesWithContext) {
      try {
        const document = transformMessageToDocument(message, channel, author)
        documents.push(document)
      } catch (error) {
        errors.push({
          id: message.id,
          error: error instanceof Error ? error.message : 'Transform failed',
        })
      }
    }

    if (documents.length === 0) {
      return {
        total: messagesWithContext.length,
        successful: 0,
        failed: errors.length,
        errors,
        taskIds: [],
      }
    }

    try {
      const index = getMessagesIndex()
      const task = await index.addDocuments(documents)

      return {
        total: messagesWithContext.length,
        successful: documents.length,
        failed: errors.length,
        errors,
        taskIds: [task.taskUid],
      }
    } catch (error) {
      return {
        total: messagesWithContext.length,
        successful: 0,
        failed: messagesWithContext.length,
        errors: [
          ...errors,
          ...documents.map((d) => ({
            id: d.id,
            error: error instanceof Error ? error.message : 'Index failed',
          })),
        ],
        taskIds: [],
      }
    }
  }

  /**
   * Add message to batch queue for efficient bulk indexing
   */
  queueMessage(
    message: Message,
    channel?: Pick<Channel, 'id' | 'name'>,
    author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  ): void {
    const document = transformMessageToDocument(message, channel, author)
    this.batchQueue.push(document)

    // Flush if batch size reached
    if (this.batchQueue.length >= this.batchSize) {
      this.flush()
    }

    // Set up auto-flush timer
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flush()
      }, this.flushInterval)
    }
  }

  /**
   * Flush the batch queue to MeiliSearch
   */
  async flush(): Promise<BatchIndexingResult> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.batchQueue.length === 0 || this.isProcessing) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
        taskIds: [],
      }
    }

    this.isProcessing = true
    const documents = [...this.batchQueue]
    this.batchQueue = []

    try {
      const index = getMessagesIndex()
      const task = await index.addDocuments(documents)

      this.isProcessing = false
      return {
        total: documents.length,
        successful: documents.length,
        failed: 0,
        errors: [],
        taskIds: [task.taskUid],
      }
    } catch (error) {
      this.isProcessing = false
      return {
        total: documents.length,
        successful: 0,
        failed: documents.length,
        errors: documents.map((d) => ({
          id: d.id,
          error: error instanceof Error ? error.message : 'Flush failed',
        })),
        taskIds: [],
      }
    }
  }

  /**
   * Update an existing message in the index
   */
  async updateMessage(
    message: Message,
    channel?: Pick<Channel, 'id' | 'name'>,
    author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  ): Promise<IndexingResult> {
    // MeiliSearch handles updates via addDocuments with same ID
    return this.indexMessage(message, channel, author)
  }

  /**
   * Remove a message from the index
   */
  async removeMessage(messageId: string): Promise<IndexingResult> {
    try {
      const index = getMessagesIndex()
      const task = await index.deleteDocument(messageId)

      return {
        success: true,
        taskId: task.taskUid,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Remove multiple messages from the index
   */
  async removeMessages(messageIds: string[]): Promise<BatchIndexingResult> {
    try {
      const index = getMessagesIndex()
      const task = await index.deleteDocuments(messageIds)

      return {
        total: messageIds.length,
        successful: messageIds.length,
        failed: 0,
        errors: [],
        taskIds: [task.taskUid],
      }
    } catch (error) {
      return {
        total: messageIds.length,
        successful: 0,
        failed: messageIds.length,
        errors: messageIds.map((id) => ({
          id,
          error: error instanceof Error ? error.message : 'Delete failed',
        })),
        taskIds: [],
      }
    }
  }

  /**
   * Reindex all messages in a channel
   */
  async reindexChannel(
    channelId: string,
    getMessages: () => Promise<MessageWithContext[]>
  ): Promise<BatchIndexingResult> {
    // First, delete all existing messages for this channel
    try {
      const index = getMessagesIndex()
      await index.deleteDocuments({
        filter: `channel_id = "${channelId}"`,
      })
    } catch {
      // Ignore delete errors, just proceed with reindex
    }

    // Get all messages for the channel
    const messagesWithContext = await getMessages()

    // Index them
    return this.indexMessages(messagesWithContext)
  }

  /**
   * Reindex all messages
   */
  async reindexAll(
    getMessages: () => Promise<MessageWithContext[]>,
    onProgress?: (progress: { indexed: number; total: number }) => void
  ): Promise<BatchIndexingResult> {
    // Clear the index
    try {
      const index = getMessagesIndex()
      await index.deleteAllDocuments()
    } catch {
      // Ignore errors, proceed with reindex
    }

    // Get all messages
    const messagesWithContext = await getMessages()
    const total = messagesWithContext.length

    // Process in batches
    const results: BatchIndexingResult = {
      total,
      successful: 0,
      failed: 0,
      errors: [],
      taskIds: [],
    }

    for (let i = 0; i < messagesWithContext.length; i += this.batchSize) {
      const batch = messagesWithContext.slice(i, i + this.batchSize)
      const batchResult = await this.indexMessages(batch)

      results.successful += batchResult.successful
      results.failed += batchResult.failed
      results.errors.push(...batchResult.errors)
      results.taskIds.push(...batchResult.taskIds)

      if (onProgress) {
        onProgress({ indexed: Math.min(i + this.batchSize, total), total })
      }
    }

    return results
  }

  /**
   * Get indexing status
   */
  async getStatus(): Promise<IndexingStatus> {
    try {
      const client = getMeiliClient()
      const index = getMessagesIndex()
      const stats = await index.getStats()

      // Get pending tasks
      const tasks = await client.getTasks({
        indexUids: [INDEXES.MESSAGES],
        statuses: ['enqueued', 'processing'],
      })

      // Get last completed task
      const completedTasks = await client.getTasks({
        indexUids: [INDEXES.MESSAGES],
        statuses: ['succeeded'],
        limit: 1,
      })

      return {
        indexed: stats.numberOfDocuments,
        pending: tasks.total,
        failed: 0, // Would need to track this separately
        lastIndexedAt:
          completedTasks.results.length > 0
            ? new Date(completedTasks.results[0].finishedAt || Date.now())
            : null,
        isIndexing: stats.isIndexing || tasks.total > 0,
      }
    } catch {
      return {
        indexed: 0,
        pending: this.batchQueue.length,
        failed: 0,
        lastIndexedAt: null,
        isIndexing: this.isProcessing,
      }
    }
  }

  /**
   * Wait for all indexing tasks to complete
   */
  async waitForCompletion(timeout = 30000): Promise<void> {
    // First flush any pending items
    await this.flush()

    // Then wait for MeiliSearch tasks
    const client = getMeiliClient()
    const tasks = await client.getTasks({
      indexUids: [INDEXES.MESSAGES],
      statuses: ['enqueued', 'processing'],
    })

    for (const task of tasks.results) {
      await client.waitForTask(task.uid, { timeOutMs: timeout })
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let defaultIndexer: MessageIndexer | null = null

/**
 * Get or create the default message indexer
 */
export function getMessageIndexer(): MessageIndexer {
  if (!defaultIndexer) {
    defaultIndexer = new MessageIndexer()
  }
  return defaultIndexer
}

/**
 * Create a new message indexer instance
 */
export function createMessageIndexer(options?: {
  batchSize?: number
  flushInterval?: number
}): MessageIndexer {
  return new MessageIndexer(options)
}

// ============================================================================
// Event Subscription
// ============================================================================

export type MessageEventType = 'created' | 'updated' | 'deleted'

export interface MessageEvent {
  type: MessageEventType
  message: Message
  channel?: Pick<Channel, 'id' | 'name'>
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

/**
 * Subscribe to message events for real-time indexing
 * Returns an unsubscribe function
 */
export function subscribeToMessageEvents(
  indexer: MessageIndexer,
  onEvent: (event: MessageEvent) => void
): () => void {
  // This is a placeholder - actual implementation would integrate with
  // your real-time system (Socket.io, GraphQL subscriptions, etc.)

  const handleEvent = async (event: MessageEvent) => {
    onEvent(event)

    switch (event.type) {
      case 'created':
        await indexer.indexMessage(event.message, event.channel, event.author)
        break
      case 'updated':
        await indexer.updateMessage(event.message, event.channel, event.author)
        break
      case 'deleted':
        await indexer.removeMessage(event.message.id)
        break
    }
  }

  // Return unsubscribe function
  return () => {
    // Cleanup subscription
  }
}

// ============================================================================
// Export
// ============================================================================

export default MessageIndexer
