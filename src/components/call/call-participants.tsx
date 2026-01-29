/**
 * Call Participants Component
 *
 * Displays participants in a grid layout for group calls,
 * with video streams or avatars.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Monitor, User } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface Participant {
  id: string
  name: string
  avatarUrl?: string
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isSpeaking: boolean
  stream?: MediaStream
}

export interface CallParticipantsProps {
  participants: Participant[]
  callType: 'voice' | 'video'
  isScreenSharing?: boolean
  className?: string
}

// =============================================================================
// Participant Video Component
// =============================================================================

interface ParticipantVideoProps {
  participant: Participant
  callType: 'voice' | 'video'
  layout: 'grid' | 'spotlight'
  className?: string
}

function ParticipantVideo({
  participant,
  callType,
  layout,
  className,
}: ParticipantVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Attach stream to video element
  React.useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  const showVideo = callType === 'video' && participant.isVideoEnabled && participant.stream

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden bg-muted',
        'flex items-center justify-center',
        layout === 'grid' ? 'aspect-video' : 'w-full h-full',
        participant.isSpeaking && 'ring-4 ring-green-500',
        className
      )}
    >
      {/* Video Stream */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        /* Avatar Fallback */
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center overflow-hidden">
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">{participant.name}</span>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white truncate">
            {participant.name}
          </span>
          <div className="flex items-center gap-1">
            {participant.isScreenSharing && (
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Monitor className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center',
                participant.isMuted ? 'bg-red-500' : 'bg-transparent'
              )}
            >
              {participant.isMuted ? (
                <MicOff className="h-3 w-3 text-white" />
              ) : participant.isSpeaking ? (
                <Mic className="h-3 w-3 text-green-500 animate-pulse" />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Call Participants Component
// =============================================================================

export function CallParticipants({
  participants,
  callType,
  isScreenSharing = false,
  className,
}: CallParticipantsProps) {
  const participantCount = participants.length

  // Determine layout based on participant count
  const getGridLayout = () => {
    if (participantCount === 1) {
      return 'grid-cols-1'
    } else if (participantCount === 2) {
      return 'grid-cols-2'
    } else if (participantCount <= 4) {
      return 'grid-cols-2 grid-rows-2'
    } else if (participantCount <= 6) {
      return 'grid-cols-3 grid-rows-2'
    } else if (participantCount <= 9) {
      return 'grid-cols-3 grid-rows-3'
    } else {
      return 'grid-cols-4 grid-rows-3'
    }
  }

  // If someone is screen sharing, show spotlight layout
  const screenSharingParticipant = participants.find((p) => p.isScreenSharing)

  if (screenSharingParticipant && isScreenSharing) {
    const otherParticipants = participants.filter((p) => !p.isScreenSharing)

    return (
      <div className={cn('flex gap-4 h-full', className)}>
        {/* Main Screen Share */}
        <div className="flex-1">
          <ParticipantVideo
            participant={screenSharingParticipant}
            callType={callType}
            layout="spotlight"
          />
        </div>

        {/* Sidebar with other participants */}
        {otherParticipants.length > 0 && (
          <div className="w-64 flex flex-col gap-2 overflow-y-auto">
            {otherParticipants.map((participant) => (
              <ParticipantVideo
                key={participant.id}
                participant={participant}
                callType={callType}
                layout="grid"
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Grid layout for normal calls
  return (
    <div
      className={cn(
        'grid gap-4 w-full h-full auto-rows-fr',
        getGridLayout(),
        'p-4',
        className
      )}
    >
      {participants.map((participant) => (
        <ParticipantVideo
          key={participant.id}
          participant={participant}
          callType={callType}
          layout="grid"
        />
      ))}
    </div>
  )
}

CallParticipants.displayName = 'CallParticipants'

// =============================================================================
// Empty State
// =============================================================================

export function EmptyCallState({ message = 'Waiting for participants to join...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <User className="h-16 w-16" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
