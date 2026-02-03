/**
 * API Route: /api/e2ee/keys/replenish
 * Replenish one-time prekeys
 */

import { NextRequest, NextResponse } from 'next/server'
import { getE2EEManager } from '@/lib/e2ee'
import { getApolloClient } from '@/lib/apollo-client'

import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { count = 50 } = await request.json()

    const apolloClient = getApolloClient()
    const e2eeManager = getE2EEManager(apolloClient)

    if (!e2eeManager.isInitialized()) {
      return NextResponse.json({ error: 'E2EE not initialized' }, { status: 400 })
    }

    // Replenish one-time prekeys
    await e2eeManager.replenishOneTimePreKeys(count)

    return NextResponse.json({
      success: true,
      message: `Successfully replenished ${count} one-time prekeys`,
      count,
    })
  } catch (error: any) {
    logger.error('Prekey replenishment error:', error)

    return NextResponse.json(
      {
        error: 'Failed to replenish prekeys',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
