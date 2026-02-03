/**
 * Broadcast List Management Service
 * Handles WhatsApp-style broadcast lists and message broadcasting
 */

import type {
  BroadcastList,
  CreateBroadcastListInput,
  BroadcastSubscriber,
  SendBroadcastInput,
  BroadcastMessage,
  BroadcastDelivery,
  BroadcastSubscriptionStatus,
} from '@/types/advanced-channels'

// ============================================================================
// Interfaces
// ============================================================================

export interface BroadcastQueueItem {
  broadcastMessageId: string
  userId: string
  scheduledFor: Date | null
  retryCount: number
  lastAttempt: Date | null
}

export interface BroadcastStats {
  totalRecipients: number
  delivered: number
  read: number
  failed: number
  pending: number
  deliveryRate: number
  readRate: number
}

export interface SubscriberFilters {
  broadcastListId: string
  status?: BroadcastSubscriptionStatus
  notificationsEnabled?: boolean
}

// ============================================================================
// Constants
// ============================================================================

export const MAX_BROADCAST_CONTENT_LENGTH = 5000
export const MAX_BROADCAST_ATTACHMENTS = 10
export const DEFAULT_MAX_SUBSCRIBERS = 1000
export const BROADCAST_DELIVERY_TIMEOUT = 30000 // 30 seconds
export const MAX_DELIVERY_RETRIES = 3

// ============================================================================
// Broadcast List Management
// ============================================================================

/**
 * Create a new broadcast list
 */
