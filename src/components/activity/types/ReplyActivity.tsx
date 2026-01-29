'use client';

/**
 * ReplyActivity Component
 *
 * Displays a reply activity (reply to user's message)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ActivityAvatar } from '../ActivityAvatar';
import { ActivityDate } from '../ActivityDate';
import type { ReplyActivity as ReplyActivityType } from '@/lib/activity/activity-types';

interface ReplyActivityProps {
  activity: ReplyActivityType;
  onClick?: () => void;
  className?: string;
}

export function ReplyActivity({
  activity,
  onClick,
  className,
}: ReplyActivityProps) {
  const { actor, message, parentMessage, channel, isRead, createdAt } = activity;

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !isRead && 'bg-green-50 dark:bg-green-950/30',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full" />
      )}

      {/* Avatar */}
      <ActivityAvatar actor={actor} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <p className={cn('text-sm', !isRead && 'font-medium')}>
              <span className="font-medium">{actor.displayName}</span>
              {' replied to your message'}
            </p>

            {/* Parent message (the message being replied to) */}
            <div className="mt-2 p-2 rounded-md bg-muted/50 border-l-2 border-muted-foreground/30">
              <p className="text-xs text-muted-foreground mb-1">Your message:</p>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {parentMessage.contentPreview || parentMessage.content}
              </p>
            </div>

            {/* Reply message */}
            <div className="mt-2 p-2 rounded-md bg-background border">
              <p className="text-sm line-clamp-2">
                {message.contentPreview || message.content}
              </p>
            </div>

            {/* Channel info */}
            <p className="mt-1 text-xs text-muted-foreground">
              in <span className="font-medium">#{channel.name}</span>
            </p>
          </div>

          {/* Timestamp */}
          <ActivityDate date={createdAt} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default ReplyActivity;
