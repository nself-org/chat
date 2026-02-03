# nchat Desktop - Quick Start Guide

Get up and running with nchat desktop development in 5 minutes.

## Prerequisites

✅ Node.js 20.x or later
✅ pnpm 9.15.4 or later
✅ Git

## 1. Clone and Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# Install dependencies
pnpm install

# Navigate to Electron directory
cd platforms/electron
npm install
```

## 2. Build TypeScript (30 seconds)

```bash
# Compile TypeScript files
npm run build:all
```

## 3. Start Development (30 seconds)

**Option A: From project root**

```bash
cd ../..
pnpm dev &  # Start Next.js dev server
cd platforms/electron
npm run start:dev  # Start Electron
```

**Option B: Using the Next.js build**

```bash
cd ../..
pnpm build  # Build Next.js app
cd platforms/electron
npm start  # Start Electron with production build
```

## 4. Build Installer (2 minutes)

```bash
# Make sure Next.js is built first
cd ../..
pnpm build

# Build for your platform
cd platforms/electron
npm run dist

# Or specify platform
npm run dist:mac     # macOS
npm run dist:win     # Windows
npm run dist:linux   # Linux
```

Done! Your installer is in `dist-electron/`

## Development Workflow

### 1. Making Changes

**Main Process (Node.js code):**

```bash
# Edit files in platforms/electron/main/
# Then rebuild
npm run build:main

# Or use watch mode
npm run watch:main
```

**Renderer (Next.js app):**

```bash
# From project root
pnpm dev  # Changes auto-reload
```

### 2. Testing Changes

```bash
# Restart Electron after main process changes
npm run start:dev
```

### 3. Debugging

**Main Process:**

```bash
# Add debugger; statement in code
# Or use VS Code debugger
```

**Renderer:**

- Press `Cmd/Ctrl+Shift+I` for DevTools
- Console shows errors and logs

## Common Commands

```bash
# Development
npm start               # Run production build
npm run start:dev       # Run development build

# Building
npm run build:main      # Compile main process
npm run build:preload   # Compile preload script
npm run build:all       # Compile everything

# Watch mode
npm run watch:main      # Auto-compile main
npm run watch:preload   # Auto-compile preload

# Distribution
npm run pack            # Create unpacked app
npm run dist            # Create installer (current platform)
npm run dist:mac        # Build macOS
npm run dist:win        # Build Windows
npm run dist:linux      # Build Linux
npm run dist:all        # Build all platforms
```

## Project Structure

```
platforms/electron/
├── main/              # Main process (Node.js)
│   ├── index.ts       # Entry point
│   ├── window.ts      # Window management
│   ├── menu.ts        # App menu
│   ├── tray.ts        # System tray
│   ├── notifications.ts
│   ├── updates.ts     # Auto-updater
│   └── ...
├── preload/           # Preload scripts (bridge)
│   └── index.ts
├── resources/         # Icons and assets
├── scripts/           # Build scripts
└── package.json
```

## Configuration Files

- `package.json` - Dependencies and scripts
- `electron-builder.yml` - Build configuration
- `tsconfig.main.json` - Main process TypeScript config
- `tsconfig.preload.json` - Preload TypeScript config

## Environment Variables

```bash
# Development
export NODE_ENV=development

# Code signing (macOS)
export CSC_LINK=/path/to/cert.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app-password
export APPLE_TEAM_ID=TEAM_ID

# Code signing (Windows)
export WIN_CSC_LINK=/path/to/cert.pfx
export WIN_CSC_KEY_PASSWORD=your-password

# Auto-update
export GH_TOKEN=github_token
```

## Troubleshooting

### "Cannot find module" error

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript errors

```bash
# Rebuild TypeScript
npm run build:all
```

### White screen on startup

```bash
# Check Next.js build exists
ls -la ../../out

# If not, build it
cd ../..
pnpm build
```

### Build fails

```bash
# Clear cache
rm -rf dist-electron

# Try again
npm run dist
```

## Next Steps

1. **Read the full documentation**: [README.md](./README.md)
2. **Learn about deployment**: [Desktop Deployment Guide](../../docs/deployment/desktop-deployment.md)
3. **Understand the architecture**: See main README
4. **Configure auto-updates**: See electron-builder.yml
5. **Set up code signing**: See deployment guide

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Next.js Docs](https://nextjs.org/docs)
- [Project Issues](https://github.com/nself/nself-chat/issues)

## Getting Help

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/nself/nself-chat/issues)
- 💬 [Community Forum](https://community.nself.org)
- 📧 Email: hello@nself.org

---

**Happy coding! 🚀**
