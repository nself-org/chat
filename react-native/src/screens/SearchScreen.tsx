/**
 * SearchScreen - Search for messages, channels, and users
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { SearchBar } from '@components/SearchBar'
import { UserAvatar } from '@components/UserAvatar'
import { useSearch } from '@hooks/useSearch'
import { formatRelativeTime, truncate } from '@shared/utils'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'
import type { SearchResult } from '@shared/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type SearchFilter = 'all' | 'messages' | 'channels' | 'users' | 'files'

const filterOptions: { key: SearchFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'messages', label: 'Messages' },
  { key: 'channels', label: 'Channels' },
  { key: 'users', label: 'People' },
  { key: 'files', label: 'Files' },
]

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchFilter>('all')
  const inputRef = useRef<TextInput>(null)

  const { results, isSearching, recentSearches, clearRecentSearches } = useSearch(
    query,
    filter
  )

  const handleResultPress = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'message':
        // Navigate to message in channel
        navigation.navigate('Channel', {
          channelId: result.id,
          title: result.title,
        })
        break
      case 'channel':
        navigation.navigate('Channel', {
          channelId: result.id,
          title: result.title,
        })
        break
      case 'user':
        navigation.navigate('Profile', { userId: result.id })
        break
      case 'file':
        // Open file viewer
        break
    }
  }, [navigation])

  const handleRecentSearchPress = useCallback((searchTerm: string) => {
    setQuery(searchTerm)
  }, [])

  const renderFilterButton = (option: { key: SearchFilter; label: string }) => {
    const isActive = filter === option.key
    return (
      <Pressable
        key={option.key}
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
          },
        ]}
        onPress={() => setFilter(option.key)}
      >
        <Text
          style={[
            styles.filterText,
            { color: isActive ? theme.colors.buttonPrimaryText : theme.colors.text },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    )
  }

  const renderResult = ({ item }: { item: SearchResult }) => {
    return (
      <Pressable
        style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
        onPress={() => handleResultPress(item)}
      >
        {item.type === 'user' ? (
          <UserAvatar size={40} />
        ) : (
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={{ color: theme.colors.primary }}>
              {item.type === 'channel' ? '#' : item.type === 'message' ? 'M' : 'F'}
            </Text>
          </View>
        )}
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.resultSubtitle, { color: theme.colors.muted }]}>
              {truncate(item.subtitle, 60)}
            </Text>
          )}
          {item.highlight && (
            <Text style={[styles.resultHighlight, { color: theme.colors.textSecondary }]}>
              {truncate(item.highlight, 80)}
            </Text>
          )}
        </View>
        {item.timestamp && (
          <Text style={[styles.resultTime, { color: theme.colors.muted }]}>
            {formatRelativeTime(item.timestamp)}
          </Text>
        )}
      </Pressable>
    )
  }

  const renderRecentSearch = ({ item }: { item: string }) => (
    <Pressable
      style={styles.recentItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Text style={[styles.recentIcon, { color: theme.colors.muted }]}>clock</Text>
      <Text style={[styles.recentText, { color: theme.colors.text }]}>{item}</Text>
    </Pressable>
  )

  const renderEmptyState = () => {
    if (query.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: theme.colors.text }]}>
                  Recent Searches
                </Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={[styles.clearButton, { color: theme.colors.primary }]}>
                    Clear
                  </Text>
                </Pressable>
              </View>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item) => item}
                scrollEnabled={false}
              />
            </>
          ) : (
            <View style={styles.emptyMessage}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Search nChat
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
                Find messages, channels, people, and files
              </Text>
            </View>
          )}
        </View>
      )
    }

    if (!isSearching && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyMessage}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
              Try different keywords or filters
            </Text>
          </View>
        </View>
      )
    }

    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Search"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages, channels, people..."
          autoFocus
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filterOptions.map(renderFilterButton)}
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={[
            styles.resultsList,
            { paddingBottom: insets.bottom },
          ]}
          ListEmptyComponent={renderEmptyState}
          keyboardShouldPersistTaps="handled"
        />
      )}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  resultHighlight: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingTop: 24,
  },
  emptyMessage: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 15,
  },
})

export default SearchScreen
