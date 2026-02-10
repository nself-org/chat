/**
 * GraphQL Error Handling Utilities
 *
 * Provides helpers for handling and transforming GraphQL errors
 * into user-friendly error messages.
 *
 * @packageDocumentation
 * @module @nself-chat/api/utils
 */

import type { ApolloError } from '@apollo/client'
import type { GraphQLError, GraphQLErrorExtensions } from '../types/graphql'
import type { APIError, APIErrorCode } from '../types/api'

// ============================================================================
// Error Code Mappings
// ============================================================================

/**
 * Map Hasura error codes to API error codes
 */
const HASURA_ERROR_CODE_MAP: Record<string, APIErrorCode> = {
  // Authentication/Authorization
  'invalid-jwt': 'UNAUTHORIZED',
  'invalid-headers': 'UNAUTHORIZED',
  'access-denied': 'FORBIDDEN',
  'permission-denied': 'FORBIDDEN',

  // Validation
  'validation-failed': 'VALIDATION_ERROR',
  'constraint-violation': 'VALIDATION_ERROR',
  'parse-failed': 'BAD_REQUEST',
  'invalid-input': 'INVALID_INPUT',

  // Not found
  'not-found': 'NOT_FOUND',
  'not-exists': 'NOT_FOUND',

  // Conflicts
  'conflict': 'CONFLICT',
  'duplicate-key-value': 'DUPLICATE_ENTRY',

  // Server errors
  'unexpected': 'INTERNAL_ERROR',
  'postgres-error': 'INTERNAL_ERROR',
  'data-exception': 'INTERNAL_ERROR',
}

/**
 * Map HTTP status codes to API error codes
 */
const HTTP_STATUS_CODE_MAP: Record<number, APIErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  410: 'GONE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  501: 'NOT_IMPLEMENTED',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
}

// ============================================================================
// Error Transformation Functions
// ============================================================================

/**
 * Extract API error code from GraphQL error extensions
 */
function extractErrorCode(extensions?: GraphQLErrorExtensions): APIErrorCode {
  if (!extensions?.code) {
    return 'UNKNOWN_ERROR'
  }

  // Check Hasura error code mapping
  if (extensions.code in HASURA_ERROR_CODE_MAP) {
    return HASURA_ERROR_CODE_MAP[extensions.code]
  }

  // Check HTTP status code mapping
  if (extensions.internal?.error?.status_code) {
    const statusCode = extensions.internal.error.status_code
    if (statusCode in HTTP_STATUS_CODE_MAP) {
      return HTTP_STATUS_CODE_MAP[statusCode]
    }
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Extract HTTP status code from GraphQL error
 */
function extractStatusCode(error: GraphQLError): number {
  if (error.extensions?.internal?.error?.status_code) {
    return error.extensions.internal.error.status_code
  }

  // Map error codes to status codes
  const code = extractErrorCode(error.extensions)
  const statusCodeMap: Record<APIErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    GONE: 410,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    VALIDATION_ERROR: 422,
    AUTHENTICATION_ERROR: 401,
    AUTHORIZATION_ERROR: 403,
    RATE_LIMIT_ERROR: 429,
    RESOURCE_EXHAUSTED: 503,
    INVALID_INPUT: 400,
    DUPLICATE_ENTRY: 409,
    DEPENDENCY_ERROR: 500,
    NETWORK_ERROR: 503,
    TIMEOUT_ERROR: 504,
    UNKNOWN_ERROR: 500,
  }

  return statusCodeMap[code] || 500
}

/**
 * Transform GraphQL error to API error
 */
export function transformGraphQLError(error: GraphQLError): APIError {
  const code = extractErrorCode(error.extensions)
  const status = extractStatusCode(error)

  return {
    code,
    status,
    message: error.message,
    details: error.extensions?.internal?.error?.message,
    stack: error.extensions?.exception?.stacktrace?.join('\n'),
    retry: {
      retryable: [500, 502, 503, 504].includes(status),
      retryAfter: code === 'RATE_LIMIT_ERROR' ? 60 : undefined,
    },
  }
}

/**
 * Transform Apollo error to API error
 */
export function transformApolloError(error: ApolloError): APIError {
  // Network error
  if (error.networkError) {
    const networkError = error.networkError as Error & { statusCode?: number }
    return {
      code: 'NETWORK_ERROR',
      status: networkError.statusCode || 503,
      message: 'Network error occurred',
      details: networkError.message,
      retry: {
        retryable: true,
        retryAfter: 5,
      },
    }
  }

  // GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return transformGraphQLError(error.graphQLErrors[0])
  }

  // Generic error
  return {
    code: 'UNKNOWN_ERROR',
    status: 500,
    message: error.message,
    retry: {
      retryable: false,
    },
  }
}

