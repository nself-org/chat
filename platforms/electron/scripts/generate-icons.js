#!/usr/bin/env node

/**
 * Icon Generation Script
 *
 * Generates all required icons for Windows, macOS, and Linux
 * from a source SVG or PNG file.
 *
 * Requirements:
 * - imagemagick (convert command)
 * - iconutil (macOS only, for .icns generation)
 * - png2icons or electron-icon-maker (for .ico generation)
 *
 * Usage:
 *   node generate-icons.js <source-image>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = process.argv[2] || path.join(__dirname, '..', '..', 'public', 'logo.svg');
const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'icons');

// Icon sizes required for each platform
const SIZES = {
  macOS: [16, 32, 64, 128, 256, 512, 1024],
  windows: [16, 24, 32, 48, 64, 128, 256],
  linux: [16, 24, 32, 48, 64, 128, 256, 512],
};

/**
 * Log message
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Generate PNG files for all required sizes
 */
function generatePNGs(sizes) {
  log('Generating PNG files...');

  if (!commandExists('convert')) {
    log('ImageMagick (convert) not found. Please install it:', 'ERROR');
    log('  macOS: brew install imagemagick', 'ERROR');
    log('  Ubuntu: sudo apt-get install imagemagick', 'ERROR');
    log('  Windows: choco install imagemagick', 'ERROR');
    return false;
  }

  for (const size of sizes) {
    const outputFile = path.join(OUTPUT_DIR, `${size}x${size}.png`);

    try {
      execSync(
        `convert "${SOURCE_IMAGE}" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "${outputFile}"`,
        { stdio: 'pipe' }
      );
      log(`Generated: ${size}x${size}.png`);
    } catch (error) {
      log(`Failed to generate ${size}x${size}.png: ${error.message}`, 'ERROR');
      return false;
    }
  }

  return true;
}

/**
 * Generate macOS .icns file
 */
function generateICNS() {
  log('Generating macOS .icns file...');

  if (process.platform !== 'darwin') {
    log('Skipping .icns generation (not on macOS)', 'WARN');
    return true;
  }

  const iconsetDir = path.join(OUTPUT_DIR, 'icon.iconset');

  // Create iconset directory
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  // Copy PNGs to iconset with proper naming
  const iconsetSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, name } of iconsetSizes) {
    const sourceFile = path.join(OUTPUT_DIR, `${size}x${size}.png`);
    const destFile = path.join(iconsetDir, name);

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }
  }

  // Convert iconset to icns
  try {
    const icnsFile = path.join(OUTPUT_DIR, 'icon.icns');
    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsFile}"`, { stdio: 'pipe' });
    log(`Generated: icon.icns`, 'SUCCESS');

    // Clean up iconset directory
    execSync(`rm -rf "${iconsetDir}"`, { stdio: 'ignore' });

    return true;
  } catch (error) {
    log(`Failed to generate .icns: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Generate Windows .ico file
 */
function generateICO() {
  log('Generating Windows .ico file...');

  const icoFile = path.join(OUTPUT_DIR, 'icon.ico');

  // Collect PNG files for ICO
  const pngFiles = SIZES.windows.map((size) =>
    path.join(OUTPUT_DIR, `${size}x${size}.png`)
  );

  try {
    // Use ImageMagick to create ICO
    const pngArgs = pngFiles.map((f) => `"${f}"`).join(' ');
    execSync(`convert ${pngArgs} "${icoFile}"`, { stdio: 'pipe' });
    log(`Generated: icon.ico`, 'SUCCESS');
    return true;
  } catch (error) {
    log(`Failed to generate .ico: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Generate tray icon (smaller version)
 */
function generateTrayIcon() {
  log('Generating tray icon...');

  const trayFile = path.join(OUTPUT_DIR, '..', 'tray-icon.png');

  try {
    execSync(
      `convert "${SOURCE_IMAGE}" -resize 32x32 -background none -gravity center -extent 32x32 "${trayFile}"`,
      { stdio: 'pipe' }
    );
    log(`Generated: tray-icon.png`, 'SUCCESS');
    return true;
  } catch (error) {
    log(`Failed to generate tray icon: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Copy icons to Linux hicolor theme structure
 */
function organizeLinuxIcons() {
  log('Organizing Linux icons...');

  const linuxSizes = SIZES.linux;

  for (const size of linuxSizes) {
    const sourceFile = path.join(OUTPUT_DIR, `${size}x${size}.png`);
    const destFile = path.join(OUTPUT_DIR, `${size}x${size}`, 'apps', 'nchat.png');

    // Create directory
    const destDir = path.dirname(destFile);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }
  }

  log('Linux icons organized', 'SUCCESS');
  return true;
}

/**
 * Generate README for icons directory
 */
function generateReadme() {
  const readme = `# nchat Application Icons

This directory contains all application icons for different platforms.

## Files

- **icon.icns** - macOS application icon bundle
- **icon.ico** - Windows application icon
- **tray-icon.png** - System tray icon (32x32)
- **[size]x[size].png** - Individual PNG icons
- **[size]x[size]/apps/nchat.png** - Linux hicolor theme structure

## Regenerating Icons

To regenerate all icons from source:

\`\`\`bash
node ../scripts/generate-icons.js /path/to/source-icon.svg
\`\`\`

## Requirements

- ImageMagick (convert command)
- iconutil (macOS only)

## Source Image Requirements

- Format: SVG (preferred) or high-resolution PNG (at least 1024x1024)
- Square aspect ratio
- Transparent background recommended
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme);
  log('Generated icons README');
}

/**
 * Main function
 */
function main() {
  log('='.repeat(60));
  log('Icon Generation Script');
  log('='.repeat(60));

  if (!fs.existsSync(SOURCE_IMAGE)) {
    log(`Source image not found: ${SOURCE_IMAGE}`, 'ERROR');
    log('Usage: node generate-icons.js <source-image>', 'ERROR');
    process.exit(1);
  }

  log(`Source image: ${SOURCE_IMAGE}`);
  log(`Output directory: ${OUTPUT_DIR}`);

  // Ensure output directory
  ensureOutputDir();

  // Collect all unique sizes
  const allSizes = [
    ...new Set([...SIZES.macOS, ...SIZES.windows, ...SIZES.linux]),
  ].sort((a, b) => a - b);

  // Generate PNGs
  if (!generatePNGs(allSizes)) {
    process.exit(1);
  }

  // Generate platform-specific icons
  generateICNS();
  generateICO();
  generateTrayIcon();
  organizeLin uxIcons();

  // Generate README
  generateReadme();

  log('='.repeat(60));
  log('Icon generation completed successfully!', 'SUCCESS');
  log('='.repeat(60));
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { generatePNGs, generateICNS, generateICO };
