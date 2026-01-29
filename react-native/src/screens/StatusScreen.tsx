/**
 * StatusScreen - Status/Stories feature (like WhatsApp Status)
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
import { useStatus } from '@hooks/useStatus'
import { useAuth } from '@stores/auth-store'
import { formatRelativeTime } from '@shared/utils'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Status } from '@shared/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface StatusGroup {
  userId: string
  userName: string
  avatarUrl?: string
  statuses: Status[]
  lastUpdated: Date
  hasViewed: boolean
}

export function StatusScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const {
    myStatuses,
    recentStatuses,
    viewedStatuses,
    isLoading,
    refresh,
    createStatus,
    viewStatus,
  } = useStatus()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const handleCreateStatus = useCallback(() => {
    // Open status creation modal/screen
    // Options: Text, Photo, Video
  }, [])

  const handleMyStatusPress = useCallback(() => {
    if (myStatuses.length > 0) {
      // View my statuses
    } else {
      handleCreateStatus()
    }
  }, [myStatuses, handleCreateStatus])

  const handleStatusPress = useCallback((group: StatusGroup) => {
    // View status in full screen viewer
    viewStatus(group.statuses[0].id)
  }, [viewStatus])

  const renderMyStatus = () => (
    <Pressable
      style={[styles.statusItem, { borderBottomColor: theme.colors.border }]}
      onPress={handleMyStatusPress}
    >
      <View style={styles.avatarContainer}>
        <UserAvatar user={user} size={56} />
        {myStatuses.length === 0 && (
          <View
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>+</Text>
          </View>
        )}
        {myStatuses.length > 0 && (
          <View
            style={[styles.statusRing, { borderColor: theme.colors.primary }]}
          />
        )}
      </View>
      <View style={styles.statusContent}>
        <Text style={[styles.statusName, { color: theme.colors.text }]}>
          My Status
        </Text>
        <Text style={[styles.statusTime, { color: theme.colors.muted }]}>
          {myStatuses.length > 0
            ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}`
            : 'Tap to add status update'}
        </Text>
      </View>
    </Pressable>
  )

  const renderStatusGroup = ({ item }: { item: StatusGroup }) => {
    const ringColor = item.hasViewed ? theme.colors.muted : theme.colors.primary

    return (
      <Pressable
        style={[styles.statusItem, { borderBottomColor: theme.colors.border }]}
        onPress={() => handleStatusPress(item)}
      >
        <View style={styles.avatarContainer}>
          <UserAvatar size={56} />
          <View style={[styles.statusRing, { borderColor: ringColor }]} />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusName, { color: theme.colors.text }]}>
            {item.userName}
          </Text>
          <Text style={[styles.statusTime, { color: theme.colors.muted }]}>
            {formatRelativeTime(item.lastUpdated)}
          </Text>
        </View>
      </Pressable>
    )
  }

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
        {title}
      </Text>
    </View>
  )

  const renderContent = () => {
    const sections: React.ReactNode[] = []

    // My Status
    sections.push(
      <View key="my-status">
        {renderMyStatus()}
      </View>
    )

    // Recent (unviewed) statuses
    if (recentStatuses.length > 0) {
      sections.push(
        <View key="recent">
          {renderSectionHeader('Recent updates')}
          {recentStatuses.map((group) => (
            <View key={group.userId}>
              {renderStatusGroup({ item: group })}
            </View>
          ))}
        </View>
      )
    }

    // Viewed statuses
    if (viewedStatuses.length > 0) {
      sections.push(
        <View key="viewed">
          {renderSectionHeader('Viewed updates')}
          {viewedStatuses.map((group) => (
            <View key={group.userId}>
              {renderStatusGroup({ item: group })}
            </View>
          ))}
        </View>
      )
    }

    // Empty state
    if (recentStatuses.length === 0 && viewedStatuses.length === 0) {
      sections.push(
        <View key="empty" style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: theme.colors.muted }]}>
            circle-dashed
          </Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No status updates
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
            Status updates from your contacts will appear here
          </Text>
        </View>
      )
    }

    return sections
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Status"
        rightIcon="camera"
        onRightPress={handleCreateStatus}
      />

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => <>{renderContent()}</>}
        keyExtractor={(item) => item.key}
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
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 32,
    borderWidth: 2,
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusTime: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
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

export default StatusScreen
