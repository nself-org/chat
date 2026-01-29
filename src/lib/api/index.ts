/**
 * API Utilities
 *
 * Centralized exports for API middleware and response helpers.
 *
 * @example
 * ```typescript
 * import {
 *   // Response helpers
 *   successResponse,
 *   errorResponse,
 *   paginatedResponse,
 *   notFoundResponse,
 *   unauthorizedResponse,
 *   // Middleware
 *   withAuth,
 *   withRateLimit,
 *   withErrorHandler,
 *   compose,
 *   // Types
 *   type AuthenticatedUser,
 *   type AuthenticatedRequest,
 *   type ApiResponse,
 * } from '@/lib/api'
 * ```
 */

// Response helpers
export {
  // Types
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type PaginationMeta,
  type PaginatedApiResponse,
  // Success responses
  successResponse,
  createdResponse,
  noContentResponse,
  cachedResponse,
  noCacheResponse,
  paginatedResponse,
  redirectResponse,
  // Error responses
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  methodNotAllowedResponse,
  conflictResponse,
  validationErrorResponse,
  rateLimitResponse,
  internalErrorResponse,
  serviceUnavailableResponse,
} from './response'

// Middleware
export {
  // Types
  type AuthenticatedUser,
  type AuthenticatedRequest,
  type RouteContext,
  type ApiHandler,
  type Middleware,
  type RateLimitOptions,
  type LogEntry,
  // Authentication
  getAuthenticatedUser,
  withAuth,
  withOptionalAuth,
  withRole,
  withAdmin,
  // Rate limiting
  checkRateLimit,
  withRateLimit,
  getClientIp,
  // Error handling
  withErrorHandler,
  ApiError,
  ValidationError,
  // Logging
  withLogging,
  // CORS
  withCors,
  // Composition
  compose,
  // Request helpers
  validateBody,
  getQueryParams,
} from './middleware'
