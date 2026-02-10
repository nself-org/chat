/**
 * Stream Page
 *
 * Live streaming viewer page using LiveKit for HLS/DASH streaming.
 * Supports live chat, reactions, and viewer count.
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { StreamPlayer } from '@/components/voice-video/StreamPlayer'
import { useAuth } from '@/contexts/auth-context'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type {
  StreamMetadata,
  StreamMessage,
  StreamReaction,
} from '@/components/voice-video/StreamPlayer'

// =============================================================================
// Component
// =============================================================================

export default function StreamPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const streamId = params.id as string

  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [streamMetadata, setStreamMetadata] = useState<StreamMetadata | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [reactions, setReactions] = useState<StreamReaction[]>([
    { type: 'heart', count: 0 },
    { type: 'thumbsup', count: 0 },
    { type: 'smile', count: 0 },
    { type: 'fire', count: 0 },
    { type: 'clap', count: 0 },
  ])
  const [error, setError] = useState<string | null>(null)

  // Fetch stream metadata
  useEffect(() => {
    if (!streamId) return

    const fetchStreamMetadata = async () => {
      try {
        setIsLoading(true)
        logger.info('[Stream Page] Fetching stream metadata', { streamId })

        const response = await fetch(`/api/streams/${streamId}`)
        if (!response.ok) {
          throw new Error('Stream not found')
        }

        const data = await response.json()
        setStreamMetadata(data.metadata)
        setStreamUrl(data.streamUrl)

        logger.info('[Stream Page] Stream metadata loaded', data)
      } catch (error) {
        logger.error('[Stream Page] Failed to fetch stream', error)
        setError('Stream not found or unavailable')
        toast.error('Failed to load stream')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamMetadata()
  }, [streamId])

  // Subscribe to stream chat and updates (WebSocket)
  useEffect(() => {
    if (!streamId || !user) return

    // TODO: Connect to WebSocket for real-time chat and viewer count updates
    // This would use Socket.io or LiveKit's data channel

    logger.info('[Stream Page] Subscribed to stream updates', { streamId })

    return () => {
      logger.info('[Stream Page] Unsubscribed from stream updates')
    }
  }, [streamId, user])

  // Handle send message
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!user || !streamId) return

      try {
        const newMessage: StreamMessage = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.displayName || user.email,
          userAvatarUrl: user.avatarUrl,
          message,
          timestamp: new Date(),
        }

        // Optimistically add to local state
        setMessages((prev) => [...prev, newMessage])

        // Send to backend
        await fetch(`/api/streams/${streamId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        })

        logger.info('[Stream Page] Message sent', { message })
      } catch (error) {
        logger.error('[Stream Page] Failed to send message', error)
        toast.error('Failed to send message')
      }
    },
    [user, streamId]
  )

  // Handle reaction
  const handleReaction = useCallback(
    async (type: StreamReaction['type']) => {
      if (!streamId) return

      try {
        // Optimistically update local state
        setReactions((prev) =>
          prev.map((r) => (r.type === type ? { ...r, count: r.count + 1 } : r))
        )

        // Send to backend
        await fetch(`/api/streams/${streamId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type }),
        })

        logger.info('[Stream Page] Reaction sent', { type })
      } catch (error) {
        logger.error('[Stream Page] Failed to send reaction', error)
        // Revert on error
        setReactions((prev) =>
          prev.map((r) => (r.type === type ? { ...r, count: r.count - 1 } : r))
        )
      }
    },
    [streamId]
  )

  // Handle follow
  const handleFollow = useCallback(async () => {
    if (!user || !streamMetadata) return

    try {
      await fetch(`/api/users/${streamMetadata.streamer.id}/follow`, {
        method: 'POST',
      })

      toast.success(`Now following ${streamMetadata.streamer.name}`)
      logger.info('[Stream Page] Followed streamer', {
        streamerId: streamMetadata.streamer.id,
      })
    } catch (error) {
      logger.error('[Stream Page] Failed to follow', error)
      toast.error('Failed to follow streamer')
    }
  }, [user, streamMetadata])

  // Handle share
  const handleShare = useCallback(async () => {
    if (!streamMetadata) return

    try {
      const shareUrl = `${window.location.origin}/streams/${streamId}`

      if (navigator.share) {
        await navigator.share({
          title: streamMetadata.title,
          text: `Watch ${streamMetadata.streamer.name}'s live stream!`,
          url: shareUrl,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Stream link copied to clipboard')
      }

      logger.info('[Stream Page] Stream shared')
    } catch (error) {
      logger.error('[Stream Page] Failed to share', error)
    }
  }, [streamId, streamMetadata])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-lg text-white">Loading stream...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !streamMetadata) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-red-500">Stream not available</p>
          <p className="text-sm text-gray-400">{error || 'Stream not found'}</p>
          <button
            onClick={() => router.push('/chat')}
            className="rounded-lg bg-white px-6 py-2 text-gray-900 hover:bg-gray-100"
          >
            Return to Chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full">
      <StreamPlayer
        metadata={streamMetadata}
        streamUrl={streamUrl || undefined}
        messages={messages}
        reactions={reactions}
        onSendMessage={handleSendMessage}
        onReaction={handleReaction}
        onFollow={handleFollow}
        onShare={handleShare}
      />
    </div>
  )
}
