/**
 * Platform Bridge
 * Unified interface for platform-specific functionality across Capacitor and React Native
 *
 * This file provides a consistent API regardless of the mobile platform being used.
 */

// Type definitions
export interface PlatformInfo {
  os: 'ios' | 'android' | 'web';
  version: string;
  isTablet: boolean;
  model?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  image?: string;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: 'faceId' | 'touchId' | 'fingerprint' | 'none';
}

export interface MediaResult {
  uri: string;
  base64?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  size?: number;
}

/**
 * Platform Bridge Interface
 * Implement this interface for each platform (Capacitor, React Native)
 */
export interface IPlatformBridge {
  // Platform info
  getPlatformInfo(): Promise<PlatformInfo>;

  // Notifications
  requestNotificationPermission(): Promise<boolean>;
  scheduleNotification(options: NotificationOptions): Promise<void>;
  setBadgeCount(count: number): Promise<void>;
  clearBadge(): Promise<void>;

  // Camera & Media
  requestCameraPermission(): Promise<boolean>;
  takePicture(): Promise<MediaResult | null>;
  pickImage(): Promise<MediaResult | null>;
  pickVideo(): Promise<MediaResult | null>;

  // Biometrics
  isBiometricAvailable(): Promise<boolean>;
  authenticate(reason?: string): Promise<BiometricResult>;

  // Storage
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;

  // Haptics
  hapticLight(): Promise<void>;
  hapticMedium(): Promise<void>;
  hapticHeavy(): Promise<void>;
  hapticSuccess(): Promise<void>;
  hapticError(): Promise<void>;

  // Share
  share(text: string, url?: string, title?: string): Promise<boolean>;

  // Network
  isOnline(): Promise<boolean>;
  onNetworkChange(callback: (isOnline: boolean) => void): void;

  // Deep Linking
  addDeepLinkListener(callback: (url: string) => void): void;
  removeDeepLinkListener(): void;
}

/**
 * Platform Bridge Factory
 * Returns the appropriate platform implementation
 */
export class PlatformBridgeFactory {
  private static instance: IPlatformBridge | null = null;

  static getInstance(): IPlatformBridge {
    if (!this.instance) {
      // Detect platform and create appropriate instance
      if (typeof window !== 'undefined') {
        // Check if Capacitor is available
        if ((window as any).Capacitor) {
          this.instance = new CapacitorBridge();
        }
        // Check if React Native is available
        else if ((window as any).ReactNativeWebView) {
          this.instance = new ReactNativeBridge();
        }
        // Fallback to web implementation
        else {
          this.instance = new WebBridge();
        }
      } else {
        // Node.js environment - use mock
        this.instance = new MockBridge();
      }
    }
    return this.instance;
  }

  static setInstance(instance: IPlatformBridge): void {
    this.instance = instance;
  }
}

/**
 * Capacitor Bridge Implementation
 */
class CapacitorBridge implements IPlatformBridge {
  async getPlatformInfo(): Promise<PlatformInfo> {
    // Import Capacitor dynamically
    const { Capacitor, Device } = await import('@capacitor/core');
    const info = await Device.getInfo();

    return {
      os: Capacitor.getPlatform() as 'ios' | 'android' | 'web',
      version: info.osVersion,
      isTablet: info.platform === 'tablet',
      model: info.model,
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permission = await PushNotifications.requestPermissions();
    return permission.receive === 'granted';
  }

  async scheduleNotification(options: NotificationOptions): Promise<void> {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [
        {
          title: options.title,
          body: options.body,
          id: Date.now(),
          extra: options.data,
          sound: options.sound,
        },
      ],
    });
  }

  async setBadgeCount(count: number): Promise<void> {
    // iOS only - badge via local notification
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.getPlatform() === 'ios') {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '',
            body: '',
            id: 0,
            extra: { badge: count },
          },
        ],
      });
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  async requestCameraPermission(): Promise<boolean> {
    const { Camera } = await import('@capacitor/camera');
    const permissions = await Camera.requestPermissions({ permissions: ['camera'] });
    return permissions.camera === 'granted';
  }

  async takePicture(): Promise<MediaResult | null> {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
      });

      return {
        uri: photo.webPath || photo.path || '',
        base64: photo.base64String,
        type: 'image',
      };
    } catch (error) {
      return null;
    }
  }

  async pickImage(): Promise<MediaResult | null> {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
      });

      return {
        uri: photo.webPath || photo.path || '',
        base64: photo.base64String,
        type: 'image',
      };
    } catch (error) {
      return null;
    }
  }

  async pickVideo(): Promise<MediaResult | null> {
    // Note: Capacitor Camera doesn't natively support video picking
    // Would need a community plugin
    console.warn('Video picking not implemented for Capacitor');
    return null;
  }

  async isBiometricAvailable(): Promise<boolean> {
    // Would need @aparajita/capacitor-biometric-auth plugin
    // For now, return false
    return false;
  }

  async authenticate(reason?: string): Promise<BiometricResult> {
    // Would need @aparajita/capacitor-biometric-auth plugin
    return {
      success: false,
      error: 'Biometric authentication not implemented',
    };
  }

  async setItem(key: string, value: string): Promise<void> {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
  }

  async getItem(key: string): Promise<string | null> {
    const { Preferences } = await import('@capacitor/preferences');
    const result = await Preferences.get({ key });
    return result.value;
  }

  async removeItem(key: string): Promise<void> {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
  }

  async clear(): Promise<void> {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.clear();
  }

  async hapticLight(): Promise<void> {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async hapticMedium(): Promise<void> {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async hapticHeavy(): Promise<void> {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async hapticSuccess(): Promise<void> {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  }

  async hapticError(): Promise<void> {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Error });
  }

  async share(text: string, url?: string, title?: string): Promise<boolean> {
    const { Share } = await import('@capacitor/share');
    try {
      await Share.share({
        text,
        url,
        title,
        dialogTitle: title,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async isOnline(): Promise<boolean> {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): void {
    import('@capacitor/network').then(({ Network }) => {
      Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
    });
  }

  addDeepLinkListener(callback: (url: string) => void): void {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', (event) => {
        callback(event.url);
      });
    });
  }

  removeDeepLinkListener(): void {
    import('@capacitor/app').then(({ App }) => {
      App.removeAllListeners();
    });
  }
}

