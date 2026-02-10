/**
 * Domain Verification API Route
 *
 * POST /api/tenants/[id]/branding/domain/verify - Verify custom domain
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { promises as dns } from 'dns'

export const dynamic = 'force-dynamic'

/**
 * POST - Verify custom domain
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tenantId } = await params

    const { domain } = await request.json()

    const errors: string[] = []
    let verified = false

    try {
      // Check CNAME record
      const cnameRecords = await dns.resolveCname(domain)
      const expectedCname = `${tenantId}.nself.app`

      if (!cnameRecords.includes(expectedCname)) {
        errors.push(`CNAME record not found or incorrect. Expected: ${expectedCname}`)
      }

      // Check TXT record for verification
      const txtRecords = await dns.resolveTxt(`_nself-verification.${domain}`)
      const txtValue = txtRecords.flat().join('')

      // TODO: Compare with stored verification token
      if (!txtValue) {
        errors.push('Verification TXT record not found')
      }

      if (errors.length === 0) {
        verified = true

        // TODO: Update database
        // TODO: Issue SSL certificate

        logger.info('Domain verified successfully:', {
          tenantId,
          domain,
        })
      }
    } catch (error) {
      logger.error('DNS lookup failed:', error)
      errors.push('DNS lookup failed. Records may not be propagated yet.')
    }

    return NextResponse.json({
      verified,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('POST /api/tenants/[id]/branding/domain/verify failed:', error)
    return NextResponse.json({ error: 'Domain verification failed' }, { status: 500 })
  }
}
