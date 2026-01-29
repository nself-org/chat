/**
 * useCalls - Hook for managing calls
 */

import { useState, useEffect, useCallback } from 'react'
import type { Call, CallType } from '@shared/types'

interface UseCallsReturn {
  calls: Call[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  initiateCall: (userId: string, type: CallType) => Promise<Call>
  endCall: (callId: string) => Promise<void>
}

// Mock calls
const mockCalls: Call[] = [
  {
    id: 'call-1',
    type: 'audio',
    status: 'ended',
    participants: [{ userId: 'user-2', isMuted: false, isVideoEnabled: false }],
    initiatorId: 'current-user',
    startedAt: new Date(Date.now() - 3600000),
    endedAt: new Date(Date.now() - 3000000),
    duration: 600,
  },
  {
    id: 'call-2',
    type: 'video',
    status: 'missed',
    participants: [{ userId: 'user-3', isMuted: false, isVideoEnabled: true }],
    initiatorId: 'user-3',
    startedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'call-3',
    type: 'audio',
    status: 'ended',
    participants: [{ userId: 'user-2', isMuted: false, isVideoEnabled: false }],
    initiatorId: 'user-2',
    startedAt: new Date(Date.now() - 86400000),
    endedAt: new Date(Date.now() - 86100000),
    duration: 300,
  },
]

export function useCalls(): UseCallsReturn {
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCalls = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCalls(mockCalls)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch calls'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  const refresh = useCallback(async () => {
    await fetchCalls()
  }, [fetchCalls])

  const initiateCall = useCallback(async (userId: string, type: CallType): Promise<Call> => {
    // API/WebRTC call would go here
    const newCall: Call = {
      id: 'call-' + Date.now(),
      type,
      status: 'ringing',
      participants: [{ userId, isMuted: false, isVideoEnabled: type === 'video' }],
      initiatorId: 'current-user',
      startedAt: new Date(),
    }

    setCalls((prev) => [newCall, ...prev])
    return newCall
  }, [])

  const endCall = useCallback(async (callId: string) => {
    // API/WebRTC call would go here
    setCalls((prev) =>
      prev.map((call) =>
        call.id === callId
          ? {
              ...call,
              status: 'ended',
              endedAt: new Date(),
              duration: call.startedAt
                ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000)
                : 0,
            }
          : call
      )
    )
  }, [])

  return {
    calls,
    isLoading,
    error,
    refresh,
    initiateCall,
    endCall,
  }
}

export default useCalls
