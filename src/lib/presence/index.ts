/**
 * Presence System - Central export file
 *
 * Provides user presence, status, activity, and typing functionality.
 */

// Types
export * from './presence-types';

// Utilities
export { IdleDetector, getIdleDetector, destroyIdleDetector } from './idle-detector';
export {
  TypingTracker,
  getTypingTracker,
  destroyTypingTracker,
  getTypingText,
} from './typing-tracker';
export {
  PresenceTracker,
  getPresenceTracker,
  destroyPresenceTracker,
} from './presence-tracker';
export {
  PresenceBroadcaster,
  getPresenceBroadcaster,
  destroyPresenceBroadcaster,
} from './presence-broadcaster';
export {
  PresenceManager,
  initializePresenceManager,
  getPresenceManager,
  destroyPresenceManager,
} from './presence-manager';
