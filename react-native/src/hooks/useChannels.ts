/**
 * useChannels - Hook for managing channels list
 */

import { useState, useEffect, useCallback } from 'react'
import type { Channel } from '@shared/types'

interface UseChannelsReturn {
  channels: Channel[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createChannel: (name: string, type: Channel['type'], description?: string) => Promise<Channel>
  deleteChannel: (channelId: string) => Promise<void>
}

// Mock data for development
const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    name: 'general',
    description: 'General discussion channel',
    type: 'public',
    isPrivate: false,
    createdBy: 'user-1',
    members: ['user-1', 'user-2', 'user-3'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
    unreadCount: 5,
  },
  {
    id: 'ch-2',
    name: 'announcements',
    description: 'Important announcements',
    type: 'public',
    isPrivate: false,
    createdBy: 'user-1',
    members: ['user-1', 'user-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(Date.now() - 3600000),
    unreadCount: 0,
  },
  {
    id: 'ch-3',
    name: 'John Doe',
    description: 'Direct message',
    type: 'direct',
    isPrivate: true,
    createdBy: 'user-1',
    members: ['user-1', 'user-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(Date.now() - 7200000),
    unreadCount: 2,
  },
]

export function useChannels(): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchChannels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // API call would go here
      // For now, return mock data
      await new Promise((resolve) => setTimeout(resolve, 500))
      setChannels(mockChannels)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch channels'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const refresh = useCallback(async () => {
    await fetchChannels()
  }, [fetchChannels])

  const createChannel = useCallback(async (
    name: string,
    type: Channel['type'],
    description?: string
  ): Promise<Channel> => {
    // API call would go here
    const newChannel: Channel = {
      id: 'ch-' + Date.now(),
      name,
      description,
      type,
      isPrivate: type === 'private',
      createdBy: 'current-user',
      members: ['current-user'],
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
    }
    setChannels((prev) => [newChannel, ...prev])
    return newChannel
  }, [])

  const deleteChannel = useCallback(async (channelId: string) => {
    // API call would go here
    setChannels((prev) => prev.filter((ch) => ch.id !== channelId))
  }, [])

  return {
    channels,
    isLoading,
    error,
    refresh,
    createChannel,
    deleteChannel,
  }
}

export default useChannels
