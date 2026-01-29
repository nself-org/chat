# nchat Electron Desktop App

This directory contains the Electron desktop application for nchat, providing native desktop capabilities for Windows, macOS, and Linux.

## Features

### Core Features
- **Native Window Management** - Customizable window with system tray integration
- **Global Keyboard Shortcuts** - Quick access even when app is not focused
- **Native Notifications** - System notifications with Do Not Disturb support
- **Auto-Updates** - Automatic update checking and installation
- **Deep Linking** - Support for `nchat://` protocol
- **Auto-Launch** - Start with system (optional)
- **Multi-Monitor Support** - Remembers window position across displays
- **Zoom Controls** - Adjustable zoom level (50% - 200%)
- **Spellcheck** - Native spellcheck with custom dictionaries

### Platform-Specific Features

#### macOS
- Transparent titlebar with traffic lights
- Touch Bar support (if available)
- System theme integration
- Dock badge for unread count
- Native menus
- Services integration

#### Windows
- Custom window controls
- Taskbar badge overlay
- System notifications
- Windows 10/11 integration
- Auto-start with Windows

#### Linux
- System tray icon
- Desktop notifications
- Multiple package formats (AppImage, deb, rpm)
- Desktop file integration

## Architecture

```
platforms/electron/
├── main/                    # Main process (Node.js)
│   ├── index.ts            # Main entry point
│   ├── window.ts           # Window management
│   ├── tray.ts             # System tray
│   ├── menu.ts             # Application menu
│   ├── ipc.ts              # IPC handlers
│   ├── notifications.ts    # Native notifications
│   ├── updates.ts          # Auto-updater
│   ├── autostart.ts        # Auto-launch
│   ├── deeplinks.ts        # Protocol handling
│   ├── shortcuts.ts        # Global shortcuts
│   └── store.ts            # Settings storage
├── preload/                # Preload scripts (secure bridge)
│   ├── index.ts            # Preload entry point
│   └── api.ts              # Exposed API definitions
├── resources/              # Build resources
│   ├── icon.icns           # macOS icon
│   ├── icon.ico            # Windows icon
│   ├── icons/              # Linux icons (various sizes)
│   └── entitlements.mac.plist  # macOS code signing
├── main.js                 # Main process loader
├── preload.js              # Preload loader
├── package.json            # Electron dependencies
├── electron-builder.json   # Build configuration
└── tsconfig.*.json         # TypeScript configs
```

## Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Platform-specific**:
  - macOS: Xcode Command Line Tools
  - Windows: Windows SDK, Visual Studio Build Tools
  - Linux: Build essentials, GTK+ development headers

## Development

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Build TypeScript

Compile the TypeScript code:

```bash
# From project root
cd platforms/electron
pnpm run build:all

# Or watch mode
pnpm run watch:main    # Watch main process
pnpm run watch:preload # Watch preload script
```

### 3. Run Development Mode

```bash
# From project root
pnpm electron:dev

# Or from platforms/electron
pnpm start:dev
```

This will:
1. Start Next.js dev server on port 3000
2. Launch Electron pointing to localhost:3000
3. Enable DevTools
4. Enable hot reload

### 4. Debug

**Main Process:**
- Use VS Code debugger with launch configuration
- Or add `debugger;` statements and run with `--inspect`

**Renderer Process:**
- DevTools are enabled in development
- Press `Cmd/Ctrl+Shift+I` to toggle DevTools

## Building

### Build for Current Platform

```bash
# From project root
pnpm build:electron

# Or specify platform
./scripts/build-electron-all.sh --platform macos
./scripts/build-electron-all.sh --platform windows
./scripts/build-electron-all.sh --platform linux
```

### Build for All Platforms

**From macOS** (recommended for cross-platform builds):

```bash
pnpm build:electron
# or
./scripts/build-electron-all.sh --platform all
```

**From other platforms:**
You can only build for the current platform unless you set up cross-compilation.

### Debug Build

```bash
./scripts/build-electron-all.sh --debug
```

This creates an unpacked directory instead of installers for faster testing.

## Build Configuration

Edit `electron-builder.json` to customize:

### macOS

```json
{
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg", "zip"],
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "resources/entitlements.mac.plist"
  }
}
```

**Code Signing** (for distribution):

