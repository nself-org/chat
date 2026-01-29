/**
 * Next.js Middleware
 *
 * Handles authentication and authorization at the edge.
 * This middleware runs before page rendering for protected routes.
 *
 * NOTE: This middleware provides basic route protection. Client-side guards
 * (AuthGuard, RoleGuard, SetupGuard) provide more granular control and
 * better UX with loading states.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/callback',
]

/**
 * Development-only routes (blocked in production)
 */
const DEV_ONLY_ROUTES = [
  '/dev',
]

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/chat',
  '/settings',
  '/admin',
  '/setup',
]

/**
 * Routes that require admin role
 */
const ADMIN_ROUTES = [
  '/admin',
]

/**
 * API routes that should bypass middleware
 */
const API_ROUTES = [
  '/api',
]

/**
 * Static assets and Next.js internal routes
 */
const IGNORED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

/**
 * Check if path matches any pattern in the list
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1))
    }
    return pathname === pattern || pathname.startsWith(`${pattern}/`)
  })
}

/**
 * Check if path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return matchesPath(pathname, PUBLIC_ROUTES)
}

/**
 * Check if path is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return matchesPath(pathname, PROTECTED_ROUTES)
}

/**
 * Check if path is an admin route
 */
function isAdminRoute(pathname: string): boolean {
  return matchesPath(pathname, ADMIN_ROUTES)
}

/**
 * Check if path should be ignored by middleware
 */
function shouldIgnore(pathname: string): boolean {
  return matchesPath(pathname, IGNORED_PATHS) || matchesPath(pathname, API_ROUTES)
}

/**
 * Check if path is a development-only route
 */
function isDevOnlyRoute(pathname: string): boolean {
  return matchesPath(pathname, DEV_ONLY_ROUTES)
}

/**
 * Get session token from cookies
 */
function getSessionToken(request: NextRequest): string | null {
  // Check for session cookie (name from auth.config.ts)
  const sessionCookie = request.cookies.get('nchat-session')
  if (sessionCookie?.value) {
    return sessionCookie.value
  }

  // Also check for Nhost session (for production auth)
  const nhostSession = request.cookies.get('nhostSession')
  if (nhostSession?.value) {
    return nhostSession.value
  }

  // Check for dev auth session
  const devSession = request.cookies.get('nchat-dev-session')
  if (devSession?.value) {
    return devSession.value
  }

  return null
}

/**
 * Parse session to get user info
 * NOTE: In production, you'd verify the JWT here
 */
function parseSession(token: string): { userId: string; role: string } | null {
  try {
    // For dev auth, session might be a simple JSON
    const parsed = JSON.parse(token)
    if (parsed.userId && parsed.role) {
      return { userId: parsed.userId, role: parsed.role }
    }

    // For JWT tokens, decode and verify
    // NOTE: Full JWT verification should happen server-side
    // Middleware just does basic checks
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      if (payload.sub || payload.userId) {
        return {
          userId: payload.sub || payload.userId,
          role: payload['x-hasura-default-role'] || payload.role || 'member',
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Check if user has admin role
 */
function isAdminRole(role: string): boolean {
  return ['owner', 'admin'].includes(role)
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for ignored paths
  if (shouldIgnore(pathname)) {
    return NextResponse.next()
  }

  // In development mode with dev auth enabled, be more permissive
  // Client-side guards will handle the actual protection
  const isDev = process.env.NODE_ENV === 'development'
  const useDevAuth = process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true'

  // Block /dev/* routes in production
  // These are developer documentation pages that should not be exposed
  if (isDevOnlyRoute(pathname) && !isDev) {
    // Return 404 in production for dev routes
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  if (isDev && useDevAuth) {
    // In dev mode, let client-side guards handle everything
    // This allows the auto-login feature to work properly
    return NextResponse.next()
  }

  // Get session
  const sessionToken = getSessionToken(request)
  const session = sessionToken ? parseSession(sessionToken) : null
  const isAuthenticated = !!session

  // Handle public routes (login, signup)
  if (isPublicRoute(pathname)) {
    // If authenticated and trying to access login/signup, redirect to chat
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup' ||
        pathname === '/auth/signin' || pathname === '/auth/signup')) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin routes
    if (isAdminRoute(pathname) && session) {
      if (!isAdminRole(session.role)) {
        // Not authorized for admin routes - redirect to chat with error
        const chatUrl = new URL('/chat', request.url)
        chatUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(chatUrl)
      }
    }

    // User is authenticated and authorized
    return NextResponse.next()
  }

  // For all other routes, proceed
  return NextResponse.next()
}

/**
 * Configure which routes middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
