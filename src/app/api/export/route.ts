/**
 * Data Export API Route
 *
 * Allows users to export their data including messages and files.
 * Supports multiple formats (JSON, CSV) and filtering options.
 *
 * This route supports two modes:
 * 1. Legacy mode: Using type/format parameters with job-based processing
 * 2. New mode: Using ExportConfig from import-export library for direct download
 *
 * @endpoint POST /api/export - Request data export
 * @endpoint GET /api/export/:jobId - Get export status/download
 *
 * @example
 * ```typescript
 * // Legacy: Request message export with job
 * const response = await fetch('/api/export', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <token>'
 *   },
 *   body: JSON.stringify({
 *     type: 'messages',
 *     format: 'json',
 *     channelIds: ['channel-1'],
 *     dateFrom: '2024-01-01',
 *     dateTo: '2024-12-31'
 *   })
 * })
 *
 * // New: Direct export with ExportConfig
 * const response = await fetch('/api/export', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     format: 'json',
 *     options: { includeUsers: true, includeChannels: true, includeMessages: true },
 *     filters: { dateRange: { start: '2024-01-01' } }
 *   })
 * })
 * // Returns file download directly
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ExportConfig } from '@/lib/import-export/types'
import { randomUUID } from 'crypto'
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/response'
import {
  withErrorHandler,
  withRateLimit,
  withAuth,
  compose,
  type AuthenticatedRequest,
} from '@/lib/api/middleware'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Maximum export size (100MB)
  MAX_EXPORT_SIZE: 100 * 1024 * 1024,

  // Maximum messages per export
  MAX_MESSAGES: 50000,

  // Export job expiry (24 hours)
  JOB_EXPIRY: 24 * 60 * 60 * 1000,

  // Rate limiting (5 exports per hour)
  RATE_LIMIT: {
    limit: 5,
    window: 3600,
  },

  // Valid export types
  VALID_TYPES: ['messages', 'channel', 'user', 'all'] as const,

  // Valid formats
  VALID_FORMATS: ['json', 'csv'] as const,
}

// ============================================================================
// Types
// ============================================================================

type ExportType = (typeof CONFIG.VALID_TYPES)[number]
type ExportFormat = (typeof CONFIG.VALID_FORMATS)[number]
type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ExportRequest {
  type: ExportType
  format?: ExportFormat
  channelIds?: string[]
  dateFrom?: string
  dateTo?: string
  includeAttachments?: boolean
}

interface ExportJob {
  id: string
  userId: string
  type: ExportType
  format: ExportFormat
  status: ExportStatus
  progress: number
  error?: string
  downloadUrl?: string
  fileSize?: number
  createdAt: string
  completedAt?: string
  expiresAt: string
  metadata: {
    channelIds?: string[]
    dateFrom?: string
    dateTo?: string
    includeAttachments?: boolean
    messageCount?: number
    fileCount?: number
  }
}

interface ExportedMessage {
  id: string
  content: string
  channelId: string
  channelName: string
  userId: string
  userName: string
  createdAt: string
  editedAt?: string
  attachments?: Array<{
    id: string
    filename: string
    url: string
    mimeType: string
    size: number
  }>
  reactions?: Array<{
    emoji: string
    count: number
    users: string[]
  }>
}

// ============================================================================
// In-Memory Storage (Mock - Use database/queue in production)
// ============================================================================

const exportJobs = new Map<string, ExportJob>()
const exportData = new Map<string, ExportedMessage[]>()

// Clean up expired jobs periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, job] of exportJobs.entries()) {
    if (now > new Date(job.expiresAt).getTime()) {
      exportJobs.delete(id)
      exportData.delete(id)
    }
  }
}, 60000) // Every minute

// ============================================================================
// Mock Data
// ============================================================================

const mockMessages: ExportedMessage[] = [
  {
    id: 'msg-1',
    content: 'Hello team! Here is the weekly update.',
    channelId: 'channel-general',
    channelName: 'general',
    userId: 'user-1',
    userName: 'John Doe',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reactions: [{ emoji: 'thumbsup', count: 3, users: ['user-2', 'user-3', 'user-4'] }],
  },
  {
    id: 'msg-2',
    content: 'Great progress on the project!',
    channelId: 'channel-general',
    channelName: 'general',
    userId: 'user-2',
    userName: 'Jane Smith',
    createdAt: new Date(Date.now() - 82800000).toISOString(),
  },
  {
    id: 'msg-3',
    content: 'Check out the new design mockups',
    channelId: 'channel-design',
    channelName: 'design',
    userId: 'user-3',
    userName: 'Alice Designer',
    createdAt: new Date(Date.now() - 79200000).toISOString(),
    attachments: [
      {
        id: 'file-1',
        filename: 'mockup.png',
        url: '/files/mockup.png',
        mimeType: 'image/png',
        size: 512000,
      },
    ],
  },
]

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate export request
 */
