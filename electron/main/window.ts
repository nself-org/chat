/**
 * Window Management
 *
 * Handles creation and management of the main application window.
 * Includes state persistence, bounds validation, and multi-monitor support.
 */

import { app, BrowserWindow, screen, shell, nativeTheme } from 'electron';
import path from 'path';
import log from 'electron-log';
import settingsStore, { WindowState } from './store';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function getValidWindowBounds(): WindowState {
  const storedState = settingsStore.getWindowState();
  const { width, height, x, y, isMaximized, isFullScreen } = storedState;

  // Get all displays
  const displays = screen.getAllDisplays();

  // Check if the stored position is within any display
  let isPositionValid = false;
  if (x !== undefined && y !== undefined) {
    for (const display of displays) {
      const { x: dX, y: dY, width: dW, height: dH } = display.bounds;
      if (x >= dX && x < dX + dW && y >= dY && y < dY + dH) {
        isPositionValid = true;
        break;
      }
    }
  }

  // If position is invalid, center on primary display
  if (!isPositionValid) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    return {
      width: Math.min(width, screenWidth),
      height: Math.min(height, screenHeight),
      x: Math.floor((screenWidth - width) / 2),
      y: Math.floor((screenHeight - height) / 2),
      isMaximized,
      isFullScreen,
    };
  }

  return storedState;
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isMaximized = mainWindow.isMaximized();
  const isFullScreen = mainWindow.isFullScreen();

  // Only save bounds if not maximized/fullscreen
  if (!isMaximized && !isFullScreen) {
    const bounds = mainWindow.getBounds();
    settingsStore.setWindowState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
      isFullScreen,
    });
  } else {
    settingsStore.setWindowState({ isMaximized, isFullScreen });
  }
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const windowState = getValidWindowBounds();
  const isDev = process.env.NODE_ENV === 'development';

  // Create the browser window
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 400,
    minHeight: 300,
    show: false, // Don't show until ready
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ffffff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    frame: process.platform !== 'darwin',
    transparent: false,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    icon: path.join(__dirname, '..', 'resources', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: settingsStore.get('spellcheck'),
      zoomFactor: settingsStore.get('zoomLevel'),
    },
  });

  // Apply stored state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }
  if (windowState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }

  // Load the app
  const serverUrl = settingsStore.get('serverUrl');
  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from the exported static files
    const appPath = path.join(process.resourcesPath, 'app', 'index.html');
    await mainWindow.loadFile(appPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (!settingsStore.get('startMinimized')) {
      mainWindow?.show();
    }
    log.info('Main window ready to show');
  });

  // Save window state on move/resize
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);
  mainWindow.on('enter-full-screen', saveWindowState);
  mainWindow.on('leave-full-screen', saveWindowState);

  // Handle window close
  mainWindow.on('close', (event) => {
    if (settingsStore.get('minimizeToTray') && settingsStore.get('showTrayIcon')) {
      event.preventDefault();
      mainWindow?.hide();
      log.info('Window hidden to tray');
    } else {
      saveWindowState();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    log.info('Main window closed');
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev ? 'http://localhost:3000' : `file://${process.resourcesPath}`;
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle context menu for spellcheck
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (params.misspelledWord) {
      const menu = require('electron').Menu.buildFromTemplate([
        ...params.dictionarySuggestions.map((suggestion) => ({
          label: suggestion,
          click: () => mainWindow?.webContents.replaceMisspelling(suggestion),
        })),
        { type: 'separator' as const },
        {
          label: 'Add to Dictionary',
          click: () => mainWindow?.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
        },
      ]);
      menu.popup();
    }
  });

  // Dev tools
  if (isDev || settingsStore.get('devToolsEnabled')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  log.info('Main window created successfully');
  return mainWindow;
}

export function showMainWindow(): void {
  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

export function hideMainWindow(): void {
  mainWindow?.hide();
}

export function toggleMainWindow(): void {
  if (mainWindow?.isVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

export function focusMainWindow(): void {
  mainWindow?.focus();
}

export function minimizeMainWindow(): void {
  mainWindow?.minimize();
}

export function maximizeMainWindow(): void {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
}

export function setFullScreen(fullScreen: boolean): void {
  mainWindow?.setFullScreen(fullScreen);
}

export function toggleFullScreen(): void {
  mainWindow?.setFullScreen(!mainWindow.isFullScreen());
}

export function setZoomLevel(level: number): void {
  const clampedLevel = Math.max(0.5, Math.min(2, level));
  settingsStore.set('zoomLevel', clampedLevel);
  mainWindow?.webContents.setZoomFactor(clampedLevel);
}

export function getZoomLevel(): number {
  return mainWindow?.webContents.getZoomFactor() ?? 1;
}

export function reloadWindow(): void {
  mainWindow?.reload();
}

export function forceReloadWindow(): void {
  mainWindow?.webContents.reloadIgnoringCache();
}

export function clearCache(): Promise<void> {
  return mainWindow?.webContents.session.clearCache() ?? Promise.resolve();
}

export function clearStorageData(): Promise<void> {
  return mainWindow?.webContents.session.clearStorageData() ?? Promise.resolve();
}
