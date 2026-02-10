/**
 * Utility tests for nself-chat UI package
 */

import { cn, debounce } from '../utils'

describe('Utilities', () => {
  describe('cn (className utility)', () => {
    it('merges class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz')
      expect(result).toBe('foo baz')
    })

    it('deduplicates Tailwind classes', () => {
      const result = cn('px-4', 'px-2')
      expect(result).toBe('px-2')
    })

    it('handles complex Tailwind merging', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('preserves non-conflicting classes', () => {
      const result = cn('px-4 py-2', 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })

    it('handles undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar')
      expect(result).toBe('foo bar')
    })

    it('handles arrays', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('handles objects', () => {
      const result = cn({ foo: true, bar: false, baz: true })
      expect(result).toBe('foo baz')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('delays function execution', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      jest.advanceTimersByTime(50)
      debouncedFn()
      jest.advanceTimersByTime(50)
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('foo', 'bar')
      jest.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('foo', 'bar')
    })

    it('respects different delay values', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 200)

      debouncedFn()
      jest.advanceTimersByTime(100)
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
