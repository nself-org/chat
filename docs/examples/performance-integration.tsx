/**
 * Performance Monitoring Integration Examples
 *
 * This file demonstrates how to integrate performance monitoring
 * throughout your application.
 */

// ============================================================================
// Example 1: Root Layout Integration
// ============================================================================

// src/app/layout.tsx
import PerformanceInitializer from '@/components/performance/PerformanceInitializer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {/* Initialize performance monitoring */}
        <PerformanceInitializer />

        {/* Your app */}
        {children}
      </body>
    </html>
  )
}

// ============================================================================
// Example 2: API Route Performance Tracking
// ============================================================================

// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { measurePerformanceAsync } from '@/lib/performance/monitor'

export async function GET(request: NextRequest) {
  return measurePerformanceAsync(
    'api-get-messages',
    async () => {
      // Your API logic
      const messages = await fetchMessages()
      return NextResponse.json(messages)
    },
    {
      endpoint: '/api/messages',
      method: 'GET',
    }
  )
}

export async function POST(request: NextRequest) {
  const start = performance.now()

  try {
    const body = await request.json()
    const result = await createMessage(body)

    const duration = performance.now() - start

    // Record successful API call
    performanceMonitor.recordCustomMetric({
      name: 'api-response-time',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint: '/api/messages',
        method: 'POST',
        status: '200',
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const duration = performance.now() - start

    // Record failed API call
    performanceMonitor.recordCustomMetric({
      name: 'api-response-time',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint: '/api/messages',
        method: 'POST',
        status: '500',
        error: 'true',
      },
    })

    // Record the error
    performanceMonitor.recordError(error as Error, {
      endpoint: '/api/messages',
      method: 'POST',
    })

    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

// ============================================================================
// Example 3: Component Render Performance
// ============================================================================

import { useRenderPerformance } from '@/hooks/use-performance'
import { Profiler } from 'react'
import { recordRenderTime } from '@/lib/performance/monitor'

// Simple tracking with hook
function MessageList({ messages }) {
  const { renderCount } = useRenderPerformance('MessageList')

  return (
    <div>
      {/* Render count is tracked automatically */}
      {messages.map((msg) => (
        <Message key={msg.id} {...msg} />
      ))}
    </div>
  )
}

// Advanced tracking with Profiler
function ExpensiveComponent() {
  return (
    <Profiler
      id="ExpensiveComponent"
      onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
        recordRenderTime(id, phase, actualDuration)

        // Warn about slow renders
        if (actualDuration > 50) {
          console.warn(`Slow render in ${id}: ${actualDuration.toFixed(2)}ms`)
        }
      }}
    >
      <ComplexUI />
    </Profiler>
  )
}

// ============================================================================
// Example 4: GraphQL Performance Tracking
// ============================================================================

import { ApolloLink } from '@apollo/client'
import { performanceMonitor } from '@/lib/performance/monitor'

export const performanceLink = new ApolloLink((operation, forward) => {
  const start = performance.now()
  const operationName = operation.operationName
  const operationType = operation.query.definitions[0]?.operation || 'unknown'

  return forward(operation).map((response) => {
    const duration = performance.now() - start

    performanceMonitor.recordCustomMetric({
      name: 'graphql-query-time',
      value: duration,
      unit: 'ms',
      tags: {
        operation: operationName,
        type: operationType,
        hasErrors: response.errors ? 'true' : 'false',
      },
    })

    // Record errors
    if (response.errors) {
      response.errors.forEach((error) => {
        performanceMonitor.recordError(new Error(error.message), {
          operation: operationName,
          type: operationType,
        })
      })
    }

    return response
  })
})

// Add to Apollo Client setup
import { ApolloClient, InMemoryCache } from '@apollo/client'

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  cache: new InMemoryCache(),
  link: performanceLink.concat(httpLink),
})

// ============================================================================
// Example 5: WebSocket Performance Tracking
// ============================================================================

import { useWebSocketPerformance } from '@/hooks/use-performance'
import { useEffect } from 'react'
import io from 'socket.io-client'

