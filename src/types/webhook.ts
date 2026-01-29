/**
 * Webhook Types for nself-chat
 *
 * Type definitions for webhooks, webhook deliveries, and webhook payloads.
 * Supports incoming webhooks (for posting messages) and outgoing webhooks (for events).
 */

import type { UserBasicInfo } from './user';
import type { Message } from './message';

// ============================================================================
// Webhook Type Definitions
// ============================================================================

/**
 * Webhook directions.
 */
export type WebhookDirection = 'incoming' | 'outgoing';

/**
 * Webhook status.
 */
export type WebhookStatus = 'active' | 'paused' | 'disabled' | 'error';

/**
 * Webhook event types (for outgoing webhooks).
 */
export type WebhookEventType =
  // Message events
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'message.pinned'
  | 'message.unpinned'
  // Reaction events
  | 'reaction.added'
  | 'reaction.removed'
  // Channel events
  | 'channel.created'
  | 'channel.updated'
  | 'channel.deleted'
  | 'channel.archived'
  // Member events
  | 'member.joined'
  | 'member.left'
  | 'member.updated'
  // User events
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  // Thread events
  | 'thread.created'
  | 'thread.updated'
  // File events
  | 'file.uploaded'
  | 'file.deleted';

/**
 * Webhook authentication methods.
 */
export type WebhookAuthMethod = 'none' | 'token' | 'basic' | 'signature' | 'oauth2';

// ============================================================================
// Main Webhook Interface
// ============================================================================

/**
 * Core Webhook interface.
 */
export interface Webhook {
  /** Unique webhook ID */
  id: string;
  /** Webhook name */
  name: string;
  /** Webhook description */
  description?: string;
  /** Webhook direction */
  direction: WebhookDirection;
  /** Current status */
  status: WebhookStatus;
  /** Target URL (for outgoing) or endpoint URL (for incoming) */
  url: string;
  /** Secret token for signing/verification */
  secret?: string;
  /** Channel ID (required for incoming webhooks) */
  channelId?: string;
  /** Events to trigger on (for outgoing webhooks) */
  events?: WebhookEventType[];
  /** Filter configuration */
  filters?: WebhookFilters;
  /** Authentication configuration */
  auth?: WebhookAuth;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Avatar URL (for incoming webhooks) */
  avatarUrl?: string;
  /** Default username (for incoming webhooks) */
  defaultUsername?: string;
  /** Who created the webhook */
  createdBy: string;
  /** Creator info */
  creator?: UserBasicInfo;
  /** When webhook was created */
  createdAt: Date;
  /** When webhook was last updated */
  updatedAt: Date;
  /** When webhook was last triggered */
  lastTriggeredAt?: Date;
  /** Total delivery count */
  deliveryCount: number;
  /** Failed delivery count */
  failedDeliveryCount: number;
  /** Recent delivery success rate */
  successRate?: number;
  /** Rate limiting configuration */
  rateLimit?: WebhookRateLimit;
  /** Retry configuration */
  retryConfig?: WebhookRetryConfig;
}

/**
 * Incoming webhook (for posting messages).
 */
export interface IncomingWebhook extends Omit<Webhook, 'direction' | 'events'> {
  direction: 'incoming';
  /** Channel ID to post to */
  channelId: string;
  /** Thread ID to post to (optional) */
  threadId?: string;
  /** Webhook token for authentication */
  token: string;
  /** Full webhook URL for posting */
  webhookUrl: string;
}

/**
 * Outgoing webhook (for receiving events).
 */
export interface OutgoingWebhook extends Omit<Webhook, 'direction'> {
  direction: 'outgoing';
  /** Events to subscribe to */
  events: WebhookEventType[];
  /** Filter by channel IDs */
  channelIds?: string[];
  /** Filter by user IDs */
  userIds?: string[];
}

// ============================================================================
// Webhook Configuration Types
// ============================================================================

/**
 * Webhook filter configuration.
 */
export interface WebhookFilters {
  /** Filter by channel IDs */
  channelIds?: string[];
  /** Filter by user IDs */
  userIds?: string[];
  /** Filter by message content pattern */
  contentPattern?: string;
  /** Filter by mentions */
  hasMentions?: boolean;
  /** Filter by attachments */
  hasAttachments?: boolean;
  /** Exclude bot messages */
  excludeBots?: boolean;
}

