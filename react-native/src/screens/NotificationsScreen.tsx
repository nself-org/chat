/**
 * NotificationsScreen - Activity and notifications feed
 */

import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { UserAvatar } from '@components/UserAvatar'
import { useNotifications } from '@hooks/useNotifications'
import { formatRelativeTime, truncate } from '@shared/utils'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Notification } from '@shared/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const {
    notifications,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const handleNotificationPress = useCallback((notification: Notification) => {
    markAsRead(notification.id)

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
      case 'mention':
      case 'thread_reply':
        const channelId = notification.data?.channelId as string
        const channelName = notification.data?.channelName as string
        if (channelId) {
          navigation.navigate('Channel', {
            channelId,
            title: channelName || 'Channel',
          })
        }
        break
      case 'direct_message':
        const userId = notification.data?.userId as string
        const userName = notification.data?.userName as string
        if (userId) {
          navigation.navigate('Chat', {
            channelId: userId,
            title: userName || 'Chat',
          })
        }
        break
      case 'channel_invite':
        const inviteChannelId = notification.data?.channelId as string
        if (inviteChannelId) {
          navigation.navigate('Channel', {
            channelId: inviteChannelId,
            title: notification.data?.channelName as string || 'Channel',
          })
        }
        break
      case 'reaction':
        // Navigate to the reacted message
        break
    }
  }, [navigation, markAsRead])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'message'
      case 'mention':
        return '@'
      case 'reaction':
        return 'heart'
      case 'thread_reply':
        return 'reply'
      case 'channel_invite':
        return '#'
      case 'direct_message':
        return 'dm'
      case 'system':
        return 'info'
      default:
        return 'bell'
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const isUnread = !item.isRead

    return (
      <Pressable
        style={[
          styles.notificationItem,
          {
            backgroundColor: isUnread
              ? theme.colors.primary + '10'
              : 'transparent',
            borderBottomColor: theme.colors.border,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Left: Avatar or Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={{ color: theme.colors.primary }}>
            {getNotificationIcon(item.type)}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: theme.colors.text,
                fontWeight: isUnread ? '600' : '400',
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.notificationBody, { color: theme.colors.muted }]}
            numberOfLines={2}
          >
            {truncate(item.body, 100)}
          </Text>
          <Text style={[styles.notificationTime, { color: theme.colors.muted }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {/* Unread indicator */}
        {isUnread && (
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        )}
      </Pressable>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: theme.colors.muted }]}>bell</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
        When you receive notifications, they will appear here
      </Text>
    </View>
  )

  const renderHeader = () => {
    if (unreadCount === 0) return null

    return (
      <View style={[styles.listHeader, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.unreadCount, { color: theme.colors.text }]}>
          {unreadCount} unread
        </Text>
        <Pressable onPress={markAllAsRead}>
          <Text style={[styles.markAllRead, { color: theme.colors.primary }]}>
            Mark all as read
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Notifications"
        rightIcon="settings"
        onRightPress={() => {
          // Open notification settings
        }}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  unreadCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
  },
  notificationBody: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
})

export default NotificationsScreen
