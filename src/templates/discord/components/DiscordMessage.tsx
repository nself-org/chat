'use client'

// ===============================================================================
// Discord Message Component
// ===============================================================================
//
// A Discord-style message with avatar, role-colored username,
// timestamp, reactions, and hover action bar.
//
// ===============================================================================

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { discordColors } from '../config'
import {
  Smile,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Reply,
  Pencil,
  Trash2,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface DiscordMessageProps {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  roleColor?: string
  isBot?: boolean
  content: string
  timestamp: Date
  isEdited?: boolean
  isPinned?: boolean
  isReply?: boolean
  replyTo?: {
    userName: string
    content: string
  }
  isFirstInGroup?: boolean
  reactions?: DiscordReaction[]
  attachments?: DiscordAttachment[]
  onReactionAdd?: (emoji: string) => void
  onReactionRemove?: (emoji: string) => void
  onReplyClick?: () => void
  onEditClick?: () => void
  onDeleteClick?: () => void
  onPinClick?: () => void
  className?: string
}

export interface DiscordReaction {
  emoji: string
  count: number
  hasReacted: boolean
}

export interface DiscordAttachment {
  type: 'image' | 'video' | 'file' | 'embed'
  url: string
  name?: string
  width?: number
  height?: number
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function DiscordMessage({
  id,
  userId,
  userName,
  userAvatar,
  roleColor,
  isBot,
  content,
  timestamp,
  isEdited,
  isPinned,
  isReply,
  replyTo,
  isFirstInGroup = true,
  reactions = [],
  attachments = [],
  onReactionAdd,
  onReactionRemove,
  onReplyClick,
  onEditClick,
  onDeleteClick,
  onPinClick,
  className,
}: DiscordMessageProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`
    }

    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'group relative py-0.5 pl-[72px] pr-12',
        'hover:bg-[#2E3035] transition-colors',
        isPinned && 'bg-[#444] border-l-2 border-yellow-500',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Hover Actions */}
      {showActions && (
        <div
          className="absolute -top-4 right-4 flex items-center bg-[#2B2D31] rounded shadow-lg border border-[#1E1F22] z-10"
        >
          <ActionButton
            icon={<Smile className="w-5 h-5" />}
            onClick={() => onReactionAdd?.('👍')}
          />
          <ActionButton icon={<Reply className="w-5 h-5" />} onClick={onReplyClick} />
          <ActionButton icon={<Pin className="w-5 h-5" />} onClick={onPinClick} />
          <ActionButton icon={<Pencil className="w-5 h-5" />} onClick={onEditClick} />
          <ActionButton
            icon={<Trash2 className="w-5 h-5" />}
            onClick={onDeleteClick}
            danger
          />
          <ActionButton icon={<MoreHorizontal className="w-5 h-5" />} />
        </div>
      )}

      {/* Reply Reference */}
      {isReply && replyTo && (
        <div className="flex items-center gap-1 mb-1 ml-[-52px] text-sm">
          <div className="w-8 h-5 flex items-center justify-center">
            <div className="w-6 h-3 border-l-2 border-t-2 border-gray-500 rounded-tl" />
          </div>
          <span className="text-gray-400">@{replyTo.userName}</span>
          <span className="text-gray-500 truncate max-w-[300px]">{replyTo.content}</span>
        </div>
      )}

      {/* Avatar (only for first message in group) */}
      {isFirstInGroup && (
        <div className="absolute left-4 top-1">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: roleColor || discordColors.blurple }}
              >
                {userName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div>
        {/* Header (only for first message in group) */}
        {isFirstInGroup && (
          <div className="flex items-center gap-2 mb-0.5">
            <button
              className="font-medium hover:underline"
              style={{ color: roleColor || discordColors.gray100 }}
            >
              {userName}
            </button>
            {isBot && (
              <span
                className="px-1 py-0.5 rounded text-[10px] font-semibold uppercase"
                style={{ backgroundColor: discordColors.blurple, color: 'white' }}
              >
                BOT
              </span>
            )}
            <span className="text-xs" style={{ color: discordColors.gray400 }}>
              {formatTimestamp(timestamp)}
            </span>
          </div>
        )}

        {/* Compact timestamp (for grouped messages) */}
        {!isFirstInGroup && (
          <span className="absolute left-0 w-[72px] text-center text-[10px] text-gray-500 opacity-0 group-hover:opacity-100">
            {timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        )}

        {/* Text Content */}
        <div style={{ color: discordColors.gray100 }} className="whitespace-pre-wrap break-words">
          {content}
          {isEdited && (
            <span className="text-xs text-gray-500 ml-1">(edited)</span>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="rounded overflow-hidden max-w-[400px]"
              >
                {attachment.type === 'image' && (
                  <img
                    src={attachment.url}
                    alt={attachment.name || 'Image'}
                    className="max-w-full h-auto rounded"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() =>
                  reaction.hasReacted
                    ? onReactionRemove?.(reaction.emoji)
                    : onReactionAdd?.(reaction.emoji)
                }
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm',
                  'border transition-colors',
                  reaction.hasReacted
                    ? 'bg-[#5865F233] border-[#5865F2] text-[#DEE0FC]'
                    : 'bg-[#2B2D31] border-[#1E1F22] text-gray-300 hover:border-gray-500'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
            <button
              onClick={() => onReactionAdd?.('👍')}
              className="w-7 h-7 rounded bg-[#2B2D31] border border-[#1E1F22] text-gray-500 hover:text-gray-300 flex items-center justify-center"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  onClick,
  danger = false,
}: {
  icon: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 transition-colors',
        danger
          ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      )}
    >
      {icon}
    </button>
  )
}

export default DiscordMessage
