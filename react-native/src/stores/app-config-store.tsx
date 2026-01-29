/**
 * App Config Store - Application configuration state
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { MMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@shared/constants'
import type { AppConfig } from '@shared/types'

// Storage instance
const storage = new MMKV()

// Default configuration
const defaultConfig: Partial<AppConfig> = {
  branding: {
    appName: 'nChat',
    tagline: 'Team Communication Platform',
  },
  features: {
    publicChannels: true,
    privateChannels: true,
    directMessages: true,
    fileUploads: true,
    voiceMessages: false,
    threads: true,
    reactions: true,
    search: true,
    guestAccess: false,
    inviteLinks: true,
    channelCategories: false,
    customEmojis: false,
    messageScheduling: false,
    videoConferencing: false,
  },
}

interface AppConfigContextType {
  config: Partial<AppConfig>
  isLoading: boolean
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>
  resetConfig: () => Promise<void>
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined)

interface AppConfigProviderProps {
  children: ReactNode
}

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const [config, setConfig] = useState<Partial<AppConfig>>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)

  // Load stored config on mount
  useEffect(() => {
    loadStoredConfig()
  }, [])

  const loadStoredConfig = async () => {
    try {
      const storedConfig = storage.getString(STORAGE_KEYS.APP_CONFIG)
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig) as Partial<AppConfig>
        setConfig({ ...defaultConfig, ...parsedConfig })
      }
    } catch (error) {
      console.error('Failed to load stored config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = useCallback(async (updates: Partial<AppConfig>) => {
    try {
      const newConfig = { ...config, ...updates }
      storage.set(STORAGE_KEYS.APP_CONFIG, JSON.stringify(newConfig))
      setConfig(newConfig)
    } catch (error) {
      console.error('Failed to update config:', error)
      throw error
    }
  }, [config])

  const resetConfig = useCallback(async () => {
    try {
      storage.delete(STORAGE_KEYS.APP_CONFIG)
      setConfig(defaultConfig)
    } catch (error) {
      console.error('Failed to reset config:', error)
      throw error
    }
  }, [])

  const value: AppConfigContextType = {
    config,
    isLoading,
    updateConfig,
    resetConfig,
  }

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider')
  }
  return context
}

// Helper hooks for specific config sections
export function useFeatures() {
  const { config } = useAppConfig()
  return config.features || defaultConfig.features
}

export function useBranding() {
  const { config } = useAppConfig()
  return config.branding || defaultConfig.branding
}

export default AppConfigProvider
