/**
 * Electron Main Process
 *
 * Entry point for the Electron main process.
 * Orchestrates all main process modules and application lifecycle.
 */

import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { createMainWindow, showMainWindow, getMainWindow } from './window';
import { createMenu } from './menu';
import { createTray, destroyTray } from './tray';
import { registerIpcHandlers, removeIpcHandlers } from './ipc';
import { registerProtocolHandler, handleSecondInstance } from './deeplinks';
import { initAutoUpdater } from './updates';
import { syncAutoLaunchWithSettings, handleHiddenLaunch } from './autostart';
import settingsStore from './store';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Log startup info
log.info('='.repeat(50));
log.info(`nchat Desktop v${app.getVersion()}`);
log.info(`Electron: ${process.versions.electron}`);
log.info(`Chrome: ${process.versions.chrome}`);
log.info(`Node: ${process.versions.node}`);
log.info(`Platform: ${process.platform} ${process.arch}`);
log.info(`Settings path: ${settingsStore.getStorePath()}`);
log.info('='.repeat(50));

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info('Another instance is already running, quitting...');
  app.quit();
} else {
  // Handle second instance
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    log.info('Second instance detected');
    handleSecondInstance(commandLine);
  });

  // App ready
  app.whenReady().then(async () => {
    log.info('App ready');

    // Register protocol handler first
    registerProtocolHandler();

    // Register IPC handlers
    registerIpcHandlers();

    // Create menu
    createMenu();

    // Create tray
    createTray();

    // Check if we should start hidden
    const shouldStartHidden = handleHiddenLaunch();

    // Create main window
    const mainWindow = await createMainWindow();

    // Show window if not starting hidden
    if (!shouldStartHidden) {
      mainWindow.show();
    }

    // Initialize auto-updater
    initAutoUpdater();

    // Sync auto-launch settings
    await syncAutoLaunchWithSettings();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        showMainWindow();
      }
    });

    log.info('App initialization complete');
  });

  // Window all closed
  app.on('window-all-closed', () => {
    // On macOS, keep app running in menu bar
    if (process.platform !== 'darwin') {
      // On Windows/Linux, check if we should minimize to tray
      if (!settingsStore.get('minimizeToTray')) {
        app.quit();
      }
    }
  });

  // Before quit
  app.on('before-quit', () => {
    log.info('App quitting...');

    // Clear cache if configured
    if (settingsStore.get('clearCacheOnExit')) {
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.session.clearCache();
        log.info('Cache cleared on exit');
      }
    }
  });

  // Will quit
  app.on('will-quit', () => {
    // Cleanup
    removeIpcHandlers();
    destroyTray();
    log.info('App cleanup complete');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason);
  });
}

// Security: Disable navigation to unknown URLs
app.on('web-contents-created', (_event, contents) => {
  // Disable navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    const mainWindow = getMainWindow();
    const appUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `file://${process.resourcesPath}`;

    if (!navigationUrl.startsWith(appUrl)) {
      event.preventDefault();
      log.warn(`Blocked navigation to: ${navigationUrl}`);
    }
  });

  // Disable new window creation
  contents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

// Disable GPU acceleration if needed (for some Linux systems)
if (process.platform === 'linux' && process.env.DISABLE_GPU) {
  app.disableHardwareAcceleration();
  log.info('GPU acceleration disabled');
}
