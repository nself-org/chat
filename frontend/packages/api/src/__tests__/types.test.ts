/**
 * Tests for API type definitions and type guards
 */

import {
  isAPISuccess,
  isAPIError,
  createAPIError,
  buildPaginationParams,
  isGraphQLError,
  hasGraphQLErrors,
  isGraphQLSuccess,
} from '../types/api'
import type { APIResponse, APISuccessResponse, APIErrorResponse } from '../types/api'
import type { GraphQLResponse, GraphQLError } from '../types/graphql'

describe('API Type Guards', () => {
  describe('isAPISuccess', () => {
    it('should return true for successful response', () => {
      const response: APIResponse<string> = {
        success: true,
        data: 'test data',
      }
      expect(isAPISuccess(response)).toBe(true)
    })

    it('should return false for error response', () => {
      const response: APIResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          status: 400,
          message: 'Error',
          retry: { retryable: false },
        },
      }
      expect(isAPISuccess(response)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const response: APIResponse<string> = {
        success: true,
        data: 'test',
      }

      if (isAPISuccess(response)) {
        // Type should be narrowed to APISuccessResponse
        const data: string = response.data
        expect(data).toBe('test')
      }
    })
  })

  describe('isAPIError', () => {
    it('should return true for error response', () => {
      const response: APIResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          status: 500,
          message: 'Server error',
          retry: { retryable: true },
        },
      }
      expect(isAPIError(response)).toBe(true)
    })

    it('should return false for success response', () => {
      const response: APIResponse<number> = {
        success: true,
        data: 42,
      }
      expect(isAPIError(response)).toBe(false)
    })
  })

  describe('createAPIError', () => {
    it('should create error from status 400', () => {
      const error = createAPIError(400, 'Bad request', 'Invalid input')
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.status).toBe(400)
      expect(error.message).toBe('Bad request')
      expect(error.details).toBe('Invalid input')
    })

    it('should create error from status 401', () => {
      const error = createAPIError(401, 'Unauthorized')
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.status).toBe(401)
    })

    it('should mark retryable errors correctly', () => {
      const retryable = createAPIError(503, 'Service unavailable')
      expect(retryable.retry.retryable).toBe(true)

      const nonRetryable = createAPIError(400, 'Bad request')
      expect(nonRetryable.retry.retryable).toBe(false)
    })

    it('should set retry after for 429', () => {
      const error = createAPIError(429, 'Too many requests')
      expect(error.retry.retryAfter).toBe(60)
    })
  })

  describe('buildPaginationParams', () => {
    it('should build params from page and perPage', () => {
      const params = buildPaginationParams({ page: 2, perPage: 20 })
      expect(params.get('page')).toBe('2')
      expect(params.get('perPage')).toBe('20')
    })

    it('should build params from cursor', () => {
      const params = buildPaginationParams({
        cursor: 'abc123',
        cursorDirection: 'forward',
      })
      expect(params.get('cursor')).toBe('abc123')
      expect(params.get('cursorDirection')).toBe('forward')
    })

    it('should handle empty input', () => {
      const params = buildPaginationParams({})
      expect(params.toString()).toBe('')
    })
  })
})

describe('GraphQL Type Guards', () => {
  describe('isGraphQLError', () => {
    it('should return true for GraphQL error', () => {
      const error: GraphQLError = {
        message: 'Error message',
      }
      expect(isGraphQLError(error)).toBe(true)
    })

    it('should return false for non-error', () => {
      expect(isGraphQLError(null)).toBe(false)
      expect(isGraphQLError(undefined)).toBe(false)
      expect(isGraphQLError({})).toBe(false)
      expect(isGraphQLError({ foo: 'bar' })).toBe(false)
    })
  })

  describe('hasGraphQLErrors', () => {
    it('should return true when response has errors', () => {
      const response: GraphQLResponse = {
        errors: [{ message: 'Error' }],
      }
      expect(hasGraphQLErrors(response)).toBe(true)
    })

    it('should return false when response has no errors', () => {
      const response: GraphQLResponse = {
        data: { test: 'data' },
      }
      expect(hasGraphQLErrors(response)).toBe(false)
    })

    it('should return false when errors array is empty', () => {
      const response: GraphQLResponse = {
        data: { test: 'data' },
        errors: [],
      }
      expect(hasGraphQLErrors(response)).toBe(false)
    })
  })

  describe('isGraphQLSuccess', () => {
    it('should return true for successful response', () => {
      const response: GraphQLResponse<{ id: string }> = {
        data: { id: '123' },
      }
      expect(isGraphQLSuccess(response)).toBe(true)
    })

    it('should return false when data is missing', () => {
      const response: GraphQLResponse = {}
      expect(isGraphQLSuccess(response)).toBe(false)
    })

    it('should return false when response has errors', () => {
      const response: GraphQLResponse = {
        data: { id: '123' },
        errors: [{ message: 'Error' }],
      }
      expect(isGraphQLSuccess(response)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const response: GraphQLResponse<{ id: string }> = {
        data: { id: '123' },
      }

      if (isGraphQLSuccess(response)) {
        // Type should be narrowed
        const id: string = response.data.id
        expect(id).toBe('123')
      }
    })
  })
})

describe('API Type Definitions', () => {
  it('should have correct APIResponse structure', () => {
    const successResponse: APISuccessResponse<number> = {
      success: true,
      data: 42,
    }
    expect(successResponse.success).toBe(true)
    expect(successResponse.data).toBe(42)
  })

  it('should have correct APIErrorResponse structure', () => {
    const errorResponse: APIErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        status: 404,
        message: 'Resource not found',
        retry: { retryable: false },
      },
    }
    expect(errorResponse.success).toBe(false)
    expect(errorResponse.error.code).toBe('NOT_FOUND')
  })
})
