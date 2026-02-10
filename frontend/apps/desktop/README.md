# @nself-chat/desktop

Desktop app for nself-chat (Windows + macOS + Linux) built with React + Electron.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7
- **Desktop Runtime**: Electron 33.2
- **Build Tool**: Vite 6.0 + electron-builder
- **State Management**: Zustand 5.0 (from @nself-chat/state)
- **API Client**: Apollo Client 3.14 (from @nself-chat/api)
- **UI Components**: Radix UI (from @nself-chat/ui)
- **Testing**: Jest 29 + Testing Library

## Architecture

### Shared Package Integration

This desktop app consumes shared packages from the monorepo:

```typescript
import { logger } from '@nself-chat/core' // Domain logic
import { ApolloProvider } from '@nself-chat/api' // GraphQL client
import { useAuthStore } from '@nself-chat/state' // State management
import { Button } from '@nself-chat/ui' // UI components
```

### Platform Adapters

Desktop-specific functionality is abstracted through adapters:

```
src/adapters/
├── storage/       # electron-store → LocalStorage interface
├── notifications/ # Native desktop notifications
├── clipboard/     # System clipboard access
└── filesystem/    # File system access
```

Each adapter provides a clean interface that bridges Electron APIs with the shared app logic.

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Electron dev dependencies

### Install Dependencies

```bash
# From monorepo root
pnpm install

# From desktop app directory
cd frontend/apps/desktop
pnpm install
```

### Development Server

```bash
# Run web dev server (for testing in browser)
pnpm dev

# Start Electron app
pnpm start

# Build the app
pnpm build
```

## Platform Adapters API

### Storage Adapter

```typescript
import { desktopStorage, typedStorage } from '@/adapters/storage'

// String storage
desktopStorage.setItem('key', 'value')
const value = desktopStorage.getItem('key')

// Typed storage
await typedStorage.setJSON('user', { id: 1, name: 'Alice' })
const user = typedStorage.getJSON<User>('user')

typedStorage.setBoolean('dark_mode', true)
const darkMode = typedStorage.getBoolean('dark_mode')
```

### Notifications Adapter

```typescript
import { desktopNotifications, notificationHelpers } from '@/adapters/notifications'

// Show notification
await desktopNotifications.show('New Message', 'Hello from nself-chat!')

// Show with options
await desktopNotifications.show('Important', 'Action required', {
  silent: false,
  urgency: 'critical',
  onClick: () => {
    console.log('Notification clicked')
  },
})

// Helper functions
await notificationHelpers.showSuccess('Operation completed')
await notificationHelpers.showError('Something went wrong')
```

### Clipboard Adapter

```typescript
import { desktopClipboard, clipboardHelpers } from '@/adapters/clipboard'

// Read text
const text = await desktopClipboard.readText()

// Write text
await desktopClipboard.writeText('Hello World')

// Copy with feedback
const success = await clipboardHelpers.copyText('Hello')

// Check clipboard
const hasText = await clipboardHelpers.hasText()
const hasImage = await clipboardHelpers.hasImage()
```

### Filesystem Adapter

```typescript
import { desktopFilesystem, filesystemHelpers } from '@/adapters/filesystem'

// Select file
const file = await desktopFilesystem.selectFile({
  accept: { 'image/*': ['.png', '.jpg', '.gif'] },
})

// Select multiple files
const files = await desktopFilesystem.selectFiles()

// Save file
await desktopFilesystem.saveFile('export.json', jsonData)

// Open path in system default app (Electron)
await desktopFilesystem.openPath('https://example.com')

// Show file in folder (Electron)
await desktopFilesystem.showInFolder('/path/to/file.txt')

// Read file as text
const content = await filesystemHelpers.readAsText(file)
```

## Desktop Hooks

### useElectron

```typescript
import { useElectron } from '@/hooks/use-electron'

function AppInfo() {
  const { isElectron, platform, appVersion, isMac } = useElectron()

  if (!isElectron) {
    return <div>Not running in Electron</div>
  }

  return (
    <div>
      Platform: {platform}
      Version: {appVersion}
      {isMac && <div>macOS-specific feature</div>}
    </div>
  )
}
```

