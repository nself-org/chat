/**
 * Deep Linking Handler for Capacitor
 *
 * Handles URL schemes, Universal Links (iOS), and App Links (Android).
 * Provides routing and parameter extraction for incoming deep links.
 */

import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Capacitor, PluginListenerHandle } from '@capacitor/core'

// =============================================================================
// Types
// =============================================================================

export type DeepLinkRoute =
  | 'channel'
  | 'direct_message'
  | 'user_profile'
  | 'thread'
  | 'invite'
  | 'settings'
  | 'search'
  | 'call'
  | 'notification'
  | 'oauth_callback'
  | 'unknown'

export interface DeepLinkParams {
  /** Original URL */
  url: string
  /** Parsed route type */
  route: DeepLinkRoute
  /** Extracted parameters */
  params: Record<string, string>
  /** Query string parameters */
  query: Record<string, string>
  /** Path segments */
  pathSegments: string[]
  /** Fragment identifier */
  fragment?: string
  /** Whether this is an external deep link */
  isExternal: boolean
}

export interface DeepLinkRouteConfig {
  /** Route pattern (e.g., '/channel/:channelId') */
  pattern: string
  /** Route type */
  route: DeepLinkRoute
  /** Parameter names extracted from pattern */
  paramNames: string[]
  /** Handler function */
  handler?: (params: DeepLinkParams) => void | Promise<void>
}

export interface DeepLinkHandlerOptions {
  /** URL scheme (e.g., 'nchat') */
  urlScheme: string
  /** Universal Link domains */
  universalLinkDomains: string[]
  /** Default route when no match */
  defaultRoute: DeepLinkRoute
  /** Enable debug logging */
  debug?: boolean
}

// =============================================================================
// Deep Link Route Definitions
// =============================================================================

const DEFAULT_ROUTES: DeepLinkRouteConfig[] = [
  {
    pattern: '/channel/:channelId',
    route: 'channel',
    paramNames: ['channelId'],
  },
  {
    pattern: '/channel/:channelId/thread/:threadId',
    route: 'thread',
    paramNames: ['channelId', 'threadId'],
  },
  {
    pattern: '/dm/:userId',
    route: 'direct_message',
    paramNames: ['userId'],
  },
  {
    pattern: '/user/:userId',
    route: 'user_profile',
    paramNames: ['userId'],
  },
  {
    pattern: '/invite/:inviteCode',
    route: 'invite',
    paramNames: ['inviteCode'],
  },
  {
    pattern: '/settings',
    route: 'settings',
    paramNames: [],
  },
  {
    pattern: '/settings/:section',
    route: 'settings',
    paramNames: ['section'],
  },
  {
    pattern: '/search',
    route: 'search',
    paramNames: [],
  },
  {
    pattern: '/call/:callId',
    route: 'call',
    paramNames: ['callId'],
  },
  {
    pattern: '/notification/:notificationId',
    route: 'notification',
    paramNames: ['notificationId'],
  },
  {
    pattern: '/auth/callback/:provider',
    route: 'oauth_callback',
    paramNames: ['provider'],
  },
  {
    pattern: '/oauth/:provider/callback',
    route: 'oauth_callback',
    paramNames: ['provider'],
  },
]

// =============================================================================
// Deep Link Service
// =============================================================================

class DeepLinkService {
  private initialized = false
  private options: DeepLinkHandlerOptions = {
    urlScheme: 'nchat',
    universalLinkDomains: ['nchat.nself.org', 'app.nchat.io'],
    defaultRoute: 'unknown',
    debug: false,
  }
  private routes: DeepLinkRouteConfig[] = [...DEFAULT_ROUTES]
  private listeners: PluginListenerHandle[] = []
  private globalHandler?: (params: DeepLinkParams) => void | Promise<void>
  private pendingDeepLink: DeepLinkParams | null = null

  /**
   * Initialize deep link handling
   */
  async initialize(options?: Partial<DeepLinkHandlerOptions>): Promise<void> {
    if (this.initialized) return

    if (options) {
      this.options = { ...this.options, ...options }
    }

    try {
      // Set up app URL open listener
      const listener = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.handleDeepLink(event.url)
      })
      this.listeners.push(listener)

      // Check for initial URL (app launched via deep link)
      await this.checkInitialUrl()

