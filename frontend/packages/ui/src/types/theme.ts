/**
 * Theme type definitions for nself-chat UI
 */

export interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  borderColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
}

export interface ThemePreset {
  name: string
  preset: string
  light: ThemeColors
  dark: ThemeColors
}

export type ColorScheme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  preset: string
  colorScheme: ColorScheme
  customColors?: Partial<ThemeColors>
}
