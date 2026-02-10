/**
 * Jest setup file for @nself-chat/ui package
 */

import '@testing-library/jest-dom'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  motion: new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return require('react').forwardRef((props, ref) => {
            const { children, ...rest } = props
            // Remove motion-specific props
            const {
              initial,
              animate,
              exit,
              variants,
              whileHover,
              whileTap,
              whileFocus,
              whileDrag,
              drag,
              dragConstraints,
              onDrag,
              onDragEnd,
              onDragStart,
              onAnimationStart,
              onAnimationComplete,
              ...safeProps
            } = rest
            return require('react').createElement(prop, { ref, ...safeProps }, children)
          })
        }
        return target[prop]
      },
    }
  ),
  AnimatePresence: ({ children }) => children,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
