'use client'

// ===============================================================================
// Telegram Folders Component
// ===============================================================================
//
// The folder tabs at the top of the chat list for organizing chats
// (All Chats, Personal, Work, Channels, etc.)
//
// ===============================================================================

import { cn } from '@/lib/utils'
import { TELEGRAM_COLORS } from '../config'
import { Settings } from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TelegramFoldersProps {
  folders?: TelegramFolder[]
  activeFolderId?: string
  onFolderSelect?: (folderId: string) => void
  onSettingsClick?: () => void
  className?: string
}

export interface TelegramFolder {
  id: string
  name: string
  icon?: string
  unreadCount?: number
  includedChats?: string[]
  excludedChats?: string[]
  includeChannels?: boolean
  includeGroups?: boolean
  includeBots?: boolean
  includePrivate?: boolean
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TelegramFolders({
  folders = [],
  activeFolderId,
  onFolderSelect,
  onSettingsClick,
  className,
}: TelegramFoldersProps) {
  // Always include "All Chats" as first folder
  const allFolders = [
    { id: 'all', name: 'All Chats' },
    ...folders,
  ]

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 overflow-x-auto',
        'bg-white dark:bg-[#17212B]',
        'border-b border-gray-200 dark:border-[#232E3C]',
        className
      )}
    >
      {allFolders.map((folder) => (
        <FolderTab
          key={folder.id}
          folder={folder}
          isActive={folder.id === (activeFolderId || 'all')}
          onClick={() => onFolderSelect?.(folder.id)}
        />
      ))}

      {/* Settings Button */}
      <button
        onClick={onSettingsClick}
        className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#232E3C]"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function FolderTab({
  folder,
  isActive,
  onClick,
}: {
  folder: TelegramFolder
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'text-[#2AABEE]'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#232E3C]'
      )}
    >
      <span className="flex items-center gap-1.5">
        {folder.icon && <span>{folder.icon}</span>}
        {folder.name}
        {(folder.unreadCount ?? 0) > 0 && (
          <span
            className={cn(
              'min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center',
              isActive
                ? 'bg-[#2AABEE] text-white'
                : 'bg-gray-400 text-white'
            )}
          >
            {folder.unreadCount}
          </span>
        )}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
          style={{ backgroundColor: TELEGRAM_COLORS.telegramBlue }}
        />
      )}
    </button>
  )
}

export default TelegramFolders
