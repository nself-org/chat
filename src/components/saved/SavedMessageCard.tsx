'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  FolderPlus,
  Tag,
  Star,
  StarOff,
  Bell,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavedMessage } from '@/lib/saved';
import { SavedIndicator } from './SavedIndicator';

export interface SavedMessageCardProps {
  /** The saved message */
  saved: SavedMessage;
  /** Callback to navigate to the message */
  onJumpToMessage?: (messageId: string, channelId: string) => void;
  /** Callback to unsave the message */
  onUnsave?: (saved: SavedMessage) => void;
  /** Callback to toggle star */
  onToggleStar?: (saved: SavedMessage) => void;
  /** Callback to add to collection */
  onAddToCollection?: (saved: SavedMessage) => void;
  /** Callback to edit note */
  onEditNote?: (saved: SavedMessage) => void;
  /** Callback to set reminder */
  onSetReminder?: (saved: SavedMessage) => void;
  /** Callback to copy message content */
  onCopy?: (content: string) => void;
  /** Compact display mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Card component for displaying a saved message.
 */
export function SavedMessageCard({
  saved,
  onJumpToMessage,
  onUnsave,
  onToggleStar,
  onAddToCollection,
  onEditNote,
  onSetReminder,
  onCopy,
  compact = false,
  className,
}: SavedMessageCardProps) {
  const { message, savedAt, note, tags, isStarred, reminderAt } = saved;

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
            <SavedIndicator size="sm" isStarred={isStarred} />
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
        isStarred && 'border-yellow-200 dark:border-yellow-900/50',
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
              <SavedIndicator
                variant="badge"
                savedAt={savedAt}
                isStarred={isStarred}
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
            <DropdownMenuItem onClick={() => onToggleStar?.(saved)}>
              {isStarred ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Unstar
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Star
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddToCollection?.(saved)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Add to collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditNote?.(saved)}>
              <Edit className="h-4 w-4 mr-2" />
              {note ? 'Edit note' : 'Add note'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetReminder?.(saved)}>
              <Bell className="h-4 w-4 mr-2" />
              {reminderAt ? 'Edit reminder' : 'Set reminder'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy text
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onUnsave?.(saved)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from saved
            </DropdownMenuItem>
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

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Note */}
        {note && (
          <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
            <span className="font-medium">Note:</span> {note}
          </div>
        )}

        {/* Reminder */}
        {reminderAt && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Bell className="h-3 w-3" />
            <span>
              Reminder:{' '}
              {formatDistanceToNow(reminderAt, { addSuffix: true })}
            </span>
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
