'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  themeConfig: ThemeConfig
  updateThemeConfig: (config: Partial<ThemeConfig>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultThemeConfig: ThemeConfig = {
  primary: '#5865F2',
  secondary: '#7B68EE',
  accent: '#00BFA5',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig)

  useEffect(() => {
    const root = window.document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    // Apply custom theme colors
    const root = window.document.documentElement
    root.style.setProperty('--primary', themeConfig.primary)
    root.style.setProperty('--secondary', themeConfig.secondary)
    root.style.setProperty('--accent', themeConfig.accent)
  }, [themeConfig])

  const updateThemeConfig = (config: Partial<ThemeConfig>) => {
    setThemeConfig({ ...themeConfig, ...config })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig, updateThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}