/**
 * 2FA Setup API Route
 *
 * Generates TOTP secret and backup codes for two-factor authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Generate a TOTP secret (base32 encoded)
 */
function generateTOTPSecret(): string {
  const buffer = randomBytes(20)
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''

  for (let i = 0; i < buffer.length; i++) {
    secret += base32chars[buffer[i] % 32]
  }

  return secret
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }

  return codes
}

/**
 * Generate QR code data URL for TOTP
 */
function generateQRCodeData(
  secret: string,
  email: string,
  appName: string = 'nchat'
): string {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`
  return otpauthUrl
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret()

    // Generate backup codes
    const backupCodes = generateBackupCodes()

    // Generate QR code data
    // In production, you would fetch the user's email from the database
    const userEmail = 'user@example.com' // Placeholder
    const qrCodeData = generateQRCodeData(secret, userEmail)

    return NextResponse.json({
      data: {
        secret,
        qrCodeData,
        backupCodes,
        manualEntryCode: secret.match(/.{1,4}/g)?.join(' '),
      },
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to set up 2FA' },
      { status: 500 }
    )
  }
}
