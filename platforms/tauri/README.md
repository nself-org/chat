# nchat Tauri Desktop App

This directory contains the Tauri desktop application for nchat, providing native desktop capabilities with a Rust backend and small binary size.

## Why Tauri?

Tauri offers several advantages over Electron:

- **Smaller Bundle Size** - 10-20 MB vs 100+ MB (Electron)
- **Lower Memory Usage** - Uses system webview instead of bundling Chromium
- **Rust Backend** - Fast, safe, and secure
- **Native Performance** - Better CPU and memory efficiency
- **Security First** - Built with security in mind from the ground up

## Features

### Core Features
- **Native Window Management** - System-native windows with customizable decorations
- **Global Keyboard Shortcuts** - Quick access shortcuts
- **Native Notifications** - System notifications
- **Auto-Updates** - Secure automatic updates with signature verification
- **Deep Linking** - Support for `nchat://` protocol
- **Auto-Launch** - Start with system (optional)
- **System Tray** - Minimize to tray with context menu
- **Native Menus** - Platform-native menu bars

### Platform-Specific Features

#### macOS
- Transparent titlebar
- System theme integration
- Dock badge for unread count
- Native macOS menus
- Touch Bar support

#### Windows
- Native Windows styling
- Taskbar integration
- Windows 10/11 notifications
- System tray with proper icons

#### Linux
- GTK integration
- Desktop notifications
- Multiple package formats (AppImage, deb, rpm)
- FreeDesktop.org compatibility

## Architecture

```
platforms/tauri/
├── src/                    # Rust backend
│   ├── main.rs            # Entry point
│   ├── lib.rs             # Application logic
│   ├── commands.rs        # Tauri commands (IPC)
│   ├── menu.rs            # Application menu
│   ├── tray.rs            # System tray
│   ├── notifications.rs   # Native notifications
│   ├── autostart.rs       # Auto-launch
│   ├── deeplink.rs        # Protocol handling
│   ├── shortcuts.rs       # Global shortcuts
│   └── updater.rs         # Auto-updater
├── icons/                 # App icons (various sizes)
├── Cargo.toml            # Rust dependencies
├── tauri.conf.json       # Tauri configuration
└── build.rs              # Build script
```

## Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Rust**: >= 1.70 (install from https://rustup.rs)
- **Platform-specific**:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft C++ Build Tools, WebView2
  - Linux: System dependencies (see below)

### Linux Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Fedora/RHEL:**
```bash
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

**Arch Linux:**
```bash
sudo pacman -Syu
sudo pacman -S --needed \
  webkit2gtk \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  gtk3 \
  libappindicator-gtk3 \
  librsvg
```

## Development

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Add Rust Targets (macOS only, for universal builds)

```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### 3. Run Development Mode

```bash
# From project root
pnpm tauri:dev

# Or from platforms/tauri
cargo tauri dev
```

This will:
1. Start Next.js dev server on port 3000
2. Launch Tauri app pointing to localhost:3000
3. Enable hot reload for both frontend and Rust backend

### 4. Debug

**Rust Backend:**
```bash
# Enable debug logging
RUST_LOG=debug pnpm tauri:dev

# Or use rust-lldb/gdb
rust-lldb ./target/debug/nchat
```

**Frontend:**
- Open DevTools with `F12` or right-click → Inspect
- Or programmatically: `window.__TAURI__.window.getCurrent().toggleDevtools()`

## Building

### Build for Current Platform

```bash
# From project root
pnpm build:tauri

# Or specify platform
./scripts/build-tauri-all.sh --platform macos
./scripts/build-tauri-all.sh --platform windows
./scripts/build-tauri-all.sh --platform linux
```

### Build Universal Binary (macOS)

```bash
pnpm tauri build --target universal-apple-darwin
```

This creates a single binary that runs natively on both Intel and Apple Silicon.

### Debug Build

```bash
./scripts/build-tauri-all.sh --debug
```

