/**
 * Jest Setup File for nchat
 *
 * This file runs before each test file and sets up:
 * - Testing Library matchers
 * - Global mocks (navigation, browser APIs)
 * - Environment variables
 * - Store cleanup
 */

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Enable Immer's MapSet plugin for stores that use Map/Set
import { enableMapSet } from 'immer'
enableMapSet()

// ============================================================================
// Accessibility Testing (jest-axe)
// ============================================================================

import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

// ============================================================================
// Mock Next.js Router
// ============================================================================

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  useSelectedLayoutSegment: jest.fn(() => null),
  useSelectedLayoutSegments: jest.fn(() => []),
  notFound: jest.fn(),
  redirect: jest.fn(),
  permanentRedirect: jest.fn(),
}))

// ============================================================================
// Mock Environment Variables
// ============================================================================

process.env.NEXT_PUBLIC_APP_NAME = 'nchat'
process.env.NEXT_PUBLIC_APP_TAGLINE = 'Team Communication Platform'
process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL = 'http://localhost:1337/v1/graphql'
process.env.NEXT_PUBLIC_USE_DEV_AUTH = 'true'
process.env.NEXT_PUBLIC_ENV = 'test'

// ============================================================================
// Mock Browser APIs
// ============================================================================

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

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: jest.fn(() => []),
}))

// Mock scrollTo
window.scrollTo = jest.fn()
Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock Blob methods
if (typeof Blob !== 'undefined') {
  Blob.prototype.arrayBuffer = jest.fn(async function () {
    // Return a mock ArrayBuffer with audio data
    const buffer = new ArrayBuffer(44100 * 2) // 1 second of 16-bit audio at 44.1kHz
    const view = new Int16Array(buffer)
    // Fill with some mock audio data (sine wave)
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.sin(i / 10) * 32767
    }
    return buffer
  })

  Blob.prototype.text = jest.fn(async function () {
    return 'mock text content'
  })

  Blob.prototype.slice = jest.fn(function (start, end, contentType) {
    return new Blob([], { type: contentType || this.type })
  })
}

// ============================================================================
// Mock Crypto API
// ============================================================================

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
      exportKey: jest.fn(),
      importKey: jest.fn(),
    },
  },
})

// ============================================================================
// Mock requestAnimationFrame
// ============================================================================

global.requestAnimationFrame = (callback) => setTimeout(callback, 0)
global.cancelAnimationFrame = (id) => clearTimeout(id)

// ============================================================================
// Mock AudioContext
// ============================================================================

global.AudioContext = jest.fn().mockImplementation(() => ({
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1, setValueAtTime: jest.fn() },
  })),
  decodeAudioData: jest.fn((arrayBuffer) => {
    // Create a mock AudioBuffer
    const sampleRate = 44100
    const length = arrayBuffer.byteLength / 2 // Assuming 16-bit audio
    const numberOfChannels = 1

    const mockBuffer = {
      sampleRate,
      length,
      duration: length / sampleRate,
      numberOfChannels,
      getChannelData: jest.fn((channel) => {
        const data = new Float32Array(length)
        // Fill with mock sine wave data
        for (let i = 0; i < length; i++) {
          data[i] = Math.sin(i / 10) * 0.5
        }
        return data
      }),
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    }

    return Promise.resolve(mockBuffer)
  }),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
}))

// Also mock webkitAudioContext for Safari
global.webkitAudioContext = global.AudioContext

// ============================================================================
// Console Error Suppression for Expected Errors
// ============================================================================

const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  // Suppress React act() warnings in tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('not wrapped in act'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') || args[0].includes('componentWillUpdate'))
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

// ============================================================================
// Global Test Cleanup
// ============================================================================

afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks()

  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }

  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
})
