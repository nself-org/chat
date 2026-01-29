/**
 * Electron Preload Script Entry Point
 *
 * This script runs in the renderer process before the web content loads.
 * It bridges the main process and renderer process securely.
 */

'use strict';

// In production, load the compiled preload script
// In development, we need to handle this differently since preload
// scripts cannot use ts-node directly
const path = require('path');

// Load the compiled preload script
// Note: Preload scripts must be compiled to JavaScript before running
require(path.join(__dirname, 'preload', 'index.js'));
