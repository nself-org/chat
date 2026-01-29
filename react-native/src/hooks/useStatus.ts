/**
 * useStatus - Hook for managing status/stories
 */

import { useState, useEffect, useCallback } from 'react'
import type { Status, StatusType } from '@shared/types'

interface StatusGroup {
  userId: string
  userName: string
  avatarUrl?: string
  statuses: Status[]
  lastUpdated: Date
  hasViewed: boolean
}

interface UseStatusReturn {
  myStatuses: Status[]
  recentStatuses: StatusGroup[]
  viewedStatuses: StatusGroup[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createStatus: (type: StatusType, content: string, mediaUrl?: string) => Promise<Status>
  deleteStatus: (statusId: string) => Promise<void>
  viewStatus: (statusId: string) => Promise<void>
}

// Mock status data
const mockMyStatuses: Status[] = []

const mockOtherStatuses: StatusGroup[] = [
  {
    userId: 'user-2',
    userName: 'Alice',
    statuses: [
      {
        id: 'status-1',
        userId: 'user-2',
        type: 'text',
        content: 'Working on something exciting!',
        backgroundColor: '#4F46E5',
        viewerIds: [],
        expiresAt: new Date(Date.now() + 12 * 3600000),
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
    ],
    lastUpdated: new Date(Date.now() - 2 * 3600000),
    hasViewed: false,
  },
  {
    userId: 'user-3',
    userName: 'Bob',
    statuses: [
      {
        id: 'status-2',
        userId: 'user-3',
        type: 'image',
        content: '',
        mediaUrl: 'https://picsum.photos/400/600',
        viewerIds: ['current-user'],
        expiresAt: new Date(Date.now() + 8 * 3600000),
        createdAt: new Date(Date.now() - 6 * 3600000),
      },
    ],
    lastUpdated: new Date(Date.now() - 6 * 3600000),
    hasViewed: true,
  },
]

export function useStatus(): UseStatusReturn {
  const [myStatuses, setMyStatuses] = useState<Status[]>([])
  const [allStatuses, setAllStatuses] = useState<StatusGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 300))
      setMyStatuses(mockMyStatuses)
      setAllStatuses(mockOtherStatuses)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch statuses'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Separate viewed and unviewed statuses
  const recentStatuses = allStatuses.filter((s) => !s.hasViewed)
  const viewedStatuses = allStatuses.filter((s) => s.hasViewed)

  const refresh = useCallback(async () => {
    await fetchStatuses()
  }, [fetchStatuses])

  const createStatus = useCallback(async (
    type: StatusType,
    content: string,
    mediaUrl?: string
  ): Promise<Status> => {
    // API call would go here
    const newStatus: Status = {
      id: 'status-' + Date.now(),
      userId: 'current-user',
      type,
      content,
      mediaUrl,
      backgroundColor: type === 'text' ? '#4F46E5' : undefined,
      viewerIds: [],
      expiresAt: new Date(Date.now() + 24 * 3600000),
      createdAt: new Date(),
    }

    setMyStatuses((prev) => [...prev, newStatus])
    return newStatus
  }, [])

  const deleteStatus = useCallback(async (statusId: string) => {
    // API call would go here
    setMyStatuses((prev) => prev.filter((s) => s.id !== statusId))
  }, [])

  const viewStatus = useCallback(async (statusId: string) => {
    // API call would go here
    setAllStatuses((prev) =>
      prev.map((group) => ({
        ...group,
        statuses: group.statuses.map((s) =>
          s.id === statusId
            ? { ...s, viewerIds: [...s.viewerIds, 'current-user'] }
            : s
        ),
        hasViewed: group.statuses.some((s) => s.id === statusId) ? true : group.hasViewed,
      }))
    )
  }, [])

  return {
    myStatuses,
    recentStatuses,
    viewedStatuses,
    isLoading,
    error,
    refresh,
    createStatus,
    deleteStatus,
    viewStatus,
  }
}

export default useStatus
