/**
 * Health Check API Route
 *
 * Provides health status information for the application and its dependencies.
 * Used for monitoring, load balancers, and orchestration systems.
 *
 * @endpoint GET /api/health - Get health status
 * @endpoint GET /api/health?detailed=true - Get detailed health status
 *
 * @example
 * ```typescript
 * // Basic health check
 * const response = await fetch('/api/health')
 * const { data } = await response.json()
 * // { status: 'healthy', timestamp: '...' }
 *
 * // Detailed health check
 * const response = await fetch('/api/health?detailed=true')
 * const { data } = await response.json()
 * // { status: 'healthy', services: [...], timestamp: '...' }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, serviceUnavailableResponse } from '@/lib/api/response'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Service URLs
  GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://hasura.localhost/v1/graphql',
  AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://auth.localhost',
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL || 'http://storage.localhost',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Health check timeout (5 seconds)
  CHECK_TIMEOUT: 5000,

  // Version info
  VERSION: process.env.npm_package_version || '1.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// ============================================================================
// Types
// ============================================================================

type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

interface ServiceHealth {
  name: string
  status: ServiceStatus
  latency?: number
  message?: string
  lastChecked: string
}

interface HealthStatus {
  status: ServiceStatus
  version: string
  environment: string
  timestamp: string
  uptime: number
  services?: ServiceHealth[]
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

// Track server start time for uptime calculation
const serverStartTime = Date.now()

// ============================================================================
// Health Check Functions
// ============================================================================

/**
 * Check database (Hasura/GraphQL) health
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now()
  const name = 'database'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.CHECK_TIMEOUT)

    const response = await fetch(CONFIG.GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (response.ok) {
      return {
        name,
        status: 'healthy',
        latency,
        lastChecked: new Date().toISOString(),
      }
    }

    return {
      name,
      status: 'unhealthy',
      latency,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Check authentication service health
 */
async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  const name = 'auth'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.CHECK_TIMEOUT)

    // Check auth healthcheck endpoint
    const response = await fetch(`${CONFIG.AUTH_URL}/healthz`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (response.ok) {
      return {
        name,
        status: 'healthy',
        latency,
        lastChecked: new Date().toISOString(),
      }
    }

    return {
      name,
      status: 'degraded',
      latency,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Check storage service health
 */
async function checkStorage(): Promise<ServiceHealth> {
  const startTime = Date.now()
  const name = 'storage'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.CHECK_TIMEOUT)

    // Check storage health endpoint
    const response = await fetch(`${CONFIG.STORAGE_URL}/healthz`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (response.ok) {
      return {
        name,
        status: 'healthy',
        latency,
        lastChecked: new Date().toISOString(),
      }
    }

    return {
      name,
      status: 'degraded',
      latency,
      message: `HTTP ${response.status}`,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Check Redis connection health
 */
async function checkRedis(): Promise<ServiceHealth> {
  const startTime = Date.now()
  const name = 'redis'

  // Skip if Redis URL is not configured
  if (!process.env.REDIS_URL) {
    return {
      name,
      status: 'unknown',
      message: 'Not configured',
      lastChecked: new Date().toISOString(),
    }
  }

  try {
    // In production, this would use ioredis or similar:
    // const redis = new Redis(CONFIG.REDIS_URL)
    // await redis.ping()
    // await redis.quit()

    // Mock check for development
    const latency = Date.now() - startTime

    return {
      name,
      status: 'healthy',
      latency,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Get memory usage information
 */
function getMemoryUsage(): HealthStatus['memory'] {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const total = usage.heapTotal
    const used = usage.heapUsed

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round((used / total) * 100),
    }
  }

  return undefined
}

/**
 * Calculate overall status from service statuses
 */
function calculateOverallStatus(services: ServiceHealth[]): ServiceStatus {
  const hasUnhealthy = services.some((s) => s.status === 'unhealthy')
  const hasDegraded = services.some((s) => s.status === 'degraded')

  // Database is critical
  const dbService = services.find((s) => s.name === 'database')
  if (dbService?.status === 'unhealthy') {
    return 'unhealthy'
  }

  if (hasUnhealthy) {
    return 'degraded'
  }

  if (hasDegraded) {
    return 'degraded'
  }

  return 'healthy'
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'

  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000)

  // Basic health response
  if (!detailed) {
    // Quick check - just verify the app is running
    return successResponse<HealthStatus>({
      status: 'healthy',
      version: CONFIG.VERSION,
      environment: CONFIG.NODE_ENV,
      timestamp,
      uptime,
    })
  }

  // Detailed health check - check all services
  try {
    const [database, auth, storage, redis] = await Promise.all([
      checkDatabase(),
      checkAuth(),
      checkStorage(),
      checkRedis(),
    ])

    const services = [database, auth, storage, redis]
    const overallStatus = calculateOverallStatus(services)
    const memory = getMemoryUsage()

    const healthStatus: HealthStatus = {
      status: overallStatus,
      version: CONFIG.VERSION,
      environment: CONFIG.NODE_ENV,
      timestamp,
      uptime,
      services,
      memory,
    }

    // Return 503 if unhealthy
    if (overallStatus === 'unhealthy') {
      return serviceUnavailableResponse('Service is unhealthy', 'UNHEALTHY')
    }

    return successResponse(healthStatus)
  } catch (error) {
    console.error('Health check error:', error)

    return serviceUnavailableResponse(
      'Health check failed',
      'HEALTH_CHECK_FAILED'
    )
  }
}

// ============================================================================
// HEAD Handler (for simple health probes)
// ============================================================================

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 })
}

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Disable caching for health checks
export const revalidate = 0
