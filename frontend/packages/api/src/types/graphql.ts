/**
 * GraphQL-specific types for nself-chat
 *
 * Type definitions for GraphQL operations, responses, and helpers.
 *
 * @packageDocumentation
 * @module @nself-chat/api/types
 */

import type { DocumentNode } from 'graphql'

// ============================================================================
// GraphQL Operation Types
// ============================================================================

/**
 * GraphQL operation type
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription'

/**
 * GraphQL operation definition
 */
export interface GraphQLOperation<TVariables = Record<string, unknown>, TData = unknown> {
  /** Operation type */
  type: GraphQLOperationType
  /** GraphQL document (query/mutation/subscription) */
  document: DocumentNode
  /** Operation name */
  operationName: string
  /** Variables type marker */
  _variables?: TVariables
  /** Data type marker */
  _data?: TData
}

/**
 * GraphQL query definition
 */
export interface GraphQLQuery<TVariables = Record<string, unknown>, TData = unknown>
  extends GraphQLOperation<TVariables, TData> {
  type: 'query'
}

/**
 * GraphQL mutation definition
 */
export interface GraphQLMutation<TVariables = Record<string, unknown>, TData = unknown>
  extends GraphQLOperation<TVariables, TData> {
  type: 'mutation'
}

/**
 * GraphQL subscription definition
 */
export interface GraphQLSubscription<TVariables = Record<string, unknown>, TData = unknown>
  extends GraphQLOperation<TVariables, TData> {
  type: 'subscription'
}

// ============================================================================
// GraphQL Response Types
// ============================================================================

/**
 * GraphQL response structure
 */
export interface GraphQLResponse<TData = unknown> {
  /** Response data (if successful) */
  data?: TData
  /** GraphQL errors (if any) */
  errors?: GraphQLError[]
  /** Response extensions */
  extensions?: Record<string, unknown>
}

/**
 * GraphQL error structure
 */
export interface GraphQLError {
  /** Error message */
  message: string
  /** Error locations in query */
  locations?: GraphQLErrorLocation[]
  /** Path to field that caused error */
  path?: (string | number)[]
  /** Error extensions (Hasura-specific fields) */
  extensions?: GraphQLErrorExtensions
}

/**
 * GraphQL error location
 */
export interface GraphQLErrorLocation {
  /** Line number in query */
  line: number
  /** Column number in query */
  column: number
}

/**
 * GraphQL error extensions (Hasura-specific)
 */
export interface GraphQLErrorExtensions {
  /** Error code */
  code: string
  /** Path to field */
  path?: string
  /** Internal error details */
  internal?: {
    error: {
      message: string
      status_code: number
    }
  }
  /** Exception details */
  exception?: {
    stacktrace?: string[]
  }
  [key: string]: unknown
}

// ============================================================================
// Hasura Types
// ============================================================================

/**
 * Hasura order by direction
 */
export type HasuraOrderBy = 'asc' | 'desc' | 'asc_nulls_first' | 'asc_nulls_last' | 'desc_nulls_first' | 'desc_nulls_last'

/**
 * Hasura boolean expression operators
 */
export interface HasuraBoolExp<T> {
  _and?: HasuraBoolExp<T>[]
  _or?: HasuraBoolExp<T>[]
  _not?: HasuraBoolExp<T>
  [key: string]: unknown
}

/**
 * Hasura comparison operators
 */
export interface HasuraComparisonExp<T> {
  _eq?: T
  _neq?: T
  _gt?: T
  _gte?: T
  _lt?: T
  _lte?: T
  _in?: T[]
  _nin?: T[]
  _is_null?: boolean
  _like?: string
  _ilike?: string
  _similar?: string
  _regex?: string
  _iregex?: string
}

/**
 * Hasura aggregate fields
 */
export interface HasuraAggregateFields {
  count?: number
}

/**
 * Hasura aggregate response
 */
export interface HasuraAggregate<T = unknown> {
  aggregate?: HasuraAggregateFields & T
  nodes?: unknown[]
}

/**
 * Hasura mutation response
 */
export interface HasuraMutationResponse<T = unknown> {
  /** Number of rows affected */
  affected_rows: number
  /** Returning rows */
  returning: T[]
}

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * GraphQL subscription observer
 */
export interface GraphQLSubscriptionObserver<TData = unknown> {
  /** Called when new data is received */
  next: (value: TData) => void
  /** Called when an error occurs */
  error?: (error: Error) => void
  /** Called when subscription completes */
  complete?: () => void
}

/**
 * GraphQL subscription handle
 */
export interface GraphQLSubscriptionHandle {
  /** Unsubscribe from subscription */
  unsubscribe: () => void
  /** Whether subscription is closed */
  closed: boolean
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Reconnect on error */
  reconnect?: boolean
  /** Reconnect attempts */
  reconnectAttempts?: number
  /** Reconnect interval in ms */
  reconnectInterval?: number
  /** Connection timeout in ms */
  connectionTimeout?: number
}

// ============================================================================
// Pagination Types (Hasura-style)
// ============================================================================

/**
 * Hasura pagination arguments
 */
export interface HasuraPaginationArgs {
  /** Limit number of results */
  limit?: number
  /** Offset from start */
  offset?: number
}

/**
 * Hasura order by arguments
 */
export interface HasuraOrderByArgs<T = unknown> {
  order_by?: Partial<Record<keyof T, HasuraOrderBy>>
}

/**
 * Hasura where arguments
 */
export interface HasuraWhereArgs<T = unknown> {
  where?: HasuraBoolExp<T>
}

/**
 * Combined Hasura query arguments
 */
export interface HasuraQueryArgs<T = unknown>
  extends HasuraPaginationArgs,
    HasuraOrderByArgs<T>,
    HasuraWhereArgs<T> {}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract variables type from GraphQL operation
 */
export type ExtractVariables<T> = T extends GraphQLOperation<infer V, unknown> ? V : never

/**
 * Extract data type from GraphQL operation
 */
export type ExtractData<T> = T extends GraphQLOperation<unknown, infer D> ? D : never

/**
 * Extract data type from GraphQL response
 */
export type ExtractResponseData<T> = T extends GraphQLResponse<infer D> ? D : never

/**
 * Type guard for GraphQL error
 */
export function isGraphQLError(error: unknown): error is GraphQLError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as GraphQLError).message === 'string'
  )
}

/**
 * Type guard for GraphQL response with errors
 */
export function hasGraphQLErrors<T>(
  response: GraphQLResponse<T>
): response is GraphQLResponse<T> & { errors: GraphQLError[] } {
  return Array.isArray(response.errors) && response.errors.length > 0
}

/**
 * Type guard for successful GraphQL response
 */
export function isGraphQLSuccess<T>(
  response: GraphQLResponse<T>
): response is GraphQLResponse<T> & { data: T } {
  return response.data !== undefined && response.data !== null && !hasGraphQLErrors(response)
}