### useWindow

```typescript
import { useWindow } from '@/hooks/use-window'

function TitleBar() {
  const { isMaximized, minimize, maximize, close } = useWindow()

  return (
    <div className="title-bar">
      <button onClick={minimize}>−</button>
      <button onClick={maximize}>{isMaximized ? '❐' : '☐'}</button>
      <button onClick={close}>✕</button>
    </div>
  )
}
```

### useNativeMenu

```typescript
import { useNativeMenu } from '@/hooks/use-native-menu'

function App() {
  useNativeMenu({
    onNewConversation: () => {
      console.log('New conversation from menu')
    },
    onPreferences: () => {
      console.log('Open preferences')
    },
  })

  return <div>App</div>
}
```

## Electron API (window.desktop)

The preload script exposes a safe API to the renderer process:

```typescript
// App info
const version = await window.desktop.app.getVersion()
const name = await window.desktop.app.getName()
const path = await window.desktop.app.getPath('userData')

// Window controls
window.desktop.window.minimize()
window.desktop.window.maximize()
window.desktop.window.close()
const isMaximized = await window.desktop.window.isMaximized()

// Shell operations
window.desktop.shell.openExternal('https://example.com')
window.desktop.shell.showItemInFolder('/path/to/file')

// Updates
window.desktop.update.check()
const cleanup = window.desktop.update.onDownloadProgress((progress) => {
  console.log(`Download progress: ${progress.percent}%`)
})

// Notifications
await window.desktop.notification.show({
  title: 'Hello',
  body: 'World',
  silent: false,
})

// Platform detection
if (window.desktop.platform.isMac) {
  // macOS-specific code
}
```

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Test Structure

```
src/__tests__/
├── adapters.test.ts      # Adapter unit tests
└── integration.test.tsx  # Integration tests
```

### Writing Tests

```typescript
import { describe, it, expect } from '@jest/globals'
import { desktopStorage } from '../adapters/storage'

describe('Storage Adapter', () => {
  it('should store and retrieve data', () => {
    desktopStorage.setItem('key', 'value')
    const value = desktopStorage.getItem('key')
    expect(value).toBe('value')
  })
})
```

## Project Structure

```
frontend/apps/desktop/
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── index.ts            # Main entry point
│   │   ├── window-manager.ts   # Window creation/management
│   │   ├── menu.ts             # Application menu
│   │   ├── tray.ts             # System tray
│   │   ├── auto-updater.ts     # Auto-update logic
│   │   ├── ipc-handlers.ts     # IPC message handlers
│   │   └── shortcuts.ts        # Global keyboard shortcuts
│   ├── preload/                 # Preload scripts (bridge)
│   │   ├── index.ts            # Main preload script
│   │   └── api.ts              # Desktop API types
│   ├── renderer/                # Renderer process (React)
│   │   ├── App.tsx             # Main app component
│   │   ├── index.tsx           # Renderer entry point
│   │   ├── index.css           # Base styles
│   │   ├── components/         # Desktop-specific components
│   │   ├── hooks/              # Desktop-specific hooks
│   │   │   ├── use-electron.ts
│   │   │   ├── use-window.ts
│   │   │   ├── use-native-menu.ts
│   │   │   └── index.ts
│   │   └── screens/            # Desktop screens
│   ├── adapters/                # Platform adapters
│   │   ├── storage/            # Storage adapter (electron-store)
│   │   ├── notifications/      # Notifications adapter
│   │   ├── clipboard/          # Clipboard adapter
│   │   ├── filesystem/         # Filesystem adapter
│   │   └── index.ts
│   ├── config/
│   │   └── electron.config.ts  # Electron configuration
│   ├── types/
│   │   └── desktop.ts          # Desktop type definitions
│   ├── utils/
│   │   ├── platform.ts         # Platform detection
│   │   └── paths.ts            # Path utilities
│   └── __tests__/              # Tests
│       ├── adapters.test.ts
│       └── integration.test.tsx
├── build/                       # Build resources
│   └── icons/                  # App icons
│       ├── icon.icns           # macOS
│       ├── icon.ico            # Windows
│       └── icon.png            # Linux
├── electron-builder.json        # Electron Builder config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tsconfig.main.json          # Main process TS config
├── tsconfig.renderer.json      # Renderer process TS config
├── vite.config.ts              # Vite config
├── jest.config.cjs             # Jest config
├── index.html                  # HTML entry point
└── README.md                   # This file
```

