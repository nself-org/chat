'use client';

/**
 * MeetingCalendar - Calendar view for meetings
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { Meeting, CalendarMonth } from '@/lib/meetings/meeting-types';
import { generateCalendarMonth, formatTime } from '@/lib/meetings';
import { useMeetingStore } from '@/stores/meeting-store';
import { MeetingCard } from './MeetingCard';

// ============================================================================
// Types
// ============================================================================

interface MeetingCalendarProps {
  meetings: Meeting[];
  onDateSelect?: (date: Date) => void;
  onMeetingClick?: (meeting: Meeting) => void;
  onScheduleClick?: (date: Date) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ============================================================================
// Component
// ============================================================================

export function MeetingCalendar({
  meetings,
  onDateSelect,
  onMeetingClick,
  onScheduleClick,
}: MeetingCalendarProps) {
  const {
    calendarViewDate,
    calendarViewMode,
    setCalendarViewDate,
    setCalendarViewMode,
    navigateCalendar,
    goToToday,
  } = useMeetingStore();

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Generate calendar data
  const calendarMonth = React.useMemo(
    () => generateCalendarMonth(
      calendarViewDate.getFullYear(),
      calendarViewDate.getMonth(),
      meetings
    ),
    [calendarViewDate, meetings]
  );

  // Handle date click
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(new Date(date));
    }
  };

  // Get meetings for selected date
  const selectedDateMeetings = selectedDate
    ? meetings.filter((m) => {
        const meetingDate = new Date(m.scheduledStartAt).toISOString().split('T')[0];
        return meetingDate === selectedDate;
      })
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCalendar('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCalendar('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarMonth.weeks.flatMap((week) =>
            week.days.map((day) => {
              const hasMeetings = day.meetings.length > 0;
              const isSelected = selectedDate === day.date;

              return (
                <button
                  key={day.date}
                  onClick={() => handleDateClick(day.date)}
                  className={cn(
                    'min-h-24 p-1 border rounded-lg text-left transition-colors',
                    day.isCurrentMonth
                      ? 'bg-card'
                      : 'bg-muted/30 text-muted-foreground',
                    day.isWeekend && 'bg-muted/50',
                    day.isToday && 'ring-2 ring-primary',
                    isSelected && 'ring-2 ring-primary bg-primary/5',
                    'hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center h-6 w-6 text-sm rounded-full',
                        day.isToday && 'bg-primary text-primary-foreground font-medium'
                      )}
                    >
                      {new Date(day.date).getDate()}
                    </span>
                    {hasMeetings && (
                      <Badge variant="secondary" className="text-xs">
                        {day.meetings.length}
                      </Badge>
                    )}
                  </div>

                  {/* Meeting Previews */}
                  <div className="mt-1 space-y-0.5">
                    {day.meetings.slice(0, 2).map((meeting) => (
                      <div
                        key={meeting.id}
                        className={cn(
                          'px-1 py-0.5 text-xs rounded truncate',
                          meeting.status === 'live'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-primary/10 text-primary'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMeetingClick?.(meeting);
                        }}
                      >
                        {formatTime(meeting.scheduledStartAt)} {meeting.title}
                      </div>
                    ))}
                    {day.meetings.length > 2 && (
                      <div className="px-1 text-xs text-muted-foreground">
                        +{day.meetings.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Date Panel */}
      {selectedDate && (
        <div className="w-full lg:w-80 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h3>
            <Button
              size="sm"
              onClick={() => onScheduleClick?.(new Date(selectedDate))}
            >
              <Plus className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </div>

          {selectedDateMeetings.length > 0 ? (
            <div className="space-y-3">
              {selectedDateMeetings
                .sort((a, b) =>
                  new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime()
                )
                .map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    variant="compact"
                    onClick={() => onMeetingClick?.(meeting)}
                  />
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No meetings scheduled</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => onScheduleClick?.(new Date(selectedDate))}
              >
                Schedule a meeting
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
