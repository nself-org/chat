/**
 * Reminders API Route
 *
 * REST API endpoints for managing reminders.
 * Provides CRUD operations and additional actions like snooze, complete, and dismiss.
 *
 * @endpoint GET /api/reminders - Get user's reminders with filtering
 * @endpoint POST /api/reminders - Create a new reminder
 * @endpoint PUT /api/reminders - Update a reminder
 * @endpoint DELETE /api/reminders - Delete a reminder
 *
 * @example
 * ```typescript
 * // Get all reminders
 * const response = await fetch('/api/reminders')
 * const { data } = await response.json()
 * // { reminders: Reminder[] }
 *
 * // Create a reminder
 * const response = await fetch('/api/reminders', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     messageId: '123',
 *     content: 'Follow up on this',
 *     remindAt: new Date(Date.now() + 3600000).toISOString(),
 *     timezone: 'America/New_York'
 *   })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/response'
import {
  withErrorHandler,
  withAuth,
  getAuthenticatedUser,
  type AuthenticatedRequest,
} from '@/lib/api/middleware'
import { withCsrfProtection } from '@/lib/security/csrf'

/**
 * Wraps an AuthenticatedRequest handler for use with withCsrfProtection.
 * CSRF middleware runs before withAuth adds the `user` property, so the handler
 * receives a plain NextRequest at that stage. The withAuth wrapper later
 * augments it with `user` before the actual handler executes.
 */
function csrfWrapped(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): (request: NextRequest, context: unknown) => Promise<NextResponse> {
  return (request, context) => handler(request as AuthenticatedRequest)
}

// ============================================================================
// Types
// ============================================================================

interface CreateReminderInput {
  messageId?: string
  channelId?: string
  content: string
  note?: string
  remindAt: string // ISO 8601 date string
  timezone: string
  type?: 'message' | 'custom' | 'followup'
  isRecurring?: boolean
  recurrenceRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    daysOfWeek?: number[]
    dayOfMonth?: number
    endDate?: string
    count?: number
  }
}

interface UpdateReminderInput {
  id: string
  content?: string
  note?: string
  remindAt?: string
  timezone?: string
  isRecurring?: boolean
  recurrenceRule?: CreateReminderInput['recurrenceRule']
}

interface ReminderQueryParams {
  status?: 'pending' | 'completed' | 'dismissed' | 'snoozed'
  channelId?: string
  type?: 'message' | 'custom' | 'followup'
  limit?: number
  offset?: number
}

interface ReminderAction {
  action: 'complete' | 'dismiss' | 'snooze' | 'unsnooze'
  id: string
  snoozeDuration?: number // milliseconds
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate reminder creation input
 */
function validateCreateInput(input: unknown): {
  valid: boolean
  data?: CreateReminderInput
  error?: string
} {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input' }
  }

  const data = input as CreateReminderInput

  // Required fields
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    return { valid: false, error: 'Content is required' }
  }

  if (!data.remindAt || typeof data.remindAt !== 'string') {
    return { valid: false, error: 'remindAt is required and must be a valid ISO date string' }
  }

  // Validate date
  const remindAtDate = new Date(data.remindAt)
  if (isNaN(remindAtDate.getTime())) {
    return { valid: false, error: 'remindAt must be a valid ISO date string' }
  }

  // Check if date is in the future
  if (remindAtDate <= new Date()) {
    return { valid: false, error: 'remindAt must be in the future' }
  }

  if (!data.timezone || typeof data.timezone !== 'string') {
    return { valid: false, error: 'timezone is required' }
  }

  // Validate type
  if (data.type && !['message', 'custom', 'followup'].includes(data.type)) {
    return { valid: false, error: 'type must be message, custom, or followup' }
  }

  // Validate recurrence
  if (data.isRecurring) {
    if (!data.recurrenceRule) {
      return { valid: false, error: 'recurrenceRule is required when isRecurring is true' }
    }

    const { frequency, interval } = data.recurrenceRule
    if (!frequency || !['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return { valid: false, error: 'Invalid recurrence frequency' }
    }

    if (!interval || interval < 1 || interval > 99) {
      return { valid: false, error: 'Recurrence interval must be between 1 and 99' }
    }
  }

  return { valid: true, data }
}

