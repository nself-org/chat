/**
 * Upload API Route
 *
 * Handles file upload initialization and presigned URL generation.
 * Supports direct upload and presigned URL workflows for MinIO/S3.
 *
 * @endpoint POST /api/upload - Initialize upload and get presigned URL
 * @endpoint GET /api/upload - Get upload service status
 *
 * @example
 * ```typescript
 * // Initialize upload
 * const response = await fetch('/api/upload', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     filename: 'document.pdf',
 *     contentType: 'application/pdf',
 *     size: 1024000
 *   })
 * })
 * const { data } = await response.json()
 * // { uploadUrl, fileId, expiresAt }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '@/lib/api/response'
import {
  withErrorHandler,
  withRateLimit,
  withOptionalAuth,
  getAuthenticatedUser,
  compose,
  ApiError,
} from '@/lib/api/middleware'
// ============================================================================
// File Type Utilities (duplicated from client-side to avoid nhost import)
// ============================================================================

/** Maximum file size in bytes (default: 50MB) */
const MAX_FILE_SIZE = 50 * 1024 * 1024

/** Allowed MIME types by category */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  videos: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',
  ],
  code: [
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'application/json',
    'text/html',
    'text/css',
    'text/xml',
    'application/xml',
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-cpp',
  ],
} as const

/** All allowed MIME types */
const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.videos,
  ...ALLOWED_MIME_TYPES.audio,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.archives,
  ...ALLOWED_MIME_TYPES.code,
]

/**
 * Get file category based on MIME type
 */
function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other' {
  if (ALLOWED_MIME_TYPES.images.includes(mimeType as never)) return 'image'
  if (ALLOWED_MIME_TYPES.videos.includes(mimeType as never)) return 'video'
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType as never)) return 'audio'
  if (ALLOWED_MIME_TYPES.documents.includes(mimeType as never)) return 'document'
  if (ALLOWED_MIME_TYPES.archives.includes(mimeType as never)) return 'archive'
  if (ALLOWED_MIME_TYPES.code.includes(mimeType as never)) return 'code'
  return 'other'
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // MinIO/S3 configuration
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL || 'http://storage.localhost',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'nchat-uploads',

  // Presigned URL expiry (15 minutes)
  PRESIGNED_URL_EXPIRY: 15 * 60,

  // Max file size limits by type
  MAX_SIZE_BY_TYPE: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 50 * 1024 * 1024, // 50MB
    archive: 100 * 1024 * 1024, // 100MB
    code: 10 * 1024 * 1024, // 10MB
    other: 25 * 1024 * 1024, // 25MB
  } as Record<string, number>,

  // Rate limiting
  RATE_LIMIT: {
    limit: 30, // 30 uploads per minute
    window: 60,
  },
}

// ============================================================================
// Types
// ============================================================================

interface UploadInitRequest {
  filename: string
  contentType: string
  size: number
  channelId?: string
  messageId?: string
}

interface UploadInitResponse {
  fileId: string
  uploadUrl: string
  method: 'PUT' | 'POST'
  headers?: Record<string, string>
  expiresAt: string
  bucket: string
  key: string
}

// In-memory pending uploads store (in production, use Redis or database)
const pendingUploads = new Map<
  string,
  {
    fileId: string
    filename: string
    contentType: string
    size: number
    userId?: string
    channelId?: string
    messageId?: string
    createdAt: number
    expiresAt: number
  }
>()

// Clean up expired pending uploads periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, upload] of pendingUploads.entries()) {
    if (now > upload.expiresAt) {
      pendingUploads.delete(key)
    }
  }
}, 60000) // Every minute

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate file metadata
 */
