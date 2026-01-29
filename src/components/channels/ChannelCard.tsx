'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Hash,
  Lock,
  Users,
  MessageSquare,
  Star,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { JoinChannelButton } from './JoinChannelButton'
import type { Channel } from '@/stores/channel-store'
import { formatMemberCount, getActivityLevel, getActivityLevelLabel } from '@/lib/channels/channel-stats'

// ============================================================================
// Types
// ============================================================================

export interface ChannelCardProps {
  channel: Channel
  isJoined?: boolean
  isFeatured?: boolean
  isTrending?: boolean
  isNew?: boolean
  showStats?: boolean
  showJoinButton?: boolean
  variant?: 'default' | 'compact' | 'featured'
  onJoin?: (channelId: string) => void
  onLeave?: (channelId: string) => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChannelCard({
  channel,
  isJoined = false,
  isFeatured = false,
  isTrending = false,
  isNew = false,
  showStats = true,
  showJoinButton = true,
  variant = 'default',
  onJoin,
  onLeave,
  className,
}: ChannelCardProps) {
  const activityLevel = getActivityLevel(channel)
  const isPrivate = channel.type === 'private'

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isJoined) {
      onLeave?.(channel.id)
    } else {
      onJoin?.(channel.id)
    }
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/chat/channel/${channel.slug}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
          className
        )}
      >
        <div className="flex-shrink-0">
          {isPrivate ? (
            <Lock className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Hash className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{channel.name}</span>
            {isTrending && (
              <TrendingUp className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            )}
            {isNew && (
              <Sparkles className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
            )}
          </div>
          {channel.description && (
            <p className="text-sm text-muted-foreground truncate">
              {channel.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{formatMemberCount(channel.memberCount)}</span>
          </div>
          {showJoinButton && (
            <JoinChannelButton
              channelId={channel.id}
              isJoined={isJoined}
              isPrivate={isPrivate}
              size="sm"
              onClick={handleJoinClick}
            />
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Card
        className={cn(
          'overflow-hidden hover:shadow-md transition-shadow',
          'border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
          className
        )}
      >
        <CardContent className="p-0">
          <Link href={`/chat/channel/${channel.slug}`} className="block">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {isPrivate ? (
                      <Lock className="h-5 w-5 text-primary" />
                    ) : (
                      <Hash className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{channel.name}</h3>
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    {channel.topic && (
                      <p className="text-xs text-muted-foreground">{channel.topic}</p>
                    )}
                  </div>
                </div>
                {showJoinButton && (
                  <JoinChannelButton
                    channelId={channel.id}
                    isJoined={isJoined}
                    isPrivate={isPrivate}
                    onClick={handleJoinClick}
                  />
                )}
              </div>

              {channel.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {channel.description}
                </p>
              )}

              {showStats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{formatMemberCount(channel.memberCount)} members</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getActivityLevelLabel(activityLevel)}
                  </Badge>
                </div>
              )}
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card
      className={cn(
        'overflow-hidden hover:shadow-md transition-shadow',
        isFeatured && 'border-primary/30',
        className
      )}
    >
      <CardContent className="p-0">
        <Link href={`/chat/channel/${channel.slug}`} className="block">
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    channel.color ? `bg-[${channel.color}]/10` : 'bg-muted'
                  )}
                >
                  {isPrivate ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{channel.name}</h3>
                    {isFeatured && (
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    )}
                    {isTrending && (
                      <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    )}
                    {isNew && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  {channel.topic && (
                    <p className="text-xs text-muted-foreground">{channel.topic}</p>
                  )}
                </div>
              </div>
              {showJoinButton && (
                <JoinChannelButton
                  channelId={channel.id}
                  isJoined={isJoined}
                  isPrivate={isPrivate}
                  onClick={handleJoinClick}
                />
              )}
            </div>

            {channel.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {channel.description}
              </p>
            )}

            {showStats && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{formatMemberCount(channel.memberCount)}</span>
                  </div>
                  {channel.lastMessagePreview && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate max-w-[150px]">
                        {channel.lastMessagePreview}
                      </span>
                    </div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    activityLevel === 'very-active' && 'border-green-500 text-green-600',
                    activityLevel === 'active' && 'border-emerald-500 text-emerald-600',
                    activityLevel === 'moderate' && 'border-yellow-500 text-yellow-600',
                    activityLevel === 'quiet' && 'border-orange-500 text-orange-600',
                    activityLevel === 'inactive' && 'border-gray-400 text-gray-500'
                  )}
                >
                  {getActivityLevelLabel(activityLevel)}
                </Badge>
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

ChannelCard.displayName = 'ChannelCard'
