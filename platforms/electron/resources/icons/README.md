# Electron App Icons

This directory contains application icons for all platforms.

## Required Icon Files

### macOS
- `icon.icns` - macOS app icon (512x512@2x recommended)
  - Contains multiple resolutions: 16x16, 32x32, 128x128, 256x256, 512x512
  - Each at 1x and 2x resolution

### Windows
- `icon.ico` - Windows app icon
  - Contains multiple resolutions: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### Linux
- `16x16.png` - 16x16 pixel icon
- `32x32.png` - 32x32 pixel icon
- `48x48.png` - 48x48 pixel icon
- `64x64.png` - 64x64 pixel icon
- `128x128.png` - 128x128 pixel icon
- `256x256.png` - 256x256 pixel icon
- `512x512.png` - 512x512 pixel icon
- `1024x1024.png` - 1024x1024 pixel icon (for high-DPI displays)

### Installer/DMG Graphics (macOS)
- `../dmg-background.png` - DMG background image (660x400 recommended)
- `installer.icns` - Installer icon (optional, defaults to app icon)

### Installer Graphics (Windows)
- `../installer-sidebar.bmp` - NSIS installer sidebar (164x314 recommended)
- `installer.ico` - Installer icon (optional, defaults to app icon)
- `uninstaller.ico` - Uninstaller icon (optional, defaults to app icon)

## Generating Icons

### From PNG Source

If you have a high-resolution PNG (1024x1024 recommended):

```bash
# Install icon generation tools
brew install imagemagick    # macOS
sudo apt install imagemagick # Linux

# Generate all sizes
magick convert source.png -resize 16x16 16x16.png
magick convert source.png -resize 32x32 32x32.png
magick convert source.png -resize 48x48 48x48.png
magick convert source.png -resize 64x64 64x64.png
magick convert source.png -resize 128x128 128x128.png
magick convert source.png -resize 256x256 256x256.png
magick convert source.png -resize 512x512 512x512.png
magick convert source.png -resize 1024x1024 1024x1024.png

# Generate .icns (macOS)
brew install makeicns
makeicns -in source.png -out icon.icns

# Or use iconutil (built into macOS)
mkdir icon.iconset
sips -z 16 16 source.png --out icon.iconset/icon_16x16.png
sips -z 32 32 source.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 source.png --out icon.iconset/icon_32x32.png
sips -z 64 64 source.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 source.png --out icon.iconset/icon_128x128.png
sips -z 256 256 source.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 source.png --out icon.iconset/icon_256x256.png
sips -z 512 512 source.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 source.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 source.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset

# Generate .ico (Windows)
magick convert source.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Using electron-icon-builder

```bash
npm install -g electron-icon-builder

# Generate all icons from one source
electron-icon-builder --input=./source.png --output=./
```

## Design Guidelines

### General
- Use simple, recognizable shapes
- Avoid fine details that won't be visible at small sizes
- Test at all sizes to ensure clarity
- Use transparency wisely (especially for macOS)
- Maintain consistent padding around the icon

### macOS
- Design for rounded square (1024x1024 canvas)
- Apple automatically applies rounded corners
- Avoid placing important elements in corners
- Use subtle shadows for depth
- Support both light and dark backgrounds

### Windows
- Design for square canvas
- Test against light and dark taskbars
- Ensure 16x16 is readable (most important)
- Consider high-contrast mode

### Linux
- Design for variety of themes and backgrounds
- Ensure good contrast
- Support both light and dark themes
- Follow freedesktop.org icon guidelines

## Current Icons

The default icons are placeholder graphics. Replace them with your branding:

1. Create a high-resolution source icon (1024x1024 PNG)
2. Run the generation scripts above
3. Test the app on all platforms
4. Verify icons appear correctly in:
   - Dock/Taskbar
   - Alt-Tab/Task Switcher
   - About dialog
   - Installer/DMG
   - File associations

## Resources

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/app-icon/)
- [Windows App Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography/app-icons)
- [freedesktop.org Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html)
