'use client'

/**
 * LinkPreviewError - Error state for link previews
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface LinkPreviewErrorProps {
  /** Original URL */
  url: string
  /** Error message */
  error: string
  /** Retry callback */
  onRetry?: () => void
  /** Dismiss callback */
  onDismiss?: () => void
  /** Show retry button */
  showRetry?: boolean
  /** Additional class name */
  className?: string
}

export function LinkPreviewError({
  url,
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  className,
}: LinkPreviewErrorProps) {
  const domain = React.useMemo(() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return url
    }
  }, [url])

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5',
        className
      )}
    >
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          Failed to load preview
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {domain}
        </p>
        {error && (
          <p className="text-xs text-destructive mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 px-2"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry
          </Button>
        )}

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default LinkPreviewError
