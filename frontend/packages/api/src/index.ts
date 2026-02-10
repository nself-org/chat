/**
 * @nself-chat/api - Typed API clients and GraphQL contracts
 *
 * This package provides the complete API layer for communicating with the
 * nself backend (Hasura GraphQL + Auth + Storage).
 *
 * Features:
 * - Apollo Client configuration with WebSocket support
 * - Comprehensive type definitions for API operations
 * - GraphQL queries, mutations, and subscriptions
 * - Error handling and retry logic
 * - Pagination, filtering, and sorting helpers
 *
 * @packageDocumentation
 * @module @nself-chat/api
 */

// Package metadata
export const PACKAGE_VERSION = '0.9.2'
export const PACKAGE_NAME = '@nself-chat/api'

// ============================================================================
// Clients
// ============================================================================

export {
  // Apollo Client instances
  apolloClient,
  getApolloClient,
  getServerApolloClient,
  resetServerApolloClient,
  // WebSocket utilities
  closeWebSocketConnection,
  reconnectWebSocket,
  // Cache utilities
  clearCache,
  resetClient,
  refetchQueries,
} from './clients/apollo'

// ============================================================================
// Types
// ============================================================================

export type {
  // API Response types
  APIResponse,
  APISuccessResponse,
  APIErrorResponse,
  APIResponseMeta,
  // API Error types
  APIError,
  APIErrorCode,
  APIFieldError,
  // Pagination types
  PaginationInput,
  PaginationMeta,
  PaginatedResponse,
  CursorPaginationInfo,
  Connection,
  Edge,
  // Filter and Sort types
  SortInput,
  FilterOperator,
  FilterCondition,
  FilterGroup,
  // GraphQL types
  GraphQLRequest,
  GraphQLResponse,
  GraphQLError,
  GraphQLErrorLocation,
  GraphQLOperationType,
  // Request/Response types
  RequestHeaders,
  RequestOptions,
  RetryOptions,
  // Rate limiting types
  RateLimitInfo,
  // API Client types
  APIClientConfig,
  APIEndpoint,
  // Utility types
  DeepPartial,
  ExtractAPIData,
  ExtractPaginatedItem,
} from './types/api'

export type {
  // GraphQL operation types
  GraphQLOperation,
  GraphQLQuery,
  GraphQLMutation,
  GraphQLSubscription,
  // GraphQL subscription types
  GraphQLSubscriptionObserver,
  GraphQLSubscriptionHandle,
  SubscriptionOptions,
  // Hasura types
  HasuraOrderBy,
  HasuraBoolExp,
  HasuraComparisonExp,
  HasuraAggregateFields,
  HasuraAggregate,
  HasuraMutationResponse,
  HasuraPaginationArgs,
  HasuraOrderByArgs,
  HasuraWhereArgs,
  HasuraQueryArgs,
  // GraphQL error types (detailed)
  GraphQLErrorExtensions,
  // Utility types
  ExtractVariables,
  ExtractData,
  ExtractResponseData,
} from './types/graphql'

// ============================================================================
// Type Guards
// ============================================================================

export {
  // API type guards
  isAPISuccess,
  isAPIError,
  // GraphQL type guards
  isGraphQLError,
  hasGraphQLErrors,
  isGraphQLSuccess,
} from './types'

// ============================================================================
// Error Handling
// ============================================================================

export {
  // Error transformation
  transformGraphQLError,
  transformApolloError,
  // Error helpers
  getUserFriendlyMessage,
  isRetryableError,
  getRetryDelay,
  // Error grouping
  groupErrorsByType,
  getMostSevereError,
} from './utils/error-handler'

// ============================================================================
// Retry Logic
// ============================================================================

export {
  // Retry configuration
  DEFAULT_RETRY_OPTIONS,
  // Retry functions
  calculateRetryDelay,
  wait,
  retryWithBackoff,
  // Retry decorator
  Retry,
  // Retry queue
  RetryQueue,
  defaultRetryQueue,
} from './utils/retry'

// ============================================================================
// Helper Utilities
// ============================================================================

export {
  // Pagination helpers
  buildPaginationArgs,
  buildPaginationParams,
  // Filter helpers
  buildWhereClause,
  // Sort helpers
  buildOrderByClause,
  // Query builder
  buildQueryArgs,
  // GraphQL helpers
  extractOperationName,
  isQuery,
  isMutation,
  isSubscription,
  // Data transformation
  extractCount,
  extractAffectedRows,
  extractReturning,
  // Validation
  isValidUUID,
  isValidEmail,
  sanitizeInput,
  truncate,
  // Date helpers
  formatTimestamp,
  parseTimestamp,
  isPast,
  isFuture,
  // Array helpers
  chunk,
  deduplicateByKey,
} from './utils/helpers'

// ============================================================================
// GraphQL Operations
// ============================================================================

export { GRAPHQL_OPERATIONS_INFO } from './graphql'

// ============================================================================
// Constants
// ============================================================================

export { HTTPStatusToErrorCode, RateLimitHeaders, DefaultRetryOptions } from './types/api'
