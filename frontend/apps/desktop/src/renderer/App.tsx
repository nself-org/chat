/**
 * Main Desktop App Component for nself-chat
 *
 * Integrates shared packages (@nself-chat/core, api, state, ui)
 * with desktop-specific features and electron integration
 */

import React, { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'

// Import shared packages (demonstrates integration)
import { useAuthStore } from '@nself-chat/state'

// Import desktop-specific hooks and adapters
import { useElectron } from './hooks/use-electron'
import { desktopStorage } from '../adapters/storage'

// Import UI components from shared package (when available)
// import '@nself-chat/ui/styles.css'

/**
 * Main App Component
 *
 * Sets up:
 * - Electron desktop integration (from window.desktop API)
 * - State management (from @nself-chat/state)
 * - Desktop platform adapters
 * - Window controls and native menus
 *
 * @example
 * ```typescript
 * import { App } from './App'
 * import { createRoot } from 'react-dom/client'
 *
 * createRoot(document.getElementById('root')!).render(<App />)
 * ```
 */
export function App() {
  const { user, isAuthenticated } = useAuthStore()
  const { isElectron, platform, appVersion } = useElectron()
  const [isReady, setIsReady] = useState(false)

  // Initialize desktop app
  useEffect(() => {
    initializeApp()
  }, [])

  // Monitor window state
  useEffect(() => {
    if (isElectron && window.desktop) {
      // Setup update listener
      const cleanup = window.desktop.update.onDownloadProgress((progress) => {
        console.log('[App] Update progress:', progress.percent.toFixed(2) + '%')
      })

      return cleanup
    }
  }, [isElectron])

  return (
    <BrowserRouter>
      <div className="app" data-platform={platform}>
        <div className="window-content">
          <header className="app-header">
            <h1>nself-chat Desktop</h1>
            {appVersion && <span className="version">v{appVersion}</span>}
          </header>

          <main className="app-main">
            <div className="status-panel">
              <h2>Status</h2>
              <ul>
                <li>
                  <strong>Platform:</strong> {platform}
                </li>
                <li>
                  <strong>Electron:</strong> {isElectron ? 'Yes' : 'No'}
                </li>
                <li>
                  <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
                </li>
                {user && (
                  <li>
                    <strong>User:</strong> {user.email}
                  </li>
                )}
                <li>
                  <strong>Ready:</strong> {isReady ? 'Yes' : 'Initializing...'}
                </li>
              </ul>
            </div>

            <div className="info-panel">
              <h2>Desktop Features</h2>
              <p>This is the nself-chat desktop app scaffold.</p>
              <p>
                The following features are available:
              </p>
              <ul>
                <li>✅ Electron integration</li>
                <li>✅ Native window controls</li>
                <li>✅ System tray support</li>
                <li>✅ Auto-updates</li>
                <li>✅ Desktop storage (electron-store)</li>
                <li>✅ Native notifications</li>
                <li>✅ Clipboard access</li>
                <li>✅ Filesystem access</li>
                <li>✅ Shared package integration</li>
              </ul>
            </div>
          </main>

          <footer className="app-footer">
            <p>
              Desktop app powered by{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  window.desktop?.shell.openExternal('https://www.electronjs.org/')
                }}
              >
                Electron
              </a>
            </p>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  )

  /**
   * Initialize desktop app
   */
  async function initializeApp() {
    console.log('[App] Initializing desktop app')

    try {
      // Check storage
      const keys = desktopStorage.keys()
      console.log(`[App] Storage has ${keys.length} keys`)

      // Load cached auth state
      const cachedAuth = desktopStorage.getItem('auth_state')
      if (cachedAuth) {
        console.log('[App] Found cached auth state')
      }

      // Check electron API
      if (window.desktop) {
        const version = await window.desktop.app.getVersion()
        console.log('[App] Running version:', version)
      }

      setIsReady(true)
      console.log('[App] Desktop app initialized successfully')
    } catch (error) {
      console.error('[App] Initialization error:', error)
      setIsReady(true) // Set ready anyway to show error state
    }
  }
}

export default App
