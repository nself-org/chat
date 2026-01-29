/**
 * useMessages - Hook for managing messages in a channel
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Message } from '@shared/types'
import { DEFAULT_PAGE_SIZE } from '@shared/constants'

interface SendMessageParams {
  content: string
  attachments?: string[]
  replyTo?: string
}

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  sendMessage: (params: SendMessageParams) => Promise<Message>
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  removeReaction: (messageId: string, emoji: string) => Promise<void>
  markAsRead: () => Promise<void>
}

// Generate mock messages
function generateMockMessages(channelId: string, count: number, offset: number = 0): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${channelId}-${offset + i}`,
    channelId,
    senderId: i % 2 === 0 ? 'current-user' : 'other-user',
    content: `This is message ${offset + i + 1}. Lorem ipsum dolor sit amet.`,
    type: 'text' as const,
    reactions: i % 3 === 0 ? [{ emoji: '👍', userIds: ['user-1'], count: 1 }] : undefined,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - (offset + i) * 60000),
    updatedAt: new Date(Date.now() - (offset + i) * 60000),
  }))
}

export function useMessages(channelId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  const fetchMessages = useCallback(async (reset: boolean = true) => {
    if (!channelId) return

    setIsLoading(true)
    setError(null)

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 300))

      const offset = reset ? 0 : offsetRef.current
      const mockMessages = generateMockMessages(channelId, DEFAULT_PAGE_SIZE, offset)

      if (reset) {
        setMessages(mockMessages)
        offsetRef.current = DEFAULT_PAGE_SIZE
      } else {
        setMessages((prev) => [...prev, ...mockMessages])
        offsetRef.current += DEFAULT_PAGE_SIZE
      }

      // Simulate end of messages after 100
      setHasMore(offsetRef.current < 100)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    fetchMessages(true)
  }, [fetchMessages])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchMessages(false)
  }, [hasMore, isLoading, fetchMessages])

  const sendMessage = useCallback(async (params: SendMessageParams): Promise<Message> => {
    setIsSending(true)
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 200))

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        channelId,
        senderId: 'current-user',
        content: params.content,
        type: 'text',
        replyTo: params.replyTo,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add to beginning (newest first for inverted list)
      setMessages((prev) => [newMessage, ...prev])
      return newMessage
    } finally {
      setIsSending(false)
    }
  }, [channelId])

  const deleteMessage = useCallback(async (messageId: string) => {
    // API call would go here
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: '' } : msg
      )
    )
  }, [])

  const editMessage = useCallback(async (messageId: string, content: string) => {
    // API call would go here
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content, isEdited: true, updatedAt: new Date() }
          : msg
      )
    )
  }, [])

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    // API call would go here
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg

        const reactions = msg.reactions || []
        const existingReaction = reactions.find((r) => r.emoji === emoji)

        if (existingReaction) {
          return {
            ...msg,
            reactions: reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, userIds: [...r.userIds, 'current-user'], count: r.count + 1 }
                : r
            ),
          }
        }

        return {
          ...msg,
          reactions: [...reactions, { emoji, userIds: ['current-user'], count: 1 }],
        }
      })
    )
  }, [])

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    // API call would go here
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg

        const reactions = msg.reactions || []
        return {
          ...msg,
          reactions: reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    userIds: r.userIds.filter((id) => id !== 'current-user'),
                    count: r.count - 1,
                  }
                : r
            )
            .filter((r) => r.count > 0),
        }
      })
    )
  }, [])

  const markAsRead = useCallback(async () => {
    // API call would go here
  }, [])

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
    addReaction,
    removeReaction,
    markAsRead,
  }
}

export default useMessages
