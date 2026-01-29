/**
 * Hooks Index
 *
 * Central export point for all custom hooks
 */

// ============================================================================
// Domain Hooks
// ============================================================================

// Channels
export { useChannels, useChannel, useCreateChannel } from './use-channels'

// Messages
export {
  useMessages,
  useSendMessage,
  useUpdateMessage,
  useDeleteMessage,
  useReactions,
} from './use-messages'

// Threads
export {
  useThread,
  useCreateThread,
  type ThreadUser,
  type ThreadAttachment,
  type ThreadReaction,
  type ThreadMessage,
  type ThreadParticipant,
  type Thread,
  type UseThreadOptions,
  type UseThreadReturn,
  type UseCreateThreadOptions,
} from './use-thread'

// Notifications
export {
  useNotifications,
  type UseNotificationsOptions,
  type UseNotificationsReturn,
} from './use-notifications'

// Unread Counts
export {
  useUnreadCounts,
  useChannelUnread,
  type ChannelUnreadInfo,
  type UseUnreadCountsOptions,
  type UseUnreadCountsReturn,
} from './use-unread-counts'

// Toast
export { useToast, toast } from './use-toast'

// ============================================================================
// Utility Hooks
// ============================================================================

// Debounce
export { useDebounce, useDebouncedCallback } from './use-debounce'

// Local Storage
export { useLocalStorage } from './use-local-storage'

// Media Queries
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersDarkMode,
  usePrefersReducedMotion,
  breakpoints,
} from './use-media-query'

// Click Outside
export { useClickOutside, useClickOutsideRef } from './use-click-outside'

// Scroll Position
export {
  useScrollPosition,
  useScrollToBottom,
  useIsAtBottom,
  useScrollManagement,
} from './use-scroll-position'

// Intersection Observer
export { useInView, useInfiniteScroll } from './use-intersection-observer'

// Clipboard
export { useCopyToClipboard, useClipboard } from './use-clipboard'

// Online Status
export { useOnlineStatus, useNetworkStatus } from './use-online-status'

// Window Focus
export {
  useWindowFocus,
  useWindowFocusEffect,
  useDocumentVisibility,
} from './use-window-focus'

// Previous Value
export { usePrevious, usePreviousWithInitial, useValueChange } from './use-previous'

// Mounted State
export {
  useIsMounted,
  useMountedRef,
  useOnMount,
  useOnUnmount,
  useSafeSetState,
} from './use-mounted'

// ============================================================================
// Auth & Permissions Hooks
// ============================================================================

// Role Hook
export {
  useRole,
  useHasRole,
  useIsRoleAllowed,
  useIsAdmin,
  useIsModerator,
  type UseRoleReturn,
} from './use-role'

// Permissions Hook
export {
  usePermissions,
  useCan,
  useCanAll,
  useCanAny,
  useChannelPermissions,
  useMessagePermissions,
  useFilePermissions,
  useUserPermissions,
  useAdminPermissions,
  useModerationPermissions,
  useSystemPermissions,
  type UsePermissionsReturn,
} from './use-permissions'

// ============================================================================
// Command Palette Hooks
// ============================================================================

// Command Palette
export {
  useCommandPalette,
  type UseCommandPaletteOptions,
  type UseCommandPaletteReturn,
} from './useCommandPalette'

// Quick Switch
export {
  useQuickSwitch,
  type QuickSwitchItem,
  type UseQuickSwitchOptions,
  type UseQuickSwitchReturn,
} from './useQuickSwitch'

// ============================================================================
// Socket Hooks (re-exported from lib/socket)
// ============================================================================

export { useSocket } from '@/lib/socket/hooks/use-socket'
export { usePresence } from '@/lib/socket/hooks/use-presence'
export { useTyping } from '@/lib/socket/hooks/use-typing'
export { useChannelEvents } from '@/lib/socket/hooks/use-channel-events'
