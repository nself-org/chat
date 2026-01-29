/**
 * Preload API Definitions
 *
 * Defines the APIs exposed to the renderer process.
 * All APIs are accessed through secure IPC channels.
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for the exposed API
export interface ElectronAPI {
  // Window controls
  window: {
    show: () => Promise<boolean>;
    hide: () => Promise<boolean>;
    minimize: () => Promise<boolean>;
    maximize: () => Promise<boolean>;
    toggleFullscreen: () => Promise<boolean>;
    isMaximized: () => Promise<boolean>;
    isFullscreen: () => Promise<boolean>;
    isFocused: () => Promise<boolean>;
    setZoom: (level: number) => Promise<number>;
    getZoom: () => Promise<number>;
    zoomIn: () => Promise<number>;
    zoomOut: () => Promise<number>;
    resetZoom: () => Promise<number>;
    reload: () => Promise<boolean>;
    clearCache: () => Promise<boolean>;
  };

  // Settings store
  store: {
    get: <T>(key: string) => Promise<T>;
    set: <T>(key: string, value: T) => Promise<boolean>;
    getAll: () => Promise<Record<string, unknown>>;
    reset: () => Promise<boolean>;
  };

  // Notifications
  notifications: {
    show: (options: NotificationOptions) => Promise<NotificationResult>;
    getSettings: () => Promise<NotificationSettings>;
    setSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
    isDndActive: () => Promise<boolean>;
  };

  // Tray
  tray: {
    setUnreadCount: (count: number) => Promise<boolean>;
    flashFrame: (flash: boolean) => Promise<boolean>;
    updateMenu: () => Promise<boolean>;
  };

  // Auto-start
  autostart: {
    enable: () => Promise<boolean>;
    disable: () => Promise<boolean>;
    isEnabled: () => Promise<boolean>;
  };

  // Updates
  updates: {
    check: () => Promise<unknown>;
    download: () => Promise<void>;
    install: () => Promise<boolean>;
    getInfo: () => Promise<UpdateInfo>;
  };

  // Theme
  theme: {
    getSystem: () => Promise<'light' | 'dark'>;
    setNative: (theme: 'light' | 'dark' | 'system') => void;
    onChanged: (callback: (theme: 'light' | 'dark') => void) => () => void;
  };

  // Shell
  shell: {
    openExternal: (url: string) => Promise<boolean>;
    openPath: (path: string) => Promise<string>;
    showItemInFolder: (path: string) => Promise<boolean>;
    beep: () => Promise<boolean>;
  };

  // Clipboard
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<boolean>;
    readImage: () => Promise<string>;
    writeImage: (dataUrl: string) => Promise<boolean>;
    readHtml: () => Promise<string>;
    writeHtml: (html: string) => Promise<boolean>;
    clear: () => Promise<boolean>;
  };

  // Dialogs
  dialog: {
    showOpen: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
    showSave: (options: SaveDialogOptions) => Promise<SaveDialogResult>;
    showMessage: (options: MessageDialogOptions) => Promise<MessageDialogResult>;
    showError: (title: string, content: string) => Promise<boolean>;
  };

  // App info
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
    isPackaged: () => Promise<boolean>;
    getLocale: () => Promise<string>;
    quit: () => Promise<boolean>;
  };

  // Platform info
  platform: {
    getInfo: () => Promise<PlatformInfo>;
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
  };

  // Event listeners
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Helper types
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationResult {
  shown: boolean;
  reason?: 'disabled' | 'dnd' | 'no-support' | 'error';
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  showPreview: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | null;
  downloadProgress?: number;
  downloaded: boolean;
  error?: string;
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
    | 'dontAddToRecent'
  >;
}

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'treatPackageAsDirectory'
    | 'showOverwriteConfirmation'
    | 'dontAddToRecent'
  >;
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface MessageDialogOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
  title?: string;
  message: string;
  detail?: string;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
}

export interface MessageDialogResult {
  response: number;
  checkboxChecked?: boolean;
}

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

// Allowed channels for event listeners
const ALLOWED_RECEIVE_CHANNELS = [
  'navigate',
  'deeplink',
  'navigate:message',
  'join:invite',
  'auth:callback',
  'theme:changed',
  'update:checking',
  'update:available',
  'update:not-available',
  'update:download-progress',
  'update:downloaded',
  'update:error',
  'notification:action',
  'app:new-message',
  'app:new-channel',
  'app:find',
  'app:find-in-channel',
  'app:toggle-sidebar',
  'app:show-channels',
  'app:show-dms',
  'app:quick-switcher',
  'app:jump-to-conversation',
  'app:set-status',
];

// Create the API object
export function createElectronAPI(): ElectronAPI {
  return {
    window: {
      show: () => ipcRenderer.invoke('window:show'),
      hide: () => ipcRenderer.invoke('window:hide'),
      minimize: () => ipcRenderer.invoke('window:minimize'),
      maximize: () => ipcRenderer.invoke('window:maximize'),
      toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
      isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
      isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
      isFocused: () => ipcRenderer.invoke('window:is-focused'),
      setZoom: (level) => ipcRenderer.invoke('window:set-zoom', level),
      getZoom: () => ipcRenderer.invoke('window:get-zoom'),
      zoomIn: () => ipcRenderer.invoke('window:zoom-in'),
      zoomOut: () => ipcRenderer.invoke('window:zoom-out'),
      resetZoom: () => ipcRenderer.invoke('window:reset-zoom'),
      reload: () => ipcRenderer.invoke('window:reload'),
      clearCache: () => ipcRenderer.invoke('window:clear-cache'),
    },

    store: {
      get: (key) => ipcRenderer.invoke('store:get', key),
      set: (key, value) => ipcRenderer.invoke('store:set', key, value),
      getAll: () => ipcRenderer.invoke('store:get-all'),
      reset: () => ipcRenderer.invoke('store:reset'),
    },

    notifications: {
      show: (options) => ipcRenderer.invoke('notifications:show', options),
      getSettings: () => ipcRenderer.invoke('notifications:get-settings'),
      setSettings: (settings) => ipcRenderer.invoke('notifications:set-settings', settings),
      isDndActive: () => ipcRenderer.invoke('notifications:is-dnd-active'),
    },

    tray: {
      setUnreadCount: (count) => ipcRenderer.invoke('tray:set-unread-count', count),
      flashFrame: (flash) => ipcRenderer.invoke('tray:flash-frame', flash),
      updateMenu: () => ipcRenderer.invoke('tray:update-menu'),
    },

    autostart: {
      enable: () => ipcRenderer.invoke('autostart:enable'),
      disable: () => ipcRenderer.invoke('autostart:disable'),
      isEnabled: () => ipcRenderer.invoke('autostart:is-enabled'),
    },

    updates: {
      check: () => ipcRenderer.invoke('updates:check'),
      download: () => ipcRenderer.invoke('updates:download'),
      install: () => ipcRenderer.invoke('updates:install'),
      getInfo: () => ipcRenderer.invoke('updates:get-info'),
    },

    theme: {
      getSystem: () => ipcRenderer.invoke('theme:get-system'),
      setNative: (theme) => ipcRenderer.send('theme:set-native', theme),
      onChanged: (callback) => {
        const handler = (_event: IpcRendererEvent, theme: 'light' | 'dark') => callback(theme);
        ipcRenderer.on('theme:changed', handler);
        return () => ipcRenderer.removeListener('theme:changed', handler);
      },
    },

    shell: {
      openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
      openPath: (path) => ipcRenderer.invoke('shell:open-path', path),
      showItemInFolder: (path) => ipcRenderer.invoke('shell:show-item-in-folder', path),
      beep: () => ipcRenderer.invoke('shell:beep'),
    },

    clipboard: {
      readText: () => ipcRenderer.invoke('clipboard:read-text'),
      writeText: (text) => ipcRenderer.invoke('clipboard:write-text', text),
      readImage: () => ipcRenderer.invoke('clipboard:read-image'),
      writeImage: (dataUrl) => ipcRenderer.invoke('clipboard:write-image', dataUrl),
      readHtml: () => ipcRenderer.invoke('clipboard:read-html'),
      writeHtml: (html) => ipcRenderer.invoke('clipboard:write-html', html),
      clear: () => ipcRenderer.invoke('clipboard:clear'),
    },

    dialog: {
      showOpen: (options) => ipcRenderer.invoke('dialog:show-open', options),
      showSave: (options) => ipcRenderer.invoke('dialog:show-save', options),
      showMessage: (options) => ipcRenderer.invoke('dialog:show-message', options),
      showError: (title, content) => ipcRenderer.invoke('dialog:show-error', title, content),
    },

    app: {
      getVersion: () => ipcRenderer.invoke('app:get-version'),
      getName: () => ipcRenderer.invoke('app:get-name'),
      getPath: (name) => ipcRenderer.invoke('app:get-path', name),
      isPackaged: () => ipcRenderer.invoke('app:is-packaged'),
      getLocale: () => ipcRenderer.invoke('app:get-locale'),
      quit: () => ipcRenderer.invoke('app:quit'),
    },

    platform: {
      getInfo: () => ipcRenderer.invoke('platform:get-info'),
      isMac: process.platform === 'darwin',
      isWindows: process.platform === 'win32',
      isLinux: process.platform === 'linux',
    },

    on: (channel, callback) => {
      if (!ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
        console.warn(`Channel "${channel}" is not in the allowed list`);
        return () => {};
      }

      const handler = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },

    once: (channel, callback) => {
      if (!ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
        console.warn(`Channel "${channel}" is not in the allowed list`);
        return;
      }

      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    },

    removeAllListeners: (channel) => {
      if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  };
}
