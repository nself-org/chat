/**
 * Search API Route
 *
 * Provides unified search across messages, files, users, and channels.
 * Supports full-text search with filters and pagination.
 *
 * @endpoint POST /api/search - Search with filters
 * @endpoint GET /api/search?q=query - Quick search
 *
 * @example
 * ```typescript
 * // Quick search
 * const response = await fetch('/api/search?q=hello')
 *
 * // Advanced search with filters
 * const response = await fetch('/api/search', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     query: 'project update',
 *     types: ['messages', 'files'],
 *     channelIds: ['channel-1', 'channel-2'],
 *     dateFrom: '2024-01-01',
 *     dateTo: '2024-12-31',
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
 * Perform search across all types
 */
async function performSearch(
  request: SearchRequest,
  userId?: string
): Promise<SearchResults> {
  const results: SearchResultItem[] = []
  const totals = {
    messages: 0,
    files: 0,
    users: 0,
    channels: 0,
    total: 0,
  }

  // Search each type in parallel
  const searchPromises: Promise<void>[] = []

  if (request.types?.includes('messages')) {
    searchPromises.push(
      searchMessages(request, userId).then((items) => {
        totals.messages = items.length
        results.push(...items)
      })
    )
  }

  if (request.types?.includes('files')) {
    searchPromises.push(
      searchFiles(request, userId).then((items) => {
        totals.files = items.length
        results.push(...items)
      })
    )
  }

  if (request.types?.includes('users')) {
    searchPromises.push(
      searchUsers(request, userId).then((items) => {
        totals.users = items.length
        results.push(...items)
      })
    )
  }

  if (request.types?.includes('channels')) {
    searchPromises.push(
      searchChannels(request, userId).then((items) => {
        totals.channels = items.length
        results.push(...items)
      })
    )
  }

  await Promise.all(searchPromises)

  totals.total = results.length

  // Sort results
  results.sort((a, b) => {
    if (request.sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return request.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    }

    // Sort by relevance (score)
    const scoreA = a.score || 0
    const scoreB = b.score || 0
    return request.sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA
  })

  // Apply pagination
  const paginatedResults = results.slice(
    request.offset || 0,
    (request.offset || 0) + (request.limit || CONFIG.DEFAULT_LIMIT)
  )

  return {
    items: paginatedResults,
    totals,
    query: request.query,
    types: request.types || [...CONFIG.VALID_TYPES],
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
