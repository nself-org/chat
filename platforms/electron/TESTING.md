# nchat Desktop - Testing Checklist

Comprehensive testing checklist for nchat desktop application releases.

## Pre-Build Testing

### Code Quality

- [ ] TypeScript compiles without errors (`npm run build:all`)
- [ ] No console warnings or errors
- [ ] All imports resolve correctly
- [ ] ESLint passes
- [ ] Code formatted consistently

### Main Process

- [ ] App launches successfully
- [ ] Window creates and displays
- [ ] IPC handlers registered
- [ ] Settings load correctly
- [ ] Logging works

### Renderer Process

- [ ] Next.js app loads
- [ ] No JavaScript errors
- [ ] All routes work
- [ ] UI renders correctly

## Build Testing

### Build Process

- [ ] TypeScript compilation succeeds
- [ ] electron-builder runs without errors
- [ ] All target platforms build successfully
- [ ] File sizes reasonable (<150MB)
- [ ] No unexpected dependencies included

### Installer Testing

#### Windows

- [ ] NSIS installer runs
- [ ] Installation directory selection works
- [ ] Desktop shortcut created (if selected)
- [ ] Start menu shortcut created
- [ ] Protocol handler registered (nchat://)
- [ ] Uninstaller works correctly
- [ ] Portable version launches

#### macOS

- [ ] DMG mounts correctly
- [ ] Drag-to-Applications works
- [ ] App launches from Applications
- [ ] PKG installer works
- [ ] Code signature valid: `codesign --verify --deep --strict /Applications/nchat.app`
- [ ] Notarization successful: `spctl -a -vv /Applications/nchat.app`
- [ ] No Gatekeeper warnings

#### Linux

- [ ] AppImage is executable
- [ ] AppImage launches without FUSE
- [ ] .deb installs: `sudo dpkg -i nchat_*.deb`
- [ ] .rpm installs: `sudo rpm -i nchat-*.rpm`
- [ ] Desktop file created
- [ ] Application appears in launcher
- [ ] Uninstall works

## Functional Testing

### Core Functionality

- [ ] App launches in <2 seconds
- [ ] Main window opens correctly
- [ ] UI is responsive
- [ ] Navigation works
- [ ] Authentication works
- [ ] Chat functionality works
- [ ] File uploads work
- [ ] Images display correctly

### Window Management

- [ ] Minimize works
- [ ] Maximize/restore works
- [ ] Close button works
- [ ] Window remembers size/position
- [ ] Multi-monitor support works
- [ ] Full-screen mode works
- [ ] Zoom in/out works (Cmd/Ctrl +/-)

### System Tray

- [ ] Tray icon appears
- [ ] Tray menu opens
- [ ] Tray click toggles window
- [ ] Unread badge shows count
- [ ] Tray tooltip correct

### Notifications

- [ ] Notifications display
- [ ] Notification click opens app
- [ ] Notification sound works (if enabled)
- [ ] Do Not Disturb works
- [ ] Notification preview shows/hides based on settings

### Keyboard Shortcuts

- [ ] Cmd/Ctrl+Q quits app
- [ ] Cmd/Ctrl+W closes window
- [ ] Cmd/Ctrl+M minimizes
- [ ] Cmd/Ctrl+, opens settings
- [ ] Cmd/Ctrl+K opens quick switcher
- [ ] Cmd/Ctrl+F opens find
- [ ] Cmd/Ctrl+N new message
- [ ] Cmd/Ctrl+Shift+N new channel
- [ ] Global shortcuts work (Cmd/Ctrl+Shift+Space)

### Menu Bar

- [ ] File menu works
- [ ] Edit menu works (copy/paste/undo)
- [ ] View menu works (zoom, reload)
- [ ] Go menu works (navigation)
- [ ] Window menu works
- [ ] Help menu works (opens links)

### Deep Linking

- [ ] nchat:// protocol registered
- [ ] nchat://channel/123 opens channel
- [ ] nchat://dm/456 opens DM
- [ ] nchat://thread/789 opens thread
- [ ] nchat://settings opens settings
- [ ] Links from browser open app

### Auto-Launch

- [ ] Auto-launch setting saves
- [ ] App starts with system (if enabled)
- [ ] Hidden launch works (--hidden flag)
- [ ] Disable auto-launch works

### Settings Persistence

- [ ] Settings save correctly
- [ ] Settings persist after restart
- [ ] Theme changes apply
- [ ] Notification settings work
- [ ] Auto-update settings work
- [ ] Reset settings works

### Auto-Update

- [ ] Update check works
- [ ] Update download works
- [ ] Update notification shows
- [ ] "Check for Updates" menu item works
- [ ] Update install on restart works
- [ ] Update channel switching works
- [ ] Skip version works

### Performance

- [ ] Launch time <2 seconds (cold start)
- [ ] Memory usage <100MB idle
- [ ] Memory usage <200MB active
- [ ] CPU usage <5% idle
- [ ] CPU usage <20% active
- [ ] No memory leaks (use after 1 hour)
- [ ] No zombie processes after quit

### Security

- [ ] Context isolation enabled
- [ ] Node integration disabled
- [ ] Sandbox enabled
- [ ] External links open in browser
- [ ] No XSS vulnerabilities
- [ ] CSP headers present

## Platform-Specific Testing

### Windows

- [ ] Runs on Windows 10
- [ ] Runs on Windows 11
- [ ] Taskbar badge shows unread count
- [ ] Windows notifications work
- [ ] SmartScreen warning (expected for unsigned)
- [ ] Installer signed (if certificate available)
- [ ] Auto-update works

### macOS

- [ ] Runs on macOS 10.15 (Catalina)
- [ ] Runs on macOS 11 (Big Sur)
- [ ] Runs on macOS 12 (Monterey)
- [ ] Runs on macOS 13 (Ventura)
- [ ] Runs on macOS 14 (Sonoma)
- [ ] Intel (x64) version works
- [ ] Apple Silicon (arm64) version works
- [ ] Rosetta 2 compatibility (if needed)
- [ ] Dock badge shows unread count
- [ ] Native notifications work
- [ ] No notarization warnings
- [ ] Touch Bar support (if available)

### Linux

- [ ] Runs on Ubuntu 20.04
- [ ] Runs on Ubuntu 22.04
- [ ] Runs on Ubuntu 24.04
- [ ] Runs on Fedora 39
- [ ] Runs on Debian 12
- [ ] Desktop file works
- [ ] System tray works
- [ ] Notifications work
- [ ] Protocol handler works

## Regression Testing

### Known Issues

- [ ] No regressions from previous version
- [ ] All fixed bugs still fixed
- [ ] No new crashes
- [ ] No new memory leaks
- [ ] No new security issues

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] High contrast mode works
- [ ] Font scaling works
- [ ] Color blind friendly

