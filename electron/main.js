/**
 * Electron Main Process Entry Point
 *
 * This is the entry point for the Electron main process.
 * It bootstraps the TypeScript modules and initializes the application.
 */

'use strict';

// Register TypeScript compiler for development
if (process.env.NODE_ENV !== 'production') {
  require('ts-node').register({
    compilerOptions: {
      module: 'commonjs',
      target: 'ES2020',
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
    },
    transpileOnly: true,
  });
}

// Import and run the main application
const { app } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Set app user model id for Windows notifications
app.setAppUserModelId('org.nself.nchat');

// In production, load the compiled JavaScript
// In development, load the TypeScript source
const mainPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'main', 'index.js')
  : path.join(__dirname, 'main', 'index.ts');

require(mainPath);
