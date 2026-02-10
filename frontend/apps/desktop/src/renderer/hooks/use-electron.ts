/**
 * useElectron Hook
 *
 * React hook for Electron desktop features
 */

import { useState, useEffect } from 'react'

/**
 * Electron hook interface
 */
export interface UseElectronResult {
  isElectron: boolean
  platform: string
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  appVersion: string | null
  appName: string | null
}

/**
 * useElectron Hook
 *
 * Provides access to Electron desktop API and platform detection
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { isElectron, platform, appVersion } = useElectron()
 *
 *   if (!isElectron) {
 *     return <div>Not running in Electron</div>
 *   }
 *
 *   return <div>Running on {platform}, version {appVersion}</div>
 * }
 * ```
 */
export function useElectron(): UseElectronResult {
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [appName, setAppName] = useState<string | null>(null)

  const isElectron = !!window.desktop
  const platform = window.desktop?.platform.platform ?? 'unknown'
  const isMac = window.desktop?.platform.isMac ?? false
  const isWindows = window.desktop?.platform.isWindows ?? false
  const isLinux = window.desktop?.platform.isLinux ?? false

  useEffect(() => {
    if (isElectron) {
      // Get app info
      window.desktop.app.getVersion().then(setAppVersion)
      window.desktop.app.getName().then(setAppName)
    }
  }, [isElectron])

  return {
    isElectron,
    platform,
    isMac,
    isWindows,
    isLinux,
    appVersion,
    appName,
  }
}
