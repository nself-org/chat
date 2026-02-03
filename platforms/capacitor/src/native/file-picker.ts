/**
 * File Picker Integration for Capacitor
 * Handles document and media file selection
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

export interface PickedFile {
  uri: string
  name: string
  type: string
  size: number
  base64?: string
}

export interface FilePickerOptions {
  multiple?: boolean
  types?: string[] // MIME types or file extensions
  maxSize?: number // Max file size in bytes
}

class FilePickerService {
  /**
   * Pick a file from the device
   */
  async pickFile(options: FilePickerOptions = {}): Promise<PickedFile | null> {
    try {
      // Note: Capacitor doesn't have a built-in file picker
      // This requires a community plugin like @capacitor-community/file-picker
      // Install: npm install @capacitor-community/file-picker

      // Example implementation:
      // import { FilePicker } from '@capawesome/capacitor-file-picker';
      //
      // const result = await FilePicker.pickFiles({
      //   types: options.types || [],
      //   multiple: false,
      //   readData: true,
      // });
      //
      // if (result.files && result.files.length > 0) {
      //   const file = result.files[0];
      //   return {
      //     uri: file.path || '',
      //     name: file.name,
      //     type: file.mimeType,
      //     size: file.size,
      //     base64: file.data,
      //   };
      // }

      console.log('File picker called with options:', options)
      return null // Placeholder
    } catch (error) {
      console.error('Error picking file:', error)
      return null
    }
  }

  /**
   * Pick multiple files
   */
  async pickFiles(options: FilePickerOptions = {}): Promise<PickedFile[]> {
    try {
      // Example implementation:
      // const result = await FilePicker.pickFiles({
      //   types: options.types || [],
      //   multiple: true,
      //   readData: true,
      // });
      //
      // return result.files.map((file) => ({
      //   uri: file.path || '',
      //   name: file.name,
      //   type: file.mimeType,
      //   size: file.size,
      //   base64: file.data,
      // }));

      console.log('Multiple file picker called with options:', options)
      return [] // Placeholder
    } catch (error) {
      console.error('Error picking files:', error)
      return []
    }
  }

  /**
   * Pick an image file
   */
  async pickImage(): Promise<PickedFile | null> {
    return this.pickFile({
      types: ['image/*'],
    })
  }

  /**
   * Pick a video file
   */
  async pickVideo(): Promise<PickedFile | null> {
    return this.pickFile({
      types: ['video/*'],
    })
  }

  /**
   * Pick an audio file
   */
  async pickAudio(): Promise<PickedFile | null> {
    return this.pickFile({
      types: ['audio/*'],
    })
  }

  /**
   * Pick a document file
   */
  async pickDocument(): Promise<PickedFile | null> {
    return this.pickFile({
      types: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
    })
  }

  /**
   * Read file as text
   */
  async readFileAsText(filepath: string): Promise<string | null> {
    try {
      const contents = await Filesystem.readFile({
        path: filepath,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })

      return contents.data as string
    } catch (error) {
      console.error('Error reading file as text:', error)
      return null
    }
  }

  /**
   * Read file as base64
   */
  async readFileAsBase64(filepath: string): Promise<string | null> {
    try {
      const contents = await Filesystem.readFile({
        path: filepath,
        directory: Directory.Data,
      })

      return contents.data
    } catch (error) {
      console.error('Error reading file as base64:', error)
      return null
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filepath: string): Promise<{ size: number; type: string } | null> {
    try {
      const stat = await Filesystem.stat({
        path: filepath,
        directory: Directory.Data,
      })

      return {
        size: stat.size,
        type: stat.type,
      }
    } catch (error) {
      console.error('Error getting file info:', error)
      return null
    }
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize
  }

  /**
   * Validate file type
   */
  validateFileType(type: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((allowedType) => {
      if (allowedType.endsWith('/*')) {
        const category = allowedType.split('/')[0]
        return type.startsWith(`${category}/`)
      }
      return type === allowedType
    })
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
  }

  /**
   * Get MIME type from extension
   */
  getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',

      // Videos
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',

      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',

      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
    }

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  /**
   * Check if file is an image
   */
  isImage(type: string): boolean {
    return type.startsWith('image/')
  }

  /**
   * Check if file is a video
   */
  isVideo(type: string): boolean {
    return type.startsWith('video/')
  }

  /**
   * Check if file is audio
   */
  isAudio(type: string): boolean {
    return type.startsWith('audio/')
  }

  /**
   * Check if file is a document
   */
  isDocument(type: string): boolean {
    return (
      type === 'application/pdf' ||
      type.includes('word') ||
      type.includes('excel') ||
      type.includes('powerpoint') ||
      type === 'text/plain'
    )
  }
}

// Export singleton instance
export const filePicker = new FilePickerService()
