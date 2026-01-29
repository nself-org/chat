/**
 * Notification Library - nself-chat
 *
 * Comprehensive notification management system including:
 * - Type definitions
 * - Preference management
 * - Quiet hours/DND
 * - Keyword matching
 * - Sound management
 * - Delivery channels
 * - Scheduling
 */

// Types
export * from './notification-types';

// Notification Manager
export {
  NotificationManager,
  getNotificationManager,
  resetNotificationManager,
  type NotificationPayload,
  type DeliveryResult,
  type NotificationManagerOptions,
} from './notification-manager';

// Preferences
export {
  loadPreferences,
  savePreferences,
  clearPreferences,
  updateGlobalEnabled,
  updateDesktopSettings,
  updatePushSettings,
  updateEmailSettings,
  updateSoundSettings,
  updateQuietHours,
  updateMentionSettings,
  updateDMSettings,
  getChannelSettings,
  updateChannelSettings,
  removeChannelSettings,
  muteChannel,
  unmuteChannel,
  setChannelLevel,
  addKeyword,
  updateKeyword,
  removeKeyword,
  toggleKeyword,
  validatePreferences,
  exportPreferences,
  importPreferences,
  getEffectiveSettings,
  hasAnyNotificationEnabled,
  getPreferencesSummary,
} from './notification-preferences';

// Quiet Hours
export {
  parseTimeToMinutes,
  formatMinutesToTime,
  getCurrentTimeMinutes,
  getCurrentDayOfWeek,
  isWeekend,
  isInQuietHours,
  willBeInQuietHours,
  getTimeUntilQuietHoursEnd,
  getTimeUntilQuietHoursStart,
  formatRemainingTime,
  validateQuietHoursSchedule,
  getNextQuietHoursPeriod,
  isInWeekendQuietHours,
  createDefaultSchedule,
  getDayDisplayName,
  getAllDaysOfWeek,
  getWeekdays,
  getWeekendDays,
} from './quiet-hours';

// Keyword Matching
export {
  escapeRegex,
  createKeywordPattern,
  matchKeyword,
  matchKeywords,
  hasKeywordMatch,
  highlightMatches,
  getHighlightedResult,
  createKeyword,
  validateKeyword,
  isDuplicateKeyword,
  getKeywordsForChannel,
  sortKeywords,
  searchKeywords,
  getKeywordStats,
  type MatchOptions,
  type HighlightedResult,
} from './keyword-matcher';

// Sounds
export {
  NOTIFICATION_SOUNDS,
  DEFAULT_SOUNDS_BY_TYPE,
  playNotificationSound,
  playSoundForType,
  stopAllSounds,
  stopSound,
  preloadSounds,
  preloadSpecificSounds,
  areSoundsPreloaded,
  clearAudioCache,
  getSoundById,
  getSoundsByCategory,
  getAvailableSounds,
  getSoundName,
  addCustomSound,
  removeCustomSound,
  getCustomSounds,
  normalizeVolume,
  volumeToAudioLevel,
  getVolumeIcon,
  playTestSound,
  playTestBeep,
} from './notification-sounds';

// Channels
export {
  isDesktopAvailable,
  getDesktopPermission,
  requestDesktopPermission,
  deliverDesktopNotification,
  isPushAvailable,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  deliverPushNotification,
  sendEmailNotification,
  registerInAppHandler,
  unregisterInAppHandler,
  deliverInAppNotification,
  getChannelStatuses,
  getAvailableMethods,
  deliverToChannels,
  type NotificationChannelStatus,
  type DeliveryPayload,
  type EmailPayload,
  type InAppNotificationHandler,
} from './notification-channels';

// Scheduler
export {
  parseTimeForToday,
  getNextOccurrence,
  getNextDayOccurrence,
  getNextDigestTime,
  getDigestPeriod,
  shouldSendDigest,
  generateDigestContent,
  formatDigestAsText,
  formatDigestAsHtml,
  createScheduledNotification,
  getDueNotifications,
  processScheduledNotification,
  type ScheduledNotification,
  type DigestConfig,
  type DigestContent,
} from './notification-scheduler';