## Build Configuration

Edit `tauri.conf.json` to customize:

### App Settings

```json
{
  "productName": "nchat",
  "version": "1.0.0",
  "identifier": "org.nself.nchat"
}
```

### Window Configuration

```json
{
  "windows": [
    {
      "title": "nchat",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "resizable": true,
      "fullscreen": false
    }
  ]
}
```

### Bundle Configuration

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/icon.icns", "icons/icon.ico"],
    "identifier": "org.nself.nchat",
    "category": "Productivity"
  }
}
```

## Code Signing

### macOS

**For Development:**
```bash
# Ad-hoc signing (works locally)
pnpm tauri build
```

**For Distribution:**

1. Get a Developer ID certificate from Apple
2. Set in `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAMID)"
       }
     }
   }
   ```
3. Or set environment variables:
   ```bash
   export APPLE_CERTIFICATE=base64_certificate
   export APPLE_CERTIFICATE_PASSWORD=cert_password
   export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name"
   export APPLE_ID=your@apple.id
   export APPLE_PASSWORD=app_specific_password
   export APPLE_TEAM_ID=TEAMID
   ```

### Windows

**For Development:**
```bash
# No signing needed
pnpm tauri build
```

**For Distribution:**

1. Get a code signing certificate
2. Set environment variables:
   ```bash
   export TAURI_SIGNING_PRIVATE_KEY=path/to/cert.pfx
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=password
   ```

### Linux

No signing required. However, you can sign packages:

**For .deb:**
```bash
dpkg-sig --sign builder package.deb
```

**For .rpm:**
```bash
rpm --addsign package.rpm
```

## Distribution

### Output Files

After building, find installers in `platforms/tauri/target/release/bundle/`:

**macOS:**
- `dmg/nchat-{version}.dmg` - Disk image
- `macos/nchat.app` - Application bundle

**Windows:**
- `msi/nchat-{version}.msi` - MSI installer
- `nsis/nchat-{version}-setup.exe` - NSIS installer

**Linux:**
- `deb/nchat-{version}.deb` - Debian package
- `rpm/nchat-{version}.rpm` - Red Hat package
- `appimage/nchat-{version}.AppImage` - AppImage (universal)

### Auto-Updates

Tauri supports secure auto-updates with signature verification.

**1. Generate Update Keys:**
```bash
# Only needed once
pnpm tauri signer generate -w ~/.tauri/nchat.key
```

This generates:
- Private key: `~/.tauri/nchat.key` (keep secure!)
- Public key: Shown in console (add to `tauri.conf.json`)

**2. Configure Updates:**

In `tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://releases.nself.org/nchat/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

**3. Build with Signature:**
```bash
# Private key is automatically used from ~/.tauri/nchat.key
pnpm tauri build
```

**4. Publish Updates:**

Upload the generated files to your update server:
- The installer/bundle
- The `.sig` signature file
- A JSON manifest with version info

## Global Shortcuts

Default shortcuts (registered globally):

- `Cmd/Ctrl+Shift+Space` - Toggle window visibility
- `Cmd/Ctrl+Shift+N` - Show window
- `Cmd/Ctrl+Shift+V` - Quick voice call toggle
- `Cmd/Ctrl+Shift+M` - Mute/unmute toggle

Configure in frontend or register custom shortcuts via commands.

## Tauri Commands (API)

The Rust backend exposes commands that can be called from JavaScript:

```typescript
import { invoke } from '@tauri-apps/api/tauri'

// Window management
await invoke('show_window')
await invoke('hide_window')
await invoke('minimize_window')
await invoke('maximize_window')

// Notifications
await invoke('show_notification', {
  title: 'Hello',
  body: 'Message',
  icon: '/path/to/icon.png'
})

// Badge
await invoke('set_badge_count', { count: 5 })
await invoke('clear_badge')

// Tray
await invoke('update_tray_icon', { iconType: 'unread' })
await invoke('update_tray_tooltip', { tooltip: '5 unread messages' })

// Auto-start
await invoke('enable_autostart')
await invoke('disable_autostart')
const enabled = await invoke('is_autostart_enabled')

// Updates
await invoke('check_for_updates')
await invoke('install_update')

// Shortcuts
await invoke('register_shortcut', {
  shortcut: 'Ctrl+Shift+X',
  action: 'my_action'
})
```

