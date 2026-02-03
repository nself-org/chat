/**
 * Detox Configuration
 *
 * E2E testing framework for React Native and Capacitor mobile apps
 * Supports iOS simulators and Android emulators
 *
 * @see https://wix.github.io/Detox/docs/config/overview
 */

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/mobile/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    // iOS app configurations
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'platforms/capacitor/ios/App/build/Build/Products/Debug-iphonesimulator/App.app',
      build: 'cd platforms/capacitor && npm run build:ios -- --configuration Debug --simulator',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'platforms/capacitor/ios/App/build/Build/Products/Release-iphonesimulator/App.app',
      build: 'cd platforms/capacitor && npm run build:ios -- --configuration Release --simulator',
    },

    // Android app configurations
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'platforms/capacitor/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd platforms/capacitor && npm run build:android -- assembleDebug',
      testBinaryPath:
        'platforms/capacitor/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'platforms/capacitor/android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd platforms/capacitor && npm run build:android -- assembleRelease',
    },
  },

  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
        os: 'iOS 17.2',
      },
    },
    'simulator-14': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
        os: 'iOS 17.2',
      },
    },
    'simulator-se': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (3rd generation)',
        os: 'iOS 17.2',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_34',
      },
    },
    'emulator-tablet': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_Tablet_API_34',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*', // Match any connected device
      },
    },
  },

  configurations: {
    // iOS configurations
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.14.debug': {
      device: 'simulator-14',
      app: 'ios.debug',
    },
    'ios.se.debug': {
      device: 'simulator-se',
      app: 'ios.debug',
    },

    // Android configurations
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.tablet.debug': {
      device: 'emulator-tablet',
      app: 'android.debug',
    },
    'android.attached': {
      device: 'attached',
      app: 'android.debug',
    },
  },

  behavior: {
    init: {
      exposeGlobals: true,
    },
    cleanup: {
      shutdownDevice: false,
    },
    launchApp: 'auto',
  },

  artifacts: {
    rootDir: './e2e/mobile/artifacts',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: false,
          testDone: true,
          testFailure: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
          size: '1080x1920',
        },
        simulator: {
          codec: 'hevc',
        },
      },
      instruments: {
        enabled: false,
      },
      timeline: {
        enabled: true,
      },
      uiHierarchy: {
        enabled: false,
      },
    },
  },

  // Session configuration
  session: {
    autoStart: true,
    debugSynchronization: 10000,
    server: 'ws://localhost:8099',
    sessionId: 'nself-chat-e2e',
  },

  // Logger configuration
  logger: {
    level: process.env.CI ? 'info' : 'debug',
    overrideConsole: true,
  },
}
