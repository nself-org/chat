/**
 * File Validation Service
 *
 * Provides comprehensive file validation including:
 * - Size limits based on user tier
 * - MIME type and extension validation
 * - Virus scanning placeholder
 * - EXIF metadata stripping
 */

import { getFileTypeConfig, FILE_SERVICE_CONSTANTS } from './config'
import type { FileTypeConfig } from './types'

import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
  warnings?: string[]
}

export interface FileValidationOptions {
  /** Maximum file size in bytes (overrides config) */
  maxSize?: number
  /** Allowed MIME types (overrides config) */
  allowedTypes?: string[]
  /** Blocked MIME types (overrides config) */
  blockedTypes?: string[]
  /** Allowed extensions (overrides config) */
  allowedExtensions?: string[]
  /** Blocked extensions (overrides config) */
  blockedExtensions?: string[]
  /** Check for executable content */
  checkExecutable?: boolean
  /** User tier for size limits */
  userTier?: 'guest' | 'member' | 'premium' | 'admin'
}

// ============================================================================
// Constants
// ============================================================================

/** Size limits by user tier */
export const SIZE_LIMITS = {
  guest: 5 * 1024 * 1024, // 5MB
  member: 25 * 1024 * 1024, // 25MB
  premium: 100 * 1024 * 1024, // 100MB
  admin: 500 * 1024 * 1024, // 500MB
} as const

/** Dangerous MIME types */
const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-ms-shortcut',
  'application/x-sh',
  'application/x-shellscript',
  'application/bat',
  'application/x-bat',
  'application/cmd',
  'application/x-cmd',
]

/** Dangerous file extensions */
const DANGEROUS_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'msi',
  'scr',
  'pif',
  'vbs',
  'vbe',
  'js',
  'jse',
  'ws',
  'wsf',
  'wsh',
  'ps1',
  'ps1xml',
  'ps2',
  'ps2xml',
  'psc1',
  'psc2',
  'msh',
  'msh1',
  'msh2',
  'mshxml',
  'msh1xml',
  'msh2xml',
  'scf',
  'lnk',
  'inf',
  'reg',
  'dll',
  'cpl',
  'msc',
  'jar',
]

/** Known safe MIME types for common file categories */
export const SAFE_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
    'image/avif',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/ogg',
    'video/3gpp',
    'video/3gpp2',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
    'audio/mp4',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/rtf',
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-bzip2',
  ],
} as const

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a file against configuration and options
 */