      this.initialized = true
      this.log('Deep link service initialized', this.options)
    } catch (error) {
      console.error('Failed to initialize deep link service:', error)
    }
  }

  /**
   * Check for initial URL when app launches
   */
  private async checkInitialUrl(): Promise<void> {
    try {
      const { url } = (await App.getLaunchUrl()) ?? { url: null }
      if (url) {
        this.log('App launched with URL:', url)
        await this.handleDeepLink(url)
      }
    } catch (error) {
      this.log('No launch URL or error:', error)
    }
  }

  /**
   * Handle incoming deep link
   */
  async handleDeepLink(url: string): Promise<DeepLinkParams> {
    this.log('Handling deep link:', url)

    const params = this.parseDeepLink(url)
    this.log('Parsed deep link:', params)

    // Find matching route handler
    const matchedRoute = this.routes.find((route) => route.route === params.route)

    // Call route-specific handler if defined
    if (matchedRoute?.handler) {
      try {
        await matchedRoute.handler(params)
      } catch (error) {
        console.error('Deep link route handler error:', error)
      }
    }

    // Call global handler
    if (this.globalHandler) {
      try {
        await this.globalHandler(params)
      } catch (error) {
        console.error('Deep link global handler error:', error)
      }
    }

    // Store as pending if no handlers
    if (!matchedRoute?.handler && !this.globalHandler) {
      this.pendingDeepLink = params
    }

    return params
  }

  /**
   * Parse deep link URL
   */
  parseDeepLink(url: string): DeepLinkParams {
    try {
      // Handle custom URL schemes
      let normalizedUrl = url
      if (url.startsWith(`${this.options.urlScheme}://`)) {
        // Convert custom scheme to https for parsing
        normalizedUrl = url.replace(`${this.options.urlScheme}://`, 'https://placeholder/')
      }

      const parsedUrl = new URL(normalizedUrl)
      const pathname = parsedUrl.pathname
      const pathSegments = pathname.split('/').filter(Boolean)

      // Parse query parameters
      const query: Record<string, string> = {}
      parsedUrl.searchParams.forEach((value, key) => {
        query[key] = value
      })

      // Determine if external
      const isExternal = this.isExternalLink(url)

      // Match against routes
      const { route, params } = this.matchRoute(pathname)

      return {
        url,
        route,
        params,
        query,
        pathSegments,
        fragment: parsedUrl.hash ? parsedUrl.hash.substring(1) : undefined,
        isExternal,
      }
    } catch (error) {
      this.log('Error parsing deep link:', error)
      return {
        url,
        route: 'unknown',
        params: {},
        query: {},
        pathSegments: [],
        isExternal: false,
      }
    }
  }

  /**
   * Match URL path against registered routes
   */
  private matchRoute(pathname: string): { route: DeepLinkRoute; params: Record<string, string> } {
    for (const routeConfig of this.routes) {
      const match = this.matchPattern(pathname, routeConfig.pattern)
      if (match) {
        return {
          route: routeConfig.route,
          params: match,
        }
      }
    }

    return {
      route: this.options.defaultRoute,
      params: {},
    }
  }

  /**
   * Match path against pattern and extract parameters
   */
  private matchPattern(pathname: string, pattern: string): Record<string, string> | null {
    const pathParts = pathname.split('/').filter(Boolean)
    const patternParts = pattern.split('/').filter(Boolean)

    if (pathParts.length !== patternParts.length) {
      return null
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart.startsWith(':')) {
        // This is a parameter
        const paramName = patternPart.substring(1)
        params[paramName] = decodeURIComponent(pathPart)
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null
      }
    }

    return params
  }

  /**
   * Check if URL is an external link (Universal Links/App Links)
   */
  private isExternalLink(url: string): boolean {
    try {
      const parsed = new URL(url)
      return (
        parsed.protocol === 'https:' && this.options.universalLinkDomains.includes(parsed.hostname)
      )
    } catch {
      return false
    }
  }

  /**
   * Register global handler for all deep links
   */
  setGlobalHandler(handler: (params: DeepLinkParams) => void | Promise<void>): void {
    this.globalHandler = handler

    // Handle pending deep link if exists
    if (this.pendingDeepLink) {
      handler(this.pendingDeepLink)
      this.pendingDeepLink = null
    }
  }

  /**
   * Register handler for specific route
   */
  registerRouteHandler(
    route: DeepLinkRoute,
    handler: (params: DeepLinkParams) => void | Promise<void>
  ): void {
    const routeConfig = this.routes.find((r) => r.route === route)
    if (routeConfig) {
      routeConfig.handler = handler
    } else {
      console.warn(`Route ${route} not found`)
    }
  }

  /**
   * Add custom route
   */
  addRoute(config: DeepLinkRouteConfig): void {
    // Remove existing route with same pattern
    this.routes = this.routes.filter((r) => r.pattern !== config.pattern)
    this.routes.push(config)
  }

  /**
   * Remove route handler
   */
  removeRouteHandler(route: DeepLinkRoute): void {
    const routeConfig = this.routes.find((r) => r.route === route)
    if (routeConfig) {
      routeConfig.handler = undefined
    }
  }

  /**
   * Create deep link URL
   */
  createDeepLink(
    route: DeepLinkRoute,
    params: Record<string, string> = {},
    query: Record<string, string> = {},
    useUniversalLink: boolean = true
  ): string {
    const routeConfig = this.routes.find((r) => r.route === route)
    if (!routeConfig) {
      console.warn(`Route ${route} not found, creating with params`)
    }

    // Build path
    let path = routeConfig?.pattern || `/${route}`
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value))
    }

    // Build query string
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    // Build URL
    if (useUniversalLink && this.options.universalLinkDomains.length > 0) {
      const domain = this.options.universalLinkDomains[0]
      return `https://${domain}${path}${queryString ? `?${queryString}` : ''}`
    } else {
      return `${this.options.urlScheme}:/${path}${queryString ? `?${queryString}` : ''}`
    }
  }

  /**
   * Get pending deep link (if any)
   */
  getPendingDeepLink(): DeepLinkParams | null {
    const pending = this.pendingDeepLink
    this.pendingDeepLink = null
    return pending
  }

  /**
   * Clean up listeners
   */
  async cleanup(): Promise<void> {
    for (const listener of this.listeners) {
      await listener.remove()
    }
    this.listeners = []
    this.initialized = false
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[DeepLink]', ...args)
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const deepLinking = new DeepLinkService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UseDeepLinkResult {
  /** Last received deep link params */
  deepLinkParams: DeepLinkParams | null
  /** Whether deep link service is ready */
  isReady: boolean
  /** Create a deep link URL */
  createDeepLink: (
    route: DeepLinkRoute,
    params?: Record<string, string>,
    query?: Record<string, string>
  ) => string
  /** Parse a deep link URL */
  parseDeepLink: (url: string) => DeepLinkParams
}

export function useDeepLink(onDeepLink?: (params: DeepLinkParams) => void): UseDeepLinkResult {
  const [deepLinkParams, setDeepLinkParams] = React.useState<DeepLinkParams | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    let mounted = true

    async function init() {
      await deepLinking.initialize()

      if (!mounted) return
      setIsReady(true)

      // Check for pending deep link
      const pending = deepLinking.getPendingDeepLink()
      if (pending) {
        setDeepLinkParams(pending)
        onDeepLink?.(pending)
      }

      // Set up handler
      deepLinking.setGlobalHandler((params) => {
        if (mounted) {
          setDeepLinkParams(params)
          onDeepLink?.(params)
        }
      })
    }

    init()

    return () => {
      mounted = false
    }
  }, [onDeepLink])

  const createDeepLinkFn = React.useCallback(
    (route: DeepLinkRoute, params?: Record<string, string>, query?: Record<string, string>) => {
      return deepLinking.createDeepLink(route, params, query)
    },
    []
  )

  const parseDeepLinkFn = React.useCallback((url: string) => {
    return deepLinking.parseDeepLink(url)
  }, [])

  return {
    deepLinkParams,
    isReady,
    createDeepLink: createDeepLinkFn,
    parseDeepLink: parseDeepLinkFn,
  }
}

