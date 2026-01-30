/**
 * Search API Route
 *
 * Provides unified search across messages, files, users, and channels using MeiliSearch.
 * Supports full-text search with operators and filters.
 *
 * @endpoint POST /api/search - Search with filters
 * @endpoint GET /api/search?q=query - Quick search
 *
 * Supported operators:
 * - from:username - filter by sender
 * - in:channel-name - filter by channel
 * - has:link - messages with links
 * - has:file - messages with attachments
 * - has:image - messages with images
 * - before:2024-01-01 - before date
 * - after:2024-01-01 - after date
 * - is:pinned - pinned messages only
 * - is:starred - starred messages only
 *
 * @example
 * ```typescript
 * // Quick search
 * const response = await fetch('/api/search?q=hello')
 *
 * // Search with operators
 * const response = await fetch('/api/search?q=project from:john in:general has:file')
 *
 * // Advanced search with filters
 * const response = await fetch('/api/search', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     query: 'project update from:john in:general',
 *     types: ['messages', 'files'],
 *     limit: 20,
 *     offset: 0
 *   })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  successResponse,
  badRequestResponse,
  paginatedResponse,
  internalErrorResponse,
} from '@/lib/api/response'
import {
  withErrorHandler,
  withRateLimit,
  withOptionalAuth,
  getAuthenticatedUser,
  compose,
} from '@/lib/api/middleware'
import { parseQuery, buildMeiliSearchFilter } from '@/lib/search/query-parser'
import { searchAll, searchIndex, INDEX_NAMES } from '@/lib/search/meilisearch-client'
import type { SearchOptions } from '@/lib/search/meilisearch-client'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Search limits
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,

  // Rate limiting
  RATE_LIMIT: {
    limit: 60, // 60 searches per minute
    window: 60,
  },

  // Search types
  VALID_TYPES: ['messages', 'files', 'users', 'channels'] as const,
}

// ============================================================================
// Types
// ============================================================================

type SearchType = (typeof CONFIG.VALID_TYPES)[number]

interface SearchRequest {
  query: string
  types?: SearchType[]
  channelIds?: string[]
  userIds?: string[]
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date'
  sortOrder?: 'asc' | 'desc'
}

interface SearchResultItem {
  id: string
  type: SearchType
  title: string
  content?: string
  snippet?: string
  highlight?: string
  score?: number
  channelId?: string
  channelName?: string
  userId?: string
  userName?: string
  avatarUrl?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface SearchResults {
  items: SearchResultItem[]
  totals: {
    messages: number
    files: number
    users: number
    channels: number
    total: number
  }
  query: string
  types: SearchType[]
}

// ============================================================================
// Mock Data (Replace with actual database queries in production)
// ============================================================================

const mockMessages: SearchResultItem[] = [
  {
    id: 'msg-1',
    type: 'messages',
    title: 'Message from John',
    content: 'Hey team, here is the project update for this week.',
    snippet: '...the project update for this week...',
    channelId: 'channel-general',
    channelName: 'general',
    userId: 'user-1',
    userName: 'John Doe',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'msg-2',
    type: 'messages',
    title: 'Message from Jane',
    content: 'Great progress on the new feature implementation!',
    snippet: '...progress on the new feature...',
    channelId: 'channel-dev',
    channelName: 'dev',
    userId: 'user-2',
    userName: 'Jane Smith',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

const mockFiles: SearchResultItem[] = [
  {
    id: 'file-1',
    type: 'files',
    title: 'Project_Proposal.pdf',
    content: 'PDF Document',
    channelId: 'channel-general',
    channelName: 'general',
    userId: 'user-1',
    userName: 'John Doe',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    metadata: { size: 1024000, mimeType: 'application/pdf' },
  },
  {
    id: 'file-2',
    type: 'files',
    title: 'design_mockup.png',
    content: 'Image',
    channelId: 'channel-design',
    channelName: 'design',
    userId: 'user-3',
    userName: 'Alice Designer',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    metadata: { size: 512000, mimeType: 'image/png' },
  },
]

const mockUsers: SearchResultItem[] = [
  {
    id: 'user-1',
    type: 'users',
    title: 'John Doe',
    content: 'john@example.com',
    avatarUrl: '/avatars/john.jpg',
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    metadata: { role: 'admin', status: 'online' },
  },
  {
    id: 'user-2',
    type: 'users',
    title: 'Jane Smith',
    content: 'jane@example.com',
    avatarUrl: '/avatars/jane.jpg',
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    metadata: { role: 'member', status: 'offline' },
  },
]

const mockChannels: SearchResultItem[] = [
  {
    id: 'channel-general',
    type: 'channels',
    title: 'general',
    content: 'General discussion channel',
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
    metadata: { memberCount: 50, isPrivate: false },
  },
  {
    id: 'channel-dev',
    type: 'channels',
    title: 'dev',
    content: 'Development team discussions',
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
    metadata: { memberCount: 15, isPrivate: false },
  },
]

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate search request
 */
