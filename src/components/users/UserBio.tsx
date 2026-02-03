'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface UserBioProps extends React.HTMLAttributes<HTMLDivElement> {
  bio: string
  maxLength?: number
  expandable?: boolean
}

// ============================================================================
// Component
// ============================================================================

const UserBio = React.forwardRef<HTMLDivElement, UserBioProps>(
  ({ className, bio, maxLength = 300, expandable = true, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const shouldTruncate = bio.length > maxLength && expandable
    const displayText = shouldTruncate && !isExpanded ? bio.slice(0, maxLength) + '...' : bio

    // Parse bio for links and mentions
    const parsedBio = React.useMemo(() => {
      // Simple URL regex
      const urlRegex = /(https?:\/\/[^\s]+)/g
      // Mention regex (@username)
      const mentionRegex = /@(\w+)/g

      let result = displayText

      // Replace URLs with links
      result = result.replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
      )

      // Replace mentions
      result = result.replace(mentionRegex, '<span class="text-primary font-medium">@$1</span>')

      return result
    }, [displayText])

    return (
      <div ref={ref} className={cn('text-sm', className)} {...props}>
        <p
          className="whitespace-pre-wrap break-words text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: parsedBio }}
        />
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    )
  }
)
UserBio.displayName = 'UserBio'

export { UserBio }
