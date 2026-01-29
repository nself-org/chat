'use client';

/**
 * MessageActivity Component
 *
 * Displays a message activity
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ActivityAvatar } from '../ActivityAvatar';
import { ActivityDate } from '../ActivityDate';
import type { MessageActivity as MessageActivityType } from '@/lib/activity/activity-types';

interface MessageActivityProps {
  activity: MessageActivityType;
  onClick?: () => void;
  className?: string;
}

export function MessageActivity({
  activity,
  onClick,
  className,
}: MessageActivityProps) {
  const { actor, message, channel, isRead, createdAt } = activity;

  return (
    <div
      className={cn(
        'group flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !isRead && 'bg-primary/5',
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
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
              {' sent a message in '}
              <span className="font-medium text-primary">#{channel.name}</span>
            </p>

            {/* Message preview */}
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {message.contentPreview || message.content}
            </p>
          </div>

          {/* Timestamp */}
          <ActivityDate date={createdAt} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default MessageActivity;
