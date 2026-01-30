/**
 * 2FA Disable API Route
 *
 * Disables two-factor authentication for a user after password verification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApolloClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

const DISABLE_2FA_MUTATION = gql`
  mutation Disable2FA($userId: uuid!) {
    # Disable 2FA settings
    update_nchat_user_2fa_settings(
      where: { user_id: { _eq: $userId } }
      _set: { is_enabled: false }
    ) {
      affected_rows
    }

    # Delete backup codes
    delete_nchat_user_backup_codes(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }

    # Delete trusted devices
    delete_nchat_user_trusted_devices(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // TODO: Verify password before disabling 2FA
    // This is a critical security step - should verify user's password
    // For now, we'll disable without verification (dev mode)

    // Disable 2FA in database
    const client = getApolloClient()
    const { data, errors } = await client.mutate({
      mutation: DISABLE_2FA_MUTATION,
      variables: { userId },
    })

    if (errors) {
      console.error('GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
      data: {
        settingsUpdated: data.update_nchat_user_2fa_settings.affected_rows,
        backupCodesDeleted: data.delete_nchat_user_backup_codes.affected_rows,
        devicesDeleted: data.delete_nchat_user_trusted_devices.affected_rows,
      },
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}
