/**
 * Media Features Usage Examples
 * Complete examples for all media features in nself-chat v0.8.0
 */

import React, { useState } from 'react'
import { ImagePicker, type SelectedImage } from '@/components/media/ImagePicker'
import { VideoPicker, type VideoMetadata } from '@/components/media/VideoPicker'
import { VoiceRecorder, type VoiceRecording } from '@/components/media/VoiceRecorder'
import { ImageEditor } from '@/components/media/ImageEditor'
import { ImageLazy } from '@/components/chat/ImageLazy'
import {
  compressImage,
  aggressiveCompress,
  smartCompress,
  batchCompress,
} from '@/lib/media/image-compression'
import { permissions } from '@/lib/capacitor/permissions'
import { generateLQIP } from '@/lib/media/lazy-loading'

// ============================================================================
// Example 1: Image Upload with Compression
// ============================================================================

export function ImageUploadExample() {
  const [images, setImages] = useState<SelectedImage[]>([])
  const [uploading, setUploading] = useState(false)

  const handleImagesSelected = async (selectedImages: SelectedImage[]) => {
    setImages(selectedImages)
    console.log('Images selected:', selectedImages)

    // Images are already compressed by ImagePicker
    // Just upload the blobs
    setUploading(true)
    for (const image of selectedImages) {
      await uploadToServer(image.blob, image.file.name)
    }
    setUploading(false)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Upload Images</h2>
      <ImagePicker
        maxImages={10}
        maxSizeMB={10}
        autoCompress={true}
        compressionQuality={0.7}
        onImagesSelected={handleImagesSelected}
        onError={(error) => alert(error)}
      />
      {uploading && <p className="mt-4">Uploading...</p>}
    </div>
  )
}

// ============================================================================
// Example 2: Manual Image Compression
// ============================================================================