function ChatComponent() {
  const { recordLatency, recordMessage } = useWebSocketPerformance()

  useEffect(() => {
    const socket = io('http://localhost:4000')

    // Track connection latency
    const pingStart = Date.now()
    socket.on('connect', () => {
      const latency = Date.now() - pingStart
      recordLatency(latency)
    })

    // Track message sending
    const sendMessage = (text: string) => {
      const start = performance.now()
      const messageSize = new Blob([text]).size

      socket.emit('message', text, () => {
        const latency = performance.now() - start
        recordLatency(latency)
        recordMessage('sent', messageSize)
      })
    }

    // Track message receiving
    socket.on('message', (data: string) => {
      const messageSize = new Blob([data]).size
      recordMessage('received', messageSize)
    })

    return () => {
      socket.close()
    }
  }, [recordLatency, recordMessage])
}

// ============================================================================
// Example 6: Custom Performance Warnings
// ============================================================================

import { performanceMonitor } from '@/lib/performance/monitor'

function performExpensiveOperation() {
  const start = performance.now()

  // Your expensive operation
  const result = processLargeDataset()

  const duration = performance.now() - start

  // Record metric
  performanceMonitor.recordCustomMetric({
    name: 'data-processing-time',
    value: duration,
    unit: 'ms',
    tags: {
      dataSize: result.length.toString(),
    },
  })

  // Custom warning for slow operations
  if (duration > 1000) {
    performanceMonitor.addWarning({
      type: 'slow-operation',
      severity: duration > 5000 ? 'critical' : 'warning',
      message: `Data processing took ${duration.toFixed(0)}ms`,
      metadata: {
        operation: 'processLargeDataset',
        duration,
        dataSize: result.length,
      },
    })
  }

  return result
}

// ============================================================================
// Example 7: Performance Dashboard Component
// ============================================================================

import { usePerformance, usePerformanceWarnings } from '@/hooks/use-performance'

