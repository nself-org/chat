/**
 * IPC Handlers for Electron
 *
 * Handles communication between main and renderer processes
 */

import { ipcMain, app, shell } from 'electron'
import { checkForUpdates } from './auto-updater'

/**
 * Setup IPC handlers
 *
 * Registers all IPC message handlers
 */
export function setupIpcHandlers(): void {
  // App info
  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:get-name', () => {
    return app.getName()
  })

  ipcMain.handle('app:get-path', (_event, name: string) => {
    return app.getPath(name as any)
  })

  // Window controls
  ipcMain.on('window:minimize', (event) => {
    const window = event.sender.getOwnerBrowserWindow()
    window?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const window = event.sender.getOwnerBrowserWindow()
    if (window?.isMaximized()) {
      window.restore()
    } else {
      window?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    const window = event.sender.getOwnerBrowserWindow()
    window?.close()
  })

  ipcMain.handle('window:is-maximized', (event) => {
    const window = event.sender.getOwnerBrowserWindow()
    return window?.isMaximized() ?? false
  })

  // External links
  ipcMain.on('shell:open-external', (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.on('shell:show-item-in-folder', (_event, path: string) => {
    shell.showItemInFolder(path)
  })

  // Updates
  ipcMain.on('update:check', () => {
    checkForUpdates()
  })

  // Notifications
  ipcMain.handle('notification:show', (_event, options: NotificationOptions) => {
    const { Notification } = require('electron')
    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent ?? false,
    })
    notification.show()
    return true
  })

  // Storage (using electron-store in adapters)
  // IPC handlers for storage are in the storage adapter

  console.log('[IPC] IPC handlers registered')
}

/**
 * Notification options interface
 */
interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
}
