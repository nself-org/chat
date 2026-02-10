/**
 * Nanoid Mock for Jest Tests
 *
 * Provides deterministic ID generation for reliable testing.
 * Mocks the nanoid package.
 *
 * @module @nself-chat/testing/mocks/esm/nanoid
 */

let counter = 0

/**
 * Generate a deterministic nanoid
 * Uses counter for deterministic behavior in tests
 *
 * @param size - Length of the ID (default: 21)
 * @returns Deterministic ID string
 */
export const nanoid = jest.fn((size: number = 21): string => {
  counter++
  // Create deterministic ID: "test-" + counter + padding
  const base = `test-${counter}`
  return base.padEnd(size, '0').substring(0, size)
})

/**
 * Customizable nanoid generator
 * @param alphabet - Custom alphabet (ignored in mock)
 * @param size - Default size
 * @returns Generator function
 */
export const customAlphabet = jest.fn((_alphabet: string, size: number = 21) => {
  return jest.fn(() => nanoid(size))
})

/**
 * URL-safe alphabet constant
 */
export const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

/**
 * Reset the counter for deterministic tests
 */
export const __resetCounter = () => {
  counter = 0
}

export default nanoid