1. Get a Developer ID certificate from Apple
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=certificate_password
   export APPLE_ID=your@apple.id
   export APPLE_APP_SPECIFIC_PASSWORD=app_password
   export APPLE_TEAM_ID=team_id
   ```

### Windows

```json
{
  "win": {
    "target": ["nsis", "portable"],
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
}
```

**Code Signing** (optional):

1. Get a code signing certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.pfx
   export CSC_KEY_PASSWORD=certificate_password
   ```

### Linux

```json
{
  "linux": {
    "target": ["AppImage", "deb", "rpm", "tar.gz"],
    "category": "Network;InstantMessaging;Chat"
  }
}
```

## Distribution

### Output Files

After building, find installers in `platforms/dist-electron/`:

**macOS:**
- `nchat-{version}-mac-universal.dmg` - Universal binary (Intel + Apple Silicon)
- `nchat-{version}-mac-universal.zip` - Zip archive

**Windows:**
- `nchat-{version}-win-x64.exe` - 64-bit installer
- `nchat-{version}-win-ia32.exe` - 32-bit installer
- `nchat-{version}-win-x64-portable.exe` - Portable version

**Linux:**
- `nchat-{version}-linux-x64.AppImage` - AppImage (universal)
- `nchat-{version}-linux-x64.deb` - Debian/Ubuntu package
- `nchat-{version}-linux-x64.rpm` - Red Hat/Fedora package
- `nchat-{version}-linux-x64.tar.gz` - Tarball

### Publishing

The app includes auto-update support. To enable:

1. Set up a release server or use GitHub Releases
2. Configure `publish` in `electron-builder.json`:
   ```json
   {
     "publish": {
       "provider": "github",
       "owner": "nself",
       "repo": "nself-chat"
     }
   }
   ```
3. Set `GH_TOKEN` environment variable for GitHub releases

## Global Shortcuts

Default shortcuts (configurable in settings):

- `Cmd/Ctrl+Shift+Space` - Toggle window visibility
- `Cmd/Ctrl+Shift+N` - Show window
- `Cmd/Ctrl+Shift+V` - Quick voice call toggle
- `Cmd/Ctrl+Shift+M` - Mute/unmute toggle

## Settings Storage

Settings are stored using `electron-store`:

- **macOS**: `~/Library/Application Support/nchat/nchat-settings.json`
- **Windows**: `%APPDATA%\nchat\nchat-settings.json`
- **Linux**: `~/.config/nchat/nchat-settings.json`

## Security

The Electron app follows security best practices:

- ✅ Context Isolation enabled
- ✅ Node Integration disabled in renderer
- ✅ Sandbox enabled
- ✅ Secure IPC with contextBridge
- ✅ No remote module
- ✅ Content Security Policy
- ✅ Navigation restrictions
- ✅ External link protection

## Troubleshooting

### Build fails on macOS

**Issue:** Code signing errors

**Solution:**
```bash
# Skip code signing for development
export CSC_IDENTITY_AUTO_DISCOVERY=false
pnpm build:electron
```

### Build fails on Windows

**Issue:** Missing Visual Studio Build Tools

**Solution:**
```powershell
# Install Visual Studio Build Tools
npm install --global windows-build-tools
```

### Build fails on Linux

**Issue:** Missing dependencies

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libgtk-3-dev libnotify-dev

# Fedora/RHEL
sudo dnf groupinstall "Development Tools"
sudo dnf install gtk3-devel libnotify-devel
```

### App won't start

**Issue:** Blank white screen

**Solution:**
1. Clear cache: Delete the config folder (see Settings Storage)
2. Run in development mode to see errors
3. Check DevTools console for JavaScript errors

### Auto-update not working

**Issue:** Update checks fail

**Solution:**
1. Ensure app is built with `--publish` flag
2. Check network connectivity
3. Verify `publish` configuration in `electron-builder.json`

## CI/CD

GitHub Actions workflow: `.github/workflows/build-electron.yml`

**Trigger manually:**
```bash
gh workflow run build-electron.yml -f platform=all
```

**Environment secrets needed:**
- `MAC_CERTS` - Base64-encoded macOS certificate
- `MAC_CERTS_PASSWORD` - Certificate password
- `APPLE_ID` - Apple ID for notarization
- `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Apple team ID
- `WIN_CERTS` - Base64-encoded Windows certificate
- `WIN_CERTS_PASSWORD` - Certificate password
- `GH_TOKEN` - GitHub token for releases

## API Reference

The preload script exposes a secure API via `window.electron`:

```typescript
// Window controls
await window.electron.window.show()
await window.electron.window.hide()
await window.electron.window.minimize()
await window.electron.window.maximize()

// Settings
await window.electron.store.set('key', value)
const value = await window.electron.store.get('key')

// Notifications
await window.electron.notifications.show({
  title: 'Hello',
  body: 'Message',
  silent: false
})

// Tray
await window.electron.tray.setUnreadCount(5)

// Theme
const theme = await window.electron.theme.getSystem() // 'light' | 'dark'

// Shell
await window.electron.shell.openExternal('https://nself.org')

// Dialog
const result = await window.electron.dialog.showOpen({
  properties: ['openFile']
})
```

See `platforms/electron/preload/api.ts` for full API documentation.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [electron-updater](https://www.electron.build/auto-update)

## License

MIT - See LICENSE file in project root
