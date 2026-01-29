'use client'

// ===============================================================================
// Telegram Chat View Component
// ===============================================================================
//
// The main chat view area with header, messages, and input area.
//
// ===============================================================================

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TELEGRAM_COLORS } from '../config'
import {
  ArrowLeft,
  Search,
  Phone,
  MoreVertical,
  Lock,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TelegramChatViewProps {
  chatId?: string
  chatName?: string
  chatAvatar?: string
  chatType?: 'private' | 'group' | 'supergroup' | 'channel' | 'secret' | 'bot'
  memberCount?: number
  isOnline?: boolean
  lastSeen?: string
  children?: ReactNode
  composer?: ReactNode
  onBackClick?: () => void
  onSearchClick?: () => void
  onCallClick?: () => void
  onMenuClick?: () => void
  onHeaderClick?: () => void
  className?: string
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TelegramChatView({
  chatId,
  chatName = 'Chat',
  chatAvatar,
  chatType = 'private',
  memberCount,
  isOnline,
  lastSeen,
  children,
  composer,
  onBackClick,
  onSearchClick,
  onCallClick,
  onMenuClick,
  onHeaderClick,
  className,
}: TelegramChatViewProps) {
  const getSubtitle = () => {
    if (chatType === 'secret') {
      return 'Secret chat'
    }
    if (chatType === 'channel') {
      return memberCount ? `${memberCount.toLocaleString()} subscribers` : 'Channel'
    }
    if (chatType === 'group' || chatType === 'supergroup') {
      return memberCount ? `${memberCount.toLocaleString()} members` : 'Group'
    }
    if (chatType === 'bot') {
      return 'bot'
    }
    if (isOnline) {
      return 'online'
    }
    return lastSeen || 'last seen recently'
  }

  if (!chatId) {
    return (
      <div
        className={cn(
          'flex-1 flex items-center justify-center',
          'bg-[#EFEAE2] dark:bg-[#0E1621]',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">
          Select a chat to start messaging
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-[#EFEAE2] dark:bg-[#0E1621]',
        className
      )}
    >
      {/* Header */}
      <header
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#17212B] shadow-sm"
        style={{ minHeight: 56 }}
      >
        {/* Back Button (mobile) */}
        <button
          onClick={onBackClick}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-600 dark:text-gray-400 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar & Info */}
        <button
          onClick={onHeaderClick}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {chatAvatar ? (
                <img
                  src={chatAvatar}
                  alt={chatName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: TELEGRAM_COLORS.telegramBlue }}
                >
                  {chatName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {chatType === 'secret' && (
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: TELEGRAM_COLORS.online }}
              >
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          <div className="text-left min-w-0">
            <h1 className="font-medium text-gray-900 dark:text-white truncate">
              {chatName}
            </h1>
            <p
              className={cn(
                'text-sm truncate',
                isOnline
                  ? 'text-[#2AABEE]'
                  : chatType === 'secret'
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {getSubtitle()}
            </p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-600 dark:text-gray-400"
          >
            <Search className="w-5 h-5" />
          </button>
          {chatType === 'private' && (
            <button
              onClick={onCallClick}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-600 dark:text-gray-400"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232E3C] text-gray-600 dark:text-gray-400"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Composer */}
      {composer}
    </div>
  )
}

export default TelegramChatView
