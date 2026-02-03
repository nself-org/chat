/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import RealtimeClient, { realtimeClient } from '../realtime-client'

// Mock socket.io-client
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  onAny: jest.fn(),
  onAnyOutgoing: jest.fn(),
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))

describe('RealtimeClient', () => {
  let client: RealtimeClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new RealtimeClient()
    mockSocket.connected = false
  })

  afterEach(() => {
    client.destroy()
  })

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      client.initialize()
      expect(client.state).toBe('disconnected')
      expect(client.isConnected).toBe(false)
    })

    it('should initialize with custom configuration', () => {
      client.initialize({
        url: 'http://custom-server:3000',
        debug: true,
        timeout: 5000,
      })
      expect(client.state).toBe('disconnected')
    })
  })

  describe('connection', () => {
    it('should connect to the server', async () => {
      client.initialize()

      // Simulate successful connection
      mockSocket.connected = true
      mockSocket.once.mockImplementation((event: string, callback: () => void) => {
        if (event === 'connect') {
          setTimeout(callback, 0)
        }
      })

      await client.connect('test-token')

      expect(mockSocket.on).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      client.initialize()

      mockSocket.once.mockImplementation((event: string, callback: (err: Error) => void) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(new Error('Connection failed')), 0)
        }
      })

      await expect(client.connect('test-token')).rejects.toThrow('Connection failed')
    })

    it('should disconnect from the server', () => {
      client.initialize()
      client.disconnect()

      expect(client.isConnected).toBe(false)
      expect(client.state).toBe('disconnected')
    })
  })

  describe('event handling', () => {
    it('should subscribe to events', () => {
      client.initialize()

      const callback = jest.fn()
      const unsub = client.on('test-event', callback)

      expect(typeof unsub).toBe('function')
    })

    it('should unsubscribe from events', () => {
      client.initialize()

      const callback = jest.fn()
      const unsub = client.on('test-event', callback)
      unsub()

      // Callback should be removed
      expect(mockSocket.off).toHaveBeenCalled()
    })

    it('should emit events', () => {
      client.initialize()
      mockSocket.connected = true

      // Manually set the socket
      // @ts-expect-error - accessing private property for testing
      client.socket = mockSocket

      client.emit('test-event', { data: 'test' })

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' })
    })
  })

  describe('connection state listeners', () => {
    it('should notify listeners of connection state changes', () => {
      client.initialize()

      const listener = jest.fn()
      const unsub = client.onConnectionStateChange(listener)

      // Should immediately notify of current state
      expect(listener).toHaveBeenCalledWith('disconnected')

      unsub()
    })

    it('should allow multiple listeners', () => {
      client.initialize()

      const listener1 = jest.fn()
      const listener2 = jest.fn()

      client.onConnectionStateChange(listener1)
      client.onConnectionStateChange(listener2)

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should notify error listeners', () => {
      client.initialize()

      const errorListener = jest.fn()
      client.onError(errorListener)

      // Simulate error
      // @ts-expect-error - accessing private method for testing
      client.notifyError({ code: 'TEST_ERROR', message: 'Test error' })

      expect(errorListener).toHaveBeenCalledWith({
        code: 'TEST_ERROR',
        message: 'Test error',
      })
    })
  })

  describe('token management', () => {
    it('should update auth token', () => {
      client.initialize()
      mockSocket.connected = true
      // @ts-expect-error - accessing private property for testing
      client.socket = mockSocket

      client.updateToken('new-token')

      expect(mockSocket.emit).toHaveBeenCalledWith('auth:refresh', { token: 'new-token' })
    })
  })

  describe('cleanup', () => {
    it('should clean up on destroy', () => {
      client.initialize()
      client.destroy()

      expect(client.state).toBe('disconnected')
    })
  })
})

describe('realtimeClient singleton', () => {
  it('should be a RealtimeClient instance', () => {
    expect(realtimeClient).toBeDefined()
    expect(realtimeClient.state).toBe('disconnected')
  })
})
