import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, displayName } = body

    // TODO: Implement actual user creation with Hasura Auth
    // For now, return mock data
    if (email && password && username) {
      // Check if this is the first user (make them owner)
      const isFirstUser = true // TODO: Query database to check
      
      const mockUser = {
        id: Date.now().toString(),
        email,
        username,
        displayName: displayName || username,
        role: isFirstUser ? 'owner' : 'member',
      }

      const mockToken = Buffer.from(JSON.stringify({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        displayName: mockUser.displayName,
        role: mockUser.role,
      })).toString('base64')

      return NextResponse.json({
        token: `mock.${mockToken}.signature`,
        user: mockUser,
      })
    }

    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}