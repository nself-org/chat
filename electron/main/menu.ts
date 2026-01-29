/**
 * Application Menu
 *
 * Defines the native menu bar for the application.
 * Includes standard Edit, View, Window menus plus app-specific items.
 */

import { app, Menu, MenuItemConstructorOptions, shell, BrowserWindow } from 'electron';
import log from 'electron-log';
import {
  showMainWindow,
  reloadWindow,
  forceReloadWindow,
  toggleFullScreen,
  setZoomLevel,
  getZoomLevel,
  getMainWindow,
} from './window';
import settingsStore from './store';
import { checkForUpdates } from './updates';

const isMac = process.platform === 'darwin';

function getAppMenu(): MenuItemConstructorOptions {
  return {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Check for Updates...',
        click: () => checkForUpdates(true),
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  };
}

function getFileMenu(): MenuItemConstructorOptions {
  const submenu: MenuItemConstructorOptions[] = [
    {
      label: 'New Message',
      accelerator: 'CmdOrCtrl+N',
      click: () => {
        const mainWindow = getMainWindow();
        mainWindow?.webContents.send('app:new-message');
      },
    },
    {
      label: 'New Channel',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: () => {
        const mainWindow = getMainWindow();
        mainWindow?.webContents.send('app:new-channel');
      },
    },
    { type: 'separator' },
    {
      label: 'Find...',
      accelerator: 'CmdOrCtrl+F',
      click: () => {
        const mainWindow = getMainWindow();
        mainWindow?.webContents.send('app:find');
      },
    },
    {
      label: 'Find in Channel...',
      accelerator: 'CmdOrCtrl+Shift+F',
      click: () => {
        const mainWindow = getMainWindow();
        mainWindow?.webContents.send('app:find-in-channel');
      },
    },
  ];

  if (!isMac) {
    submenu.push(
      { type: 'separator' },
      {
        label: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      { role: 'quit' }
    );
  } else {
    submenu.push({ type: 'separator' }, { role: 'close' });
  }

  return {
    label: 'File',
    submenu,
  };
}

function getEditMenu(): MenuItemConstructorOptions {
  return {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
      },
    ],
  };
}

function getViewMenu(): MenuItemConstructorOptions {
  return {
    label: 'View',
    submenu: [
      { role: 'reload', accelerator: 'CmdOrCtrl+R', click: reloadWindow },
      {
        role: 'forceReload',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: forceReloadWindow,
      },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      {
        label: 'Actual Size',
        accelerator: 'CmdOrCtrl+0',
        click: () => setZoomLevel(1),
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => setZoomLevel(getZoomLevel() + 0.1),
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => setZoomLevel(getZoomLevel() - 0.1),
      },
      { type: 'separator' },
      {
        label: 'Toggle Full Screen',
        accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
        click: toggleFullScreen,
      },
      { type: 'separator' },
      {
        label: 'Sidebar',
        submenu: [
          {
            label: 'Show Sidebar',
            accelerator: 'CmdOrCtrl+\\',
            click: () => {
              const mainWindow = getMainWindow();
              mainWindow?.webContents.send('app:toggle-sidebar');
            },
          },
          {
            label: 'Show Channels',
            click: () => {
              const mainWindow = getMainWindow();
              mainWindow?.webContents.send('app:show-channels');
            },
          },
          {
            label: 'Show Direct Messages',
            click: () => {
              const mainWindow = getMainWindow();
              mainWindow?.webContents.send('app:show-dms');
            },
          },
        ],
      },
    ],
  };
}

function getGoMenu(): MenuItemConstructorOptions {
  return {
    label: 'Go',
    submenu: [
      {
        label: 'Back',
        accelerator: isMac ? 'Cmd+[' : 'Alt+Left',
        click: () => {
          const mainWindow = getMainWindow();
          if (mainWindow?.webContents.canGoBack()) {
            mainWindow.webContents.goBack();
          }
        },
      },
      {
        label: 'Forward',
        accelerator: isMac ? 'Cmd+]' : 'Alt+Right',
        click: () => {
          const mainWindow = getMainWindow();
          if (mainWindow?.webContents.canGoForward()) {
            mainWindow.webContents.goForward();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Jump to Channel...',
        accelerator: 'CmdOrCtrl+K',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('app:quick-switcher');
        },
      },
      {
        label: 'Jump to Conversation...',
        accelerator: 'CmdOrCtrl+J',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('app:jump-to-conversation');
        },
      },
      { type: 'separator' },
      {
        label: 'All Unreads',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('navigate', '/unreads');
        },
      },
      {
        label: 'Threads',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('navigate', '/threads');
        },
      },
      {
        label: 'All DMs',
        accelerator: 'CmdOrCtrl+Shift+K',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.send('navigate', '/dms');
        },
      },
    ],
  };
}

function getWindowMenu(): MenuItemConstructorOptions {
  const submenu: MenuItemConstructorOptions[] = [
    { role: 'minimize' },
    { role: 'zoom' },
  ];

  if (isMac) {
    submenu.push(
      { type: 'separator' },
      { role: 'front' },
      { type: 'separator' },
      { role: 'window' }
    );
  } else {
    submenu.push({ role: 'close' });
  }

  return {
    label: 'Window',
    submenu,
  };
}

function getHelpMenu(): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Learn More',
        click: () => shell.openExternal('https://nself.org'),
      },
      {
        label: 'Documentation',
        click: () => shell.openExternal('https://docs.nself.org'),
      },
      { type: 'separator' },
      {
        label: 'Report Issue',
        click: () => shell.openExternal('https://github.com/nself/nself-chat/issues'),
      },
      {
        label: 'Community',
        click: () => shell.openExternal('https://community.nself.org'),
      },
      { type: 'separator' },
      {
        label: 'View License',
        click: () => shell.openExternal('https://github.com/nself/nself-chat/blob/main/LICENSE'),
      },
      {
        label: 'Privacy Policy',
        click: () => shell.openExternal('https://nself.org/privacy'),
      },
      { type: 'separator' },
      {
        label: 'Toggle Developer Tools',
        accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          const mainWindow = getMainWindow();
          mainWindow?.webContents.toggleDevTools();
        },
      },
    ],
  };
}

export function createMenu(): void {
  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push(getAppMenu());
  }

  template.push(
    getFileMenu(),
    getEditMenu(),
    getViewMenu(),
    getGoMenu(),
    getWindowMenu(),
    getHelpMenu()
  );

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  log.info('Application menu created');
}

export function updateMenu(): void {
  createMenu();
}
