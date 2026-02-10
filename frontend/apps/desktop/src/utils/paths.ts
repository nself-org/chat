/**
 * Path Utilities for Desktop
 */

/**
 * Get app data path
 */
export async function getAppDataPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('appData')
  }
  return ''
}

/**
 * Get user data path
 */
export async function getUserDataPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('userData')
  }
  return ''
}

/**
 * Get temp path
 */
export async function getTempPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('temp')
  }
  return ''
}

/**
 * Get downloads path
 */
export async function getDownloadsPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('downloads')
  }
  return ''
}

/**
 * Get documents path
 */
export async function getDocumentsPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('documents')
  }
  return ''
}

/**
 * Get desktop path
 */
export async function getDesktopPath(): Promise<string> {
  if (window.desktop) {
    return await window.desktop.app.getPath('desktop')
  }
  return ''
}
