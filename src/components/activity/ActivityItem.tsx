'use client';

/**
 * ActivityItem Component
 *
 * Displays a single activity item in the feed
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ActivityIcon } from './ActivityIcon';
import { ActivityAvatar } from './ActivityAvatar';
import { ActivityDate } from './ActivityDate';
import {
  formatActivityText,
  formatAggregatedActivityText,
  formatActivityDescription,
} from '@/lib/activity/activity-formatter';
import { isAggregatedActivity } from '@/lib/activity/activity-aggregator';
import type {
  Activity,
  AggregatedActivity,
  ActivityItemProps,
} from '@/lib/activity/activity-types';

/**
 * Get channel link text
 */
function getChannelText(activity: Activity | AggregatedActivity): string | null {
  if ('channel' in activity && activity.channel) {
    return `#${activity.channel.name}`;
  }
  return null;
}

/**
 * Get message preview
 */
function getMessagePreview(activity: Activity | AggregatedActivity): string | null {
  if (!isAggregatedActivity(activity) && 'message' in activity && activity.message) {
    return activity.message.contentPreview || activity.message.content;
  }
  if (isAggregatedActivity(activity) && activity.message) {
    return activity.message.contentPreview || activity.message.content;
  }
  return null;
}

export function ActivityItem({
  activity,
  compact = false,
  showAvatar = true,
  showChannel = true,
  showTimestamp = true,
  onClick,
  onMarkAsRead,
}: ActivityItemProps) {
  const isAggregated = isAggregatedActivity(activity);
  const isRead = activity.isRead;
  const createdAt = isAggregated ? activity.latestAt : activity.createdAt;
  const activityText = isAggregated
    ? formatAggregatedActivityText(activity)
    : formatActivityText(activity);
  const channelText = showChannel ? getChannelText(activity) : null;
  const messagePreview = getMessagePreview(activity);

  const handleClick = () => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead();
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !isRead && 'bg-primary/5',
        compact && 'p-2 gap-2'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}

      {/* Avatar or Icon */}
      {showAvatar && !compact && (
        <div className="shrink-0">
          {isAggregated ? (
            <ActivityAvatar
              actor={activity.actors.actors[0]}
              actors={activity.actors}
              size="md"
            />
          ) : (
            <ActivityAvatar actor={activity.actor} size="md" />
          )}
        </div>
      )}

      {compact && (
        <ActivityIcon type={activity.type} size="sm" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Activity text */}
            <p
              className={cn(
                'text-sm leading-snug',
                !isRead && 'font-medium'
              )}
            >
              {activityText}
            </p>

            {/* Message preview */}
            {messagePreview && !compact && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {messagePreview}
              </p>
            )}

            {/* Channel link */}
            {channelText && !compact && (
              <p className="mt-1 text-xs text-muted-foreground">
                in{' '}
                <span className="font-medium text-foreground/70">
                  {channelText}
                </span>
              </p>
            )}

            {/* Aggregated activity count */}
            {isAggregated && activity.count > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.count} activities
              </p>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <ActivityDate
              date={createdAt}
              className="shrink-0"
              format={compact ? 'smart' : 'relative'}
            />
          )}
        </div>
      </div>

      {/* Activity type icon (shown on hover for non-compact) */}
      {!compact && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActivityIcon type={activity.type} size="sm" />
        </div>
      )}
    </div>
  );
}

export default ActivityItem;
