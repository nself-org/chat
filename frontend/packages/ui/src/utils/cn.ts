/**
 * Utility for merging Tailwind CSS classes with proper precedence
 *
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @example
 * cn('text-red-500', 'text-blue-500') // 'text-blue-500' (last wins)
 * cn('px-4 py-2', condition && 'bg-blue-500') // conditional classes
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debounce utility for delaying function execution
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce(searchFunction, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
