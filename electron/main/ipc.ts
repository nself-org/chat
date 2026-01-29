/**
 * IPC Handlers
 *
 * Defines Inter-Process Communication handlers for main <-> renderer communication.
 * All exposed APIs go through this secure channel.
 */

import { ipcMain, dialog, shell, clipboard, app, nativeTheme } from 'electron';
import log from 'electron-log';
import {
  showMainWindow,
  hideMainWindow,
  minimizeMainWindow,
  maximizeMainWindow,
  toggleFullScreen,
  setZoomLevel,
  getZoomLevel,
  reloadWindow,
  clearCache,
  getMainWindow,
} from './window';
import { setUnreadCount, flashFrame, updateTrayMenu } from './tray';
import settingsStore, { AppSettings, NotificationSettings } from './store';
import { showNotification } from './notifications';
import { setAutoLaunch, getAutoLaunchStatus } from './autostart';
import { checkForUpdates, downloadUpdate, installUpdate, getUpdateInfo } from './updates';

export function registerIpcHandlers(): void {
  // ===== Window Control =====

  ipcMain.handle('window:show', () => {
    showMainWindow();
    return true;
  });

  ipcMain.handle('window:hide', () => {
    hideMainWindow();
    return true;
  });

  ipcMain.handle('window:minimize', () => {
    minimizeMainWindow();
    return true;
  });

  ipcMain.handle('window:maximize', () => {
    maximizeMainWindow();
    return true;
  });

  ipcMain.handle('window:toggle-fullscreen', () => {
    toggleFullScreen();
    return true;
  });

  ipcMain.handle('window:is-maximized', () => {
    return getMainWindow()?.isMaximized() ?? false;
  });

  ipcMain.handle('window:is-fullscreen', () => {
    return getMainWindow()?.isFullScreen() ?? false;
  });

  ipcMain.handle('window:is-focused', () => {
    return getMainWindow()?.isFocused() ?? false;
  });

  // ===== Zoom Control =====

  ipcMain.handle('window:set-zoom', (_event, level: number) => {
    setZoomLevel(level);
    return getZoomLevel();
  });

  ipcMain.handle('window:get-zoom', () => {
    return getZoomLevel();
  });

  ipcMain.handle('window:zoom-in', () => {
    setZoomLevel(getZoomLevel() + 0.1);
    return getZoomLevel();
  });

  ipcMain.handle('window:zoom-out', () => {
    setZoomLevel(getZoomLevel() - 0.1);
    return getZoomLevel();
  });

  ipcMain.handle('window:reset-zoom', () => {
    setZoomLevel(1);
    return 1;
  });

  // ===== Cache & Reload =====

  ipcMain.handle('window:reload', () => {
    reloadWindow();
    return true;
  });

  ipcMain.handle('window:clear-cache', async () => {
    await clearCache();
    return true;
  });

  // ===== Settings Store =====

  ipcMain.handle('store:get', (_event, key: keyof AppSettings) => {
    return settingsStore.get(key);
  });

  ipcMain.handle('store:set', (_event, key: keyof AppSettings, value: unknown) => {
    settingsStore.set(key, value as AppSettings[typeof key]);
    return true;
  });

  ipcMain.handle('store:get-all', () => {
    return settingsStore.getAll();
  });

  ipcMain.handle('store:reset', () => {
    settingsStore.reset();
    return true;
  });

  // ===== Notifications =====

  ipcMain.handle('notifications:show', (_event, options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    data?: Record<string, unknown>;
  }) => {
    return showNotification(options);
  });

  ipcMain.handle('notifications:get-settings', () => {
    return settingsStore.get('notifications');
  });

  ipcMain.handle('notifications:set-settings', (_event, settings: Partial<NotificationSettings>) => {
    const current = settingsStore.get('notifications');
    settingsStore.set('notifications', { ...current, ...settings });
    return true;
  });

  ipcMain.handle('notifications:is-dnd-active', () => {
    return settingsStore.isDoNotDisturbActive();
  });

  // ===== Tray & Badge =====

  ipcMain.handle('tray:set-unread-count', (_event, count: number) => {
    setUnreadCount(count);
    return true;
  });

  ipcMain.handle('tray:flash-frame', (_event, flash: boolean) => {
    flashFrame(flash);
    return true;
  });

  ipcMain.handle('tray:update-menu', () => {
    updateTrayMenu();
    return true;
  });

  // ===== Auto-Launch =====

  ipcMain.handle('autostart:enable', async () => {
    return setAutoLaunch(true);
  });

  ipcMain.handle('autostart:disable', async () => {
    return setAutoLaunch(false);
  });

  ipcMain.handle('autostart:is-enabled', async () => {
    return getAutoLaunchStatus();
  });

  // ===== Updates =====

  ipcMain.handle('updates:check', async () => {
    return checkForUpdates(true);
  });

  ipcMain.handle('updates:download', async () => {
    return downloadUpdate();
  });

  ipcMain.handle('updates:install', () => {
    installUpdate();
    return true;
  });

  ipcMain.handle('updates:get-info', () => {
    return getUpdateInfo();
  });

  // ===== Theme =====

  ipcMain.handle('theme:get-system', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.on('theme:set-native', (_event, theme: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = theme;
  });

  // Forward native theme changes to renderer
  nativeTheme.on('updated', () => {
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });

  // ===== Shell =====

  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('shell:open-path', async (_event, path: string) => {
    return shell.openPath(path);
  });

  ipcMain.handle('shell:show-item-in-folder', (_event, path: string) => {
    shell.showItemInFolder(path);
    return true;
  });

  ipcMain.handle('shell:beep', () => {
    shell.beep();
    return true;
  });

  // ===== Clipboard =====

  ipcMain.handle('clipboard:read-text', () => {
    return clipboard.readText();
  });

  ipcMain.handle('clipboard:write-text', (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('clipboard:read-image', () => {
    return clipboard.readImage().toDataURL();
  });

  ipcMain.handle('clipboard:write-image', (_event, dataUrl: string) => {
    const { nativeImage } = require('electron');
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
    return true;
  });

  ipcMain.handle('clipboard:read-html', () => {
    return clipboard.readHTML();
  });

  ipcMain.handle('clipboard:write-html', (_event, html: string) => {
    clipboard.writeHTML(html);
    return true;
  });

  ipcMain.handle('clipboard:clear', () => {
    clipboard.clear();
    return true;
  });

  // ===== Dialogs =====

  ipcMain.handle('dialog:show-open', async (_event, options: Electron.OpenDialogOptions) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { canceled: true, filePaths: [] };
    return dialog.showOpenDialog(mainWindow, options);
  });

  ipcMain.handle('dialog:show-save', async (_event, options: Electron.SaveDialogOptions) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { canceled: true };
    return dialog.showSaveDialog(mainWindow, options);
  });

  ipcMain.handle('dialog:show-message', async (_event, options: Electron.MessageBoxOptions) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { response: 0 };
    return dialog.showMessageBox(mainWindow, options);
  });

  ipcMain.handle('dialog:show-error', (_event, title: string, content: string) => {
    dialog.showErrorBox(title, content);
    return true;
  });

  // ===== App Info =====

  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:get-name', () => {
    return app.getName();
  });

  ipcMain.handle('app:get-path', (_event, name: Parameters<typeof app.getPath>[0]) => {
    return app.getPath(name);
  });

  ipcMain.handle('app:is-packaged', () => {
    return app.isPackaged;
  });

  ipcMain.handle('app:get-locale', () => {
    return app.getLocale();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
    return true;
  });

  // ===== Platform Info =====

  ipcMain.handle('platform:get-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.getSystemVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
    };
  });

  log.info('IPC handlers registered');
}

