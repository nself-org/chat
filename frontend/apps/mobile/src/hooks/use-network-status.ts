/**
 * Network Status Hook
 *
 * React hook for monitoring network connectivity
 */

import { useState, useEffect } from 'react'
import { mobileNetwork, NetworkStatus, networkHelpers } from '../adapters/network'

/**
 * Use network status
 *
 * @example
 * ```typescript
 * function App() {
 *   const { connected, wifi, cellular, offline } = useNetworkStatus()
 *
 *   if (offline) {
 *     return <OfflineBanner />
 *   }
 *
 *   if (cellular) {
 *     return <DataSavingMode />
 *   }
 *
 *   return <NormalMode />
 * }
 * ```
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: false,
    connectionType: 'none',
    cellular: false,
    wifi: false,
    offline: true,
  })

  useEffect(() => {
    // Get initial status
    mobileNetwork.getStatus().then(setStatus)

    // Listen for changes
    const cleanup = mobileNetwork.addStatusChangeListener(setStatus)

    return cleanup
  }, [])

  return {
    ...status,
    connectionTypeName: networkHelpers.getConnectionTypeName(
      status.connectionType
    ),
    connectionQuality: networkHelpers.getConnectionQuality(
      status.connectionType
    ),
    isMetered: networkHelpers.isMeteredConnection(status.connectionType),
    suitableForLargeDownloads:
      networkHelpers.isSuitableForLargeDownloads(status),
    shouldEnableDataSaving: networkHelpers.shouldEnableDataSaving(status),
    shouldAutoDownloadMedia: networkHelpers.shouldAutoDownloadMedia(status),
  }
}
