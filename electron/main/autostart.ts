/**
 * Auto-Launch / Auto-Start
 *
 * Manages application auto-launch at system startup.
 * Handles platform-specific login item settings.
 */

import { app } from 'electron';
import log from 'electron-log';
import settingsStore from './store';

interface AutoLaunchSettings {
  openAtLogin: boolean;
  openAsHidden: boolean;
  path?: string;
  args?: string[];
}

function getLoginItemSettings(): Electron.LoginItemSettings {
  return app.getLoginItemSettings({
    path: process.execPath,
    args: [],
  });
}

export async function setAutoLaunch(enabled: boolean): Promise<boolean> {
  try {
    const startMinimized = settingsStore.get('startMinimized');

    if (process.platform === 'darwin') {
      // macOS
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: startMinimized,
        path: process.execPath,
      });
    } else if (process.platform === 'win32') {
      // Windows
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: startMinimized,
        path: process.execPath,
        args: startMinimized ? ['--hidden'] : [],
      });
    } else {
      // Linux - uses .desktop file approach
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: startMinimized,
        path: process.execPath,
        args: startMinimized ? ['--hidden'] : [],
      });
    }

    // Save to settings
    settingsStore.set('launchAtStartup', enabled);

    log.info(`Auto-launch ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  } catch (error) {
    log.error('Failed to set auto-launch:', error);
    return false;
  }
}

export async function getAutoLaunchStatus(): Promise<boolean> {
  try {
    const settings = getLoginItemSettings();
    return settings.openAtLogin;
  } catch (error) {
    log.error('Failed to get auto-launch status:', error);
    return false;
  }
}

export async function syncAutoLaunchWithSettings(): Promise<void> {
  try {
    const settingsEnabled = settingsStore.get('launchAtStartup');
    const systemEnabled = await getAutoLaunchStatus();

    // Sync if out of sync
    if (settingsEnabled !== systemEnabled) {
      await setAutoLaunch(settingsEnabled);
      log.info(`Auto-launch synced: ${settingsEnabled}`);
    }
  } catch (error) {
    log.error('Failed to sync auto-launch settings:', error);
  }
}

export function isLaunchedAtLogin(): boolean {
  // Check if the app was launched with --hidden flag
  if (process.argv.includes('--hidden')) {
    return true;
  }

  // On macOS, check if launched as login item
  if (process.platform === 'darwin') {
    const settings = getLoginItemSettings();
    return settings.wasOpenedAtLogin ?? false;
  }

  // On Windows, check registry (simplified check)
  if (process.platform === 'win32') {
    return process.argv.includes('--hidden');
  }

  return false;
}

export function handleHiddenLaunch(): boolean {
  const wasLaunchedAtLogin = isLaunchedAtLogin();
  const startMinimized = settingsStore.get('startMinimized');

  // If launched at login and configured to start minimized
  if (wasLaunchedAtLogin && startMinimized) {
    log.info('Started minimized (launched at login)');
    return true;
  }

  // If explicitly launched with --hidden
  if (process.argv.includes('--hidden')) {
    log.info('Started hidden (--hidden flag)');
    return true;
  }

  return false;
}

export function getAutoLaunchInfo(): AutoLaunchSettings {
  const loginSettings = getLoginItemSettings();

  return {
    openAtLogin: loginSettings.openAtLogin,
    openAsHidden: loginSettings.openAsHidden ?? false,
    path: loginSettings.executableWillLaunchAtLogin ?? process.execPath,
    args: loginSettings.args ?? [],
  };
}
