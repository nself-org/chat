'use client'

// ===============================================================================
// Slack Huddle Component
// ===============================================================================
//
// The Slack Huddle audio/video call UI that appears at the bottom of the
// sidebar when in an active huddle.
//
// ===============================================================================

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { slackColors } from '../config'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface SlackHuddleProps {
  isActive?: boolean
  channelName?: string
  participants?: SlackHuddleParticipant[]
  isMuted?: boolean
  isVideoOn?: boolean
  isScreenSharing?: boolean
  onMuteToggle?: () => void
  onVideoToggle?: () => void
  onScreenShareToggle?: () => void
  onLeave?: () => void
  onInvite?: () => void
  className?: string
}

export interface SlackHuddleParticipant {
  id: string
  name: string
  avatar?: string
  isSpeaking?: boolean
  isMuted?: boolean
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function SlackHuddle({
  isActive = false,
  channelName = 'general',
  participants = [],
  isMuted = false,
  isVideoOn = false,
  isScreenSharing = false,
  onMuteToggle,
  onVideoToggle,
  onScreenShareToggle,
  onLeave,
  onInvite,
  className,
}: SlackHuddleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isActive) return null

  return (
    <div
      className={cn(
        'border-t border-white/10',
        'bg-[#350D36]',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: slackColors.green }}
            >
              <Mic className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">Huddle</div>
            <div className="text-xs text-white/60">#{channelName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">{participants.length}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/60" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Participants */}
          <div className="flex flex-wrap gap-2 mb-4">
            {participants.map((participant) => (
              <ParticipantAvatar
                key={participant.id}
                participant={participant}
              />
            ))}
            <button
              onClick={onInvite}
              className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <HuddleButton
              icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              isActive={!isMuted}
              onClick={onMuteToggle}
              tooltip={isMuted ? 'Unmute' : 'Mute'}
            />
            <HuddleButton
              icon={isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              isActive={isVideoOn}
              onClick={onVideoToggle}
              tooltip={isVideoOn ? 'Turn off video' : 'Turn on video'}
            />
            <HuddleButton
              icon={<Monitor className="w-5 h-5" />}
              isActive={isScreenSharing}
              onClick={onScreenShareToggle}
              tooltip={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            />
            <HuddleButton
              icon={<MoreHorizontal className="w-5 h-5" />}
              isActive={false}
              onClick={() => {}}
              tooltip="More options"
            />
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              onClick={onLeave}
              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Compact Controls (when collapsed) */}
      {!isExpanded && (
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          <HuddleButton
            icon={isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            isActive={!isMuted}
            onClick={onMuteToggle}
            tooltip={isMuted ? 'Unmute' : 'Mute'}
            size="sm"
          />
          <button
            onClick={onLeave}
            className="px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
          >
            Leave
          </button>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function ParticipantAvatar({
  participant,
}: {
  participant: SlackHuddleParticipant
}) {
  return (
    <div className="relative">
      <div
        className={cn(
          'w-8 h-8 rounded-full overflow-hidden ring-2',
          participant.isSpeaking ? 'ring-green-400' : 'ring-transparent'
        )}
      >
        {participant.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: slackColors.aubergineLight }}
          >
            {participant.name[0]?.toUpperCase()}
          </div>
        )}
      </div>
      {participant.isMuted && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#350D36] flex items-center justify-center">
          <MicOff className="w-2.5 h-2.5 text-white/70" />
        </div>
      )}
    </div>
  )
}

function HuddleButton({
  icon,
  isActive,
  onClick,
  tooltip,
  size = 'md',
}: {
  icon: React.ReactNode
  isActive: boolean
  onClick?: () => void
  tooltip: string
  size?: 'sm' | 'md'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  }

  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'rounded-full flex items-center justify-center transition-colors',
        sizeClasses[size],
        isActive
          ? 'bg-white/20 text-white'
          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
      )}
    >
      {icon}
    </button>
  )
}

export default SlackHuddle
