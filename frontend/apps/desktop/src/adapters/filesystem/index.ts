/**
 * Filesystem Adapter for Desktop
 *
 * Provides file system access using web File System Access API
 * and Electron's shell API
 */

/**
 * Filesystem adapter interface
 */
export interface FilesystemAdapter {
  selectFile(options?: FilePickerOptions): Promise<File | null>
  selectFiles(options?: FilePickerOptions): Promise<File[]>
  selectDirectory(): Promise<FileSystemDirectoryHandle | null>
  saveFile(filename: string, content: Blob | string): Promise<boolean>
  openPath(path: string): Promise<void>
  showInFolder(path: string): Promise<void>
}

/**
 * File picker options
 */
export interface FilePickerOptions {
  accept?: { [key: string]: string[] }
  multiple?: boolean
  description?: string
}

/**
 * Desktop filesystem implementation
 *
 * @example
 * ```typescript
 * import { desktopFilesystem } from '@/adapters/filesystem'
 *
 * // Select single file
 * const file = await desktopFilesystem.selectFile({
 *   accept: { 'image/*': ['.png', '.jpg', '.gif'] }
 * })
 *
 * // Select multiple files
 * const files = await desktopFilesystem.selectFiles()
 *
 * // Save file
 * await desktopFilesystem.saveFile('export.json', jsonData)
 *
 * // Show file in folder (Electron)
 * await desktopFilesystem.showInFolder('/path/to/file.txt')
 * ```
 */
export const desktopFilesystem: FilesystemAdapter = {
  /**
   * Select a single file
   */
  async selectFile(options?: FilePickerOptions): Promise<File | null> {
    try {
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: options?.accept
            ? [
                {
                  description: options.description ?? 'Files',
                  accept: options.accept,
                },
              ]
            : undefined,
          multiple: false,
        })

        return fileHandle ? await fileHandle.getFile() : null
      }

      // Fallback to input element
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        if (options?.accept) {
          input.accept = Object.values(options.accept).flat().join(',')
        }
        input.onchange = () => {
          resolve(input.files?.[0] ?? null)
        }
        input.click()
      })
    } catch (error) {
      console.error('[Filesystem] Error selecting file:', error)
      return null
    }
  },

  /**
   * Select multiple files
   */
  async selectFiles(options?: FilePickerOptions): Promise<File[]> {
    try {
      if ('showOpenFilePicker' in window) {
        const fileHandles = await (window as any).showOpenFilePicker({
          types: options?.accept
            ? [
                {
                  description: options.description ?? 'Files',
                  accept: options.accept,
                },
              ]
            : undefined,
          multiple: true,
        })

        const files: File[] = []
        for (const handle of fileHandles) {
          files.push(await handle.getFile())
        }
        return files
      }

      // Fallback to input element
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        if (options?.accept) {
          input.accept = Object.values(options.accept).flat().join(',')
        }
        input.onchange = () => {
          resolve(Array.from(input.files ?? []))
        }
        input.click()
      })
    } catch (error) {
      console.error('[Filesystem] Error selecting files:', error)
      return []
    }
  },

  /**
   * Select a directory
   */
  async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if ('showDirectoryPicker' in window) {
        return await (window as any).showDirectoryPicker()
      }
      return null
    } catch (error) {
      console.error('[Filesystem] Error selecting directory:', error)
      return null
    }
  },

  /**
   * Save a file
   */
  async saveFile(filename: string, content: Blob | string): Promise<boolean> {
    try {
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
        })

        const writable = await fileHandle.createWritable()
        if (typeof content === 'string') {
          await writable.write(content)
        } else {
          await writable.write(content)
        }
        await writable.close()
        return true
      }

      // Fallback to download
      const blob = typeof content === 'string' ? new Blob([content]) : content
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('[Filesystem] Error saving file:', error)
      return false
    }
  },

  /**
   * Open path in system default application
   */
  async openPath(path: string): Promise<void> {
    try {
      if (window.desktop) {
        window.desktop.shell.openExternal(path)
      }
    } catch (error) {
      console.error('[Filesystem] Error opening path:', error)
    }
  },

  /**
   * Show item in folder (Electron only)
   */
  async showInFolder(path: string): Promise<void> {
    try {
      if (window.desktop) {
        window.desktop.shell.showItemInFolder(path)
      }
    } catch (error) {
      console.error('[Filesystem] Error showing in folder:', error)
    }
  },
}

/**
 * Filesystem helper functions
 */
export const filesystemHelpers = {
  /**
   * Read file as text
   */
  async readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  },

  /**
   * Read file as data URL
   */
  async readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  /**
   * Read file as array buffer
   */
  async readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  },
}

export default desktopFilesystem