function validateExportRequest(
  body: unknown
): { valid: true; request: ExportRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const data = body as Record<string, unknown>

  // Validate type
  if (!data.type || !CONFIG.VALID_TYPES.includes(data.type as ExportType)) {
    return {
      valid: false,
      error: `Invalid export type. Valid types: ${CONFIG.VALID_TYPES.join(', ')}`,
    }
  }

  // Validate format
  const format = (data.format as ExportFormat) || 'json'
  if (!CONFIG.VALID_FORMATS.includes(format)) {
    return {
      valid: false,
      error: `Invalid format. Valid formats: ${CONFIG.VALID_FORMATS.join(', ')}`,
    }
  }

  // Validate dates
  if (data.dateFrom && (typeof data.dateFrom !== 'string' || isNaN(Date.parse(data.dateFrom)))) {
    return { valid: false, error: 'Invalid dateFrom format' }
  }

  if (data.dateTo && (typeof data.dateTo !== 'string' || isNaN(Date.parse(data.dateTo)))) {
    return { valid: false, error: 'Invalid dateTo format' }
  }

  return {
    valid: true,
    request: {
      type: data.type as ExportType,
      format,
      channelIds: Array.isArray(data.channelIds) ? data.channelIds as string[] : undefined,
      dateFrom: data.dateFrom as string | undefined,
      dateTo: data.dateTo as string | undefined,
      includeAttachments: data.includeAttachments === true,
    },
  }
}

/**
 * Fetch messages for export (mock implementation)
 */
async function fetchMessagesForExport(
  userId: string,
  request: ExportRequest
): Promise<ExportedMessage[]> {
  // In production, this would query the database:
  // const { data } = await graphqlClient.query({
  //   query: GET_USER_MESSAGES,
  //   variables: {
  //     userId,
  //     channelIds: request.channelIds,
  //     dateFrom: request.dateFrom,
  //     dateTo: request.dateTo,
  //     limit: CONFIG.MAX_MESSAGES
  //   }
  // })

  let messages = [...mockMessages]

  // Filter by channels
  if (request.channelIds && request.channelIds.length > 0) {
    messages = messages.filter((m) => request.channelIds!.includes(m.channelId))
  }

  // Filter by date
  if (request.dateFrom) {
    const from = new Date(request.dateFrom).getTime()
    messages = messages.filter((m) => new Date(m.createdAt).getTime() >= from)
  }

  if (request.dateTo) {
    const to = new Date(request.dateTo).getTime()
    messages = messages.filter((m) => new Date(m.createdAt).getTime() <= to)
  }

  // Remove attachments if not requested
  if (!request.includeAttachments) {
    messages = messages.map((m) => ({ ...m, attachments: undefined }))
  }

  return messages
}

/**
 * Convert messages to CSV format
 */
