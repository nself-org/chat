'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

/**
 * Inline code component for inline code snippets
 * Renders code with backtick syntax: `code`
 * Features:
 * - Monospace font
 * - Background highlight
 * - Theme-aware colors
 * - Copy on click
 */
export const InlineCode = memo(function InlineCode({
  children,
  className,
}: InlineCodeProps) {
  const handleClick = () => {
    // Copy code to clipboard on click
    if (children && typeof children === 'string') {
      navigator.clipboard.writeText(children).catch((error) => {
        console.error('Failed to copy code:', error)
      })
    }
  }

  return (
    <code
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs transition-colors',
        'cursor-pointer hover:bg-muted/80 active:bg-muted/60',
        'text-pink-600 dark:text-pink-400',
        'border border-muted-foreground/10',
        className
      )}
      title="Click to copy"
    >
      {children}
    </code>
  )
})

InlineCode.displayName = 'InlineCode'
