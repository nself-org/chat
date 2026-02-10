/**
 * Platform Detection Utilities
 */

import type { DesktopPlatform } from '../types/desktop'

/**
 * Get the current platform
 */
export function getPlatform(): DesktopPlatform {
  if (window.desktop) {
    return window.desktop.platform.platform as DesktopPlatform
  }
  // Fallback to user agent
  const ua = navigator.userAgent
  if (ua.includes('Mac')) return 'darwin'
  if (ua.includes('Win')) return 'win32'
  return 'linux'
}

/**
 * Check if running on macOS
 */
export function isMac(): boolean {
  return window.desktop?.platform.isMac ?? false
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return window.desktop?.platform.isWindows ?? false
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return window.desktop?.platform.isLinux ?? false
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return !!window.desktop
}

/**
 * Get platform-specific key modifier name
 */
export function getModifierKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl'
}

/**
 * Get platform-specific shortcut display string
 */
export function formatShortcut(shortcut: string): string {
  if (isMac()) {
    return shortcut
      .replace('Ctrl', '⌃')
      .replace('Cmd', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
  }
  return shortcut
}

/**
 * Check if platform supports native features
 */
export function supportsNativeFeature(feature: string): boolean {
  if (!isElectron()) return false

  const supportedFeatures = {
    notifications: true,
    tray: !isMac(), // macOS uses dock instead
    autoUpdater: true,
    globalShortcuts: true,
    nativeMenu: true,
    systemPreferences: isMac(),
  }

  return supportedFeatures[feature as keyof typeof supportedFeatures] ?? false
}