// =============================================================================
// Route-specific Hooks
// =============================================================================

export function useChannelDeepLink(
  onChannelOpen?: (channelId: string, threadId?: string) => void
): void {
  React.useEffect(() => {
    deepLinking.registerRouteHandler('channel', (params) => {
      onChannelOpen?.(params.params.channelId)
    })

    deepLinking.registerRouteHandler('thread', (params) => {
      onChannelOpen?.(params.params.channelId, params.params.threadId)
    })

    return () => {
      deepLinking.removeRouteHandler('channel')
      deepLinking.removeRouteHandler('thread')
    }
  }, [onChannelOpen])
}

export function useInviteDeepLink(onInvite?: (inviteCode: string) => void): void {
  React.useEffect(() => {
    deepLinking.registerRouteHandler('invite', (params) => {
      onInvite?.(params.params.inviteCode)
    })

    return () => {
      deepLinking.removeRouteHandler('invite')
    }
  }, [onInvite])
}

export function useOAuthDeepLink(
  onOAuthCallback?: (provider: string, params: Record<string, string>) => void
): void {
  React.useEffect(() => {
    deepLinking.registerRouteHandler('oauth_callback', (params) => {
      onOAuthCallback?.(params.params.provider, params.query)
    })

    return () => {
      deepLinking.removeRouteHandler('oauth_callback')
    }
  }, [onOAuthCallback])
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if the app was launched from a deep link
 */
export async function wasLaunchedFromDeepLink(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false

  try {
    const { url } = (await App.getLaunchUrl()) ?? { url: null }
    return url !== null
  } catch {
    return false
  }
}

/**
 * Get the launch deep link URL
 */
export async function getLaunchDeepLink(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const result = await App.getLaunchUrl()
    return result?.url || null
  } catch {
    return null
  }
}