export function removeIpcHandlers(): void {
  // Remove all handlers (useful for hot-reloading in development)
  const channels = [
    'window:show', 'window:hide', 'window:minimize', 'window:maximize',
    'window:toggle-fullscreen', 'window:is-maximized', 'window:is-fullscreen',
    'window:is-focused', 'window:set-zoom', 'window:get-zoom', 'window:zoom-in',
    'window:zoom-out', 'window:reset-zoom', 'window:reload', 'window:clear-cache',
    'store:get', 'store:set', 'store:get-all', 'store:reset',
    'notifications:show', 'notifications:get-settings', 'notifications:set-settings',
    'notifications:is-dnd-active', 'tray:set-unread-count', 'tray:flash-frame',
    'tray:update-menu', 'autostart:enable', 'autostart:disable', 'autostart:is-enabled',
    'updates:check', 'updates:download', 'updates:install', 'updates:get-info',
    'theme:get-system', 'shell:open-external', 'shell:open-path',
    'shell:show-item-in-folder', 'shell:beep', 'clipboard:read-text',
    'clipboard:write-text', 'clipboard:read-image', 'clipboard:write-image',
    'clipboard:read-html', 'clipboard:write-html', 'clipboard:clear',
    'dialog:show-open', 'dialog:show-save', 'dialog:show-message', 'dialog:show-error',
    'app:get-version', 'app:get-name', 'app:get-path', 'app:is-packaged',
    'app:get-locale', 'app:quit', 'platform:get-info',
  ];

  channels.forEach((channel) => {
    ipcMain.removeHandler(channel);
  });

  ipcMain.removeAllListeners('theme:set-native');

  log.info('IPC handlers removed');
}
