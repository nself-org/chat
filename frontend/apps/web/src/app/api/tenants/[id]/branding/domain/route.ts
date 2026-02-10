/**
 * Domain Configuration API Route
 *
 * POST /api/tenants/[id]/branding/domain - Configure custom domain
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST - Configure custom domain
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tenantId } = await params

    const { domain, userId } = await request.json()

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')

    // Generate DNS records
    const dnsRecords = [
      {
        type: 'CNAME',
        name: domain,
        value: `${tenantId}.nself.app`, // Replace with actual platform domain
      },
      {
        type: 'TXT',
        name: `_nself-verification.${domain}`,
        value: verificationToken,
      },
    ]

    // TODO: Save to database
    // TODO: Schedule verification check

    logger.info('Custom domain configured:', {
      tenantId,
      domain,
      userId,
    })

    return NextResponse.json({
      dnsRecords,
      verificationToken,
    })
  } catch (error) {
    logger.error('POST /api/tenants/[id]/branding/domain failed:', error)
    return NextResponse.json({ error: 'Domain configuration failed' }, { status: 500 })
  }
}