function validateSearchRequest(
  body: unknown
): { valid: true; request: SearchRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const data = body as Record<string, unknown>

  // Validate query
  if (!data.query || typeof data.query !== 'string') {
    return { valid: false, error: 'Search query is required' }
  }

  const query = data.query.trim()

  if (query.length < CONFIG.MIN_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query must be at least ${CONFIG.MIN_QUERY_LENGTH} characters`,
    }
  }

  if (query.length > CONFIG.MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query must be at most ${CONFIG.MAX_QUERY_LENGTH} characters`,
    }
  }

  // Validate types
  let types: SearchType[] = [...CONFIG.VALID_TYPES]
  if (data.types) {
    if (!Array.isArray(data.types)) {
      return { valid: false, error: 'Types must be an array' }
    }

    const invalidTypes = data.types.filter((t) => !CONFIG.VALID_TYPES.includes(t as SearchType))
    if (invalidTypes.length > 0) {
      return {
        valid: false,
        error: `Invalid types: ${invalidTypes.join(', ')}. Valid types: ${CONFIG.VALID_TYPES.join(', ')}`,
      }
    }

    types = data.types as SearchType[]
  }

  // Validate limit
  let limit = CONFIG.DEFAULT_LIMIT
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit < 1) {
      return { valid: false, error: 'Limit must be a positive number' }
    }
    limit = Math.min(data.limit, CONFIG.MAX_LIMIT)
  }

  // Validate offset
  let offset = 0
  if (data.offset !== undefined) {
    if (typeof data.offset !== 'number' || data.offset < 0) {
      return { valid: false, error: 'Offset must be a non-negative number' }
    }
    offset = data.offset
  }

  // Validate dates
  let dateFrom: string | undefined
  let dateTo: string | undefined

  if (data.dateFrom) {
    if (typeof data.dateFrom !== 'string' || isNaN(Date.parse(data.dateFrom))) {
      return { valid: false, error: 'Invalid dateFrom format' }
    }
    dateFrom = data.dateFrom
  }

  if (data.dateTo) {
    if (typeof data.dateTo !== 'string' || isNaN(Date.parse(data.dateTo))) {
      return { valid: false, error: 'Invalid dateTo format' }
    }
    dateTo = data.dateTo
  }

  return {
    valid: true,
    request: {
      query,
      types,
      channelIds: Array.isArray(data.channelIds) ? data.channelIds as string[] : undefined,
      userIds: Array.isArray(data.userIds) ? data.userIds as string[] : undefined,
      dateFrom,
      dateTo,
      limit,
      offset,
      sortBy: data.sortBy === 'date' ? 'date' : 'relevance',
      sortOrder: data.sortOrder === 'asc' ? 'asc' : 'desc',
    },
  }
}

/**
 * Simple text matching for mock search
 */
function matchesQuery(text: string | undefined, query: string): boolean {
  if (!text) return false
  return text.toLowerCase().includes(query.toLowerCase())
}

/**
 * Create highlighted snippet
 */
function createHighlight(text: string, query: string): string {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return text.slice(0, 100)

  const start = Math.max(0, index - 30)
  const end = Math.min(text.length, index + query.length + 30)
  let snippet = text.slice(start, end)

  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'

  return snippet
}

/**
 * Search messages (mock implementation)
 */
