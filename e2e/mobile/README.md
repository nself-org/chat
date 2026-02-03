# Mobile E2E Testing Suite

Complete end-to-end testing infrastructure for nself-chat mobile applications (iOS and Android) using Detox, Appium, and cross-device testing.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [CI/CD Integration](#cicd-integration)
- [Performance Benchmarks](#performance-benchmarks)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This E2E testing suite provides comprehensive coverage of mobile app functionality including:

- **20+ Critical Flow Tests**: Authentication, messaging, channels, search, attachments, notifications, offline mode, deep linking
- **Cross-Platform**: iOS (simulators + real devices) and Android (emulators + real devices)
- **Network Testing**: Slow 3G simulation, offline mode, connection switching
- **Performance Benchmarks**: App launch time, screen transitions, message latency, memory usage, battery consumption
- **Real Device Testing**: BrowserStack and AWS Device Farm integration

## ✅ Test Coverage

### Test Suites (11 files)

1. **auth.spec.ts** (6 test groups, 25+ tests)
   - Login flow (validation, errors, biometric)
   - Signup flow
   - Logout flow
   - Session management
   - Error handling
   - Accessibility

2. **messaging.spec.ts** (8 test groups, 35+ tests)
   - Send messages (text, emoji, markdown, mentions)
   - Edit messages
   - Delete messages
   - Reply to messages (threads)
   - React to messages
   - Message list (pagination, scroll)
   - Performance

3. **channels.spec.ts** (8 test groups, 30+ tests)
   - Channel list
   - Create channel (public, private)
   - Join channel
   - Leave channel
   - Channel search
   - Channel details
   - Channel notifications
   - Performance

4. **search.spec.ts** (6 test groups, 25+ tests)
   - Basic search
   - Semantic search (AI-powered)
   - Search filters (channel, date, sender, attachments)
   - Search results
   - Advanced search (boolean operators, hashtags, mentions)
   - Performance

5. **attachments.spec.ts** (7 test groups, 25+ tests)
   - Photo attachments (gallery, camera, send, view)
   - Video attachments (gallery, record, send, play)
   - Document attachments
   - Multiple attachments
   - Attachment limits
   - Error handling
   - Performance (upload time, compression)

6. **notifications.spec.ts** (8 test groups, 30+ tests)
   - Notification permissions
   - Receive notifications
   - Tap notifications
   - Notification badges
   - Notification settings
   - In-app notifications
   - Deep linking
   - Error handling

7. **offline.spec.ts** (8 test groups, 25+ tests)
   - Go offline detection
   - Send messages offline (queueing)
   - Go online and sync
   - Offline data access (caching)
   - Intermittent connectivity
   - Slow network (3G)
   - Error messages
   - Persistence

8. **deep-linking.spec.ts** (13 test groups, 35+ tests)
   - Channel deep links
   - Message deep links
   - Direct message links
   - Thread links
   - Settings links
   - User profile links
   - Search links
   - Invite links
   - Universal links (HTTPS)
   - QR code links
   - Background/foreground handling
   - Authentication required
   - Error handling

9. **network.spec.ts** (11 test groups, 35+ tests)
   - Slow 3G network
   - WiFi to cellular switching
   - Connection loss and recovery
   - Rate limiting
   - Request timeout
   - WebSocket connection
   - Background network activity
   - Network efficiency
   - Error messages
   - Performance under stress

10. **performance.spec.ts** (11 test groups, 30+ benchmarks)
    - App launch time (cold start, warm start)
    - Screen transition time
    - Message send latency
    - Search query time
    - Scroll performance
    - Image loading performance
    - Memory usage
    - Battery consumption
    - Bundle size and load time
    - Database performance
    - Overall performance score

11. **setup.ts** (Test utilities)
    - MobileTestHelper class
    - PerformanceHelper class
    - NetworkHelper class
    - Test data and user credentials

**Total: 295+ individual test cases**

## 🚀 Setup

### Prerequisites

- Node.js 20+
- pnpm 9.15.4+
- Xcode 15.2+ (for iOS testing)
- Android Studio (for Android testing)
- JDK 17+ (for Android)

### iOS Setup

1. Install Xcode and command line tools:

```bash
xcode-select --install
```

2. Install simulators:

```bash
# List available simulators
xcrun simctl list devicetypes

# Create simulators
xcrun simctl create "iPhone 15 Pro" "com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro"
```

3. Install CocoaPods:

```bash
sudo gem install cocoapods
cd platforms/capacitor/ios/App
pod install
```

### Android Setup

1. Install Android Studio and Android SDK

2. Set environment variables:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

3. Create AVD (Android Virtual Device):

```bash
# List available devices
avdmanager list device

# Create emulator
avdmanager create avd -n Pixel_5_API_34 -k "system-images;android-34;google_apis;x86_64" -d pixel_5
```

### Install Dependencies

```bash
pnpm install
```

## 🧪 Running Tests

### Local Testing

#### iOS Tests

```bash
# Run all iOS tests on simulator
pnpm test:e2e:ios

# Run specific test file
pnpm exec detox test e2e/mobile/auth.spec.ts --configuration ios.sim.debug

# Run on specific device
pnpm exec detox test --configuration ios.14.debug

# Run with UI visible (no headless)
pnpm exec detox test --configuration ios.sim.debug --cleanup
```

#### Android Tests

```bash
# Run all Android tests on emulator
pnpm test:e2e:android

# Run specific test file
pnpm exec detox test e2e/mobile/messaging.spec.ts --configuration android.emu.debug

# Run on attached device
pnpm exec detox test --configuration android.attached
```

#### Appium Tests (Real Devices)

```bash
# Run on local devices
pnpm test:e2e:appium

# Run specific test
pnpm exec wdio appium.config.js --spec e2e/mobile/performance.spec.ts
```

### Performance Tests

```bash
pnpm test:performance
```

### BrowserStack Tests

```bash
# Set credentials
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_access_key

# Run tests
pnpm test:e2e:appium
```

### Watch Mode

```bash
# Run tests in watch mode (auto-rerun on changes)
pnpm exec detox test --watch
```

## 📁 Test Structure

```
e2e/mobile/
├── setup.ts                    # Global setup and test helpers
├── jest.config.js              # Jest configuration for Detox
├── auth.spec.ts                # Authentication tests
├── messaging.spec.ts           # Messaging tests
├── channels.spec.ts            # Channel management tests
├── search.spec.ts              # Search tests
├── attachments.spec.ts         # File attachment tests
├── notifications.spec.ts       # Push notification tests
├── offline.spec.ts             # Offline mode tests
├── deep-linking.spec.ts        # Deep linking tests
├── network.spec.ts             # Network condition tests
├── performance.spec.ts         # Performance benchmarks
├── artifacts/                  # Test artifacts (screenshots, videos, logs)
│   ├── screenshots/
│   ├── videos/
│   └── logs/
└── reports/                    # Test reports
    ├── index.html              # HTML report
    ├── junit.xml               # JUnit XML report
    └── performance.txt         # Performance metrics
```

## 🔧 Configuration Files

### .detoxrc.js

Detox configuration for iOS/Android simulators and emulators:

- **Apps**: Debug and release builds for iOS and Android
- **Devices**: iPhone 15 Pro, iPhone 14, iPhone SE, Pixel 5, Pixel Tablet
- **Artifacts**: Screenshots, videos, logs on test failure
- **Configurations**: 8 different device/platform combinations

### appium.config.js

Appium configuration for real device testing:

- **Capabilities**: Multiple iOS and Android device profiles
- **Services**: Appium server, BrowserStack, AWS Device Farm
- **Reporters**: Spec, JUnit, HTML
- **Framework**: Mocha with TypeScript support

## 🤖 CI/CD Integration

GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) runs tests on:

- **Pull Requests**: iOS simulator + Android emulator
- **Main Branch Push**: Full test suite
- **Daily Schedule**: BrowserStack real device tests
- **Manual Trigger**: Specific device selection

### Workflow Jobs

1. **e2e-web**: Playwright web tests
2. **e2e-ios**: Detox iOS tests (3 device matrix)
3. **e2e-android**: Detox Android tests (2 API level matrix)
4. **e2e-browserstack**: Real device tests (iOS + Android)
5. **e2e-performance**: Performance benchmarks
6. **e2e-summary**: Combined test report

### Artifacts

All test runs upload:

- Screenshots (on failure)
- Videos (on failure)
- Test reports (HTML + JUnit)
- Performance metrics
- Logs

## 📊 Performance Benchmarks

Target performance metrics:

| Metric             | Target   | Test                             |
| ------------------ | -------- | -------------------------------- |
| Cold Start         | < 3000ms | App launch from terminated state |
| Warm Start         | < 1500ms | App resume from background       |
| Splash Screen      | < 500ms  | Initial splash appearance        |
| Login              | < 5000ms | Full login flow                  |
| Channel Navigation | < 2000ms | Navigate to channel              |
| Channel Switch     | < 1500ms | Switch between channels          |
| Message Send       | < 2000ms | Send text message                |
| Optimistic Update  | < 500ms  | Message appears in UI            |
| Search Query       | < 3000ms | Perform search                   |
| Semantic Search    | < 5000ms | AI-powered search                |
| Image Upload       | < 8000ms | Upload photo                     |
| Scroll (60 FPS)    | Smooth   | No dropped frames                |

## 🐛 Troubleshooting

### iOS Issues

**Simulator won't boot:**

```bash
# Reset simulator
xcrun simctl erase all
xcrun simctl shutdown all
```

**App won't install:**

```bash
# Clean build
cd platforms/capacitor
rm -rf ios/App/build
pnpm build:ios -- --configuration Debug --simulator
```

**Detox can't connect:**

```bash
# Check Detox server
pnpm exec detox clean-framework-cache
pnpm exec detox build-framework-cache
```

### Android Issues

**Emulator won't start:**

```bash
# Cold boot emulator
emulator -avd Pixel_5_API_34 -no-snapshot-load
```

**ADB connection issues:**

```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

**Build failures:**

```bash
# Clean Gradle cache
cd platforms/capacitor/android
./gradlew clean
```

### Detox Issues

**Tests hanging:**

```bash
# Enable debug logs
pnpm exec detox test --loglevel trace

# Increase timeout
# In jest.config.js: testTimeout: 180000
```

**Flaky tests:**

```bash
# Run with retries
pnpm exec detox test --retries 2

# Run specific test in isolation
pnpm exec detox test -f "test name"
```

## 📚 Writing New Tests

### Test Template

```typescript
import { device, element, by, expect as detoxExpect } from 'detox'
import { MobileTestHelper, TEST_USERS } from './setup'

describe('Feature Name', () => {
  beforeAll(async () => {
    await MobileTestHelper.login(TEST_USERS.member)
  })

  it('should do something', async () => {
    // Navigate
    await MobileTestHelper.navigateToChannel('general')

    // Interact
    await MobileTestHelper.sendMessage('Hello')

    // Assert
    await MobileTestHelper.assertTextExists('Hello')
  })
})
```

### Best Practices

1. **Use Test Helpers**: Leverage `MobileTestHelper` for common actions
2. **Wait for Elements**: Always wait for elements before interaction
3. **Use Test IDs**: Add `testID` props to React components
4. **Clean Up**: Reset state in `beforeEach` or `afterEach`
5. **Take Screenshots**: On failures for debugging
6. **Performance Marks**: Use `PerformanceHelper` for metrics
7. **Isolated Tests**: Each test should run independently
8. **Descriptive Names**: Clear test descriptions

## 🔗 Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Appium Documentation](https://appium.io/docs/)
- [BrowserStack App Automate](https://www.browserstack.com/app-automate)
- [AWS Device Farm](https://aws.amazon.com/device-farm/)
- [WebDriverIO](https://webdriver.io/)

## 📝 Test Reports

After running tests, view reports:

- **HTML Report**: `e2e/mobile/reports/index.html`
- **JUnit Report**: `e2e/mobile/reports/junit.xml`
- **Performance Metrics**: `e2e/mobile/reports/performance.txt`

## 🎯 Coverage Goals

- ✅ **295+ test cases** covering critical user flows
- ✅ **Cross-platform** testing (iOS + Android)
- ✅ **Cross-device** testing (simulators + real devices)
- ✅ **Network conditions** (offline, 3G, WiFi)
- ✅ **Performance benchmarks** with target metrics
- ✅ **Automated CI/CD** integration
- ✅ **Screenshot/video** capture on failure
- ✅ **Comprehensive reporting**

---

**Version**: 0.8.0
**Last Updated**: 2026-01-31
**Maintained by**: nself-chat Team
