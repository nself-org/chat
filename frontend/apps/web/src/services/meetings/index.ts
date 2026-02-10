/**
 * Meetings Service - Exports
 *
 * @module services/meetings
 * @version 0.9.1
 */

export {
  MeetingService,
  getMeetingService,
  resetMeetingService,
  type CreateMeetingResult,
  type UpdateMeetingResult,
  type RSVPResult,
  type InviteResult,
  type MeetingQueryOptions,
  type RescheduleOptions,
  type CancelMeetingOptions,
} from './meeting.service'

export {
  CalendarService,
  getCalendarService,
  resetCalendarService,
  type ScheduledReminder,
  type CalendarExport,
  type ReminderPreferences,
  type ReminderDeliveryResult,
} from './calendar.service'