/**
 * Validate reminder update input
 */
function validateUpdateInput(input: unknown): {
  valid: boolean
  data?: UpdateReminderInput
  error?: string
} {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input' }
  }

  const data = input as UpdateReminderInput

  if (!data.id || typeof data.id !== 'string') {
    return { valid: false, error: 'Reminder ID is required' }
  }

  // Validate remindAt if provided
  if (data.remindAt) {
    const remindAtDate = new Date(data.remindAt)
    if (isNaN(remindAtDate.getTime())) {
      return { valid: false, error: 'remindAt must be a valid ISO date string' }
    }

    if (remindAtDate <= new Date()) {
      return { valid: false, error: 'remindAt must be in the future' }
    }
  }

  return { valid: true, data }
}

/**
 * Parse query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): ReminderQueryParams {
  const params: ReminderQueryParams = {}

  const status = searchParams.get('status')
  if (status && ['pending', 'completed', 'dismissed', 'snoozed'].includes(status)) {
    params.status = status as ReminderQueryParams['status']
  }

  const channelId = searchParams.get('channelId')
  if (channelId) {
    params.channelId = channelId
  }

  const type = searchParams.get('type')
  if (type && ['message', 'custom', 'followup'].includes(type)) {
    params.type = type as ReminderQueryParams['type']
  }

  const limit = searchParams.get('limit')
  if (limit) {
    const parsed = parseInt(limit, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      params.limit = parsed
    }
  }

  const offset = searchParams.get('offset')
  if (offset) {
    const parsed = parseInt(offset, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      params.offset = parsed
    }
  }

  return params
}

// ============================================================================
// GET Handler - Fetch Reminders
// ============================================================================

/**
 * GET /api/reminders
 *
 * Fetch reminders for the authenticated user with optional filtering.
 *
 * Query Parameters:
 * - status: Filter by status (pending, completed, dismissed, snoozed)
 * - channelId: Filter by channel
 * - type: Filter by type (message, custom, followup)
 * - limit: Maximum number of results (default 50, max 100)
 * - offset: Pagination offset (default 0)
 */
async function handleGetReminders(request: AuthenticatedRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return unauthorizedResponse('Authentication required')
  }

  const { searchParams } = new URL(request.url)
  const params = parseQueryParams(searchParams)

  // In a real implementation, this would query the database via GraphQL or REST
  // For now, we'll return a mock response structure
  // The actual implementation would use the Apollo Client or Hasura directly

  return successResponse({
    reminders: [],
    total: 0,
    limit: params.limit || 50,
    offset: params.offset || 0,
    filters: params,
  })
}

// ============================================================================
// POST Handler - Create or Action on Reminder
// ============================================================================

/**
 * POST /api/reminders
 *
 * Create a new reminder or perform an action on an existing reminder.
 *
 * Body for creation:
 * {
 *   messageId?: string,
 *   channelId?: string,
 *   content: string,
 *   note?: string,
 *   remindAt: string (ISO date),
 *   timezone: string,
 *   type?: 'message' | 'custom' | 'followup',
 *   isRecurring?: boolean,
 *   recurrenceRule?: { ... }
 * }
 *
 * Body for action:
 * {
 *   action: 'complete' | 'dismiss' | 'snooze' | 'unsnooze',
 *   id: string,
 *   snoozeDuration?: number (milliseconds, required for snooze)
 * }
 */
async function handlePostReminders(request: AuthenticatedRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return unauthorizedResponse('Authentication required')
  }

  const body = await request.json()

  // Check if this is an action request
  if (body.action) {
    return handleReminderAction(user.id, body as ReminderAction)
  }

  // Otherwise, treat as create request
  const validation = validateCreateInput(body)
  if (!validation.valid) {
    return badRequestResponse(validation.error || 'Invalid input')
  }

  const input = validation.data!

  // In a real implementation, this would create the reminder via GraphQL mutation
  // For now, we'll return a mock response
  const newReminder = {
    id: crypto.randomUUID(),
    user_id: user.id,
    message_id: input.messageId,
    channel_id: input.channelId,
    content: input.content,
    note: input.note,
    remind_at: input.remindAt,
    timezone: input.timezone,
    status: 'pending',
    type: input.type || 'custom',
    is_recurring: input.isRecurring || false,
    recurrence_rule: input.recurrenceRule,
    snooze_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return successResponse({
    reminder: newReminder,
    message: 'Reminder created successfully',
  })
}

