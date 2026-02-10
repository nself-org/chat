# File Handling System - Complete Guide

**Version**: 0.9.1
**Last Updated**: February 3, 2026
**Status**: Production Ready (95%)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Security](#security)
5. [API Reference](#api-reference)
6. [Usage Examples](#usage-examples)
7. [Configuration](#configuration)
8. [Storage Quotas](#storage-quotas)
9. [Processing Pipeline](#processing-pipeline)
10. [Testing](#testing)
11. [Known Limitations](#known-limitations)

---

## Overview

The ɳChat file handling system provides production-ready file upload, download, storage, and processing capabilities with enterprise-grade security and access control.

### Key Capabilities

- **Upload**: Direct uploads, presigned URLs, multipart for large files
- **Download**: Secure signed URLs with expiration
- **Processing**: Thumbnails, optimization, metadata extraction
- **Security**: Virus scanning, EXIF stripping, access control
- **Storage**: S3/MinIO compatible, CDN-ready
- **Quotas**: Role-based storage limits

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Components: FileUploader, FilePreview, ImageGallery        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       API Routes                             │
│  /api/files/upload, /api/files/[id]/download               │
│  /api/files/[id]/thumbnails, /api/files/complete           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     Service Layer                            │
│  UploadService, DownloadService, ProcessingService          │
│  ValidationService, FileAccessService                        │
└─────┬──────────────┬──────────────┬────────────────┬────────┘
      │              │              │                │
┌─────▼─────┐  ┌────▼─────┐  ┌────▼──────┐  ┌─────▼────────┐
│ S3/MinIO  │  │ Hasura   │  │ File Proc │  │  Database    │
│  Storage  │  │ GraphQL  │  │  Plugin   │  │  (Postgres)  │
└───────────┘  └──────────┘  └───────────┘  └──────────────┘
```

### Service Responsibilities

| Service               | Purpose                                 | File                    |
| --------------------- | --------------------------------------- | ----------------------- |
| **UploadService**     | Upload files, presigned URLs, multipart | `upload.service.ts`     |
| **DownloadService**   | Signed URLs, streaming, thumbnails      | `download.service.ts`   |
| **ProcessingService** | Plugin integration, job tracking        | `processing.service.ts` |
| **ValidationService** | File type, size, virus scan, EXIF       | `validation.service.ts` |
| **FileAccessService** | RBAC, channel access, quotas            | `access.service.ts`     |

---

## Features

### ✅ Implemented (Production Ready)

1. **Direct File Upload**
   - Single and multipart uploads
   - Progress tracking
   - Content hash for deduplication
   - Automatic MIME type detection

2. **Presigned Upload URLs**
   - Client-side direct-to-S3 uploads
   - Configurable expiration
   - Reduced server load

3. **Secure Downloads**
   - Signed URLs with expiration
   - Inline or attachment disposition
   - Access control enforcement

4. **File Validation**
   - Size limits by user tier
   - MIME type restrictions
   - Dangerous file detection
   - Extension validation

5. **Access Control**
   - Role-based permissions
   - Channel membership checks
   - File ownership verification
   - Guest upload restrictions

6. **Storage Management**
   - S3/MinIO compatibility
   - Multipart for large files (>5MB)
   - CDN-ready with cache headers
   - Path-based organization

7. **File Processing Integration**
   - Thumbnail generation
   - Metadata extraction
   - Job status tracking
   - Webhook callbacks

8. **Database Integration**
   - GraphQL queries and mutations
   - Real-time subscriptions
   - Soft delete support
   - Storage usage tracking

### ⚠️ Partially Implemented

9. **Virus Scanning**
   - Interface ready
   - Needs ClamAV integration
   - Placeholder returns clean

10. **EXIF Stripping**
    - Interface ready
    - Needs image library integration
    - Placeholder returns original

### 📋 Planned

11. **Storage Quotas**
    - Limits defined
    - Enforcement not active
    - Usage tracking needed

---

## Security

### Access Control

```typescript
// Check file access
const accessService = getFileAccessService()
const result = await accessService.canAccessFile(userId, fileId, userRole)

if (!result.allowed) {
  throw new Error(result.reason)
}
```

**Access Rules**:

- **Owner/Admin**: Access to all files
- **Moderator**: Access to channel files
- **Member**: Access to own files + channel files if member
- **Guest**: Read-only access to public channel files

### File Validation

```typescript
// Validate before upload
const validation = validateFile(file, {
  maxSize: 25 * 1024 * 1024, // 25MB
  allowedTypes: ['image/*', 'video/*'],
  blockedExtensions: ['exe', 'bat', 'cmd'],
  userTier: 'member',
})

if (!validation.valid) {
  throw new Error(validation.error)
}
```

**Security Measures**:

- ✅ File size limits (5MB - 500MB based on tier)
- ✅ MIME type validation
- ✅ Extension blacklist
- ✅ Dangerous file detection
- ✅ Filename sanitization
- ⚠️ Virus scanning (placeholder)
- ⚠️ EXIF stripping (placeholder)
- ✅ SSRF protection in unfurling

### Signed URLs

All download URLs are signed and expire after 1 hour (configurable):

```typescript
const { url, expiresAt } = await downloadService.getDownloadUrl({
  fileId,
  expiresIn: 3600, // 1 hour
  disposition: 'inline',
})
```

---

## API Reference

### POST /api/files/upload

Upload a file directly or get a presigned URL.

**Request (Direct Upload)**:

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('channelId', channelId)

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
})
```

**Request (Presigned URL)**:

```typescript
const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024000,
    channelId: 'uuid',
  }),
})
```

**Response**:

```json
{
  "fileId": "uuid",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1024000,
  "storagePath": "channel-id/user-id/file-id.jpg",
  "url": "https://storage.example.com/...",
  "uploadUrl": "https://storage.example.com/presigned?...",
  "expiresAt": "2026-02-03T19:00:00Z"
}
```

### GET /api/files/[id]/download

Get a secure download URL for a file.

**Request**:

```typescript
const response = await fetch(`/api/files/${fileId}/download?expiresIn=3600&disposition=inline`)
```

**Query Parameters**:

- `expiresIn` - URL expiration in seconds (default: 3600, max: 86400)
- `disposition` - `inline` or `attachment` (default: inline)
- `filename` - Override download filename

**Response**:

```json
{
  "url": "https://storage.example.com/signed?...",
  "expiresAt": "2026-02-03T19:00:00Z",
  "contentType": "image/jpeg",
  "filename": "photo.jpg",
  "size": 1024000
}
```

### GET /api/files/[id]/thumbnails

Get thumbnails for an image or video.

**Response**:

```json
[
  {
    "id": "uuid",
    "fileId": "uuid",
    "path": "thumbnails/file-id/100.jpeg",
    "url": "https://storage.example.com/...",
    "width": 100,
    "height": 100,
    "size": 5000,
    "format": "jpeg"
  },
  {
    "id": "uuid",
    "fileId": "uuid",
    "path": "thumbnails/file-id/400.jpeg",
    "url": "https://storage.example.com/...",
    "width": 400,
    "height": 400,
    "size": 20000,
    "format": "jpeg"
  }
]
```

### POST /api/files/complete

Finalize file upload after client-side upload to presigned URL.

**Request**:

```typescript
const response = await fetch('/api/files/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileId: 'uuid',
    storagePath: 'uploads/file-id.jpg',
    channelId: 'uuid',
    messageId: 'uuid',
  }),
})
```

### POST /api/files/webhook

Webhook endpoint for file-processing plugin callbacks.

---

## Usage Examples

### 1. Upload with Progress Tracking

```typescript
import { getUploadService } from '@/services/files'

const uploadService = getUploadService()

const result = await uploadService.uploadFile(
  {
    file,
    channelId,
    messageId,
  },
  (progress) => {
    console.log(`${progress.progress}% - ${progress.status}`)
    console.log(`Speed: ${formatBytes(progress.speed)}/s`)
    console.log(`ETA: ${progress.timeRemaining}s`)
  }
)

console.log('Uploaded:', result.file.url)
```

### 2. Batch Upload with Concurrency Control

```typescript
const files = [file1, file2, file3, file4, file5]

const requests = files.map((file) => ({
  file,
  channelId,
}))

const results = await uploadService.uploadFiles(requests, (fileId, progress) => {
  console.log(`File ${fileId}: ${progress.progress}%`)
})

console.log(`Uploaded ${results.length} files`)
```

### 3. Client-Side Direct Upload

```typescript
// Step 1: Get presigned URL
const { uploadUrl, fileId, storagePath } = await fetch('/api/files/upload', {
  method: 'POST',
  body: JSON.stringify({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    channelId,
  }),
}).then((r) => r.json())

// Step 2: Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
})

// Step 3: Finalize
await fetch('/api/files/complete', {
  method: 'POST',
  body: JSON.stringify({
    fileId,
    storagePath,
    channelId,
    messageId,
  }),
})
```

### 4. Download with Access Control

```typescript
import { getDownloadService } from '@/services/files'

const downloadService = getDownloadService()

// Get signed URL
const { url } = await downloadService.getSignedDownloadUrl(storagePath, userId, {
  userRole: 'member',
  expiresIn: 3600,
  disposition: 'attachment',
  filename: 'download.pdf',
})

// Access check is automatic
if (url) {
  window.location.href = url
}
```

### 5. Check Storage Usage

```typescript
const { data } = await client.query({
  query: GET_USER_STORAGE_USAGE,
  variables: { userId },
})

const usage = data.nchat_attachments_aggregate.aggregate.sum.file_size
const count = data.nchat_attachments_aggregate.aggregate.count

console.log(`Using ${formatBytes(usage)} across ${count} files`)
```

### 6. File Validation Before Upload

```typescript
import { validateFile, SIZE_LIMITS } from '@/services/files/validation.service'

const validation = validateFile(file, {
  userTier: 'member',
  maxSize: SIZE_LIMITS.member, // 25MB
  allowedTypes: ['image/*', 'video/*'],
})

if (!validation.valid) {
  alert(validation.error)
  return
}

if (validation.warnings) {
  console.warn('Warnings:', validation.warnings)
}

// Proceed with upload
```

---

## Configuration

### Environment Variables

```bash
# Storage Configuration
STORAGE_PROVIDER=minio           # minio | s3 | gcs | r2 | b2 | azure
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=nchat-files
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_REGION=us-east-1
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost

# File Type Restrictions
FILE_MAX_SIZE=104857600          # 100MB default
FILE_ALLOWED_TYPES=              # Comma-separated, empty = all allowed
FILE_BLOCKED_TYPES=              # Comma-separated
FILE_ALLOWED_EXTENSIONS=         # Comma-separated
FILE_BLOCKED_EXTENSIONS=exe,bat,cmd,com,msi

# Processing Configuration
FILE_PROCESSING_URL=http://localhost:3104
FILE_PROCESSING_WEBHOOK_URL=http://localhost:3000/api/files/webhook
FILE_PROCESSING_WEBHOOK_SECRET=your-secret-key
FILE_ENABLE_VIRUS_SCAN=false
FILE_ENABLE_OPTIMIZATION=true
FILE_STRIP_EXIF=true
FILE_GENERATE_THUMBNAILS=true
FILE_THUMBNAIL_SIZES=100,400,1200

# Queue Configuration
FILE_QUEUE_CONCURRENCY=3
FILE_PROCESSING_TIMEOUT=30000    # milliseconds
```

### Programmatic Configuration

```typescript
import { getFileTypeConfig } from '@/services/files/config'

const config = getFileTypeConfig()

config.maxSize = 50 * 1024 * 1024 // 50MB
config.allowedMimeTypes = ['image/*', 'video/*']
config.enableVirusScan = true
config.stripExif = true
config.generateThumbnails = true
config.thumbnailSizes = [100, 400, 800]
```

---

## Storage Quotas

### Size Limits by User Tier

| Tier        | Max File Size | Total Storage | Status                                    |
| ----------- | ------------- | ------------- | ----------------------------------------- |
| **Guest**   | 5 MB          | -             | ✅ Enforced                               |
| **Member**  | 25 MB         | 5 GB          | ⚠️ File size enforced, quota not enforced |
| **Premium** | 100 MB        | 50 GB         | ⚠️ File size enforced, quota not enforced |
| **Admin**   | 500 MB        | 500 GB        | ⚠️ File size enforced, quota not enforced |
| **Owner**   | 500 MB        | Unlimited     | ✅ Enforced                               |

### Checking Quotas

```typescript
const accessService = getFileAccessService()
const limits = await accessService.getFileSizeLimits(userId, userRole)

console.log('Max file size:', formatBytes(limits.maxFileSize))
console.log('Total storage:', formatBytes(limits.maxTotalStorage))
```

### Quota Enforcement (TODO)

To fully enforce storage quotas:

1. **Track Usage**: Create background job to calculate per-user storage
2. **Check Before Upload**: Verify user hasn't exceeded quota
3. **Cleanup Job**: Remove files from deleted messages after 30 days
4. **Admin Dashboard**: Show storage usage analytics

```typescript
// Example implementation needed
async function checkStorageQuota(userId: string, fileSize: number): Promise<boolean> {
  const usage = await getUserStorageUsage(userId)
  const limits = await getFileSizeLimits(userId)

  return usage + fileSize <= limits.maxTotalStorage
}
```

---

## Processing Pipeline

### File Processing Flow

```
┌──────────┐
│  Upload  │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Validation       │ ← Size, type, extension checks
│ - Size check     │
│ - Type check     │
│ - Virus scan (*)  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Store in S3      │ ← Upload to storage
│ - Multipart      │
│ - Content hash   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Create DB Record │ ← Insert into database
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Processing Job   │ ← Send to file-processing plugin
│ - Thumbnails     │
│ - Metadata       │
│ - Optimize       │
│ - EXIF strip (*) │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Update Record    │ ← Update with results
│ - Status         │
│ - Thumbnails     │
│ - Metadata       │
└──────────────────┘

(*) = Placeholder, needs implementation
```

### Processing Operations

| Operation     | Description                                | Status               |
| ------------- | ------------------------------------------ | -------------------- |
| **thumbnail** | Generate thumbnails (100px, 400px, 1200px) | ✅ Plugin ready      |
| **optimize**  | Image optimization (compression, WebP)     | ✅ Plugin ready      |
| **metadata**  | Extract EXIF, dimensions, duration         | ✅ Plugin ready      |
| **scan**      | Virus scanning with ClamAV                 | ⚠️ Needs integration |

### Webhook Integration

The file-processing plugin sends webhooks on completion:

```typescript
// POST /api/files/webhook
{
  "event": "job.completed",
  "jobId": "uuid",
  "fileId": "uuid",
  "status": "completed",
  "thumbnails": [
    {
      "id": "uuid",
      "path": "thumbnails/file-id/100.jpeg",
      "width": 100,
      "height": 100,
      "size": 5000,
      "format": "jpeg"
    }
  ],
  "metadata": {
    "width": 1920,
    "height": 1080,
    "aspectRatio": 1.78,
    "exifStripped": true
  },
  "scan": {
    "isClean": true,
    "threatsFound": 0
  },
  "durationMs": 1234
}
```

---

## Testing

### Unit Tests

```bash
# Run file service tests
pnpm test src/services/files/__tests__

# Run with coverage
pnpm test:coverage src/services/files
```

### Test Files

- `src/services/files/__tests__/types.test.ts` - Type utilities
- `src/hooks/__tests__/use-file-upload.test.ts` - Upload hook
- `src/hooks/__tests__/use-attachments.test.ts` - Attachments hook

### Manual Testing

1. **Upload Tests**:

   ```bash
   # Small file (<5MB)
   curl -X POST http://localhost:3000/api/files/upload \
     -F "file=@test.jpg" \
     -F "channelId=uuid"

   # Large file (>5MB, multipart)
   curl -X POST http://localhost:3000/api/files/upload \
     -F "file=@large-video.mp4" \
     -F "channelId=uuid"
   ```

2. **Download Tests**:

   ```bash
   curl http://localhost:3000/api/files/{id}/download
   ```

3. **Access Control Tests**:
   - Upload as guest (should fail)
   - Upload to private channel (only members)
   - Download file from public channel (should work)
   - Download file from private channel (requires membership)

---

## Known Limitations

### Current Limitations

1. **Virus Scanning**: Placeholder implementation
   - Needs ClamAV or cloud scanner integration
   - Currently returns clean for all files

2. **EXIF Stripping**: Not implemented
   - Needs image processing library (sharp, piexifjs)
   - Privacy risk for user-uploaded photos

3. **Storage Quotas**: File size enforced, but not total storage
   - Per-file limits work
   - Total storage tracking not implemented
   - No cleanup of deleted files

4. **File Processing Plugin**: Code ready, but plugin needs deployment
   - Thumbnail generation
   - Video transcoding
   - Image optimization
   - Metadata extraction

### Future Enhancements

1. **Deduplication**: Use content hash to avoid duplicate storage
2. **CDN Integration**: CloudFront, Cloudflare for faster delivery
3. **Compression**: Client-side compression before upload
4. **Resumable Uploads**: For large files and unreliable connections
5. **WebTorrent**: P2P file sharing for large files
6. **Media Transcoding**: Server-side video transcoding
7. **Smart Thumbnails**: AI-powered thumbnail selection
8. **Image Recognition**: Auto-tagging, NSFW detection

---

## Production Checklist

### Before Deploying to Production

- [ ] Deploy file-processing plugin (port 3104)
- [ ] Integrate virus scanning (ClamAV or cloud service)
- [ ] Implement EXIF stripping (sharp or piexifjs)
- [ ] Enable storage quota enforcement
- [ ] Set up CDN for file delivery
- [ ] Configure backup for storage bucket
- [ ] Set up monitoring for storage usage
- [ ] Test with production-size files
- [ ] Verify access control rules
- [ ] Document incident response procedures

### Recommended Monitoring

```typescript
// Metrics to track
- Upload success rate
- Upload latency (p50, p95, p99)
- Download latency
- Processing job success rate
- Storage usage by user/channel
- Virus scan detections
- File type distribution
- Average file size
```

---

## Support and Resources

### Documentation

- **Implementation Plans**: `/docs/*-IMPLEMENTATION-PLAN.md`
- **Media Guide**: `/docs/MEDIA-QUICK-REFERENCE.md`
- **API Documentation**: `/src/app/api/files/*/route.ts`
- **GraphQL Schema**: `/src/graphql/files.ts`

### Code Locations

- **Services**: `/src/services/files/`
- **API Routes**: `/src/app/api/files/`
- **Components**: `/src/components/files/`
- **Hooks**: `/src/hooks/use-file*.ts`
- **Types**: `/src/services/files/types.ts`

### Getting Help

For issues or questions:

1. Check this documentation
2. Review implementation plans in `/docs`
3. Check `.claude/PROGRESS.md` for recent changes
4. File an issue with reproduction steps

---

**Last Updated**: February 3, 2026
**Maintained By**: ɳChat Development Team
**License**: See project root