/**
 * React Native Bridge Implementation
 */
class ReactNativeBridge implements IPlatformBridge {
  async getPlatformInfo(): Promise<PlatformInfo> {
    // Would import from react-native
    return {
      os: 'ios', // Placeholder
      version: '17.0',
      isTablet: false,
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    // React Native implementation
    return true;
  }

  async scheduleNotification(options: NotificationOptions): Promise<void> {
    // React Native implementation
  }

  async setBadgeCount(count: number): Promise<void> {
    // React Native implementation
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  async requestCameraPermission(): Promise<boolean> {
    return true;
  }

  async takePicture(): Promise<MediaResult | null> {
    return null;
  }

  async pickImage(): Promise<MediaResult | null> {
    return null;
  }

  async pickVideo(): Promise<MediaResult | null> {
    return null;
  }

  async isBiometricAvailable(): Promise<boolean> {
    return false;
  }

  async authenticate(reason?: string): Promise<BiometricResult> {
    return { success: false, error: 'Not implemented' };
  }

  async setItem(key: string, value: string): Promise<void> {
    // Use MMKV or AsyncStorage
  }

  async getItem(key: string): Promise<string | null> {
    return null;
  }

  async removeItem(key: string): Promise<void> {}

  async clear(): Promise<void> {}

  async hapticLight(): Promise<void> {}
  async hapticMedium(): Promise<void> {}
  async hapticHeavy(): Promise<void> {}
  async hapticSuccess(): Promise<void> {}
  async hapticError(): Promise<void> {}

  async share(text: string, url?: string, title?: string): Promise<boolean> {
    return false;
  }

  async isOnline(): Promise<boolean> {
    return true;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): void {}

  addDeepLinkListener(callback: (url: string) => void): void {}
  removeDeepLinkListener(): void {}
}

/**
 * Web Bridge Implementation (fallback)
 */
class WebBridge implements IPlatformBridge {
  async getPlatformInfo(): Promise<PlatformInfo> {
    return {
      os: 'web',
      version: navigator.userAgent,
      isTablet: false,
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async scheduleNotification(options: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.image,
        badge: options.badge?.toString(),
      });
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    // Web badge API
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count);
    }
  }

  async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  async takePicture(): Promise<MediaResult | null> {
    // Would need to implement camera capture UI
    return null;
  }

  async pickImage(): Promise<MediaResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              uri: reader.result as string,
              type: 'image',
              size: file.size,
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  async pickVideo(): Promise<MediaResult | null> {
    return null;
  }

  async isBiometricAvailable(): Promise<boolean> {
    return 'credentials' in navigator;
  }

  async authenticate(reason?: string): Promise<BiometricResult> {
    return { success: false, error: 'Not supported on web' };
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async hapticLight(): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  async hapticMedium(): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }

  async hapticHeavy(): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }

  async hapticSuccess(): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  async hapticError(): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  }

  async share(text: string, url?: string, title?: string): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share({ text, url, title });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  addDeepLinkListener(callback: (url: string) => void): void {
    // Not applicable for web
  }

  removeDeepLinkListener(): void {
    // Not applicable for web
  }
}

/**
 * Mock Bridge Implementation (for testing)
 */
class MockBridge implements IPlatformBridge {
  async getPlatformInfo(): Promise<PlatformInfo> {
    return { os: 'ios', version: '17.0', isTablet: false };
  }
  async requestNotificationPermission(): Promise<boolean> {
    return true;
  }
  async scheduleNotification(options: NotificationOptions): Promise<void> {}
  async setBadgeCount(count: number): Promise<void> {}
  async clearBadge(): Promise<void> {}
  async requestCameraPermission(): Promise<boolean> {
    return true;
  }
  async takePicture(): Promise<MediaResult | null> {
    return null;
  }
  async pickImage(): Promise<MediaResult | null> {
    return null;
  }
  async pickVideo(): Promise<MediaResult | null> {
    return null;
  }
  async isBiometricAvailable(): Promise<boolean> {
    return true;
  }
  async authenticate(reason?: string): Promise<BiometricResult> {
    return { success: true, biometryType: 'faceId' };
  }
  async setItem(key: string, value: string): Promise<void> {}
  async getItem(key: string): Promise<string | null> {
    return null;
  }
  async removeItem(key: string): Promise<void> {}
  async clear(): Promise<void> {}
  async hapticLight(): Promise<void> {}
  async hapticMedium(): Promise<void> {}
  async hapticHeavy(): Promise<void> {}
  async hapticSuccess(): Promise<void> {}
  async hapticError(): Promise<void> {}
  async share(text: string, url?: string, title?: string): Promise<boolean> {
    return true;
  }
  async isOnline(): Promise<boolean> {
    return true;
  }
  onNetworkChange(callback: (isOnline: boolean) => void): void {}
  addDeepLinkListener(callback: (url: string) => void): void {}
  removeDeepLinkListener(): void {}
}

// Export singleton
export const platformBridge = PlatformBridgeFactory.getInstance();
