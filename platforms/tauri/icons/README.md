# nchat Desktop App Icons (Tauri)

This folder contains placeholder icons for the Tauri desktop application build process.

## Current Status

**Placeholder icons created**: ✅ YES

The following files exist as minimal valid placeholders:
- `icon.png` - Master icon reference (1x1 transparent PNG)
- `icon.ico` - Windows icon format
- `icon.icns` - macOS icon format
- `32x32.png`, `128x128.png`, `128x128@2x.png` - Required sizes
- `tray.png`, `tray-unread.png`, `tray-muted.png`, `tray-dnd.png` - Tray icons

## Important: Design Assets Required

These placeholder icons are **minimalist and non-functional** for production use. To build production-ready Tauri applications, you need to:

### 1. Create a Master Icon (1024x1024 or 512x512)
Create a professional PNG or SVG icon design for nchat and save it as `master-icon.png`.

### 2. Generate Platform-Specific Icons

Using the **tauri-icon** tool (recommended):

```bash
npm install -g @aspect-dev/tauri-icon
tauri-icon --input ./master-icon.png
```

Or manually using **ImageMagick**:

```bash
# Generate required PNGs
convert master-icon.png -resize 32x32 32x32.png
convert master-icon.png -resize 128x128 128x128.png
convert master-icon.png -resize 256x256 128x128@2x.png

# Generate Windows ICO (multi-resolution)
convert master-icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Generate macOS ICNS (requires iconutil)
mkdir icon.iconset
sips -z 16 16 master-icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 master-icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 master-icon.png --out icon.iconset/icon_64x64.png
sips -z 128 128 master-icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 master-icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 master-icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
rm -rf icon.iconset
```

### 3. Generate Tray Icons

For taskbar/system tray integration:

```bash
# macOS: Template image (grayscale, transparent background)
convert master-icon.png -colorspace Gray -resize 22x22 tray.png

# Windows: Full color icon
convert master-icon.png -resize 22x22 tray.png

# Variants for different states
convert tray.png -brightness-contrast 50 tray-unread.png
convert tray.png -brightness-contrast -50 tray-muted.png
convert tray.png -modulate 80 tray-dnd.png
```

## macOS Tray Icon Guidelines

- Use template images (single color, typically black/white)
- Apply alpha transparency for native menu bar integration
- Size should be 22x22 or 44x44 for retina displays
- The system automatically adapts colors for light/dark menu bar

## Windows/Linux Tray Icon Guidelines

- Can use colored icons
- Size: 22x22 or larger
- Support 32-bit PNG with alpha channel

## Build Configuration

Tauri looks for icons in `src-tauri/icons/` by default, but this folder structure supports custom icon locations referenced in `tauri.conf.json`.

## Next Steps

1. Design a professional nchat logo/icon (recommended: use brand color #6366f1)
2. Export as high-resolution PNG (1024x1024 minimum)
3. Run the icon generation script or use ImageMagick commands above
4. Run `npm run tauri build` to generate platform-specific builds
5. Test desktop builds with generated icons
6. Update this README once production icons are in place

## Troubleshooting

- **Icons not showing**: Ensure file names match exactly (case-sensitive on Linux)
- **macOS icon looks wrong**: Verify ICNS generation included all required sizes
- **Windows installer icon**: Must be in ICO format with multiple resolutions
- **Tray icon not updating**: Clear application cache and rebuild

## References

- Tauri Icon Requirements: https://tauri.app/en/docs/getting-started/setup/
- macOS ICNS Format: https://en.wikipedia.org/wiki/.icns
- Windows ICO Format: https://en.wikipedia.org/wiki/ICO_(file_format)
- ImageMagick Documentation: https://imagemagick.org/
