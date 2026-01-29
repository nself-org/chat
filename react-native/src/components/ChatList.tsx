/**
 * ChatList - List of chat conversations
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControlProps,
} from 'react-native'

import { useTheme } from '@theme'
import { UserAvatar } from './UserAvatar'
import { formatRelativeTime, truncate } from '@shared/utils'

import type { Channel } from '@shared/types'

interface ChatListProps {
  channels: Channel[]
  onChatPress: (channel: Channel) => void
  isLoading?: boolean
  refreshControl?: React.ReactElement<RefreshControlProps>
  ListEmptyComponent?: React.ReactElement
}

export function ChatList({
  channels,
  onChatPress,
  isLoading,
  refreshControl,
  ListEmptyComponent,
}: ChatListProps) {
  const { theme } = useTheme()

  const renderItem = useCallback(({ item }: { item: Channel }) => {
    const hasUnread = (item.unreadCount || 0) > 0

    return (
      <Pressable
        style={[styles.chatItem, { borderBottomColor: theme.colors.border }]}
        onPress={() => onChatPress(item)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <UserAvatar size={52} />
          {/* Online indicator for DMs */}
          {item.type === 'direct' && (
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: theme.colors.success, borderColor: theme.colors.background },
              ]}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.name,
                {
                  color: theme.colors.text,
                  fontWeight: hasUnread ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {item.type === 'public' || item.type === 'private' ? `#${item.name}` : item.name}
            </Text>
            {item.lastMessageAt && (
              <Text
                style={[
                  styles.time,
                  { color: hasUnread ? theme.colors.primary : theme.colors.muted },
                ]}
              >
                {formatRelativeTime(item.lastMessageAt)}
              </Text>
            )}
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.preview,
                {
                  color: hasUnread ? theme.colors.text : theme.colors.muted,
                  fontWeight: hasUnread ? '500' : '400',
                },
              ]}
              numberOfLines={2}
            >
              {item.description || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View
                style={[styles.badge, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.badgeText, { color: theme.colors.buttonPrimaryText }]}>
                  {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    )
  }, [theme, onChatPress])

  const keyExtractor = useCallback((item: Channel) => item.id, [])

  return (
    <FlatList
      data={channels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      ListEmptyComponent={ListEmptyComponent}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
})

export default ChatList
