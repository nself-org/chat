import { cn } from '../utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('base-class', 'additional-class')
    expect(result).toBe('base-class additional-class')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    )
    expect(result).toBe('base active')
  })

  it('merges Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('handles arrays of classes', () => {
    const result = cn(['base', 'class'], 'additional')
    expect(result).toBe('base class additional')
  })

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('handles objects with boolean values', () => {
    const result = cn({
      'base': true,
      'active': true,
      'disabled': false,
    })
    expect(result).toBe('base active')
  })

  it('merges complex Tailwind utilities', () => {
    const result = cn(
      'text-red-500 hover:text-blue-500',
      'text-green-500'
    )
    // tailwind-merge should keep the last text color
    expect(result).toBe('hover:text-blue-500 text-green-500')
  })
})