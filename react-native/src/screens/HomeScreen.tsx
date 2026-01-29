/**
 * HomeScreen - Main chat list screen
 * Displays all conversations (channels and DMs)
 */

import React, { useCallback, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { SearchBar } from '@components/SearchBar'
import { ChatList } from '@components/ChatList'
import { useChannels } from '@hooks/useChannels'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { Channel } from '@shared/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { channels, isLoading, refresh } = useChannels()

  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const handleChatPress = useCallback((channel: Channel) => {
    if (channel.type === 'direct') {
      navigation.navigate('Chat', { channelId: channel.id, title: channel.name })
    } else {
      navigation.navigate('Channel', { channelId: channel.id, title: channel.name })
    }
  }, [navigation])

  const handleNewChat = useCallback(() => {
    // Navigate to new chat/channel creation
    navigation.navigate('Search')
  }, [navigation])

  const filteredChannels = searchQuery
    ? channels.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channels

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Chats"
        rightIcon="plus"
        onRightPress={handleNewChat}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
        />
      </View>

      <ChatList
        channels={filteredChannels}
        onChatPress={handleChatPress}
        isLoading={isLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Empty state component would go here */}
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
})

export default HomeScreen
