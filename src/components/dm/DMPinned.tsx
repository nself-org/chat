'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pin,
  PinOff,
  MoreVertical,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import type { DirectMessage, DMPinnedMessage } from '@/lib/dm/dm-types';
import { formatDMTimestamp } from '@/lib/dm';
import { useDMStore, selectPinnedMessages } from '@/stores/dm-store';

// ============================================================================
// Types
// ============================================================================

interface DMPinnedProps {
  dm: DirectMessage;
  currentUserId: string;
  onMessageClick?: (messageId: string) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DMPinned({
  dm,
  currentUserId,
  onMessageClick,
  className,
}: DMPinnedProps) {
  const pinnedMessages = useDMStore(selectPinnedMessages(dm.id));
  const { removePinnedMessage, updateMessage } = useDMStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUnpin = async (messageId: string) => {
    try {
      removePinnedMessage(dm.id, messageId);
      updateMessage(dm.id, messageId, { isPinned: false });
      // TODO: Call API to unpin
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (pinnedMessages.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Pin className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-sm">No pinned messages</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Pin important messages to find them easily later.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Pin className="h-4 w-4" />
          Pinned Messages ({pinnedMessages.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {pinnedMessages.map((pinned) => (
            <PinnedMessageItem
              key={pinned.messageId}
              pinned={pinned}
              currentUserId={currentUserId}
              onMessageClick={onMessageClick}
              onUnpin={() => handleUnpin(pinned.messageId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Pinned Message Item
// ============================================================================

interface PinnedMessageItemProps {
  pinned: DMPinnedMessage;
  currentUserId: string;
  onMessageClick?: (messageId: string) => void;
  onUnpin: () => void;
}

function PinnedMessageItem({
  pinned,
  currentUserId,
  onMessageClick,
  onUnpin,
}: PinnedMessageItemProps) {
  const { message, pinnedByUser, pinnedAt } = pinned;

  return (
    <div className="group relative border rounded-lg p-3 hover:bg-accent/50 transition-colors">
      {/* Pin indicator */}
      <div className="absolute top-2 right-2">
        <Pin className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Message author */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={message.user.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">
            {message.user.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">
          {message.user.displayName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDMTimestamp(message.createdAt)}
        </span>
      </div>

      {/* Message content */}
      <p className="text-sm line-clamp-3 pr-8">{message.content}</p>

      {/* Pinned by info */}
      <p className="text-xs text-muted-foreground mt-2">
        Pinned by {pinnedByUser.displayName} on{' '}
        {new Date(pinnedAt).toLocaleDateString()}
      </p>

      {/* Actions */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMessageClick?.(message.id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Jump to message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUnpin}>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

DMPinned.displayName = 'DMPinned';
