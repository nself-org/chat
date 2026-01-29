/**
 * Haptic Feedback Integration for Capacitor
 * Provides tactile feedback for user interactions
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

class HapticsService {
  private isAvailable = false;

  constructor() {
    this.isAvailable = Capacitor.isNativePlatform();
  }

  /**
   * Trigger light impact haptic feedback
   */
  async light(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Error triggering light haptic:', error);
    }
  }

  /**
   * Trigger medium impact haptic feedback
   */
  async medium(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Error triggering medium haptic:', error);
    }
  }

  /**
   * Trigger heavy impact haptic feedback
   */
  async heavy(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error('Error triggering heavy haptic:', error);
    }
  }

  /**
   * Trigger success notification haptic
   */
  async success(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error('Error triggering success haptic:', error);
    }
  }

  /**
   * Trigger warning notification haptic
   */
  async warning(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error('Error triggering warning haptic:', error);
    }
  }

  /**
   * Trigger error notification haptic
   */
  async error(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error('Error triggering error haptic:', error);
    }
  }

  /**
   * Trigger selection haptic (iOS only)
   */
  async selection(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('Error triggering selection haptic:', error);
    }
  }

  /**
   * Trigger vibration (Android pattern)
   */
  async vibrate(duration: number = 100): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }

  /**
   * Haptic for button press
   */
  async buttonPress(): Promise<void> {
    await this.light();
  }

  /**
   * Haptic for toggle switch
   */
  async toggleSwitch(): Promise<void> {
    await this.medium();
  }

  /**
   * Haptic for message sent
   */
  async messageSent(): Promise<void> {
    await this.success();
  }

  /**
   * Haptic for message received
   */
  async messageReceived(): Promise<void> {
    await this.light();
  }

  /**
   * Haptic for pull to refresh
   */
  async pullToRefresh(): Promise<void> {
    await this.medium();
  }

  /**
   * Haptic for swipe action
   */
  async swipeAction(): Promise<void> {
    await this.medium();
  }

  /**
   * Haptic for long press
   */
  async longPress(): Promise<void> {
    await this.heavy();
  }

  /**
   * Check if haptics are available
   */
  isHapticsAvailable(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const haptics = new HapticsService();
