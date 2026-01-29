'use client'

// ===============================================================================
// Slack Header Component
// ===============================================================================
//
// The channel header with channel name, description, member count,
// and action buttons (call, huddle, search, etc.)
//
// ===============================================================================

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Hash,
  Lock,
  ChevronDown,
  Users,
  Pin,
  Headphones,
  Search,
  MoreVertical,
  Star,
  Bookmark,
  Phone,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface SlackHeaderProps {
  channelName?: string
  channelDescription?: string
  isPrivate?: boolean
  memberCount?: number
  pinnedCount?: number
  isStarred?: boolean
  onHuddleClick?: () => void
  onCallClick?: () => void
  onSearchClick?: () => void
  onMembersClick?: () => void
  onPinnedClick?: () => void
  onStarClick?: () => void
  className?: string
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function SlackHeader({
  channelName = 'general',
  channelDescription,
  isPrivate = false,
  memberCount,
  pinnedCount,
  isStarred = false,
  onHuddleClick,
  onCallClick,
  onSearchClick,
  onMembersClick,
  onPinnedClick,
  onStarClick,
  className,
}: SlackHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4',
        'bg-white dark:bg-[#1A1D21]',
        'border-b border-[#DDDDDD] dark:border-[#35383C]',
        className
      )}
      style={{ height: 49 }}
    >
      {/* Left: Channel Info */}
      <div className="flex items-center gap-2 min-w-0">
        <button className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-[#35383C] rounded px-2 py-1 -ml-2">
          {isPrivate ? (
            <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
          <span className="font-bold text-lg text-gray-900 dark:text-white truncate">
            {channelName}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        </button>

        {/* Star button */}
        <button
          onClick={onStarClick}
          className={cn(
            'p-1 rounded hover:bg-gray-100 dark:hover:bg-[#35383C]',
            isStarred ? 'text-yellow-500' : 'text-gray-400'
          )}
        >
          <Star
            className="w-4 h-4"
            fill={isStarred ? 'currentColor' : 'none'}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-[#35383C] mx-1" />

        {/* Members */}
        {memberCount !== undefined && (
          <button
            onClick={onMembersClick}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Users className="w-4 h-4" />
            <span>{memberCount}</span>
          </button>
        )}

        {/* Pinned */}
        {pinnedCount !== undefined && pinnedCount > 0 && (
          <button
            onClick={onPinnedClick}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Pin className="w-4 h-4" />
            <span>{pinnedCount}</span>
          </button>
        )}

        {/* Description */}
        {channelDescription && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-[#35383C] mx-1" />
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {channelDescription}
            </span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Huddle */}
        <button
          onClick={onHuddleClick}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded',
            'text-sm text-gray-700 dark:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-[#35383C]',
            'border border-gray-300 dark:border-[#35383C]'
          )}
        >
          <Headphones className="w-4 h-4" />
          <span>Huddle</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-[#35383C] mx-1" />

        {/* Icon buttons */}
        <button
          onClick={onSearchClick}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-[#35383C] text-gray-600 dark:text-gray-400"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export default SlackHeader
