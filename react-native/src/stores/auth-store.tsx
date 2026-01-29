/**
 * Auth Store - Authentication state management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { MMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@shared/constants'
import type { User } from '@shared/types'

// Storage instance
const storage = new MMKV()

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  })

  // Load stored auth state on mount
  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const storedToken = storage.getString(STORAGE_KEYS.AUTH_TOKEN)
      const storedUser = storage.getString(STORAGE_KEYS.USER)

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser) as User
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          token: storedToken,
        })
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // API call would go here
      // For now, mock sign in
      const mockUser: User = {
        id: 'user-123',
        email,
        displayName: email.split('@')[0],
        status: 'online',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockToken = 'mock-token-123'

      // Store auth data
      storage.set(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser))

      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        token: mockToken,
      })
    } catch (error) {
      console.error('Sign in failed:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // API call would go here
      // For now, mock sign up
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        displayName,
        status: 'online',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockToken = 'mock-token-' + Date.now()

      // Store auth data
      storage.set(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      storage.set(STORAGE_KEYS.USER, JSON.stringify(mockUser))

      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        token: mockToken,
      })
    } catch (error) {
      console.error('Sign up failed:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Clear stored auth data
      storage.delete(STORAGE_KEYS.AUTH_TOKEN)
      storage.delete(STORAGE_KEYS.REFRESH_TOKEN)
      storage.delete(STORAGE_KEYS.USER)

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      })
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }, [])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return

    try {
      // API call would go here
      const updatedUser = { ...state.user, ...updates, updatedAt: new Date() }

      // Update stored user
      storage.set(STORAGE_KEYS.USER, JSON.stringify(updatedUser))

      setState((prev) => ({
        ...prev,
        user: updatedUser,
      }))
    } catch (error) {
      console.error('Update user failed:', error)
      throw error
    }
  }, [state.user])

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN)
      if (!refreshToken) {
        throw new Error('No refresh token')
      }

      // API call would go here
      // For now, mock refresh
      const newToken = 'refreshed-token-' + Date.now()
      storage.set(STORAGE_KEYS.AUTH_TOKEN, newToken)

      setState((prev) => ({
        ...prev,
        token: newToken,
      }))
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, sign out
      await signOut()
      throw error
    }
  }, [signOut])

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthProvider
