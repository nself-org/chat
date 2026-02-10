/**
 * Electron Configuration
 */

import type { DesktopAppConfig } from '../types/desktop'

/**
 * Default desktop app configuration
 */
export const electronConfig: DesktopAppConfig = {
  // Startup
  startMinimized: false,
  startInTray: false,
  closeToTray: false,
  autoLaunch: false,
  hardwareAcceleration: true,

  // Notifications
  notifications: {
    enabled: true,
    sound: true,
    badge: true,
  },

  // Updates
  updates: {
    autoCheck: true,
    autoDownload: false,
    checkInterval: 4, // hours
  },

  // Keyboard shortcuts
  shortcuts: {
    toggleWindow: 'CmdOrCtrl+Shift+Space',
    newConversation: 'CmdOrCtrl+N',
    search: 'CmdOrCtrl+F',
  },
}

/**
 * Window defaults
 */
export const windowDefaults = {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
}

/**
 * Developer settings
 */
export const devSettings = {
  devServerUrl: 'http://localhost:5174',
  autoOpenDevTools: process.env.NODE_ENV === 'development',
}
