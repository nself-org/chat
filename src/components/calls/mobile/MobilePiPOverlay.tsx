'use client'

/**
 * Mobile Picture-in-Picture Overlay
 *
 * Draggable floating call window that appears when the app is minimized
 * or when user switches away from the call screen.
 */

import * as React from 'react'
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Maximize2,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react'
import { useCallStore } from '@/stores/call-store'
import { formatCallDuration } from '@/components/call/call-controls'

// =============================================================================
// Types
// =============================================================================

export interface MobilePiPOverlayProps {
  /** Whether PiP is active */
  isActive: boolean
  /** Callback when overlay is expanded */
  onExpand: () => void
  /** Callback when call is ended */
  onEndCall?: () => void
  /** Additional class name */
  className?: string
}

// =============================================================================
// Constants
// =============================================================================

const PIP_WIDTH = 160
const PIP_HEIGHT = 220
const EDGE_MARGIN = 16
const SNAP_THRESHOLD = 50

// =============================================================================
// Mobile PiP Overlay Component
// =============================================================================

export function MobilePiPOverlay({
  isActive,
  onExpand,
  onEndCall,
  className,
}: MobilePiPOverlayProps) {
  const activeCall = useCallStore((state) => state.activeCall)
  const toggleLocalMute = useCallStore((state) => state.toggleLocalMute)
  const toggleLocalVideo = useCallStore((state) => state.toggleLocalVideo)

  const [callDuration, setCallDuration] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [position, setPosition] = React.useState({ x: EDGE_MARGIN, y: 100 })

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)
  const controls = useAnimation()

  // Update video stream
  React.useEffect(() => {
    if (!videoRef.current || !activeCall?.localStream) return

    videoRef.current.srcObject = activeCall.localStream
  }, [activeCall?.localStream])

  // Update call duration
  React.useEffect(() => {
    if (!activeCall || activeCall.state !== 'connected') return

    const interval = setInterval(() => {
      if (activeCall.connectedAt) {
        const duration = Math.floor(
          (Date.now() - new Date(activeCall.connectedAt).getTime()) / 1000
        )
        setCallDuration(duration)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeCall])

  // Handle drag end - snap to edges
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const currentX = info.point.x
    const currentY = info.point.y

    let newX = currentX
    let newY = currentY

    // Snap to left or right edge
    if (currentX < windowWidth / 2) {
      newX = EDGE_MARGIN
    } else {
      newX = windowWidth - PIP_WIDTH - EDGE_MARGIN
    }

    // Constrain Y within bounds
    newY = Math.max(EDGE_MARGIN, Math.min(currentY, windowHeight - PIP_HEIGHT - EDGE_MARGIN))

    setPosition({ x: newX, y: newY })
    controls.start({ x: newX, y: newY })

    // Light haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  // Handle tap - toggle expanded state
  const handleTap = () => {
    setIsExpanded((prev) => !prev)
  }

  // Handle double tap - expand to full screen
  const handleDoubleTap = () => {
    onExpand()
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10])
    }
  }

  // Handle end call
  const handleEndCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEndCall?.()
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  if (!isActive || !activeCall) {
    return null
  }

  const isVideoCall = activeCall.type === 'video'
  const isMuted = activeCall.isLocalMuted
  const isVideoEnabled = activeCall.isLocalVideoEnabled
  const participants = Array.from(activeCall.participants.values())
  const participant = participants[0]

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: EDGE_MARGIN,
        left: EDGE_MARGIN,
        right: window.innerWidth - PIP_WIDTH - EDGE_MARGIN,
        bottom: window.innerHeight - PIP_HEIGHT - EDGE_MARGIN,
      }}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      onDoubleTap={handleDoubleTap}
      animate={controls}
      initial={{ x: position.x, y: position.y }}
      style={{ x, y }}
      className={cn(
        'fixed z-50 cursor-move touch-none',
        'rounded-2xl overflow-hidden shadow-2xl',
        'bg-gray-900',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Video/Avatar */}
      <div className="relative w-40 h-56 bg-gray-800">
        {isVideoCall && isVideoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-semibold">
              {participant?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse" />
          <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-mono">
              {formatCallDuration(callDuration)}
            </span>
          </div>
        </div>

        {/* Participant Name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">
            {participant?.name || 'Unknown'}
          </p>
        </div>

        {/* Mute Indicator */}
        {isMuted && (
          <div className="absolute bottom-2 right-2 bg-red-500 rounded-full p-1.5">
            <MicOff size={12} className="text-white" />
          </div>
        )}
      </div>

      {/* Expanded Controls */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm"
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-around p-3">
          {/* Mute */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleLocalMute()
            }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isMuted ? 'bg-red-500' : 'bg-gray-700'
            )}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Video Toggle */}
          {isVideoCall && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleLocalVideo()
              }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isVideoEnabled ? 'bg-blue-500' : 'bg-gray-700'
              )}
              aria-label={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
          )}

          {/* Expand */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onExpand()
            }}
            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"
            aria-label="Expand"
          >
            <Maximize2 size={16} />
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
            aria-label="End Call"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </motion.div>

      {/* Tap Indicator (shown briefly) */}
      <motion.div
        className="absolute inset-0 border-2 border-white rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 0 : 0 }}
      />
    </motion.div>
  )
}

// =============================================================================
// Exports
// =============================================================================

export default MobilePiPOverlay
