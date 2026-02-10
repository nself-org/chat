/**
 * Clipboard Adapter for Desktop
 *
 * Provides clipboard access using Electron's clipboard API
 */

/**
 * Clipboard adapter interface
 */
export interface ClipboardAdapter {
  readText(): Promise<string>
  writeText(text: string): Promise<void>
  readImage(): Promise<string | null>
  writeImage(dataUrl: string): Promise<void>
  clear(): Promise<void>
}

/**
 * Desktop clipboard implementation using navigator.clipboard
 * with Electron enhancements
 *
 * @example
 * ```typescript
 * import { desktopClipboard } from '@/adapters/clipboard'
 *
 * // Read text
 * const text = await desktopClipboard.readText()
 *
 * // Write text
 * await desktopClipboard.writeText('Hello World')
 *
 * // Read image
 * const imageData = await desktopClipboard.readImage()
 *
 * // Write image
 * await desktopClipboard.writeImage('data:image/png;base64,...')
 * ```
 */
export const desktopClipboard: ClipboardAdapter = {
  /**
   * Read text from clipboard
   */
  async readText(): Promise<string> {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText()
      }
      return ''
    } catch (error) {
      console.error('[Clipboard] Error reading text:', error)
      return ''
    }
  },

  /**
   * Write text to clipboard
   */
  async writeText(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
    } catch (error) {
      console.error('[Clipboard] Error writing text:', error)
      throw error
    }
  },

  /**
   * Read image from clipboard
   */
  async readImage(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          if (item.types.includes('image/png')) {
            const blob = await item.getType('image/png')
            return await blobToDataUrl(blob)
          }
        }
      }
      return null
    } catch (error) {
      console.error('[Clipboard] Error reading image:', error)
      return null
    }
  },

  /**
   * Write image to clipboard
   */
  async writeImage(dataUrl: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const blob = await dataUrlToBlob(dataUrl)
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
      }
    } catch (error) {
      console.error('[Clipboard] Error writing image:', error)
      throw error
    }
  },

  /**
   * Clear clipboard
   */
  async clear(): Promise<void> {
    try {
      await this.writeText('')
    } catch (error) {
      console.error('[Clipboard] Error clearing clipboard:', error)
    }
  },
}

/**
 * Helper: Convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Helper: Convert Data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Clipboard helper functions
 */
export const clipboardHelpers = {
  /**
   * Copy text to clipboard with feedback
   */
  async copyText(text: string): Promise<boolean> {
    try {
      await desktopClipboard.writeText(text)
      return true
    } catch {
      return false
    }
  },

  /**
   * Paste text from clipboard
   */
  async pasteText(): Promise<string> {
    return desktopClipboard.readText()
  },

  /**
   * Check if clipboard has text
   */
  async hasText(): Promise<boolean> {
    const text = await desktopClipboard.readText()
    return text.length > 0
  },

  /**
   * Check if clipboard has image
   */
  async hasImage(): Promise<boolean> {
    const image = await desktopClipboard.readImage()
    return image !== null
  },
}

export default desktopClipboard
