/**
 * Global Keyboard Shortcuts for Electron
 *
 * Registers global keyboard shortcuts
 */

import { globalShortcut } from 'electron'
import type { WindowManager } from './window-manager'

/**
 * Setup global keyboard shortcuts
 *
 * @param windowManager - Window manager instance
 */
export function setupShortcuts(windowManager: WindowManager): void {
  // Show/hide main window (Ctrl+Shift+Space or Cmd+Shift+Space)
  const toggleShortcut =
    process.platform === 'darwin' ? 'Cmd+Shift+Space' : 'Ctrl+Shift+Space'

  globalShortcut.register(toggleShortcut, () => {
    const mainWindow = windowManager.getMainWindow()
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  console.log(`[Shortcuts] Global shortcuts registered (${toggleShortcut})`)
}

/**
 * Unregister all shortcuts
 */
export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
  console.log('[Shortcuts] Global shortcuts unregistered')
}
