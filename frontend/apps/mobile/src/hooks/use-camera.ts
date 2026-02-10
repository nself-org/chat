/**
 * Camera Hook
 *
 * React hook for camera and photo selection
 */

import { useState, useCallback } from 'react'
import { Photo, ImageOptions } from '@capacitor/camera'
import { mobileCamera, cameraHelpers } from '../adapters/camera'

/**
 * Camera state
 */
export interface CameraState {
  loading: boolean
  error: string | null
  photo: Photo | null
  hasPermission: boolean
}

/**
 * Use camera
 *
 * @example
 * ```typescript
 * function ProfilePicture() {
 *   const { takePicture, selectFromGallery, photo, loading } = useCamera()
 *
 *   return (
 *     <div>
 *       <button onClick={takePicture} disabled={loading}>
 *         Take Photo
 *       </button>
 *       <button onClick={selectFromGallery} disabled={loading}>
 *         Choose from Gallery
 *       </button>
 *       {photo && <img src={photo.webPath} alt="Selected" />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCamera() {
  const [state, setState] = useState<CameraState>({
    loading: false,
    error: null,
    photo: null,
    hasPermission: false,
  })

  const requestPermission = useCallback(async () => {
    const granted = await mobileCamera.requestPermission()
    setState((prev) => ({ ...prev, hasPermission: granted }))
    return granted
  }, [])

  const takePicture = useCallback(
    async (options?: Partial<ImageOptions>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const photo = await mobileCamera.takePicture(options)

        setState({
          loading: false,
          error: null,
          photo,
          hasPermission: true,
        })

        return photo
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to take picture',
        }))
        return null
      }
    },
    []
  )

  const selectFromGallery = useCallback(
    async (options?: Partial<ImageOptions>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const photo = await mobileCamera.selectFromGallery(options)

        setState({
          loading: false,
          error: null,
          photo,
          hasPermission: true,
        })

        return photo
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to select photo',
        }))
        return null
      }
    },
    []
  )

  const clearPhoto = useCallback(() => {
    setState((prev) => ({ ...prev, photo: null, error: null }))
  }, [])

  const getPhotoAsBase64 = useCallback(async () => {
    if (!state.photo) return null
    return cameraHelpers.photoToBase64(state.photo)
  }, [state.photo])

  const getPhotoAsFile = useCallback(
    async (filename?: string) => {
      if (!state.photo) return null
      return cameraHelpers.photoToFile(state.photo, filename)
    },
    [state.photo]
  )

  return {
    ...state,
    takePicture,
    selectFromGallery,
    clearPhoto,
    requestPermission,
    getPhotoAsBase64,
    getPhotoAsFile,
  }
}