function messagesToCsv(messages: ExportedMessage[]): string {
  const headers = [
    'id',
    'content',
    'channel_id',
    'channel_name',
    'user_id',
    'user_name',
    'created_at',
    'edited_at',
    'attachment_count',
    'reaction_count',
  ]

  const rows = messages.map((msg) => [
    msg.id,
    `"${(msg.content || '').replace(/"/g, '""')}"`,
    msg.channelId,
    msg.channelName,
    msg.userId,
    msg.userName,
    msg.createdAt,
    msg.editedAt || '',
    String(msg.attachments?.length || 0),
    String(msg.reactions?.length || 0),
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Process export job (mock async processing)
 */
async function processExportJob(jobId: string, job: ExportJob): Promise<void> {
  try {
    // Update status to processing
    job.status = 'processing'
    job.progress = 10
    exportJobs.set(jobId, job)

    // Fetch data
    const messages = await fetchMessagesForExport(job.userId, {
      type: job.type,
      format: job.format,
      channelIds: job.metadata.channelIds,
      dateFrom: job.metadata.dateFrom,
      dateTo: job.metadata.dateTo,
      includeAttachments: job.metadata.includeAttachments,
    })

    job.progress = 50
    exportJobs.set(jobId, job)

    // Store data
    exportData.set(jobId, messages)

    // Update job metadata
    job.metadata.messageCount = messages.length
    job.metadata.fileCount = messages.reduce(
      (count, m) => count + (m.attachments?.length || 0),
      0
    )

    job.progress = 80
    exportJobs.set(jobId, job)

    // Generate download URL
    job.downloadUrl = `/api/export?jobId=${jobId}&download=true`

    // Calculate file size
    const content = job.format === 'csv' ? messagesToCsv(messages) : JSON.stringify(messages, null, 2)
    job.fileSize = new TextEncoder().encode(content).length

    // Mark as completed
    job.status = 'completed'
    job.progress = 100
    job.completedAt = new Date().toISOString()
    exportJobs.set(jobId, job)
  } catch (error) {
    console.error('Export job failed:', error)
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : 'Export failed'
    exportJobs.set(jobId, job)
  }
}

// ============================================================================
// GET Handler - Download/Status
// ============================================================================

async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const download = searchParams.get('download') === 'true'

  if (!jobId) {
    // List user's export jobs
    const userJobs = Array.from(exportJobs.values())
      .filter((job) => job.userId === request.user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return successResponse({ jobs: userJobs })
  }

  // Get specific job
  const job = exportJobs.get(jobId)

  if (!job) {
    return notFoundResponse('Export job not found', 'JOB_NOT_FOUND')
  }

  // Verify ownership
  if (job.userId !== request.user.id) {
    return forbiddenResponse('You do not have access to this export')
  }

  // Return status if not downloading
  if (!download) {
    return successResponse({ job })
  }

  // Check if ready for download
  if (job.status !== 'completed') {
    return badRequestResponse(
      `Export is not ready. Status: ${job.status}`,
      'EXPORT_NOT_READY'
    )
  }

  // Get export data
  const messages = exportData.get(jobId)

  if (!messages) {
    return notFoundResponse('Export data not found', 'DATA_NOT_FOUND')
  }

  // Generate content
  let content: string
  let contentType: string
  let filename: string

  if (job.format === 'csv') {
    content = messagesToCsv(messages)
    contentType = 'text/csv'
    filename = `nchat-export-${jobId}.csv`
  } else {
    content = JSON.stringify(
      {
        exportedAt: job.completedAt,
        messageCount: messages.length,
        messages,
      },
      null,
      2
    )
    contentType = 'application/json'
    filename = `nchat-export-${jobId}.json`
  }

  // Return file download
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(new TextEncoder().encode(content).length),
    },
  })
}

// ============================================================================
// POST Handler - Create Export
// ============================================================================

