/**
 * CallsScreen - Call history tab (like WhatsApp)
 */

import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { UserAvatar } from '@components/UserAvatar'
import { useCalls } from '@hooks/useCalls'
import { formatRelativeTime } from '@shared/utils'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Call } from '@shared/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type CallFilter = 'all' | 'missed'

export function CallsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const { calls, isLoading, refresh, initiateCall } = useCalls()
  const [filter, setFilter] = useState<CallFilter>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const handleCallPress = useCallback((call: Call) => {
    // Show call options
    Alert.alert(
      'Call',
      `Start a call with this contact?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Audio Call',
          onPress: () => initiateCall(call.participants[0]?.userId, 'audio'),
        },
        {
          text: 'Video Call',
          onPress: () => initiateCall(call.participants[0]?.userId, 'video'),
        },
      ]
    )
  }, [initiateCall])

  const handleNewCall = useCallback(() => {
    // Navigate to contacts to start a new call
    navigation.navigate('Search')
  }, [navigation])

  const filteredCalls = filter === 'missed'
    ? calls.filter((c) => c.status === 'missed')
    : calls

  const getCallIcon = (call: Call) => {
    if (call.status === 'missed') {
      return { icon: 'phone-missed', color: theme.colors.error }
    }
    if (call.type === 'video') {
      return { icon: 'video', color: theme.colors.success }
    }
    return { icon: 'phone', color: theme.colors.success }
  }

  const getCallStatusText = (call: Call) => {
    if (call.status === 'missed') return 'Missed'
    if (call.status === 'declined') return 'Declined'
    if (call.duration) {
      const minutes = Math.floor(call.duration / 60)
      const seconds = call.duration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return call.type === 'video' ? 'Video' : 'Audio'
  }

  const renderCall = ({ item }: { item: Call }) => {
    const { icon, color } = getCallIcon(item)
    const participant = item.participants[0]
    const isOutgoing = item.initiatorId === 'current-user-id' // Replace with actual user ID

    return (
      <Pressable
        style={[styles.callItem, { borderBottomColor: theme.colors.border }]}
        onPress={() => handleCallPress(item)}
      >
        <UserAvatar size={48} />
        <View style={styles.callContent}>
          <Text
            style={[
              styles.callName,
              {
                color: item.status === 'missed' ? theme.colors.error : theme.colors.text,
              },
            ]}
          >
            {participant?.userId || 'Unknown'}
          </Text>
          <View style={styles.callDetails}>
            <Text style={{ color }}>
              {isOutgoing ? 'arrow-up-right' : 'arrow-down-left'} {icon}
            </Text>
            <Text style={[styles.callStatus, { color: theme.colors.muted }]}>
              {getCallStatusText(item)}
            </Text>
          </View>
        </View>
        <View style={styles.callMeta}>
          <Text style={[styles.callTime, { color: theme.colors.muted }]}>
            {formatRelativeTime(item.startedAt || item.endedAt || new Date())}
          </Text>
          <Pressable
            style={[styles.callButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => initiateCall(participant?.userId, item.type)}
          >
            <Text style={{ color: theme.colors.primary }}>
              {item.type === 'video' ? 'video' : 'phone'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: theme.colors.muted }]}>phone</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {filter === 'missed' ? 'No missed calls' : 'No calls yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
        {filter === 'missed'
          ? "You haven't missed any calls"
          : 'Start a call by tapping the button above'}
      </Text>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Calls"
        rightIcon="phone-plus"
        onRightPress={handleNewCall}
      />

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          style={[
            styles.filterTab,
            filter === 'all' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'all' ? theme.colors.primary : theme.colors.muted },
            ]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterTab,
            filter === 'missed' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setFilter('missed')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'missed' ? theme.colors.primary : theme.colors.muted },
            ]}
          >
            Missed
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredCalls}
        renderItem={renderCall}
        keyExtractor={(item) => item.id}
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
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  callContent: {
    flex: 1,
    marginLeft: 12,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  callStatus: {
    fontSize: 14,
  },
  callMeta: {
    alignItems: 'flex-end',
  },
  callTime: {
    fontSize: 13,
    marginBottom: 8,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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

export default CallsScreen
