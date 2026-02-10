/**
 * Apollo Client Configuration for nself-chat
 *
 * Provides configured Apollo Client instances for:
 * - Client-side operations (queries, mutations, subscriptions)
 * - Server-side operations (API routes with admin access)
 *
 * Features:
 * - WebSocket support for subscriptions
 * - Automatic authentication token handling
 * - Error logging and handling
 * - Exponential backoff retry logic
 * - Cache configuration
 *
 * @packageDocumentation
 * @module @nself-chat/api/clients
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  from,
  type NormalizedCacheObject,
  type ApolloLink,
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient, type Client } from 'graphql-ws'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { logger } from '@nself-chat/core'

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * GraphQL HTTP endpoint URL
 */
const GRAPHQL_HTTP_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL ||
  'http://localhost:1337/v1/graphql'

/**
 * GraphQL WebSocket endpoint URL (for subscriptions)
 */
const GRAPHQL_WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || GRAPHQL_HTTP_URL.replace(/^http/, 'ws')

/**
 * Hasura admin secret for server-side operations
 */
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || ''

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Get authentication token from localStorage (client-side only)
 *
 * @returns {string | null} JWT token or null if not available
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

// ============================================================================
// Apollo Links
// ============================================================================

/**
 * HTTP link for queries and mutations
 */
const httpLink = createHttpLink({
  uri: GRAPHQL_HTTP_URL,
  credentials: 'include', // Include cookies for CORS
})

/**
 * Authentication link - adds JWT token to request headers
 */
const authLink = setContext((_, { headers }) => {
  const token = getAuthToken()

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

/**
 * Error handling link - logs GraphQL and network errors
 */
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      logger.error('[GraphQL Error]', {
        message,
        locations,
        path,
        code: extensions?.code,
        operation: operation.operationName,
      })
    })
  }

  if (networkError) {
    logger.error('[Network Error]', {
      message: networkError.message,
      operation: operation.operationName,
      // @ts-expect-error - statusCode may not exist on all NetworkError types
      statusCode: networkError.statusCode,
    })
  }
})

// ============================================================================
// WebSocket Client (Client-Side Only)
// ============================================================================

let wsClient: Client | null = null
let wsLink: GraphQLWsLink | null = null

if (typeof window !== 'undefined') {
  wsClient = createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => {
      const token = getAuthToken()
      return {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      }
    },
    // Reconnection configuration
    retryAttempts: 5,
    shouldRetry: () => true,
    retryWait: async (retryCount) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, retryCount), 16000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    },
    // Connection acknowledgment timeout
    connectionAckWaitTimeout: 10000,
    // Lazy connection - only connect when first subscription is made
    lazy: true,
    // Event handlers
    on: {
      connected: () => {
        logger.debug('[WebSocket] Connected')
      },
      closed: (event) => {
        logger.debug('[WebSocket] Closed', { code: event.code, reason: event.reason })
      },
      error: (error) => {
        logger.error('[WebSocket] Error', error)
      },
    },
  })

  wsLink = new GraphQLWsLink(wsClient)
}

/**
 * Split link - routes subscriptions to WebSocket, others to HTTP
 */
const splitLink: ApolloLink =
  wsLink !== null
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
          )
        },
        wsLink,
        from([errorLink, authLink, httpLink])
      )
    : from([errorLink, authLink, httpLink])

// ============================================================================
// Client-Side Apollo Client
// ============================================================================

/**
 * Apollo Client instance for client-side operations
 *
 * Features:
 * - HTTP queries/mutations via Hasura GraphQL
 * - WebSocket subscriptions for real-time updates
 * - JWT authentication
 * - In-memory caching with cache-first policy
 */
export const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Pagination field policies
          nchat_messages: {
            keyArgs: ['where', 'order_by'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming]
            },
          },
          nchat_channels: {
            keyArgs: ['where', 'order_by'],
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

/**
 * Close WebSocket connection
 *
 * Useful for:
 * - User logout
 * - Cleanup on app unmount
 */
export function closeWebSocketConnection(): void {
  if (wsClient) {
    wsClient.dispose()
    logger.debug('[WebSocket] Connection closed manually')
  }
}

/**
 * Reconnect WebSocket with fresh authentication token
 *
 * Useful for:
 * - User login
 * - Token refresh
 */
export function reconnectWebSocket(): void {
  if (wsClient) {
    wsClient.dispose()
    logger.debug('[WebSocket] Reconnecting with fresh token')
    // Next subscription will trigger a new connection with fresh token
  }
}

/**
 * Get the client-side Apollo Client instance
 *
 * @returns {ApolloClient<NormalizedCacheObject>} Apollo Client instance
 */
export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  return apolloClient
}

// ============================================================================
// Server-Side Apollo Client
// ============================================================================

let serverApolloClient: ApolloClient<NormalizedCacheObject> | null = null

/**
 * Get Apollo Client for server-side use
 *
 * Used in:
 * - Next.js API routes
 * - Server components
 * - Server-side rendering (SSR)
 *
 * Features:
 * - Uses Hasura admin secret for full access
 * - No WebSocket support (not needed server-side)
 * - No caching (fresh data on every request)
 *
 * @returns {ApolloClient<NormalizedCacheObject>} Server-side Apollo Client
 */
export function getServerApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (serverApolloClient) {
    return serverApolloClient
  }

  const serverHttpLink = createHttpLink({
    uri: GRAPHQL_HTTP_URL,
    credentials: 'include',
  })

  const serverAuthLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        ...(HASURA_ADMIN_SECRET ? { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET } : {}),
      },
    }
  })

  serverApolloClient = new ApolloClient({
    link: from([errorLink, serverAuthLink, serverHttpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    ssrMode: typeof window === 'undefined',
  })

  return serverApolloClient
}

/**
 * Reset server-side Apollo Client
 *
 * Forces recreation on next getServerApolloClient() call.
 * Useful for testing or when admin secret changes.
 */
export function resetServerApolloClient(): void {
  serverApolloClient = null
  logger.debug('[Apollo] Server client reset')
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear Apollo Client cache
 *
 * @param client - Apollo Client instance (defaults to main client)
 */
export async function clearCache(
  client: ApolloClient<NormalizedCacheObject> = apolloClient
): Promise<void> {
  await client.clearStore()
  logger.debug('[Apollo] Cache cleared')
}

/**
 * Reset Apollo Client (cache + links)
 *
 * @param client - Apollo Client instance (defaults to main client)
 */
export async function resetClient(
  client: ApolloClient<NormalizedCacheObject> = apolloClient
): Promise<void> {
  await client.resetStore()
  logger.debug('[Apollo] Client reset')
}

/**
 * Refetch active queries
 *
 * @param client - Apollo Client instance (defaults to main client)
 */
export async function refetchQueries(
  client: ApolloClient<NormalizedCacheObject> = apolloClient
): Promise<void> {
  await client.refetchQueries({ include: 'active' })
  logger.debug('[Apollo] Active queries refetched')
}
