# Media Features - Quick Reference Guide

**Version**: 0.8.0 | **Date**: January 31, 2026

## Quick Import Guide

```typescript
// Image Compression
import {
  compressImage,
  aggressiveCompress,
  smartCompress,
  batchCompress,
} from '@/lib/media/image-compression'

// Video
import { video, trimVideoWeb } from '@/lib/capacitor/video'

// Voice Recording
import { voiceRecorder, drawWaveform, formatDuration } from '@/lib/capacitor/voice-recording'

// Lazy Loading
import { getLazyLoader, getProgressiveLoader, generateLQIP } from '@/lib/media/lazy-loading'

// Permissions
import { permissions } from '@/lib/capacitor/permissions'

// Components
import { ImagePicker } from '@/components/media/ImagePicker'
import { VideoPicker } from '@/components/media/VideoPicker'
import { VoiceRecorder } from '@/components/media/VoiceRecorder'
import { ImageEditor } from '@/components/media/ImageEditor'
import { ImageLazy } from '@/components/chat/ImageLazy'
```

## Common Use Cases

### 1. Compress Image Before Upload

```typescript
// Option 1: Aggressive (70-90% reduction)
const result = await aggressiveCompress(imageFile)
await upload(result.blob)

// Option 2: Smart (context-aware)
const result = await smartCompress(imageFile, 'chat')
await upload(result.blob)

// Option 3: Target specific size
const result = await compressImage(imageFile, {
  targetSizeKB: 500,
})
```

### 2. Pick Multiple Images

```tsx
<ImagePicker
  maxImages={10}
  autoCompress={true}
  onImagesSelected={(images) => {
    images.forEach((img) => upload(img.blob))
  }}
/>
```

### 3. Record Voice Note

```tsx
<VoiceRecorder
  maxDuration={300}
  onRecordingComplete={async (recording) => {
    const blob = await fetch(recording.uri).then((r) => r.blob())
    await upload(blob)
  }}
/>
```

### 4. Lazy Load Images in Chat

```tsx
<ImageLazy
  src={message.imageUrl}
  lowQualitySrc={message.lqip}
  progressive={true}
  className="max-w-md rounded-lg"
/>
```

### 5. Edit Image Before Upload

```tsx
const [editing, setEditing] = useState(false)

{
  editing && (
    <ImageEditor
      imageUrl={imageUrl}
      imageFile={imageFile}
      onSave={async (blob) => {
        await upload(blob)
        setEditing(false)
      }}
    />
  )
}
```

### 6. Record and Trim Video

```tsx
<VideoPicker
  maxDurationSeconds={300}
  allowTrimming={true}
  onVideoSelected={(blob, metadata) => {
    console.log(`Duration: ${metadata.duration}s`)
    upload(blob)
  }}
/>
```

### 7. Request Permissions

```typescript
// Single permission
const status = await permissions.requestCameraPermission()

// Multiple permissions
const results = await permissions.requestPermissions(['camera', 'microphone', 'photos'])

// With rationale
const status = await requestPermissionWithRationale('camera', async (message) => confirm(message))
```

### 8. Batch Compress Images

```typescript
const results = await batchCompress(
  files,
  { quality: 0.7 },
  3, // concurrency
  (completed, total) => {
    console.log(`${completed}/${total}`)
  }
)
```

### 9. Generate LQIP for Progressive Loading

```typescript
// Generate LQIP when uploading
const lqip = await generateLQIP(imageFile, 20, 0.1)

// Store with image
await saveImageMetadata({
  url: uploadedUrl,
  lqip: lqip, // Use this for <ImageLazy lowQualitySrc />
})
```

### 10. Take Photo with Camera

```typescript
import { camera } from '@/lib/capacitor/camera'

// Take photo
const photo = await camera.takePhoto()
if (photo) {
  const response = await fetch(photo.uri)
  const blob = await response.blob()
  await upload(blob)
}
```

## Component Props Quick Reference

### ImagePicker

| Prop               | Type     | Default | Description                   |
| ------------------ | -------- | ------- | ----------------------------- |
| maxImages          | number   | 10      | Max images to select          |
| maxSizeMB          | number   | 10      | Max size per image            |
| allowCamera        | boolean  | true    | Enable camera capture         |
| allowGallery       | boolean  | true    | Enable gallery selection      |
| autoCompress       | boolean  | true    | Auto-compress images          |
| compressionQuality | number   | 0.7     | Compression quality           |
| onImagesSelected   | function | -       | Callback with selected images |
| onError            | function | -       | Error callback                |

### VideoPicker

| Prop               | Type     | Default | Description              |
| ------------------ | -------- | ------- | ------------------------ |
| maxDurationSeconds | number   | 300     | Max video duration       |
| maxSizeMB          | number   | 100     | Max file size            |
| allowCamera        | boolean  | true    | Enable video recording   |
| allowGallery       | boolean  | true    | Enable gallery selection |
| allowTrimming      | boolean  | true    | Enable trim UI           |
| onVideoSelected    | function | -       | Callback with video blob |
| onError            | function | -       | Error callback           |

### VoiceRecorder

| Prop                | Type     | Default | Description             |
| ------------------- | -------- | ------- | ----------------------- |
| maxDuration         | number   | 300     | Max recording duration  |
| onRecordingComplete | function | -       | Callback with recording |
| onCancel            | function | -       | Cancel callback         |
| showPreview         | boolean  | true    | Show playback preview   |

