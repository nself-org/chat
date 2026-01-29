/**
 * Prometheus Metrics API Route
 *
 * Exposes application metrics in Prometheus format for monitoring.
 * Used by Prometheus scraping and monitoring dashboards.
 *
 * @endpoint GET /api/metrics - Get Prometheus metrics
 *
 * @example
 * ```bash
 * curl http://localhost:3000/api/metrics
 * # HELP nchat_http_requests_total Total HTTP requests
 * # TYPE nchat_http_requests_total counter
 * nchat_http_requests_total{method="GET",status="200"} 1234
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'nchat',
  VERSION: process.env.npm_package_version || '0.2.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// ============================================================================
// Metrics Storage
// ============================================================================

// Simple in-memory metrics (in production, use prom-client or similar)
interface MetricsStore {
  httpRequests: Map<string, number>
  httpDuration: number[]
  startTime: number
  lastGC?: {
    heapUsed: number
    timestamp: number
  }
}

// Global metrics store (persists between requests in the same process)
const metrics: MetricsStore = {
  httpRequests: new Map(),
  httpDuration: [],
  startTime: Date.now(),
}

// ============================================================================
// Metric Helpers
// ============================================================================

/**
 * Format a metric in Prometheus format
 */
function formatMetric(
  name: string,
  type: 'counter' | 'gauge' | 'histogram',
  help: string,
  values: { labels?: Record<string, string>; value: number }[]
): string {
  const prefix = `${CONFIG.APP_NAME}_`
  const lines: string[] = []

  lines.push(`# HELP ${prefix}${name} ${help}`)
  lines.push(`# TYPE ${prefix}${name} ${type}`)

  for (const { labels, value } of values) {
    if (labels && Object.keys(labels).length > 0) {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',')
      lines.push(`${prefix}${name}{${labelStr}} ${value}`)
    } else {
      lines.push(`${prefix}${name} ${value}`)
    }
  }

  return lines.join('\n')
}

/**
 * Get Node.js process metrics
 */
function getProcessMetrics(): string[] {
  const metricsOutput: string[] = []

  // Memory metrics
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage()

    metricsOutput.push(
      formatMetric('nodejs_heap_size_bytes', 'gauge', 'Node.js heap size in bytes', [
        { labels: { type: 'total' }, value: memory.heapTotal },
        { labels: { type: 'used' }, value: memory.heapUsed },
      ])
    )

    metricsOutput.push(
      formatMetric('nodejs_external_memory_bytes', 'gauge', 'Node.js external memory in bytes', [
        { value: memory.external },
      ])
    )

    metricsOutput.push(
      formatMetric('nodejs_rss_bytes', 'gauge', 'Node.js resident set size in bytes', [
        { value: memory.rss },
      ])
    )
  }

  // Uptime
  const uptimeSeconds = Math.floor((Date.now() - metrics.startTime) / 1000)
  metricsOutput.push(
    formatMetric('process_uptime_seconds', 'counter', 'Process uptime in seconds', [
      { value: uptimeSeconds },
    ])
  )

  // CPU usage (if available)
  if (typeof process !== 'undefined' && process.cpuUsage) {
    const cpu = process.cpuUsage()
    metricsOutput.push(
      formatMetric('process_cpu_seconds_total', 'counter', 'Total CPU time in seconds', [
        { labels: { type: 'user' }, value: cpu.user / 1e6 },
        { labels: { type: 'system' }, value: cpu.system / 1e6 },
      ])
    )
  }

  return metricsOutput
}

/**
 * Get application-specific metrics
 */
function getApplicationMetrics(): string[] {
  const metricsOutput: string[] = []

  // Application info
  metricsOutput.push(
    formatMetric('app_info', 'gauge', 'Application information', [
      {
        labels: {
          version: CONFIG.VERSION,
          environment: CONFIG.NODE_ENV,
        },
        value: 1,
      },
    ])
  )

  // HTTP request metrics (simulated - in production, track real requests)
  metricsOutput.push(
    formatMetric('http_requests_total', 'counter', 'Total HTTP requests', [
      { labels: { method: 'GET', status: '200' }, value: Math.floor(Math.random() * 1000) + 100 },
      { labels: { method: 'GET', status: '404' }, value: Math.floor(Math.random() * 50) },
      { labels: { method: 'POST', status: '200' }, value: Math.floor(Math.random() * 500) + 50 },
      { labels: { method: 'POST', status: '400' }, value: Math.floor(Math.random() * 20) },
    ])
  )

  // Active connections (simulated)
  metricsOutput.push(
    formatMetric('active_connections', 'gauge', 'Number of active connections', [
      { labels: { type: 'http' }, value: Math.floor(Math.random() * 100) + 10 },
      { labels: { type: 'websocket' }, value: Math.floor(Math.random() * 50) },
    ])
  )

  return metricsOutput
}

/**
 * Get custom business metrics
 */
function getBusinessMetrics(): string[] {
  const metricsOutput: string[] = []

  // These would be populated from actual application state
  // For now, return empty or simulated values

  metricsOutput.push(
    formatMetric('messages_total', 'counter', 'Total messages sent', [
      { value: Math.floor(Math.random() * 10000) + 1000 },
    ])
  )

  metricsOutput.push(
    formatMetric('active_users', 'gauge', 'Number of active users', [
      { value: Math.floor(Math.random() * 100) + 10 },
    ])
  )

  metricsOutput.push(
    formatMetric('active_channels', 'gauge', 'Number of active channels', [
      { value: Math.floor(Math.random() * 20) + 5 },
    ])
  )

  return metricsOutput
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const allMetrics: string[] = []

    // Collect all metrics
    allMetrics.push(...getProcessMetrics())
    allMetrics.push(...getApplicationMetrics())
    allMetrics.push(...getBusinessMetrics())

    // Add timestamp
    allMetrics.push(
      `# Generated at ${new Date().toISOString()}`
    )

    const body = allMetrics.join('\n\n') + '\n'

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Metrics error:', error)

    return new NextResponse('# Error generating metrics\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    })
  }
}

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
