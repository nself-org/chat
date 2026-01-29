/**
 * useNotifications - Hook for managing notifications
 */

import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@shared/types'

interface UseNotificationsReturn {
  notifications: Notification[]
  isLoading: boolean
  error: Error | null
  unreadCount: number
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'mention',
    title: 'Alice mentioned you',
    body: '@you check this out in #general',
    data: { channelId: 'ch-1', channelName: 'general' },
    isRead: false,
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: 'notif-2',
    type: 'direct_message',
    title: 'New message from Bob',
    body: 'Hey, are you free for a call?',
    data: { userId: 'user-2', userName: 'Bob' },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'notif-3',
    type: 'channel_invite',
    title: 'Channel invite',
    body: 'You were added to #design',
    data: { channelId: 'ch-3', channelName: 'design' },
    isRead: true,
    createdAt: new Date(Date.now() - 86400000),
  },
]

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 300))
      setNotifications(mockNotifications)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    // API call would go here
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    // API call would go here
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    // API call would go here
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }, [])

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}

export default useNotifications
