'use client'

/**
 * MentionsPanel - All mentions view component
 *
 * Displays all mentions for the current user with filtering options
 * (All / Unread), mark all as read functionality, and jump to message.
 *
 * @example
 * ```tsx
 * <MentionsPanel userId={user.id} />
 * ```
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useMentions } from '@/lib/mentions/use-mentions'
import { MentionItem } from './mention-item'
import type { Mention } from '@/lib/mentions/mention-store'

// ============================================================================
// Types
// ============================================================================

export interface MentionsPanelProps {
  /** Current user's ID */
  userId: string
  /** Optional channel filter */
  channelId?: string
  /** Panel width */
  width?: number | string
  /** Panel height */
  height?: number | string
  /** Additional className */
  className?: string
  /** Called when panel should close */
  onClose?: () => void
}

// ============================================================================
// Filter Tabs
// ============================================================================

interface FilterTabsProps {
  filter: 'all' | 'unread'
  onFilterChange: (filter: 'all' | 'unread') => void
  unreadCount: number
}

function FilterTabs({ filter, onFilterChange, unreadCount }: FilterTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
      <button
        onClick={() => onFilterChange('all')}
        className={cn(
          'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          filter === 'all'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        All
      </button>
      <button
        onClick={() => onFilterChange('unread')}
        className={cn(
          'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          'flex items-center justify-center gap-1.5',
          filter === 'unread'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Unread
        {unreadCount > 0 && (
          <span
            className={cn(
              'px-1.5 py-0.5 text-xs rounded-full',
              filter === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted-foreground/20 text-muted-foreground'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  filter: 'all' | 'unread'
}

function EmptyState({ filter }: EmptyStateProps) {
  const isUnreadFilter = filter === 'unread'

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        {isUnreadFilter ? 'No unread mentions' : 'No mentions yet'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {isUnreadFilter
          ? "You're all caught up! Check back later for new mentions."
          : "When someone mentions you, you'll see it here."}
      </p>
    </div>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Error State
// ============================================================================

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-destructive"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Failed to load mentions
      </h3>
      <p className="text-sm text-muted-foreground max-w-[240px] mb-4">{error}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function MentionsPanel({
  userId,
  channelId,
  width = 400,
  height = 500,
  className,
  onClose,
}: MentionsPanelProps) {
  const {
    mentions,
    unreadMentions,
    unreadCount,
    isLoading,
    error,
    panelFilter,
    setFilter,
    fetchMentions,
    markAsRead,
    markAllAsRead,
    jumpToMention,
    isFeatureEnabled,
  } = useMentions({ userId, channelId })

  // Get filtered mentions
  const displayedMentions = React.useMemo(() => {
    return panelFilter === 'unread' ? unreadMentions : mentions
  }, [panelFilter, unreadMentions, mentions])

  // Handle jump to message
  const handleJumpToMessage = React.useCallback(
    (mention: Mention) => {
      jumpToMention(mention)
      onClose?.()
    },
    [jumpToMention, onClose]
  )

  // Handle mark all as read
  const handleMarkAllAsRead = React.useCallback(async () => {
    await markAllAsRead()
  }, [markAllAsRead])

  if (!isFeatureEnabled) {
    return (
      <div
        className={cn('flex flex-col bg-background border rounded-lg shadow-lg', className)}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Mentions feature is not enabled
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col bg-background border rounded-lg shadow-lg', className)}
      style={{ width, height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
          </svg>
          <h2 className="text-lg font-semibold">Mentions</h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              <svg
                className="h-4 w-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
                <path d="M20 12L9 23l-5-5" opacity="0.5" />
              </svg>
              Mark all read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="p-3 border-b">
        <FilterTabs
          filter={panelFilter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchMentions} />
        ) : displayedMentions.length === 0 ? (
          <EmptyState filter={panelFilter} />
        ) : (
          <div className="divide-y">
            {displayedMentions.map((mention) => (
              <MentionItem
                key={mention.id}
                mention={mention}
                onJumpToMessage={handleJumpToMessage}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {displayedMentions.length > 0 && (
        <div className="p-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Showing {displayedMentions.length} mention
            {displayedMentions.length !== 1 ? 's' : ''}
            {panelFilter === 'unread' && ' (unread only)'}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Inline Variant (for embedding in sidebars)
// ============================================================================

export interface MentionsPanelInlineProps {
  userId: string
  channelId?: string
  maxItems?: number
  showViewAll?: boolean
  onViewAll?: () => void
  className?: string
}

export function MentionsPanelInline({
  userId,
  channelId,
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  className,
}: MentionsPanelInlineProps) {
  const {
    unreadMentions,
    unreadCount,
    jumpToMention,
    markAsRead,
    isFeatureEnabled,
  } = useMentions({ userId, channelId })

  const displayedMentions = unreadMentions.slice(0, maxItems)

  if (!isFeatureEnabled || unreadCount === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Mentions ({unreadCount})
        </h3>
        {showViewAll && onViewAll && unreadCount > maxItems && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            View all
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {displayedMentions.map((mention) => (
          <MentionItem
            key={mention.id}
            mention={mention}
            onJumpToMessage={jumpToMention}
            onMarkAsRead={markAsRead}
            className="rounded-md"
          />
        ))}
      </div>
    </div>
  )
}

export default MentionsPanel
