import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, displayName } = body

    // In development mode, use mock data
    if (process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') {
      // Check if this is the first user by querying the database
      const userCountResponse = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
        },
        body: JSON.stringify({
          query: `
            query GetUserCount {
              nchat_users_aggregate {
                aggregate {
                  count
                }
              }
            }
          `,
        }),
      })

      const userCountData = await userCountResponse.json()
      const userCount = userCountData?.data?.nchat_users_aggregate?.aggregate?.count || 0
      const isFirstUser = userCount === 0

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