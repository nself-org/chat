/**
 * useUser - Hook for fetching user data
 */

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@shared/types'

interface UseUserReturn {
  user: User | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useUser(userId: string): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockUser: User = {
        id: userId,
        email: 'user@example.com',
        displayName: 'John Doe',
        status: 'online',
        role: 'member',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      }

      setUser(mockUser)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const refresh = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  return {
    user,
    isLoading,
    error,
    refresh,
  }
}

export default useUser
