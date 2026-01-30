'use client'

/**
 * SavedSearches Component
 *
 * Displays and manages saved searches
 */

import React, { useEffect, useState } from 'react'
import { Star, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: Record<string, unknown>
  createdAt: string
  lastUsedAt?: string
  useCount: number
}

export interface SavedSearchesProps {
  onLoadSearch: (query: string, filters: Record<string, unknown>) => void
}

export function SavedSearches({ onLoadSearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSavedSearches()
  }, [])

  const loadSavedSearches = () => {
    // In production, fetch from API
    // For now, use localStorage
    try {
      const saved = localStorage.getItem('saved_searches')
      if (saved) {
        setSavedSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('saved_searches', JSON.stringify(updated))
  }

  const handleLoadSearch = (search: SavedSearch) => {
    // Update last used
    const updated = savedSearches.map(s =>
      s.id === search.id
        ? { ...s, lastUsedAt: new Date().toISOString(), useCount: s.useCount + 1 }
        : s
    )
    setSavedSearches(updated)
    localStorage.setItem('saved_searches', JSON.stringify(updated))

    onLoadSearch(search.query, search.filters)
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading saved searches...</div>
  }

  if (savedSearches.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No saved searches yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Press <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Cmd+S</kbd> to save a search
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Saved Searches</h3>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />

            <button
              onClick={() => handleLoadSearch(search)}
              className="flex-1 text-left min-w-0"
            >
              <div className="font-medium text-sm truncate">{search.name}</div>
              <div className="text-xs text-muted-foreground truncate">{search.query}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {search.lastUsedAt ? (
                  <span>Used {formatDistanceToNow(new Date(search.lastUsedAt), { addSuffix: true })}</span>
                ) : (
                  <span>Created {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true })}</span>
                )}
                <span>•</span>
                <span>{search.useCount} uses</span>
              </div>
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSearch(search.id)
              }}
              className="h-auto p-2"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SavedSearches
