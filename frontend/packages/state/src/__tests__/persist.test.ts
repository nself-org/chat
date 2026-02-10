/**
 * Persistence Utilities Tests
 */

import {
  safeJsonParse,
  safeJsonStringify,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorageWithPrefix,
  getStorageSize,
  isStorageAvailable,
  createNamespacedStorage,
} from '../utils/persist'

describe('Persistence Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', {})
      expect(result).toEqual({ key: 'value' })
    })

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true }
      const result = safeJsonParse('invalid json', fallback)
      expect(result).toBe(fallback)
    })

    it('should return fallback for null', () => {
      const fallback = { default: true }
      const result = safeJsonParse(null, fallback)
      expect(result).toBe(fallback)
    })
  })

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      const result = safeJsonStringify({ key: 'value' })
      expect(result).toBe('{"key":"value"}')
    })

    it('should handle circular references', () => {
      const circular: Record<string, unknown> = { key: 'value' }
      circular.self = circular
      const result = safeJsonStringify(circular)
      expect(result).toBeNull()
    })
  })

  describe('getStorageItem', () => {
    it('should get item from storage', () => {
      localStorage.setItem('test-key', '{"value":123}')
      const result = getStorageItem<{ value: number }>('test-key')
      expect(result).toEqual({ value: 123 })
    })

    it('should return null for missing item', () => {
      const result = getStorageItem('missing-key')
      expect(result).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      localStorage.setItem('bad-key', 'invalid json')
      const result = getStorageItem('bad-key')
      expect(result).toBeNull()
    })
  })

  describe('setStorageItem', () => {
    it('should set item in storage', () => {
      const success = setStorageItem('test-key', { value: 456 })
      expect(success).toBe(true)
      expect(localStorage.getItem('test-key')).toBe('{"value":456}')
    })

    it('should handle complex objects', () => {
      const data = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: 'value' },
      }
      const success = setStorageItem('complex', data)
      expect(success).toBe(true)
      expect(getStorageItem('complex')).toEqual(data)
    })
  })

  describe('removeStorageItem', () => {
    it('should remove item from storage', () => {
      localStorage.setItem('remove-me', 'value')
      const success = removeStorageItem('remove-me')
      expect(success).toBe(true)
      expect(localStorage.getItem('remove-me')).toBeNull()
    })

    it('should return true even if item does not exist', () => {
      const success = removeStorageItem('non-existent')
      expect(success).toBe(true)
    })
  })

  describe('clearStorageWithPrefix', () => {
    it('should clear items with prefix', () => {
      localStorage.setItem('app:key1', 'value1')
      localStorage.setItem('app:key2', 'value2')
      localStorage.setItem('other:key3', 'value3')

      const cleared = clearStorageWithPrefix('app:')
      expect(cleared).toBe(2)
      expect(localStorage.getItem('app:key1')).toBeNull()
      expect(localStorage.getItem('app:key2')).toBeNull()
      expect(localStorage.getItem('other:key3')).toBe('value3')
    })

    it('should return 0 if no items match', () => {
      const cleared = clearStorageWithPrefix('nonexistent:')
      expect(cleared).toBe(0)
    })
  })

  describe('getStorageSize', () => {
    it('should calculate storage size', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')

      const size = getStorageSize()
      expect(size).toBeGreaterThan(0)
      expect(size).toBe('key1'.length + 'value1'.length + 'key2'.length + 'value2'.length)
    })

    it('should return 0 for empty storage', () => {
      const size = getStorageSize()
      expect(size).toBe(0)
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true for available storage', () => {
      expect(isStorageAvailable(localStorage)).toBe(true)
    })
  })

  describe('createNamespacedStorage', () => {
    it('should create namespaced storage wrapper', () => {
      const ns = createNamespacedStorage('myapp')

      ns.setItem('key', { value: 123 })
      expect(ns.getItem<{ value: number }>('key')).toEqual({ value: 123 })
      expect(localStorage.getItem('myapp:key')).toBe('{"value":123}')
    })

    it('should remove namespaced items', () => {
      const ns = createNamespacedStorage('myapp')

      ns.setItem('key', 'value')
      ns.removeItem('key')
      expect(ns.getItem('key')).toBeNull()
    })

    it('should clear namespace', () => {
      const ns = createNamespacedStorage('myapp')

      ns.setItem('key1', 'value1')
      ns.setItem('key2', 'value2')
      localStorage.setItem('other:key', 'value')

      const cleared = ns.clear()
      expect(cleared).toBe(2)
      expect(ns.getItem('key1')).toBeNull()
      expect(ns.getItem('key2')).toBeNull()
      expect(localStorage.getItem('other:key')).toBe('value')
    })

    it('should check if storage is available', () => {
      const ns = createNamespacedStorage('myapp')
      expect(ns.isAvailable()).toBe(true)
    })

    it('should get size', () => {
      const ns = createNamespacedStorage('myapp')
      ns.setItem('key', 'value')
      expect(ns.size()).toBeGreaterThan(0)
    })
  })
})
