'use client';

/**
 * MentionActivity Component
 *
 * Displays a mention activity
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ActivityAvatar } from '../ActivityAvatar';
import { ActivityDate } from '../ActivityDate';
import { ActivityIcon } from '../ActivityIcon';
import type { MentionActivity as MentionActivityType } from '@/lib/activity/activity-types';

interface MentionActivityProps {
  activity: MentionActivityType;
  onClick?: () => void;
  className?: string;
}

export function MentionActivity({
  activity,
  onClick,
  className,
}: MentionActivityProps) {
  const { actor, mentionType, message, channel, thread, isRead, createdAt } = activity;

  const getMentionText = () => {
    switch (mentionType) {
      case 'everyone':
        return 'mentioned @everyone';
      case 'here':
        return 'mentioned @here';
      case 'channel':
        return `mentioned #${channel.name}`;
      default:
        return 'mentioned you';
    }
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !isRead && 'bg-purple-50 dark:bg-purple-950/30',
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
      )}

      {/* Avatar */}
      <ActivityAvatar actor={actor} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2">
              <p className={cn('text-sm', !isRead && 'font-medium')}>
                <span className="font-medium">{actor.displayName}</span>
                {' '}
                {getMentionText()}
              </p>
              <ActivityIcon type="mention" size="sm" />
            </div>

            {/* Message preview */}
            <div className="mt-2 p-2 rounded-md bg-background border">
              <p className="text-sm line-clamp-3">
                {message.contentPreview || message.content}
              </p>
            </div>

            {/* Context info */}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                in <span className="font-medium">#{channel.name}</span>
              </span>
              {thread && (
                <>
                  <span>|</span>
                  <span>
                    Thread ({thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'})
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <ActivityDate date={createdAt} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default MentionActivity;
