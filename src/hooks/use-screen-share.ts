/**
 * Screen Share Hook
 *
 * Manages screen sharing functionality independently or as part of a call.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MediaManager,
  createMediaManager,
  type ScreenShareOptions,
  DEFAULT_SCREEN_SHARE_OPTIONS,
} from '@/lib/webrtc/media-manager'
import { useCallStore } from '@/stores/call-store'

// =============================================================================
// Types
// =============================================================================

export interface UseScreenShareOptions {
  onScreenShareStarted?: (stream: MediaStream) => void
  onScreenShareStopped?: () => void
  onError?: (error: Error) => void
}

export interface UseScreenShareReturn {
  // State
  isScreenSharing: boolean
  screenStream: MediaStream | null
  error: string | null

  // Actions
  startScreenShare: (options?: ScreenShareOptions) => Promise<MediaStream | null>
  stopScreenShare: () => void

  // Helper
  isSupported: boolean
}

// =============================================================================
// Hook
// =============================================================================

export function useScreenShare(options: UseScreenShareOptions = {}): UseScreenShareReturn {
  const { onScreenShareStarted, onScreenShareStopped, onError } = options

  // Store
  const activeCall = useCallStore((state) => state.activeCall)
  const setLocalScreenSharing = useCallStore((state) => state.setLocalScreenSharing)

  // Local state
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const mediaManagerRef = useRef<MediaManager | null>(null)

  // Check if screen sharing is supported
  const isSupported =
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices

  // ==========================================================================
  // Start Screen Share
  // ==========================================================================

  const startScreenShare = useCallback(
    async (shareOptions: ScreenShareOptions = DEFAULT_SCREEN_SHARE_OPTIONS) => {
      if (!isSupported) {
        const err = new Error('Screen sharing is not supported in this browser')
        setError(err.message)
        onError?.(err)
        return null
      }

      try {
        setError(null)

        // Initialize media manager if not exists
        if (!mediaManagerRef.current) {
          mediaManagerRef.current = createMediaManager({
            onStreamError: (err) => {
              setError(err.message)
              onError?.(err)
            },
            onTrackEnded: () => {
              // Screen share was stopped (e.g., user clicked browser's stop button)
              stopScreenShare()
            },
          })
        }

        // Get display media
        const stream = await mediaManagerRef.current.getDisplayMedia(shareOptions)

        // Handle track ended (user stops sharing from browser UI)
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            stopScreenShare()
          }
        })

        setScreenStream(stream)
        setIsScreenSharing(true)
        setLocalScreenSharing(true)
        onScreenShareStarted?.(stream)

        return stream
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to start screen share')
        setError(error.message)
        onError?.(error)
        return null
      }
    },
    [isSupported, onError, onScreenShareStarted, setLocalScreenSharing]
  )

  // ==========================================================================
  // Stop Screen Share
  // ==========================================================================

  const stopScreenShare = useCallback(() => {
    if (mediaManagerRef.current) {
      mediaManagerRef.current.stopScreenShare()
    }

    setScreenStream(null)
    setIsScreenSharing(false)
    setLocalScreenSharing(false)
    onScreenShareStopped?.()
  }, [onScreenShareStopped, setLocalScreenSharing])

  // ==========================================================================
  // Cleanup on unmount
  // ==========================================================================

  useEffect(() => {
    return () => {
      if (mediaManagerRef.current) {
        mediaManagerRef.current.stopScreenShare()
        mediaManagerRef.current = null
      }
    }
  }, [])

  // ==========================================================================
  // Auto-stop when call ends
  // ==========================================================================

  useEffect(() => {
    if (!activeCall && isScreenSharing) {
      stopScreenShare()
    }
  }, [activeCall, isScreenSharing, stopScreenShare])

  return {
    isScreenSharing,
    screenStream,
    error,
    startScreenShare,
    stopScreenShare,
    isSupported,
  }
}
