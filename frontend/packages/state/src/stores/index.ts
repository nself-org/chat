/**
 * Stores Index
 *
 * Barrel export for all Zustand stores.
 *
 * @packageDocumentation
 * @module @nself-chat/state/stores
 */

// ============================================================================
// App Store (Global Application State)
// ============================================================================

export {
  useAppStore,
  selectInitStatus,
  selectIsReady,
  selectIsLoading,
  selectConnectionStatus,
  selectIsConnected,
  selectSession,
  selectIsAuthenticated,
  selectSettings,
  selectFeatureFlags,
  selectLastError,
  selectHasError,
  selectActiveModal,
  selectModalData,
  useFeatureFlag,
  useInitStatus,
  useConnectionStatus,
  useSession,
  useSettings,
} from './app-store'

export type {
  InitializationStatus,
  ConnectionStatus,
  AppError,
  FeatureFlags,
  UserSession,
  GlobalSettings,
  AppState,
  AppActions,
  AppStore,
} from './app-store'

// ============================================================================
// UI Store
// ============================================================================

export {
  useUIStore,
  selectSidebarState,
  selectThreadPanelState,
  selectHasActiveOverlay,
  selectIsMobileMenuVisible,
} from './ui-store'

export type { ModalType, ModalData, UIState, UIActions, UIStore } from './ui-store'

// ============================================================================
// Channel Store
// ============================================================================

export {
  useChannelStore,
  selectActiveChannel,
  selectChannelList,
  selectPublicChannels,
  selectPrivateChannels,
  selectDirectMessages,
  selectStarredChannels,
  selectMutedChannels,
  selectRecentChannels,
  selectVisibleChannels,
  selectChannelsByCategory,
  selectIsChannelMuted,
  selectIsChannelStarred,
  selectIsChannelPinned,
} from './channel-store'

export type {
  ChannelType,
  ChannelMember,
  Channel,
  ChannelCategory,
  ChannelState,
  ChannelActions,
  ChannelStore,
} from './channel-store'

// ============================================================================
// Message Store
// ============================================================================

export {
  useMessageStore,
  selectMessages,
  selectIsLoading as selectMessageIsLoading,
  selectHasMore,
  selectTypingUsers,
  selectUnreadCount,
  selectIsEditing,
  selectIsReplying,
} from './message-store'

export type {
  EditingState,
  ReplyingState,
  MessageState,
  MessageActions,
  MessageStore,
} from './message-store'

// ============================================================================
// Thread Store
// ============================================================================

export {
  useThreadStore,
  selectActiveThread,
  selectThreadList,
  selectFollowedThreads,
  selectUnreadThreads,
  selectThreadsByChannel,
  selectThreadMessagesForThread,
  selectIsThreadFollowed,
  selectIsThreadMuted,
  selectHasMoreThreadMessages,
  selectTotalUnreadThreadCount,
} from './thread-store'

export type {
  ThreadParticipant,
  ThreadMessage,
  Thread,
  ThreadState,
  ThreadActions,
  ThreadStore,
} from './thread-store'

// ============================================================================
// User Store
// ============================================================================

export {
  useUserStore,
  selectCurrentUser,
  selectUserById,
  selectPresence,
  selectCustomStatus,
  selectAllUsers,
  selectFilteredUsers,
  selectOnlineUsers,
  selectOfflineUsers,
  selectUsersByRole,
  getInitials,
  getRoleColor,
  getRoleLabel,
  getPresenceColor,
  getPresenceLabel,
} from './user-store'

export type {
  UserRole,
  PresenceStatus,
  CustomStatus,
  UserProfile,
  UserState,
  UserActions,
  UserStore,
} from './user-store'

// ============================================================================
// Notification Store
// ============================================================================

export {
  useNotificationStore,
  selectUnreadTotal,
  selectUnreadMentions,
  selectChannelUnread,
  selectIsChannelMuted as selectIsChannelNotificationMuted,
  selectNotificationPreferences,
  selectHasUnread,
} from './notification-store'

export type {
  NotificationType,
  NotificationPriority,
  ChannelNotificationLevel,
  NotificationActor,
  Notification,
  ChannelNotificationSettings,
  DoNotDisturbSchedule,
  NotificationPreferences,
  UnreadCounts,
  NotificationState,
  NotificationActions,
  NotificationStore,
} from './notification-store'

