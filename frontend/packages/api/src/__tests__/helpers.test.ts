/**
 * Tests for helper utilities
 */

import {
  buildPaginationArgs,
  buildPaginationParams,
  buildWhereClause,
  buildOrderByClause,
  buildQueryArgs,
  extractOperationName,
  isQuery,
  isMutation,
  isSubscription,
  extractCount,
  extractAffectedRows,
  extractReturning,
  isValidUUID,
  isValidEmail,
  sanitizeInput,
  truncate,
  formatTimestamp,
  parseTimestamp,
  isPast,
  isFuture,
  chunk,
  deduplicateByKey,
} from '../utils/helpers'
import type { PaginationInput, FilterCondition, SortInput } from '../types/api'

describe('Helper Utilities', () => {
  describe('buildPaginationArgs', () => {
    it('should build limit and offset from page/perPage', () => {
      const input: PaginationInput = { page: 3, perPage: 20 }
      const args = buildPaginationArgs(input)
      expect(args.limit).toBe(20)
      expect(args.offset).toBe(40) // (3-1) * 20
    })

    it('should handle first page', () => {
      const input: PaginationInput = { page: 1, perPage: 10 }
      const args = buildPaginationArgs(input)
      expect(args.offset).toBe(0)
    })

    it('should handle missing page', () => {
      const input: PaginationInput = { perPage: 10 }
      const args = buildPaginationArgs(input)
      expect(args.offset).toBeUndefined()
      expect(args.limit).toBe(10)
    })
  })

  describe('buildWhereClause', () => {
    it('should build equals condition', () => {
      const conditions: FilterCondition[] = [
        { field: 'status', operator: 'eq', value: 'active' },
      ]
      const where = buildWhereClause(conditions)
      expect(where._and).toHaveLength(1)
    })

    it('should build multiple conditions', () => {
      const conditions: FilterCondition[] = [
        { field: 'age', operator: 'gte', value: 18 },
        { field: 'age', operator: 'lte', value: 65 },
      ]
      const where = buildWhereClause(conditions)
      expect(where._and).toHaveLength(2)
    })

    it('should handle contains operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'test' },
      ]
      const where = buildWhereClause(conditions)
      expect(where._and).toHaveLength(1)
    })

    it('should handle in operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'status', operator: 'in', value: ['active', 'pending'] },
      ]
      const where = buildWhereClause(conditions)
      expect(where._and).toHaveLength(1)
    })

    it('should return empty object for no conditions', () => {
      const where = buildWhereClause([])
      expect(where).toEqual({})
    })
  })

  describe('buildOrderByClause', () => {
    it('should build ascending sort', () => {
      const sorts: SortInput[] = [{ field: 'created_at', direction: 'ASC' }]
      const orderBy = buildOrderByClause(sorts)
      expect(orderBy.created_at).toBe('asc')
    })

    it('should build descending sort', () => {
      const sorts: SortInput[] = [{ field: 'updated_at', direction: 'DESC' }]
      const orderBy = buildOrderByClause(sorts)
      expect(orderBy.updated_at).toBe('desc')
    })

    it('should handle multiple sorts', () => {
      const sorts: SortInput[] = [
        { field: 'priority', direction: 'DESC' },
        { field: 'name', direction: 'ASC' },
      ]
      const orderBy = buildOrderByClause(sorts)
      expect(orderBy.priority).toBe('desc')
      expect(orderBy.name).toBe('asc')
    })
  })

  describe('buildQueryArgs', () => {
    it('should build complete query args', () => {
      const args = buildQueryArgs({
        pagination: { page: 2, perPage: 10 },
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
        sorts: [{ field: 'created_at', direction: 'DESC' }],
      })

      expect(args.limit).toBe(10)
      expect(args.offset).toBe(10)
      expect(args.where).toBeDefined()
      expect(args.order_by).toBeDefined()
    })

    it('should handle partial options', () => {
      const args = buildQueryArgs({
        pagination: { page: 1, perPage: 20 },
      })

      expect(args.limit).toBe(20)
      expect(args.where).toBeUndefined()
      expect(args.order_by).toBeUndefined()
    })
  })

  describe('GraphQL operation detection', () => {
    describe('extractOperationName', () => {
      it('should extract query name', () => {
        const query = 'query GetUser($id: ID!) { user(id: $id) { name } }'
        expect(extractOperationName(query)).toBe('GetUser')
      })

      it('should extract mutation name', () => {
        const mutation = 'mutation CreateUser($input: UserInput!) { createUser(input: $input) { id } }'
        expect(extractOperationName(mutation)).toBe('CreateUser')
      })

      it('should extract subscription name', () => {
        const subscription = 'subscription OnMessage { messageAdded { id content } }'
        expect(extractOperationName(subscription)).toBe('OnMessage')
      })

      it('should return null for anonymous operation', () => {
        const query = 'query { users { name } }'
        expect(extractOperationName(query)).toBeNull()
      })
    })

    describe('isQuery', () => {
      it('should identify queries', () => {
        expect(isQuery('query GetUser { user { name } }')).toBe(true)
        expect(isQuery(' query GetUser { user { name } }')).toBe(true)
      })

      it('should not identify non-queries', () => {
        expect(isQuery('mutation CreateUser { ... }')).toBe(false)
        expect(isQuery('subscription OnMessage { ... }')).toBe(false)
      })
    })

    describe('isMutation', () => {
      it('should identify mutations', () => {
        expect(isMutation('mutation CreateUser { ... }')).toBe(true)
        expect(isMutation(' mutation CreateUser { ... }')).toBe(true)
      })

      it('should not identify non-mutations', () => {
        expect(isMutation('query GetUser { ... }')).toBe(false)
      })
    })

    describe('isSubscription', () => {
      it('should identify subscriptions', () => {
        expect(isSubscription('subscription OnMessage { ... }')).toBe(true)
        expect(isSubscription(' subscription OnMessage { ... }')).toBe(true)
      })

      it('should not identify non-subscriptions', () => {
        expect(isSubscription('query GetUser { ... }')).toBe(false)
      })
    })
  })

  describe('Data transformation', () => {
    describe('extractCount', () => {
      it('should extract count from aggregate', () => {
        expect(extractCount({ aggregate: { count: 42 } })).toBe(42)
      })

      it('should return 0 for undefined aggregate', () => {
        expect(extractCount({})).toBe(0)
        expect(extractCount({ aggregate: {} })).toBe(0)
      })
    })

    describe('extractAffectedRows', () => {
      it('should extract affected rows', () => {
        expect(extractAffectedRows({ affected_rows: 5 })).toBe(5)
      })

      it('should return 0 for undefined', () => {
        expect(extractAffectedRows({})).toBe(0)
      })
    })

    describe('extractReturning', () => {
      it('should extract returning array', () => {
        const data = [{ id: 1 }, { id: 2 }]
        expect(extractReturning({ returning: data })).toEqual(data)
      })

      it('should return empty array for undefined', () => {
        expect(extractReturning({})).toEqual([])
      })
    })
  })

  describe('Validation', () => {
    describe('isValidUUID', () => {
      it('should validate valid UUIDs', () => {
        expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      })

      it('should reject invalid UUIDs', () => {
        expect(isValidUUID('not-a-uuid')).toBe(false)
        expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false) // Wrong version
        expect(isValidUUID('')).toBe(false)
      })
    })

    describe('isValidEmail', () => {
      it('should validate valid emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true)
        expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
      })

      it('should reject invalid emails', () => {
        expect(isValidEmail('not-an-email')).toBe(false)
        expect(isValidEmail('@example.com')).toBe(false)
        expect(isValidEmail('test@')).toBe(false)
        expect(isValidEmail('')).toBe(false)
      })
    })

    describe('sanitizeInput', () => {
      it('should escape special characters', () => {
        expect(sanitizeInput('test"value')).toBe('test\\"value')
        expect(sanitizeInput("test'value")).toBe("test\\'value")
        expect(sanitizeInput('test\\value')).toBe('test\\\\value')
      })

      it('should escape newlines and tabs', () => {
        expect(sanitizeInput('line1\nline2')).toBe('line1\\nline2')
        expect(sanitizeInput('col1\tcol2')).toBe('col1\\tcol2')
        expect(sanitizeInput('line1\rline2')).toBe('line1\\rline2')
      })
    })

    describe('truncate', () => {
      it('should truncate long strings', () => {
        expect(truncate('This is a long string', 10)).toBe('This is...')
      })

      it('should not truncate short strings', () => {
        expect(truncate('Short', 10)).toBe('Short')
      })

      it('should use custom suffix', () => {
        expect(truncate('Long string', 8, '…')).toBe('Long st…')
      })
    })
  })

  describe('Date helpers', () => {
    describe('formatTimestamp', () => {
      it('should format date to ISO string', () => {
        const date = new Date('2024-01-01T12:00:00Z')
        expect(formatTimestamp(date)).toBe('2024-01-01T12:00:00.000Z')
      })
    })

    describe('parseTimestamp', () => {
      it('should parse ISO string to date', () => {
        const timestamp = '2024-01-01T12:00:00.000Z'
        const date = parseTimestamp(timestamp)
        expect(date.getTime()).toBe(new Date(timestamp).getTime())
      })
    })

    describe('isPast', () => {
      it('should detect past timestamps', () => {
        const past = new Date(Date.now() - 1000).toISOString()
        expect(isPast(past)).toBe(true)
      })

      it('should detect future timestamps', () => {
        const future = new Date(Date.now() + 1000).toISOString()
        expect(isPast(future)).toBe(false)
      })
    })

    describe('isFuture', () => {
      it('should detect future timestamps', () => {
        const future = new Date(Date.now() + 1000).toISOString()
        expect(isFuture(future)).toBe(true)
      })

      it('should detect past timestamps', () => {
        const past = new Date(Date.now() - 1000).toISOString()
        expect(isFuture(past)).toBe(false)
      })
    })
  })

  describe('Array helpers', () => {
    describe('chunk', () => {
      it('should chunk array into smaller arrays', () => {
        const array = [1, 2, 3, 4, 5, 6, 7]
        const chunks = chunk(array, 3)
        expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
      })

      it('should handle empty array', () => {
        expect(chunk([], 3)).toEqual([])
      })

      it('should handle size larger than array', () => {
        expect(chunk([1, 2], 5)).toEqual([[1, 2]])
      })
    })

    describe('deduplicateByKey', () => {
      it('should remove duplicates by key', () => {
        const array = [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 1, name: 'C' },
          { id: 3, name: 'D' },
        ]
        const deduped = deduplicateByKey(array, 'id')
        expect(deduped).toHaveLength(3)
        expect(deduped.map((x) => x.id)).toEqual([1, 2, 3])
      })

      it('should preserve first occurrence', () => {
        const array = [
          { id: 1, name: 'A' },
          { id: 1, name: 'B' },
        ]
        const deduped = deduplicateByKey(array, 'id')
        expect(deduped[0].name).toBe('A')
      })
    })
  })
})
