/**
 * @nself-chat/core - Shared domain logic and business rules
 *
 * This package contains framework-agnostic business logic that can be used
 * across all frontend surfaces (web, mobile, desktop).
 *
 * @packageDocumentation
 * @module @nself-chat/core
 */

// Package metadata
export const PACKAGE_VERSION = '0.9.2'
export const PACKAGE_NAME = '@nself-chat/core'

// Re-export all modules
export * from './types'
export * from './utils'
export * from './constants'
export * from './validation'
export * from './domain'

// Named exports for convenience
export { cn, debounce } from './utils'
export { ROLES, PERMISSIONS, hasPermission } from './constants/roles'
export { validate, validateSafe, isValid } from './validation'
