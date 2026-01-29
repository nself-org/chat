'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PinnedMessage } from '@/lib/pinned';
import { PinnedIndicator } from './PinnedIndicator';

export interface PinnedMessageCardProps {
  /** The pinned message */
  pin: PinnedMessage;
  /** Callback to navigate to the message */
  onJumpToMessage?: (messageId: string, channelId: string) => void;
  /** Callback to unpin the message */
  onUnpin?: (pin: PinnedMessage) => void;
  /** Callback to copy message content */
  onCopy?: (content: string) => void;
  /** Whether the user can unpin */
  canUnpin?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Card component for displaying a pinned message.
 */
export function PinnedMessageCard({
  pin,
  onJumpToMessage,
  onUnpin,
  onCopy,
  canUnpin = true,
  compact = false,
  className,
}: PinnedMessageCardProps) {
  const { message, pinnedBy, pinnedAt, note } = pin;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
  };

  const handleJumpToMessage = () => {
    onJumpToMessage?.(message.id, message.channelId);
  };

  const handleCopy = () => {
    onCopy?.(message.content);
    navigator.clipboard.writeText(message.content);
  };

  if (compact) {
    return (
      <div
        className={cn(
          'group flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer',
          className
        )}
        onClick={handleJumpToMessage}
      >
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={message.user.avatarUrl} alt={message.user.displayName} />
          <AvatarFallback className="text-xs">
            {getInitials(message.user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {message.user.displayName}
            </span>
            <PinnedIndicator size="sm" />
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {truncateContent(message.content, 100)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.user.avatarUrl} alt={message.user.displayName} />
            <AvatarFallback>{getInitials(message.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{message.user.displayName}</span>
              <PinnedIndicator
                variant="badge"
                pinnedBy={pinnedBy.displayName}
                pinnedAt={pinnedAt}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleJumpToMessage}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Jump to message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy text
            </DropdownMenuItem>
            {canUnpin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onUnpin?.(pin)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Unpin message
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="pl-10">
        <p className="text-sm whitespace-pre-wrap break-words">
          {truncateContent(message.content)}
        </p>

        {/* Attachments indicator */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {message.attachments.length} attachment
              {message.attachments.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Pin note */}
        {note && (
          <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
            <span className="font-medium">Note:</span> {note}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleJumpToMessage}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View in channel
          </Button>
        </div>
      </div>
    </div>
  );
}
