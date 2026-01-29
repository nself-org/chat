'use client'

// ===============================================================================
// Telegram Composer Component
// ===============================================================================
//
// The message input area with attachment button, text input,
// emoji button, and send/voice button.
//
// ===============================================================================

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { TELEGRAM_COLORS } from '../config'
import {
  Paperclip,
  Smile,
  Send,
  Mic,
  X,
  Image,
  File,
  Music,
  MapPin,
  Camera,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TelegramComposerProps {
  value?: string
  onChange?: (value: string) => void
  onSend?: (message: string) => void
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
  onAttachClick?: () => void
  onEmojiClick?: () => void
  onStickerClick?: () => void
  replyTo?: {
    senderName: string
    content: string
    color?: string
  }
  onCancelReply?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TelegramComposer({
  value = '',
  onChange,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  onAttachClick,
  onEmojiClick,
  onStickerClick,
  replyTo,
  onCancelReply,
  placeholder = 'Message',
  disabled = false,
  className,
}: TelegramComposerProps) {
  const [internalValue, setInternalValue] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentValue = value || internalValue
  const hasText = currentValue.trim().length > 0

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange?.(newValue)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (hasText && !disabled) {
      onSend?.(currentValue)
      setInternalValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  return (
    <div className={cn('bg-white dark:bg-[#17212B]', className)}>
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-[#232E3C]">
          <div
            className="w-1 h-full min-h-[32px] rounded"
            style={{ backgroundColor: replyTo.color || TELEGRAM_COLORS.telegramBlue }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium"
              style={{ color: replyTo.color || TELEGRAM_COLORS.telegramBlue }}
            >
              {replyTo.senderName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {replyTo.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 px-4 py-2 border-t border-gray-200 dark:border-[#232E3C]">
        {/* Attachment Button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={cn(
              'p-2 rounded-full transition-colors',
              showAttachMenu
                ? 'bg-[#2AABEE] text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#232E3C]'
            )}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Attachment Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-[#17212B] rounded-lg shadow-lg border border-gray-200 dark:border-[#232E3C] py-2 min-w-[180px]">
              <AttachMenuItem icon={<Image className="w-5 h-5" />} label="Photo" />
              <AttachMenuItem icon={<File className="w-5 h-5" />} label="Document" />
              <AttachMenuItem icon={<Camera className="w-5 h-5" />} label="Camera" />
              <AttachMenuItem icon={<Music className="w-5 h-5" />} label="Music" />
              <AttachMenuItem icon={<MapPin className="w-5 h-5" />} label="Location" />
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 bg-gray-100 dark:bg-[#232E3C] rounded-2xl">
          <textarea
            ref={textareaRef}
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 resize-none',
              'bg-transparent text-gray-900 dark:text-white',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none',
              'min-h-[44px] max-h-[200px]'
            )}
          />
        </div>

        {/* Emoji Button */}
        <button
          onClick={onEmojiClick}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#232E3C]"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Send or Voice Button */}
        {hasText ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-2 rounded-full text-white"
            style={{ backgroundColor: TELEGRAM_COLORS.telegramBlue }}
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            onMouseDown={onVoiceStart}
            onMouseUp={onVoiceEnd}
            onMouseLeave={onVoiceEnd}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#232E3C]"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

function AttachMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-700 dark:text-gray-300"
    >
      <span className="text-[#2AABEE]">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

export default TelegramComposer
