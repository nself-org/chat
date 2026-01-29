'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type UserProfile } from '@/stores/user-store'
import { UserAvatar } from './user-avatar'
import { UserStatus } from './user-status'
import { RoleBadge } from './role-badge'
import { UserPresenceDot } from './user-presence-dot'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Phone, MoreHorizontal, User } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface UserProfileCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  user: UserProfile
  onMessage?: () => void
  onCall?: () => void
  onViewProfile?: () => void
  showQuickActions?: boolean
  compact?: boolean
}

export interface UserProfileCardTriggerProps {
  user: UserProfile
  children: React.ReactNode
  onMessage?: () => void
  onCall?: () => void
  onViewProfile?: () => void
  showQuickActions?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

// ============================================================================
// UserProfileCard Component
// ============================================================================

const UserProfileCard = React.forwardRef<HTMLDivElement, UserProfileCardProps>(
  (
    {
      className,
      user,
      onMessage,
      onCall,
      onViewProfile,
      showQuickActions = true,
      compact = false,
      ...props
    },
    ref
  ) => {
    if (compact) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3 p-2', className)}
          {...props}
        >
          <UserAvatar user={user} size="sm" presence={user.presence} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {user.displayName}
              </span>
              <RoleBadge role={user.role} size="xs" />
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              @{user.username}
            </span>
          </div>
        </div>
      )
    }

    return (
      <Card
        ref={ref}
        className={cn('w-80 overflow-hidden', className)}
        {...props}
      >
        {/* Header with cover gradient */}
        <div
          className="h-16 bg-gradient-to-r from-primary/20 to-primary/10"
          style={{
            backgroundImage: user.coverUrl
              ? `url(${user.coverUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <CardContent className="pt-0 -mt-8">
          {/* Avatar and basic info */}
          <div className="flex items-end gap-4 mb-3">
            <UserAvatar
              user={user}
              size="xl"
              presence={user.presence}
              className="ring-4 ring-background"
            />
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">
                  {user.displayName}
                </h3>
                <RoleBadge role={user.role} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Custom status */}
          {user.customStatus && (
            <UserStatus status={user.customStatus} variant="full" className="mb-3" />
          )}

          {/* Presence status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <UserPresenceDot status={user.presence} size="sm" position="inline" />
            <span className="capitalize">{user.presence}</span>
          </div>

          {/* Bio preview */}
          {user.bio && (
            <>
              <Separator className="my-3" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {user.bio}
              </p>
            </>
          )}

          {/* Quick actions */}
          {showQuickActions && (
            <>
              <Separator className="my-3" />
              <div className="flex items-center gap-2">
                {onMessage && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={onMessage}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                )}
                {onCall && (
                  <Button variant="outline" size="sm" onClick={onCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {onViewProfile && (
                  <Button variant="outline" size="sm" onClick={onViewProfile}>
                    <User className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }
)
UserProfileCard.displayName = 'UserProfileCard'

// ============================================================================
// UserProfileCardTrigger - Hover card wrapper
// ============================================================================

const UserProfileCardTrigger: React.FC<UserProfileCardTriggerProps> = ({
  user,
  children,
  onMessage,
  onCall,
  onViewProfile,
  showQuickActions = true,
  side = 'right',
  align = 'start',
}) => {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(true)
    }, 300) // 300ms delay before showing
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 150) // 150ms delay before hiding
  }

  const handleContentMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleContentMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 150)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline-block"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="p-0 w-auto"
        onMouseEnter={handleContentMouseEnter}
        onMouseLeave={handleContentMouseLeave}
      >
        <UserProfileCard
          user={user}
          onMessage={onMessage}
          onCall={onCall}
          onViewProfile={onViewProfile}
          showQuickActions={showQuickActions}
        />
      </PopoverContent>
    </Popover>
  )
}
UserProfileCardTrigger.displayName = 'UserProfileCardTrigger'

export { UserProfileCard, UserProfileCardTrigger }
