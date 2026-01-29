/**
 * useSearch - Hook for searching messages, channels, and users
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { MMKV } from 'react-native-mmkv'

import { SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from '@shared/constants'
import type { SearchResult } from '@shared/types'

const storage = new MMKV()
const RECENT_SEARCHES_KEY = '@nchat/recent_searches'
const MAX_RECENT_SEARCHES = 10

type SearchFilter = 'all' | 'messages' | 'channels' | 'users' | 'files'

interface UseSearchReturn {
  results: SearchResult[]
  isSearching: boolean
  error: Error | null
  recentSearches: string[]
  addRecentSearch: (term: string) => void
  clearRecentSearches: () => void
}

export function useSearch(query: string, filter: SearchFilter = 'all'): UseSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches on mount
  useEffect(() => {
    const stored = storage.getString(RECENT_SEARCHES_KEY)
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch {
        // Invalid stored data
      }
    }
  }, [])

  // Perform search with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // API call would go here
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Mock search results
        const mockResults: SearchResult[] = []

        if (filter === 'all' || filter === 'messages') {
          mockResults.push({
            type: 'message',
            id: 'msg-1',
            title: 'Message in #general',
            subtitle: 'from Alice',
            highlight: `...${query}... in context`,
            timestamp: new Date(),
          })
        }

        if (filter === 'all' || filter === 'channels') {
          mockResults.push({
            type: 'channel',
            id: 'ch-1',
            title: `#${query}-channel`,
            subtitle: '42 members',
          })
        }

        if (filter === 'all' || filter === 'users') {
          mockResults.push({
            type: 'user',
            id: 'user-1',
            title: `${query}@example.com`,
            subtitle: 'Online',
          })
        }

        if (filter === 'all' || filter === 'files') {
          mockResults.push({
            type: 'file',
            id: 'file-1',
            title: `${query}.pdf`,
            subtitle: '2.5 MB',
            timestamp: new Date(),
          })
        }

        setResults(mockResults)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'))
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, filter])

  const addRecentSearch = useCallback((term: string) => {
    if (term.length < MIN_SEARCH_LENGTH) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== term)
      const updated = [term, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      storage.set(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    storage.delete(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }, [])

  return {
    results,
    isSearching,
    error,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  }
}

export default useSearch
