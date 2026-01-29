'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type Channel } from './UserProfile'
import { Hash, Lock, Users } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface UserProfileChannelsProps extends React.HTMLAttributes<HTMLDivElement> {
  channels: Channel[]
  onChannelClick?: (channel: Channel) => void
}

// ============================================================================
// Component
// ============================================================================

const UserProfileChannels = React.forwardRef<HTMLDivElement, UserProfileChannelsProps>(
  ({ className, channels, onChannelClick, ...props }, ref) => {
    if (channels.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center py-12 text-center',
            className
          )}
          {...props}
        >
          <Hash className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No shared channels</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don't share any channels with this user yet.
          </p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('p-6', className)} {...props}>
        <div className="space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelClick?.(channel)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'hover:bg-muted/50 transition-colors text-left'
              )}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                {channel.isPrivate ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Hash className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{channel.name}</h4>
                  {channel.isPrivate && (
                    <span className="text-xs text-muted-foreground">Private</span>
                  )}
                </div>
                {channel.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {channel.description}
                  </p>
                )}
              </div>
              {channel.memberCount !== undefined && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{channel.memberCount}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
UserProfileChannels.displayName = 'UserProfileChannels'

export { UserProfileChannels }