async function searchMessages(
  request: SearchRequest,
  userId?: string
): Promise<SearchResultItem[]> {
  // In production, this would use PostgreSQL FTS or search engine:
  // const { data } = await graphqlClient.query({
  //   query: SEARCH_MESSAGES,
  //   variables: {
  //     search: request.query,
  //     channelIds: request.channelIds,
  //     dateFrom: request.dateFrom,
  //     dateTo: request.dateTo,
  //     limit: request.limit,
  //     offset: request.offset
  //   }
  // })

  return mockMessages
    .filter((msg) => matchesQuery(msg.content, request.query) || matchesQuery(msg.title, request.query))
    .map((msg) => ({
      ...msg,
      highlight: createHighlight(msg.content || '', request.query),
      score: 1.0,
    }))
}

/**
 * Search files (mock implementation)
 */
async function searchFiles(
  request: SearchRequest,
  userId?: string
): Promise<SearchResultItem[]> {
  return mockFiles
    .filter((file) => matchesQuery(file.title, request.query))
    .map((file) => ({
      ...file,
      highlight: file.title,
      score: 0.9,
    }))
}

/**
 * Search users (mock implementation)
 */
async function searchUsers(
  request: SearchRequest,
  userId?: string
): Promise<SearchResultItem[]> {
  return mockUsers
    .filter(
      (user) =>
        matchesQuery(user.title, request.query) || matchesQuery(user.content, request.query)
    )
    .map((user) => ({
      ...user,
      score: 0.8,
    }))
}

/**
 * Search channels (mock implementation)
 */
async function searchChannels(
  request: SearchRequest,
  userId?: string
): Promise<SearchResultItem[]> {
  return mockChannels
    .filter(
      (channel) =>
        matchesQuery(channel.title, request.query) ||
        matchesQuery(channel.content, request.query)
    )
    .map((channel) => ({
      ...channel,
      score: 0.7,
    }))
}

/**
 * Perform search across all types using MeiliSearch
 */
