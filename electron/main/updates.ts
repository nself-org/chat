/**
 * Auto-Updater
 *
 * Handles automatic application updates using electron-updater.
 * Supports GitHub releases and other update providers.
 */

import { autoUpdater, UpdateCheckResult, UpdateInfo as ElectronUpdateInfo } from 'electron-updater';
import { app, dialog } from 'electron';
import log from 'electron-log';
import settingsStore from './store';
import { getMainWindow } from './window';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | null;
  downloadProgress?: number;
  downloaded: boolean;
  error?: string;
}

let updateInfo: UpdateInfo = {
  available: false,
  downloaded: false,
};

let isCheckingForUpdates = false;
let isDownloading = false;

function configureAutoUpdater(): void {
  // Configure logging
  autoUpdater.logger = log;

  // Configure update channel based on settings
  const channel = settingsStore.get('updateChannel');
  autoUpdater.channel = channel;

  // Auto-download based on settings
  autoUpdater.autoDownload = settingsStore.get('autoUpdate');
  autoUpdater.autoInstallOnAppQuit = true;

  // Configure for GitHub releases
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'nself',
    repo: 'nself-chat',
    releaseType: channel === 'stable' ? 'release' : 'prerelease',
  });

  log.info(`Auto-updater configured for channel: ${channel}`);
}

function notifyRenderer(event: string, data?: unknown): void {
  const mainWindow = getMainWindow();
  mainWindow?.webContents.send(`update:${event}`, data);
}

export function initAutoUpdater(): void {
  configureAutoUpdater();

  // Update check started
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    isCheckingForUpdates = true;
    notifyRenderer('checking');
  });

  // Update available
  autoUpdater.on('update-available', (info: ElectronUpdateInfo) => {
    log.info(`Update available: ${info.version}`);
    isCheckingForUpdates = false;

    updateInfo = {
      available: true,
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
      downloaded: false,
    };

    notifyRenderer('available', updateInfo);

    // Show dialog if not auto-downloading
    if (!settingsStore.get('autoUpdate')) {
      showUpdateAvailableDialog(info);
    }
  });

  // No update available
  autoUpdater.on('update-not-available', (info: ElectronUpdateInfo) => {
    log.info('No updates available');
    isCheckingForUpdates = false;

    updateInfo = {
      available: false,
      version: info.version,
      downloaded: false,
    };

    notifyRenderer('not-available', updateInfo);
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.debug(`Download progress: ${progress.percent.toFixed(1)}%`);
    isDownloading = true;

    updateInfo.downloadProgress = progress.percent;
    notifyRenderer('download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info: ElectronUpdateInfo) => {
    log.info(`Update downloaded: ${info.version}`);
    isDownloading = false;

    updateInfo.downloaded = true;
    updateInfo.downloadProgress = 100;

    notifyRenderer('downloaded', updateInfo);

    // Show install dialog
    showUpdateReadyDialog(info);
  });

  // Error
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    isCheckingForUpdates = false;
    isDownloading = false;

    updateInfo.error = error.message;
    notifyRenderer('error', { message: error.message });
  });

  // Check for updates on startup (after a delay)
  if (settingsStore.get('autoUpdate')) {
    setTimeout(() => {
      checkForUpdates(false);
    }, 10000); // 10 second delay

    // Check periodically (every 4 hours)
    setInterval(() => {
      checkForUpdates(false);
    }, 4 * 60 * 60 * 1000);
  }

  log.info('Auto-updater initialized');
}

async function showUpdateAvailableDialog(info: ElectronUpdateInfo): Promise<void> {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version of nchat is available!`,
    detail: `Version ${info.version} is ready to download.\n\n${
      typeof info.releaseNotes === 'string' ? info.releaseNotes.substring(0, 500) : ''
    }`,
    buttons: ['Download Now', 'Later', 'Skip This Version'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    downloadUpdate();
  } else if (result.response === 2) {
    // Skip this version - could store in settings
    log.info(`User skipped version ${info.version}`);
  }
}

async function showUpdateReadyDialog(info: ElectronUpdateInfo): Promise<void> {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update ready to install',
    detail: `Version ${info.version} has been downloaded and is ready to install. The application will restart to apply the update.`,
    buttons: ['Install Now', 'Install Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    installUpdate();
  }
}

export async function checkForUpdates(showNoUpdateDialog: boolean = false): Promise<UpdateCheckResult | null> {
  if (isCheckingForUpdates || isDownloading) {
    log.debug('Update check already in progress');
    return null;
  }

  try {
    const result = await autoUpdater.checkForUpdates();

    if (!result?.updateInfo) {
      if (showNoUpdateDialog) {
        const mainWindow = getMainWindow();
        if (mainWindow) {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version.',
            detail: `Current version: ${app.getVersion()}`,
            buttons: ['OK'],
          });
        }
      }
    }

    return result;
  } catch (error) {
    log.error('Update check failed:', error);

    if (showNoUpdateDialog) {
      const mainWindow = getMainWindow();
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Update Check Failed',
          message: 'Could not check for updates',
          detail: (error as Error).message,
          buttons: ['OK'],
        });
      }
    }

    return null;
  }
}

export async function downloadUpdate(): Promise<void> {
  if (isDownloading) {
    log.debug('Download already in progress');
    return;
  }

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    log.error('Update download failed:', error);
    notifyRenderer('error', { message: (error as Error).message });
  }
}

export function installUpdate(): void {
  log.info('Installing update...');
  autoUpdater.quitAndInstall(false, true);
}

export function getUpdateInfo(): UpdateInfo {
  return { ...updateInfo };
}

export function setUpdateChannel(channel: 'stable' | 'beta' | 'alpha'): void {
  settingsStore.set('updateChannel', channel);
  autoUpdater.channel = channel;
  log.info(`Update channel changed to: ${channel}`);
}
