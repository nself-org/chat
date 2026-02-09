const { notarize } = require('@electron/notarize');

/**
 * Notarize macOS builds
 * 
 * Required environment variables:
 * - APPLE_ID: Your Apple ID email
 * - APPLE_PASSWORD: App-specific password (not your Apple ID password)
 * - APPLE_TEAM_ID: Your 10-character Apple Team ID
 * 
 * This script is automatically called by electron-builder after signing
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip if notarization credentials are not set
  if (!process.env.APPLE_ID || !process.env.APPLE_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.warn('Skipping notarization: APPLE_ID, APPLE_PASSWORD, or APPLE_TEAM_ID not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing ${appName}...`);

  try {
    await notarize({
      appBundleId: 'org.nself.nchat',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });

    console.log(`Successfully notarized ${appName}`);
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't fail the build if notarization fails
    // This allows local builds to succeed
    if (process.env.CI) {
      throw error;
    }
  }
};
