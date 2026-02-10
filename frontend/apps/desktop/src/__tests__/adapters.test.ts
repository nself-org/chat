/**
 * Desktop Adapter Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  desktopStorage,
  typedStorage,
  desktopNotifications,
  desktopClipboard,
  desktopFilesystem,
} from '../adapters'

// Mock electron-store
jest.mock('electron-store', () => {
  const store: Record<string, any> = {}
  return jest.fn().mockImplementation(() => ({
    get: (key: string) => store[key],
    set: (key: string, value: any) => {
      store[key] = value
    },
    delete: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key])
    },
    store,
  }))
})

describe('Storage Adapter', () => {
  beforeEach(() => {
    desktopStorage.clear()
  })

  it('should store and retrieve a string', () => {
    desktopStorage.setItem('test_key', 'test_value')
    const value = desktopStorage.getItem('test_key')
    expect(value).toBe('test_value')
  })

  it('should return null for non-existent key', () => {
    const value = desktopStorage.getItem('nonexistent')
    expect(value).toBe(null)
  })

  it('should remove an item', () => {
    desktopStorage.setItem('test_key', 'test_value')
    desktopStorage.removeItem('test_key')
    const value = desktopStorage.getItem('test_key')
    expect(value).toBe(null)
  })

  it('should clear all items', () => {
    desktopStorage.setItem('key1', 'value1')
    desktopStorage.setItem('key2', 'value2')
    desktopStorage.clear()
    expect(desktopStorage.keys()).toHaveLength(0)
  })

  it('should get all keys', () => {
    desktopStorage.setItem('key1', 'value1')
    desktopStorage.setItem('key2', 'value2')
    const keys = desktopStorage.keys()
    expect(keys).toHaveLength(2)
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
  })

  it('should handle JSON storage', () => {
    const obj = { name: 'test', value: 123 }
    typedStorage.setJSON('json_key', obj)
    const retrieved = typedStorage.getJSON<typeof obj>('json_key')
    expect(retrieved).toEqual(obj)
  })

  it('should handle boolean storage', () => {
    typedStorage.setBoolean('bool_key', true)
    const retrieved = typedStorage.getBoolean('bool_key')
    expect(retrieved).toBe(true)
  })

  it('should handle number storage', () => {
    typedStorage.setNumber('num_key', 42)
    const retrieved = typedStorage.getNumber('num_key')
    expect(retrieved).toBe(42)
  })
})

describe('Notifications Adapter', () => {
  it('should request permission', async () => {
    const permission = await desktopNotifications.requestPermission()
    expect(permission).toBe('granted')
  })

  it('should check if notifications are supported', () => {
    const supported = desktopNotifications.isSupported()
    expect(typeof supported).toBe('boolean')
  })
})

describe('Clipboard Adapter', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        readText: jest.fn().mockResolvedValue(''),
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('should read text from clipboard', async () => {
    const text = await desktopClipboard.readText()
    expect(typeof text).toBe('string')
  })

  it('should write text to clipboard', async () => {
    await expect(desktopClipboard.writeText('test')).resolves.not.toThrow()
  })

  it('should clear clipboard', async () => {
    await expect(desktopClipboard.clear()).resolves.not.toThrow()
  })
})

describe('Filesystem Adapter', () => {
  it('should have filesystem methods', () => {
    expect(typeof desktopFilesystem.selectFile).toBe('function')
    expect(typeof desktopFilesystem.selectFiles).toBe('function')
    expect(typeof desktopFilesystem.selectDirectory).toBe('function')
    expect(typeof desktopFilesystem.saveFile).toBe('function')
    expect(typeof desktopFilesystem.openPath).toBe('function')
    expect(typeof desktopFilesystem.showInFolder).toBe('function')
  })
})
