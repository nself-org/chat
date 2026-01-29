/**
 * useChannel - Hook for managing a single channel
 */

import { useState, useEffect, useCallback } from 'react'
import type { Channel, User } from '@shared/types'

interface UseChannelReturn {
  channel: Channel | null
  members: User[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateChannel: (updates: Partial<Channel>) => Promise<void>
  addMember: (userId: string) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  leaveChannel: () => Promise<void>
}

export function useChannel(channelId: string): UseChannelReturn {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchChannel = useCallback(async () => {
    if (!channelId) return

    setIsLoading(true)
    setError(null)
    try {
      // API call would go here
      // For now, return mock data
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockChannel: Channel = {
        id: channelId,
        name: 'general',
        description: 'General discussion channel',
        type: 'public',
        isPrivate: false,
        createdBy: 'user-1',
        members: ['user-1', 'user-2', 'user-3'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockMembers: User[] = [
        {
          id: 'user-1',
          email: 'alice@example.com',
          displayName: 'Alice',
          status: 'online',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'bob@example.com',
          displayName: 'Bob',
          status: 'away',
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      setChannel(mockChannel)
      setMembers(mockMembers)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch channel'))
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    fetchChannel()
  }, [fetchChannel])

  const refresh = useCallback(async () => {
    await fetchChannel()
  }, [fetchChannel])

  const updateChannel = useCallback(async (updates: Partial<Channel>) => {
    if (!channel) return
    // API call would go here
    setChannel({ ...channel, ...updates, updatedAt: new Date() })
  }, [channel])

  const addMember = useCallback(async (userId: string) => {
    if (!channel) return
    // API call would go here
    setChannel({
      ...channel,
      members: [...channel.members, userId],
      updatedAt: new Date(),
    })
  }, [channel])

  const removeMember = useCallback(async (userId: string) => {
    if (!channel) return
    // API call would go here
    setChannel({
      ...channel,
      members: channel.members.filter((id) => id !== userId),
      updatedAt: new Date(),
    })
    setMembers((prev) => prev.filter((m) => m.id !== userId))
  }, [channel])

  const leaveChannel = useCallback(async () => {
    // API call would go here
    setChannel(null)
  }, [])

  return {
    channel,
    members,
    isLoading,
    error,
    refresh,
    updateChannel,
    addMember,
    removeMember,
    leaveChannel,
  }
}

export default useChannel
