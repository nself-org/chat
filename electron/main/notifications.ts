/**
 * Native Notifications
 *
 * Handles native desktop notifications with platform-specific features.
 * Respects Do Not Disturb settings and user preferences.
 */

import { Notification, shell, app } from 'electron';
import path from 'path';
import log from 'electron-log';
import settingsStore from './store';
import { showMainWindow, getMainWindow } from './window';
import { flashFrame } from './tray';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
  actions?: Array<{ type: 'button'; text: string }>;
  data?: Record<string, unknown>;
}

interface NotificationResult {
  shown: boolean;
  reason?: 'disabled' | 'dnd' | 'no-support' | 'error';
}

// Store active notifications for cleanup
const activeNotifications = new Map<string, Notification>();

function getDefaultIcon(): string {
  return path.join(__dirname, '..', 'resources', 'icon.png');
}

function shouldShowNotification(): { show: boolean; reason?: string } {
  const settings = settingsStore.get('notifications');

  // Check if notifications are globally disabled
  if (!settings.enabled) {
    return { show: false, reason: 'disabled' };
  }

  // Check Do Not Disturb
  if (settingsStore.isDoNotDisturbActive()) {
    return { show: false, reason: 'dnd' };
  }

  // Check if notification API is supported
  if (!Notification.isSupported()) {
    return { show: false, reason: 'no-support' };
  }

  return { show: true };
}

export function showNotification(options: NotificationOptions): NotificationResult {
  const checkResult = shouldShowNotification();

  if (!checkResult.show) {
    log.debug(`Notification suppressed: ${checkResult.reason}`);
    return { shown: false, reason: checkResult.reason as NotificationResult['reason'] };
  }

  const settings = settingsStore.get('notifications');

  try {
    const notificationId = `notification-${Date.now()}`;

    const notification = new Notification({
      title: options.title,
      body: settings.showPreview ? options.body : 'New message',
      icon: options.icon || getDefaultIcon(),
      silent: options.silent ?? !settings.sound,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      actions: options.actions,
    });

    // Handle click - show the main window and navigate
    notification.on('click', () => {
      showMainWindow();
      const mainWindow = getMainWindow();

      // If there's navigation data, send it to the renderer
      if (options.data?.channelId) {
        mainWindow?.webContents.send('navigate', `/chat/${options.data.channelId}`);
      } else if (options.data?.dmId) {
        mainWindow?.webContents.send('navigate', `/dm/${options.data.dmId}`);
      } else if (options.data?.threadId) {
        mainWindow?.webContents.send('navigate', `/thread/${options.data.threadId}`);
      }

      // Clean up
      activeNotifications.delete(notificationId);
    });

    // Handle close
    notification.on('close', () => {
      activeNotifications.delete(notificationId);
    });

    // Handle action click (for action buttons)
    notification.on('action', (_event, index) => {
      showMainWindow();
      const mainWindow = getMainWindow();
      mainWindow?.webContents.send('notification:action', {
        notificationId,
        actionIndex: index,
        data: options.data,
      });
      activeNotifications.delete(notificationId);
    });

    // Handle failed notification
    notification.on('failed', (_event, error) => {
      log.error(`Notification failed: ${error}`);
      activeNotifications.delete(notificationId);
    });

    // Store and show
    activeNotifications.set(notificationId, notification);
    notification.show();

    // Also flash the taskbar if window is not focused
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isFocused()) {
      flashFrame(true);
    }

    log.debug(`Notification shown: ${options.title}`);
    return { shown: true };
  } catch (error) {
    log.error('Error showing notification:', error);
    return { shown: false, reason: 'error' };
  }
}

export function showMessageNotification(options: {
  senderName: string;
  message: string;
  channelName?: string;
  channelId?: string;
  dmId?: string;
  threadId?: string;
  avatar?: string;
}): NotificationResult {
  const title = options.channelName
    ? `${options.senderName} in #${options.channelName}`
    : options.senderName;

  return showNotification({
    title,
    body: options.message,
    icon: options.avatar,
    data: {
      channelId: options.channelId,
      dmId: options.dmId,
      threadId: options.threadId,
      senderName: options.senderName,
    },
  });
}

export function showMentionNotification(options: {
  senderName: string;
  message: string;
  channelName?: string;
  channelId?: string;
}): NotificationResult {
  const title = options.channelName
    ? `${options.senderName} mentioned you in #${options.channelName}`
    : `${options.senderName} mentioned you`;

  return showNotification({
    title,
    body: options.message,
    urgency: 'critical',
    data: {
      channelId: options.channelId,
      senderName: options.senderName,
      type: 'mention',
    },
  });
}

export function showReactionNotification(options: {
  senderName: string;
  reaction: string;
  messagePreview: string;
  channelId?: string;
}): NotificationResult {
  return showNotification({
    title: `${options.senderName} reacted ${options.reaction}`,
    body: options.messagePreview,
    data: {
      channelId: options.channelId,
      type: 'reaction',
    },
  });
}

export function showCallNotification(options: {
  callerName: string;
  callType: 'voice' | 'video';
  channelId?: string;
}): NotificationResult {
  const callIcon = options.callType === 'video' ? 'video-call.png' : 'voice-call.png';

  return showNotification({
    title: 'Incoming Call',
    body: `${options.callerName} is calling you`,
    icon: path.join(__dirname, '..', 'resources', callIcon),
    urgency: 'critical',
    timeoutType: 'never',
    actions: [
      { type: 'button', text: 'Answer' },
      { type: 'button', text: 'Decline' },
    ],
    data: {
      channelId: options.channelId,
      callerName: options.callerName,
      callType: options.callType,
      type: 'call',
    },
  });
}

export function closeAllNotifications(): void {
  activeNotifications.forEach((notification) => {
    notification.close();
  });
  activeNotifications.clear();
  log.debug('All notifications closed');
}

export function getActiveNotificationCount(): number {
  return activeNotifications.size;
}
