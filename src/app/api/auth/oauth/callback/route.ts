/**
 * OAuth Callback API Route
 *
 * Handles OAuth provider callbacks after user authorization.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/account?error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/account?error=invalid_callback`
      )
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { provider } = stateData

    // Exchange code for access token
    // This would involve calling the OAuth provider's token endpoint
    // and then storing the connection in the database

    // For now, redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/account?oauth_connected=${provider}`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/account?error=callback_failed`
    )
  }
}
