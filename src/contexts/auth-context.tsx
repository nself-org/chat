'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authConfig } from '@/config/auth.config'
import { FauxAuthService } from '@/services/auth/faux-auth.service'
import { NhostAuthService } from '@/services/auth/nhost-auth.service'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  switchUser?: (userId: string) => Promise<void> // Dev mode only
  isDevMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize auth service based on environment
const authService = authConfig.useDevAuth
  ? new FauxAuthService()
  : new NhostAuthService()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await authService.signIn(email, password)
      console.log('AuthContext: Setting user with role:', response.user.role)
      setUser(response.user)
      router.push('/chat')
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      setLoading(true)
      const response = await authService.signUp(email, password, username)
      setUser(response.user)

      // Check if this is the first user (they become owner)
      if (response.user.role === 'owner') {
        router.push('/setup')
      } else {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      // TODO: Implement profile update for real auth
      if (authConfig.useDevAuth) {
        // In dev mode, just update the user locally
        setUser(prev => prev ? { ...prev, ...data } : null)
      } else {
        // Real auth profile update would go here
        throw new Error('Profile update not yet implemented for production')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Dev mode only: switch between test users
  const switchUser = useCallback(async (userId: string) => {
    if (!authConfig.useDevAuth) return

    try {
      const fauxAuth = authService as FauxAuthService
      const response = await fauxAuth.switchUser(userId)
      if (response) {
        setUser(response.user)
      }
    } catch (error) {
      console.error('Switch user error:', error)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      switchUser: authConfig.useDevAuth ? switchUser : undefined,
      isDevMode: authConfig.useDevAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}