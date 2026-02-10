/**
 * Template Switching API Route
 *
 * POST /api/tenants/[id]/branding/template - Switch template
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadTemplate } from '@/templates'
import type { TemplateId } from '@/templates/types'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST - Switch template
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tenantId } = await params

    const { templateId, userId, preserveCustomizations } = await request.json()

    // Validate template ID
    const validTemplates: TemplateId[] = ['default', 'slack', 'discord', 'telegram', 'whatsapp']
    if (!validTemplates.includes(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 })
    }

    // Load template configuration
    const template = await loadTemplate(templateId)

    // TODO: Merge with existing customizations if preserveCustomizations is true
    // TODO: Update database
    // TODO: Add to changelog

    logger.info('Template switched:', {
      tenantId,
      templateId,
      userId,
      preserveCustomizations,
    })

    const branding = {
      tenantId,
      templateId,
      customTemplate: preserveCustomizations ? {} : null,
      audit: {
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
        version: 2,
        changelog: [
          {
            timestamp: new Date(),
            userId,
            action: 'switch_template',
            changes: { templateId, preserveCustomizations },
          },
        ],
      },
    }

    return NextResponse.json(branding)
  } catch (error) {
    logger.error('POST /api/tenants/[id]/branding/template failed:', error)
    return NextResponse.json({ error: 'Template switch failed' }, { status: 500 })
  }
}
