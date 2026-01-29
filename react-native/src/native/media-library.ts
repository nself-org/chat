/**
 * Media Library - Access device photos and videos
 */

import * as MediaLibrary from 'expo-media-library'
import * as ImagePicker from 'expo-image-picker'

export interface MediaAsset {
  id: string
  uri: string
  filename: string
  mediaType: 'photo' | 'video' | 'audio' | 'unknown'
  width: number
  height: number
  duration?: number
  createdAt: Date
  modifiedAt: Date
}

export interface MediaPickerResult {
  assets: MediaAsset[]
  canceled: boolean
}

export interface MediaPickerOptions {
  mediaTypes?: 'images' | 'videos' | 'all'
  allowsMultipleSelection?: boolean
  selectionLimit?: number
  quality?: number
  allowsEditing?: boolean
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Check media library permissions
 */
export async function checkMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await MediaLibrary.getPermissionsAsync()
  return status === 'granted'
}

/**
 * Pick media from library
 */
export async function pickMedia(options?: MediaPickerOptions): Promise<MediaPickerResult> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return { assets: [], canceled: true }
  }

  const mediaTypes = options?.mediaTypes === 'images'
    ? ImagePicker.MediaTypeOptions.Images
    : options?.mediaTypes === 'videos'
      ? ImagePicker.MediaTypeOptions.Videos
      : ImagePicker.MediaTypeOptions.All

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsMultipleSelection: options?.allowsMultipleSelection ?? true,
      selectionLimit: options?.selectionLimit ?? 10,
      quality: options?.quality ?? 0.8,
      allowsEditing: options?.allowsEditing ?? false,
    })

    if (result.canceled) {
      return { assets: [], canceled: true }
    }

    const assets: MediaAsset[] = result.assets.map((asset) => ({
      id: asset.assetId || asset.uri,
      uri: asset.uri,
      filename: asset.fileName || 'unknown',
      mediaType: asset.type === 'video' ? 'video' : 'photo',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }))

    return { assets, canceled: false }
  } catch (error) {
    console.error('Failed to pick media:', error)
    return { assets: [], canceled: true }
  }
}

/**
 * Pick images from library
 */
export async function pickImages(options?: Omit<MediaPickerOptions, 'mediaTypes'>): Promise<MediaPickerResult> {
  return pickMedia({ ...options, mediaTypes: 'images' })
}

/**
 * Pick videos from library
 */
export async function pickVideos(options?: Omit<MediaPickerOptions, 'mediaTypes'>): Promise<MediaPickerResult> {
  return pickMedia({ ...options, mediaTypes: 'videos' })
}

/**
 * Get recent media from library
 */
export async function getRecentMedia(
  limit: number = 50,
  mediaType?: 'photo' | 'video' | 'all'
): Promise<MediaAsset[]> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return []
  }

  try {
    const result = await MediaLibrary.getAssetsAsync({
      first: limit,
      mediaType: mediaType === 'photo'
        ? MediaLibrary.MediaType.photo
        : mediaType === 'video'
          ? MediaLibrary.MediaType.video
          : [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    })

    return result.assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      createdAt: new Date(asset.creationTime),
      modifiedAt: new Date(asset.modificationTime),
    }))
  } catch (error) {
    console.error('Failed to get recent media:', error)
    return []
  }
}

/**
 * Get albums from library
 */
export async function getAlbums(): Promise<MediaLibrary.Album[]> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return []
  }

  try {
    return MediaLibrary.getAlbumsAsync()
  } catch (error) {
    console.error('Failed to get albums:', error)
    return []
  }
}

/**
 * Get assets from a specific album
 */
export async function getAlbumAssets(
  albumId: string,
  limit: number = 50
): Promise<MediaAsset[]> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return []
  }

  try {
    const result = await MediaLibrary.getAssetsAsync({
      first: limit,
      album: albumId,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    })

    return result.assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      createdAt: new Date(asset.creationTime),
      modifiedAt: new Date(asset.modificationTime),
    }))
  } catch (error) {
    console.error('Failed to get album assets:', error)
    return []
  }
}

/**
 * Save media to library
 */
export async function saveToLibrary(uri: string): Promise<MediaLibrary.Asset | null> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return null
  }

  try {
    return MediaLibrary.createAssetAsync(uri)
  } catch (error) {
    console.error('Failed to save to library:', error)
    return null
  }
}

/**
 * Delete media from library
 */
export async function deleteFromLibrary(assetIds: string[]): Promise<boolean> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return false
  }

  try {
    await MediaLibrary.deleteAssetsAsync(assetIds)
    return true
  } catch (error) {
    console.error('Failed to delete from library:', error)
    return false
  }
}