// ============================================================================
// Typing Store
// ============================================================================

export {
  useTypingStore,
  getChannelContextKey,
  getThreadContextKey,
  getDMContextKey,
  parseContextKey,
  selectChannelTypingUsers,
  selectThreadTypingUsers,
  selectDMTypingUsers,
  selectIsAnyoneTyping,
  selectTypingCount,
  selectCurrentUserTyping,
  getTypingIndicatorText,
} from './typing-store'

export type { TypingUser, TypingState, TypingActions, TypingStore } from './typing-store'

// ============================================================================
// Presence Store
// ============================================================================

export {
  usePresenceStore,
  selectMyPresence,
  selectMyStatus,
  selectMyCustomStatus,
  selectUserPresence,
  selectUserStatus,
  selectIsUserOnline,
  selectOnlineUsers as selectPresenceOnlineUsers,
  selectOnlineCount,
  selectTypingUsers as selectPresenceTypingUsers,
  selectChannelTypingUsers as selectPresenceChannelTypingUsers,
  selectThreadTypingUsers as selectPresenceThreadTypingUsers,
  selectIsAnyoneTyping as selectPresenceIsAnyoneTyping,
  selectSettings as selectPresenceSettings,
  selectIsConnected as selectPresenceIsConnected,
  getChannelContextKey as getPresenceChannelContextKey,
  getThreadContextKey as getPresenceThreadContextKey,
  getDMContextKey as getPresenceDMContextKey,
} from './presence-store'

export type { PresenceState, PresenceActions, PresenceStore } from './presence-store'

// ============================================================================
// Draft Store
// ============================================================================

export {
  useDraftStore,
  getChannelDraftKey,
  getThreadDraftKey,
  getDMDraftKey,
  selectDraft,
  selectDraftContent,
  selectHasDraft,
  selectDraftReply,
  selectPendingAttachments,
  selectDraftContexts,
  selectDraftCount,
  selectActiveDraftContext,
  selectActiveDraft,
} from './draft-store'

export type {
  DraftAttachment,
  MessageDraft,
  DraftState,
  DraftActions,
  DraftStore,
} from './draft-store'

// ============================================================================
// Preferences Store
// ============================================================================

export {
  usePreferencesStore,
  selectTheme,
  selectAccentColor,
  selectMessageDensity,
  selectFontSize,
  selectDisplayPreferences,
  selectInputPreferences,
  selectMediaPreferences,
  selectSoundPreferences,
  selectAccessibilityPreferences,
  selectPrivacyPreferences,
  selectKeyboardShortcuts,
  selectKeyboardShortcutsByCategory,
  selectKeyboardShortcut,
  selectEnabledKeyboardShortcuts,
  selectPreferencesOpen,
  formatShortcutKeys,
  getFontSizePixels,
  getMessageSpacing,
} from './preferences-store'

export type {
  ThemeMode,
  MessageDensity,
  TimestampFormat,
  TimeFormat,
  DateFormat,
  FontSize,
  MessageGrouping,
  SidebarPosition,
  EnterKeyBehavior,
  MediaAutoplay,
  DisplayPreferences,
  InputPreferences,
  MediaPreferences,
  SoundPreferences,
  AccessibilityPreferences,
  PrivacyPreferences,
  KeyboardShortcut,
  PreferencesState,
  PreferencesActions,
  PreferencesStore,
} from './preferences-store'

// ============================================================================
// Search Store
// ============================================================================

export {
  useSearchStore,
  selectHasActiveFilters,
  selectActiveFilterCount,
  selectFilteredResults,
  selectResultsByType,
  selectInChannelSearchState,
} from './search-store'

export type {
  SearchTab,
  SearchSortBy,
  HasFilter,
  IsFilter,
  DateRange,
  SearchFilters,
  SearchResultBase,
  MessageSearchResult,
  FileSearchResult,
  UserSearchResult,
  ChannelSearchResult,
  SearchResult,
  RecentSearch,
  SavedSearch,
  SearchState,
  SearchActions,
  SearchStore,
} from './search-store'

