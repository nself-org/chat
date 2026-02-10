/**
 * @nself-chat/core/constants - Constants barrel export
 *
 * Application-wide constants and configuration values.
 *
 * @packageDocumentation
 * @module @nself-chat/core/constants
 */

export * from './roles'

// Additional constants from the original constants.ts file
// These are extracted from frontend/apps/web/src/lib/constants.ts

export const APP_NAME = 'nself-chat'
export const APP_SHORT_NAME = 'nchat'

export const MESSAGE_MAX_LENGTH = 10000
export const CHANNEL_NAME_MAX_LENGTH = 100
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const DISPLAY_NAME_MAX_LENGTH = 100
export const BIO_MAX_LENGTH = 500

export const DEFAULT_AVATAR_SIZE = 40
export const LARGE_AVATAR_SIZE = 80
export const SMALL_AVATAR_SIZE = 24

export const TYPING_INDICATOR_TIMEOUT = 3000 // 3 seconds
export const MESSAGE_EDIT_TIMEOUT = 900000 // 15 minutes
export const MESSAGE_DELETE_TIMEOUT = 3600000 // 1 hour

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg']

export const PRESENCE_UPDATE_INTERVAL = 60000 // 1 minute
export const ONLINE_STATUS_THRESHOLD = 300000 // 5 minutes
export const AWAY_STATUS_THRESHOLD = 1800000 // 30 minutes
