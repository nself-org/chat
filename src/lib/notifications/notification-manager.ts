/**
 * Notification Manager - Central notification management system
 *
 * Handles:
 * - Notification delivery across channels (desktop, push, email)
 * - Preference checking
 * - DND/quiet hours checking
 * - Notification queueing and batching
 */

import type {
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  NotificationDeliveryMethod,
  NotificationHistoryEntry,
} from './notification-types';
import { isInQuietHours } from './quiet-hours';
import { matchKeywords } from './keyword-matcher';
import { playNotificationSound } from './notification-sounds';

// ============================================================================
// Types
// ============================================================================

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  actor?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  channelId?: string;
  channelName?: string;
  messageId?: string;
  threadId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryResult {
  method: NotificationDeliveryMethod;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface NotificationManagerOptions {
  /** Maximum notifications to keep in history */
  maxHistorySize?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom sound player */
  soundPlayer?: (soundId: string, volume: number) => Promise<void>;
}

// ============================================================================
// Notification Manager Class
// ============================================================================

export class NotificationManager {
  private preferences: NotificationPreferences;
  private history: NotificationHistoryEntry[] = [];
  private options: Required<NotificationManagerOptions>;
  private pendingNotifications: NotificationPayload[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    preferences: NotificationPreferences,
    options: NotificationManagerOptions = {}
  ) {
    this.preferences = preferences;
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 100,
      debug: options.debug ?? false,
      soundPlayer: options.soundPlayer ?? playNotificationSound,
    };
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.log('Preferences updated');
  }

  /**
   * Process and deliver a notification
   */
  async notify(payload: NotificationPayload): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    // Check if notifications are globally enabled
    if (!this.preferences.globalEnabled) {
      this.log('Notifications globally disabled');
      return results;
    }

    // Check if notification type is enabled
    if (!this.isTypeEnabled(payload.type)) {
      this.log(`Notification type ${payload.type} is disabled`);
      return results;
    }

    // Check channel-specific settings
    if (payload.channelId) {
      const channelSettings = this.preferences.channelSettings[payload.channelId];
      if (channelSettings) {
        // Check if channel is muted
        if (channelSettings.muteUntil) {
          const muteUntil = new Date(channelSettings.muteUntil);
          if (muteUntil > new Date()) {
            this.log(`Channel ${payload.channelId} is muted until ${channelSettings.muteUntil}`);
            return results;
          }
        }

        // Check notification level
        if (channelSettings.level === 'nothing') {
          this.log(`Channel ${payload.channelId} has notifications disabled`);
          return results;
        }

        if (channelSettings.level === 'mentions' && payload.type !== 'mention') {
          this.log(`Channel ${payload.channelId} only allows mentions`);
          return results;
        }
      }
    }

    // Check quiet hours
    const inQuietHours = isInQuietHours(this.preferences.quietHours);
    if (inQuietHours) {
      // Check if mentions can break through
      if (
        payload.type === 'mention' &&
        this.preferences.quietHours.allowMentionsBreakthrough
      ) {
        this.log('Mention breaking through quiet hours');
      } else if (payload.priority !== 'urgent') {
        this.log('In quiet hours, notification suppressed');
        return results;
      }
    }

    // Check for keyword matches
    const keywordMatches = matchKeywords(
      payload.body,
      this.preferences.keywords.filter((k) => k.enabled)
    );

    if (keywordMatches.length > 0) {
      payload.type = 'keyword';
      payload.metadata = {
        ...payload.metadata,
        matchedKeywords: keywordMatches,
      };
    }

    // Deliver to each enabled channel
    const deliveryMethods: NotificationDeliveryMethod[] = [];

    // Desktop notifications
    if (this.shouldDeliverDesktop(payload)) {
      deliveryMethods.push('desktop');
    }

    // Mobile push
    if (this.shouldDeliverPush(payload)) {
      deliveryMethods.push('mobile');
    }

    // Email
    if (this.shouldDeliverEmail(payload)) {
      deliveryMethods.push('email');
    }

    // In-app is always delivered
    deliveryMethods.push('in_app');

    // Deliver to each method
    for (const method of deliveryMethods) {
      const result = await this.deliver(method, payload);
      results.push(result);
    }

    // Add to history
    this.addToHistory(payload, deliveryMethods);

    // Play sound if enabled
    if (this.preferences.sound.enabled && !inQuietHours) {
      await this.playSound(payload.type);
    }

    return results;
  }

  /**
   * Batch multiple notifications
   */
  queueNotification(payload: NotificationPayload): void {
    this.pendingNotifications.push(payload);

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushNotifications();
      }, 100);
    }
  }

  /**
   * Flush queued notifications
   */
  async flushNotifications(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const notifications = [...this.pendingNotifications];
    this.pendingNotifications = [];

    // Group notifications if needed
    if (notifications.length > 3) {
      // Send a summary notification instead
      const summary = this.createSummaryNotification(notifications);
      await this.notify(summary);
    } else {
      for (const notification of notifications) {
        await this.notify(notification);
      }
    }
  }

  /**
   * Get notification history
   */
  getHistory(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): NotificationHistoryEntry[] {
    let entries = [...this.history];

    if (options?.unreadOnly) {
      entries = entries.filter((e) => !e.isRead);
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;

    return entries.slice(offset, offset + limit);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const entry = this.history.find((e) => e.id === notificationId);
    if (entry) {
      entry.isRead = true;
      entry.readAt = new Date().toISOString();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const now = new Date().toISOString();
    this.history.forEach((entry) => {
      if (!entry.isRead) {
        entry.isRead = true;
        entry.readAt = now;
      }
    });
  }

  /**
   * Archive notification
   */
  archiveNotification(notificationId: string): void {
    const entry = this.history.find((e) => e.id === notificationId);
    if (entry) {
      entry.isArchived = true;
    }
  }

  /**
   * Clear all notifications
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.history.filter((e) => !e.isRead && !e.isArchived).length;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private isTypeEnabled(type: NotificationType): boolean {
    switch (type) {
      case 'mention':
        return this.preferences.mentions.enabled;
      case 'direct_message':
        return this.preferences.directMessages.enabled;
      case 'thread_reply':
        return this.preferences.threadReplies;
      case 'reaction':
        return this.preferences.reactions;
      case 'channel_invite':
        return this.preferences.channelInvites;
      case 'channel_update':
        return this.preferences.channelUpdates;
      case 'announcement':
        return this.preferences.announcements;
      case 'keyword':
      case 'system':
        return true;
      default:
        return true;
    }
  }

  private shouldDeliverDesktop(payload: NotificationPayload): boolean {
    if (!this.preferences.desktop.enabled) return false;
    if (this.preferences.desktop.permission !== 'granted') return false;

    // Check channel-specific override
    if (payload.channelId) {
      const channelSettings = this.preferences.channelSettings[payload.channelId];
      if (channelSettings?.overrideGlobal && channelSettings.desktopEnabled !== undefined) {
        return channelSettings.desktopEnabled;
      }
    }

    // Check type-specific settings
    if (payload.type === 'mention') {
      return this.preferences.mentions.desktop;
    }
    if (payload.type === 'direct_message') {
      return this.preferences.directMessages.desktop;
    }

    return true;
  }

  private shouldDeliverPush(payload: NotificationPayload): boolean {
    if (!this.preferences.push.enabled) return false;

    // Check channel-specific override
    if (payload.channelId) {
      const channelSettings = this.preferences.channelSettings[payload.channelId];
      if (channelSettings?.overrideGlobal && channelSettings.mobileEnabled !== undefined) {
        return channelSettings.mobileEnabled;
      }
    }

    // Check type-specific settings
    if (payload.type === 'mention') {
      return this.preferences.mentions.mobile;
    }
    if (payload.type === 'direct_message') {
      return this.preferences.directMessages.mobile;
    }

    return true;
  }

  private shouldDeliverEmail(payload: NotificationPayload): boolean {
    if (!this.preferences.email.enabled) return false;

    // Check if type is enabled for email
    if (!this.preferences.email.enabledTypes.includes(payload.type)) {
      return false;
    }

    // Check channel-specific override
    if (payload.channelId) {
      const channelSettings = this.preferences.channelSettings[payload.channelId];
      if (channelSettings?.overrideGlobal && channelSettings.emailEnabled !== undefined) {
        return channelSettings.emailEnabled;
      }
    }

    // Check type-specific settings
    if (payload.type === 'mention') {
      return this.preferences.mentions.email;
    }
    if (payload.type === 'direct_message') {
      return this.preferences.directMessages.email;
    }

    // For instant delivery or urgent notifications
    if (
      this.preferences.email.digestFrequency === 'instant' ||
      (this.preferences.email.urgentImmediate && payload.priority === 'urgent')
    ) {
      return true;
    }

    return false;
  }

  private async deliver(
    method: NotificationDeliveryMethod,
    payload: NotificationPayload
  ): Promise<DeliveryResult> {
    const timestamp = new Date().toISOString();

    try {
      switch (method) {
        case 'desktop':
          await this.deliverDesktop(payload);
          break;
        case 'mobile':
          await this.deliverPush(payload);
          break;
        case 'email':
          await this.deliverEmail(payload);
          break;
        case 'in_app':
          // In-app delivery is handled by the store
          break;
      }

      return { method, success: true, timestamp };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Failed to deliver via ${method}: ${errorMessage}`);
      return { method, success: false, error: errorMessage, timestamp };
    }
  }

  private async deliverDesktop(payload: NotificationPayload): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Desktop notifications not supported');
    }

    const notification = new Notification(payload.title, {
      body: this.preferences.desktop.showPreview ? payload.body : 'You have a new notification',
      icon: payload.actor?.avatarUrl || '/favicon.ico',
      tag: payload.id,
      requireInteraction: this.preferences.desktop.requireInteraction || payload.priority === 'urgent',
      silent: !this.preferences.desktop.playSound,
    });

    if (this.preferences.desktop.duration > 0 && !this.preferences.desktop.requireInteraction) {
      setTimeout(() => notification.close(), this.preferences.desktop.duration);
    }

    notification.onclick = () => {
      window.focus();
      if (payload.actionUrl) {
        window.location.href = payload.actionUrl;
      }
      this.markAsRead(payload.id);
      notification.close();
    };
  }

  private async deliverPush(_payload: NotificationPayload): Promise<void> {
    // Push notification delivery would typically go through a service worker
    // or a push notification service like Firebase
    this.log('Push notification delivery not implemented');
  }

  private async deliverEmail(_payload: NotificationPayload): Promise<void> {
    // Email delivery would typically go through a backend API
    this.log('Email notification delivery not implemented');
  }

  private async playSound(type: NotificationType): Promise<void> {
    const { sound } = this.preferences;
    if (!sound.enabled) return;

    let soundId: string;
    switch (type) {
      case 'mention':
        soundId = sound.mentionSound;
        break;
      case 'direct_message':
        soundId = sound.dmSound;
        break;
      case 'thread_reply':
        soundId = sound.threadSound;
        break;
      case 'reaction':
        soundId = sound.reactionSound;
        break;
      default:
        soundId = sound.defaultSound;
    }

    await this.options.soundPlayer(soundId, sound.volume);
  }

  private addToHistory(
    payload: NotificationPayload,
    deliveredVia: NotificationDeliveryMethod[]
  ): void {
    const entry: NotificationHistoryEntry = {
      ...payload,
      isRead: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      deliveredVia,
    };

    this.history.unshift(entry);

    // Trim history if needed
    if (this.history.length > this.options.maxHistorySize) {
      this.history = this.history.slice(0, this.options.maxHistorySize);
    }
  }

  private createSummaryNotification(notifications: NotificationPayload[]): NotificationPayload {
    const types = new Set(notifications.map((n) => n.type));
    const channels = new Set(
      notifications.filter((n) => n.channelName).map((n) => n.channelName)
    );

    let title = `${notifications.length} new notifications`;
    let body = '';

    if (types.size === 1) {
      const type = [...types][0];
      title = `${notifications.length} new ${type.replace('_', ' ')}s`;
    }

    if (channels.size === 1) {
      body = `From #${[...channels][0]}`;
    } else if (channels.size > 1) {
      body = `From ${channels.size} channels`;
    }

    return {
      id: `summary-${Date.now()}`,
      type: 'system',
      priority: 'normal',
      title,
      body,
      metadata: {
        isSummary: true,
        notificationCount: notifications.length,
        includedNotifications: notifications.map((n) => n.id),
      },
    };
  }

  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[NotificationManager] ${message}`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: NotificationManager | null = null;

export function getNotificationManager(
  preferences?: NotificationPreferences,
  options?: NotificationManagerOptions
): NotificationManager {
  if (!managerInstance && preferences) {
    managerInstance = new NotificationManager(preferences, options);
  }
  return managerInstance!;
}

export function resetNotificationManager(): void {
  managerInstance = null;
}