// ============================================================================
// Reaction Store
// ============================================================================

export {
  useReactionStore,
  selectRecentReactions,
  selectQuickReactions,
  selectSkinTone,
  selectPickerState,
  selectIsPickerOpen,
  selectPickerTarget,
  selectCustomEmojis,
  selectCustomEmojisByCategory,
  selectTopReactions,
  applyEmojiSkinTone,
  getEmojiCategories,
  getCategoryLabel,
  getCategoryIcon,
} from './reaction-store'

export type {
  CustomEmoji,
  ReactionUsage,
  ReactionPickerState,
  ReactionState,
  ReactionActions,
  ReactionStore,
} from './reaction-store'

// ============================================================================
// Attachment Store
// ============================================================================

export {
  useAttachmentStore,
  selectAllUploads,
  selectUploadsByChannel,
  selectUploadsByThread,
  selectPendingUploads,
  selectCompletedUploads,
  selectFailedUploads,
  selectUploadProgress,
  selectIsUploading,
  selectQueueLength,
  selectDragActive,
  selectTotalUploadProgress,
  formatFileSize,
  getFileIcon,
  getFileExtension,
  isPreviewable,
  estimateTimeRemaining,
} from './attachment-store'

export type {
  UploadStatus,
  FileType,
  UploadProgress,
  UploadQueueItem,
  AttachmentState,
  AttachmentActions,
  AttachmentStore,
} from './attachment-store'

// ============================================================================
// Read Receipts Store
// ============================================================================

export {
  useReadReceiptsStore,
  selectReadReceipts,
  selectReadCount,
  selectDeliveryStatus,
  selectShowReadReceipts,
  selectShareReadReceipts,
  selectChannelReadStatus,
  selectMyLastRead,
  selectHasUserRead,
  selectPendingReadsCount,
  selectIsLoadingChannel,
} from './read-receipts-store'

export type {
  ReadReceipt,
  ChannelReadStatus,
  DeliveryStatus as ReadReceiptsDeliveryStatus,
  MessageStatus,
  ReadReceiptsState,
  ReadReceiptsActions,
  ReadReceiptsStore,
} from './read-receipts-store'

// ============================================================================
// Media Store
// ============================================================================

export {
  useMediaStore,
  selectMediaItems,
  selectFilteredMediaItems,
  selectMediaLoading,
  selectMediaLoadingMore,
  selectMediaError,
  selectMediaFilters,
  selectMediaSorting,
  selectMediaPagination,
  selectMediaViewMode,
  selectSelectedMediaItems,
  selectIsSelectMode,
  selectMediaViewer,
  selectIsViewerOpen,
  selectCurrentViewerItem,
  selectMediaContext,
  selectMediaByType,
  selectMediaByChannel,
  selectSelectionCount,
  selectHasSelection,
} from './media-store'

export type { MediaState, MediaActions, MediaStore } from './media-store'

// ============================================================================
// Offline Store
// ============================================================================

export { useOfflineStore } from './offline-store'

export type {
  PendingMessage,
  OfflineStoreState,
  OfflineStoreActions,
  OfflineStore,
} from './offline-store'

// ============================================================================
// Connection Store
// ============================================================================

export { useConnectionStore } from './connection-store'

export type {
  ConnectionStoreState,
  ConnectionStoreActions,
  ConnectionStore,
} from './connection-store'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Reset all stores to their initial state
 * Useful for logout or testing
 */
export function resetAllStores() {
  useAppStore.getState().reset()
  useUIStore.getState().resetUI()
  useChannelStore.getState().resetChannelStore()
  useMessageStore.getState().reset()
  useThreadStore.getState().resetThreadStore()
  useUserStore.getState().reset()
  useNotificationStore.getState().reset()
  useTypingStore.getState().reset()
  usePresenceStore.getState().reset()
  useDraftStore.getState().reset()
  usePreferencesStore.getState().resetToDefaults()
  useSearchStore.getState().reset()
  useReactionStore.getState().reset()
  useAttachmentStore.getState().reset()
  useMediaStore.getState().reset()
  useReadReceiptsStore.getState().reset()
  useOfflineStore.getState().reset()
  useConnectionStore.getState().reset()
}
