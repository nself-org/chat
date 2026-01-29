/**
 * Electron Preload Script
 *
 * This script runs in the renderer process before the web content loads.
 * It exposes a secure API to the renderer through contextBridge.
 */

import { contextBridge } from 'electron';
import { createElectronAPI, ElectronAPI } from './api';

// Extend the Window interface to include our API
declare global {
  interface Window {
    electron: ElectronAPI;
    isElectron: boolean;
  }
}

// Create and expose the API
const electronAPI = createElectronAPI();

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Expose a flag to detect Electron environment
contextBridge.exposeInMainWorld('isElectron', true);

// Log that preload has loaded
console.log('[Preload] Electron API exposed successfully');

// Handle errors
window.addEventListener('error', (event) => {
  console.error('[Preload] Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Preload] Unhandled rejection:', event.reason);
});