function validateUploadRequest(
  body: UploadInitRequest
): { valid: true } | { valid: false; error: string; code: string } {
  const { filename, contentType, size } = body

  // Check required fields
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Filename is required', code: 'MISSING_FILENAME' }
  }

  if (!contentType || typeof contentType !== 'string') {
    return { valid: false, error: 'Content type is required', code: 'MISSING_CONTENT_TYPE' }
  }

  if (!size || typeof size !== 'number' || size <= 0) {
    return { valid: false, error: 'Valid file size is required', code: 'INVALID_SIZE' }
  }

  // Check file type
  if (!ALL_ALLOWED_MIME_TYPES.includes(contentType)) {
    return {
      valid: false,
      error: `File type "${contentType}" is not allowed`,
      code: 'INVALID_FILE_TYPE',
    }
  }

  // Check file size
  const category = getFileCategory(contentType)
  const maxSize = CONFIG.MAX_SIZE_BY_TYPE[category] || MAX_FILE_SIZE

  if (size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(size)}) exceeds maximum (${formatFileSize(maxSize)}) for ${category} files`,
      code: 'FILE_TOO_LARGE',
    }
  }

  // Validate filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (sanitizedFilename.length > 255) {
    return { valid: false, error: 'Filename is too long', code: 'FILENAME_TOO_LONG' }
  }

  return { valid: true }
}

/**
 * Generate a unique file key for storage
 */
function generateFileKey(fileId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `uploads/${year}/${month}/${day}/${fileId}${ext ? `.${ext}` : ''}`
}

/**
 * Generate presigned URL for upload (mock implementation)
 * In production, this would call MinIO/S3 SDK
 */
async function generatePresignedUrl(
  bucket: string,
  key: string,
  contentType: string,
  expirySeconds: number
): Promise<{ url: string; method: 'PUT' | 'POST'; headers?: Record<string, string> }> {
  // In a real implementation, this would use the MinIO/S3 SDK:
  // const url = await minioClient.presignedPutObject(bucket, key, expirySeconds)

  // Mock implementation for development
  const baseUrl = CONFIG.STORAGE_URL
  const url = `${baseUrl}/v1/files/${bucket}/${encodeURIComponent(key)}?presigned=true&expires=${expirySeconds}`

  return {
    url,
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
  }
}

/**
 * Store pending upload metadata
 */
function storePendingUpload(data: {
  fileId: string
  filename: string
  contentType: string
  size: number
  userId?: string
  channelId?: string
  messageId?: string
}): void {
  const now = Date.now()
  const expiresAt = now + CONFIG.PRESIGNED_URL_EXPIRY * 1000

  pendingUploads.set(data.fileId, {
    ...data,
    createdAt: now,
    expiresAt,
  })
}

/**
 * Get pending upload by file ID
 */
export function getPendingUpload(fileId: string) {
  return pendingUploads.get(fileId)
}

/**
 * Remove pending upload
 */
export function removePendingUpload(fileId: string): boolean {
  return pendingUploads.delete(fileId)
}

// ============================================================================
// GET Handler - Service Status
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  return successResponse({
    service: 'upload',
    status: 'available',
    config: {
      maxFileSize: formatFileSize(MAX_FILE_SIZE),
      allowedTypes: Object.keys(ALLOWED_MIME_TYPES),
      presignedUrlExpiry: CONFIG.PRESIGNED_URL_EXPIRY,
    },
    limits: Object.entries(CONFIG.MAX_SIZE_BY_TYPE).map(([type, size]) => ({
      type,
      maxSize: formatFileSize(size),
    })),
  })
}

// ============================================================================
// POST Handler - Initialize Upload
// ============================================================================

async function handleUploadInit(request: NextRequest): Promise<NextResponse> {
  // Get authenticated user (optional for some uploads)
  const user = await getAuthenticatedUser(request)

  // Parse request body
  let body: UploadInitRequest

  try {
    body = await request.json()
  } catch {
    return badRequestResponse('Invalid JSON body', 'INVALID_JSON')
  }

  // Validate request
  const validation = validateUploadRequest(body)
  if (!validation.valid) {
    const errorResult = validation as { valid: false; error: string; code: string }
    return badRequestResponse(errorResult.error, errorResult.code)
  }

  const { filename, contentType, size, channelId, messageId } = body

  // Generate file ID and key
  const fileId = randomUUID()
  const key = generateFileKey(fileId, filename)

  try {
    // Generate presigned URL
    const presigned = await generatePresignedUrl(
      CONFIG.STORAGE_BUCKET,
      key,
      contentType,
      CONFIG.PRESIGNED_URL_EXPIRY
    )

    // Store pending upload
    storePendingUpload({
      fileId,
      filename,
      contentType,
      size,
      userId: user?.id,
      channelId,
      messageId,
    })

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + CONFIG.PRESIGNED_URL_EXPIRY * 1000).toISOString()

    const response: UploadInitResponse = {
      fileId,
      uploadUrl: presigned.url,
      method: presigned.method,
      headers: presigned.headers,
      expiresAt,
      bucket: CONFIG.STORAGE_BUCKET,
      key,
    }

    return successResponse(response, { status: 201 })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return internalErrorResponse('Failed to initialize upload')
  }
}

// Apply middleware and export
export const POST = compose(
  withErrorHandler,
  withRateLimit(CONFIG.RATE_LIMIT)
)(handleUploadInit)

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
