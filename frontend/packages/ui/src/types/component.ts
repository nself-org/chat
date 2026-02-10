/**
 * Common component type definitions
 */

import type { VariantProps } from 'class-variance-authority'

/**
 * Base component props that all components should extend
 */
export interface BaseComponentProps {
  className?: string
  'data-testid'?: string
}

/**
 * Props for components that can be rendered as a different element
 */
export interface AsChildProps {
  asChild?: boolean
}

/**
 * Props for animated components
 */
export interface AnimatedProps {
  animated?: boolean
}

/**
 * Props for components with loading state
 */
export interface LoadingProps {
  loading?: boolean
  loadingText?: string
}

/**
 * Props for components with disabled state
 */
export interface DisabledProps {
  disabled?: boolean
}

/**
 * Size variants for components
 */
export type Size = 'sm' | 'default' | 'lg'

/**
 * Variant types for components
 */
export type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
