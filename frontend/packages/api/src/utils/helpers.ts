/**
 * API Helper Utilities
 *
 * Miscellaneous helper functions for API operations.
 *
 * @packageDocumentation
 * @module @nself-chat/api/utils
 */

import type { PaginationInput, FilterCondition, SortInput } from '../types/api'
import type { HasuraQueryArgs, HasuraBoolExp, HasuraOrderBy } from '../types/graphql'

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Build Hasura pagination arguments from input
 */
export function buildPaginationArgs(input: PaginationInput): { limit?: number; offset?: number } {
  const args: { limit?: number; offset?: number } = {}

  if (input.perPage) {
    args.limit = input.perPage
  }

  if (input.page && input.perPage) {
    args.offset = (input.page - 1) * input.perPage
  }

  return args
}

/**
 * Build URL search params from pagination input
 */
export function buildPaginationParams(input: PaginationInput): URLSearchParams {
  const params = new URLSearchParams()

  if (input.page) params.set('page', String(input.page))
  if (input.perPage) params.set('perPage', String(input.perPage))
  if (input.cursor) params.set('cursor', input.cursor)
  if (input.cursorDirection) params.set('cursorDirection', input.cursorDirection)

  return params
}

// ============================================================================
// Filter Helpers
// ============================================================================

/**
 * Build Hasura boolean expression from filter conditions
 */
export function buildWhereClause<T>(conditions: FilterCondition[]): HasuraBoolExp<T> {
  if (conditions.length === 0) {
    return {}
  }

  const where: HasuraBoolExp<T> = { _and: [] }

  for (const condition of conditions) {
    const { field, operator, value } = condition
    const fieldCondition: Record<string, unknown> = {}

    switch (operator) {
      case 'eq':
        fieldCondition[field] = { _eq: value }
        break
      case 'ne':
        fieldCondition[field] = { _neq: value }
        break
      case 'gt':
        fieldCondition[field] = { _gt: value }
        break
      case 'gte':
        fieldCondition[field] = { _gte: value }
        break
      case 'lt':
        fieldCondition[field] = { _lt: value }
        break
      case 'lte':
        fieldCondition[field] = { _lte: value }
        break
      case 'in':
        fieldCondition[field] = { _in: value }
        break
      case 'nin':
        fieldCondition[field] = { _nin: value }
        break
      case 'contains':
        fieldCondition[field] = { _ilike: `%${value}%` }
        break
      case 'startsWith':
        fieldCondition[field] = { _ilike: `${value}%` }
        break
      case 'endsWith':
        fieldCondition[field] = { _ilike: `%${value}` }
        break
      case 'isNull':
        fieldCondition[field] = { _is_null: true }
        break
      case 'isNotNull':
        fieldCondition[field] = { _is_null: false }
        break
    }

    where._and!.push(fieldCondition as HasuraBoolExp<T>)
  }

  return where
}

// ============================================================================
// Sort Helpers
// ============================================================================

/**
 * Build Hasura order by clause from sort input
 */
export function buildOrderByClause<T>(sorts: SortInput[]): Partial<Record<keyof T, HasuraOrderBy>> {
  const orderBy: Partial<Record<keyof T, HasuraOrderBy>> = {}

  for (const sort of sorts) {
    const direction: HasuraOrderBy = sort.direction === 'ASC' ? 'asc' : 'desc'
    orderBy[sort.field as keyof T] = direction
  }

  return orderBy
}

// ============================================================================
// Query Builder
// ============================================================================

/**
 * Build complete Hasura query arguments
 */
export function buildQueryArgs<T>(options: {
  pagination?: PaginationInput
  filters?: FilterCondition[]
  sorts?: SortInput[]
}): HasuraQueryArgs<T> {
  const args: HasuraQueryArgs<T> = {}

  if (options.pagination) {
    Object.assign(args, buildPaginationArgs(options.pagination))
  }

  if (options.filters && options.filters.length > 0) {
    args.where = buildWhereClause<T>(options.filters)
  }

  if (options.sorts && options.sorts.length > 0) {
    args.order_by = buildOrderByClause<T>(options.sorts)
  }

  return args
}

// ============================================================================
// GraphQL Helpers
// ============================================================================

/**
 * Extract operation name from GraphQL document
 */
export function extractOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/)
  return match ? match[1] : null
}

/**
 * Check if GraphQL document is a query
 */
export function isQuery(query: string): boolean {
  return /^\s*query\s/.test(query)
}

/**
 * Check if GraphQL document is a mutation
 */
export function isMutation(query: string): boolean {
  return /^\s*mutation\s/.test(query)
}

/**
 * Check if GraphQL document is a subscription
 */
export function isSubscription(query: string): boolean {
  return /^\s*subscription\s/.test(query)
}

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Transform Hasura aggregate response to simple count
 */
export function extractCount(aggregate: { aggregate?: { count?: number } }): number {
  return aggregate.aggregate?.count ?? 0
}

/**
 * Transform Hasura mutation response to affected rows count
 */
export function extractAffectedRows(response: { affected_rows?: number }): number {
  return response.affected_rows ?? 0
}

/**
 * Extract returning data from Hasura mutation response
 */
export function extractReturning<T>(response: { returning?: T[] }): T[] {
  return response.returning ?? []
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize user input for GraphQL queries
 */
export function sanitizeInput(input: string): string {
  // Escape special characters
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Truncate string to maximum length
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength - suffix.length) + suffix
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Format date for Hasura timestamptz
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * Parse Hasura timestamptz to Date
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

/**
 * Check if timestamp is in the past
 */
export function isPast(timestamp: string): boolean {
  return new Date(timestamp) < new Date()
}

/**
 * Check if timestamp is in the future
 */
export function isFuture(timestamp: string): boolean {
  return new Date(timestamp) > new Date()
}

// ============================================================================
// Array Helpers
// ============================================================================

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Deduplicate array by key
 */
export function deduplicateByKey<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}
