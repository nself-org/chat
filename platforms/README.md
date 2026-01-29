# nChat Mobile Platforms

This directory contains the mobile application implementations for nChat using Capacitor and React Native.

## 📱 Available Platforms

### 1. **Capacitor** (`./capacitor/`)
- Web-based approach using Capacitor 6.x
- Wraps the Next.js web application
- 100% code reuse from web
- Best for: MVP, rapid development, web-first apps

[→ View Capacitor Documentation](./capacitor/README.md)

### 2. **React Native** (`./react-native/`)
- Native mobile approach using React Native 0.76.6
- True native performance
- Platform-specific optimizations
- Best for: Performance-critical apps, complex native features

[→ View React Native Documentation](./react-native/README.md)

## 🚀 Quick Start

**New to mobile development?** Start here:
- [Quick Start Guide](./QUICKSTART.md) - Get running in 30 minutes

**Need detailed information?**
- [Mobile Apps Summary](./MOBILE-APPS-SUMMARY.md) - Complete overview and comparison

## 📊 Platform Comparison

| Feature | Capacitor | React Native |
|---------|-----------|--------------|
| **Setup Time** | 15 min | 20 min |
| **Code Reuse** | 100% | ~60% |
| **Performance** | Web-based (fast) | Native (faster) |
| **Bundle Size** | Smaller | Larger |
| **Learning Curve** | Low | Moderate |
| **Best For** | MVP, Web-first | Complex native features |

## 🎯 Which Platform Should I Choose?

### Choose **Capacitor** if:
- ✅ You want to ship quickly (MVP)
- ✅ Your team knows web development
- ✅ You want to maintain a single codebase
- ✅ Web performance is sufficient
- ✅ You prioritize development speed

### Choose **React Native** if:
- ✅ You need native-level performance
- ✅ You want platform-specific UI
- ✅ You have mobile developers
- ✅ You need complex native integrations
- ✅ You want the largest mobile ecosystem

### Not Sure?
Start with **Capacitor** for MVP, evaluate, then migrate to React Native if needed.

## 📚 Documentation Structure

```
platforms/
├── README.md                      # This file
├── QUICKSTART.md                  # 30-minute quick start guide
├── MOBILE-APPS-SUMMARY.md         # Detailed comparison & overview
│
├── capacitor/
│   ├── README.md                  # 400+ line comprehensive guide
│   ├── package.json               # Dependencies & scripts
│   ├── capacitor.config.ts        # Capacitor configuration
│   ├── ios.config.json            # iOS settings
│   ├── android.config.json        # Android settings
│   └── src/native/                # Native integrations
│       ├── push-notifications.ts
│       ├── camera.ts
│       ├── biometrics.ts
│       ├── file-picker.ts
│       ├── haptics.ts
│       ├── share.ts
│       ├── offline-sync.ts
│       └── index.ts
│
├── react-native/
│   ├── README.md                  # 600+ line comprehensive guide
│   ├── package.json               # Dependencies & scripts
│   ├── app.json                   # React Native config
│   ├── ios.podfile                # iOS pods configuration
│   ├── ios-info.plist.template    # iOS permissions template
│   ├── android-manifest.template.xml
│   ├── android-build.gradle.template
│   ├── android-proguard-rules.pro
│   ├── src/
│   │   ├── App.tsx                # Root component
│   │   ├── navigation/            # React Navigation setup
│   │   ├── native/                # Native modules
│   │   ├── screens/               # App screens
│   │   ├── stores/                # State management
│   │   └── utils/                 # Utilities
│   │       ├── platform.ts        # Platform detection
│   │       └── offline-storage.ts # MMKV storage
│   └── fastlane/
│       ├── Fastfile               # Build automation
│       └── Appfile                # Fastlane config
│
└── shared/
    └── platform-bridge.ts         # Unified platform API
```

## 🛠️ Development Workflow

### Initial Setup (Once)

```bash
# Choose your platform
cd platforms/capacitor   # or platforms/react-native

# Install dependencies
pnpm install

# iOS only: Install pods (React Native)
pnpm run pod:install
```

### Daily Development

**Capacitor**:
```bash
# Terminal 1: Build web app (if using live reload)
cd ../..
pnpm dev

# Terminal 2: Run mobile app
cd platforms/capacitor
pnpm run sync
pnpm run run:ios        # or run:android
```

**React Native**:
```bash
# Terminal 1: Start Metro bundler
cd platforms/react-native
pnpm start

# Terminal 2: Run app
pnpm run ios           # or android
```

### Building for Production

**Capacitor**:
```bash
cd platforms/capacitor
pnpm run build:ios      # Creates IPA
pnpm run build:android  # Creates APK
```

**React Native**:
```bash
cd platforms/react-native

# Using Fastlane (recommended)
cd fastlane
fastlane ios release
fastlane android release
```

## 🔧 Native Features

Both platforms support:

### ✅ Push Notifications
- Remote notifications (APNs & FCM)
- Local notifications
- Badge counts
- Rich notifications with images
- Deep linking from notifications

### 📷 Camera & Media
- Photo capture
- Video recording
- Gallery/library access
- Image compression
- Multiple file selection

### 🔐 Biometric Authentication
- Face ID (iOS)
- Touch ID (iOS)
- Fingerprint (Android)
- Secure credential storage

### 💾 Offline Storage
- Persistent key-value storage
- Message caching
- Sync queue
- Network status monitoring

