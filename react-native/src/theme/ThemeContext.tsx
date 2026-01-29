/**
 * Theme Context for nChat React Native
 * Provides theming support matching the web app
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { MMKV } from 'react-native-mmkv'

import { STORAGE_KEYS } from '@shared/constants'

// Storage instance
const storage = new MMKV()

// Color scheme types
export type ColorScheme = 'light' | 'dark' | 'system'

// Theme colors interface
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  muted: string
  border: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  success: string
  warning: string
  error: string
  info: string
  // Additional mobile-specific colors
  card: string
  placeholder: string
  inputBackground: string
  tabBarBackground: string
  tabBarActive: string
  tabBarInactive: string
}

// Spacing scale
export interface ThemeSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

// Font configuration
export interface ThemeFonts {
  regular: string
  medium: string
  bold: string
  sizes: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
}

// Border radius
export interface ThemeBorderRadius {
  none: number
  sm: number
  md: number
  lg: number
  xl: number
  full: number
}

// Complete theme
export interface Theme {
  colors: ThemeColors
  spacing: ThemeSpacing
  fonts: ThemeFonts
  borderRadius: ThemeBorderRadius
  isDark: boolean
}

// Default light theme (nself theme)
const lightColors: ThemeColors = {
  primary: '#00D4FF',
  secondary: '#0EA5E9',
  accent: '#38BDF8',
  background: '#FFFFFF',
  surface: '#F4F4F5',
  text: '#18181B',
  textSecondary: '#52525B',
  muted: '#71717A',
  border: '#E4E4E7',
  buttonPrimaryBg: '#18181B',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#F4F4F5',
  buttonSecondaryText: '#18181B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#00D4FF',
  card: '#FFFFFF',
  placeholder: '#A1A1AA',
  inputBackground: '#F4F4F5',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#00D4FF',
  tabBarInactive: '#71717A',
}

// Default dark theme (nself theme)
const darkColors: ThemeColors = {
  primary: '#00D4FF',
  secondary: '#0EA5E9',
  accent: '#38BDF8',
  background: '#18181B',
  surface: '#27272A',
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  muted: '#A1A1AA',
  border: '#3F3F46',
  buttonPrimaryBg: '#00D4FF',
  buttonPrimaryText: '#18181B',
  buttonSecondaryBg: '#3F3F46',
  buttonSecondaryText: '#F4F4F5',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#00D4FF',
  card: '#27272A',
  placeholder: '#71717A',
  inputBackground: '#27272A',
  tabBarBackground: '#18181B',
  tabBarActive: '#00D4FF',
  tabBarInactive: '#71717A',
}

// Spacing scale (based on 4px grid)
const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// Font configuration
const fonts: ThemeFonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
}

// Border radius scale
const borderRadius: ThemeBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

// Context type
interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system')

  // Load saved color scheme preference
  useEffect(() => {
    const saved = storage.getString(STORAGE_KEYS.THEME)
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setColorSchemeState(saved as ColorScheme)
    }
  }, [])

  // Save color scheme preference
  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    storage.set(STORAGE_KEYS.THEME, scheme)
  }

  // Toggle between light and dark
  const toggleColorScheme = () => {
    const currentIsDark = colorScheme === 'system' ? systemColorScheme === 'dark' : colorScheme === 'dark'
    setColorScheme(currentIsDark ? 'light' : 'dark')
  }

  // Compute the current theme
  const theme = useMemo(() => {
    const isDark = colorScheme === 'system' ? systemColorScheme === 'dark' : colorScheme === 'dark'
    const colors = isDark ? darkColors : lightColors

    return {
      colors,
      spacing,
      fonts,
      borderRadius,
      isDark,
    }
  }, [colorScheme, systemColorScheme])

  const value = useMemo(
    () => ({
      theme,
      colorScheme,
      setColorScheme,
      toggleColorScheme,
    }),
    [theme, colorScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook to get just the colors
export function useColors() {
  const { theme } = useTheme()
  return theme.colors
}

// Hook to get just the spacing
export function useSpacing() {
  const { theme } = useTheme()
  return theme.spacing
}
