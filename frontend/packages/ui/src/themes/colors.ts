/**
 * Color token definitions
 *
 * These are the base color tokens used across all themes
 */

export const colorTokens = {
  // Primary colors
  primary: 'var(--primary)',
  'primary-foreground': 'var(--primary-foreground)',

  // Secondary colors
  secondary: 'var(--secondary)',
  'secondary-foreground': 'var(--secondary-foreground)',

  // Accent colors
  accent: 'var(--accent)',
  'accent-foreground': 'var(--accent-foreground)',

  // Background colors
  background: 'var(--background)',
  foreground: 'var(--foreground)',

  // Surface colors
  surface: 'var(--surface)',
  'surface-foreground': 'var(--surface-foreground)',

  // Muted colors
  muted: 'var(--muted)',
  'muted-foreground': 'var(--muted-foreground)',

  // Border colors
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',

  // Status colors
  destructive: 'var(--destructive)',
  'destructive-foreground': 'var(--destructive-foreground)',
  success: 'var(--success)',
  'success-foreground': 'var(--success-foreground)',
  warning: 'var(--warning)',
  'warning-foreground': 'var(--warning-foreground)',
  info: 'var(--info)',
  'info-foreground': 'var(--info-foreground)',

  // Card colors
  card: 'var(--card)',
  'card-foreground': 'var(--card-foreground)',

  // Popover colors
  popover: 'var(--popover)',
  'popover-foreground': 'var(--popover-foreground)',
} as const

/**
 * CSS variable names for theme colors
 */
export const cssVariables = [
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--background',
  '--foreground',
  '--surface',
  '--surface-foreground',
  '--muted',
  '--muted-foreground',
  '--border',
  '--input',
  '--ring',
  '--destructive',
  '--destructive-foreground',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--info',
  '--info-foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
] as const

export type CSSVariable = (typeof cssVariables)[number]