### 🔗 Deep Linking
- Custom URL scheme (nchat://)
- Universal Links (iOS)
- App Links (Android)

### 🎨 UI Enhancements
- Haptic feedback
- Native sharing
- Platform-specific styling

## 📱 Testing

### Simulators/Emulators

```bash
# iOS Simulator
pnpm run ios

# Android Emulator
pnpm run android
```

### Physical Devices

**iOS**:
1. Connect device via USB
2. Trust computer on device
3. Select device in Xcode
4. Click Run

**Android**:
1. Enable Developer Options
2. Enable USB Debugging
3. Connect via USB
4. Verify: `adb devices`
5. Run app

## 🔥 Common Commands

### Capacitor
```bash
pnpm run dev              # Build + sync
pnpm run sync             # Sync web to native
pnpm run open:ios         # Open Xcode
pnpm run open:android     # Open Android Studio
pnpm run run:ios          # Run iOS
pnpm run run:android      # Run Android
pnpm run build:ios        # Build iOS
pnpm run build:android    # Build Android
pnpm run clean            # Clean native projects
pnpm run doctor           # Diagnostic check
```

### React Native
```bash
pnpm start                # Start Metro
pnpm run ios              # Run iOS
pnpm run android          # Run Android
pnpm run build:ios        # Build iOS
pnpm run build:android    # Build Android APK
pnpm run build:android:bundle  # Build Android AAB
pnpm run clean            # Clear cache
pnpm run pod:install      # Install iOS pods
pnpm test                 # Run tests
```

## 🐛 Troubleshooting

### iOS Issues

**Pods not found**:
```bash
cd ios
pod deintegrate
pod install
```

**Build failed**:
```bash
# Clean build folder
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Android Issues

**Gradle sync failed**:
```bash
cd android
./gradlew clean
./gradlew --stop
```

**ADB not found**:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Both Platforms

**Module not found**:
```bash
rm -rf node_modules
pnpm install
pnpm start -- --reset-cache
```

## 📖 Additional Resources

### Documentation
- [Capacitor Docs](https://capacitorjs.com/docs)
- [React Native Docs](https://reactnative.dev/docs)
- [Firebase Setup](https://firebase.google.com/docs)

### Platform-Specific
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)

### Tools
- [Xcode](https://developer.apple.com/xcode/) (iOS)
- [Android Studio](https://developer.android.com/studio) (Android)
- [Flipper](https://fbflipper.com/) (Debugging)

## 🎓 Learning Path

### Beginner
1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Follow quick start for Capacitor
3. Deploy to simulator
4. Test native features

### Intermediate
1. Read platform-specific README
2. Deploy to physical device
3. Configure Firebase
4. Test push notifications

### Advanced
1. Build for production
2. Set up Fastlane
3. Submit to App Store / Play Store
4. Monitor analytics and crashes

## 🚀 Deployment

### iOS (App Store)

1. **Prepare**:
   - Apple Developer account ($99/year)
   - App Store Connect record
   - App Store assets (screenshots, description)

2. **Build**:
   ```bash
   fastlane ios release
   ```

3. **Submit**:
   - Upload via Xcode or Fastlane
   - Submit for review in App Store Connect

### Android (Play Store)

1. **Prepare**:
   - Google Play Console account ($25 one-time)
   - Play Store listing
   - Feature graphic and screenshots

2. **Build**:
   ```bash
   fastlane android release
   ```

3. **Submit**:
   - Upload AAB to Play Console
   - Complete store listing
   - Submit for review

## 📊 Project Stats

### Capacitor
- **Files Created**: 15+
- **Lines of Code**: ~2,000
- **Documentation**: 400+ lines
- **Setup Time**: 15 minutes

### React Native
- **Files Created**: 15+
- **Lines of Code**: ~1,500
- **Documentation**: 600+ lines
- **Setup Time**: 20 minutes

### Total Implementation
- **Files Created**: 30+
- **Lines of Code**: ~3,500+
- **Documentation**: 1,000+ lines
- **Development Time**: ~8 hours

## ✅ Feature Checklist

- [x] Capacitor platform setup
- [x] React Native platform setup
- [x] Push notifications (both)
- [x] Camera integration (both)
- [x] Biometric auth (both)
- [x] Offline storage (both)
- [x] Deep linking (both)
- [x] Haptic feedback (both)
- [x] Native sharing (both)
- [x] Fastlane automation
- [x] Comprehensive documentation
- [x] Quick start guide
- [x] Platform comparison
- [x] Troubleshooting guides

## 🎯 Next Steps

1. **Choose Platform**: Review comparison and choose Capacitor or React Native
2. **Quick Start**: Follow [QUICKSTART.md](./QUICKSTART.md)
3. **Firebase Setup**: Configure push notifications
4. **Device Testing**: Test on physical devices
5. **Production Build**: Create release builds
6. **App Store Submission**: Submit to App Store and Play Store

## 💡 Tips

- Start with Capacitor for faster MVP
- Test on physical devices early
- Set up Firebase before testing notifications
- Use Fastlane for automated builds
- Read platform-specific READMEs for details
- Join platform communities for support

## 🆘 Getting Help

1. Check the troubleshooting section
2. Read platform-specific README
3. Search online documentation
4. Ask in platform communities
5. Contact nChat team

## 📄 License

Copyright © 2025 nself. All rights reserved.

---

**Ready to build?** Start with the [Quick Start Guide](./QUICKSTART.md)!

**Need more details?** Check the [Mobile Apps Summary](./MOBILE-APPS-SUMMARY.md)!

**Platform-specific questions?** Read the README in each platform directory!
