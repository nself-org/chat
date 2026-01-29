'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type ExtendedUserProfile } from './UserCard'
import { UserAvatar } from '@/components/user/user-avatar'
import { UserStatus } from '@/components/user/user-status'
import { RoleBadge } from '@/components/user/role-badge'
import { UserPresenceDot } from '@/components/user/user-presence-dot'
import { UserBadges } from './UserBadges'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Phone,
  Video,
  MoreHorizontal,
  Edit,
  Flag,
  Ban,
  UserPlus,
  Copy,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface UserProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  user: ExtendedUserProfile
  isOwnProfile?: boolean
  onMessage?: () => void
  onCall?: () => void
  onVideoCall?: () => void
  onBlock?: () => void
  onReport?: () => void
  onEditProfile?: () => void
  onAddToContacts?: () => void
}

// ============================================================================
// Component
// ============================================================================

const UserProfileHeader = React.forwardRef<HTMLDivElement, UserProfileHeaderProps>(
  (
    {
      className,
      user,
      isOwnProfile = false,
      onMessage,
      onCall,
      onVideoCall,
      onBlock,
      onReport,
      onEditProfile,
      onAddToContacts,
      ...props
    },
    ref
  ) => {
    const handleCopyUsername = () => {
      navigator.clipboard.writeText(`@${user.username}`)
    }

    return (
      <div ref={ref} className={cn('flex-shrink-0', className)} {...props}>
        {/* Cover photo */}
        <div
          className="h-32 md:h-40 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10"
          style={{
            backgroundImage: user.coverUrl ? `url(${user.coverUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Profile info section */}
        <div className="relative px-6 pb-4 -mt-12 md:-mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <UserAvatar
              user={user}
              size="3xl"
              presence={user.presence}
              className="ring-4 ring-background"
            />

            {/* Name and details */}
            <div className="flex-1 min-w-0 md:pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{user.displayName}</h1>
                <RoleBadge role={user.role} size="md" showTooltip />
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <button
                  onClick={handleCopyUsername}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                  title="Click to copy"
                >
                  <span>@{user.username}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
                {user.pronouns && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="text-sm">{user.pronouns}</span>
                  </>
                )}
              </div>

              {/* Title and department */}
              {(user.title || user.department) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.title}
                  {user.title && user.department && ' - '}
                  {user.department}
                </p>
              )}

              {/* Presence status */}
              <div className="flex items-center gap-2 mt-2">
                <UserPresenceDot status={user.presence} size="sm" position="inline" />
                <span className="text-sm capitalize">{user.presence}</span>
                {user.presence === 'offline' && user.lastSeenAt && (
                  <span className="text-xs text-muted-foreground">
                    (last seen {formatDistanceToNow(user.lastSeenAt, { addSuffix: true })})
                  </span>
                )}
              </div>

              {/* Custom status */}
              {user.customStatus && (
                <UserStatus status={user.customStatus} variant="full" className="mt-2" />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <Button onClick={onEditProfile}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  {onMessage && (
                    <Button onClick={onMessage}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                  {onCall && (
                    <Button variant="outline" onClick={onCall}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {onVideoCall && (
                    <Button variant="outline" onClick={onVideoCall}>
                      <Video className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onAddToContacts && (
                        <DropdownMenuItem onClick={onAddToContacts}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add to Contacts
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleCopyUsername}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Username
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {onBlock && (
                        <DropdownMenuItem
                          onClick={onBlock}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block User
                        </DropdownMenuItem>
                      )}
                      {onReport && (
                        <DropdownMenuItem
                          onClick={onReport}
                          className="text-destructive focus:text-destructive"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Additional info row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.timezone && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{user.timezone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}</span>
            </div>
          </div>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <UserBadges badges={user.badges} className="mt-4" />
          )}
        </div>
      </div>
    )
  }
)
UserProfileHeader.displayName = 'UserProfileHeader'

export { UserProfileHeader }
