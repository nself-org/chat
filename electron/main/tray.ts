/**
 * System Tray
 *
 * Manages the system tray icon and context menu.
 * Provides quick access to common actions and unread count badge.
 */

import { Tray, Menu, app, nativeImage, nativeTheme } from 'electron';
import path from 'path';
import log from 'electron-log';
import { showMainWindow, toggleMainWindow, getMainWindow } from './window';
import settingsStore from './store';

let tray: Tray | null = null;
let unreadCount = 0;

function getIconPath(): string {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'tray-icon.png';
  return path.join(__dirname, '..', 'resources', iconName);
}

function getIconWithBadge(count: number): nativeImage {
  const iconPath = getIconPath();
  let icon = nativeImage.createFromPath(iconPath);

  // On macOS, we use the template image and the dock badge
  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 16, height: 16 });
    icon.setTemplateImage(true);
  }

  // Note: For Windows/Linux badge overlay, you would need to composite
  // the badge onto the icon. This is a simplified implementation.

  return icon;
}

function createContextMenu(): Menu {
  const mainWindow = getMainWindow();
  const isVisible = mainWindow?.isVisible() ?? false;

  return Menu.buildFromTemplate([
    {
      label: isVisible ? 'Hide nchat' : 'Show nchat',
      click: toggleMainWindow,
    },
    { type: 'separator' },
    {
      label: 'New Message',
      click: () => {
        showMainWindow();
        const window = getMainWindow();
        window?.webContents.send('app:new-message');
      },
    },
    {
      label: 'Jump to...',
      click: () => {
        showMainWindow();
        const window = getMainWindow();
        window?.webContents.send('app:quick-switcher');
      },
    },
    { type: 'separator' },
    {
      label: 'Status',
      submenu: [
        {
          label: 'Available',
          type: 'radio',
          checked: true,
          click: () => setUserStatus('available'),
        },
        {
          label: 'Away',
          type: 'radio',
          click: () => setUserStatus('away'),
        },
        {
          label: 'Do Not Disturb',
          type: 'radio',
          click: () => setUserStatus('dnd'),
        },
        {
          label: 'Invisible',
          type: 'radio',
          click: () => setUserStatus('invisible'),
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Notifications',
      submenu: [
        {
          label: 'Enable Notifications',
          type: 'checkbox',
          checked: settingsStore.get('notifications').enabled,
          click: (menuItem) => {
            const settings = settingsStore.get('notifications');
            settingsStore.set('notifications', {
              ...settings,
              enabled: menuItem.checked,
            });
          },
        },
        {
          label: 'Do Not Disturb',
          type: 'checkbox',
          checked: settingsStore.get('notifications').doNotDisturb,
          click: (menuItem) => {
            const settings = settingsStore.get('notifications');
            settingsStore.set('notifications', {
              ...settings,
              doNotDisturb: menuItem.checked,
            });
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Preferences...',
      click: () => {
        showMainWindow();
        const window = getMainWindow();
        window?.webContents.send('navigate', '/settings');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit nchat',
      click: () => {
        app.quit();
      },
    },
  ]);
}

function setUserStatus(status: string): void {
  const mainWindow = getMainWindow();
  mainWindow?.webContents.send('app:set-status', status);
  log.info(`User status set to: ${status}`);
}

export function createTray(): void {
  if (!settingsStore.get('showTrayIcon')) {
    log.info('Tray icon disabled in settings');
    return;
  }

  const icon = getIconWithBadge(unreadCount);
  tray = new Tray(icon);

  tray.setToolTip('nchat');
  tray.setContextMenu(createContextMenu());

  // Click behavior differs by platform
  tray.on('click', () => {
    if (process.platform === 'darwin') {
      // On macOS, click opens the context menu (default behavior)
      return;
    }
    // On Windows/Linux, click toggles the window
    toggleMainWindow();
  });

  tray.on('double-click', () => {
    showMainWindow();
  });

  log.info('System tray created');
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
    log.info('System tray destroyed');
  }
}

export function updateTrayMenu(): void {
  if (tray) {
    tray.setContextMenu(createContextMenu());
  }
}

export function setUnreadCount(count: number): void {
  unreadCount = count;

  if (tray) {
    const icon = getIconWithBadge(count);
    tray.setImage(icon);

    const tooltip = count > 0 ? `nchat (${count} unread)` : 'nchat';
    tray.setToolTip(tooltip);
  }

  // Update dock badge on macOS
  if (process.platform === 'darwin') {
    if (count > 0) {
      app.dock?.setBadge(count > 99 ? '99+' : count.toString());
    } else {
      app.dock?.setBadge('');
    }
  }

  // Update taskbar badge on Windows
  if (process.platform === 'win32') {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (count > 0) {
        mainWindow.setOverlayIcon(
          nativeImage.createFromPath(path.join(__dirname, '..', 'resources', 'badge.png')),
          `${count} unread`
        );
      } else {
        mainWindow.setOverlayIcon(null, '');
      }
    }
  }

  log.info(`Unread count updated: ${count}`);
}

export function flashFrame(flash: boolean): void {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isFocused()) {
    mainWindow.flashFrame(flash);
  }
}

export function getTray(): Tray | null {
  return tray;
}
