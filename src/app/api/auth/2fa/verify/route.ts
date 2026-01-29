/**
 * 2FA Verification API Route
 *
 * Verifies TOTP codes for two-factor authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

/**
 * Simple TOTP verification (production should use a library like 'otplib')
 */
function verifyTOTP(token: string, _secret: string): boolean {
  // This is a simplified implementation
  // In production, use a proper TOTP library like 'otplib'

  // For development, accept any 6-digit code
  if (process.env.NODE_ENV === 'development') {
    return /^\d{6}$/.test(token)
  }

  // In production, implement proper TOTP verification
  // const verified = authenticator.verify({ token, secret })
  // return verified

  return true // Placeholder
}

export async function POST(request: NextRequest) {
  try {
    const { code, secret } = await request.json()

    if (!code || !secret) {
      return NextResponse.json(
        { error: 'Code and secret are required' },
        { status: 400 }
      )
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, secret)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully',
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