async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return badRequestResponse('Invalid JSON body', 'INVALID_JSON')
  }

  // Check if this is a new-style ExportConfig request
  const isNewStyleExport = body && typeof body === 'object' && 'options' in body && 'filters' in body

  if (isNewStyleExport) {
    return handleNewStyleExport(body as ExportConfig)
  }

  const validation = validateExportRequest(body)
  if (!validation.valid) {
    return badRequestResponse((validation as { valid: false; error: string }).error, 'VALIDATION_ERROR')
  }

  const { user } = request
  const exportRequest = validation.request

  // Check for existing pending/processing exports
  const existingJobs = Array.from(exportJobs.values()).filter(
    (job) =>
      job.userId === user.id &&
      (job.status === 'pending' || job.status === 'processing')
  )

  if (existingJobs.length >= 2) {
    return badRequestResponse(
      'You have too many pending exports. Please wait for them to complete.',
      'TOO_MANY_EXPORTS'
    )
  }

  // Create export job
  const jobId = randomUUID()
  const now = new Date()

  const job: ExportJob = {
    id: jobId,
    userId: user.id,
    type: exportRequest.type,
    format: exportRequest.format || 'json',
    status: 'pending',
    progress: 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CONFIG.JOB_EXPIRY).toISOString(),
    metadata: {
      channelIds: exportRequest.channelIds,
      dateFrom: exportRequest.dateFrom,
      dateTo: exportRequest.dateTo,
      includeAttachments: exportRequest.includeAttachments,
    },
  }

  exportJobs.set(jobId, job)

  // Start processing (in production, this would be queued)
  processExportJob(jobId, job).catch((error) => {
    console.error('Export processing error:', error)
  })

  return successResponse(
    {
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
      },
      message: 'Export job created. Check status with GET /api/export?jobId=' + jobId,
    },
    { status: 202 }
  )
}

// ============================================================================
// New-Style Export Handler (Direct Download)
// ============================================================================

const MOCK_EXPORT_USERS = [
  { id: '1', username: 'john_doe', display_name: 'John Doe', email: 'john@example.com', role: 'admin', created_at: '2024-01-15T10:30:00Z' },
  { id: '2', username: 'jane_smith', display_name: 'Jane Smith', email: 'jane@example.com', role: 'member', created_at: '2024-01-16T14:20:00Z' },
  { id: '3', username: 'bob_wilson', display_name: 'Bob Wilson', email: 'bob@example.com', role: 'member', created_at: '2024-01-17T09:15:00Z' },
]

const MOCK_EXPORT_CHANNELS = [
  { id: '1', name: 'general', slug: 'general', description: 'General discussion', type: 'public', is_private: false, is_archived: false, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'random', slug: 'random', description: 'Random chat', type: 'public', is_private: false, is_archived: false, created_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'engineering', slug: 'engineering', description: 'Engineering team discussions', type: 'private', is_private: true, is_archived: false, created_at: '2024-01-02T00:00:00Z' },
]

const MOCK_EXPORT_MESSAGES = [
  { id: '1', channel_id: '1', user_id: '1', content: 'Hello everyone! Welcome to the team.', type: 'text', created_at: '2024-01-15T10:35:00Z', is_pinned: true },
  { id: '2', channel_id: '1', user_id: '2', content: 'Thanks John! Excited to be here.', type: 'text', created_at: '2024-01-15T10:40:00Z', is_pinned: false },
  { id: '3', channel_id: '2', user_id: '3', content: 'Anyone want to grab coffee?', type: 'text', created_at: '2024-01-15T14:00:00Z', is_pinned: false },
  { id: '4', channel_id: '3', user_id: '1', content: 'Sprint planning tomorrow at 10am', type: 'text', created_at: '2024-01-16T09:00:00Z', is_pinned: true },
]

