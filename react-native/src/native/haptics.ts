/**
 * Haptics - Haptic feedback functionality
 */

import * as Haptics from 'expo-haptics'

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(style: HapticStyle = 'light'): Promise<void> {
  try {
    switch (style) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        break
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        break
      case 'selection':
        await Haptics.selectionAsync()
        break
    }
  } catch (error) {
    // Haptics might not be available on all devices
    console.debug('Haptics not available:', error)
  }
}

/**
 * Light impact feedback
 */
export async function lightImpact(): Promise<void> {
  return triggerHaptic('light')
}

/**
 * Medium impact feedback
 */
export async function mediumImpact(): Promise<void> {
  return triggerHaptic('medium')
}

/**
 * Heavy impact feedback
 */
export async function heavyImpact(): Promise<void> {
  return triggerHaptic('heavy')
}

/**
 * Success notification feedback
 */
export async function successHaptic(): Promise<void> {
  return triggerHaptic('success')
}

/**
 * Warning notification feedback
 */
export async function warningHaptic(): Promise<void> {
  return triggerHaptic('warning')
}

/**
 * Error notification feedback
 */
export async function errorHaptic(): Promise<void> {
  return triggerHaptic('error')
}

/**
 * Selection change feedback
 */
export async function selectionHaptic(): Promise<void> {
  return triggerHaptic('selection')
}

// Common use case haptics

/**
 * Button press haptic
 */
export async function buttonPress(): Promise<void> {
  return lightImpact()
}

/**
 * Send message haptic
 */
export async function messageSent(): Promise<void> {
  return successHaptic()
}

/**
 * Delete action haptic
 */
export async function deleteAction(): Promise<void> {
  return mediumImpact()
}

/**
 * Long press haptic
 */
export async function longPress(): Promise<void> {
  return mediumImpact()
}

/**
 * Tab change haptic
 */
export async function tabChange(): Promise<void> {
  return selectionHaptic()
}

/**
 * Pull to refresh haptic
 */
export async function pullToRefresh(): Promise<void> {
  return lightImpact()
}

/**
 * Error haptic
 */
export async function error(): Promise<void> {
  return errorHaptic()
}

/**
 * Toggle switch haptic
 */
export async function toggleSwitch(): Promise<void> {
  return lightImpact()
}
