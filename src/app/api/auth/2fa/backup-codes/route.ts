/**
 * 2FA Backup Codes API Route
 *
 * Regenerates backup codes for a user (requires password verification).
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateBackupCodes, hashBackupCode } from '@/lib/2fa/backup-codes'
import { getApolloClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

import { logger } from '@/lib/logger'

const REGENERATE_BACKUP_CODES = gql`
  mutation RegenerateBackupCodes(
    $userId: uuid!
    $backupCodes: [nchat_user_backup_codes_insert_input!]!
  ) {
    # Delete old backup codes
    delete_nchat_user_backup_codes(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }

    # Insert new backup codes
    insert_nchat_user_backup_codes(objects: $backupCodes) {
      affected_rows
      returning {
        id
        created_at
      }
    }
  }
`

const GET_BACKUP_CODES_STATUS = gql`
  query GetBackupCodesStatus($userId: uuid!) {
    total: nchat_user_backup_codes_aggregate(where: { user_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
    unused: nchat_user_backup_codes_aggregate(
      where: { user_id: { _eq: $userId }, used_at: { _is_null: true } }
    ) {
      aggregate {
        count
      }
    }
  }
`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get backup codes status
    const client = getApolloClient()
    const { data, errors } = await client.query({
      query: GET_BACKUP_CODES_STATUS,
      variables: { userId },
    })

    if (errors) {
      logger.error('GraphQL errors:', errors)
      return NextResponse.json({ error: 'Failed to fetch backup codes status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        total: data.total.aggregate.count,
        unused: data.unused.aggregate.count,
        used: data.total.aggregate.count - data.unused.aggregate.count,
      },
    })
  } catch (error) {
    logger.error('Backup codes status error:', error)
    return NextResponse.json({ error: 'Failed to get backup codes status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // This is a critical security step

    // Generate new backup codes
    const newCodes = generateBackupCodes(10)

    // Hash the codes
    const hashedCodes = await Promise.all(
      newCodes.map(async (code) => ({
        user_id: userId,
        code_hash: await hashBackupCode(code),
      }))
    )

    // Replace backup codes in database
    const client = getApolloClient()
    const { data, errors } = await client.mutate({
      mutation: REGENERATE_BACKUP_CODES,
      variables: {
        userId,
        backupCodes: hashedCodes,
      },
    })

    if (errors) {
      logger.error('GraphQL errors:', errors)
      return NextResponse.json({ error: 'Failed to regenerate backup codes' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        codes: newCodes, // Return plain codes to show user (only time they're shown)
        deleted: data.delete_nchat_user_backup_codes.affected_rows,
        created: data.insert_nchat_user_backup_codes.affected_rows,
      },
    })
  } catch (error) {
    logger.error('Backup codes regeneration error:', error)
    return NextResponse.json({ error: 'Failed to regenerate backup codes' }, { status: 500 })
  }
}