export function ManualCompressionExample() {
  const [result, setResult] = useState<any>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Method 1: Aggressive compression (70-90% reduction)
    const aggressive = await aggressiveCompress(file)
    console.log(`Original: ${file.size}, Compressed: ${aggressive.compressedSize}`)
    console.log(`Reduction: ${aggressive.reductionPercent.toFixed(1)}%`)

    // Method 2: Smart compression (context-aware)
    const smart = await smartCompress(file, 'chat')

    // Method 3: Target size compression
    const targeted = await compressImage(file, {
      targetSizeKB: 500, // Target 500KB
      quality: 0.7,
    })

    setResult(aggressive)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Manual Compression</h2>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {result && (
        <div className="mt-4 space-y-2">
          <p>Original Size: {(result.originalSize / 1024).toFixed(1)} KB</p>
          <p>Compressed Size: {(result.compressedSize / 1024).toFixed(1)} KB</p>
          <p>Reduction: {result.reductionPercent.toFixed(1)}%</p>
          <p>
            Dimensions: {result.width} × {result.height}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Example 3: Batch Image Compression
// ============================================================================

export function BatchCompressionExample() {
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setTotal(files.length)

    // Compress with concurrency control
    const results = await batchCompress(
      files,
      { quality: 0.7, maxWidth: 1920, maxHeight: 1920 },
      3, // 3 concurrent compressions
      (completed, total) => {
        setProgress(completed)
      }
    )

    console.log('All images compressed:', results)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Batch Compression</h2>
      <input type="file" accept="image/*" multiple onChange={handleMultipleFiles} />
      {total > 0 && (
        <p className="mt-4">
          Progress: {progress} / {total}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Example 4: Video Upload with Trimming
// ============================================================================

export function VideoUploadExample() {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)

  const handleVideoSelected = async (blob: Blob, meta: VideoMetadata) => {
    setVideoBlob(blob)
    setMetadata(meta)

    console.log('Video selected:', {
      duration: meta.duration,
      size: meta.size,
      dimensions: `${meta.width}x${meta.height}`,
    })

    // Upload video
    await uploadToServer(blob, 'video.webm')
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Upload Video</h2>
      <VideoPicker
        maxDurationSeconds={300} // 5 minutes
        maxSizeMB={100}
        allowTrimming={true}
        onVideoSelected={handleVideoSelected}
        onError={(error) => alert(error)}
      />
      {metadata && (
        <div className="mt-4">
          <p>Duration: {Math.floor(metadata.duration)}s</p>
          <p>Size: {(metadata.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Example 5: Voice Note Recording
// ============================================================================

export function VoiceNoteExample() {
  const [recording, setRecording] = useState<VoiceRecording | null>(null)

  const handleRecordingComplete = async (rec: VoiceRecording) => {
    setRecording(rec)

    console.log('Voice note recorded:', {
      duration: rec.duration,
      size: rec.size,
      waveformPoints: rec.waveformData?.length,
    })

    // Convert blob to file and upload
    const blob = await fetch(rec.uri).then((r) => r.blob())
    await uploadToServer(blob, 'voice-note.webm')
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Record Voice Note</h2>
      <VoiceRecorder
        maxDuration={300}
        onRecordingComplete={handleRecordingComplete}
        showPreview={true}
      />
      {recording && (
        <div className="mt-4">
          <p>Duration: {Math.floor(recording.duration)}s</p>
          <p>Size: {(recording.size / 1024).toFixed(1)} KB</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Example 6: Image Editor
// ============================================================================

export function ImageEditExample() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
    setShowEditor(true)
  }

  const handleSave = async (blob: Blob) => {
    console.log('Edited image saved')
    await uploadToServer(blob, 'edited-image.jpg')
    setShowEditor(false)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Edit Image</h2>
      {!showEditor ? (
        <input type="file" accept="image/*" onChange={handleFileSelect} />
      ) : (
        <ImageEditor
          imageUrl={imageUrl}
          imageFile={imageFile || undefined}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Example 7: Lazy Loading Images in Chat
// ============================================================================

export function ChatMessageListExample() {
  const messages = [
    {
      id: '1',
      imageUrl: 'https://example.com/image1.jpg',
      lqip: 'data:image/jpeg;base64,...', // Pre-generated LQIP
    },
    // ... more messages
  ]

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div key={message.id} className="rounded-lg border p-4">
          <ImageLazy
            src={message.imageUrl}
            lowQualitySrc={message.lqip}
            progressive={true}
            fadeInDuration={300}
            blurAmount={10}
            alt="Message image"
            className="max-w-md rounded-lg"
          />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Example 8: Generate LQIP for Progressive Loading
// ============================================================================

export async function generateLQIPExample(imageFile: File) {
  // Generate low-quality placeholder (20x size, 10% quality)
  const lqip = await generateLQIP(imageFile, 20, 0.1)

  // Store LQIP with image metadata
  const metadata = {
    url: await uploadToServer(imageFile, imageFile.name),
    lqip: lqip, // Store this for progressive loading
  }

  return metadata
}

// ============================================================================
// Example 9: Permission Handling
// ============================================================================

export function PermissionExample() {
  const [permissionStatus, setPermissionStatus] = useState<string>('')

  const checkPermissions = async () => {
    // Check multiple permissions
    const results = await permissions.checkPermissions(['camera', 'photos', 'microphone'])

    console.log('Permissions:', results)
    setPermissionStatus(JSON.stringify(results, null, 2))
  }

  const requestCameraPermission = async () => {
    const status = await permissions.requestCameraPermission()
    console.log('Camera permission:', status)

    if (status === 'denied') {
      alert('Camera permission denied. Please enable in settings.')
    }
  }

  const requestWithRationale = async () => {
    const { requestPermissionWithRationale } = await import('@/lib/capacitor/permissions')

    const status = await requestPermissionWithRationale('camera', async (message) => {
      // Show custom dialog
      return confirm(message)
    })

    console.log('Permission status:', status)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Permission Management</h2>
      <div className="space-x-2">
        <button onClick={checkPermissions}>Check Permissions</button>
        <button onClick={requestCameraPermission}>Request Camera</button>
        <button onClick={requestWithRationale}>Request with Rationale</button>
      </div>
      {permissionStatus && <pre className="mt-4 rounded bg-gray-100 p-4">{permissionStatus}</pre>}
    </div>
  )
}

// ============================================================================
// Example 10: Complete Chat Input with All Media Types
// ============================================================================

export function CompleteChatInputExample() {
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showVideoPicker, setShowVideoPicker] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [editingImage, setEditingImage] = useState<{
    url: string
    file: File
  } | null>(null)

  const handleImageEdit = (image: SelectedImage) => {
    setEditingImage({
      url: image.preview,
      file: image.file,
    })
    setShowImageEditor(true)
  }

  const handleImagesSelected = async (images: SelectedImage[]) => {
    console.log('Images selected:', images)

    // Option to edit first image
    if (images.length === 1) {
      handleImageEdit(images[0])
    } else {
      // Upload all images
      for (const img of images) {
        await uploadToServer(img.blob, img.file.name)
      }
      setShowImagePicker(false)
    }
  }

  return (
    <div className="border-t bg-background p-4">
      {/* Media Type Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowImagePicker(!showImagePicker)}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          📷 Images
        </button>
        <button
          onClick={() => setShowVideoPicker(!showVideoPicker)}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          🎥 Video
        </button>
        <button
          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          🎤 Voice
        </button>
      </div>

      {/* Image Picker */}
      {showImagePicker && (
        <div className="mb-4 rounded-lg border p-4">
          <ImagePicker
            maxImages={10}
            autoCompress={true}
            onImagesSelected={handleImagesSelected}
            onError={console.error}
          />
        </div>
      )}

      {/* Video Picker */}
      {showVideoPicker && (
        <div className="mb-4 rounded-lg border p-4">
          <VideoPicker
            maxDurationSeconds={300}
            allowTrimming={true}
            onVideoSelected={async (blob, metadata) => {
              await uploadToServer(blob, 'video.webm')
              setShowVideoPicker(false)
            }}
            onError={console.error}
          />
        </div>
      )}

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="mb-4 rounded-lg border p-4">
          <VoiceRecorder
            maxDuration={300}
            onRecordingComplete={async (recording) => {
              const blob = await fetch(recording.uri).then((r) => r.blob())
              await uploadToServer(blob, 'voice.webm')
              setShowVoiceRecorder(false)
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && editingImage && (
        <div className="fixed inset-0 z-50 bg-background">
          <ImageEditor
            imageUrl={editingImage.url}
            imageFile={editingImage.file}
            onSave={async (blob) => {
              await uploadToServer(blob, editingImage.file.name)
              setShowImageEditor(false)
              setShowImagePicker(false)
            }}
            onCancel={() => {
              setShowImageEditor(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

async function uploadToServer(blob: Blob, filename: string): Promise<string> {
  // Create FormData
  const formData = new FormData()
  formData.append('file', blob, filename)

  // Upload to your server
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  return data.url
}
