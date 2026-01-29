/**
 * Camera - Native camera functionality
 */

import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, CameraType } from 'expo-camera'

export interface CapturedMedia {
  uri: string
  type: 'image' | 'video'
  width?: number
  height?: number
  duration?: number
  fileSize?: number
}

export interface CameraOptions {
  type?: 'front' | 'back'
  mediaTypes?: 'image' | 'video' | 'all'
  quality?: number // 0-1
  maxDuration?: number // seconds, for video
  allowsEditing?: boolean
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync()
  return status === 'granted'
}

/**
 * Request microphone permissions (for video recording)
 */
export async function requestMicrophonePermissions(): Promise<boolean> {
  const { status } = await Camera.requestMicrophonePermissionsAsync()
  return status === 'granted'
}

/**
 * Check camera permissions
 */
export async function checkCameraPermissions(): Promise<boolean> {
  const { status } = await Camera.getCameraPermissionsAsync()
  return status === 'granted'
}

/**
 * Take a photo using the camera
 */
export async function takePhoto(options?: CameraOptions): Promise<CapturedMedia | null> {
  const hasPermission = await requestCameraPermissions()
  if (!hasPermission) {
    return null
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      quality: options?.quality ?? 0.8,
      cameraType: options?.type === 'front'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    const asset = result.assets[0]
    return {
      uri: asset.uri,
      type: 'image',
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    }
  } catch (error) {
    console.error('Failed to take photo:', error)
    return null
  }
}

/**
 * Record a video using the camera
 */
export async function recordVideo(options?: CameraOptions): Promise<CapturedMedia | null> {
  const hasCameraPermission = await requestCameraPermissions()
  const hasMicPermission = await requestMicrophonePermissions()

  if (!hasCameraPermission || !hasMicPermission) {
    return null
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: options?.allowsEditing ?? true,
      quality: options?.quality ?? 0.8,
      videoMaxDuration: options?.maxDuration ?? 60,
      cameraType: options?.type === 'front'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    const asset = result.assets[0]
    return {
      uri: asset.uri,
      type: 'video',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileSize: asset.fileSize,
    }
  } catch (error) {
    console.error('Failed to record video:', error)
    return null
  }
}

/**
 * Capture media (photo or video based on options)
 */
export async function captureMedia(options?: CameraOptions): Promise<CapturedMedia | null> {
  const hasCameraPermission = await requestCameraPermissions()
  if (!hasCameraPermission) {
    return null
  }

  if (options?.mediaTypes === 'video') {
    return recordVideo(options)
  }

  const mediaTypes = options?.mediaTypes === 'all'
    ? ImagePicker.MediaTypeOptions.All
    : options?.mediaTypes === 'image'
      ? ImagePicker.MediaTypeOptions.Images
      : ImagePicker.MediaTypeOptions.All

  try {
    // For video, also request mic permission
    if (mediaTypes !== ImagePicker.MediaTypeOptions.Images) {
      await requestMicrophonePermissions()
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      allowsEditing: options?.allowsEditing ?? true,
      quality: options?.quality ?? 0.8,
      videoMaxDuration: options?.maxDuration ?? 60,
      cameraType: options?.type === 'front'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    const asset = result.assets[0]
    return {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileSize: asset.fileSize,
    }
  } catch (error) {
    console.error('Failed to capture media:', error)
    return null
  }
}

/**
 * Check if device has camera
 */
export function hasCamera(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android'
}

/**
 * Get available cameras
 */
export function getAvailableCameras(): CameraType[] {
  return [CameraType.back, CameraType.front]
}