async function performSearch(
  request: SearchRequest,
  userId?: string
): Promise<SearchResults> {
  // Parse query for operators
  const parsedQuery = parseQuery(request.query)

  // Build additional filters from request
  const additionalFilters: Record<string, unknown> = {}

  if (request.channelIds && request.channelIds.length > 0) {
    additionalFilters.channel_id = request.channelIds
  }

  if (request.userIds && request.userIds.length > 0) {
    additionalFilters.author_id = request.userIds
  }

  // Apply date range filters from request (override query operators)
  if (request.dateFrom) {
    const afterTimestamp = new Date(request.dateFrom).getTime() / 1000
    additionalFilters.created_at_after = afterTimestamp
  }

  if (request.dateTo) {
    const beforeTimestamp = new Date(request.dateTo).getTime() / 1000
    additionalFilters.created_at_before = beforeTimestamp
  }

  // Build MeiliSearch filter
  const filterString = buildMeiliSearchFilter(parsedQuery, additionalFilters)

  // Search options
  const searchOptions: SearchOptions = {
    filters: filterString || undefined,
    limit: request.limit || CONFIG.DEFAULT_LIMIT,
    offset: request.offset || 0,
    sort: request.sortBy === 'date'
      ? [`created_at:${request.sortOrder || 'desc'}`]
      : undefined,
    attributesToHighlight: ['content', 'name', 'display_name', 'title', 'description'],
    attributesToCrop: ['content', 'description'],
    cropLength: 200,
  }

  const results: SearchResultItem[] = []
  const totals = {
    messages: 0,
    files: 0,
    users: 0,
    channels: 0,
    total: 0,
  }

  try {
    // Determine which types to search
    const typesToSearch = request.types || [...CONFIG.VALID_TYPES]

    // Search all types or specific types
    if (typesToSearch.length === CONFIG.VALID_TYPES.length) {
      // Search all indexes at once
      const allResults = await searchAll(parsedQuery.text, searchOptions)

      // Convert messages to SearchResultItem
      if (typesToSearch.includes('messages') && allResults.messages) {
        totals.messages = allResults.messages.length
        results.push(...allResults.messages.map((msg: any) => ({
          id: msg.id,
          type: 'messages' as SearchType,
          title: `Message from ${msg.author_name}`,
          content: msg.content,
          snippet: msg._formatted?.content || msg.content?.slice(0, 200),
          highlight: msg._formatted?.content,
          channelId: msg.channel_id,
          channelName: msg.channel_name,
          userId: msg.author_id,
          userName: msg.author_name,
          createdAt: msg.created_at,
          score: msg._rankingScore,
        })))
      }

      // Convert files to SearchResultItem
      if (typesToSearch.includes('files') && allResults.files) {
        totals.files = allResults.files.length
        results.push(...allResults.files.map((file: any) => ({
          id: file.id,
          type: 'files' as SearchType,
          title: file.name || file.original_name,
          content: file.description,
          snippet: file._formatted?.description,
          channelId: file.channel_id,
          userId: file.uploader_id,
          userName: file.uploader_name,
          createdAt: file.created_at,
          metadata: {
            size: file.size,
            mimeType: file.mime_type,
            fileType: file.file_type,
          },
          score: file._rankingScore,
        })))
      }

      // Convert users to SearchResultItem
      if (typesToSearch.includes('users') && allResults.users) {
        totals.users = allResults.users.length
        results.push(...allResults.users.map((user: any) => ({
          id: user.id,
          type: 'users' as SearchType,
          title: user.display_name,
          content: user.email,
          snippet: user._formatted?.bio,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          metadata: {
            role: user.role,
            username: user.username,
          },
          score: user._rankingScore,
        })))
      }

      // Convert channels to SearchResultItem
      if (typesToSearch.includes('channels') && allResults.channels) {
        totals.channels = allResults.channels.length
        results.push(...allResults.channels.map((channel: any) => ({
          id: channel.id,
          type: 'channels' as SearchType,
          title: channel.name,
          content: channel.description,
          snippet: channel._formatted?.description,
          createdAt: channel.created_at,
          metadata: {
            isPrivate: channel.is_private,
            memberCount: channel.member_count,
          },
          score: channel._rankingScore,
        })))
      }
    } else {
      // Search specific indexes
      const searchPromises = typesToSearch.map(async (type) => {
        const indexName = type === 'messages' ? INDEX_NAMES.MESSAGES
          : type === 'files' ? INDEX_NAMES.FILES
          : type === 'users' ? INDEX_NAMES.USERS
          : INDEX_NAMES.CHANNELS

        const searchResult = await searchIndex(indexName, parsedQuery.text, searchOptions)
        return { type, hits: searchResult.hits }
      })

      const searchResults = await Promise.all(searchPromises)

      // Convert results for each type
      searchResults.forEach(({ type, hits }) => {
        if (type === 'messages') {
          totals.messages = hits.length
          results.push(...hits.map((msg: any) => ({
            id: msg.id,
            type: 'messages' as SearchType,
            title: `Message from ${msg.author_name}`,
            content: msg.content,
            snippet: msg._formatted?.content || msg.content?.slice(0, 200),
            highlight: msg._formatted?.content,
            channelId: msg.channel_id,
            channelName: msg.channel_name,
            userId: msg.author_id,
            userName: msg.author_name,
            createdAt: msg.created_at,
            score: msg._rankingScore,
          })))
        } else if (type === 'files') {
          totals.files = hits.length
          results.push(...hits.map((file: any) => ({
            id: file.id,
            type: 'files' as SearchType,
            title: file.name || file.original_name,
            content: file.description,
            snippet: file._formatted?.description,
            channelId: file.channel_id,
            userId: file.uploader_id,
            userName: file.uploader_name,
            createdAt: file.created_at,
            metadata: {
              size: file.size,
              mimeType: file.mime_type,
              fileType: file.file_type,
            },
            score: file._rankingScore,
          })))
        } else if (type === 'users') {
          totals.users = hits.length
          results.push(...hits.map((user: any) => ({
            id: user.id,
            type: 'users' as SearchType,
            title: user.display_name,
            content: user.email,
            snippet: user._formatted?.bio,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
            metadata: {
              role: user.role,
              username: user.username,
            },
            score: user._rankingScore,
          })))
        } else if (type === 'channels') {
          totals.channels = hits.length
          results.push(...hits.map((channel: any) => ({
            id: channel.id,
            type: 'channels' as SearchType,
            title: channel.name,
            content: channel.description,
            snippet: channel._formatted?.description,
            createdAt: channel.created_at,
            metadata: {
              isPrivate: channel.is_private,
              memberCount: channel.member_count,
            },
            score: channel._rankingScore,
          })))
        }
      })
    }

    totals.total = results.length

    // Sort results if needed (MeiliSearch already sorts by relevance)
    if (request.sortBy === 'relevance' && request.sortOrder === 'asc') {
      results.reverse()
    }

    return {
      items: results,
      totals,
      query: request.query,
      types: request.types || [...CONFIG.VALID_TYPES],
    }
  } catch (error) {
    console.error('MeiliSearch error:', error)
    // Fall back to mock data on MeiliSearch error
    console.warn('Falling back to mock search results')

    const results: SearchResultItem[] = []
    const totals = {
      messages: 0,
      files: 0,
      users: 0,
      channels: 0,
      total: 0,
    }

    // Use mock implementation as fallback
    if (request.types?.includes('messages')) {
      const items = await searchMessages(request, userId)
      totals.messages = items.length
      results.push(...items)
    }

    if (request.types?.includes('files')) {
      const items = await searchFiles(request, userId)
      totals.files = items.length
      results.push(...items)
    }

    if (request.types?.includes('users')) {
      const items = await searchUsers(request, userId)
      totals.users = items.length
      results.push(...items)
    }

    if (request.types?.includes('channels')) {
      const items = await searchChannels(request, userId)
      totals.channels = items.length
      results.push(...items)
    }

    totals.total = results.length

    return {
      items: results,
      totals,
      query: request.query,
      types: request.types || [...CONFIG.VALID_TYPES],
    }
  }
}

