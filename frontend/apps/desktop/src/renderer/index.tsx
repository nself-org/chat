/**
 * Desktop App Renderer Entry Point
 *
 * Bootstraps the React application in the Electron renderer process
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

/**
 * Mount the app
 */
const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('[Renderer] React app mounted')
