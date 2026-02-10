/**
 * Jest Setup Configuration
 *
 * Common Jest setup that can be imported by all test suites.
 *
 * @module @nself-chat/testing/config/jest-setup
 */

import '@testing-library/jest-dom'
import { registerCustomMatchers } from '../matchers'
import { setupAllBrowserMocks } from '../mocks/browser'

// Register custom matchers
registerCustomMatchers()

// Setup browser API mocks
setupAllBrowserMocks()

// Mock pointer capture methods (Radix UI requirement)
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = jest.fn()
  Element.prototype.setPointerCapture = jest.fn()
  Element.prototype.releasePointerCapture = jest.fn()
}

// Suppress specific console warnings in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress known React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    // Suppress known warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