## Stress Testing

### Load Testing

- [ ] 1000+ messages load correctly
- [ ] 100+ channels load correctly
- [ ] Large file uploads work
- [ ] Multiple workspaces work
- [ ] Long running sessions stable (24+ hours)

### Edge Cases

- [ ] No internet connection (graceful handling)
- [ ] Backend server down (error message)
- [ ] Invalid auth tokens (logout/re-auth)
- [ ] Corrupted settings file (reset to defaults)
- [ ] Missing resources (graceful fallback)

## User Acceptance Testing

### First Run Experience

- [ ] Welcome screen shows (if applicable)
- [ ] Login/signup works
- [ ] Onboarding clear
- [ ] Settings accessible
- [ ] Help available

### Common Workflows

- [ ] Send message
- [ ] Upload file
- [ ] Start video call
- [ ] Create channel
- [ ] Invite user
- [ ] Search messages
- [ ] React to message
- [ ] Edit message
- [ ] Delete message

## Documentation

- [ ] README.md accurate
- [ ] QUICK_START.md works
- [ ] Deployment guide complete
- [ ] Code comments up to date
- [ ] API documentation accurate
- [ ] Changelog updated

## Release Checklist

### Pre-Release

- [ ] Version bumped in package.json
- [ ] Changelog updated
- [ ] Release notes written
- [ ] All tests pass
- [ ] Code signed
- [ ] Notarized (macOS)
- [ ] Installers tested on clean systems

### Release

- [ ] Git tag created
- [ ] GitHub Release created
- [ ] Installers uploaded
- [ ] Release notes published
- [ ] Download links work
- [ ] Auto-update metadata generated

### Post-Release

- [ ] Monitor error reports
- [ ] Check download counts
- [ ] Respond to issues
- [ ] Plan next release
- [ ] Document any issues found

## Smoke Test Script

Quick 5-minute test for critical functionality:

```bash
#!/bin/bash
echo "Running smoke tests..."

# 1. Launch app
echo "✓ Launching app..."

# 2. Wait for window
sleep 2
echo "✓ Window opened"

# 3. Check memory usage
ps aux | grep nchat
echo "✓ Memory usage checked"

# 4. Test notifications
# (manual step)
echo "⚠ Manually test notification"

# 5. Test tray icon
# (manual step)
echo "⚠ Manually test tray icon"

# 6. Test deep link
open nchat://test
echo "✓ Deep link tested"

# 7. Quit app
echo "✓ App quit cleanly"

echo "Smoke tests complete!"
```

## Automated Testing

### Unit Tests

```bash
# Run unit tests
npm test

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Specific platform
npm run test:e2e:mac
npm run test:e2e:win
npm run test:e2e:linux
```

## Test Environments

### Development

- macOS 14 (Sonoma) - Primary development
- Windows 11 - Windows testing
- Ubuntu 24.04 - Linux testing

### CI/CD

- GitHub Actions runners (Ubuntu, macOS, Windows)
- Automated builds and tests
- Artifact retention for 7 days

### Staging

- Internal beta testers
- Feature flags for new functionality
- Crash reporting enabled

### Production

- Public releases
- Crash reporting enabled
- Analytics enabled
- Auto-update enabled

## Tools

- **Spectron**: E2E testing framework
- **Playwright**: Modern E2E testing
- **Jest**: Unit testing
- **Sentry**: Error tracking
- **Activity Monitor/Task Manager**: Performance monitoring
- **DevTools**: Debugging

## Reporting Issues

When reporting issues, include:

1. Platform and version (macOS 14.2, Windows 11, Ubuntu 24.04)
2. App version (v0.8.0)
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Screenshots/video
7. Console logs
8. System logs

**Log locations:**

- **macOS**: `~/Library/Logs/nchat/main.log`
- **Windows**: `%USERPROFILE%\AppData\Roaming\nchat\logs\main.log`
- **Linux**: `~/.config/nchat/logs/main.log`

---

**Last Updated**: January 31, 2026
**Version**: 0.8.0
