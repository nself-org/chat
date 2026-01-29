'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotificationSettingsStore } from '@/stores/notification-settings-store';
import { getAllDaysOfWeek, isInQuietHours, formatRemainingTime, getTimeUntilQuietHoursEnd } from '@/lib/notifications/quiet-hours';
import type { DayOfWeek } from '@/lib/notifications/notification-types';

export interface QuietHoursPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * QuietHoursPanel - Do Not Disturb schedule settings
 */
export function QuietHoursPanel({
  className,
  ...props
}: QuietHoursPanelProps) {
  const quietHours = useNotificationSettingsStore((state) => state.preferences.quietHours);
  const updateQuietHours = useNotificationSettingsStore((state) => state.updateQuietHours);
  const setQuietHoursEnabled = useNotificationSettingsStore((state) => state.setQuietHoursEnabled);
  const setQuietHoursTime = useNotificationSettingsStore((state) => state.setQuietHoursTime);
  const toggleQuietHoursDay = useNotificationSettingsStore((state) => state.toggleQuietHoursDay);

  const daysOfWeek = getAllDaysOfWeek();

  // Check if currently in quiet hours
  const isActive = isInQuietHours(quietHours);
  const timeUntilEnd = isActive ? getTimeUntilQuietHoursEnd(quietHours) : null;

  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Master Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="quiet-enabled" className="text-base font-medium">
              Quiet Hours
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically pause notifications during set hours
            </p>
          </div>
          <Switch
            id="quiet-enabled"
            checked={quietHours.enabled}
            onCheckedChange={setQuietHoursEnabled}
          />
        </div>

        {/* Active Status */}
        {quietHours.enabled && isActive && timeUntilEnd !== null && (
          <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <p className="text-sm font-medium">Quiet Hours Active</p>
              <p className="text-xs text-muted-foreground">
                Ends in {formatRemainingTime(timeUntilEnd)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Schedule */}
      <Card className={cn('p-4', !quietHours.enabled && 'opacity-50 pointer-events-none')}>
        <h3 className="text-sm font-medium mb-4">Schedule</h3>
        <div className="space-y-4">
          {/* Time Range */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="start-time" className="text-xs text-muted-foreground">
                Start time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={quietHours.startTime}
                onChange={(e) => setQuietHoursTime(e.target.value, quietHours.endTime)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-time" className="text-xs text-muted-foreground">
                End time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={quietHours.endTime}
                onChange={(e) => setQuietHoursTime(quietHours.startTime, e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-2">
              Active days
            </Label>
            <div className="flex gap-1">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleQuietHoursDay(day.value as DayOfWeek)}
                  className={cn(
                    'flex-1 px-2 py-2 text-xs font-medium rounded-md border transition-colors',
                    quietHours.days.includes(day.value as DayOfWeek)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  )}
                >
                  {day.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Options */}
      <Card className={cn('p-4', !quietHours.enabled && 'opacity-50 pointer-events-none')}>
        <h3 className="text-sm font-medium mb-4">Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-mentions">Allow @mentions to break through</Label>
              <p className="text-xs text-muted-foreground">
                Direct mentions will still notify you
              </p>
            </div>
            <Switch
              id="allow-mentions"
              checked={quietHours.allowMentionsBreakthrough}
              onCheckedChange={(allowMentionsBreakthrough) =>
                updateQuietHours({ allowMentionsBreakthrough })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekends">Enable on weekends</Label>
              <p className="text-xs text-muted-foreground">
                Apply quiet hours on Saturday and Sunday
              </p>
            </div>
            <Switch
              id="weekends"
              checked={quietHours.enableOnWeekends}
              onCheckedChange={(enableOnWeekends) =>
                updateQuietHours({ enableOnWeekends })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-status">Auto-set status</Label>
              <p className="text-xs text-muted-foreground">
                Automatically set your status to DND during quiet hours
              </p>
            </div>
            <Switch
              id="auto-status"
              checked={quietHours.autoSetStatus}
              onCheckedChange={(autoSetStatus) =>
                updateQuietHours({ autoSetStatus })
              }
            />
          </div>
        </div>
      </Card>

      {/* Quick Presets */}
      <Card className={cn('p-4', !quietHours.enabled && 'opacity-50 pointer-events-none')}>
        <h3 className="text-sm font-medium mb-4">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setQuietHoursTime('22:00', '08:00');
              updateQuietHours({ days: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[] });
            }}
            className="p-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium block">Nighttime</span>
            <span className="text-xs text-muted-foreground">10pm - 8am, every day</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuietHoursTime('18:00', '09:00');
              updateQuietHours({ days: [1, 2, 3, 4, 5] as DayOfWeek[] });
            }}
            className="p-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium block">After Work</span>
            <span className="text-xs text-muted-foreground">6pm - 9am, weekdays</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuietHoursTime('00:00', '23:59');
              updateQuietHours({ days: [0, 6] as DayOfWeek[] });
            }}
            className="p-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium block">Weekends</span>
            <span className="text-xs text-muted-foreground">All day Sat & Sun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuietHoursTime('21:00', '07:00');
              updateQuietHours({
                days: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[],
                allowMentionsBreakthrough: true,
              });
            }}
            className="p-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium block">Sleep Mode</span>
            <span className="text-xs text-muted-foreground">9pm - 7am, mentions OK</span>
          </button>
        </div>
      </Card>

      {/* Timezone Info */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Timezone: {quietHours.timezone}</span>
        </div>
      </Card>
    </div>
  );
}

QuietHoursPanel.displayName = 'QuietHoursPanel';

export default QuietHoursPanel;