// ============================================================================
// Error Message Helpers
// ============================================================================

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: APIError): string {
  const messages: Record<APIErrorCode, string> = {
    BAD_REQUEST: 'Invalid request. Please check your input.',
    UNAUTHORIZED: 'You need to sign in to continue.',
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: 'The requested resource was not found.',
    METHOD_NOT_ALLOWED: 'This action is not allowed.',
    CONFLICT: 'This resource already exists.',
    GONE: 'This resource is no longer available.',
    UNPROCESSABLE_ENTITY: 'Unable to process your request.',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    INTERNAL_ERROR: 'An unexpected error occurred.',
    NOT_IMPLEMENTED: 'This feature is not yet available.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
    GATEWAY_TIMEOUT: 'Request timed out. Please try again.',
    VALIDATION_ERROR: 'Validation failed. Please check your input.',
    AUTHENTICATION_ERROR: 'Authentication failed.',
    AUTHORIZATION_ERROR: 'Authorization failed.',
    RATE_LIMIT_ERROR: 'Rate limit exceeded. Please slow down.',
    RESOURCE_EXHAUSTED: 'Resource limit reached.',
    INVALID_INPUT: 'Invalid input provided.',
    DUPLICATE_ENTRY: 'This entry already exists.',
    DEPENDENCY_ERROR: 'A dependency error occurred.',
    NETWORK_ERROR: 'Network connection error.',
    TIMEOUT_ERROR: 'Request timed out.',
    UNKNOWN_ERROR: 'An unknown error occurred.',
  }

  return messages[error.code] || error.message
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: APIError): boolean {
  return error.retry?.retryable || false
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: APIError): number {
  const retryAfter = error.retry?.retryAfter || 5
  return retryAfter * 1000
}

// ============================================================================
// Error Grouping
// ============================================================================

/**
 * Group multiple GraphQL errors by type
 */
export function groupErrorsByType(errors: GraphQLError[]): Record<APIErrorCode, GraphQLError[]> {
  const grouped: Partial<Record<APIErrorCode, GraphQLError[]>> = {}

  for (const error of errors) {
    const code = extractErrorCode(error.extensions)
    if (!grouped[code]) {
      grouped[code] = []
    }
    grouped[code]!.push(error)
  }

  return grouped as Record<APIErrorCode, GraphQLError[]>
}

/**
 * Get most severe error from a list
 */
export function getMostSevereError(errors: APIError[]): APIError {
  if (errors.length === 0) {
    return {
      code: 'UNKNOWN_ERROR',
      status: 500,
      message: 'Unknown error',
      retry: { retryable: false },
    }
  }

  // Prioritize by severity
  const severity: Record<APIErrorCode, number> = {
    INTERNAL_ERROR: 10,
    SERVICE_UNAVAILABLE: 9,
    GATEWAY_TIMEOUT: 8,
    NETWORK_ERROR: 7,
    TIMEOUT_ERROR: 6,
    UNAUTHORIZED: 5,
    FORBIDDEN: 4,
    NOT_FOUND: 3,
    VALIDATION_ERROR: 2,
    BAD_REQUEST: 1,
    METHOD_NOT_ALLOWED: 1,
    CONFLICT: 1,
    GONE: 1,
    UNPROCESSABLE_ENTITY: 1,
    TOO_MANY_REQUESTS: 1,
    NOT_IMPLEMENTED: 1,
    AUTHENTICATION_ERROR: 5,
    AUTHORIZATION_ERROR: 4,
    RATE_LIMIT_ERROR: 1,
    RESOURCE_EXHAUSTED: 1,
    INVALID_INPUT: 2,
    DUPLICATE_ENTRY: 1,
    DEPENDENCY_ERROR: 10,
    UNKNOWN_ERROR: 10,
  }

  return errors.reduce((mostSevere, current) => {
    const currentSeverity = severity[current.code] || 0
    const mostSevereSeverity = severity[mostSevere.code] || 0
    return currentSeverity > mostSevereSeverity ? current : mostSevere
  }, errors[0])
}
