/**
 * Browser API Mocks
 *
 * Mocks for browser APIs that are not available in Jest/jsdom.
 *
 * @module @nself-chat/testing/mocks/browser
 */

/**
 * Mock matchMedia
 */
export function mockMatchMedia() {
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
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver() {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))
}

/**
 * Mock window.scrollTo
 */
export function mockScrollTo() {
  window.scrollTo = jest.fn()
}

/**
 * Mock document.execCommand
 */
export function mockExecCommand() {
  document.execCommand = jest.fn()
}

/**
 * Mock clipboard API
 */
export function mockClipboard() {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
      write: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue([]),
    },
  })
}

/**
 * Mock getUserMedia and mediaDevices
 */
export function mockMediaDevices() {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
        addTrack: jest.fn(),
        removeTrack: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
      enumerateDevices: jest.fn().mockResolvedValue([]),
      getSupportedConstraints: jest.fn().mockReturnValue({}),
    },
  })
}

/**
 * Mock fetch API
 */
export function mockFetch() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    headers: new Headers(),
  })
}

/**
 * Mock WebSocket
 */
export function mockWebSocket() {
  global.WebSocket = jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  })) as any
}

/**
 * Create mock File
 */
export function createMockFile(
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

/**
 * Mock image loading
 */
export function mockImageLoad() {
  // Mock Image constructor
  ;(global as any).Image = class {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''

    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload()
        }
      }, 0)
    }
  }
}

/**
 * Setup all common browser mocks
 */
export function setupAllBrowserMocks() {
  mockMatchMedia()
  mockResizeObserver()
  mockIntersectionObserver()
  mockScrollTo()
  mockExecCommand()
  mockClipboard()
  mockMediaDevices()
  mockFetch()
  mockWebSocket()
  mockImageLoad()
}
