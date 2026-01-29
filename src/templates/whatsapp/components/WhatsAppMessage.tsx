'use client'

// ===============================================================================
// WhatsApp Message Component
// ===============================================================================
//
// A WhatsApp-style bubble message with tail, checkmarks, and reactions.
//
// ===============================================================================

import { cn } from '@/lib/utils'
import { WHATSAPP_COLORS } from '../config'
import { Check, CheckCheck, Clock, Star, Reply, Forward } from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface WhatsAppMessageProps {
  id: string
  content: string
  timestamp: Date
  isOwn?: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  isEdited?: boolean
  isStarred?: boolean
  sender?: {
    name: string
    color?: string
  }
  replyTo?: {
    senderName: string
    content: string
    color?: string
  }
  forwardedFrom?: string
  reactions?: WhatsAppReaction[]
  attachments?: WhatsAppAttachment[]
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
  onReactionAdd?: (emoji: string) => void
  onReplyClick?: () => void
  onStarClick?: () => void
  className?: string
}

export interface WhatsAppReaction {
  emoji: string
  count: number
  hasReacted: boolean
}

export interface WhatsAppAttachment {
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

export function WhatsAppMessage({
  id,
  content,
  timestamp,
  isOwn = false,
  status = 'read',
  isEdited,
  isStarred,
  sender,
  replyTo,
  forwardedFrom,
  reactions = [],
  attachments = [],
  isFirstInGroup = true,
  isLastInGroup = true,
  onReactionAdd,
  onReplyClick,
  onStarClick,
  className,
}: WhatsAppMessageProps) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
      case 'sent':
        return <Check className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
      case 'delivered':
        return <CheckCheck className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
      case 'read':
        return (
          <CheckCheck
            className="w-4 h-4"
            style={{ color: WHATSAPP_COLORS.checkBlue }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'flex px-[5%]',
        isOwn ? 'justify-end' : 'justify-start',
        isFirstInGroup ? 'mt-2' : 'mt-0.5',
        className
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[65%] min-w-[80px] px-2 py-1 shadow-sm',
          isOwn
            ? 'rounded-lg rounded-tr-none'
            : 'rounded-lg rounded-tl-none'
        )}
        style={{
          backgroundColor: isOwn
            ? WHATSAPP_COLORS.bubbleOutgoingDark
            : WHATSAPP_COLORS.bubbleIncomingDark,
        }}
      >
        {/* Tail */}
        {isLastInGroup && (
          <div
            className={cn(
              'absolute top-0 w-3 h-3',
              isOwn ? '-right-2' : '-left-2'
            )}
            style={{
              background: isOwn
                ? WHATSAPP_COLORS.bubbleOutgoingDark
                : WHATSAPP_COLORS.bubbleIncomingDark,
              clipPath: isOwn
                ? 'polygon(0 0, 100% 0, 0 100%)'
                : 'polygon(100% 0, 0 0, 100% 100%)',
            }}
          />
        )}

        {/* Forward Header */}
        {forwardedFrom && (
          <div
            className="flex items-center gap-1 mb-1 text-xs italic"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <Forward className="w-3 h-3" />
            Forwarded
          </div>
        )}

        {/* Reply Preview */}
        {replyTo && (
          <button
            onClick={onReplyClick}
            className={cn(
              'flex flex-col w-full text-left px-2 py-1 mb-1 rounded',
              'border-l-4 bg-black/20'
            )}
            style={{ borderLeftColor: replyTo.color || WHATSAPP_COLORS.primaryGreen }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: replyTo.color || WHATSAPP_COLORS.primaryGreen }}
            >
              {replyTo.senderName}
            </span>
            <span className="text-xs text-white/60 truncate">
              {replyTo.content}
            </span>
          </button>
        )}

        {/* Sender Name (group chats) */}
        {!isOwn && sender && isFirstInGroup && (
          <div
            className="text-xs font-medium mb-0.5"
            style={{ color: sender.color || '#35CD96' }}
          >
            {sender.name}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-1">
            {attachments.map((attachment, index) => (
              <AttachmentPreview key={index} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="flex items-end gap-1">
          <p
            className="text-[14.2px] whitespace-pre-wrap break-words"
            style={{ color: WHATSAPP_COLORS.textPrimaryDark }}
          >
            {content}
          </p>

          {/* Spacer for meta info */}
          <span className="flex-shrink-0 w-[70px]" />
        </div>

        {/* Meta info (time, status, star) - positioned absolutely */}
        <span
          className="absolute bottom-1 right-2 flex items-center gap-1"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {isStarred && <Star className="w-3 h-3 fill-current" />}
          <span className="text-[11px]">{formatTime(timestamp)}</span>
          {isOwn && getStatusIcon()}
        </span>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div
            className="absolute -bottom-3 right-2 flex items-center gap-0.5 px-1 py-0.5 rounded-full shadow-md"
            style={{ backgroundColor: WHATSAPP_COLORS.bubbleIncomingDark }}
          >
            {reactions.map((reaction, index) => (
              <span key={index} className="text-sm">
                {reaction.emoji}
              </span>
            ))}
            {reactions.reduce((acc, r) => acc + r.count, 0) > 1 && (
              <span className="text-xs text-white/60 ml-0.5">
                {reactions.reduce((acc, r) => acc + r.count, 0)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function AttachmentPreview({ attachment }: { attachment: WhatsAppAttachment }) {
  if (attachment.type === 'image') {
    return (
      <div className="rounded overflow-hidden -mx-1 -mt-0.5 mb-1">
        <img
          src={attachment.url}
          alt={attachment.name || 'Image'}
          className="max-w-full h-auto"
          style={{ maxHeight: 330 }}
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

  return (
    <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
      <div
        className="w-10 h-10 rounded flex items-center justify-center"
        style={{ backgroundColor: WHATSAPP_COLORS.primaryGreen }}
      >
        <span className="text-white text-xs font-bold">
          {attachment.name?.split('.').pop()?.toUpperCase() || 'FILE'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">
          {attachment.name || 'File'}
        </div>
        {attachment.size && (
          <div className="text-xs text-white/60">
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

export default WhatsAppMessage
