/**
 * Native Features Export
 * Central export point for all Capacitor native integrations
 */

// =============================================================================
// Core Native Plugins
// =============================================================================

export { pushNotifications } from './push-notifications'
export { camera } from './camera'
export { biometrics } from './biometrics'
export { filePicker } from './file-picker'
export { offlineSync } from './offline-sync'
export { haptics } from './haptics'
export { share } from './share'

// =============================================================================
// v0.9.0 Enhanced Features
// =============================================================================

// Widget Data Provider (iOS/Android)
export {
  widgetData,
  useWidgetData,
  formatMessagePreview,
  formatWidgetTimestamp,
} from './widget-data'
export type {
  WidgetData,
  UnreadMessagesWidgetData,
  RecentChatsWidgetData,
  QuickComposeWidgetData,
  StatusWidgetData,
  UnreadChannel,
  UnreadDirectMessage,
  RecentChat,
  QuickComposeRecipient,
  UserStatus,
} from './widget-data'

// Watch Connectivity (iOS Apple Watch)
export { watchConnectivity, useWatchConnectivity, WatchMessageTypes } from './watch-connectivity'
export type {
  WatchSessionStatus,
  WatchMessage,
  WatchApplicationContext,
  WatchConversation,
  WatchComplicationData,
  WatchSessionState,
  WatchReachability,
} from './watch-connectivity'

// Android Widgets
export { androidWidgets, useAndroidWidgets } from './android-widgets'
export type {
  AndroidWidgetConfig,
  AndroidWidgetType,
  AndroidWidgetSize,
  UnreadCounterWidgetData,
  RecentMessagesWidgetData,
  AndroidWidgetMessage,
  AndroidWidgetChannel,
  StatusWidgetData as AndroidStatusWidgetData,
} from './android-widgets'

// Deep Linking
export {
  deepLinking,
  useDeepLink,
  useChannelDeepLink,
  useInviteDeepLink,
  useOAuthDeepLink,
  wasLaunchedFromDeepLink,
  getLaunchDeepLink,
} from './deep-linking'
export type {
  DeepLinkRoute,
  DeepLinkParams,
  DeepLinkRouteConfig,
  DeepLinkHandlerOptions,
} from './deep-linking'

// Enhanced Push Notifications
export {
  enhancedPushNotifications,
  usePushNotifications,
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_CATEGORIES,
} from './push-notifications-v2'
export type {
  RichNotificationPayload,
  NotificationChannel,
  NotificationCategory,
  NotificationAction,
  VoIPPushPayload,
  NotificationStats,
} from './push-notifications-v2'

// Background Sync
export { backgroundSync, useBackgroundSync } from './background-sync'
export type {
  BackgroundSyncConfig,
  BackgroundSyncStatus,
  BackgroundTaskResult,
  SyncTask,
  SyncTaskType,
  SyncProgress,
  BackgroundSyncStats,
} from './background-sync'

// Enhanced Biometric Authentication
export { biometricAuth, useBiometricAuth } from './biometrics-v2'
export type {
  BiometryInfo,
  BiometryType as BiometryTypeV2,
  BiometryStrength,
  BiometricAuthOptions as BiometricAuthOptionsV2,
  BiometricAuthResult,
  BiometricError,
  SecureStorageOptions,
  BiometricSettings,
} from './biometrics-v2'

// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================

export type { NotificationPayload } from './push-notifications'
export type { MediaFile } from './camera'
export type { BiometricType, BiometricAuthOptions } from './biometrics'
export type { PickedFile, FilePickerOptions } from './file-picker'
export type { SyncOptions } from './offline-sync'
