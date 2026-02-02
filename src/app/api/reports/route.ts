/**
 * Reports API Route - RESTful API for report management
 *
 * Endpoints:
 * - GET    /api/reports - List reports with filters
 * - POST   /api/reports - Submit a new report
 * - PATCH  /api/reports/:id - Update report status/assignment
 * - DELETE /api/reports/:id - Delete a report (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createReportHandler,
  createActionContext,
  type ReportAction,
} from '@/lib/moderation/report-handler'
import type {
  CreateReportInput,
  UpdateReportInput,
  ReportFilter,
  ReportTargetType,
  ReportStatus,
  ReportPriority,
} from '@/lib/moderation/report-system'

// ============================================================================
// Types
// ============================================================================

interface ReportSubmitRequest {
  reporterId: string
  reporterName?: string
  targetType: ReportTargetType
  targetId: string
  targetName?: string
  categoryId: string
  description: string
  evidence?: Array<{
    type: 'screenshot' | 'link' | 'text' | 'file'
    content: string
    description?: string
  }>
  metadata?: Record<string, unknown>
}

interface ReportActionRequest {
  reportId: string
  moderatorId: string
  moderatorName?: string
  action: ReportAction
  notes?: string
}

interface ReportUpdateRequest {
  status?: ReportStatus
  priority?: ReportPriority
  assignedTo?: string
  assignedToName?: string
  resolution?: string
}

interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// Initialize Report Handler
// ============================================================================

const reportHandler = createReportHandler({
  enableAutoModeration: true,
  enableNotifications: true,
  enableEscalation: true,
  notificationChannels: ['in-app', 'email'],
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates request body
 */
function validateRequestBody(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null
}

/**
 * Extracts filter from query params
 */
function extractFilter(searchParams: URLSearchParams): ReportFilter {
  const filter: ReportFilter = {}

  const status = searchParams.get('status')
  if (status && status !== 'all') {
    filter.status = status as ReportStatus
  }

  const priority = searchParams.get('priority')
  if (priority && priority !== 'all') {
    filter.priority = priority as ReportPriority
  }

  const targetType = searchParams.get('targetType')
  if (targetType && targetType !== 'all') {
    filter.targetType = targetType as ReportTargetType
  }

  const categoryId = searchParams.get('categoryId')
  if (categoryId) {
    filter.categoryId = categoryId
  }

  const assignedTo = searchParams.get('assignedTo')
  if (assignedTo) {
    filter.assignedTo = assignedTo
  }

  const _search = searchParams.get('search')
  // TODO: Implement search filtering in the query

  const _sortBy = searchParams.get('sortBy')
  // TODO: Implement sorting in the query

  const _sortOrder = searchParams.get('sortOrder')
  // TODO: Implement sort order in the query

  return filter
}

/**
 * Gets auth user from request (placeholder - implement based on your auth)
 */
async function getAuthUser(request: NextRequest): Promise<{
  id: string
  name?: string
  role: string
} | null> {
  // In a real implementation, this would:
  // 1. Extract JWT from Authorization header
  // 2. Verify token
  // 3. Return user info
  //
  // For now, return mock data
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  // Mock user - replace with actual auth
  return {
    id: 'user-123',
    name: 'Admin User',
    role: 'admin',
  }
}

/**
 * Checks if user has moderator permissions
 */
function isModerator(role: string): boolean {
  return ['admin', 'moderator', 'owner'].includes(role)
}

// ============================================================================
// GET /api/reports - List reports
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions (moderators and admins only)
    if (!isModerator(user.role)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Forbidden - moderator access required' },
        { status: 403 }
      )
    }

    // Extract filter from query params
    const { searchParams } = new URL(request.url)
    const filter = extractFilter(searchParams)

    // Get reports from queue
    const queue = reportHandler.getQueue()
    const reports = queue.getReports(filter)

    // Get stats
    const stats = queue.getStats()

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        reports,
        stats,
        count: reports.length,
      },
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/reports - Submit a new report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    if (!validateRequestBody(body)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const data = body as unknown as ReportSubmitRequest

    // Validate required fields
    if (!data.reporterId || !data.targetType || !data.targetId || !data.categoryId) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Missing required fields: reporterId, targetType, targetId, categoryId',
        },
        { status: 400 }
      )
    }

    if (!data.description || data.description.trim().length === 0) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    // Create report input
    const input: CreateReportInput = {
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      targetType: data.targetType,
      targetId: data.targetId,
      targetName: data.targetName,
      categoryId: data.categoryId,
      description: data.description,
      evidence: data.evidence,
      metadata: data.metadata,
    }

    // Submit report
    const result = await reportHandler.submitReport(input)

    if (!result.success) {
      return NextResponse.json<APIResponse>(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Get the created report
    const report = reportHandler.getQueue().getReport(result.reportId)

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { report, reportId: result.reportId },
        message: result.message,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting report:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/reports - Update report or process action
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!isModerator(user.role)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Forbidden - moderator access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    if (!validateRequestBody(body)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if this is an action request or update request
    if ('action' in body) {
      // Process action
      const actionData = body as unknown as ReportActionRequest

      if (!actionData.reportId || !actionData.action) {
        return NextResponse.json<APIResponse>(
          { success: false, error: 'Missing reportId or action' },
          { status: 400 }
        )
      }

      const context = createActionContext(
        actionData.reportId,
        actionData.moderatorId || user.id,
        actionData.action,
        {
          moderatorName: actionData.moderatorName || user.name,
          notes: actionData.notes,
        }
      )

      const result = await reportHandler.processAction(context)

      if (!result.success) {
        return NextResponse.json<APIResponse>(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      // Get updated report
      const report = reportHandler.getQueue().getReport(result.reportId)

      return NextResponse.json<APIResponse>({
        success: true,
        data: { report, result },
        message: result.message,
      })
    } else {
      // Process update
      const updateData = body as unknown as ReportUpdateRequest & { reportId: string }

      if (!updateData.reportId) {
        return NextResponse.json<APIResponse>(
          { success: false, error: 'Missing reportId' },
          { status: 400 }
        )
      }

      const queue = reportHandler.getQueue()
      const updates: UpdateReportInput = {
        status: updateData.status,
        priority: updateData.priority,
        assignedTo: updateData.assignedTo,
        assignedToName: updateData.assignedToName,
        resolution: updateData.resolution,
      }

      const result = queue.updateReport(updateData.reportId, updates, user.id)

      if (!result.success) {
        return NextResponse.json<APIResponse>(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json<APIResponse>({
        success: true,
        data: { report: result.report },
        message: 'Report updated successfully',
      })
    }
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/reports - Delete a report (admin only)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions (admin only)
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      )
    }

    // Get report ID from query params
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Missing report ID' },
        { status: 400 }
      )
    }

    // Delete report
    const queue = reportHandler.getQueue()
    const deleted = queue.deleteReport(reportId)

    if (!deleted) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<APIResponse>({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// OPTIONS - CORS preflight
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