export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const config = getFileTypeConfig()
  const warnings: string[] = []

  // Determine max size based on user tier
  const maxSize = options.maxSize || SIZE_LIMITS[options.userTier || 'member']

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatBytes(maxSize)}`,
      errorCode: 'FILE_TOO_LARGE',
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
      errorCode: 'FILE_EMPTY',
    }
  }

  // Get extension
  const extension = getExtension(file.name)

  // Check blocked extensions
  const blockedExtensions =
    options.blockedExtensions || config.blockedExtensions || DANGEROUS_EXTENSIONS
  if (blockedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Files with .${extension} extension are not allowed`,
      errorCode: 'BLOCKED_EXTENSION',
    }
  }

  // Check allowed extensions (if specified)
  const allowedExtensions = options.allowedExtensions || config.allowedExtensions
  if (allowedExtensions && allowedExtensions.length > 0) {
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Only ${allowedExtensions.join(', ')} files are allowed`,
        errorCode: 'EXTENSION_NOT_ALLOWED',
      }
    }
  }

  // Check blocked MIME types
  const blockedTypes = options.blockedTypes || config.blockedMimeTypes || DANGEROUS_MIME_TYPES
  if (blockedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'This file type is not allowed',
      errorCode: 'BLOCKED_MIME_TYPE',
    }
  }

  // Check allowed MIME types (if specified)
  const allowedTypes = options.allowedTypes || config.allowedMimeTypes
  if (allowedTypes && allowedTypes.length > 0) {
    const typeAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'))
      }
      return file.type === type
    })

    if (!typeAllowed) {
      return {
        valid: false,
        error: 'This file type is not allowed',
        errorCode: 'MIME_TYPE_NOT_ALLOWED',
      }
    }
  }

  // Check for executable content
  if (options.checkExecutable !== false) {
    const execCheck = checkExecutableContent(file.type, extension)
    if (!execCheck.valid) {
      return execCheck
    }
  }

  // Add warnings for potentially problematic files
  if (file.type === 'application/octet-stream') {
    warnings.push('File type could not be determined')
  }

  if (file.name.includes('..')) {
    warnings.push('Filename contains path traversal characters')
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Check if file contains executable content
 */
function checkExecutableContent(mimeType: string, extension: string): ValidationResult {
  // Check for dangerous MIME types
  if (DANGEROUS_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Executable files are not allowed',
      errorCode: 'EXECUTABLE_CONTENT',
    }
  }

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: 'Executable files are not allowed',
      errorCode: 'EXECUTABLE_EXTENSION',
    }
  }

  return { valid: true }
}

/**
 * Validate file for image uploads
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number
    allowedFormats?: string[]
    userTier?: 'guest' | 'member' | 'premium' | 'admin'
  } = {}
): ValidationResult {
  const allowedTypes = options.allowedFormats?.map((f) => `image/${f}`) || [
    ...SAFE_MIME_TYPES.image,
  ]

  return validateFile(file, {
    ...options,
    allowedTypes,
    checkExecutable: true,
  })
}

/**
 * Validate file for video uploads
 */
export function validateVideoFile(
  file: File,
  options: {
    maxSize?: number
    allowedFormats?: string[]
    userTier?: 'guest' | 'member' | 'premium' | 'admin'
  } = {}
): ValidationResult {
  const allowedTypes = options.allowedFormats?.map((f) => `video/${f}`) || [
    ...SAFE_MIME_TYPES.video,
  ]

  // Videos typically need larger size limits
  const maxSize = options.maxSize || SIZE_LIMITS[options.userTier || 'member'] * 2

  return validateFile(file, {
    ...options,
    maxSize,
    allowedTypes,
    checkExecutable: true,
  })
}

/**
 * Validate file for document uploads
 */
export function validateDocumentFile(
  file: File,
  options: {
    maxSize?: number
    allowedFormats?: string[]
    userTier?: 'guest' | 'member' | 'premium' | 'admin'
  } = {}
): ValidationResult {
  const allowedTypes = options.allowedFormats || [...SAFE_MIME_TYPES.document]

  return validateFile(file, {
    ...options,
    allowedTypes,
    checkExecutable: true,
  })
}

// ============================================================================
// Virus Scanning Placeholder
// ============================================================================

/**
 * Placeholder for virus scanning
 * In production, integrate with ClamAV or a cloud scanning service
 */
export async function scanFileForViruses(
  file: File | Buffer | ArrayBuffer,
  options: {
    timeout?: number
    scannerUrl?: string
  } = {}
): Promise<{
  scanned: boolean
  clean: boolean
  threats: string[]
  error?: string
}> {
  // Log warning that virus scanning is not available
  logger.warn('[FileValidation] Virus scanning is not configured. File uploaded without scanning.')

  // Return clean result by default
  // In production, this should integrate with a real scanning service
  return {
    scanned: false,
    clean: true,
    threats: [],
    error: 'Virus scanning service not configured',
  }
}

// ============================================================================
// EXIF Stripping
// ============================================================================

/**
 * Strip EXIF metadata from image files
 * This is a placeholder - actual implementation requires image processing library
 */
export async function stripExifMetadata(file: File): Promise<{
  file: File
  stripped: boolean
  originalMetadata?: Record<string, unknown>
  error?: string
}> {
  // Check if file is an image that might contain EXIF
  const exifTypes = ['image/jpeg', 'image/tiff', 'image/heic', 'image/heif']

  if (!exifTypes.includes(file.type)) {
    return {
      file,
      stripped: false,
    }
  }

  // In production, use a library like piexifjs or sharp to strip EXIF
  // For now, return the original file with a warning
  logger.warn('[FileValidation] EXIF stripping is not implemented. Original file returned.')

  return {
    file,
    stripped: false,
    error: 'EXIF stripping not implemented',
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Get MIME type category
 */
export function getMimeCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'

  if (
    SAFE_MIME_TYPES.document.includes(mimeType as any) ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }

  if (
    SAFE_MIME_TYPES.archive.includes(mimeType as any) ||
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('compressed')
  ) {
    return 'archive'
  }

  return 'other'
}

/**
 * Check if MIME type is safe
 */
export function isSafeMimeType(mimeType: string): boolean {
  const allSafe = [
    ...SAFE_MIME_TYPES.image,
    ...SAFE_MIME_TYPES.video,
    ...SAFE_MIME_TYPES.audio,
    ...SAFE_MIME_TYPES.document,
    ...SAFE_MIME_TYPES.archive,
  ]

  return allSafe.includes(mimeType as any) || !DANGEROUS_MIME_TYPES.includes(mimeType)
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^[._-]+/, '') // Remove leading dots, underscores, dashes
    .replace(/[._-]+$/, '') // Remove trailing dots, underscores, dashes
    .substring(0, 200) // Limit length
}

/**
 * Generate safe unique filename
 */
export function generateSafeFilename(originalName: string, fileId: string): string {
  const sanitized = sanitizeFilename(originalName)
  const ext = getExtension(sanitized)

  if (ext) {
    const nameWithoutExt = sanitized.slice(0, -(ext.length + 1))
    return `${fileId}-${nameWithoutExt}.${ext}`
  }

  return `${fileId}-${sanitized}`
}