/**
 * Webhook authentication configuration.
 */
export interface WebhookAuth {
  /** Authentication method */
  method: WebhookAuthMethod;
  /** Auth token (for token auth) */
  token?: string;
  /** Username (for basic auth) */
  username?: string;
  /** Password (for basic auth) */
  password?: string;
  /** OAuth2 configuration */
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string;
  };
  /** Signature header name */
  signatureHeader?: string;
  /** Signature algorithm */
  signatureAlgorithm?: 'sha256' | 'sha512';
}

/**
 * Webhook rate limiting configuration.
 */
export interface WebhookRateLimit {
  /** Requests per window */
  requests: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Burst limit */
  burst?: number;
}

/**
 * Webhook retry configuration.
 */
export interface WebhookRetryConfig {
  /** Enable retries */
  enabled: boolean;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in seconds */
  initialDelay: number;
  /** Maximum delay in seconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** HTTP status codes to retry on */
  retryOnStatus: number[];
}

/**
 * Default retry configuration.
 */
export const DefaultWebhookRetryConfig: WebhookRetryConfig = {
  enabled: true,
  maxAttempts: 3,
  initialDelay: 1,
  maxDelay: 60,
  backoffMultiplier: 2,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
};

// ============================================================================
// Webhook Payload Types
// ============================================================================

/**
 * Base webhook payload.
 */
export interface WebhookPayloadBase {
  /** Payload ID */
  id: string;
  /** Event type */
  event: WebhookEventType;
  /** Webhook ID */
  webhookId: string;
  /** Timestamp */
  timestamp: Date;
  /** Payload version */
  version: string;
}

/**
 * Message event payload.
 */
export interface MessageEventPayload extends WebhookPayloadBase {
  event: 'message.created' | 'message.updated' | 'message.deleted' | 'message.pinned' | 'message.unpinned';
  data: {
    message: Message;
    channel: { id: string; name: string; type: string };
    previousMessage?: Message; // For updates
  };
}

/**
 * Reaction event payload.
 */
export interface ReactionEventPayload extends WebhookPayloadBase {
  event: 'reaction.added' | 'reaction.removed';
  data: {
    messageId: string;
    channelId: string;
    emoji: string;
    user: UserBasicInfo;
  };
}

/**
 * Channel event payload.
 */
export interface ChannelEventPayload extends WebhookPayloadBase {
  event: 'channel.created' | 'channel.updated' | 'channel.deleted' | 'channel.archived';
  data: {
    channel: { id: string; name: string; type: string; description?: string };
    actor: UserBasicInfo;
    previousChannel?: { name: string; description?: string }; // For updates
  };
}

/**
 * Member event payload.
 */
export interface MemberEventPayload extends WebhookPayloadBase {
  event: 'member.joined' | 'member.left' | 'member.updated';
  data: {
    user: UserBasicInfo;
    channel: { id: string; name: string };
    actor?: UserBasicInfo; // Who added/removed them
  };
}

/**
 * User event payload.
 */
export interface UserEventPayload extends WebhookPayloadBase {
  event: 'user.created' | 'user.updated' | 'user.deactivated';
  data: {
    user: UserBasicInfo;
    previousUser?: Partial<UserBasicInfo>; // For updates
  };
}

/**
 * File event payload.
 */
export interface FileEventPayload extends WebhookPayloadBase {
  event: 'file.uploaded' | 'file.deleted';
  data: {
    file: {
      id: string;
      name: string;
      type: string;
      size: number;
      url?: string;
    };
    message?: { id: string; channelId: string };
    user: UserBasicInfo;
  };
}

/**
 * Union type for all webhook payloads.
 */
export type WebhookPayload =
  | MessageEventPayload
  | ReactionEventPayload
  | ChannelEventPayload
  | MemberEventPayload
  | UserEventPayload
  | FileEventPayload;

/**
 * Incoming webhook message payload.
 */
export interface IncomingWebhookPayload {
  /** Message content */
  content?: string;
  /** Username override */
  username?: string;
  /** Avatar URL override */
  avatarUrl?: string;
  /** Attachments */
  attachments?: IncomingWebhookAttachment[];
  /** Embeds */
  embeds?: IncomingWebhookEmbed[];
  /** Thread ID to reply in */
  threadId?: string;
}

