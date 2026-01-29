'use client'

import React, { ErrorInfo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isDevelopment } from '@/lib/environment'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'

interface ErrorFallbackProps {
  error: Error | null
  errorInfo?: ErrorInfo | null
  onReset?: () => void
  onReport?: () => Promise<void>
  showStack?: boolean
  showReportButton?: boolean
  className?: string
  title?: string
  description?: string
}

/**
 * Error fallback component that displays error information
 * with recovery options.
 */
export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onReport,
  showStack = isDevelopment(),
  showReportButton = true,
  className,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
}: ErrorFallbackProps) {
  const [isReporting, setIsReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleReport = async () => {
    if (onReport) {
      setIsReporting(true)
      try {
        await onReport()
        setReported(true)
      } catch {
        // Ignore report errors
      } finally {
        setIsReporting(false)
      }
    }
  }

  const handleCopyError = async () => {
    const errorText = [
      `Error: ${error?.message || 'Unknown error'}`,
      '',
      'Stack trace:',
      error?.stack || 'No stack trace available',
      '',
      'Component stack:',
      errorInfo?.componentStack || 'No component stack available',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[300px] p-8',
        'bg-white dark:bg-zinc-900',
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {description}
        </p>

        {/* Error message (dev only) */}
        {showStack && error && (
          <div className="mb-6 text-left">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <code className="text-sm text-red-700 dark:text-red-400 break-words">
                {error.message}
              </code>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {onReset && (
            <Button onClick={onReset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          <Button onClick={handleGoHome} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>

          {showReportButton && onReport && !reported && (
            <Button
              onClick={handleReport}
              variant="outline"
              className="gap-2"
              disabled={isReporting}
            >
              <Bug className="h-4 w-4" />
              {isReporting ? 'Reporting...' : 'Report Issue'}
            </Button>
          )}

          {reported && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Issue reported
            </div>
          )}
        </div>

        {/* Stack trace (dev only) */}
        {showStack && error?.stack && (
          <div className="text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2"
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showDetails ? 'Hide' : 'Show'} error details
            </button>

            {showDetails && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={handleCopyError}
                  title="Copy error details"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <pre className="p-4 pr-12 text-xs text-zinc-700 dark:text-zinc-300 overflow-auto max-h-64">
                    {error.stack}
                  </pre>

                  {errorInfo?.componentStack && (
                    <>
                      <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Component Stack
                      </div>
                      <pre className="p-4 text-xs text-zinc-700 dark:text-zinc-300 overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorFallback
