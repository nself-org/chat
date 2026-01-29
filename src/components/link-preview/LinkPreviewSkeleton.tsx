'use client'

/**
 * LinkPreviewSkeleton - Loading state for link previews
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export interface LinkPreviewSkeletonProps {
  /** Layout variant */
  variant?: 'vertical' | 'horizontal' | 'compact'
  /** Show image placeholder */
  showImage?: boolean
  /** Additional class name */
  className?: string
}

export function LinkPreviewSkeleton({
  variant = 'vertical',
  showImage = true,
  className,
}: LinkPreviewSkeletonProps) {
  // Vertical layout
  if (variant === 'vertical') {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card overflow-hidden',
          className
        )}
      >
        {showImage && (
          <Skeleton className="w-full aspect-video rounded-none" />
        )}
        <div className="p-3 space-y-2">
          {/* Domain */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-4 h-4 rounded-sm" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Title */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {/* Description */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    )
  }

  // Horizontal layout
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'flex rounded-lg border bg-card overflow-hidden',
          className
        )}
      >
        {showImage && (
          <Skeleton className="w-32 sm:w-40 flex-shrink-0 rounded-none" />
        )}
        <div className="flex-1 p-3 space-y-2">
          {/* Domain */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-4 h-4 rounded-sm" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Title */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {/* Description */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    )
  }

  // Compact layout
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border bg-card',
        className
      )}
    >
      {showImage && (
        <Skeleton className="w-12 h-12 rounded flex-shrink-0" />
      )}
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
    </div>
  )
}

export default LinkPreviewSkeleton
