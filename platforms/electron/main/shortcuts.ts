/**
 * Global Keyboard Shortcuts
 *
 * Registers global keyboard shortcuts that work even when the app is not focused.
 * Useful for quick access, voice calls, and other quick actions.
 */

import { app, globalShortcut } from 'electron'
import log from 'electron-log'
import { showMainWindow, toggleMainWindow, getMainWindow } from './window'
import settingsStore from './store'

export function registerGlobalShortcuts(): void {
  try {
    // Get custom shortcuts from settings or use defaults
    const shortcuts = settingsStore.get('globalShortcuts') || {
      toggleWindow: 'CommandOrControl+Shift+Space',
      showWindow: 'CommandOrControl+Shift+N',
      voiceCall: 'CommandOrControl+Shift+V',
      muteToggle: 'CommandOrControl+Shift+M',
    }

    // Toggle window visibility
    if (shortcuts.toggleWindow) {
      const registered = globalShortcut.register(shortcuts.toggleWindow, () => {
        log.debug('Global shortcut: Toggle window')
        toggleMainWindow()
      })
      if (registered) {
        log.info(`Global shortcut registered: ${shortcuts.toggleWindow} (Toggle window)`)
      } else {
        log.warn(`Failed to register global shortcut: ${shortcuts.toggleWindow}`)
      }
    }

    // Show window (always brings to front)
    if (shortcuts.showWindow) {
      const registered = globalShortcut.register(shortcuts.showWindow, () => {
        log.debug('Global shortcut: Show window')
        showMainWindow()
      })
      if (registered) {
        log.info(`Global shortcut registered: ${shortcuts.showWindow} (Show window)`)
      } else {
        log.warn(`Failed to register global shortcut: ${shortcuts.showWindow}`)
      }
    }

    // Quick voice call toggle
    if (shortcuts.voiceCall) {
      const registered = globalShortcut.register(shortcuts.voiceCall, () => {
        log.debug('Global shortcut: Voice call')
        const mainWindow = getMainWindow()
        mainWindow?.webContents.send('app:toggle-voice-call')
      })
      if (registered) {
        log.info(`Global shortcut registered: ${shortcuts.voiceCall} (Voice call)`)
      } else {
        log.warn(`Failed to register global shortcut: ${shortcuts.voiceCall}`)
      }
    }

    // Mute/unmute toggle
    if (shortcuts.muteToggle) {
      const registered = globalShortcut.register(shortcuts.muteToggle, () => {
        log.debug('Global shortcut: Mute toggle')
        const mainWindow = getMainWindow()
        mainWindow?.webContents.send('app:toggle-mute')
      })
      if (registered) {
        log.info(`Global shortcut registered: ${shortcuts.muteToggle} (Mute toggle)`)
      } else {
        log.warn(`Failed to register global shortcut: ${shortcuts.muteToggle}`)
      }
    }

    log.info('Global shortcuts registered successfully')
  } catch (error) {
    log.error('Failed to register global shortcuts:', error)
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  log.info('All global shortcuts unregistered')
}

// Re-register shortcuts when settings change
export function updateGlobalShortcuts(): void {
  unregisterGlobalShortcuts()
  registerGlobalShortcuts()
  log.info('Global shortcuts updated')
}

// Clean up shortcuts when app quits
app.on('will-quit', () => {
  unregisterGlobalShortcuts()
})

// Check if a shortcut is registered
export function isShortcutRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator)
}

// Get all registered shortcuts
export function getRegisteredShortcuts(): string[] {
  const shortcuts = settingsStore.get('globalShortcuts') || {}
  return Object.values(shortcuts).filter(Boolean) as string[]
}
