import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'postgres',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Query the database for the user
    const userQuery = `
      SELECT
        au.id as auth_id,
        au.email,
        au.encrypted_password,
        au.given_name,
        au.family_name,
        nu.id,
        nu.username,
        nu.display_name,
        nu.avatar_url,
        nu.status,
        r.name as role,
        r.priority as role_priority
      FROM auth.users au
      LEFT JOIN nchat.nchat_user nu ON au.id = nu.user_id
      LEFT JOIN nchat.nchat_user_role ur ON nu.id = ur.user_id
      LEFT JOIN nchat.nchat_role r ON ur.role_id = r.id
      WHERE LOWER(au.email) = LOWER($1)
      ORDER BY r.priority DESC NULLS LAST
      LIMIT 1
    `

    const result = await pool.query(userQuery, [email])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Debug logging
    console.log('User query result:', {
      email: user.email,
      username: user.username,
      role: user.role,
      role_priority: user.role_priority
    })

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.encrypted_password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: user.id,
        auth_id: user.auth_id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        role: user.role || 'member',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const refreshToken = jwt.sign(
      { sub: user.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Return user data and tokens
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name || user.username,
        avatarUrl: user.avatar_url,
        role: user.role || 'member',
        status: user.status || 'online',
      },
      accessToken,
      refreshToken,
    }

    console.log('Sending response with role:', responseData.user.role)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}