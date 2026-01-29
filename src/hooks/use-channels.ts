'use client'

/**
 * Channel Management Hooks
 *
 * React hooks for channel lifecycle, membership, and settings with proper
 * error handling, logging, and user feedback.
 */

import { useSubscription, useMutation } from '@apollo/client'
import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { logger } from '@/lib/logger'
import { useToast } from '@/hooks/use-toast'
import {
  USER_CHANNELS_SUBSCRIPTION,
  CHANNEL_DETAILS_SUBSCRIPTION,
} from '@/graphql/subscriptions/channels'
import {
  CREATE_CHANNEL,
  UPDATE_CHANNEL,
  DELETE_CHANNEL,
  ARCHIVE_CHANNEL,
  UNARCHIVE_CHANNEL,
  JOIN_CHANNEL,
  LEAVE_CHANNEL,
  ADD_CHANNEL_MEMBER,
  REMOVE_CHANNEL_MEMBER,
  UPDATE_MEMBER_ROLE,
  TRANSFER_OWNERSHIP,
  MUTE_CHANNEL,
  UNMUTE_CHANNEL,
  PIN_CHANNEL,
  UNPIN_CHANNEL,
  UPDATE_CHANNEL_NOTIFICATIONS,
  UPDATE_CHANNEL_PRIVACY,
  ADD_MULTIPLE_MEMBERS,
  REMOVE_MULTIPLE_MEMBERS,
  type CreateChannelInput,
  type UpdateChannelInput,
  type ChannelMemberInput,
  type BulkMemberInput,
} from '@/graphql/mutations/channels'
import {
  MARK_CHANNEL_READ,
} from '@/graphql/mutations/read-receipts'

interface Channel {
  id: string
  name: string
  description?: string
  type: string
  is_private: boolean
  created_at: string
  updated_at: string
  owner_id: string
  topic?: string
  icon?: string
  members_aggregate?: { aggregate: { count: number } }
}

interface ChannelMembership {
  channel: Channel
  role: string
  joined_at: string
  is_muted: boolean
  last_read_at?: string
}

export function useUserChannels() {
  const { user } = useAuth()

  const { data, loading, error } = useSubscription(USER_CHANNELS_SUBSCRIPTION, {
    variables: { userId: user?.id },
    skip: !user?.id,
  })

  const channels = useMemo(() => {
    return (data?.nchat_channel_members ?? []).map((m: ChannelMembership) => ({
      ...m.channel,
      userRole: m.role,
      isMuted: m.is_muted,
      lastReadAt: m.last_read_at,
    }))
  }, [data])

  return { channels, loading, error }
}

export function useChannelDetails(channelId: string | null) {
  const { data, loading, error } = useSubscription(CHANNEL_DETAILS_SUBSCRIPTION, {
    variables: { channelId },
    skip: !channelId,
  })

  return {
    channel: data?.nchat_channels_by_pk as Channel | null,
    loading,
    error,
  }
}

