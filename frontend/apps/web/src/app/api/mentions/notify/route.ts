/**
 * Mentions Notification API Route
 *
 * POST /api/mentions/notify - Send notifications for message mentions
 *
 * Features:
 * - User mentions (@username)
 * - Channel mentions (#channel)
 * - Everyone mentions (@everyone)
 * - Here mentions (@here - online users only)
 * - Role mentions (@role)
 * - Notification batching
 * - Preference checking
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const NotifyMentionsSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  channelId: z.string().uuid('Invalid channel ID'),
  actorId: z.string().uuid('Invalid actor ID'),
  actorName: z.string().min(1),
  messagePreview: z.string().max(200),
  threadId: z.string().uuid().optional(),
  mentionedUsers: z.array(z.string().uuid()).optional(),
  mentionedChannels: z.array(z.string().uuid()).optional(),
  mentionsEveryone: z.boolean().default(false),
  mentionsHere: z.boolean().default(false),
  mentionedRoles: z.array(z.string()).optional(),
})

// ============================================================================
// GRAPHQL OPERATIONS
// ============================================================================

const CREATE_MENTION_NOTIFICATIONS = gql`
  mutation CreateMentionNotifications($notifications: [nchat_notifications_insert_input!]!) {
    insert_nchat_notifications(objects: $notifications) {
      affected_rows
      returning {
        id
        user_id
        type
      }
    }
  }
`

const GET_ONLINE_USERS = gql`
  query GetOnlineUsers($channelId: uuid!) {
    nchat_channel_members(
      where: {
        channel_id: { _eq: $channelId }
        user: { nchat_presences: { status: { _in: ["online", "active"] } } }
      }
    ) {
      user_id
      user {
        id
        display_name
        email
      }
    }
  }
`

const GET_CHANNEL_MEMBERS = gql`
  query GetChannelMembers($channelId: uuid!) {
    nchat_channel_members(where: { channel_id: { _eq: $channelId } }) {
      user_id
      notifications_enabled
      user {
        id
        display_name
        email
        preferences
      }
    }
  }
`

const GET_USER_NOTIFICATION_PREFERENCES = gql`
  query GetUserNotificationPreferences($userIds: [uuid!]!) {
    nchat_users(where: { id: { _in: $userIds } }) {
      id
      preferences
    }
  }
`

const GET_CHANNEL_INFO = gql`
  query GetChannelInfo($channelId: uuid!) {
    nchat_channels_by_pk(id: $channelId) {
      id
      name
      slug
      type
    }
  }
`

// ============================================================================
// HELPERS
// ============================================================================

function shouldNotifyUser(
  userId: string,
  preferences: Record<string, unknown>,
  mentionType: string
): boolean {
  // Check if mentions are enabled
  const mentionsEnabled = preferences.mentions_enabled !== false

  // Check if specific mention type is enabled
  const mentionTypeKey = `notify_${mentionType}`
  const mentionTypeEnabled = preferences[mentionTypeKey] !== false

  return mentionsEnabled && mentionTypeEnabled
}

// ============================================================================
// POST - Send mention notifications
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/mentions/notify')

    // Parse and validate request body
    const body = await request.json()
    const validation = NotifyMentionsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get channel info
    const { data: channelData } = await apolloClient.query({
      query: GET_CHANNEL_INFO,
      variables: { channelId: data.channelId },
      fetchPolicy: 'network-only',
    })

    const channel = channelData?.nchat_channels_by_pk
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 })
    }

    const notifications: Record<string, unknown>[] = []
    const recipientIds = new Set<string>()

    // Handle @everyone mentions
    if (data.mentionsEveryone) {
      const { data: membersData } = await apolloClient.query({
        query: GET_CHANNEL_MEMBERS,
        variables: { channelId: data.channelId },
        fetchPolicy: 'network-only',
      })

      const members = membersData?.nchat_channel_members || []
      for (const member of members) {
        if (member.user_id === data.actorId) continue // Don't notify the author
        if (!member.notifications_enabled) continue

        if (shouldNotifyUser(member.user_id, member.user.preferences || {}, 'everyone')) {
          recipientIds.add(member.user_id)
        }
      }
    }

    // Handle @here mentions (online users only)
    if (data.mentionsHere) {
      const { data: onlineData } = await apolloClient.query({
        query: GET_ONLINE_USERS,
        variables: { channelId: data.channelId },
        fetchPolicy: 'network-only',
      })

      const onlineUsers = onlineData?.nchat_channel_members || []
      for (const member of onlineUsers) {
        if (member.user_id === data.actorId) continue

        recipientIds.add(member.user_id)
      }
    }

    // Handle individual user mentions
    if (data.mentionedUsers && data.mentionedUsers.length > 0) {
      const { data: prefsData } = await apolloClient.query({
        query: GET_USER_NOTIFICATION_PREFERENCES,
        variables: { userIds: data.mentionedUsers },
        fetchPolicy: 'network-only',
      })

      const users = prefsData?.nchat_users || []
      for (const user of users) {
        if (user.id === data.actorId) continue

        if (shouldNotifyUser(user.id, user.preferences || {}, 'user')) {
          recipientIds.add(user.id)
        }
      }
    }

    // Create notification objects
    for (const userId of recipientIds) {
      const notificationType = data.mentionsEveryone
        ? 'mention_everyone'
        : data.mentionsHere
          ? 'mention_here'
          : 'mention_user'

      notifications.push({
        user_id: userId,
        type: notificationType,
        title: `${data.actorName} mentioned you in #${channel.name}`,
        content: data.messagePreview,
        metadata: {
          message_id: data.messageId,
          channel_id: data.channelId,
          channel_name: channel.name,
          channel_slug: channel.slug,
          actor_id: data.actorId,
          actor_name: data.actorName,
          thread_id: data.threadId,
          mention_type: notificationType,
        },
      })
    }

    // Batch insert notifications
    if (notifications.length > 0) {
      const { data: insertData, errors } = await apolloClient.mutate({
        mutation: CREATE_MENTION_NOTIFICATIONS,
        variables: { notifications },
      })

      if (errors) {
        throw new Error(errors[0].message)
      }

      logger.info('Mention notifications created', {
        messageId: data.messageId,
        recipientCount: notifications.length,
        affectedRows: insertData.insert_nchat_notifications.affected_rows,
      })
    }

    // TODO: Send push notifications and emails based on user preferences
    // This would integrate with notification service

    return NextResponse.json({
      success: true,
      data: {
        recipientCount: notifications.length,
        notificationIds: notifications.map((n) => n.id),
        messageId: data.messageId,
        channelId: data.channelId,
      },
    })
  } catch (error) {
    logger.error('POST /api/mentions/notify - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send mention notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
