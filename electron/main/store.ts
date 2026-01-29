/**
 * Electron Settings Store
 *
 * Persistent storage for application settings using electron-store.
 * Provides type-safe access to user preferences and app state.
 */

import Store from 'electron-store';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  showPreview: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart?: string; // HH:mm format
  doNotDisturbEnd?: string; // HH:mm format
}

export interface AppSettings {
  // Window state
  windowState: WindowState;

  // Startup
  launchAtStartup: boolean;
  startMinimized: boolean;

  // Tray
  minimizeToTray: boolean;
  showTrayIcon: boolean;

  // Notifications
  notifications: NotificationSettings;

  // Appearance
  zoomLevel: number;
  spellcheck: boolean;
  spellcheckLanguages: string[];

  // Updates
  autoUpdate: boolean;
  updateChannel: 'stable' | 'beta' | 'alpha';

  // Connection
  serverUrl: string;
  proxyEnabled: boolean;
  proxyUrl?: string;

  // Privacy
  clearCacheOnExit: boolean;

  // Developer
  devToolsEnabled: boolean;

  // User session
  lastUserId?: string;
  lastWorkspaceId?: string;
}

const defaultSettings: AppSettings = {
  windowState: {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
  },
  launchAtStartup: false,
  startMinimized: false,
  minimizeToTray: true,
  showTrayIcon: true,
  notifications: {
    enabled: true,
    sound: true,
    showPreview: true,
    doNotDisturb: false,
  },
  zoomLevel: 1,
  spellcheck: true,
  spellcheckLanguages: ['en-US'],
  autoUpdate: true,
  updateChannel: 'stable',
  serverUrl: 'http://localhost:3000',
  proxyEnabled: false,
  clearCacheOnExit: false,
  devToolsEnabled: false,
};

class SettingsStore {
  private store: Store<AppSettings>;
  private static instance: SettingsStore;

  private constructor() {
    this.store = new Store<AppSettings>({
      name: 'nchat-settings',
      defaults: defaultSettings,
      schema: {
        windowState: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number', minimum: 400 },
            height: { type: 'number', minimum: 300 },
            isMaximized: { type: 'boolean' },
            isFullScreen: { type: 'boolean' },
          },
          required: ['width', 'height', 'isMaximized', 'isFullScreen'],
        },
        launchAtStartup: { type: 'boolean' },
        startMinimized: { type: 'boolean' },
        minimizeToTray: { type: 'boolean' },
        showTrayIcon: { type: 'boolean' },
        notifications: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            sound: { type: 'boolean' },
            showPreview: { type: 'boolean' },
            doNotDisturb: { type: 'boolean' },
            doNotDisturbStart: { type: 'string' },
            doNotDisturbEnd: { type: 'string' },
          },
          required: ['enabled', 'sound', 'showPreview', 'doNotDisturb'],
        },
        zoomLevel: { type: 'number', minimum: 0.5, maximum: 2 },
        spellcheck: { type: 'boolean' },
        spellcheckLanguages: {
          type: 'array',
          items: { type: 'string' },
        },
        autoUpdate: { type: 'boolean' },
        updateChannel: {
          type: 'string',
          enum: ['stable', 'beta', 'alpha'],
        },
        serverUrl: { type: 'string' },
        proxyEnabled: { type: 'boolean' },
        proxyUrl: { type: 'string' },
        clearCacheOnExit: { type: 'boolean' },
        devToolsEnabled: { type: 'boolean' },
        lastUserId: { type: 'string' },
        lastWorkspaceId: { type: 'string' },
      } as const,
      clearInvalidConfig: true,
    });
  }

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  // Generic get/set methods
  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
  }

  // Get all settings
  getAll(): AppSettings {
    return this.store.store;
  }

  // Reset to defaults
  reset(): void {
    this.store.clear();
  }

  // Window state helpers
  getWindowState(): WindowState {
    return this.get('windowState');
  }

  setWindowState(state: Partial<WindowState>): void {
    const current = this.getWindowState();
    this.set('windowState', { ...current, ...state });
  }

  // Notification helpers
  getNotificationSettings(): NotificationSettings {
    return this.get('notifications');
  }

  setNotificationSettings(settings: Partial<NotificationSettings>): void {
    const current = this.getNotificationSettings();
    this.set('notifications', { ...current, ...settings });
  }

  // Check if Do Not Disturb is active
  isDoNotDisturbActive(): boolean {
    const settings = this.getNotificationSettings();
    if (!settings.doNotDisturb) return false;

    if (!settings.doNotDisturbStart || !settings.doNotDisturbEnd) {
      return true; // DND enabled without schedule = always active
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Handle overnight schedules (e.g., 22:00 to 08:00)
    if (settings.doNotDisturbStart > settings.doNotDisturbEnd) {
      return currentTime >= settings.doNotDisturbStart || currentTime < settings.doNotDisturbEnd;
    }

    return currentTime >= settings.doNotDisturbStart && currentTime < settings.doNotDisturbEnd;
  }

  // Get the store path for debugging
  getStorePath(): string {
    return this.store.path;
  }
}

export const settingsStore = SettingsStore.getInstance();
export default settingsStore;
