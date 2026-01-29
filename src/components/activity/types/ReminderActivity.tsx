'use client';

/**
 * ReminderActivity Component
 *
 * Displays a reminder due activity
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ActivityDate } from '../ActivityDate';
import { ActivityIcon } from '../ActivityIcon';
import type { ReminderDueActivity } from '@/lib/activity/activity-types';

interface ReminderActivityProps {
  activity: ReminderDueActivity;
  onClick?: () => void;
  className?: string;
}

export function ReminderActivity({
  activity,
  onClick,
  className,
}: ReminderActivityProps) {
  const { reminderText, message, channel, isRead, createdAt } = activity;

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !isRead && 'bg-amber-50 dark:bg-amber-950/30',
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full" />
      )}

      {/* Icon */}
      <ActivityIcon type="reminder_due" size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-medium', !isRead && 'text-amber-700 dark:text-amber-300')}>
                Reminder
              </p>
              <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded">
                Due now
              </span>
            </div>

            {/* Reminder text */}
            <p className="mt-1 text-sm">
              {reminderText}
            </p>

            {/* Related message if available */}
            {message && (
              <div className="mt-2 p-2 rounded-md bg-background border-l-2 border-amber-300">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {message.contentPreview || message.content}
                </p>
              </div>
            )}

            {/* Channel context if available */}
            {channel && (
              <p className="mt-1 text-xs text-muted-foreground">
                from <span className="font-medium">#{channel.name}</span>
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle mark complete
                }}
                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900 dark:hover:bg-green-800 rounded transition-colors"
              >
                Mark complete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle snooze
                }}
                className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                Snooze
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <ActivityDate date={createdAt} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default ReminderActivity;