See `platforms/tauri/src/commands.rs` for all available commands.

## Security

Tauri's security model:

- ✅ Process Isolation (webview runs in separate process)
- ✅ Limited IPC (only registered commands are accessible)
- ✅ Content Security Policy enforced
- ✅ No Node.js in frontend
- ✅ Capability-based permissions
- ✅ HTTPS required for external resources
- ✅ Signature verification for updates

## Troubleshooting

### Build fails: "webkit2gtk not found"

**Linux only**

**Solution:**
```bash
# See Linux Dependencies section above
sudo apt install libwebkit2gtk-4.1-dev
```

### Build fails: "linker not found"

**Solution:**
```bash
# Install build tools
# macOS
xcode-select --install

# Windows
# Install Visual Studio Build Tools

# Linux
sudo apt install build-essential
```

### App crashes on Linux

**Issue:** Missing libraries

**Solution:**
```bash
# Check missing libraries
ldd ./nchat-app

# Install missing libs
sudo apt install <missing-library>
```

### Universal binary fails on macOS

**Issue:** Missing targets

**Solution:**
```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### Auto-update signature mismatch

**Issue:** Public key doesn't match private key

**Solution:**
1. Regenerate keys: `pnpm tauri signer generate`
2. Update `tauri.conf.json` with new public key
3. Rebuild app

## CI/CD

GitHub Actions workflow: `.github/workflows/build-tauri.yml`

**Trigger manually:**
```bash
gh workflow run build-tauri.yml -f platform=all
```

**Environment secrets needed:**
- `TAURI_SIGNING_PRIVATE_KEY` - Private key for updates
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Key password
- `APPLE_CERTIFICATE` - Base64-encoded macOS certificate
- `APPLE_CERTIFICATE_PASSWORD` - Certificate password
- `APPLE_SIGNING_IDENTITY` - Signing identity
- `APPLE_ID` - Apple ID for notarization
- `APPLE_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Apple team ID

## Performance Comparison

| Metric | Tauri | Electron |
|--------|-------|----------|
| Bundle Size | 15 MB | 120 MB |
| Memory Usage | 80 MB | 200 MB |
| Startup Time | 0.5s | 1.5s |
| Binary Size | 8 MB | 80 MB |

*Approximate values for nchat app*

## Rust Development

### Project Structure

```rust
// src/lib.rs - Main application
pub fn run() {
    tauri::Builder::default()
        .plugin(plugins...)
        .setup(|app| {
            // Initialize features
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::show_window,
            // ...
        ])
        .run(tauri::generate_context!())
}
```

### Adding New Commands

1. Define command in `src/commands.rs`:
```rust
#[tauri::command]
pub async fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Received: {}", param))
}
```

2. Register in `src/lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    commands::my_command,
    // ...
])
```

3. Call from frontend:
```typescript
const result = await invoke('my_command', { param: 'hello' })
```

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tauri Plugins](https://github.com/tauri-apps/plugins-workspace)

## Migration from Electron

If migrating from Electron to Tauri:

1. **IPC**: Replace `ipcRenderer.invoke()` with `invoke()`
2. **Store**: Replace `electron-store` with Tauri's store plugin
3. **Dialogs**: Use Tauri's dialog plugin
4. **Shell**: Use Tauri's shell plugin
5. **Notifications**: Use Tauri's notification plugin

See [Tauri Migration Guide](https://tauri.app/v1/guides/migration/from-electron/) for details.

## License

MIT - See LICENSE file in project root
