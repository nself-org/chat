'use client'

import { cn } from '@/lib/utils'
import { Skeleton, CircleSkeleton, LineSkeleton } from './skeleton'
import { ChannelSkeleton, DirectMessagesSkeleton } from './channel-skeleton'

interface SidebarSkeletonProps {
  /** Show workspace header */
  showHeader?: boolean
  /** Show user profile at bottom */
  showUserProfile?: boolean
  /** Number of channel categories */
  categoryCount?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Full sidebar skeleton
 * Matches the main sidebar layout
 */
export function SidebarSkeleton({
  showHeader = true,
  showUserProfile = true,
  categoryCount = 3,
  className,
}: SidebarSkeletonProps) {
  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-zinc-50 dark:bg-zinc-900/50',
        className
      )}
    >
      {/* Workspace header */}
      {showHeader && <WorkspaceHeaderSkeleton />}

      {/* Main content */}
      <div className="flex-1 overflow-hidden px-2 py-4">
        {/* Search */}
        <div className="px-2 mb-4">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        {/* Channels section */}
        <div className="space-y-4">
          <SectionHeaderSkeleton title="Channels" />
          <ChannelSkeleton count={4} showCategories={false} />
        </div>

        {/* Categories */}
        {Array.from({ length: categoryCount }).map((_, i) => (
          <div key={i} className="mt-4">
            <ChannelCategoryHeaderSkeleton />
            <ChannelSkeleton
              count={2 + Math.floor(Math.random() * 3)}
              showCategories={false}
            />
          </div>
        ))}

        {/* Direct Messages */}
        <div className="mt-6">
          <DirectMessagesSkeleton count={4} />
        </div>
      </div>

      {/* User profile */}
      {showUserProfile && <UserProfileSkeleton />}
    </div>
  )
}

/**
 * Workspace header skeleton
 */
export function WorkspaceHeaderSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4',
        className
      )}
    >
      {/* Logo/name */}
      <LineSkeleton width={80} height={20} />

      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

/**
 * Section header skeleton
 */
export function SectionHeaderSkeleton({
  title,
  showActions = true,
  className,
}: {
  title?: string
  showActions?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-2 py-1',
        className
      )}
    >
      <LineSkeleton width={60} height={10} />
      {showActions && (
        <div className="flex gap-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
      )}
    </div>
  )
}

/**
 * Channel category header skeleton
 */
export function ChannelCategoryHeaderSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 mb-1',
        className
      )}
    >
      <Skeleton className="h-3 w-3 rounded" />
      <LineSkeleton width={50} height={10} />
    </div>
  )
}

/**
 * User profile skeleton (bottom of sidebar)
 */
export function UserProfileSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'border-t border-zinc-200 dark:border-zinc-800 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <CircleSkeleton size={32} />

        {/* User info */}
        <div className="flex-1 min-w-0">
          <LineSkeleton width={100} height={14} />
          <LineSkeleton width={80} height={10} className="mt-0.5" />
        </div>

        {/* Settings button */}
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  )
}

/**
 * Minimal sidebar skeleton
 * For collapsed sidebar state
 */
export function CollapsedSidebarSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-16 flex-col items-center border-r bg-zinc-50 dark:bg-zinc-900/50 py-4',
        className
      )}
    >
      {/* Logo */}
      <Skeleton className="h-10 w-10 rounded-lg mb-4" />

      {/* Channel icons */}
      <div className="flex-1 flex flex-col gap-2 items-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>

      {/* User avatar */}
      <CircleSkeleton size={32} />
    </div>
  )
}

/**
 * Server list skeleton (for multi-server layout)
 */
export function ServerListSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-18 flex-col items-center border-r bg-zinc-100 dark:bg-zinc-950 py-3 gap-2',
        className
      )}
    >
      {/* Home/DMs */}
      <Skeleton className="h-12 w-12 rounded-2xl" />

      {/* Divider */}
      <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-700 my-1" />

      {/* Servers */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-12 rounded-2xl" />
      ))}

      {/* Add server */}
      <div className="mt-auto">
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  )
}

/**
 * Full layout skeleton with server list and sidebar
 */
export function FullLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full', className)}>
      <ServerListSkeleton />
      <SidebarSkeleton />
    </div>
  )
}
