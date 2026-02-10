/**
 * Auth Mocks
 *
 * Mock implementations for authentication in tests.
 *
 * @module @nself-chat/testing/mocks/auth
 */

import type { TestUser } from '../../factories/user.factory'

export interface MockAuthSession {
  user: TestUser | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: Date | null
  isAuthenticated: boolean
}

/**
 * Mock Authentication Service
 *
 * Provides a complete mock implementation of the auth service
 */
export class MockAuthService {
  private session: MockAuthSession = {
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
  }

  private listeners: Array<(session: MockAuthSession) => void> = []

  signIn = jest.fn(async (email: string, _password: string) => {
    const user: TestUser = {
      id: `user-${Date.now()}`,
      username: email.split('@')[0],
      displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email: email.toLowerCase(),
      role: 'member',
      status: 'online',
    }
    return this.createSession(user)
  })

  signUp = jest.fn(async (email: string, _password: string, username: string, displayName?: string) => {
    const user: TestUser = {
      id: `user-${Date.now()}`,
      username,
      displayName: displayName || username,
      email: email.toLowerCase(),
      role: 'member',
      status: 'online',
    }
    return this.createSession(user)
  })

  signOut = jest.fn(async () => {
    this.session = {
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    }
    this.notifyListeners()
  })

  refreshToken = jest.fn(async () => {
    if (!this.session.isAuthenticated || !this.session.user) {
      return null
    }
    return this.createSession(this.session.user)
  })

  getCurrentUser = jest.fn(async () => {
    return this.session.user
  })

  isAuthenticated = jest.fn(() => {
    return this.session.isAuthenticated
  })

  getSession = jest.fn(() => {
    return this.session
  })

  subscribe = (callback: (session: MockAuthSession) => void) => {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  private createSession(user: TestUser): MockAuthSession {
    this.session = {
      user,
      accessToken: `test-token-${user.id}-${Date.now()}`,
      refreshToken: `test-refresh-${user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000),
      isAuthenticated: true,
    }
    this.notifyListeners()
    return this.session
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.session))
  }

  reset() {
    this.session = {
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    }
    this.signIn.mockClear()
    this.signUp.mockClear()
    this.signOut.mockClear()
    this.refreshToken.mockClear()
    this.getCurrentUser.mockClear()
  }
}

/**
 * Singleton mock auth service for easy use in tests
 */
export const mockAuthService = new MockAuthService()

/**
 * Create a mock auth context value
 */
export const createMockAuthContext = (
  user: TestUser | null = null,
  overrides: Partial<{
    signIn: jest.Mock
    signUp: jest.Mock
    signOut: jest.Mock
    updateProfile: jest.Mock
    refreshToken: jest.Mock
  }> = {}
) => ({
  user,
  loading: false,
  error: null,
  isAuthenticated: user !== null,
  isDevMode: true,
  signIn: overrides.signIn || jest.fn().mockResolvedValue({ user }),
  signUp: overrides.signUp || jest.fn().mockResolvedValue({ user }),
  signOut: overrides.signOut || jest.fn().mockResolvedValue(undefined),
  updateProfile: overrides.updateProfile || jest.fn().mockResolvedValue(user),
  refreshToken: overrides.refreshToken || jest.fn().mockResolvedValue({ accessToken: 'test' }),
  switchUser: jest.fn(),
})

/**
 * Create a mock localStorage implementation
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    _store: store,
  }
}