async function handleNewStyleExport(config: ExportConfig): Promise<NextResponse> {
  // Get data based on options
  let users = config.options.includeUsers ? [...MOCK_EXPORT_USERS] : []
  let channels = config.options.includeChannels ? [...MOCK_EXPORT_CHANNELS] : []
  let messages = config.options.includeMessages ? [...MOCK_EXPORT_MESSAGES] : []

  // Apply channel filter
  if (config.filters.channelIds?.length) {
    const channelIdSet = new Set(config.filters.channelIds)
    channels = channels.filter((c) => channelIdSet.has(c.id))
    messages = messages.filter((m) => channelIdSet.has(m.channel_id))
  }

  // Apply date range filter
  if (config.filters.dateRange) {
    const { start, end } = config.filters.dateRange
    messages = messages.filter((m) => {
      const msgDate = new Date(m.created_at)
      if (start && msgDate < new Date(start)) return false
      if (end && msgDate > new Date(end)) return false
      return true
    })
  }

  // Anonymize users if requested
  if (config.options.anonymizeUsers) {
    const userIdMap = new Map(users.map((u, index) => [u.id, `user_${index + 1}`]))
    users = users.map((u, index) => ({
      ...u,
      username: `user_${index + 1}`,
      display_name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
    }))
    messages = messages.map((m) => ({
      ...m,
      user_id: userIdMap.get(m.user_id) || m.user_id,
    }))
  }

  // Generate export content
  let content: string
  let contentType: string
  let filename: string

  if (config.format === 'csv') {
    content = generateExportCsv(users, channels, messages, config.options)
    contentType = 'text/csv'
    filename = `nchat-export-${Date.now()}.csv`
  } else {
    content = JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0.0',
        filters: config.filters,
        stats: {
          usersExported: users.length,
          channelsExported: channels.length,
          messagesExported: messages.length,
        },
      },
      ...(config.options.includeUsers && { users }),
      ...(config.options.includeChannels && { channels }),
      ...(config.options.includeMessages && { messages }),
    }, null, 2)
    contentType = 'application/json'
    filename = `nchat-export-${Date.now()}.json`
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function generateExportCsv(
  users: typeof MOCK_EXPORT_USERS,
  channels: typeof MOCK_EXPORT_CHANNELS,
  messages: typeof MOCK_EXPORT_MESSAGES,
  options: ExportConfig['options']
): string {
  const sections: string[] = []

  if (options.includeUsers && users.length) {
    const header = 'id,username,display_name,email,role,created_at'
    const rows = users.map((u) =>
      `${u.id},${escapeExportCsv(u.username)},${escapeExportCsv(u.display_name)},${escapeExportCsv(u.email)},${u.role},${u.created_at}`
    )
    sections.push('# USERS\n' + header + '\n' + rows.join('\n'))
  }

  if (options.includeChannels && channels.length) {
    const header = 'id,name,slug,description,type,is_private,is_archived,created_at'
    const rows = channels.map((c) =>
      `${c.id},${escapeExportCsv(c.name)},${escapeExportCsv(c.slug)},${escapeExportCsv(c.description)},${c.type},${c.is_private},${c.is_archived},${c.created_at}`
    )
    sections.push('# CHANNELS\n' + header + '\n' + rows.join('\n'))
  }

  if (options.includeMessages && messages.length) {
    const header = 'id,channel_id,user_id,content,type,created_at,is_pinned'
    const rows = messages.map((m) =>
      `${m.id},${m.channel_id},${m.user_id},${escapeExportCsv(m.content)},${m.type},${m.created_at},${m.is_pinned}`
    )
    sections.push('# MESSAGES\n' + header + '\n' + rows.join('\n'))
  }

  return sections.join('\n\n')
}

function escapeExportCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ============================================================================
// Export Handlers
// ============================================================================

export const GET = compose(
  withErrorHandler,
  withAuth
)(handleGet)

export const POST = compose(
  withErrorHandler,
  withRateLimit(CONFIG.RATE_LIMIT),
  withAuth
)(handlePost)

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
