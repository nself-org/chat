/**
 * Camera Integration for Capacitor
 * Handles photo/video capture and gallery access
 */

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface MediaFile {
  uri: string;
  base64?: string;
  type: 'image' | 'video';
  filename: string;
  size?: number;
}

class CameraService {
  /**
   * Take a photo using the camera
   */
  async takePhoto(): Promise<MediaFile | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: true,
      });

      return this.processPhoto(photo);
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  /**
   * Pick a photo from the gallery
   */
  async pickPhoto(): Promise<MediaFile | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false,
      });

      return this.processPhoto(photo);
    } catch (error) {
      console.error('Error picking photo:', error);
      return null;
    }
  }

  /**
   * Pick multiple photos from gallery
   */
  async pickPhotos(maxPhotos: number = 10): Promise<MediaFile[]> {
    try {
      // Note: Capacitor Camera plugin doesn't support multiple selection natively
      // This would require a custom plugin or use of image-picker plugin
      console.warn('Multiple photo selection not natively supported');
      const photo = await this.pickPhoto();
      return photo ? [photo] : [];
    } catch (error) {
      console.error('Error picking photos:', error);
      return [];
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({ permissions: ['camera'] });
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Request photo library permissions
   */
  async requestPhotoLibraryPermission(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({ permissions: ['photos'] });
      return permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting photo library permission:', error);
      return false;
    }
  }

  /**
   * Check camera permissions
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Check photo library permissions
   */
  async checkPhotoLibraryPermission(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.photos === 'granted';
    } catch (error) {
      console.error('Error checking photo library permission:', error);
      return false;
    }
  }

  /**
   * Convert photo to base64
   */
  async getPhotoAsBase64(photo: Photo): Promise<string | null> {
    try {
      if (!photo.path) {
        return null;
      }

      const file = await Filesystem.readFile({
        path: photo.path,
      });

      return file.data;
    } catch (error) {
      console.error('Error converting photo to base64:', error);
      return null;
    }
  }

  /**
   * Save photo to filesystem
   */
  async savePhoto(base64Data: string, filename: string): Promise<string | null> {
    try {
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Data,
      });

      return savedFile.uri;
    } catch (error) {
      console.error('Error saving photo:', error);
      return null;
    }
  }

  /**
   * Delete photo from filesystem
   */
  async deletePhoto(filepath: string): Promise<boolean> {
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data,
      });
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  /**
   * Get photo file size
   */
  async getPhotoSize(filepath: string): Promise<number | null> {
    try {
      const stat = await Filesystem.stat({
        path: filepath,
        directory: Directory.Data,
      });
      return stat.size;
    } catch (error) {
      console.error('Error getting photo size:', error);
      return null;
    }
  }

  /**
   * Process captured/selected photo
   */
  private async processPhoto(photo: Photo): Promise<MediaFile | null> {
    if (!photo.path) {
      return null;
    }

    const filename = photo.path.split('/').pop() || `photo-${Date.now()}.jpg`;

    // Get file size if possible
    let size: number | undefined;
    try {
      const stat = await Filesystem.stat({ path: photo.path });
      size = stat.size;
    } catch (error) {
      console.warn('Could not get file size:', error);
    }

    return {
      uri: Capacitor.convertFileSrc(photo.path),
      base64: photo.base64String,
      type: 'image',
      filename,
      size,
    };
  }

  /**
   * Compress image before upload
   */
  async compressImage(base64Data: string, quality: number = 0.7): Promise<string> {
    // Note: This is a basic implementation
    // For production, consider using a dedicated image compression plugin
    return base64Data;
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
    try {
      // Note: This requires creating an Image element
      // In Capacitor, you might need to use a plugin for this
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = uri;
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }
}

// Export singleton instance
export const camera = new CameraService();
