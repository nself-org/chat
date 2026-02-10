/**
 * useWindow Hook
 *
 * React hook for window controls
 */

import { useState, useEffect } from 'react'

/**
 * Window hook interface
 */
export interface UseWindowResult {
  isMaximized: boolean
  minimize: () => void
  maximize: () => void
  close: () => void
  toggleMaximize: () => void
}

/**
 * useWindow Hook
 *
 * Provides window control functions for Electron
 *
 * @example
 * ```typescript
 * function TitleBar() {
 *   const { isMaximized, minimize, maximize, close } = useWindow()
 *
 *   return (
 *     <div className="title-bar">
 *       <button onClick={minimize}>−</button>
 *       <button onClick={maximize}>{isMaximized ? '❐' : '☐'}</button>
 *       <button onClick={close}>✕</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWindow(): UseWindowResult {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.desktop) {
      // Check initial maximized state
      window.desktop.window.isMaximized().then(setIsMaximized)
    }
  }, [])

  const minimize = () => {
    window.desktop?.window.minimize()
  }

  const maximize = () => {
    window.desktop?.window.maximize()
    // Toggle maximized state
    setIsMaximized(!isMaximized)
  }

  const close = () => {
    window.desktop?.window.close()
  }

  const toggleMaximize = () => {
    maximize()
  }

  return {
    isMaximized,
    minimize,
    maximize,
    close,
    toggleMaximize,
  }
}
