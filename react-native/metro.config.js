const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')

/**
 * Metro configuration for nChat
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Watch additional directories for hot reloading
  watchFolders: [
    // Include the shared code from the main project
    path.resolve(__dirname, '../src/shared'),
  ],

  resolver: {
    // Configure node_modules resolution
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
    ],

    // Resolve shared imports
    extraNodeModules: {
      '@shared': path.resolve(__dirname, '../src/shared'),
    },

    // Block certain patterns from being resolved
    blockList: [
      // Exclude web-specific files
      /\.web\.[jt]sx?$/,
      // Exclude Next.js specific folders
      /\.next\//,
      // Exclude backend
      /\.backend\//,
    ],

    // Source extensions to resolve
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs'],

    // Asset extensions
    assetExts: [
      'bmp',
      'gif',
      'jpg',
      'jpeg',
      'png',
      'psd',
      'svg',
      'webp',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'm4v',
      'mov',
      'mp4',
      'mpeg',
      'mpg',
      'webm',
      'aac',
      'aiff',
      'caf',
      'm4a',
      'mp3',
      'wav',
    ],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
