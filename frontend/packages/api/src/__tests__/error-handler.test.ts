/**
 * Tests for error handling utilities
 */

import { ApolloError } from '@apollo/client'
import {
  transformGraphQLError,
  transformApolloError,
  getUserFriendlyMessage,
  isRetryableError,
  getRetryDelay,
  groupErrorsByType,
  getMostSevereError,
} from '../utils/error-handler'
import type { GraphQLError } from '../types/graphql'
import type { APIError } from '../types/api'

describe('Error Handler', () => {
  describe('transformGraphQLError', () => {
    it('should transform GraphQL error with Hasura code', () => {
      const graphqlError: GraphQLError = {
        message: 'Invalid JWT',
        extensions: {
          code: 'invalid-jwt',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.code).toBe('UNAUTHORIZED')
      expect(apiError.status).toBe(401)
      expect(apiError.message).toBe('Invalid JWT')
    })

    it('should transform GraphQL error with permission denied', () => {
      const graphqlError: GraphQLError = {
        message: 'Permission denied',
        extensions: {
          code: 'permission-denied',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.code).toBe('FORBIDDEN')
      expect(apiError.status).toBe(403)
    })

    it('should handle not found errors', () => {
      const graphqlError: GraphQLError = {
        message: 'Resource not found',
        extensions: {
          code: 'not-found',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.code).toBe('NOT_FOUND')
      expect(apiError.status).toBe(404)
    })

    it('should handle validation errors', () => {
      const graphqlError: GraphQLError = {
        message: 'Validation failed',
        extensions: {
          code: 'validation-failed',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.code).toBe('VALIDATION_ERROR')
      expect(apiError.status).toBe(422)
    })

    it('should handle unknown error codes', () => {
      const graphqlError: GraphQLError = {
        message: 'Unknown error',
        extensions: {
          code: 'unknown-code',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.code).toBe('UNKNOWN_ERROR')
      expect(apiError.status).toBe(500)
    })

    it('should mark server errors as retryable', () => {
      const graphqlError: GraphQLError = {
        message: 'Internal error',
        extensions: {
          code: 'unexpected',
          internal: {
            error: {
              message: 'Database error',
              status_code: 500,
            },
          },
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.retry.retryable).toBe(true)
    })

    it('should not mark client errors as retryable', () => {
      const graphqlError: GraphQLError = {
        message: 'Bad request',
        extensions: {
          code: 'parse-failed',
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.retry.retryable).toBe(false)
    })

    it('should include stack trace from extensions', () => {
      const graphqlError: GraphQLError = {
        message: 'Error with stack',
        extensions: {
          code: 'unexpected',
          exception: {
            stacktrace: ['line 1', 'line 2', 'line 3'],
          },
        },
      }

      const apiError = transformGraphQLError(graphqlError)
      expect(apiError.stack).toContain('line 1')
    })
  })

  describe('transformApolloError', () => {
    it('should transform network error', () => {
      const apolloError = new ApolloError({
        networkError: new Error('Network failed'),
      })

      const apiError = transformApolloError(apolloError)
      expect(apiError.code).toBe('NETWORK_ERROR')
      expect(apiError.status).toBe(503)
      expect(apiError.retry.retryable).toBe(true)
    })

    it('should transform GraphQL error', () => {
      const apolloError = new ApolloError({
        graphQLErrors: [
          {
            message: 'Unauthorized',
            extensions: {
              code: 'invalid-jwt',
            },
          },
        ],
      })

      const apiError = transformApolloError(apolloError)
      expect(apiError.code).toBe('UNAUTHORIZED')
      expect(apiError.status).toBe(401)
    })

    it('should handle generic Apollo error', () => {
      const apolloError = new ApolloError({
        errorMessage: 'Generic error',
      })

      const apiError = transformApolloError(apolloError)
      expect(apiError.code).toBe('UNKNOWN_ERROR')
      expect(apiError.status).toBe(500)
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for UNAUTHORIZED', () => {
      const error: APIError = {
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Token expired',
        retry: { retryable: false },
      }

      expect(getUserFriendlyMessage(error)).toBe('You need to sign in to continue.')
    })

    it('should return friendly message for FORBIDDEN', () => {
      const error: APIError = {
        code: 'FORBIDDEN',
        status: 403,
        message: 'Access denied',
        retry: { retryable: false },
      }

      expect(getUserFriendlyMessage(error)).toBe(
        "You don't have permission to perform this action."
      )
    })

    it('should return friendly message for NOT_FOUND', () => {
      const error: APIError = {
        code: 'NOT_FOUND',
        status: 404,
        message: 'Resource not found',
        retry: { retryable: false },
      }

      expect(getUserFriendlyMessage(error)).toBe('The requested resource was not found.')
    })

    it('should return friendly message for RATE_LIMIT_ERROR', () => {
      const error: APIError = {
        code: 'RATE_LIMIT_ERROR',
        status: 429,
        message: 'Too many requests',
        retry: { retryable: true, retryAfter: 60 },
      }

      expect(getUserFriendlyMessage(error)).toBe('Rate limit exceeded. Please slow down.')
    })

    it('should fall back to error message for unmapped codes', () => {
      const error: APIError = {
        code: 'UNKNOWN_ERROR',
        status: 500,
        message: 'Custom error message',
        retry: { retryable: false },
      }

      expect(getUserFriendlyMessage(error)).toBe('Custom error message')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error: APIError = {
        code: 'INTERNAL_ERROR',
        status: 500,
        message: 'Server error',
        retry: { retryable: true },
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const error: APIError = {
        code: 'BAD_REQUEST',
        status: 400,
        message: 'Invalid input',
        retry: { retryable: false },
      }

      expect(isRetryableError(error)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should return delay in milliseconds', () => {
      const error: APIError = {
        code: 'SERVICE_UNAVAILABLE',
        status: 503,
        message: 'Service unavailable',
        retry: { retryable: true, retryAfter: 5 },
      }

      expect(getRetryDelay(error)).toBe(5000)
    })

    it('should default to 5 seconds', () => {
      const error: APIError = {
        code: 'INTERNAL_ERROR',
        status: 500,
        message: 'Server error',
        retry: { retryable: true },
      }

      expect(getRetryDelay(error)).toBe(5000)
    })
  })

  describe('groupErrorsByType', () => {
    it('should group errors by code', () => {
      const errors: GraphQLError[] = [
        { message: 'Error 1', extensions: { code: 'invalid-jwt' } },
        { message: 'Error 2', extensions: { code: 'invalid-jwt' } },
        { message: 'Error 3', extensions: { code: 'not-found' } },
      ]

      const grouped = groupErrorsByType(errors)
      expect(grouped.UNAUTHORIZED).toHaveLength(2)
      expect(grouped.NOT_FOUND).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupErrorsByType([])
      expect(Object.keys(grouped)).toHaveLength(0)
    })
  })

  describe('getMostSevereError', () => {
    it('should return most severe error', () => {
      const errors: APIError[] = [
        {
          code: 'BAD_REQUEST',
          status: 400,
          message: 'Bad request',
          retry: { retryable: false },
        },
        {
          code: 'INTERNAL_ERROR',
          status: 500,
          message: 'Server error',
          retry: { retryable: true },
        },
        {
          code: 'NOT_FOUND',
          status: 404,
          message: 'Not found',
          retry: { retryable: false },
        },
      ]

      const mostSevere = getMostSevereError(errors)
      expect(mostSevere.code).toBe('INTERNAL_ERROR')
    })

    it('should handle single error', () => {
      const errors: APIError[] = [
        {
          code: 'NOT_FOUND',
          status: 404,
          message: 'Not found',
          retry: { retryable: false },
        },
      ]

      const mostSevere = getMostSevereError(errors)
      expect(mostSevere.code).toBe('NOT_FOUND')
    })

    it('should return UNKNOWN_ERROR for empty array', () => {
      const mostSevere = getMostSevereError([])
      expect(mostSevere.code).toBe('UNKNOWN_ERROR')
    })
  })
})