/**
 * Handle reminder actions (complete, dismiss, snooze, unsnooze)
 */
async function handleReminderAction(userId: string, action: ReminderAction): Promise<NextResponse> {
  const { action: actionType, id, snoozeDuration } = action

  if (!id) {
    return badRequestResponse('Reminder ID is required')
  }

  switch (actionType) {
    case 'complete':
      // Mark reminder as completed
      return successResponse({
        reminder: { id, status: 'completed', completed_at: new Date().toISOString() },
        message: 'Reminder marked as completed',
      })

    case 'dismiss':
      // Dismiss reminder
      return successResponse({
        reminder: { id, status: 'dismissed' },
        message: 'Reminder dismissed',
      })

    case 'snooze':
      if (!snoozeDuration || snoozeDuration <= 0) {
        return badRequestResponse('Valid snoozeDuration is required for snooze action')
      }

      const snoozedUntil = new Date(Date.now() + snoozeDuration).toISOString()
      return successResponse({
        reminder: {
          id,
          status: 'snoozed',
          snoozed_until: snoozedUntil,
          remind_at: snoozedUntil,
        },
        message: 'Reminder snoozed',
      })

    case 'unsnooze':
      // Resume snoozed reminder
      return successResponse({
        reminder: { id, status: 'pending', snoozed_until: null },
        message: 'Reminder resumed',
      })

    default:
      return badRequestResponse('Invalid action')
  }
}

// ============================================================================
// PUT Handler - Update Reminder
// ============================================================================

/**
 * PUT /api/reminders
 *
 * Update an existing reminder.
 *
 * Body:
 * {
 *   id: string,
 *   content?: string,
 *   note?: string,
 *   remindAt?: string,
 *   timezone?: string,
 *   isRecurring?: boolean,
 *   recurrenceRule?: { ... }
 * }
 */
async function handlePutReminders(request: AuthenticatedRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return unauthorizedResponse('Authentication required')
  }

  const body = await request.json()
  const validation = validateUpdateInput(body)

  if (!validation.valid) {
    return badRequestResponse(validation.error || 'Invalid input')
  }

  const input = validation.data!

  // In a real implementation, verify the reminder belongs to the user
  // and update via GraphQL mutation

  const { id: _id, ...inputWithoutId } = input
  const updatedReminder = {
    id: input.id,
    ...inputWithoutId,
    updated_at: new Date().toISOString(),
  }

  return successResponse({
    reminder: updatedReminder,
    message: 'Reminder updated successfully',
  })
}

// ============================================================================
// DELETE Handler - Delete Reminder
// ============================================================================

/**
 * DELETE /api/reminders?id=xxx
 *
 * Delete a reminder by ID.
 */
async function handleDeleteReminders(request: AuthenticatedRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return unauthorizedResponse('Authentication required')
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return badRequestResponse('Reminder ID is required')
  }

  // In a real implementation, verify the reminder belongs to the user
  // and delete via GraphQL mutation

  return successResponse({
    id,
    message: 'Reminder deleted successfully',
  })
}

// ============================================================================
// Route Exports
// ============================================================================

/**
 * GET /api/reminders
 */
export const GET = withErrorHandler(withAuth(handleGetReminders))

/**
 * POST /api/reminders
 */
export const POST = withErrorHandler(withAuth(withCsrfProtection(csrfWrapped(handlePostReminders))))

/**
 * PUT /api/reminders
 */
export const PUT = withErrorHandler(withAuth(withCsrfProtection(csrfWrapped(handlePutReminders))))

/**
 * DELETE /api/reminders
 */
export const DELETE = withErrorHandler(
  withAuth(withCsrfProtection(csrfWrapped(handleDeleteReminders)))
)