function PerformanceDashboard() {
  const { snapshot, score, stats, trends, refresh } = usePerformance({
    autoUpdate: true,
    updateInterval: 5000, // 5 seconds
  })

  const { activeWarnings, clearWarning } = usePerformanceWarnings()

  return (
    <div className="performance-dashboard">
      {/* Overall Score */}
      <div className="score">
        <h2>Performance Score</h2>
        <div className="score-value">{score.overall}</div>
        <div className="score-grade">{getScoreGrade(score.overall)}</div>
      </div>

      {/* Web Vitals */}
      <div className="vitals">
        <h3>Web Vitals</h3>
        <div>LCP: {snapshot.webVitals.lcp?.toFixed(0)}ms</div>
        <div>FID: {snapshot.webVitals.fid?.toFixed(0)}ms</div>
        <div>CLS: {snapshot.webVitals.cls?.toFixed(3)}</div>
      </div>

      {/* Custom Metrics */}
      <div className="custom-metrics">
        <h3>Custom Metrics</h3>
        <div>
          API Response Time: {stats.apiResponseTime.avg.toFixed(0)}ms
          {trends.apiResponseTime.direction !== 'stable' && (
            <span className={trends.apiResponseTime.direction}>
              {trends.apiResponseTime.direction === 'improving' ? '↓' : '↑'}
              {Math.abs(trends.apiResponseTime.change).toFixed(1)}%
            </span>
          )}
        </div>
        <div>Render Time: {stats.renderTime.avg.toFixed(2)}ms</div>
        <div>Memory Usage: {stats.memoryUsage.avg.toFixed(1)}%</div>
      </div>

      {/* Warnings */}
      {activeWarnings.length > 0 && (
        <div className="warnings">
          <h3>Performance Warnings</h3>
          {activeWarnings.map((warning) => (
            <div key={warning.id} className={`warning ${warning.severity}`}>
              <p>{warning.message}</p>
              <button onClick={() => clearWarning(warning.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}

// ============================================================================
// Example 8: Performance Budget Enforcement
// ============================================================================

import { performanceMonitor } from '@/lib/performance/monitor'

// Define your performance budget
const PERFORMANCE_BUDGET = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  apiResponseTime: 500,
  renderTime: 16,
  memoryUsage: 50,
}

// Check budget periodically
function enforcePerformanceBudget() {
  const snapshot = performanceMonitor.getSnapshot()

  const violations: string[] = []

  // Check Web Vitals
  if (snapshot.webVitals.lcp && snapshot.webVitals.lcp > PERFORMANCE_BUDGET.lcp) {
    violations.push(
      `LCP exceeded budget: ${snapshot.webVitals.lcp}ms > ${PERFORMANCE_BUDGET.lcp}ms`
    )
  }

  if (snapshot.webVitals.fid && snapshot.webVitals.fid > PERFORMANCE_BUDGET.fid) {
    violations.push(
      `FID exceeded budget: ${snapshot.webVitals.fid}ms > ${PERFORMANCE_BUDGET.fid}ms`
    )
  }

  if (snapshot.webVitals.cls && snapshot.webVitals.cls > PERFORMANCE_BUDGET.cls) {
    violations.push(`CLS exceeded budget: ${snapshot.webVitals.cls} > ${PERFORMANCE_BUDGET.cls}`)
  }

  // Check custom metrics
  if (snapshot.custom.apiResponseTime > PERFORMANCE_BUDGET.apiResponseTime) {
    violations.push(
      `API response time exceeded budget: ${snapshot.custom.apiResponseTime.toFixed(0)}ms > ${PERFORMANCE_BUDGET.apiResponseTime}ms`
    )
  }

  if (snapshot.custom.renderTime > PERFORMANCE_BUDGET.renderTime) {
    violations.push(
      `Render time exceeded budget: ${snapshot.custom.renderTime.toFixed(2)}ms > ${PERFORMANCE_BUDGET.renderTime}ms`
    )
  }

  if (snapshot.custom.memoryUsage > PERFORMANCE_BUDGET.memoryUsage) {
    violations.push(
      `Memory usage exceeded budget: ${snapshot.custom.memoryUsage.toFixed(1)}% > ${PERFORMANCE_BUDGET.memoryUsage}%`
    )
  }

  // Log violations
  if (violations.length > 0) {
    console.warn('Performance budget violations:', violations)

    // In CI/CD, you might want to fail the build
    if (process.env.CI === 'true') {
      throw new Error(`Performance budget violations:\n${violations.join('\n')}`)
    }
  }
}

// Run in development or CI
if (process.env.NODE_ENV === 'development' || process.env.CI === 'true') {
  setInterval(enforcePerformanceBudget, 60000) // Check every minute
}

// ============================================================================
// Example 9: Performance Monitoring in Tests
// ============================================================================

import { render, screen } from '@testing-library/react'
import { performanceMonitor } from '@/lib/performance/monitor'

describe('Component Performance', () => {
  beforeEach(() => {
    performanceMonitor.reset()
  })

  it('should render within performance budget', () => {
    const start = performance.now()

    render(<ExpensiveComponent />)

    const renderTime = performance.now() - start

    // Assert render time is within budget
    expect(renderTime).toBeLessThan(50)
  })

  it('should track custom metrics', () => {
    performanceMonitor.recordCustomMetric({
      name: 'test-metric',
      value: 100,
      unit: 'ms',
    })

    const metrics = performanceMonitor.getCustomMetrics()
    const testMetric = metrics.find((m) => m.name === 'test-metric')

    expect(testMetric).toBeDefined()
    expect(testMetric?.value).toBe(100)
  })
})

// ============================================================================
// Example 10: Exporting Performance Reports
// ============================================================================

import { exportToCSV, exportToJSON } from '@/lib/performance/metrics'
import { performanceMonitor } from '@/lib/performance/monitor'

function ExportButton() {
  const handleExportCSV = () => {
    const metrics = performanceMonitor.getMetrics()
    const csv = exportToCSV(metrics)

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    const metrics = performanceMonitor.getMetrics()
    const json = exportToJSON(metrics)

    // Download JSON
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <button onClick={handleExportCSV}>Export CSV</button>
      <button onClick={handleExportJSON}>Export JSON</button>
    </div>
  )
}
