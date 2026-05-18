/**
 * Server-only Nhost Client
 *
 * Use this in API routes and server components. Uses NhostClient from @nhost/nextjs
 * (pinned at ^2.3.1) to ensure consistent types with the client-side nhost.ts and
 * avoid workspace-level @nhost/nhost-js v4 resolution that removes getSession().
 */

import { NhostClient } from '@nhost/nextjs'

// Create nhost client with proper configuration for self-hosted backend.
export const nhost = new NhostClient({
  // For self-hosted nhost, we use explicit URLs instead of subdomain
  authUrl: 'https://auth.localhost',
  graphqlUrl: 'https://hasura.localhost/v1/graphql',
  storageUrl: 'https://storage.localhost',
  functionsUrl: 'https://functions.localhost',

  // Development settings
  devTools: process.env.NODE_ENV === 'development',
  autoSignIn: false, // Don't auto sign in - let user control it
  autoRefreshToken: true, // Auto refresh tokens when expired
})
