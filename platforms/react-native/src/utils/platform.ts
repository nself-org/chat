/**
 * Platform Detection and Utilities
 * Cross-platform helpers for iOS, Android, and Web
 */

import { Platform, Dimensions, PixelRatio, StatusBar } from 'react-native'

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

/**
 * Get platform-specific value
 */
export function platformSelect<T>(options: {
  ios?: T
  android?: T
  web?: T
  default?: T
}): T | undefined {
  if (isIOS && options.ios !== undefined) {
    return options.ios
  }
  if (isAndroid && options.android !== undefined) {
    return options.android
  }
  if (isWeb && options.web !== undefined) {
    return options.web
  }
  return options.default
}

/**
 * Check if device is a tablet
 */
export function isTablet(): boolean {
  const { width, height } = Dimensions.get('window')
  const aspectRatio = height / width
  const pixelDensity = PixelRatio.get()

  // Tablets usually have:
  // - Larger screen dimensions
  // - Different aspect ratios
  // - Lower pixel density
  return (width >= 600 && height >= 600) || (aspectRatio < 1.6 && Math.min(width, height) >= 600)
}

/**
 * Check if device has notch (iPhone X and later)
 */
export function hasNotch(): boolean {
  if (!isIOS) return false

  const { height, width } = Dimensions.get('window')
  const aspectRatio = height / width

  // iPhone X and later have aspect ratio > 2
  return aspectRatio > 2
}

/**
 * Get status bar height
 */
export function getStatusBarHeight(): number {
  if (isAndroid) {
    return StatusBar.currentHeight || 0
  }

  if (isIOS) {
    const { height, width } = Dimensions.get('window')
    const aspectRatio = height / width

    // iPhone X and later
    if (aspectRatio > 2) {
      return 44
    }

    // Older iPhones
    return 20
  }

  return 0
}

/**
 * Get bottom safe area inset
 */
export function getBottomSafeAreaInset(): number {
  if (!isIOS) return 0

  const { height, width } = Dimensions.get('window')
  const aspectRatio = height / width

  // iPhone X and later have home indicator
  if (aspectRatio > 2) {
    return 34
  }

  return 0
}

/**
 * Get device type
 */
export function getDeviceType(): 'phone' | 'tablet' {
  return isTablet() ? 'tablet' : 'phone'
}

/**
 * Get OS version
 */
export function getOSVersion(): string {
  return Platform.Version.toString()
}

/**
 * Check if running on iOS simulator
 */
export function isIOSSimulator(): boolean {
  if (!isIOS) return false
  // This is a heuristic - simulators usually have lower pixel ratios
  return PixelRatio.get() < 2
}

/**
 * Check if running on Android emulator
 */
export function isAndroidEmulator(): boolean {
  if (!isAndroid) return false
  // This is a heuristic - emulators have specific characteristics
  return Platform.isTV || Platform.Version === 10000
}

/**
 * Get screen dimensions
 */
export function getScreenDimensions() {
  const window = Dimensions.get('window')
  const screen = Dimensions.get('screen')

  return {
    window: {
      width: window.width,
      height: window.height,
    },
    screen: {
      width: screen.width,
      height: screen.height,
    },
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
  }
}

/**
 * Scale size based on device width
 */
export function scale(size: number): number {
  const { width } = Dimensions.get('window')
  const baseWidth = 375 // iPhone X/11 Pro width
  const scale = width / baseWidth
  return Math.round(size * scale)
}

/**
 * Vertical scale based on device height
 */
export function verticalScale(size: number): number {
  const { height } = Dimensions.get('window')
  const baseHeight = 812 // iPhone X/11 Pro height
  const scale = height / baseHeight
  return Math.round(size * scale)
}

/**
 * Moderate scale with factor
 */
export function moderateScale(size: number, factor = 0.5): number {
  return size + (scale(size) - size) * factor
}

/**
 * Convert dp to px
 */
export function dpToPx(dp: number): number {
  return PixelRatio.getPixelSizeForLayoutSize(dp)
}

/**
 * Convert px to dp
 */
export function pxToDp(px: number): number {
  return px / PixelRatio.get()
}

/**
 * Platform-specific styles helper
 */
export function platformStyles<T>(styles: { ios?: T; android?: T; web?: T; default: T }): T {
  return platformSelect(styles) || styles.default
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  return {
    top: getStatusBarHeight(),
    bottom: getBottomSafeAreaInset(),
    left: 0,
    right: 0,
  }
}