### ImageEditor

| Prop        | Type     | Default | Description             |
| ----------- | -------- | ------- | ----------------------- |
| imageUrl    | string   | -       | Image URL to edit       |
| imageFile   | File     | -       | Image file object       |
| onSave      | function | -       | Save callback with blob |
| onCancel    | function | -       | Cancel callback         |
| aspectRatio | number   | -       | Fixed aspect ratio      |

### ImageLazy

| Prop           | Type    | Default | Description                |
| -------------- | ------- | ------- | -------------------------- |
| src            | string  | -       | Image URL                  |
| lowQualitySrc  | string  | -       | LQIP URL                   |
| progressive    | boolean | false   | Enable progressive loading |
| fadeInDuration | number  | 300     | Fade-in duration (ms)      |
| blurAmount     | number  | 10      | Blur amount (px)           |
| alt            | string  | ''      | Alt text                   |

## Compression Presets

```typescript
// Available presets
COMPRESSION_PRESETS = {
  high: { maxWidth: 2048, maxHeight: 2048, quality: 0.85 },
  medium: { maxWidth: 1920, maxHeight: 1920, quality: 0.7 },
  low: { maxWidth: 1280, maxHeight: 1280, quality: 0.5 },
  thumbnail: { maxWidth: 400, maxHeight: 400, quality: 0.6 },
  aggressive: { maxWidth: 1024, maxHeight: 1024, quality: 0.4 },
}

// Usage
const result = await compressImage(file, COMPRESSION_PRESETS.medium)
```

## Permission Statuses

```typescript
type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown'

// Check status
const result = await permissions.checkCameraPermission()
result.status // 'granted' | 'denied' | 'prompt' | 'unknown'
result.canRequest // true if can request permission
```

## Format Support

### Images

- ✅ JPEG, JPG
- ✅ PNG
- ✅ WebP (where supported)
- ✅ HEIC/HEIF (iOS)
- ✅ GIF
- ✅ BMP

### Videos

- ✅ MP4
- ✅ MOV (QuickTime)
- ✅ WebM
- ⚠️ AVI (limited)
- ⚠️ MKV (limited)

### Audio

- ✅ WebM Opus (best compression)
- ✅ Ogg Opus
- ✅ MP4 AAC

## Performance Tips

### Images

1. **Always compress**: Use `smartCompress()` for automatic optimization
2. **Batch wisely**: Limit to 3 concurrent compressions
3. **Target size**: Use `targetSizeKB` for predictable sizes
4. **Check WebP**: Use `supportsWebP()` before converting

### Videos

1. **Validate early**: Check duration/size before loading
2. **Generate thumbnails**: Always create for video messages
3. **Limit duration**: Enforce 5-minute max
4. **Consider server trimming**: Web trimming is CPU-intensive

### Voice Notes

1. **Use Opus**: Best compression ratio
2. **Medium quality**: 64kbps is enough for voice
3. **Show waveform**: Significantly improves UX
4. **Enable pause/resume**: Users appreciate this

### Lazy Loading

1. **Generate LQIP server-side**: Don't generate client-side
2. **Progressive loading**: Use for better perceived performance
3. **50-100px margin**: Preload just before scroll
4. **Clean up**: Disconnect observers on unmount

## Error Handling

```typescript
// Image compression error
try {
  const result = await compressImage(file)
} catch (error) {
  console.error('Compression failed:', error)
  // Fallback: upload original
}

// Permission denied
const status = await permissions.requestCameraPermission()
if (status === 'denied') {
  // Show alert with instructions
  alert('Camera permission required. Please enable in settings.')
}

// Video validation error
const validation = await video.validateVideo(path, 300, 100)
if (!validation.valid) {
  alert(validation.error)
}
```

## Platform-Specific Notes

### Web

- Camera requires HTTPS
- Multi-select works natively
- Video trimming uses MediaRecorder
- Voice recording uses Web Audio API

### iOS

- Native camera integration
- Multi-select requires plugin
- HEIC format support
- Native video trimming requires plugin

### Android

- Native camera integration
- Multi-select requires plugin
- All formats supported
- Native video trimming requires plugin

## File Locations

### Libraries

- `src/lib/media/image-compression.ts`
- `src/lib/capacitor/video.ts`
- `src/lib/capacitor/voice-recording.ts`
- `src/lib/media/lazy-loading.ts`
- `src/lib/capacitor/permissions.ts`

### Components

- `src/components/media/ImagePicker.tsx`
- `src/components/media/VideoPicker.tsx`
- `src/components/media/VoiceRecorder.tsx`
- `src/components/media/ImageEditor.tsx`
- `src/components/chat/ImageLazy.tsx`

### Documentation

- `docs/Media-Features-v0.8.0.md` - Full guide
- `docs/examples/media-usage-examples.tsx` - Complete examples
- `.claude/implementation/media-features-summary.md` - Implementation summary

---

**Quick Links**:

- [Full Documentation](./Media-Features-v0.8.0.md)
- [Usage Examples](./examples/media-usage-examples.tsx)
- [Implementation Summary](../.claude/implementation/media-features-summary.md)
