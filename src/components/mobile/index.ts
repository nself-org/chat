// ============================================================================
// Mobile Components - Index
// ============================================================================

// Navigation
export { MobileNav, MobileNavFAB, MobileNavCompact } from './mobile-nav'
export type { NavItem, MobileNavProps, MobileNavFABProps } from './mobile-nav'

// Header
export {
  MobileHeader,
  MobileSearchHeader,
  MobileChannelHeader,
} from './mobile-header'
export type {
  HeaderAction,
  MobileHeaderProps,
  MobileSearchHeaderProps,
  MobileChannelHeaderProps,
} from './mobile-header'

// Sidebar
export { MobileSidebar } from './mobile-sidebar'
export type {
  Channel,
  ChannelSection,
  MobileSidebarProps,
} from './mobile-sidebar'

// Channel View
export { MobileChannelView } from './mobile-channel-view'
export type {
  Message as MobileMessage,
  MobileChannelViewProps,
} from './mobile-channel-view'

// Message Input
export { MobileMessageInput } from './mobile-message-input'
export type {
  MobileMessageInputProps,
  MobileMessageInputRef,
} from './mobile-message-input'

// Action Sheet
export { MobileActionSheet, StandaloneActionSheet } from './mobile-action-sheet'
export type {
  MobileActionSheetProps,
  StandaloneActionSheetProps,
} from './mobile-action-sheet'

// Drawer
export {
  MobileDrawer,
  BottomSheet,
  SideDrawer,
  SnapDrawer,
} from './mobile-drawer'
export type {
  MobileDrawerProps,
  BottomSheetProps,
  SideDrawerProps,
  SnapDrawerProps,
} from './mobile-drawer'

// Swipe Actions
export {
  SwipeActions,
  MessageSwipeActions,
  ChannelSwipeActions,
  createReplyAction,
  createReactAction,
  createDeleteAction,
  createPinAction,
  createForwardAction,
  createMoreAction,
} from './swipe-actions'
export type {
  SwipeAction,
  SwipeActionsProps,
  MessageSwipeActionsProps,
  ChannelSwipeActionsProps,
} from './swipe-actions'
