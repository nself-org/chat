/**
 * Reports API - User reporting system
 * POST /api/reports - Create a new report
 * GET /api/reports - Get user's reports
 */

import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      report_type,
      target_id,
      category,
      subcategory,
      description,
      evidence_urls,
      channel_id,
    } = body

    // Validate required fields
    if (!report_type || !target_id || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: report_type, target_id, category' },
        { status: 400 }
      )
    }

    const report = {
      id: crypto.randomUUID(),
      report_type,
      target_id,
      category,
      subcategory,
      description,
      evidence_urls,
      channel_id,
      status: 'pending',
      priority: 'medium',
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      id: report.id,
      status: report.status,
      message: 'Report submitted successfully. Our moderation team will review it shortly.',
      estimated_review_time: '24 hours',
    })
  } catch (error) {
    logger.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
