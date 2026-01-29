'use client'

import { useState, memo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Pencil } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { MessageEditRecord, MessageUser } from '@/types/message'

// ============================================================================
// Types
// ============================================================================

export interface EditIndicatorProps {
  /** Whether the message has been edited */
  isEdited: boolean
  /** When the message was last edited */
  editedAt?: Date | string
  /** Edit history (for viewing) */
  editHistory?: MessageEditRecord[]
  /** Message author */
  author?: MessageUser
  /** Callback when clicking to view history */
  onViewHistory?: () => void
  /** Size variant */
  size?: 'sm' | 'default'
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Edit Indicator Component
 *
 * Shows "(edited)" text for edited messages with a tooltip showing
 * the last edit time. Clicking opens the edit history modal.
 */
export const EditIndicator = memo(function EditIndicator({
  isEdited,
  editedAt,
  editHistory,
  author,
  onViewHistory,
  size = 'default',
  className,
}: EditIndicatorProps) {
  if (!isEdited) {
    return null
  }

  const editDate = editedAt ? new Date(editedAt) : null
  const hasHistory = editHistory && editHistory.length > 0
  const editCount = hasHistory ? editHistory.length : 1

  // Format the tooltip content
  const tooltipContent = editDate ? (
    <div className="space-y-1">
      <p className="font-medium">Edited {formatDistanceToNow(editDate, { addSuffix: true })}</p>
      <p className="text-xs text-muted-foreground">
        {format(editDate, 'EEEE, MMMM d, yyyy')} at {format(editDate, 'h:mm a')}
      </p>
      {editCount > 1 && (
        <p className="text-xs text-muted-foreground">
          {editCount} edit{editCount !== 1 ? 's' : ''} total
        </p>
      )}
      {onViewHistory && (
        <p className="text-xs text-primary">Click to view edit history</p>
      )}
    </div>
  ) : (
    <p>Edited</p>
  )

  const indicator = (
    <span
      className={cn(
        'inline-flex cursor-default items-center gap-0.5 text-muted-foreground transition-colors',
        onViewHistory && 'cursor-pointer hover:text-foreground hover:underline',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className
      )}
      onClick={onViewHistory}
      role={onViewHistory ? 'button' : undefined}
      tabIndex={onViewHistory ? 0 : undefined}
      onKeyDown={(e) => {
        if (onViewHistory && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onViewHistory()
        }
      }}
    >
      (edited)
    </span>
  )

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

// ============================================================================
// Compact Variant
// ============================================================================

export interface CompactEditIndicatorProps {
  /** Whether the message has been edited */
  isEdited: boolean
  /** When the message was last edited */
  editedAt?: Date | string
  /** Callback when clicking to view history */
  onViewHistory?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact Edit Indicator
 *
 * Shows just a pencil icon for compact message views
 */
export const CompactEditIndicator = memo(function CompactEditIndicator({
  isEdited,
  editedAt,
  onViewHistory,
  className,
}: CompactEditIndicatorProps) {
  if (!isEdited) {
    return null
  }

  const editDate = editedAt ? new Date(editedAt) : null

  const tooltipContent = editDate ? (
    <p>
      Edited {formatDistanceToNow(editDate, { addSuffix: true })}
      {onViewHistory && ' - Click to view history'}
    </p>
  ) : (
    <p>Edited</p>
  )

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex cursor-default text-muted-foreground transition-colors',
              onViewHistory && 'cursor-pointer hover:text-foreground',
              className
            )}
            onClick={onViewHistory}
            role={onViewHistory ? 'button' : undefined}
            tabIndex={onViewHistory ? 0 : undefined}
          >
            <Pencil className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

export default EditIndicator
