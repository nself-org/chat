/**
 * API Route: /api/e2ee/initialize
 * Initialize E2EE for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getE2EEManager } from '@/lib/e2ee'
import { getApolloClient } from '@/lib/apollo-client'

import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { password, deviceId } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Get Apollo client (with auth context)
    const apolloClient = getApolloClient()

    // Get E2EE manager
    const e2eeManager = getE2EEManager(apolloClient)

    // Initialize E2EE
    await e2eeManager.initialize(password, deviceId)

    const status = e2eeManager.getStatus()
    const recoveryCode = e2eeManager.getRecoveryCode()

    return NextResponse.json({
      success: true,
      status,
      recoveryCode, // Only returned during initial setup
      message: 'E2EE initialized successfully',
    })
  } catch (error: any) {
    logger.error('E2EE initialization error:', error)

    return NextResponse.json(
      {
        error: 'Failed to initialize E2EE',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const apolloClient = getApolloClient()
    const e2eeManager = getE2EEManager(apolloClient)

    const status = e2eeManager.getStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error: any) {
    logger.error('E2EE status error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get E2EE status',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
