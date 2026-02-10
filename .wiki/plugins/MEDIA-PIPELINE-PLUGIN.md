# Media Processing Pipeline ɳPlugin

**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3108
**Status**: Production Ready

---

## Overview

Advanced media processing pipeline for images, videos, audio, and documents with transcoding, optimization, and AI-powered features.

## Key Features

- **Image Processing**: Resize, optimize, convert (WebP, AVIF), thumbnails
- **Video Processing**: Transcode, HLS/DASH streaming, thumbnails, captions
- **Audio Processing**: Transcoding, normalization, speech-to-text
- **Document Processing**: PDF extraction, OCR, Office previews
- **AI Features**: NSFW detection, object detection, auto-tagging

## Installation

```bash
cd backend
nself plugin install media-pipeline
```

## Configuration

```bash
# .env.plugins
MEDIA_PIPELINE_ENABLED=true
MEDIA_PIPELINE_PORT=3108
MEDIA_VIDEO_CODEC=h264
MEDIA_HLS_ENABLED=true
MEDIA_NSFW_DETECTION=true
```

## API Endpoints

```typescript
POST /api/media/upload                # Upload file
GET  /api/media/:id/thumbnail         # Get thumbnail
POST /api/media/:id/transcode         # Transcode video
POST /api/media/:id/extract-text      # OCR/text extraction
```

## Supported Formats

### Images

- Input: JPEG, PNG, GIF, WebP, AVIF, HEIC, BMP, TIFF
- Output: WebP (default), AVIF, JPEG, PNG

### Videos

- Input: MP4, MOV, AVI, MKV, WebM, FLV
- Output: H.264/MP4, H.265/MP4, VP9/WebM

### Audio

- Input: MP3, WAV, AAC, FLAC, OGG, M4A
- Output: Opus (default), AAC, MP3

### Documents

- Input: PDF, DOCX, XLSX, PPTX, TXT, MD
- Output: PDF preview, extracted text

## Example Usage

```typescript
import { MediaUploadService } from '@/services/media-v2'

const media = new MediaUploadService()

// Upload and process image
const result = await media.uploadAndProcess(file, {
  resize: { width: 1920, height: 1080 },
  format: 'webp',
  quality: 85,
  thumbnail: true,
})

console.log(result.url) // Original
console.log(result.variants.thumbnail) // Thumbnail URL
```

---

**Full Documentation**: See `/docs/plugins/MEDIA-PIPELINE-PLUGIN.md`
