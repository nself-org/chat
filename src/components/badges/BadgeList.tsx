'use client'

/**
 * BadgeList Component
 *
 * Displays a list of badges with various layout options.
 */

import React from 'react'
import { Badge as BadgeType, UserBadge as UserBadgeType, getBadgesSortedByPriority } from '@/lib/badges/badge-types'
import { UserBadge, BadgeSize } from './UserBadge'

export interface BadgeListProps {
  badges: (BadgeType | UserBadgeType)[]
  size?: BadgeSize
  maxVisible?: number        // Max badges to show before "+N more"
  showLabels?: boolean
  showTooltips?: boolean
  layout?: 'inline' | 'stack' | 'grid'
  sortByPriority?: boolean
  emptyMessage?: string
  className?: string
  onBadgeClick?: (badge: BadgeType | UserBadgeType) => void
}

export function BadgeList({
  badges,
  size = 'sm',
  maxVisible,
  showLabels = false,
  showTooltips = true,
  layout = 'inline',
  sortByPriority = true,
  emptyMessage,
  className = '',
  onBadgeClick,
}: BadgeListProps) {
  // Filter visible badges and sort by priority if needed
  const visibleBadges = badges.filter(b => b.visible)
  const sortedBadges = sortByPriority
    ? getBadgesSortedByPriority(visibleBadges)
    : visibleBadges

  // Limit badges if maxVisible is set
  const displayBadges = maxVisible
    ? sortedBadges.slice(0, maxVisible)
    : sortedBadges
  const hiddenCount = sortedBadges.length - displayBadges.length

  if (sortedBadges.length === 0) {
    if (emptyMessage) {
      return <span className="text-sm text-gray-500">{emptyMessage}</span>
    }
    return null
  }

  // Layout classes
  const layoutClasses = {
    inline: 'flex flex-wrap items-center gap-1',
    stack: 'flex flex-col gap-1',
    grid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2',
  }

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {displayBadges.map((badge) => (
        <UserBadge
          key={badge.id}
          badge={badge}
          size={size}
          showLabel={showLabels}
          showTooltip={showTooltips}
          onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
        />
      ))}

      {hiddenCount > 0 && (
        <span
          className={`
            inline-flex items-center justify-center rounded-full
            text-xs font-medium text-gray-600 bg-gray-100
            ${size === 'xs' ? 'px-1 py-0.5 h-4' : ''}
            ${size === 'sm' ? 'px-1.5 py-0.5 h-5' : ''}
            ${size === 'md' ? 'px-2 py-1 h-6' : ''}
            ${size === 'lg' ? 'px-3 py-1.5 h-8' : ''}
          `}
          title={`${hiddenCount} more badge${hiddenCount > 1 ? 's' : ''}`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

/**
 * BadgeListCompact - A more compact version for tight spaces
 */
export function BadgeListCompact({
  badges,
  maxVisible = 3,
  className = '',
}: {
  badges: (BadgeType | UserBadgeType)[]
  maxVisible?: number
  className?: string
}) {
  return (
    <BadgeList
      badges={badges}
      size="xs"
      maxVisible={maxVisible}
      showLabels={false}
      showTooltips={true}
      layout="inline"
      className={className}
    />
  )
}

/**
 * BadgeListFull - Full display with labels
 */
export function BadgeListFull({
  badges,
  className = '',
  onBadgeClick,
}: {
  badges: (BadgeType | UserBadgeType)[]
  className?: string
  onBadgeClick?: (badge: BadgeType | UserBadgeType) => void
}) {
  return (
    <BadgeList
      badges={badges}
      size="md"
      showLabels={true}
      showTooltips={true}
      layout="inline"
      className={className}
      onBadgeClick={onBadgeClick}
    />
  )
}

/**
 * BadgeGrid - Grid layout for badge selection/display
 */
export function BadgeGrid({
  badges,
  selectedBadges = [],
  onBadgeSelect,
  className = '',
}: {
  badges: (BadgeType | UserBadgeType)[]
  selectedBadges?: string[]
  onBadgeSelect?: (badge: BadgeType | UserBadgeType) => void
  className?: string
}) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
      {badges.filter(b => b.visible).map((badge) => {
        const isSelected = selectedBadges.includes(badge.id)
        return (
          <button
            key={badge.id}
            type="button"
            onClick={() => onBadgeSelect?.(badge)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
              ${isSelected
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <UserBadge badge={badge} size="md" showTooltip={false} />
            <span className="text-sm font-medium text-gray-700 text-center">
              {badge.name}
            </span>
            <span className="text-xs text-gray-500 text-center line-clamp-2">
              {badge.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default BadgeList