/**
 * Incoming webhook attachment.
 */
export interface IncomingWebhookAttachment {
  /** Attachment URL */
  url: string;
  /** Filename */
  filename?: string;
  /** Content type */
  contentType?: string;
}

/**
 * Incoming webhook embed (rich content).
 */
export interface IncomingWebhookEmbed {
  /** Embed title */
  title?: string;
  /** Embed description */
  description?: string;
  /** Embed URL */
  url?: string;
  /** Embed color (hex) */
  color?: string;
  /** Thumbnail image */
  thumbnail?: { url: string };
  /** Main image */
  image?: { url: string };
  /** Footer text */
  footer?: { text: string; iconUrl?: string };
  /** Author info */
  author?: { name: string; url?: string; iconUrl?: string };
  /** Fields */
  fields?: { name: string; value: string; inline?: boolean }[];
  /** Timestamp */
  timestamp?: Date;
}

// ============================================================================
// Webhook Delivery Types
// ============================================================================

/**
 * Webhook delivery status.
 */
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

/**
 * Webhook delivery record.
 */
export interface WebhookDelivery {
  /** Delivery ID */
  id: string;
  /** Webhook ID */
  webhookId: string;
  /** Event type */
  event: WebhookEventType;
  /** Delivery status */
  status: WebhookDeliveryStatus;
  /** Request details */
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  };
  /** Response details (if received) */
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string;
  };
  /** Error message (if failed) */
  error?: string;
  /** Attempt number */
  attempt: number;
  /** Max attempts */
  maxAttempts: number;
  /** When delivery was queued */
  queuedAt: Date;
  /** When delivery started */
  startedAt?: Date;
  /** When delivery completed */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Next retry time (if retrying) */
  nextRetryAt?: Date;
}

/**
 * Webhook delivery summary.
 */
export interface WebhookDeliverySummary {
  /** Total deliveries */
  total: number;
  /** Successful deliveries */
  success: number;
  /** Failed deliveries */
  failed: number;
  /** Pending deliveries */
  pending: number;
  /** Success rate percentage */
  successRate: number;
  /** Average response time in ms */
  avgResponseTime: number;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for creating an incoming webhook.
 */
export interface CreateIncomingWebhookInput {
  name: string;
  description?: string;
  channelId: string;
  avatarUrl?: string;
  defaultUsername?: string;
}

/**
 * Input for creating an outgoing webhook.
 */
export interface CreateOutgoingWebhookInput {
  name: string;
  description?: string;
  url: string;
  events: WebhookEventType[];
  filters?: WebhookFilters;
  auth?: WebhookAuth;
  headers?: Record<string, string>;
  retryConfig?: WebhookRetryConfig;
  rateLimit?: WebhookRateLimit;
}

/**
 * Input for updating a webhook.
 */
export interface UpdateWebhookInput {
  name?: string;
  description?: string;
  url?: string;
  status?: WebhookStatus;
  events?: WebhookEventType[];
  filters?: WebhookFilters;
  auth?: WebhookAuth;
  headers?: Record<string, string>;
  avatarUrl?: string;
  defaultUsername?: string;
  retryConfig?: WebhookRetryConfig;
  rateLimit?: WebhookRateLimit;
}

// ============================================================================
// Webhook Events
// ============================================================================

/**
 * Webhook created event.
 */
export interface WebhookCreatedEvent {
  webhook: Webhook;
  createdBy: UserBasicInfo;
  timestamp: Date;
}

/**
 * Webhook delivery event.
 */
export interface WebhookDeliveryEvent {
  webhookId: string;
  delivery: WebhookDelivery;
  timestamp: Date;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate webhook signature.
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  // This is a placeholder - actual implementation would use crypto
  // In browser: use SubtleCrypto
  // In Node.js: use crypto module
  return `${algorithm}=placeholder_signature`;
}

/**
 * Verify webhook signature.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is a placeholder - actual implementation would verify the signature
  return true;
}

/**
 * Get event category from event type.
 */
export function getEventCategory(event: WebhookEventType): string {
  return event.split('.')[0];
}

/**
 * Format webhook URL for display (hide token).
 */
export function formatWebhookUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has('token')) {
      urlObj.searchParams.set('token', '***');
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}
