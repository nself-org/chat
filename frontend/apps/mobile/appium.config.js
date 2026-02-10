/**
 * Appium Configuration
 *
 * Cross-device testing configuration for real devices and cloud services
 * Supports BrowserStack, AWS Device Farm, and local device testing
 */

const path = require('path')

const config = {
  // Appium server configuration
  runner: 'local',
  port: 4723,
  path: '/',

  // Test specifications
  specs: ['./e2e/mobile/**/*.spec.ts'],

  // Patterns to exclude
  exclude: ['./e2e/mobile/**/*.setup.ts'],

  // Maximum instances running at the same time
  maxInstances: 1,

  // Capabilities
  capabilities: [
    // iOS devices
    {
      // iPhone 15 Pro Max
      platformName: 'iOS',
      'appium:platformVersion': '17.2',
      'appium:deviceName': 'iPhone 15 Pro Max',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/ios/App/build/Build/Products/Debug-iphonesimulator/App.app'
      ),
      'appium:automationName': 'XCUITest',
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 120000,
      'appium:useNewWDA': true,
      'appium:includeSafariInWebviews': true,
      'appium:webviewConnectTimeout': 30000,
    },
    {
      // iPhone 14
      platformName: 'iOS',
      'appium:platformVersion': '17.2',
      'appium:deviceName': 'iPhone 14',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/ios/App/build/Build/Products/Debug-iphonesimulator/App.app'
      ),
      'appium:automationName': 'XCUITest',
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 120000,
      'appium:useNewWDA': true,
    },
    {
      // iPhone SE (small screen)
      platformName: 'iOS',
      'appium:platformVersion': '17.2',
      'appium:deviceName': 'iPhone SE (3rd generation)',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/ios/App/build/Build/Products/Debug-iphonesimulator/App.app'
      ),
      'appium:automationName': 'XCUITest',
      'appium:newCommandTimeout': 240,
    },

    // Android devices
    {
      // Pixel 8 Pro
      platformName: 'Android',
      'appium:platformVersion': '14',
      'appium:deviceName': 'Pixel 8 Pro',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/android/app/build/outputs/apk/debug/app-debug.apk'
      ),
      'appium:automationName': 'UiAutomator2',
      'appium:newCommandTimeout': 240,
      'appium:uiautomator2ServerInstallTimeout': 120000,
      'appium:adbExecTimeout': 120000,
      'appium:androidInstallTimeout': 120000,
    },
    {
      // Samsung Galaxy S23
      platformName: 'Android',
      'appium:platformVersion': '13',
      'appium:deviceName': 'Samsung Galaxy S23',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/android/app/build/outputs/apk/debug/app-debug.apk'
      ),
      'appium:automationName': 'UiAutomator2',
      'appium:newCommandTimeout': 240,
    },
    {
      // Pixel Tablet
      platformName: 'Android',
      'appium:platformVersion': '14',
      'appium:deviceName': 'Pixel Tablet',
      'appium:app': path.join(
        __dirname,
        'platforms/capacitor/android/app/build/outputs/apk/debug/app-debug.apk'
      ),
      'appium:automationName': 'UiAutomator2',
      'appium:newCommandTimeout': 240,
    },
  ],

  // Test runner settings
  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // Framework
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    require: ['ts-node/register'],
  },

  // Reporters
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: './e2e/mobile/reports',
        outputFileFormat: (options) => `appium-${options.cid}.xml`,
      },
    ],
    [
      'html-nice',
      {
        outputDir: './e2e/mobile/reports/html',
        filename: 'appium-report.html',
        reportTitle: 'nChat Mobile E2E Test Report',
        showInBrowser: false,
        collapseTests: false,
        useOnAfterCommandForScreenshot: true,
      },
    ],
  ],

  // Hooks
  before: function (capabilities, specs) {
    // Set implicit wait
    driver.setImplicitTimeout(10000)
  },

  afterTest: async function (test, context, { error, result, duration, passed, retries }) {
    // Take screenshot on failure
    if (!passed) {
      await driver.takeScreenshot()
    }
  },

  // Services
  services: [
    [
      'appium',
      {
        logPath: './e2e/mobile/logs',
        args: {
          relaxedSecurity: true,
          sessionOverride: true,
        },
      },
    ],
  ],
}

// BrowserStack configuration
if (process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY) {
  config.user = process.env.BROWSERSTACK_USERNAME
  config.key = process.env.BROWSERSTACK_ACCESS_KEY
  config.hostname = 'hub-cloud.browserstack.com'

  config.capabilities = [
    {
      // BrowserStack iPhone 15 Pro Max
      'bstack:options': {
        deviceName: 'iPhone 15 Pro Max',
        osVersion: '17',
        buildName: 'nChat iOS Build',
        projectName: 'nChat Mobile',
        debug: true,
        networkLogs: true,
        video: true,
        appiumVersion: '2.0.0',
      },
      platformName: 'iOS',
      'appium:app': process.env.BROWSERSTACK_IOS_APP_URL,
    },
    {
      // BrowserStack Samsung Galaxy S23
      'bstack:options': {
        deviceName: 'Samsung Galaxy S23',
        osVersion: '13.0',
        buildName: 'nChat Android Build',
        projectName: 'nChat Mobile',
        debug: true,
        networkLogs: true,
        video: true,
        appiumVersion: '2.0.0',
      },
      platformName: 'Android',
      'appium:app': process.env.BROWSERSTACK_ANDROID_APP_URL,
    },
  ]

  config.services = [
    [
      'browserstack',
      {
        browserstackLocal: true,
        opts: {
          forceLocal: true,
        },
      },
    ],
  ]
}

// AWS Device Farm configuration
if (process.env.AWS_DEVICE_FARM_ARN) {
  config.capabilities = config.capabilities.map((cap) => ({
    ...cap,
    'awsdevicefarm:projectArn': process.env.AWS_DEVICE_FARM_PROJECT_ARN,
    'awsdevicefarm:devicePoolArn': process.env.AWS_DEVICE_FARM_DEVICE_POOL_ARN,
    'awsdevicefarm:testType': 'APPIUM_NODE',
  }))
}

module.exports = { config }
