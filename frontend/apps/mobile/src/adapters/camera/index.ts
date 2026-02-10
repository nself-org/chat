/**
 * Camera Adapter for nself-chat Mobile
 *
 * Handles camera access, photo capture, and image selection
 */

import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
  CameraDirection,
  ImageOptions,
} from '@capacitor/camera'

/**
 * Camera adapter interface
 */
export interface CameraAdapter {
  takePicture(options?: Partial<ImageOptions>): Promise<Photo | null>
  selectFromGallery(options?: Partial<ImageOptions>): Promise<Photo | null>
  requestPermission(): Promise<boolean>
  checkPermission(): Promise<{
    camera: boolean
    photos: boolean
  }>
}

/**
 * Mobile camera implementation using Capacitor Camera
 *
 * @example
 * ```typescript
 * import { mobileCamera } from '@/adapters/camera'
 *
 * // Take a picture
 * const photo = await mobileCamera.takePicture({
 *   quality: 90,
 *   allowEditing: true
 * })
 *
 * if (photo) {
 *   console.log('Photo path:', photo.path)
 *   console.log('Photo data:', photo.base64String)
 * }
 *
 * // Select from gallery
 * const selected = await mobileCamera.selectFromGallery()
 * ```
 */
export const mobileCamera: CameraAdapter = {
  /**
   * Take a picture using the camera
   */
  async takePicture(options = {}): Promise<Photo | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: false,
        ...options,
      })

      return photo
    } catch (error) {
      console.error('[Camera] Error taking picture:', error)
      return null
    }
  },

  /**
   * Select an image from the gallery
   */
  async selectFromGallery(options = {}): Promise<Photo | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false,
        ...options,
      })

      return photo
    } catch (error) {
      console.error('[Camera] Error selecting from gallery:', error)
      return null
    }
  },

  /**
   * Request camera and photo library permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      const result = await Camera.requestPermissions({
        permissions: ['camera', 'photos'],
      })

      return result.camera === 'granted' || result.photos === 'granted'
    } catch (error) {
      console.error('[Camera] Error requesting permission:', error)
      return false
    }
  },

  /**
   * Check current permission status
   */
  async checkPermission() {
    try {
      const result = await Camera.checkPermissions()

      return {
        camera: result.camera === 'granted',
        photos: result.photos === 'granted',
      }
    } catch (error) {
      console.error('[Camera] Error checking permission:', error)
      return {
        camera: false,
        photos: false,
      }
    }
  },
}

/**
 * Camera helpers
 */
export const cameraHelpers = {
  /**
   * Convert Photo to base64 string
   */
  async photoToBase64(photo: Photo): Promise<string | null> {
    if (photo.base64String) {
      return photo.base64String
    }

    if (photo.webPath) {
      try {
        const response = await fetch(photo.webPath)
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            resolve(base64.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.error('[Camera] Error converting to base64:', error)
        return null
      }
    }

    return null
  },

  /**
   * Convert Photo to File object
   */
  async photoToFile(photo: Photo, filename = 'photo.jpg'): Promise<File | null> {
    if (!photo.webPath) return null

    try {
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      return new File([blob], filename, {
        type: `image/${photo.format || 'jpeg'}`,
      })
    } catch (error) {
      console.error('[Camera] Error converting to file:', error)
      return null
    }
  },

  /**
   * Get photo dimensions
   */
  async getPhotoDimensions(
    photo: Photo
  ): Promise<{ width: number; height: number } | null> {
    if (!photo.webPath) return null

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        resolve(null)
      }
      img.src = photo.webPath!
    })
  },

  /**
   * Validate photo size (max 10MB)
   */
  async validatePhotoSize(photo: Photo, maxSizeMB = 10): Promise<boolean> {
    if (!photo.webPath) return false

    try {
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      const sizeMB = blob.size / (1024 * 1024)
      return sizeMB <= maxSizeMB
    } catch {
      return false
    }
  },
}

/**
 * Camera options presets
 */
export const cameraPresets = {
  /**
   * High quality photo
   */
  highQuality: {
    quality: 100,
    allowEditing: false,
    saveToGallery: false,
  } as Partial<ImageOptions>,

  /**
   * Profile picture
   */
  profilePicture: {
    quality: 90,
    allowEditing: true,
    saveToGallery: false,
    direction: CameraDirection.Front,
  } as Partial<ImageOptions>,

  /**
   * Quick snapshot
   */
  quickSnapshot: {
    quality: 75,
    allowEditing: false,
    saveToGallery: false,
  } as Partial<ImageOptions>,

  /**
   * Document scan
   */
  documentScan: {
    quality: 100,
    allowEditing: true,
    saveToGallery: false,
  } as Partial<ImageOptions>,
}

export default mobileCamera