export function useChannelMutations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // ============================================================================
  // Channel CRUD Mutations
  // ============================================================================

  const [createChannelMutation, { loading: creatingChannel }] = useMutation(CREATE_CHANNEL)
  const [updateChannelMutation, { loading: updatingChannel }] = useMutation(UPDATE_CHANNEL)
  const [deleteChannelMutation, { loading: deletingChannel }] = useMutation(DELETE_CHANNEL)
  const [archiveChannelMutation, { loading: archivingChannel }] =
    useMutation(ARCHIVE_CHANNEL)
  const [unarchiveChannelMutation, { loading: unarchivingChannel }] =
    useMutation(UNARCHIVE_CHANNEL)

  const createChannel = useCallback(
    async (input: CreateChannelInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Creating channel', { userId: user.id, channelName: input.name })

        const { data } = await createChannelMutation({
          variables: {
            name: input.name,
            description: input.description,
            type: input.type,
            isPrivate: input.isPrivate,
            topic: input.topic,
            icon: input.icon,
            categoryId: input.categoryId,
          },
        })

        const channel = data.insert_nchat_channels_one

        logger.info('Channel created', { userId: user.id, channelId: channel.id })
        toast({
          title: 'Channel created',
          description: `#${channel.name} has been created successfully.`,
        })

        // Navigate to new channel
        router.push(`/chat/c/${channel.slug}`)

        return channel
      } catch (error) {
        logger.error('Failed to create channel', error as Error, { userId: user.id })
        toast({
          title: 'Failed to create channel',
          description: 'Could not create the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, createChannelMutation, router, toast]
  )

  const updateChannel = useCallback(
    async (channelId: string, updates: UpdateChannelInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Updating channel', { userId: user.id, channelId, updates })

        const { data } = await updateChannelMutation({
          variables: { channelId, ...updates },
        })

        logger.info('Channel updated', { userId: user.id, channelId })
        toast({
          title: 'Channel updated',
          description: 'Channel settings have been saved.',
        })

        return data.update_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to update channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Update failed',
          description: 'Could not update the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, updateChannelMutation, toast]
  )

  const deleteChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.warn('Deleting channel', { userId: user.id, channelId })

        const { data } = await deleteChannelMutation({
          variables: { channelId },
        })

        logger.warn('Channel deleted', { userId: user.id, channelId })
        toast({
          title: 'Channel deleted',
          description: `#${data.delete_nchat_channels_by_pk.name} has been deleted.`,
        })

        // Navigate away from deleted channel
        router.push('/chat')

        return data.delete_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to delete channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Delete failed',
          description: 'Could not delete the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, deleteChannelMutation, router, toast]
  )

  const archiveChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Archiving channel', { userId: user.id, channelId })

        const { data } = await archiveChannelMutation({
          variables: { channelId },
        })

        logger.info('Channel archived', { userId: user.id, channelId })
        toast({
          title: 'Channel archived',
          description: 'This channel has been archived and hidden from the sidebar.',
        })

        return data.update_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to archive channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Archive failed',
          description: 'Could not archive the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, archiveChannelMutation, toast]
  )

  const unarchiveChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Unarchiving channel', { userId: user.id, channelId })

        const { data } = await unarchiveChannelMutation({
          variables: { channelId },
        })

        logger.info('Channel unarchived', { userId: user.id, channelId })
        toast({
          title: 'Channel restored',
          description: 'This channel has been unarchived.',
        })

        return data.update_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to unarchive channel', error as Error, {
          userId: user.id,
          channelId,
        })
        toast({
          title: 'Unarchive failed',
          description: 'Could not unarchive the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, unarchiveChannelMutation, toast]
  )

  // ============================================================================
  // Membership Mutations
  // ============================================================================

  const [joinChannelMutation, { loading: joiningChannel }] = useMutation(JOIN_CHANNEL)
  const [leaveChannelMutation, { loading: leavingChannel }] = useMutation(LEAVE_CHANNEL)
  const [addMemberMutation, { loading: addingMember }] = useMutation(ADD_CHANNEL_MEMBER)
  const [removeMemberMutation, { loading: removingMember }] =
    useMutation(REMOVE_CHANNEL_MEMBER)
  const [updateRoleMutation, { loading: updatingRole }] = useMutation(UPDATE_MEMBER_ROLE)
  const [transferOwnershipMutation, { loading: transferringOwnership }] =
    useMutation(TRANSFER_OWNERSHIP)

  const joinChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Joining channel', { userId: user.id, channelId })

        const { data } = await joinChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Joined channel', { userId: user.id, channelId })
        toast({
          title: 'Joined channel',
          description: 'You have joined this channel.',
        })

        return data.insert_nchat_channel_members_one
      } catch (error) {
        logger.error('Failed to join channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Join failed',
          description: 'Could not join the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, joinChannelMutation, toast]
  )

  const leaveChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Leaving channel', { userId: user.id, channelId })

        await leaveChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Left channel', { userId: user.id, channelId })
        toast({
          title: 'Left channel',
          description: 'You have left this channel.',
        })

        // Navigate away from left channel
        router.push('/chat')
      } catch (error) {
        logger.error('Failed to leave channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Leave failed',
          description: 'Could not leave the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, leaveChannelMutation, router, toast]
  )

  const addChannelMember = useCallback(
    async (input: ChannelMemberInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Adding channel member', {
          adminId: user.id,
          channelId: input.channelId,
          targetUserId: input.userId,
        })

        const { data } = await addMemberMutation({
          variables: {
            channelId: input.channelId,
            userId: input.userId,
            role: input.role || 'member',
          },
        })

        logger.info('Channel member added', {
          adminId: user.id,
          channelId: input.channelId,
          targetUserId: input.userId,
        })
        toast({
          title: 'Member added',
          description: 'User has been added to the channel.',
        })

        return data.insert_nchat_channel_members_one
      } catch (error) {
        logger.error('Failed to add channel member', error as Error, { userId: user.id })
        toast({
          title: 'Add member failed',
          description: 'Could not add the member. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, addMemberMutation, toast]
  )

  const removeChannelMember = useCallback(
    async (channelId: string, memberId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Removing channel member', { userId: user.id, channelId, memberId })

        await removeMemberMutation({
          variables: { channelId, userId: memberId },
        })

        logger.info('Channel member removed', { userId: user.id, channelId, memberId })
        toast({
          title: 'Member removed',
          description: 'User has been removed from the channel.',
        })
      } catch (error) {
        logger.error('Failed to remove channel member', error as Error, {
          userId: user.id,
          channelId,
          memberId,
        })
        toast({
          title: 'Remove member failed',
          description: 'Could not remove the member. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, removeMemberMutation, toast]
  )

  const updateMemberRole = useCallback(
    async (channelId: string, memberId: string, role: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Updating member role', { userId: user.id, channelId, memberId, role })

        const { data } = await updateRoleMutation({
          variables: { channelId, userId: memberId, role },
        })

        logger.info('Member role updated', { userId: user.id, channelId, memberId, role })
        toast({
          title: 'Role updated',
          description: `Member role has been changed to ${role}.`,
        })

        return data.update_nchat_channel_members
      } catch (error) {
        logger.error('Failed to update member role', error as Error, {
          userId: user.id,
          channelId,
          memberId,
        })
        toast({
          title: 'Update role failed',
          description: 'Could not update the member role. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, updateRoleMutation, toast]
  )

  const transferOwnership = useCallback(
    async (channelId: string, newOwnerId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.warn('Transferring channel ownership', { userId: user.id, channelId, newOwnerId })

        const { data } = await transferOwnershipMutation({
          variables: { channelId, newOwnerId },
        })

        logger.warn('Channel ownership transferred', { userId: user.id, channelId, newOwnerId })
        toast({
          title: 'Ownership transferred',
          description: 'Channel ownership has been transferred successfully.',
        })

        return data.update_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to transfer ownership', error as Error, {
          userId: user.id,
          channelId,
        })
        toast({
          title: 'Transfer failed',
          description: 'Could not transfer ownership. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, transferOwnershipMutation, toast]
  )

  // ============================================================================
  // Channel Settings Mutations
  // ============================================================================

  const [muteChannelMutation, { loading: mutingChannel }] = useMutation(MUTE_CHANNEL)
  const [unmuteChannelMutation, { loading: unmutingChannel }] = useMutation(UNMUTE_CHANNEL)
  const [pinChannelMutation, { loading: pinningChannel }] = useMutation(PIN_CHANNEL)
  const [unpinChannelMutation, { loading: unpinningChannel }] = useMutation(UNPIN_CHANNEL)
  const [updateNotificationsMutation, { loading: updatingNotifications }] = useMutation(
    UPDATE_CHANNEL_NOTIFICATIONS
  )
  const [markReadMutation, { loading: markingRead }] = useMutation(MARK_CHANNEL_READ)
  const [updatePrivacyMutation, { loading: updatingPrivacy }] =
    useMutation(UPDATE_CHANNEL_PRIVACY)

  const muteChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Muting channel', { userId: user.id, channelId })

        await muteChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Channel muted', { userId: user.id, channelId })
        toast({
          title: 'Channel muted',
          description: 'You will no longer receive notifications from this channel.',
        })
      } catch (error) {
        logger.error('Failed to mute channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Mute failed',
          description: 'Could not mute the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, muteChannelMutation, toast]
  )

  const unmuteChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Unmuting channel', { userId: user.id, channelId })

        await unmuteChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Channel unmuted', { userId: user.id, channelId })
        toast({
          title: 'Channel unmuted',
          description: 'You will now receive notifications from this channel.',
        })
      } catch (error) {
        logger.error('Failed to unmute channel', error as Error, { userId: user.id, channelId })
        toast({
          title: 'Unmute failed',
          description: 'Could not unmute the channel. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, unmuteChannelMutation, toast]
  )

  const pinChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Pinning channel', { userId: user.id, channelId })

        await pinChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Channel pinned', { userId: user.id, channelId })
      } catch (error) {
        logger.error('Failed to pin channel', error as Error, { userId: user.id, channelId })
        throw error
      }
    },
    [user?.id, pinChannelMutation]
  )

  const unpinChannel = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Unpinning channel', { userId: user.id, channelId })

        await unpinChannelMutation({
          variables: { channelId, userId: user.id },
        })

        logger.info('Channel unpinned', { userId: user.id, channelId })
      } catch (error) {
        logger.error('Failed to unpin channel', error as Error, { userId: user.id, channelId })
        throw error
      }
    },
    [user?.id, unpinChannelMutation]
  )

  const updateChannelNotifications = useCallback(
    async (channelId: string, enabled: boolean) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Updating channel notifications', { userId: user.id, channelId, enabled })

        await updateNotificationsMutation({
          variables: { channelId, userId: user.id, notificationsEnabled: enabled },
        })

        logger.info('Channel notifications updated', { userId: user.id, channelId, enabled })
        toast({
          title: enabled ? 'Notifications enabled' : 'Notifications disabled',
          description: enabled
            ? 'You will receive notifications from this channel.'
            : 'You will not receive notifications from this channel.',
        })
      } catch (error) {
        logger.error('Failed to update channel notifications', error as Error, {
          userId: user.id,
          channelId,
        })
        toast({
          title: 'Update failed',
          description: 'Could not update notification settings. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, updateNotificationsMutation, toast]
  )

  const markChannelRead = useCallback(
    async (channelId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.debug('Marking channel as read', { userId: user.id, channelId })

        await markReadMutation({
          variables: { channelId, userId: user.id },
        })
      } catch (error) {
        logger.error('Failed to mark channel read', error as Error, { userId: user.id, channelId })
        // Silent failure for mark read
      }
    },
    [user?.id, markReadMutation]
  )

  const updateChannelPrivacy = useCallback(
    async (channelId: string, isPrivate: boolean) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Updating channel privacy', { userId: user.id, channelId, isPrivate })

        const { data } = await updatePrivacyMutation({
          variables: { channelId, isPrivate },
        })

        logger.info('Channel privacy updated', { userId: user.id, channelId, isPrivate })
        toast({
          title: 'Privacy updated',
          description: `Channel is now ${isPrivate ? 'private' : 'public'}.`,
        })

        return data.update_nchat_channels_by_pk
      } catch (error) {
        logger.error('Failed to update channel privacy', error as Error, {
          userId: user.id,
          channelId,
        })
        toast({
          title: 'Update failed',
          description: 'Could not update channel privacy. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, updatePrivacyMutation, toast]
  )

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  const [addMultipleMutation, { loading: addingMultiple }] =
    useMutation(ADD_MULTIPLE_MEMBERS)
  const [removeMultipleMutation, { loading: removingMultiple }] = useMutation(
    REMOVE_MULTIPLE_MEMBERS
  )

  const addMultipleMembers = useCallback(
    async (members: BulkMemberInput[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Adding multiple channel members', { userId: user.id, count: members.length })

        const { data } = await addMultipleMutation({
          variables: { members },
        })

        logger.info('Multiple channel members added', {
          userId: user.id,
          count: data.insert_nchat_channel_members.affected_rows,
        })
        toast({
          title: 'Members added',
          description: `${data.insert_nchat_channel_members.affected_rows} members have been added.`,
        })

        return data.insert_nchat_channel_members
      } catch (error) {
        logger.error('Failed to add multiple members', error as Error, { userId: user.id })
        toast({
          title: 'Bulk add failed',
          description: 'Could not add all members. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, addMultipleMutation, toast]
  )

  const removeMultipleMembers = useCallback(
    async (channelId: string, userIds: string[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        logger.info('Removing multiple channel members', {
          userId: user.id,
          channelId,
          count: userIds.length,
        })

        const { data } = await removeMultipleMutation({
          variables: { channelId, userIds },
        })

        logger.info('Multiple channel members removed', {
          userId: user.id,
          count: data.delete_nchat_channel_members.affected_rows,
        })
        toast({
          title: 'Members removed',
          description: `${data.delete_nchat_channel_members.affected_rows} members have been removed.`,
        })

        return data.delete_nchat_channel_members
      } catch (error) {
        logger.error('Failed to remove multiple members', error as Error, {
          userId: user.id,
          channelId,
        })
        toast({
          title: 'Bulk remove failed',
          description: 'Could not remove all members. Please try again.',
          variant: 'destructive',
        })
        throw error
      }
    },
    [user?.id, removeMultipleMutation, toast]
  )

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // CRUD
    createChannel,
    updateChannel,
    deleteChannel,
    archiveChannel,
    unarchiveChannel,
    creatingChannel,
    updatingChannel,
    deletingChannel,
    archivingChannel,
    unarchivingChannel,

    // Membership
    joinChannel,
    leaveChannel,
    addChannelMember,
    removeChannelMember,
    updateMemberRole,
    transferOwnership,
    joiningChannel,
    leavingChannel,
    addingMember,
    removingMember,
    updatingRole,
    transferringOwnership,

    // Settings
    muteChannel,
    unmuteChannel,
    pinChannel,
    unpinChannel,
    updateChannelNotifications,
    markChannelRead,
    updateChannelPrivacy,
    mutingChannel,
    unmutingChannel,
    pinningChannel,
    unpinningChannel,
    updatingNotifications,
    markingRead,
    updatingPrivacy,

    // Bulk
    addMultipleMembers,
    removeMultipleMembers,
    addingMultiple,
    removingMultiple,
  }
}
