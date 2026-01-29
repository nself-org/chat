/**
 * Environment detection utilities
 */

/**
 * Check if the application is running in a development environment
 * This checks the hostname to determine if we're in local development
 */
export function isDevelopment(): boolean {
  // Server-side: check NODE_ENV
  if (typeof window === 'undefined') {
    const isDev = process.env.NODE_ENV === 'development'
    console.log('[Server] isDevelopment:', isDev, 'NODE_ENV:', process.env.NODE_ENV)
    return isDev
  }

  // Client-side: check hostname patterns
  const hostname = window.location.hostname
  const port = window.location.port

  const devHostnames = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]', // IPv6 localhost
  ]

  const devPatterns = [
    '.localhost', // *.localhost domains
    'local.', // local.* domains
    '.local', // *.local domains
    '.dev', // *.dev domains
    '.test', // *.test domains
  ]

  const devPorts = ['3000', '3001', '8080', '8000', '4200', '5173'] // Common dev ports

  let isDev = false
  let reason = 'no match'

  // Check exact matches
  if (devHostnames.includes(hostname)) {
    isDev = true
    reason = `exact match: ${hostname}`
  }

  // Check patterns
  if (!isDev) {
    for (const pattern of devPatterns) {
      if (hostname.includes(pattern)) {
        isDev = true
        reason = `pattern match: ${pattern} in ${hostname}`
        break
      }
    }
  }

  // Check port (if specified and in dev ports list)
  if (!isDev && port && devPorts.includes(port)) {
    isDev = true
    reason = `port match: ${port}`
  }

  // Check environment variable as fallback
  if (!isDev && process.env.NEXT_PUBLIC_ENV === 'development') {
    isDev = true
    reason = 'NEXT_PUBLIC_ENV=development'
  }

  console.log('[Client] isDevelopment:', isDev, 'reason:', reason, 'hostname:', hostname, 'port:', port || 'none')
  return isDev
}

/**
 * Check if the application is running in production
 */
export function isProduction(): boolean {
  return !isDevelopment()
}

/**
 * Get the current environment name
 */
export function getEnvironment(): 'development' | 'production' {
  return isDevelopment() ? 'development' : 'production'
}

/**
 * Get the current hostname
 */
export function getHostname(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }
  return window.location.hostname
}

/**
 * Check if we're on a specific domain pattern
 */
export function isLocalDomain(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const hostname = window.location.hostname
  return hostname === 'localhost' ||
         hostname.endsWith('.localhost') ||
         hostname.includes('local.') ||
         hostname.endsWith('.local')
}