## Configuration

### electron-builder.json

```json
{
  "appId": "com.nself.chat",
  "productName": "nself-chat",
  "mac": {
    "category": "public.app-category.social-networking",
    "target": ["dmg", "zip"]
  },
  "win": {
    "target": ["nsis", "portable"]
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "category": "Network;InstantMessaging"
  }
}
```

### Environment Variables

```bash
# Development
NODE_ENV=development

# API endpoints
VITE_API_URL=https://api.nself.chat
VITE_GRAPHQL_URL=https://api.nself.chat/graphql
VITE_WS_URL=wss://api.nself.chat/graphql

# Feature flags
VITE_ENABLE_AUTO_UPDATE=true
VITE_ENABLE_TRAY=true
```

## Building for Production

### macOS

```bash
# Build for macOS
pnpm dist:mac

# Output:
# release/mac/nself-chat-0.9.2.dmg
# release/mac/nself-chat-0.9.2-mac.zip
```

### Windows

```bash
# Build for Windows
pnpm dist:win

# Output:
# release/win/nself-chat Setup 0.9.2.exe
# release/win/nself-chat 0.9.2.exe (portable)
```

### Linux

```bash
# Build for Linux
pnpm dist:linux

# Output:
# release/linux/nself-chat-0.9.2.AppImage
# release/linux/nself-chat_0.9.2_amd64.deb
# release/linux/nself-chat-0.9.2.x86_64.rpm
```

## Desktop Features

### Native Menus

Platform-native menu bars with appropriate shortcuts:

- File: New Conversation, Close Window
- Edit: Undo, Redo, Cut, Copy, Paste
- View: Reload, Dev Tools, Zoom, Full Screen
- Window: Minimize, Zoom, Close
- Help: Learn More, Documentation, Report Issue

### System Tray (Windows/Linux)

Background operation with tray icon:

- Show App
- New Conversation
- Preferences
- Quit

### Auto-Updates

Automatic app updates with user prompt:

- Check for updates on startup
- Check every 4 hours
- Download in background
- Prompt user to install

### Global Shortcuts

Keyboard shortcuts work even when app is not focused:

- `Ctrl+Shift+Space` (or `Cmd+Shift+Space`): Toggle show/hide window

### Native Notifications

OS-level notifications with action support:

- Message notifications
- System notifications
- Badge count (macOS)

## Troubleshooting

### Build Issues

```bash
# Clean build
rm -rf dist release node_modules
pnpm install
pnpm build
```

### Electron Issues

```bash
# Rebuild native modules
pnpm rebuild

# Clear Electron cache
rm -rf ~/.electron
```

### TypeScript Errors

```bash
# Type check
pnpm type-check

# Rebuild shared packages
cd ../../packages/core && pnpm build
cd ../../packages/api && pnpm build
cd ../../packages/state && pnpm build
cd ../../packages/ui && pnpm build
```

### Code Signing (macOS/Windows)

For distribution, you'll need to sign the app:

**macOS:**
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
pnpm dist:mac
```

**Windows:**
```bash
export WIN_CSC_LINK=/path/to/certificate.pfx
export WIN_CSC_KEY_PASSWORD=your_password
pnpm dist:win
```

## Contributing

See [Contributing Guide](../../../CONTRIBUTING.md) for development workflow.

## License

MIT © nself-chat
