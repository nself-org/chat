/**
 * @nself-chat/core/types - Type definitions barrel export
 *
 * Central export point for all shared type definitions.
 * These types are framework-agnostic and can be used across web, mobile, and desktop.
 *
 * @packageDocumentation
 * @module @nself-chat/core/types
 */

// Core domain types
export * from './message'
export * from './channel'
export * from './user'
export * from './config'

// Integration types
export * from './api'
export * from './bot'
export * from './webhook'

// Security types
export * from './encryption'

// Billing types
export * from './subscription'