export function createBroadcastListData(
  input: CreateBroadcastListInput,
  ownerId: string
): BroadcastList {
  const now = new Date().toISOString()

  return {
    id: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: input.workspaceId,
    name: input.name,
    description: input.description,
    icon: input.icon,
    ownerId,
    subscriptionMode: input.subscriptionMode || 'invite',
    allowReplies: input.allowReplies ?? false,
    showSenderName: input.showSenderName ?? true,
    trackDelivery: input.trackDelivery ?? true,
    trackReads: input.trackReads ?? false,
    maxSubscribers: input.maxSubscribers || DEFAULT_MAX_SUBSCRIBERS,
    subscriberCount: 0,
    totalMessagesSent: 0,
    lastBroadcastAt: undefined,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Validate broadcast list settings
 */
export function validateBroadcastList(input: CreateBroadcastListInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!input.name || input.name.length < 2 || input.name.length > 100) {
    errors.push('Broadcast list name must be between 2 and 100 characters')
  }

  if (input.description && input.description.length > 500) {
    errors.push('Description must not exceed 500 characters')
  }

  if (
    input.maxSubscribers &&
    (input.maxSubscribers < 10 || input.maxSubscribers > 100000)
  ) {
    errors.push('Max subscribers must be between 10 and 100,000')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Subscriber Management
// ============================================================================

/**
 * Create subscriber records for a broadcast list
 */
export function createSubscribers(
  broadcastListId: string,
  userIds: string[],
  subscribedBy: string
): BroadcastSubscriber[] {
  const now = new Date().toISOString()

  return userIds.map((userId) => ({
    broadcastListId,
    userId,
    subscribedAt: now,
    subscribedBy,
    notificationsEnabled: true,
    status: 'active' as const,
    unsubscribedAt: undefined,
  }))
}

/**
 * Check if user can subscribe to broadcast list
 */
export function canSubscribe(
  broadcastList: BroadcastList,
  userId: string,
  isAdmin: boolean
): { allowed: boolean; reason?: string } {
  // Check if at capacity
  if (broadcastList.subscriberCount >= broadcastList.maxSubscribers) {
    return {
      allowed: false,
      reason: 'Broadcast list is at maximum capacity',
    }
  }

  // Check subscription mode
  switch (broadcastList.subscriptionMode) {
    case 'open':
      return { allowed: true }

    case 'invite':
      // User must be invited (handled by caller)
      return { allowed: true }

    case 'admin':
      if (!isAdmin) {
        return {
          allowed: false,
          reason: 'Only administrators can subscribe to this list',
        }
      }
      return { allowed: true }

    default:
      return { allowed: false, reason: 'Invalid subscription mode' }
  }
}

/**
 * Filter active subscribers for broadcast delivery
 */
export function filterActiveSubscribers(
  subscribers: BroadcastSubscriber[]
): BroadcastSubscriber[] {
  return subscribers.filter((sub) => sub.status === 'active')
}

// ============================================================================
// Broadcast Message Management
// ============================================================================

/**
 * Validate broadcast message content
 */
export function validateBroadcastMessage(input: SendBroadcastInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!input.content || input.content.trim().length === 0) {
    errors.push('Broadcast message content is required')
  }

  if (input.content && input.content.length > MAX_BROADCAST_CONTENT_LENGTH) {
    errors.push(
      `Message content must not exceed ${MAX_BROADCAST_CONTENT_LENGTH} characters`
    )
  }

  if (input.attachments && input.attachments.length > MAX_BROADCAST_ATTACHMENTS) {
    errors.push(
      `Maximum ${MAX_BROADCAST_ATTACHMENTS} attachments allowed per broadcast`
    )
  }

  if (input.scheduledFor) {
    const scheduledDate = new Date(input.scheduledFor)
    const now = new Date()
    if (scheduledDate <= now) {
      errors.push('Scheduled time must be in the future')
    }
    // Don't allow scheduling more than 1 year in advance
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (scheduledDate > oneYearFromNow) {
      errors.push('Cannot schedule broadcasts more than 1 year in advance')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create broadcast message record
 */
export function createBroadcastMessage(
  input: SendBroadcastInput,
  senderId: string,
  recipientCount: number
): BroadcastMessage {
  const now = new Date().toISOString()
  const scheduledFor = input.scheduledFor || now

  return {
    id: `broadcast-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    broadcastListId: input.broadcastListId,
    content: input.content,
    attachments: input.attachments || [],
    sentBy: senderId,
    sentAt: scheduledFor,
    scheduledFor: input.scheduledFor,
    isScheduled: !!input.scheduledFor,
    totalRecipients: recipientCount,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
  }
}

// ============================================================================
// Broadcast Delivery Management
// ============================================================================

/**
 * Create delivery records for a broadcast
 */
export function createDeliveryRecords(
  broadcastMessageId: string,
  subscribers: BroadcastSubscriber[]
): BroadcastDelivery[] {
  return subscribers.map((sub) => ({
    id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    broadcastMessageId,
    userId: sub.userId,
    status: 'pending' as const,
    deliveredAt: undefined,
    readAt: undefined,
    failedAt: undefined,
    errorMessage: undefined,
  }))
}

/**
 * Calculate broadcast statistics
 */
export function calculateBroadcastStats(
  deliveries: BroadcastDelivery[]
): BroadcastStats {
  const total = deliveries.length
  const delivered = deliveries.filter((d) => d.status === 'delivered').length
  const read = deliveries.filter((d) => d.status === 'read').length
  const failed = deliveries.filter((d) => d.status === 'failed').length
  const pending = deliveries.filter((d) => d.status === 'pending').length

  return {
    totalRecipients: total,
    delivered,
    read,
    failed,
    pending,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    readRate: delivered > 0 ? (read / delivered) * 100 : 0,
  }
}

/**
 * Check if broadcast delivery should be retried
 */
export function shouldRetryDelivery(
  delivery: BroadcastDelivery,
  retryCount: number
): boolean {
  if (delivery.status !== 'failed') {
    return false
  }

  if (retryCount >= MAX_DELIVERY_RETRIES) {
    return false
  }

  // Don't retry certain errors
  const nonRetriableErrors = [
    'user_not_found',
    'user_blocked',
    'insufficient_permissions',
    'invalid_recipient',
  ]

  if (
    delivery.errorMessage &&
    nonRetriableErrors.some((err) => delivery.errorMessage?.includes(err))
  ) {
    return false
  }

  return true
}

/**
 * Calculate retry delay (exponential backoff)
 */
export function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const baseDelay = 1000
  return Math.min(baseDelay * Math.pow(2, retryCount), 30000) // Max 30s
}

// ============================================================================
// Queue Management
// ============================================================================

/**
 * Create broadcast queue items
 */
export function createBroadcastQueue(
  broadcastMessageId: string,
  subscribers: BroadcastSubscriber[],
  scheduledFor: Date | null = null
): BroadcastQueueItem[] {
  return subscribers.map((sub) => ({
    broadcastMessageId,
    userId: sub.userId,
    scheduledFor,
    retryCount: 0,
    lastAttempt: null,
  }))
}

/**
 * Sort queue items by priority
 * - Scheduled items by scheduled time
 * - Failed items with retries remaining
 * - New pending items
 */
export function prioritizeQueue(queue: BroadcastQueueItem[]): BroadcastQueueItem[] {
  return [...queue].sort((a, b) => {
    // Scheduled items first, sorted by scheduled time
    if (a.scheduledFor && b.scheduledFor) {
      return a.scheduledFor.getTime() - b.scheduledFor.getTime()
    }
    if (a.scheduledFor) return -1
    if (b.scheduledFor) return 1

    // Retries before new items
    if (a.retryCount > 0 && b.retryCount === 0) return -1
    if (a.retryCount === 0 && b.retryCount > 0) return 1

    // Lower retry count first
    return a.retryCount - b.retryCount
  })
}

// ============================================================================
// Analytics & Reporting
// ============================================================================

/**
 * Calculate delivery timeline
 */
export function calculateDeliveryTimeline(
  deliveries: BroadcastDelivery[]
): {
  startTime: Date | null
  endTime: Date | null
  durationSeconds: number | null
} {
  const deliveredItems = deliveries.filter((d) => d.deliveredAt)

  if (deliveredItems.length === 0) {
    return {
      startTime: null,
      endTime: null,
      durationSeconds: null,
    }
  }

  const times = deliveredItems
    .map((d) => new Date(d.deliveredAt!).getTime())
    .sort((a, b) => a - b)

  const startTime = new Date(times[0])
  const endTime = new Date(times[times.length - 1])
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000

  return {
    startTime,
    endTime,
    durationSeconds,
  }
}

/**
 * Group deliveries by status for reporting
 */
export function groupDeliveriesByStatus(deliveries: BroadcastDelivery[]): Record<
  string,
  BroadcastDelivery[]
> {
  return deliveries.reduce(
    (acc, delivery) => {
      const status = delivery.status
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(delivery)
      return acc
    },
    {} as Record<string, BroadcastDelivery[]>
  )
}

/**
 * Calculate engagement metrics
 */
export function calculateEngagementMetrics(deliveries: BroadcastDelivery[]): {
  openRate: number
  avgTimeToRead: number | null
  unreadCount: number
} {
  const delivered = deliveries.filter((d) => d.deliveredAt)
  const read = deliveries.filter((d) => d.readAt)

  const openRate = delivered.length > 0 ? (read.length / delivered.length) * 100 : 0

  // Calculate average time from delivery to read
  const readTimes = read
    .filter((d) => d.deliveredAt && d.readAt)
    .map((d) => {
      const delivered = new Date(d.deliveredAt!).getTime()
      const read = new Date(d.readAt!).getTime()
      return (read - delivered) / 1000 // seconds
    })

  const avgTimeToRead =
    readTimes.length > 0
      ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
      : null

  const unreadCount = delivered.length - read.length

  return {
    openRate,
    avgTimeToRead,
    unreadCount,
  }
}
