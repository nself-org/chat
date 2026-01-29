# nchat Desktop App Icons

This folder should contain the following icon files for the Tauri desktop application:

## Required Icons

### App Icons
- `icon.icns` - macOS app icon (512x512 or 1024x1024)
- `icon.ico` - Windows app icon (256x256 multi-resolution)
- `32x32.png` - Small icon (32x32)
- `128x128.png` - Medium icon (128x128)
- `128x128@2x.png` - Retina icon (256x256)

### Tray Icons
- `tray.png` - Default tray icon (22x22 or 44x44 for retina)
- `tray-unread.png` - Tray icon with unread indicator
- `tray-muted.png` - Tray icon when muted
- `tray-dnd.png` - Tray icon for Do Not Disturb mode

## Icon Generation

You can generate these icons from a master 1024x1024 PNG using tools like:

1. **tauri-icon** (recommended):
   ```bash
   npm install -g @aspect-dev/tauri-icon
   tauri-icon --input ./master-icon.png
   ```

2. **ImageMagick**:
   ```bash
   # Generate PNGs
   convert master-icon.png -resize 32x32 32x32.png
   convert master-icon.png -resize 128x128 128x128.png
   convert master-icon.png -resize 256x256 128x128@2x.png

   # Generate ICO (Windows)
   convert master-icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

   # Generate ICNS (macOS) - requires iconutil
   mkdir icon.iconset
   sips -z 16 16 master-icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 master-icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 master-icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 master-icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 master-icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 master-icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 master-icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 master-icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 master-icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 master-icon.png --out icon.iconset/icon_512x512@2x.png
   iconutil -c icns icon.iconset
   rm -rf icon.iconset
   ```

## Tray Icon Guidelines

- macOS: Use template images (single color, typically black/white)
- Windows: Can use colored icons
- Linux: Depends on desktop environment

For macOS template images, use grayscale with alpha transparency.
The icon will automatically adapt to light/dark menu bar.
