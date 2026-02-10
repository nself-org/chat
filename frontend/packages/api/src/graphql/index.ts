/**
 * @nself-chat/api - GraphQL Operations
 *
 * This module contains all GraphQL operations (queries, mutations, subscriptions)
 * for the nself-chat application.
 *
 * GraphQL files are organized by feature area:
 * - queries/ - GraphQL queries for fetching data
 * - mutations/ - GraphQL mutations for modifying data
 * - subscriptions/ - GraphQL subscriptions for real-time updates
 * - fragments/ - Reusable GraphQL fragments
 *
 * @packageDocumentation
 * @module @nself-chat/api/graphql
 */

/**
 * GraphQL operations are loaded dynamically via GraphQL Code Generator.
 * See codegen.yml for configuration.
 *
 * To generate TypeScript types from GraphQL operations:
 * ```bash
 * pnpm run codegen
 * ```
 *
 * This will generate:
 * - Type definitions for all operations
 * - React hooks for queries and mutations (if configured)
 * - TypeScript interfaces for all GraphQL types
 */

// Re-export generated types (when codegen is run)
// export * from './generated'

// For now, export placeholder
export const GRAPHQL_OPERATIONS_INFO = {
  queries: 14,
  mutations: 13,
  subscriptions: 3,
  fragments: 1,
  total: 31,
}
