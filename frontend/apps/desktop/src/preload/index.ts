/**
 * Electron Preload Script
 *
 * Exposes safe APIs to the renderer process via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopAPI } from './api'

/**
 * Expose desktop API to renderer process
 *
 * All IPC communication goes through this bridge
 */
const desktopAPI: DesktopAPI = {
  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getName: () => ipcRenderer.invoke('app:get-name'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.send('shell:open-external', url),
    showItemInFolder: (path: string) =>
      ipcRenderer.send('shell:show-item-in-folder', path),
  },

  // Updates
  update: {
    check: () => ipcRenderer.send('update:check'),
    onDownloadProgress: (callback: (progress: any) => void) => {
      const listener = (_event: any, progress: any) => callback(progress)
      ipcRenderer.on('update-download-progress', listener)
      return () => ipcRenderer.removeListener('update-download-progress', listener)
    },
  },

  // Notifications
  notification: {
    show: (options: { title: string; body: string; silent?: boolean }) =>
      ipcRenderer.invoke('notification:show', options),
  },

  // Platform detection
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
    platform: process.platform,
  },
}

// Expose API to renderer
contextBridge.exposeInMainWorld('desktop', desktopAPI)

console.log('[Preload] Desktop API exposed to renderer')
