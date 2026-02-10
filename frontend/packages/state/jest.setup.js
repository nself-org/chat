/**
 * Jest Setup for @nself-chat/state
 */

import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

global.localStorage = localStorageMock
global.sessionStorage = localStorageMock

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
  }

  postMessage(message) {
    if (this.onmessage) {
      this.onmessage({ data: message })
    }
  }

  close() {
    // Mock close
  }
}

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
