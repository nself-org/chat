/**
 * @nself-chat/core/utils tests
 */

import { cn, debounce } from '../utils'
import { truncate, capitalize, titleCase, slugify, getInitials, isWhitespace, stripHtml, wordCount, charCount } from '../utils/text'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('handles tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('debounce utility', () => {
  jest.useFakeTimers()

  it('debounces function calls', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments correctly', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 100)

    debounced('foo', 'bar')
    jest.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('foo', 'bar')
  })

  afterAll(() => {
    jest.useRealTimers()
  })
})

describe('text utilities', () => {
  describe('truncate', () => {
    it('truncates long text', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('does not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })
  })

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
    })

    it('handles empty string', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('titleCase', () => {
    it('converts to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World')
    })
  })

  describe('slugify', () => {
    it('creates URL-safe slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world')
    })

    it('handles multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('Hello @#$ World')).toBe('hello-world')
    })
  })

  describe('getInitials', () => {
    it('extracts initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('extracts initials from single name', () => {
      expect(getInitials('John')).toBe('JO')
    })

    it('limits to specified length', () => {
      expect(getInitials('John Doe Smith', 3)).toBe('JDS')
    })
  })

  describe('isWhitespace', () => {
    it('detects whitespace-only strings', () => {
      expect(isWhitespace('   ')).toBe(true)
      expect(isWhitespace('\n\t')).toBe(true)
    })

    it('detects non-whitespace', () => {
      expect(isWhitespace('hello')).toBe(false)
    })
  })

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello')
    })

    it('handles multiple tags', () => {
      expect(stripHtml('<div><span>Hello</span> World</div>')).toBe('Hello World')
    })
  })

  describe('wordCount', () => {
    it('counts words correctly', () => {
      expect(wordCount('Hello world')).toBe(2)
      expect(wordCount('One two three four')).toBe(4)
    })

    it('handles extra whitespace', () => {
      expect(wordCount('Hello   world  ')).toBe(2)
    })
  })

  describe('charCount', () => {
    it('counts characters excluding whitespace', () => {
      expect(charCount('Hello world')).toBe(10)
    })

    it('handles empty string', () => {
      expect(charCount('')).toBe(0)
    })
  })
})
