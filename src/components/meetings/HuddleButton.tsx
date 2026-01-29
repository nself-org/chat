'use client';

/**
 * HuddleButton - Start or join a huddle in a channel
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Huddle, RoomType } from '@/lib/meetings/meeting-types';
import { useHuddle } from '@/hooks/useHuddle';
import {
  Headphones,
  Video,
  Phone,
  Users,
  Plus,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface HuddleButtonProps {
  channelId: string;
  userId?: string;
  variant?: 'default' | 'icon' | 'compact';
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function HuddleButton({
  channelId,
  userId,
  variant = 'default',
  className,
}: HuddleButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const {
    huddle,
    isActive,
    isInHuddle,
    participantCount,
    participants,
    isLoading,
    isStarting,
    isJoining,
    startHuddle,
    joinHuddle,
    canStartHuddle,
    canJoinHuddle,
  } = useHuddle({ channelId, userId });

  const handleStartHuddle = async (roomType: RoomType) => {
    await startHuddle(roomType);
    setIsPopoverOpen(false);
  };

  const handleJoinHuddle = async () => {
    await joinHuddle();
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Active huddle display
  if (isActive && huddle) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isInHuddle ? 'default' : 'outline'}
              size={variant === 'icon' ? 'icon' : 'sm'}
              className={cn(
                'relative',
                isInHuddle && 'bg-green-600 hover:bg-green-700',
                className
              )}
              onClick={canJoinHuddle ? handleJoinHuddle : undefined}
              disabled={isJoining || isInHuddle}
            >
              {isJoining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Headphones className="h-4 w-4" />
                  {variant !== 'icon' && (
                    <span className="ml-1">
                      {isInHuddle ? 'In Huddle' : 'Join'}
                    </span>
                  )}
                </>
              )}

              {/* Participant count badge */}
              <span
                className={cn(
                  'absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-xs flex items-center justify-center',
                  isInHuddle
                    ? 'bg-white text-green-600'
                    : 'bg-green-500 text-white'
                )}
              >
                {participantCount}
              </span>

              {/* Pulse animation when active */}
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 animate-ping opacity-75" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-0">
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Headphones className="h-4 w-4" />
                Huddle in progress
              </div>
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((p) => (
                  <Avatar key={p.userId} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={p.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(p.displayName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 5 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{participants.length - 5}
                  </div>
                )}
              </div>
              {canJoinHuddle && (
                <p className="text-xs text-muted-foreground">
                  Click to join the huddle
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Start huddle button
  if (canStartHuddle) {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size={variant === 'icon' ? 'icon' : 'sm'}
            className={cn('text-muted-foreground hover:text-foreground', className)}
            disabled={isStarting || isLoading}
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Headphones className="h-4 w-4" />
                {variant !== 'icon' && <span className="ml-1">Huddle</span>}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <div className="p-3 border-b">
            <h4 className="font-medium">Start a Huddle</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick audio or video call with channel members
            </p>
          </div>
          <div className="p-2 space-y-1">
            <button
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => handleStartHuddle('audio')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Audio Huddle</p>
                <p className="text-xs text-muted-foreground">Voice-only call</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => handleStartHuddle('video')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                <Video className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Video Huddle</p>
                <p className="text-xs text-muted-foreground">Video and audio call</p>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size={variant === 'icon' ? 'icon' : 'sm'}
        className={className}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Default disabled state
  return null;
}
