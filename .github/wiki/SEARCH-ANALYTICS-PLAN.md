# Search and Analytics Implementation Plan

**Version**: 0.9.1
**Date**: 2026-02-03
**Status**: Planning
**Tasks**: TODO.md Tasks 106-108 (Phase 14 - Search & Analytics)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [MeiliSearch Integration (Task 106)](#meilisearch-integration-task-106)
4. [Search UI Components](#search-ui-components)
5. [Analytics Dashboards (Task 107)](#analytics-dashboards-task-107)
6. [Usage Tracking (Task 108)](#usage-tracking-task-108)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Real-time Analytics](#real-time-analytics)
10. [Implementation Phases](#implementation-phases)
11. [Testing Strategy](#testing-strategy)
12. [Security Considerations](#security-considerations)

---

## Executive Summary

This document outlines the comprehensive implementation plan for Search and Analytics features in nChat, covering Tasks 106-108 from the TODO.md. The implementation leverages the existing nself CLI stack with MeiliSearch for full-text search and TimescaleDB for time-series analytics data.

### Key Objectives

- **Task 106**: Replace mock Search API with real MeiliSearch integration
- **Task 107**: Implement production-ready analytics dashboards with export capabilities
- **Task 108**: Implement usage tracking for billing enforcement

### Technology Stack

| Component     | Technology                        | Status                          |
| ------------- | --------------------------------- | ------------------------------- |
| Search Engine | MeiliSearch 1.x                   | Configured, needs real indexing |
| Analytics DB  | PostgreSQL + TimescaleDB          | Schema exists                   |
| API Framework | Next.js API Routes                | Partially implemented           |
| Real-time     | GraphQL Subscriptions + WebSocket | Available                       |
| Export        | CSV/JSON/PDF                      | Partially implemented           |

---

## Current State Analysis

### Existing Infrastructure

The codebase has substantial existing infrastructure that needs completion:

#### Search Components (Partially Implemented)

| File                                    | Status   | Notes                                       |
| --------------------------------------- | -------- | ------------------------------------------- |
| `/src/lib/search/meilisearch-client.ts` | Complete | MeiliSearch client with index configuration |
| `/src/lib/search/indexer.ts`            | Complete | Document types and indexing utilities       |
| `/src/lib/search/query-parser.ts`       | Complete | Query parsing with operators                |
| `/src/app/api/search/route.ts`          | Partial  | Uses mock data fallback                     |
| `/src/components/search/*.tsx`          | Exists   | 20+ search UI components                    |

#### Analytics Components (Partially Implemented)

| File                                             | Status   | Notes                           |
| ------------------------------------------------ | -------- | ------------------------------- |
| `/src/lib/analytics/analytics-types.ts`          | Complete | Comprehensive type definitions  |
| `/src/lib/analytics/analytics-collector.ts`      | Partial  | Has mock data generators        |
| `/src/lib/analytics/analytics-aggregator.ts`     | Complete | Aggregation logic implemented   |
| `/src/lib/analytics/analytics-export.ts`         | Partial  | CSV/JSON done, PDF/XLSX pending |
| `/.backend/migrations/0005_analytics_system.sql` | Complete | TimescaleDB schema              |
| `/src/app/api/analytics/*.ts`                    | Partial  | Routes exist, need real data    |

---

## MeiliSearch Integration (Task 106)

### 1. Index Configuration

#### Messages Index

```typescript
// Current configuration in meilisearch-client.ts
const messagesIndexConfig = {
  primaryKey: 'id',
  searchableAttributes: ['content', 'author_name', 'channel_name'],
  filterableAttributes: [
    'channel_id',
    'author_id',
    'created_at',
    'has_link',
    'has_file',
    'has_image',
    'is_pinned',
    'is_starred',
    'thread_id',
  ],
  sortableAttributes: ['created_at'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'created_at:desc'],
}
```

**Required Enhancements:**

```typescript
// Additional attributes for full parity
const enhancedMessagesConfig = {
  filterableAttributes: [
    ...existingAttributes,
    'workspace_id', // Multi-tenant support
    'is_deleted', // Soft delete support
    'mentions', // Array of mentioned user IDs
    'reaction_count', // For popularity sorting
    'reply_count', // Thread engagement
  ],
  distinctAttribute: 'id',
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    disableOnWords: ['@', '#'],
    disableOnAttributes: ['channel_id', 'author_id'],
  },
  pagination: {
    maxTotalHits: 10000,
  },
}
```

#### Files Index

```typescript
const filesIndexConfig = {
  primaryKey: 'id',
  searchableAttributes: [
    'name',
    'original_name',
    'description',
    'uploader_name',
    'extracted_text', // NEW: OCR/text extraction from documents
  ],
  filterableAttributes: [
    'uploader_id',
    'channel_id',
    'mime_type',
    'file_type', // image, video, audio, document, other
    'created_at',
    'size',
    'workspace_id',
  ],
  sortableAttributes: ['created_at', 'size', 'name'],
}
```

#### Users Index

```typescript
const usersIndexConfig = {
  primaryKey: 'id',
  searchableAttributes: [
    'display_name',
    'username',
    'email',
    'bio',
    'title', // NEW: Job title
    'department', // NEW: Organization unit
  ],
  filterableAttributes: [
    'role',
    'is_active',
    'is_verified', // NEW: ID.me verification
    'workspace_id',
    'created_at',
    'last_active_at',
  ],
  sortableAttributes: ['display_name', 'created_at', 'last_active_at'],
}
```

#### Channels Index

```typescript
const channelsIndexConfig = {
  primaryKey: 'id',
  searchableAttributes: [
    'name',
    'description',
    'topic',
    'tags', // NEW: Channel tags
  ],
  filterableAttributes: [
    'is_private',
    'is_archived',
    'is_announcement', // NEW: Announcement channel
    'created_by',
    'workspace_id',
    'created_at',
    'member_count', // NEW: For filtering by size
  ],
  sortableAttributes: ['name', 'created_at', 'member_count'],
}
```

### 2. Real-time Indexing Strategy

#### Option A: Database Triggers (Recommended for nself stack)

```sql
-- Create indexing job queue table
CREATE TABLE nchat_search_index_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT
);

-- Message trigger function
CREATE OR REPLACE FUNCTION nchat_index_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO nchat_search_index_queue (operation, entity_type, entity_id, payload)
    VALUES ('INSERT', 'messages', NEW.id, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO nchat_search_index_queue (operation, entity_type, entity_id, payload)
    VALUES ('UPDATE', 'messages', NEW.id, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO nchat_search_index_queue (operation, entity_type, entity_id)
    VALUES ('DELETE', 'messages', OLD.id, NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER trigger_nchat_index_message
AFTER INSERT OR UPDATE OR DELETE ON nchat_messages
FOR EACH ROW EXECUTE FUNCTION nchat_index_message();
```

#### Option B: Hasura Event Triggers

```yaml
# hasura/metadata/tables/nchat_messages.yaml
event_triggers:
  - name: index_message
    table:
      schema: public
      name: nchat_messages
    definition:
      enable_manual: false
      insert:
        columns: '*'
      update:
        columns: '*'
      delete:
        columns: '*'
    retry_conf:
      num_retries: 3
      interval_sec: 10
      timeout_sec: 60
    webhook: '{{NCHAT_API_URL}}/api/webhooks/search-index'
```

#### Indexing Worker Service

```typescript
// /src/services/search/indexing-worker.ts

import { CronJob } from 'cron'
import { getIndex, INDEX_NAMES } from '@/lib/search/meilisearch-client'
import { graphqlClient } from '@/lib/apollo-client'

interface IndexQueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  entity_type: 'messages' | 'files' | 'users' | 'channels'
  entity_id: string
  payload: Record<string, unknown> | null
}

export class SearchIndexingWorker {
  private batchSize: number = 100
  private isProcessing: boolean = false

  async processQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // Fetch pending items
      const { data } = await graphqlClient.query({
        query: GET_PENDING_INDEX_QUEUE,
        variables: { limit: this.batchSize },
      })

      const items: IndexQueueItem[] = data.nchat_search_index_queue

      if (items.length === 0) {
        this.isProcessing = false
        return
      }

      // Group by entity type and operation
      const grouped = this.groupItems(items)

      // Process each group
      for (const [entityType, operations] of Object.entries(grouped)) {
        const index = getIndex(entityType as keyof typeof INDEX_NAMES)

        // Handle inserts/updates
        const upserts = [...(operations.INSERT || []), ...(operations.UPDATE || [])]
        if (upserts.length > 0) {
          const documents = upserts
            .filter((item) => item.payload)
            .map((item) => this.transformForIndex(entityType, item.payload!))
          await index.addDocuments(documents)
        }

        // Handle deletes
        const deletes = operations.DELETE || []
        if (deletes.length > 0) {
          const ids = deletes.map((item) => item.entity_id)
          await index.deleteDocuments(ids)
        }
      }

      // Mark items as processed
      await this.markProcessed(items.map((i) => i.id))
    } catch (error) {
      console.error('Search indexing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private transformForIndex(
    entityType: string,
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    // Transform database record to search document
    switch (entityType) {
      case 'messages':
        return {
          id: payload.id,
          content: payload.content,
          author_id: payload.user_id,
          author_name: payload.author?.display_name || payload.author?.username,
          channel_id: payload.channel_id,
          channel_name: payload.channel?.name,
          thread_id: payload.thread_id,
          created_at: new Date(payload.created_at as string).getTime() / 1000,
          has_link: this.hasLinks(payload.content as string),
          has_file: (payload.attachments as unknown[])?.length > 0,
          has_image: this.hasImages(payload.attachments as unknown[]),
          is_pinned: payload.is_pinned || false,
          is_starred: false, // User-specific, handled separately
          mentions: this.extractMentions(payload.content as string),
        }
      // ... other entity types
      default:
        return payload
    }
  }

  // Helper methods...
}

// Start worker with cron (every 5 seconds)
export function startIndexingWorker(): void {
  const worker = new SearchIndexingWorker()
  new CronJob('*/5 * * * * *', () => worker.processQueue(), null, true)
}
```

### 3. Search API Endpoints

#### Enhanced Search Route

```typescript
// /src/app/api/search/route.ts - Enhanced implementation

import { NextRequest, NextResponse } from 'next/server'
import { searchAll, searchIndex, INDEX_NAMES } from '@/lib/search/meilisearch-client'
import { parseQuery, buildMeiliSearchFilter } from '@/lib/search/query-parser'
import { logSearch } from '@/lib/analytics/search-logger'
import { withAuth, withRateLimit } from '@/lib/api/middleware'

// Remove mock data fallback - require real MeiliSearch connection
async function handleSearch(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { query, types, filters, limit = 20, offset = 0 } = body

    // Parse query for operators
    const parsed = parseQuery(query)

    // Build permission-aware filters
    const permissionFilter = await buildPermissionFilter(user)
    const combinedFilter = buildMeiliSearchFilter(parsed, {
      ...filters,
      ...permissionFilter,
    })

    // Execute search
    const results = await searchAll(parsed.text, {
      filters: combinedFilter,
      limit,
      offset,
      attributesToHighlight: ['content', 'name', 'display_name'],
      attributesToCrop: ['content'],
      cropLength: 200,
    })

    // Log search for analytics
    await logSearch({
      userId: user?.id,
      query: parsed.text,
      queryNormalized: parsed.text.toLowerCase().trim(),
      resultCount: results.totalHits,
      searchDurationMs: Date.now() - startTime,
    })

    return NextResponse.json({
      success: true,
      results: transformResults(results),
      meta: {
        query: parsed.text,
        operators: parsed.operators,
        totalHits: results.totalHits,
        processingTimeMs: results.processingTimeMs,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search service unavailable' }, { status: 503 })
  }
}

// Build filters based on user permissions
async function buildPermissionFilter(user: AuthUser | null): Promise<Record<string, unknown>> {
  if (!user) {
    // Anonymous users can only search public content
    return {
      is_private: false,
      is_deleted: false,
    }
  }

  // Get user's accessible channels
  const accessibleChannels = await getUserAccessibleChannels(user.id)

  return {
    channel_id: accessibleChannels,
    is_deleted: false,
    workspace_id: user.workspaceId,
  }
}
```

#### Faceted Search Route

```typescript
// /src/app/api/search/facets/route.ts

export async function POST(request: NextRequest) {
  const { query, facets = ['channel_name', 'file_type', 'author_name'] } = await request.json()

  const results = await searchIndex(INDEX_NAMES.MESSAGES, query, {
    facets,
    limit: 0, // We only want facet counts
  })

  return NextResponse.json({
    facets: results.facetDistribution,
    processingTimeMs: results.processingTimeMs,
  })
}
```

#### Search Suggestions Route

```typescript
// /src/app/api/search/suggestions/route.ts - Enhanced

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('q') || ''
  const user = await getAuthenticatedUser(request)

  const suggestions: SearchSuggestion[] = []

  // 1. Operator suggestions
  if (prefix.includes(':') || prefix.match(/^(from|in|has|is|before|after)$/i)) {
    suggestions.push(...getOperatorSuggestions(prefix))
  }

  // 2. Recent searches for this user
  if (user) {
    const recentSearches = await getRecentSearches(user.id, 5)
    suggestions.push(
      ...recentSearches.map((s) => ({
        type: 'recent',
        text: s.query,
        timestamp: s.created_at,
      }))
    )
  }

  // 3. Popular searches (anonymized)
  const popularSearches = await getPopularSearches(5)
  suggestions.push(
    ...popularSearches.map((s) => ({
      type: 'popular',
      text: s.query,
      count: s.count,
    }))
  )

  // 4. Quick results preview
  if (prefix.length >= 2) {
    const preview = await searchAll(prefix, { limit: 3 })
    suggestions.push(
      ...preview.messages.slice(0, 2).map((m) => ({
        type: 'message',
        text: m.content.slice(0, 100),
        id: m.id,
        channelName: m.channel_name,
      }))
    )
  }

  return NextResponse.json({ suggestions })
}
```

---

## Search UI Components

### 1. Global Search Bar

```typescript
// /src/components/search/GlobalSearchBar.tsx

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useSearch } from '@/hooks/use-search'
import { SearchInput } from './search-input'
import { SearchSuggestions } from './search-suggestions'
import { SearchResults } from './search-results'
import { cn } from '@/lib/utils'

interface GlobalSearchBarProps {
  className?: string
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
}

export function GlobalSearchBar({
  className,
  placeholder = 'Search messages, files, people...',
  onResultSelect,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    results,
    suggestions,
    isLoading,
    error,
    search,
    fetchSuggestions,
  } = useSearch()

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch suggestions as user types
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      fetchSuggestions(debouncedQuery)
    }
  }, [debouncedQuery, fetchSuggestions])

  // Execute search when query is 2+ characters
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [debouncedQuery, search])

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setQuery('')
  }, [onResultSelect])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
        isLoading={isLoading}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-hidden">
          {!showResults && suggestions.length > 0 && (
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={(suggestion) => setQuery(suggestion.text)}
            />
          )}

          {showResults && (
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              error={error}
              onResultClick={handleResultClick}
            />
          )}

          {showResults && !isLoading && results.total === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">
                Try different keywords or use search operators like{' '}
                <code className="bg-muted px-1 rounded">from:username</code>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 2. Advanced Search Builder

```typescript
// /src/components/search/AdvancedSearchBuilder.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { buildQueryFromFilters } from '@/lib/search/query-parser'

interface AdvancedSearchBuilderProps {
  onSearch: (query: string) => void
  channels: Array<{ id: string; name: string }>
  users: Array<{ id: string; name: string }>
}

export function AdvancedSearchBuilder({
  onSearch,
  channels,
  users,
}: AdvancedSearchBuilderProps) {
  const [filters, setFilters] = useState({
    text: '',
    from: '',
    in: '',
    has: [] as string[],
    is: [] as string[],
    before: '',
    after: '',
  })

  const handleSearch = () => {
    const query = buildQueryFromFilters(filters, filters.text)
    onSearch(query)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Advanced Search</h3>

      {/* Text search */}
      <div>
        <label className="text-sm text-muted-foreground">Contains</label>
        <Input
          value={filters.text}
          onChange={(e) => setFilters({ ...filters, text: e.target.value })}
          placeholder="Search text..."
        />
      </div>

      {/* From user */}
      <div>
        <label className="text-sm text-muted-foreground">From</label>
        <Select
          value={filters.from}
          onValueChange={(value) => setFilters({ ...filters, from: value })}
          options={[
            { value: '', label: 'Anyone' },
            ...users.map(u => ({ value: u.name, label: u.name })),
          ]}
        />
      </div>

      {/* In channel */}
      <div>
        <label className="text-sm text-muted-foreground">In Channel</label>
        <Select
          value={filters.in}
          onValueChange={(value) => setFilters({ ...filters, in: value })}
          options={[
            { value: '', label: 'All channels' },
            ...channels.map(c => ({ value: c.name, label: `#${c.name}` })),
          ]}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">After</label>
          <DatePicker
            value={filters.after}
            onChange={(date) => setFilters({ ...filters, after: date })}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Before</label>
          <DatePicker
            value={filters.before}
            onChange={(date) => setFilters({ ...filters, before: date })}
          />
        </div>
      </div>

      {/* Has attachments */}
      <div className="flex flex-wrap gap-2">
        {['link', 'file', 'image'].map((type) => (
          <Button
            key={type}
            variant={filters.has.includes(type) ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const has = filters.has.includes(type)
                ? filters.has.filter(h => h !== type)
                : [...filters.has, type]
              setFilters({ ...filters, has })
            }}
          >
            Has {type}
          </Button>
        ))}
      </div>

      {/* Is pinned/starred */}
      <div className="flex flex-wrap gap-2">
        {['pinned', 'starred'].map((type) => (
          <Button
            key={type}
            variant={filters.is.includes(type) ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const is = filters.is.includes(type)
                ? filters.is.filter(i => i !== type)
                : [...filters.is, type]
              setFilters({ ...filters, is })
            }}
          >
            Is {type}
          </Button>
        ))}
      </div>

      <Button onClick={handleSearch} className="w-full">
        Search
      </Button>
    </div>
  )
}
```

### 3. Search Results Components

The existing search result components in `/src/components/search/` are well-structured:

- `SearchResultCard.tsx` - Generic result card
- `search-result-message.tsx` - Message result with highlighting
- `search-result-file.tsx` - File result with preview
- `search-result-user.tsx` - User result with avatar
- `search-result-channel.tsx` - Channel result with member count

**Enhancement needed**: Add pagination and virtualization for large result sets.

---

## Analytics Dashboards (Task 107)

### 1. Dashboard Architecture

```
/src/app/admin/analytics/
  ├── page.tsx              # Main dashboard
  ├── messages/page.tsx     # Message analytics detail
  ├── users/page.tsx        # User analytics detail
  ├── channels/page.tsx     # Channel analytics detail
  ├── search/page.tsx       # Search analytics detail
  └── export/page.tsx       # Export configuration
```

### 2. Dashboard Data Flow

```typescript
// Data flow architecture
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TimescaleDB   │────>│ AnalyticsCollector│────>│ AnalyticsAggregator│
│ (nchat_analytics_*) │  │ (GraphQL queries)│     │  (Processing)   │
└─────────────────┘     └──────────────────┘     └─────────┬───────┘
                                                           │
                        ┌──────────────────────────────────┘
                        ▼
              ┌─────────────────┐
              │  API Routes     │
              │ /api/analytics/*│
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
     ┌─────────────┐   ┌─────────────────┐
     │ Dashboard UI│   │ GraphQL         │
     │ (React)     │   │ Subscriptions   │
     └─────────────┘   └─────────────────┘
```

### 3. Main Dashboard Component

```typescript
// /src/app/admin/analytics/page.tsx

'use client'

import { useState } from 'react'
import { useAnalyticsDashboard } from '@/hooks/use-analytics-dashboard'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { AnalyticsCards } from '@/components/analytics/overview/AnalyticsCards'
import { AnalyticsSummary } from '@/components/analytics/overview/AnalyticsSummary'
import { MessageVolumeChart } from '@/components/analytics/charts/MessageVolumeChart'
import { UserActivityChart } from '@/components/analytics/charts/UserActivityChart'
import { ChannelActivityTable } from '@/components/analytics/tables/ChannelActivityTable'
import { PeakHoursHeatmap } from '@/components/analytics/charts/PeakHoursHeatmap'
import { TopUsersTable } from '@/components/analytics/tables/TopUsersTable'
import { ReactionDistributionChart } from '@/components/analytics/charts/ReactionDistributionChart'
import { ExportButton } from '@/components/analytics/ExportButton'
import { RefreshButton } from '@/components/analytics/RefreshButton'

export default function AnalyticsDashboardPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last30days' as const,
  })

  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day')

  const { data, isLoading, error, refetch } = useAnalyticsDashboard({
    dateRange,
    granularity,
    includeBots: false,
  })

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor team activity and engagement
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            presets={['today', 'last7days', 'last30days', 'thisMonth']}
          />
          <RefreshButton onClick={refetch} isLoading={isLoading} />
          <ExportButton
            dateRange={dateRange}
            sections={['summary', 'messages', 'users', 'channels']}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <AnalyticsCards summary={data?.summary} isLoading={isLoading} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <MessageVolumeChart
          data={data?.messageVolume}
          granularity={granularity}
          isLoading={isLoading}
        />
        <UserActivityChart
          data={data?.activeUsers}
          growth={data?.userGrowth}
          isLoading={isLoading}
        />
      </div>

      {/* Detailed Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChannelActivityTable
          data={data?.channelActivity}
          isLoading={isLoading}
        />
        <TopUsersTable
          data={data?.topUsers}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <PeakHoursHeatmap
          data={data?.peakHours}
          isLoading={isLoading}
        />
        <ReactionDistributionChart
          data={data?.reactions}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
```

### 4. Analytics Summary Cards

```typescript
// /src/components/analytics/overview/AnalyticsCards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendIndicator } from '@/components/ui/trend-indicator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageSquare,
  Users,
  Hash,
  Smile,
  FileUp,
  Search,
} from 'lucide-react'
import type { AnalyticsSummary } from '@/lib/analytics/analytics-types'

interface AnalyticsCardsProps {
  summary?: AnalyticsSummary
  isLoading: boolean
}

export function AnalyticsCards({ summary, isLoading }: AnalyticsCardsProps) {
  const cards = [
    {
      title: 'Total Messages',
      icon: MessageSquare,
      value: summary?.messages.total.value,
      change: summary?.messages.total.changePercent,
      trend: summary?.messages.total.trend,
    },
    {
      title: 'Active Users',
      icon: Users,
      value: summary?.users.activeUsers.value,
      change: summary?.users.activeUsers.changePercent,
      trend: summary?.users.activeUsers.trend,
    },
    {
      title: 'Active Channels',
      icon: Hash,
      value: summary?.channels.activeChannels.value,
      change: summary?.channels.activeChannels.changePercent,
      trend: summary?.channels.activeChannels.trend,
    },
    {
      title: 'Reactions',
      icon: Smile,
      value: summary?.reactions.totalReactions.value,
      change: summary?.reactions.totalReactions.changePercent,
      trend: summary?.reactions.totalReactions.trend,
    },
    {
      title: 'Files Uploaded',
      icon: FileUp,
      value: summary?.files.totalFiles.value,
      change: summary?.files.totalFiles.changePercent,
      trend: summary?.files.totalFiles.trend,
    },
    {
      title: 'Searches',
      icon: Search,
      value: summary?.search.totalSearches.value,
      change: summary?.search.totalSearches.changePercent,
      trend: summary?.search.totalSearches.trend,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value?.toLocaleString() ?? '-'}
            </div>
            {card.change !== undefined && (
              <TrendIndicator
                value={card.change}
                trend={card.trend}
                suffix="% from last period"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### 5. Export Functionality

```typescript
// /src/components/analytics/ExportButton.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react'
import type { DateRange, ExportFormat, AnalyticsSectionType } from '@/lib/analytics/analytics-types'

interface ExportButtonProps {
  dateRange: DateRange
  sections: AnalyticsSectionType[]
}

export function ExportButton({ dateRange, sections }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleQuickExport = async (format: ExportFormat) => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          sections,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
        }),
      })

      const data = await response.json()

      if (format === 'json') {
        downloadJSON(data.export.data, data.export.fileName)
      } else if (format === 'csv') {
        downloadCSV(data.export.data, data.export.fileName)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <FileJson className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAdvanced(true)}>
            Advanced Export Options...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Export Options</DialogTitle>
          </DialogHeader>
          <AdvancedExportForm
            dateRange={dateRange}
            onExport={(options) => {
              handleQuickExport(options.format)
              setShowAdvanced(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## Usage Tracking (Task 108)

### 1. Usage Tracking Schema

```sql
-- Add to existing analytics migration or create new migration

-- Usage metrics table for billing
CREATE TABLE nchat_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Core metrics
  messages_sent BIGINT DEFAULT 0,
  messages_stored BIGINT DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,

  -- Storage metrics
  storage_used_bytes BIGINT DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  files_stored INTEGER DEFAULT 0,

  -- API metrics
  api_calls BIGINT DEFAULT 0,
  search_queries INTEGER DEFAULT 0,
  webhook_calls INTEGER DEFAULT 0,

  -- Feature usage
  voice_minutes INTEGER DEFAULT 0,
  video_minutes INTEGER DEFAULT 0,
  ai_tokens_used BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, period_start, period_end)
);

-- Hypertable for time-series
SELECT create_hypertable(
  'nchat_usage_metrics',
  'period_start',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 month'
);

-- Feature usage tracking (granular)
CREATE TABLE nchat_feature_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID,
  feature_name VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable(
  'nchat_feature_usage_log',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX idx_feature_usage_workspace ON nchat_feature_usage_log(workspace_id, timestamp DESC);
CREATE INDEX idx_feature_usage_feature ON nchat_feature_usage_log(feature_name, timestamp DESC);

-- API call tracking
CREATE TABLE nchat_api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable(
  'nchat_api_usage_log',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

-- Retention: 90 days for granular logs, indefinite for aggregated metrics
SELECT add_retention_policy('nchat_feature_usage_log', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('nchat_api_usage_log', INTERVAL '30 days', if_not_exists => TRUE);

-- Aggregation function to roll up usage
CREATE OR REPLACE FUNCTION nchat_aggregate_daily_usage(workspace_uuid UUID, target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO nchat_usage_metrics (
    workspace_id,
    period_start,
    period_end,
    messages_sent,
    active_users,
    storage_used_bytes,
    files_uploaded,
    api_calls,
    search_queries
  )
  SELECT
    workspace_uuid,
    target_date,
    target_date + INTERVAL '1 day',
    (SELECT COUNT(*) FROM nchat_messages
     WHERE workspace_id = workspace_uuid
     AND created_at >= target_date
     AND created_at < target_date + INTERVAL '1 day'),
    (SELECT COUNT(DISTINCT user_id) FROM nchat_analytics_events
     WHERE properties->>'workspace_id' = workspace_uuid::text
     AND timestamp >= target_date
     AND timestamp < target_date + INTERVAL '1 day'),
    (SELECT COALESCE(SUM(size), 0) FROM nchat_files
     WHERE workspace_id = workspace_uuid
     AND created_at < target_date + INTERVAL '1 day'),
    (SELECT COUNT(*) FROM nchat_files
     WHERE workspace_id = workspace_uuid
     AND created_at >= target_date
     AND created_at < target_date + INTERVAL '1 day'),
    (SELECT COUNT(*) FROM nchat_api_usage_log
     WHERE workspace_id = workspace_uuid
     AND timestamp >= target_date
     AND timestamp < target_date + INTERVAL '1 day'),
    (SELECT COUNT(*) FROM nchat_analytics_search_logs
     WHERE user_id IN (SELECT id FROM nchat_users WHERE workspace_id = workspace_uuid)
     AND timestamp >= target_date
     AND timestamp < target_date + INTERVAL '1 day')
  ON CONFLICT (workspace_id, period_start, period_end)
  DO UPDATE SET
    messages_sent = EXCLUDED.messages_sent,
    active_users = EXCLUDED.active_users,
    storage_used_bytes = EXCLUDED.storage_used_bytes,
    files_uploaded = EXCLUDED.files_uploaded,
    api_calls = EXCLUDED.api_calls,
    search_queries = EXCLUDED.search_queries,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2. Usage Tracking Service

```typescript
// /src/lib/usage/usage-tracker.ts

import { graphqlClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

export interface UsageMetrics {
  messages_sent: number
  messages_stored: number
  active_users: number
  total_users: number
  storage_used_bytes: number
  files_uploaded: number
  files_stored: number
  api_calls: number
  search_queries: number
  voice_minutes: number
  video_minutes: number
  ai_tokens_used: number
}

export interface PlanLimits {
  max_messages_per_month: number
  max_storage_bytes: number
  max_users: number
  max_channels: number
  max_file_size_bytes: number
  max_api_calls_per_day: number
  features_enabled: string[]
}

export class UsageTracker {
  private workspaceId: string
  private cache: Map<string, { value: UsageMetrics; timestamp: number }> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  // Get current usage for the billing period
  async getCurrentUsage(): Promise<UsageMetrics> {
    const cacheKey = `usage-${this.workspaceId}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value
    }

    const { data } = await graphqlClient.query({
      query: GET_CURRENT_USAGE,
      variables: {
        workspaceId: this.workspaceId,
        periodStart: this.getBillingPeriodStart(),
      },
      fetchPolicy: 'network-only',
    })

    const usage = this.aggregateUsage(data)
    this.cache.set(cacheKey, { value: usage, timestamp: Date.now() })

    return usage
  }

  // Check if action is within limits
  async checkLimit(
    action: keyof UsageMetrics,
    quantity: number = 1
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const [usage, limits] = await Promise.all([this.getCurrentUsage(), this.getPlanLimits()])

    const limitMap: Partial<Record<keyof UsageMetrics, keyof PlanLimits>> = {
      messages_sent: 'max_messages_per_month',
      storage_used_bytes: 'max_storage_bytes',
      total_users: 'max_users',
      api_calls: 'max_api_calls_per_day',
    }

    const limitKey = limitMap[action]
    if (!limitKey) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity }
    }

    const current = usage[action] || 0
    const limit = limits[limitKey] || Infinity
    const remaining = Math.max(0, limit - current)
    const allowed = current + quantity <= limit

    return { allowed, current, limit, remaining }
  }

  // Track feature usage
  async trackFeature(
    featureName: string,
    category: string,
    quantity: number = 1,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await graphqlClient.mutate({
      mutation: TRACK_FEATURE_USAGE,
      variables: {
        workspaceId: this.workspaceId,
        featureName,
        category,
        quantity,
        metadata,
      },
    })
  }

  // Get plan limits
  async getPlanLimits(): Promise<PlanLimits> {
    const { data } = await graphqlClient.query({
      query: GET_WORKSPACE_PLAN_LIMITS,
      variables: { workspaceId: this.workspaceId },
    })

    return data.nchat_workspaces_by_pk?.subscription?.plan_limits || this.getFreePlanLimits()
  }

  private getFreePlanLimits(): PlanLimits {
    return {
      max_messages_per_month: 10000,
      max_storage_bytes: 5 * 1024 * 1024 * 1024, // 5GB
      max_users: 10,
      max_channels: 20,
      max_file_size_bytes: 25 * 1024 * 1024, // 25MB
      max_api_calls_per_day: 10000,
      features_enabled: ['basic_messaging', 'file_sharing'],
    }
  }

  private getBillingPeriodStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  private aggregateUsage(data: any): UsageMetrics {
    const metrics = data.nchat_usage_metrics || []
    return metrics.reduce(
      (acc: UsageMetrics, m: UsageMetrics) => ({
        messages_sent: acc.messages_sent + (m.messages_sent || 0),
        messages_stored: m.messages_stored || acc.messages_stored,
        active_users: Math.max(acc.active_users, m.active_users || 0),
        total_users: m.total_users || acc.total_users,
        storage_used_bytes: m.storage_used_bytes || acc.storage_used_bytes,
        files_uploaded: acc.files_uploaded + (m.files_uploaded || 0),
        files_stored: m.files_stored || acc.files_stored,
        api_calls: acc.api_calls + (m.api_calls || 0),
        search_queries: acc.search_queries + (m.search_queries || 0),
        voice_minutes: acc.voice_minutes + (m.voice_minutes || 0),
        video_minutes: acc.video_minutes + (m.video_minutes || 0),
        ai_tokens_used: acc.ai_tokens_used + (m.ai_tokens_used || 0),
      }),
      {
        messages_sent: 0,
        messages_stored: 0,
        active_users: 0,
        total_users: 0,
        storage_used_bytes: 0,
        files_uploaded: 0,
        files_stored: 0,
        api_calls: 0,
        search_queries: 0,
        voice_minutes: 0,
        video_minutes: 0,
        ai_tokens_used: 0,
      }
    )
  }
}

// Singleton per workspace
const trackers = new Map<string, UsageTracker>()

export function getUsageTracker(workspaceId: string): UsageTracker {
  if (!trackers.has(workspaceId)) {
    trackers.set(workspaceId, new UsageTracker(workspaceId))
  }
  return trackers.get(workspaceId)!
}
```

### 3. Usage Enforcement Middleware

```typescript
// /src/lib/api/usage-middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { getUsageTracker } from '@/lib/usage/usage-tracker'

export type UsageAction =
  | 'messages_sent'
  | 'files_uploaded'
  | 'api_calls'
  | 'search_queries'
  | 'voice_minutes'
  | 'video_minutes'
  | 'ai_tokens_used'

interface UsageEnforcementOptions {
  action: UsageAction
  quantity?: number
  onLimitExceeded?: (info: { current: number; limit: number }) => NextResponse
}

export function withUsageEnforcement(options: UsageEnforcementOptions) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const workspaceId = getWorkspaceFromRequest(request)

      if (!workspaceId) {
        return handler(request)
      }

      const tracker = getUsageTracker(workspaceId)
      const { allowed, current, limit, remaining } = await tracker.checkLimit(
        options.action,
        options.quantity || 1
      )

      if (!allowed) {
        if (options.onLimitExceeded) {
          return options.onLimitExceeded({ current, limit })
        }

        return NextResponse.json(
          {
            error: 'Usage limit exceeded',
            code: 'USAGE_LIMIT_EXCEEDED',
            details: {
              action: options.action,
              current,
              limit,
              remaining: 0,
            },
          },
          {
            status: 429,
            headers: {
              'X-Usage-Limit': String(limit),
              'X-Usage-Current': String(current),
              'X-Usage-Remaining': '0',
            },
          }
        )
      }

      // Add usage headers to response
      const response = await handler(request)

      response.headers.set('X-Usage-Limit', String(limit))
      response.headers.set('X-Usage-Current', String(current))
      response.headers.set('X-Usage-Remaining', String(remaining - (options.quantity || 1)))

      // Track usage after successful request
      await tracker.trackFeature(options.action, 'api', options.quantity || 1, {
        endpoint: request.nextUrl.pathname,
      })

      return response
    }
  }
}

// Usage example:
// export const POST = compose(
//   withErrorHandler,
//   withAuth,
//   withUsageEnforcement({ action: 'messages_sent' })
// )(handleCreateMessage)
```

### 4. Usage Dashboard API

```typescript
// /src/app/api/usage/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getUsageTracker } from '@/lib/usage/usage-tracker'
import { withAuth } from '@/lib/api/middleware'

async function handleGetUsage(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request)
  const workspaceId = user?.workspaceId

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const tracker = getUsageTracker(workspaceId)
  const [usage, limits] = await Promise.all([tracker.getCurrentUsage(), tracker.getPlanLimits()])

  // Calculate percentages
  const usageWithPercent = {
    messages: {
      used: usage.messages_sent,
      limit: limits.max_messages_per_month,
      percent: Math.round((usage.messages_sent / limits.max_messages_per_month) * 100),
    },
    storage: {
      used: usage.storage_used_bytes,
      limit: limits.max_storage_bytes,
      percent: Math.round((usage.storage_used_bytes / limits.max_storage_bytes) * 100),
    },
    users: {
      used: usage.total_users,
      limit: limits.max_users,
      percent: Math.round((usage.total_users / limits.max_users) * 100),
    },
    apiCalls: {
      used: usage.api_calls,
      limit: limits.max_api_calls_per_day,
      percent: Math.round((usage.api_calls / limits.max_api_calls_per_day) * 100),
    },
  }

  return NextResponse.json({
    usage: usageWithPercent,
    raw: usage,
    limits,
    billingPeriod: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    },
  })
}

export const GET = withAuth(handleGetUsage)
```

---

## API Endpoints Summary

### Search Endpoints

| Method | Endpoint                           | Description                  |
| ------ | ---------------------------------- | ---------------------------- |
| GET    | `/api/search?q=query`              | Quick search                 |
| POST   | `/api/search`                      | Advanced search with filters |
| GET    | `/api/search/suggestions?q=prefix` | Search suggestions           |
| POST   | `/api/search/facets`               | Get facet distributions      |
| POST   | `/api/search/initialize`           | Initialize/reindex           |
| POST   | `/api/webhooks/search-index`       | Hasura event webhook         |

### Analytics Endpoints

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| GET    | `/api/analytics/dashboard` | Full dashboard data     |
| GET    | `/api/analytics/messages`  | Message analytics       |
| GET    | `/api/analytics/users`     | User analytics          |
| GET    | `/api/analytics/channels`  | Channel analytics       |
| GET    | `/api/analytics/search`    | Search analytics        |
| POST   | `/api/analytics/export`    | Export analytics data   |
| GET    | `/api/analytics/realtime`  | Real-time metrics (SSE) |

### Usage Endpoints

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| GET    | `/api/usage`         | Current usage metrics |
| GET    | `/api/usage/history` | Historical usage      |
| GET    | `/api/usage/limits`  | Plan limits           |
| GET    | `/api/usage/alerts`  | Usage alerts          |

---

## Real-time Analytics

### 1. GraphQL Subscriptions

```typescript
// /src/graphql/subscriptions/analytics-subscriptions.ts

import { gql } from '@apollo/client'

export const SUBSCRIBE_ACTIVE_USERS = gql`
  subscription OnActiveUsersChange($workspaceId: uuid!) {
    nchat_analytics_realtime_users(where: { workspace_id: { _eq: $workspaceId } }) {
      active_count
      online_count
      away_count
      dnd_count
      updated_at
    }
  }
`

export const SUBSCRIBE_MESSAGE_RATE = gql`
  subscription OnMessageRate($workspaceId: uuid!) {
    nchat_analytics_message_rate(
      where: { workspace_id: { _eq: $workspaceId } }
      order_by: { timestamp: desc }
      limit: 60
    ) {
      timestamp
      messages_per_minute
      unique_senders
    }
  }
`

export const SUBSCRIBE_CHANNEL_ACTIVITY = gql`
  subscription OnChannelActivity($workspaceId: uuid!) {
    nchat_channels(
      where: { workspace_id: { _eq: $workspaceId }, is_archived: { _eq: false } }
      order_by: { last_message_at: desc_nulls_last }
      limit: 10
    ) {
      id
      name
      last_message_at
      unread_count: messages_aggregate(
        where: { created_at: { _gte: "now() - interval '1 hour'" } }
      ) {
        aggregate {
          count
        }
      }
    }
  }
`
```

### 2. Real-time Dashboard Hook

```typescript
// /src/hooks/use-realtime-analytics.ts

import { useSubscription } from '@apollo/client'
import { useState, useEffect } from 'react'
import {
  SUBSCRIBE_ACTIVE_USERS,
  SUBSCRIBE_MESSAGE_RATE,
} from '@/graphql/subscriptions/analytics-subscriptions'

interface RealtimeMetrics {
  activeUsers: {
    total: number
    online: number
    away: number
    dnd: number
  }
  messageRate: Array<{
    timestamp: Date
    messagesPerMinute: number
    uniqueSenders: number
  }>
  lastUpdated: Date
}

export function useRealtimeAnalytics(workspaceId: string) {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)

  const { data: activeUsersData } = useSubscription(SUBSCRIBE_ACTIVE_USERS, {
    variables: { workspaceId },
  })

  const { data: messageRateData } = useSubscription(SUBSCRIBE_MESSAGE_RATE, {
    variables: { workspaceId },
  })

  useEffect(() => {
    if (activeUsersData || messageRateData) {
      setMetrics((prev) => ({
        activeUsers: activeUsersData?.nchat_analytics_realtime_users?.[0]
          ? {
              total: activeUsersData.nchat_analytics_realtime_users[0].active_count,
              online: activeUsersData.nchat_analytics_realtime_users[0].online_count,
              away: activeUsersData.nchat_analytics_realtime_users[0].away_count,
              dnd: activeUsersData.nchat_analytics_realtime_users[0].dnd_count,
            }
          : prev?.activeUsers || { total: 0, online: 0, away: 0, dnd: 0 },
        messageRate:
          messageRateData?.nchat_analytics_message_rate?.map((r: any) => ({
            timestamp: new Date(r.timestamp),
            messagesPerMinute: r.messages_per_minute,
            uniqueSenders: r.unique_senders,
          })) ||
          prev?.messageRate ||
          [],
        lastUpdated: new Date(),
      }))
    }
  }, [activeUsersData, messageRateData])

  return { metrics, isConnected: !!metrics }
}
```

---

## Implementation Phases

### Phase 1: MeiliSearch Production Integration (Week 1-2)

1. **Database Triggers Setup**
   - Create index queue table
   - Add triggers for messages, files, users, channels
   - Test trigger performance

2. **Indexing Worker**
   - Implement queue processor
   - Add batch processing
   - Implement error handling and retry

3. **Initial Data Migration**
   - Create bulk reindex script
   - Test with production data volumes
   - Implement progress tracking

4. **Search API Hardening**
   - Remove mock data fallback
   - Add permission filtering
   - Implement search logging

### Phase 2: Search UI Completion (Week 2-3)

1. **Global Search Bar**
   - Keyboard shortcuts (Cmd+K)
   - Suggestions dropdown
   - Recent searches

2. **Advanced Search**
   - Filter builder UI
   - Date range picker
   - Channel/user autocomplete

3. **Search Results**
   - Result type tabs
   - Infinite scroll / pagination
   - Result highlighting

### Phase 3: Analytics Dashboard (Week 3-4)

1. **Data Collection**
   - Replace mock collectors with real GraphQL queries
   - Implement continuous aggregates
   - Set up scheduled jobs for rollups

2. **Dashboard UI**
   - Summary cards
   - Time-series charts
   - Activity tables

3. **Export**
   - CSV export
   - JSON export
   - PDF generation (optional)
   - Scheduled reports

### Phase 4: Usage Tracking (Week 4-5)

1. **Schema & Triggers**
   - Usage metrics tables
   - Feature usage logging
   - API usage logging

2. **Tracking Service**
   - Usage tracker class
   - Plan limits integration
   - Real-time usage checking

3. **Enforcement**
   - API middleware
   - Feature gating
   - Overage handling

4. **Dashboard**
   - Usage display
   - Alerts configuration
   - Billing integration hooks

---

## Testing Strategy

### Unit Tests

```typescript
// /src/lib/search/__tests__/query-parser.test.ts
describe('parseQuery', () => {
  it('extracts from: operator', () => {
    const result = parseQuery('hello from:john')
    expect(result.text).toBe('hello')
    expect(result.filters.from).toBe('john')
  })

  it('handles multiple operators', () => {
    const result = parseQuery('bug from:dev in:bugs has:file')
    expect(result.text).toBe('bug')
    expect(result.filters.from).toBe('dev')
    expect(result.filters.in).toBe('bugs')
    expect(result.filters.has).toContain('file')
  })
})
```

### Integration Tests

```typescript
// /src/__tests__/integration/search.integration.test.ts
describe('Search Integration', () => {
  beforeAll(async () => {
    await initializeTestMeiliSearch()
    await seedTestData()
  })

  it('searches messages with permission filtering', async () => {
    const user = await createTestUser({ role: 'member' })
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ query: 'test message' }),
    })

    const data = await response.json()
    expect(data.results.messages).not.toContainPrivateChannelMessages()
  })
})
```

### E2E Tests

```typescript
// /e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('global search with keyboard shortcut', async ({ page }) => {
    await page.goto('/chat')
    await page.keyboard.press('Meta+k')
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.fill('[data-testid="search-input"]', 'project update')
    await expect(page.getByText('Search results')).toBeVisible()
  })

  test('advanced search filters', async ({ page }) => {
    await page.goto('/chat')
    await page.click('[data-testid="advanced-search"]')

    await page.selectOption('[data-testid="from-filter"]', 'john')
    await page.selectOption('[data-testid="in-filter"]', 'general')
    await page.click('[data-testid="search-button"]')

    await expect(page.getByText('from:john')).toBeVisible()
  })
})
```

---

## Security Considerations

### 1. Search Permission Filtering

- All search queries MUST be filtered by user permissions
- Private channel content only visible to members
- DM content only visible to participants
- Deleted content excluded from search

### 2. Rate Limiting

```typescript
const SEARCH_RATE_LIMITS = {
  anonymous: { limit: 10, window: 60 }, // 10/min
  authenticated: { limit: 60, window: 60 }, // 60/min
  admin: { limit: 300, window: 60 }, // 300/min
}
```

### 3. Query Sanitization

- Escape special MeiliSearch characters
- Limit query length (200 chars)
- Validate date formats
- Prevent filter injection

### 4. Analytics Privacy

- Aggregate data only (no individual message content)
- Anonymize user data for non-admin views
- Respect user opt-out preferences
- GDPR-compliant data retention

### 5. Usage Tracking Privacy

- No message content in usage logs
- Anonymized API endpoint tracking
- Configurable retention periods
- User consent for detailed tracking

---

## Dependencies

### New Packages Needed

```json
{
  "dependencies": {
    "meilisearch": "^0.36.0", // Already installed
    "recharts": "^2.10.0", // For charts (or keep existing)
    "xlsx": "^0.18.5", // Excel export
    "pdfmake": "^0.2.7", // PDF export
    "@react-pdf/renderer": "^3.1.0" // Alternative PDF
  }
}
```

### Environment Variables

```bash
# MeiliSearch
NEXT_PUBLIC_MEILISEARCH_URL=http://search.localhost:7700
MEILISEARCH_MASTER_KEY=your-master-key
MEILISEARCH_SEARCH_KEY=your-search-key

# Analytics
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_AGGREGATION_CRON="0 */6 * * *"

# Usage Tracking
USAGE_TRACKING_ENABLED=true
USAGE_ALERT_THRESHOLD=0.8
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for completing Tasks 106-108. The existing codebase has significant infrastructure in place, particularly:

- MeiliSearch client and indexer utilities
- Analytics types and aggregation logic
- Search UI components
- Database schema for analytics

**Key remaining work:**

1. Replace mock data with real database queries
2. Implement real-time indexing via database triggers
3. Complete export functionality (PDF, XLSX)
4. Build usage tracking and enforcement system
5. Add comprehensive tests

**Estimated effort:** 4-5 weeks for full implementation with testing.
