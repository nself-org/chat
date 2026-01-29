'use client';

/**
 * MeetingCard - Meeting preview card component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Video,
  Phone,
  Monitor,
  Clock,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Calendar,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { Meeting, MeetingStatus, RoomType } from '@/lib/meetings/meeting-types';
import { formatTime, formatDate, formatDuration, getRelativeTime } from '@/lib/meetings';
import { copyMeetingLink } from '@/lib/meetings/meeting-links';

// ============================================================================
// Types
// ============================================================================

interface MeetingCardProps {
  meeting: Meeting;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onClick?: () => void;
  onJoin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const getRoomTypeIcon = (roomType: RoomType) => {
  switch (roomType) {
    case 'video':
      return Video;
    case 'audio':
      return Phone;
    case 'screenshare':
      return Monitor;
    default:
      return Video;
  }
};

const getStatusBadge = (status: MeetingStatus) => {
  switch (status) {
    case 'live':
      return (
        <Badge className="bg-green-500 text-white animate-pulse">
          Live Now
        </Badge>
      );
    case 'scheduled':
      return <Badge variant="secondary">Scheduled</Badge>;
    case 'ended':
      return <Badge variant="outline">Ended</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return null;
  }
};

// ============================================================================
// Component
// ============================================================================

export function MeetingCard({
  meeting,
  variant = 'default',
  showActions = true,
  onClick,
  onJoin,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const RoomIcon = getRoomTypeIcon(meeting.roomType);
  const startDate = new Date(meeting.scheduledStartAt);
  const endDate = new Date(meeting.scheduledEndAt);
  const isUpcoming = meeting.status === 'scheduled' && startDate > new Date();
  const isLive = meeting.status === 'live';
  const canJoin = isLive || (isUpcoming && startDate.getTime() - Date.now() < 15 * 60 * 1000);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyMeetingLink(meeting);
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          'hover:bg-accent cursor-pointer',
          isLive && 'border-green-500/50 bg-green-500/5'
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-lg',
            isLive ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'
          )}
        >
          <RoomIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{meeting.title}</h4>
            {isLive && (
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatTime(startDate)} - {formatTime(endDate)}
          </p>
        </div>
        {canJoin && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.();
            }}
          >
            Join
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group p-4 rounded-lg border transition-all',
        'hover:shadow-md hover:border-primary/50',
        isLive && 'border-green-500/50 bg-green-500/5',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg',
              isLive ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'
            )}
          >
            <RoomIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{meeting.title}</h3>
              {getStatusBadge(meeting.status)}
            </div>
            {meeting.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {meeting.description}
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="h-4 w-4 mr-2" />
                Add to calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {onEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Time Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>
            {formatTime(startDate)} - {formatTime(endDate)}
          </span>
        </div>
        {isUpcoming && (
          <span className="text-primary font-medium">
            {getRelativeTime(startDate)}
          </span>
        )}
        <span>{formatDuration(meeting.duration)}</span>
      </div>

      {/* Date */}
      {variant === 'detailed' && (
        <div className="text-sm text-muted-foreground mb-3">
          {formatDate(startDate)}
        </div>
      )}

      {/* Participants and Actions */}
      <div className="flex items-center justify-between">
        {/* Participants */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {meeting.participants.slice(0, 4).map((participant, i) => (
              <Avatar
                key={participant.id}
                className="h-7 w-7 border-2 border-background"
              >
                <AvatarImage src={participant.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {participant.displayName
                    ? getInitials(participant.displayName)
                    : '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {meeting.participantCount > 4 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium">
                  +{meeting.participantCount - 4}
                </span>
              </div>
            )}
          </div>
          {meeting.participantCount > 0 && (
            <span className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              {meeting.participantCount}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canJoin && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.();
              }}
              className={cn(isLive && 'bg-green-600 hover:bg-green-700')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {isLive ? 'Join Now' : 'Join'}
            </Button>
          )}
        </div>
      </div>

      {/* Recurring indicator */}
      {meeting.isRecurring && (
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline mr-1" />
          Recurring meeting
        </div>
      )}
    </div>
  );
}
