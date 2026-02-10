/**
 * @nself-chat/core/validation - Zod validation schemas
 *
 * Centralized validation schemas for runtime type checking and data validation.
 *
 * @packageDocumentation
 * @module @nself-chat/core/validation
 */

import { z } from 'zod'

// ============================================================================
// Message Validation
// ============================================================================

export const MessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  channelId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  isEdited: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  replyToId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
})

export const CreateMessageSchema = MessageSchema.pick({
  content: true,
  channelId: true,
  replyToId: true,
  threadId: true,
})

export const UpdateMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

// ============================================================================
// Channel Validation
// ============================================================================

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private', 'direct']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid(),
  isArchived: z.boolean().default(false),
})

export const CreateChannelSchema = ChannelSchema.pick({
  name: true,
  description: true,
  type: true,
})

export const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

// ============================================================================
// User Validation
// ============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeenAt: z.date().optional(),
})

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
})

// ============================================================================
// Config Validation
// ============================================================================

export const AppConfigSchema = z.object({
  setup: z.object({
    isCompleted: z.boolean(),
    currentStep: z.number().min(1).max(12),
    visitedSteps: z.array(z.number()),
  }),
  branding: z.object({
    appName: z.string().min(1).max(100),
    logo: z.string().optional(),
    favicon: z.string().optional(),
    tagline: z.string().max(200).optional(),
  }),
  theme: z.object({
    preset: z.string(),
    colorScheme: z.enum(['light', 'dark', 'auto']),
  }),
  features: z.object({
    publicChannels: z.boolean(),
    privateChannels: z.boolean(),
    directMessages: z.boolean(),
    threads: z.boolean(),
    reactions: z.boolean(),
    fileUploads: z.boolean(),
  }),
})

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate and parse data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns result with error handling
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Check if data is valid without throwing
 */
export function isValid<T>(schema: z.ZodSchema<T>, data: unknown): boolean {
  return schema.safeParse(data).success
}
