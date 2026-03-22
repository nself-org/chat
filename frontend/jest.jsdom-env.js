/**
 * Custom JSDOM environment for Jest that works around a canvas/Next.js 15
 * incompatibility.
 *
 * Problem: The `canvas` npm package is installed (as a peer dependency of
 * jest-environment-jsdom) but its native binary (canvas.node) is not compiled.
 * JSDOM tries to load canvas, which fails fatally under Next.js 15's require
 * hook.
 *
 * Fix: Populate the require cache with a canvas stub before loading JSDOM,
 * so the real (broken) canvas package is never loaded.
 */

// Resolve the real canvas package path to know the cache key
const canvasPath = require.resolve('canvas')

// Insert a stub into the require cache BEFORE jest-environment-jsdom loads
// This prevents JSDOM from loading the real canvas (which has no native binary)
require.cache[canvasPath] = {
  id: canvasPath,
  filename: canvasPath,
  loaded: true,
  exports: {
    // JSDOM checks: typeof Canvas.createCanvas === 'function'
    // Returning an empty object makes JSDOM set exports.Canvas = null
  },
}

// Now load jest-environment-jsdom — JSDOM will get our cached stub
const JSDOMEnvironment = require('jest-environment-jsdom')

module.exports = JSDOMEnvironment
