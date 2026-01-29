'use client'

// ===============================================================================
// Telegram Message Component
// ===============================================================================
//
// A Telegram-style bubble message with tail, checkmarks, and reactions.
//
// ===============================================================================

import { cn } from '@/lib/utils'
import { TELEGRAM_COLORS, TELEGRAM_BUBBLES } from '../config'
import { Check, CheckCheck, Clock, Reply, Forward } from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TelegramMessageProps {
  id: string
  content: string
  timestamp: Date
  isOwn?: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  isEdited?: boolean
  sender?: {
    name: string
    avatar?: string
    color?: string
  }
  replyTo?: {
    senderName: string
    content: string
    color?: string
  }
  forwardedFrom?: string
  reactions?: TelegramReaction[]
  attachments?: TelegramAttachment[]
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
  onReactionAdd?: (emoji: string) => void
  onReplyClick?: () => void
  className?: string
}

export interface TelegramReaction {
  emoji: string
  count: number
  hasReacted: boolean
}

export interface TelegramAttachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'voice' | 'sticker'
  url: string
  name?: string
  size?: number
  duration?: number
  thumbnail?: string
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TelegramMessage({
  id,
  content,
  timestamp,
  isOwn = false,
  status = 'read',
  isEdited,
  sender,
  replyTo,
  forwardedFrom,
  reactions = [],
  attachments = [],
  isFirstInGroup = true,
  isLastInGroup = true,
  onReactionAdd,
  onReplyClick,
  className,
}: TelegramMessageProps) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3.5 h-3.5 text-white/60" />
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-white/60" />
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-white/60" />
      case 'read':
        return (
          <CheckCheck
            className="w-3.5 h-3.5"
            style={{ color: TELEGRAM_COLORS.checkRead }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'flex px-4',
        isOwn ? 'justify-end' : 'justify-start',
        isFirstInGroup ? 'mt-2' : 'mt-0.5',
        className
      )}
    >
      {/* Avatar (group chats only, for others' messages) */}
      {!isOwn && sender && isLastInGroup && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {sender.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: sender.color || TELEGRAM_COLORS.telegramBlue }}
              >
                {sender.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer for non-last messages in group */}
      {!isOwn && sender && !isLastInGroup && (
        <div className="w-8 mr-2 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[75%] min-w-[60px] px-3 py-1.5',
          isOwn
            ? 'bg-[#EFFDDE] dark:bg-[#2B5278]'
            : 'bg-white dark:bg-[#182533]',
          // Border radius with tail
          isOwn
            ? isLastInGroup
              ? 'rounded-2xl rounded-br-sm'
              : 'rounded-2xl'
            : isLastInGroup
            ? 'rounded-2xl rounded-bl-sm'
            : 'rounded-2xl',
          'shadow-sm'
        )}
      >
        {/* Forward Header */}
        {forwardedFrom && (
          <div className="flex items-center gap-1 mb-1">
            <Forward className="w-3.5 h-3.5 text-[#2AABEE]" />
            <span className="text-xs font-medium text-[#2AABEE]">
              Forwarded from {forwardedFrom}
            </span>
          </div>
        )}

        {/* Reply Preview */}
        {replyTo && (
          <button
            onClick={onReplyClick}
            className={cn(
              'flex flex-col w-full text-left px-2 py-1 mb-1 -mx-1 rounded',
              'border-l-2 bg-black/5 dark:bg-white/5',
              'hover:bg-black/10 dark:hover:bg-white/10 transition-colors'
            )}
            style={{ borderLeftColor: replyTo.color || TELEGRAM_COLORS.telegramBlue }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: replyTo.color || TELEGRAM_COLORS.telegramBlue }}
            >
              {replyTo.senderName}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {replyTo.content}
            </span>
          </button>
        )}

        {/* Sender Name (group chats) */}
        {!isOwn && sender && isFirstInGroup && (
          <div
            className="text-sm font-medium mb-0.5"
            style={{ color: sender.color || TELEGRAM_COLORS.telegramBlue }}
          >
            {sender.name}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-1 -mx-1">
            {attachments.map((attachment, index) => (
              <AttachmentPreview key={index} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="flex items-end gap-1">
          <p
            className={cn(
              'text-[15px] whitespace-pre-wrap break-words',
              isOwn ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
            )}
          >
            {content}
          </p>

          {/* Time & Status */}
          <span className="flex items-center gap-0.5 flex-shrink-0 ml-1 self-end">
            {isEdited && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-0.5">
                edited
              </span>
            )}
            <span
              className={cn(
                'text-[11px]',
                isOwn ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {formatTime(timestamp)}
            </span>
            {isOwn && getStatusIcon()}
          </span>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 -mb-0.5">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => onReactionAdd?.(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs',
                  reaction.hasReacted
                    ? 'bg-[#2AABEE]/20 text-[#2AABEE]'
                    : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function AttachmentPreview({ attachment }: { attachment: TelegramAttachment }) {
  if (attachment.type === 'image') {
    return (
      <div className="rounded-lg overflow-hidden">
        <img
          src={attachment.url}
          alt={attachment.name || 'Image'}
          className="max-w-full h-auto"
          style={{ maxHeight: 320 }}
        />
      </div>
    )
  }

  if (attachment.type === 'sticker') {
    return (
      <div className="w-[200px] h-[200px]">
        <img
          src={attachment.url}
          alt="Sticker"
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  // Document/file preview
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
      <div className="w-10 h-10 rounded bg-[#2AABEE] flex items-center justify-center">
        <span className="text-white text-xs font-bold">
          {attachment.name?.split('.').pop()?.toUpperCase() || 'FILE'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {attachment.name || 'File'}
        </div>
        {attachment.size && (
          <div className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </div>
        )}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default TelegramMessage
