/**
 * After-pack script
 * Runs after the app is packaged but before it's signed
 * 
 * Use this to:
 * - Remove unnecessary files
 * - Add custom resources
 * - Modify package structure
 */
exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir } = context;
  const fs = require('fs');
  const path = require('path');

  console.log(`After-pack for ${electronPlatformName} at ${appOutDir}`);

  // Platform-specific cleanup
  if (electronPlatformName === 'darwin') {
    // macOS-specific cleanup
    console.log('Cleaning up macOS build...');
  } else if (electronPlatformName === 'win32') {
    // Windows-specific cleanup
    console.log('Cleaning up Windows build...');
  } else if (electronPlatformName === 'linux') {
    // Linux-specific cleanup
    console.log('Cleaning up Linux build...');
  }

  // Remove unnecessary locale files to reduce size
  const localesPath = path.join(appOutDir, 'locales');
  if (fs.existsSync(localesPath)) {
    const keepLocales = ['en-US.pak'];
    const localeFiles = fs.readdirSync(localesPath);
    
    localeFiles.forEach(file => {
      if (!keepLocales.includes(file)) {
        const filePath = path.join(localesPath, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Removed locale file: ${file}`);
        } catch (err) {
          console.warn(`Failed to remove ${file}:`, err.message);
        }
      }
    });
  }

  console.log('After-pack complete');
};
