# PWA Icons

This directory contains icons for the Progressive Web App (PWA).

## Required Icons

Generate these icons from your source logo (recommended minimum 1024x1024px SVG or PNG):

### Standard Icons (required)

| File                | Size    | Purpose                                 |
| ------------------- | ------- | --------------------------------------- |
| `icon-72.png`       | 72x72   | Android launcher (mdpi)                 |
| `icon-96.png`       | 96x96   | Android launcher (hdpi), shortcut icons |
| `icon-128.png`      | 128x128 | Chrome Web Store                        |
| `icon-144.png`      | 144x144 | iOS (iPad), Windows tile                |
| `icon-152.png`      | 152x152 | iOS (iPad)                              |
| `icon-192.png`      | 192x192 | Android launcher, PWA splash            |
| `icon-384.png`      | 384x384 | Large Android icons                     |
| `icon-512.png`      | 512x512 | PWA splash screen, Google Play          |
| `maskable-icon.png` | 512x512 | Adaptive icon with safe zone            |

### Badge Icons (for notifications)

| File           | Size  | Purpose                         |
| -------------- | ----- | ------------------------------- |
| `badge-72.png` | 72x72 | Notification badge (monochrome) |

### Shortcut Icons (optional)

| File                    | Size  | Purpose              |
| ----------------------- | ----- | -------------------- |
| `shortcut-message.png`  | 96x96 | New message shortcut |
| `shortcut-channels.png` | 96x96 | Channels shortcut    |

### Action Icons (optional, for notification actions)

| File               | Size  | Purpose             |
| ------------------ | ----- | ------------------- |
| `action-reply.png` | 24x24 | Reply action        |
| `action-read.png`  | 24x24 | Mark as read action |
| `action-view.png`  | 24x24 | View action         |
| `action-open.png`  | 24x24 | Open action         |

## Maskable Icon Guidelines

The maskable icon should have a "safe zone" of content that won't be cropped.

- The safe zone is 80% of the icon size (40% from center in each direction)
- For a 512x512 icon, keep important content within the center 410x410 area
- Background should extend to the full 512x512

```
+------------------+
|                  |
|   +----------+   |
|   | SAFE     |   |
|   | ZONE     |   |
|   |          |   |
|   +----------+   |
|                  |
+------------------+
```

## Generation Tools

### Using sharp (Node.js)

```javascript
const sharp = require('sharp')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

sizes.forEach((size) => {
  sharp('source-icon.png').resize(size, size).png().toFile(`icon-${size}.png`)
})
```

### Using ImageMagick

```bash
# Generate all sizes
for size in 72 96 128 144 152 192 384 512; do
  convert source-icon.png -resize ${size}x${size} icon-${size}.png
done

# Generate maskable icon with padding
convert source-icon.png -resize 410x410 -gravity center -extent 512x512 -background "#6366f1" maskable-icon.png
```

### Online Tools

- [PWA Asset Generator](https://github.com/nicholasmaurer/pwa-asset-generator)
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)

## Recommended Format

- Format: PNG with transparency
- Color depth: 32-bit (RGBA)
- Background: Transparent for standard icons
- Background: Solid color for maskable icons

## Testing

After adding icons, test them:

1. Chrome DevTools > Application > Manifest
2. Lighthouse PWA audit
3. Install the PWA on different devices
4. Check notification badges