// ============================================================================
// GET Handler - Quick Search
// ============================================================================

async function handleGet(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return badRequestResponse('Search query (q) is required', 'MISSING_QUERY')
  }

  if (query.length < CONFIG.MIN_QUERY_LENGTH) {
    return badRequestResponse(
      `Query must be at least ${CONFIG.MIN_QUERY_LENGTH} characters`,
      'QUERY_TOO_SHORT'
    )
  }

  const user = await getAuthenticatedUser(request)

  try {
    const searchRequest: SearchRequest = {
      query,
      types: [...CONFIG.VALID_TYPES],
      limit: parseInt(searchParams.get('limit') || String(CONFIG.DEFAULT_LIMIT), 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    }

    const results = await performSearch(searchRequest, user?.id)

    return paginatedResponse(results.items, {
      total: results.totals.total,
      page: Math.floor((searchRequest.offset || 0) / (searchRequest.limit || CONFIG.DEFAULT_LIMIT)) + 1,
      limit: searchRequest.limit || CONFIG.DEFAULT_LIMIT,
    })
  } catch (error) {
    console.error('Search error:', error)
    return internalErrorResponse('Search failed')
  }
}

// ============================================================================
// POST Handler - Advanced Search
// ============================================================================

async function handlePost(request: NextRequest): Promise<NextResponse> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return badRequestResponse('Invalid JSON body', 'INVALID_JSON')
  }

  const validation = validateSearchRequest(body)
  if (!validation.valid) {
    return badRequestResponse((validation as { valid: false; error: string }).error, 'VALIDATION_ERROR')
  }

  const user = await getAuthenticatedUser(request)

  try {
    const results = await performSearch(validation.request, user?.id)

    return successResponse({
      results: results.items,
      totals: results.totals,
      query: results.query,
      types: results.types,
      pagination: {
        total: results.totals.total,
        limit: validation.request.limit || CONFIG.DEFAULT_LIMIT,
        offset: validation.request.offset || 0,
        hasMore:
          (validation.request.offset || 0) + (validation.request.limit || CONFIG.DEFAULT_LIMIT) <
          results.totals.total,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return internalErrorResponse('Search failed')
  }
}

// ============================================================================
// Export Handlers
// ============================================================================

export const GET = compose(
  withErrorHandler,
  withRateLimit(CONFIG.RATE_LIMIT)
)(handleGet)

export const POST = compose(
  withErrorHandler,
  withRateLimit(CONFIG.RATE_LIMIT)
)(handlePost)

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
