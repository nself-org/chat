/**
 * Sessions API Route
 *
 * Endpoints:
 * - GET /api/auth/sessions - List user sessions
 * - POST /api/auth/sessions - Create new session
 * - DELETE /api/auth/sessions/:id - Revoke session
 * - DELETE /api/auth/sessions/all - Revoke all other sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/lib/auth/session-manager'

import { logger } from '@/lib/logger'

// ============================================================================
// GET - List Sessions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // In production, this would fetch from database
    // For now, return mock data or use GraphQL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth headers if needed
        },
        body: JSON.stringify({
          query: `
            query GetUserSessions($userId: uuid!) {
              nchat_user_sessions(
                where: { user_id: { _eq: $userId } }
                order_by: { last_active_at: desc }
              ) {
                id
                user_id
                device
                browser
                os
                ip_address
                location
                is_current
                created_at
                last_active_at
                expires_at
              }
            }
          `,
          variables: { userId },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch sessions from GraphQL')
    }

    const data = await response.json()

    // Validate sessions
    const sessions = data.data?.nchat_user_sessions || []
    const validSessions = sessions.filter((session: any) => {
      return sessionManager.validateSession(session).valid
    })

    return NextResponse.json({
      sessions: validSessions,
      total: validSessions.length,
    })
  } catch (error) {
    logger.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create Session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, rememberMe, deviceFingerprint, ipAddress } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    // Get location from IP (using a geolocation service)
    let location = undefined
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`)
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        location = {
          city: geoData.city,
          country: geoData.country_name,
          region: geoData.region,
          countryCode: geoData.country_code,
        }
      }
    } catch (error) {
      logger.warn('Failed to get geolocation:', { context: error })
    }

    // Create session
    const session = await sessionManager.createSession({
      userId,
      rememberMe,
      deviceFingerprint,
      location,
      ipAddress,
    })

    // In production, save to database via GraphQL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateSession($session: nchat_user_sessions_insert_input!) {
              insert_nchat_user_sessions_one(object: $session) {
                id
                user_id
                device
                browser
                os
                ip_address
                location
                is_current
                created_at
                last_active_at
                expires_at
              }
            }
          `,
          variables: {
            session: {
              id: session.id,
              user_id: session.userId,
              device: session.device,
              browser: session.browser,
              os: session.os,
              ip_address: session.ipAddress,
              location: session.location,
              is_current: session.isCurrent,
              created_at: session.createdAt,
              last_active_at: session.lastActiveAt,
              expires_at: session.expiresAt,
            },
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to save session to database')
    }

    const data = await response.json()
    const createdSession = data.data?.insert_nchat_user_sessions_one

    // Check for suspicious activity
    const previousSessionsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetPreviousSessions($userId: uuid!, $currentSessionId: uuid!) {
              nchat_user_sessions(
                where: {
                  user_id: { _eq: $userId }
                  id: { _neq: $currentSessionId }
                }
                order_by: { created_at: desc }
                limit: 10
              ) {
                id
                device
                browser
                os
                location
                created_at
              }
            }
          `,
          variables: {
            userId,
            currentSessionId: session.id,
          },
        }),
      }
    )

    let suspiciousActivity = null
    if (previousSessionsResponse.ok) {
      const previousData = await previousSessionsResponse.json()
      const previousSessions = previousData.data?.nchat_user_sessions || []

      suspiciousActivity = sessionManager.detectSuspiciousActivity(session, previousSessions)
    }

    return NextResponse.json({
      session: createdSession || session,
      suspiciousActivity,
    })
  } catch (error) {
    logger.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// ============================================================================
// DELETE - Revoke Session
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const revokeAll = searchParams.get('revokeAll') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (revokeAll) {
      // Revoke all other sessions (keep current)
      const currentSessionId = searchParams.get('currentSessionId')

      if (!currentSessionId) {
        return NextResponse.json({ error: 'Current session ID required' }, { status: 400 })
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation RevokeAllOtherSessions($userId: uuid!, $currentSessionId: uuid!) {
                delete_nchat_user_sessions(
                  where: {
                    user_id: { _eq: $userId }
                    id: { _neq: $currentSessionId }
                  }
                ) {
                  affected_rows
                }
              }
            `,
            variables: {
              userId,
              currentSessionId,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to revoke sessions')
      }

      const data = await response.json()
      const affectedRows = data.data?.delete_nchat_user_sessions?.affected_rows || 0

      return NextResponse.json({
        success: true,
        revokedCount: affectedRows,
      })
    } else {
      // Revoke single session
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation RevokeSession($sessionId: uuid!) {
                delete_nchat_user_sessions_by_pk(id: $sessionId) {
                  id
                }
              }
            `,
            variables: {
              sessionId,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to revoke session')
      }

      return NextResponse.json({
        success: true,
        revokedSessionId: sessionId,
      })
    }
  } catch (error) {
    logger.error('Error revoking session:', error)
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 })
  }
}
