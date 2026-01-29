/**
 * MentionNotification Component
 *
 * Displays a single mention notification with message preview,
 * sender info, and channel context.
 */

'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/stores/user-store'
import type { MentionNotification as MentionNotificationType, MentionType } from '@/lib/mentions/mention-types'

// ============================================================================
// Types
// ============================================================================

export interface MentionNotificationProps {
  /** The notification data */
  notification: MentionNotificationType
  /** Callback when notification is clicked */
  onClick?: () => void
  /** Callback when mark as read is clicked */
  onMarkAsRead?: () => void
  /** Callback when navigating to message */
  onNavigate?: () => void
  /** Whether to show the mark as read button */
  showMarkAsRead?: boolean
  /** Whether notification is compact */
  compact?: boolean
  /** Additional CSS class */
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

function getMentionTypeLabel(type: MentionType): string {
  switch (type) {
    case 'user':
      return 'mentioned you'
    case 'everyone':
      return 'mentioned @everyone'
    case 'here':
      return 'mentioned @here'
    case 'channel':
      return 'mentioned @channel'
    case 'role':
      return 'mentioned your role'
    default:
      return 'mentioned you'
  }
}

function getMentionTypeIcon(type: MentionType) {
  switch (type) {
    case 'everyone':
    case 'here':
    case 'channel':
      return (
        <svg
          className="h-4 w-4 text-warning"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )
    default:
      return (
        <svg
          className="h-4 w-4 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
      )
  }
}

// ============================================================================
// Component
// ============================================================================

export function MentionNotification({
  notification,
  onClick,
  onMarkAsRead,
  onNavigate,
  showMarkAsRead = true,
  compact = false,
  className,
}: MentionNotificationProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (onNavigate) {
      onNavigate()
    } else {
      // Default: navigate to the message
      router.push(`/chat/${notification.channelSlug}?message=${notification.messageId}`)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAsRead?.()
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  if (compact) {
    return (
      <CompactMentionNotification
        notification={notification}
        onClick={handleClick}
        onMarkAsRead={onMarkAsRead}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        !notification.isRead && 'bg-primary/5',
        'hover:bg-accent/50',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
      )}

      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        {notification.senderAvatarUrl && (
          <AvatarImage
            src={notification.senderAvatarUrl}
            alt={notification.senderDisplayName}
          />
        )}
        <AvatarFallback className="text-sm">
          {getInitials(notification.senderDisplayName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold truncate">
            {notification.senderDisplayName}
          </span>
          <span className="text-muted-foreground">
            {getMentionTypeLabel(notification.mentionType)}
          </span>
        </div>

        {/* Channel */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          <span>{notification.channelName}</span>
          <span className="opacity-50">-</span>
          <span>{timeAgo}</span>
        </div>

        {/* Message preview */}
        <p className="mt-1.5 text-sm text-foreground/80 line-clamp-2">
          {notification.messagePreview}
        </p>
      </div>

      {/* Mention type icon */}
      <div className="flex-shrink-0 mt-1">
        {getMentionTypeIcon(notification.mentionType)}
      </div>

      {/* Mark as read button (on hover) */}
      {showMarkAsRead && !notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleMarkAsRead}
          title="Mark as read"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="sr-only">Mark as read</span>
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactMentionNotificationProps {
  notification: MentionNotificationType
  onClick?: () => void
  onMarkAsRead?: () => void
  className?: string
}

function CompactMentionNotification({
  notification,
  onClick,
  onMarkAsRead,
  className,
}: CompactMentionNotificationProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer',
        !notification.isRead && 'bg-primary/5',
        'hover:bg-accent/50',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}

      {/* Avatar */}
      <Avatar className="h-6 w-6 flex-shrink-0">
        {notification.senderAvatarUrl && (
          <AvatarImage
            src={notification.senderAvatarUrl}
            alt={notification.senderDisplayName}
          />
        )}
        <AvatarFallback className="text-[10px]">
          {getInitials(notification.senderDisplayName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate">
          <span className="font-medium">{notification.senderDisplayName}</span>
          <span className="text-muted-foreground">
            {' '}in #{notification.channelName}
          </span>
        </span>
      </div>

      {/* Time */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {timeAgo}
      </span>
    </div>
  )
}

// ============================================================================
// Notification List Header
// ============================================================================

export interface MentionNotificationHeaderProps {
  unreadCount: number
  onMarkAllAsRead?: () => void
  className?: string
}

export function MentionNotificationHeader({
  unreadCount,
  onMarkAllAsRead,
  className,
}: MentionNotificationHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
        <h3 className="font-semibold">Mentions</h3>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {onMarkAllAsRead && unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAllAsRead}
          className="text-xs"
        >
          Mark all as read
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

export interface MentionNotificationEmptyProps {
  filter?: 'all' | 'unread'
  className?: string
}

export function MentionNotificationEmpty({
  filter = 'all',
  className,
}: MentionNotificationEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
      </div>
      <h4 className="font-medium text-foreground">
        {filter === 'unread' ? 'No unread mentions' : 'No mentions'}
      </h4>
      <p className="text-sm text-muted-foreground mt-1">
        {filter === 'unread'
          ? "You're all caught up!"
          : "When someone mentions you, you'll see it here."}
      </p>
    </div>
  )
}

export default MentionNotification
