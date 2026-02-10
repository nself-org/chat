/**
 * Search Performance Load Test - 100 Concurrent Queries
 *
 * Tests search performance with large index (1M+ messages).
 * Monitors query response time, relevance, and indexing performance.
 *
 * Usage:
 *   k6 run tests/load/search-queries.js
 *
 * Environment Variables:
 *   API_URL - API base URL (default: http://localhost:3000)
 *   VUS - Virtual users (default: 100)
 *   DURATION - Test duration (default: 5m)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Trend, Rate } from 'k6/metrics'

// Custom metrics
const searchQueries = new Counter('search_queries')
const searchSuccess = new Counter('search_success')
const searchFailed = new Counter('search_failed')
const searchTime = new Trend('search_time', true)
const resultsCount = new Trend('results_count', true)
const relevanceScore = new Rate('relevance_score')
const indexTime = new Trend('index_time', true)

// Configuration
const API_URL = __ENV.API_URL || 'http://localhost:3000'
const VUS = parseInt(__ENV.VUS || '100')
const DURATION = __ENV.DURATION || '5m'

// Search query templates
const SEARCH_QUERIES = [
  'error message',
  'user login',
  'api endpoint',
  'database connection',
  'authentication failed',
  'load test',
  'performance issue',
  'bug fix',
  'feature request',
  'deployment',
  'production release',
  'code review',
  'pull request',
  'merge conflict',
  'test coverage',
  'ci/cd pipeline',
  'docker container',
  'kubernetes pod',
  'monitoring alert',
  'security vulnerability',
  'data migration',
  'schema update',
  'cache invalidation',
  'rate limiting',
  'websocket connection',
]

// Filter types
const FILTER_TYPES = ['message', 'channel', 'user', 'file']

export const options = {
  stages: [
    { duration: '1m', target: VUS / 2 }, // Ramp up
    { duration: DURATION, target: VUS }, // Hold
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    search_time: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
    search_failed: ['count<10'], // Less than 10 failures
    relevance_score: ['rate>0.8'], // 80%+ relevant results
    http_req_failed: ['rate<0.01'], // Less than 1% errors
  },
}

export function setup() {
  // Authenticate
  const authRes = http.post(
    `${API_URL}/api/auth/signin`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'password123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  let authToken = ''
  if (authRes.status === 200) {
    authToken = JSON.parse(authRes.body).token
  }

  // Warm up search index (create some test data if needed)
  console.log('Warming up search index...')

  // Create test data for searching
  const channelRes = http.post(
    `${API_URL}/api/channels`,
    JSON.stringify({
      name: 'search-test-channel',
      type: 'public',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  let channelId = ''
  if (channelRes.status === 201) {
    channelId = JSON.parse(channelRes.body).id
  }

  // Create some test messages for searching
  for (let i = 0; i < 100; i++) {
    const query = SEARCH_QUERIES[i % SEARCH_QUERIES.length]
    http.post(
      `${API_URL}/api/messages`,
      JSON.stringify({
        channel_id: channelId,
        content: `Test message containing ${query} number ${i}`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )
  }

  console.log('Setup complete')

  return { authToken, channelId }
}

export default function (data) {
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)]
  const filterType = FILTER_TYPES[Math.floor(Math.random() * FILTER_TYPES.length)]

  // Build search request
  const searchPayload = {
    query: query,
    filters: {
      type: filterType,
    },
    limit: 20,
    offset: 0,
  }

  // Add optional filters randomly
  if (Math.random() < 0.3) {
    searchPayload.filters.channel_id = data.channelId
  }

  if (Math.random() < 0.2) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7)
    searchPayload.filters.from_date = fromDate.toISOString()
  }

  const searchStart = Date.now()
  searchQueries.add(1)

  // Execute search
  const searchRes = http.post(`${API_URL}/api/search`, JSON.stringify(searchPayload), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.authToken}`,
    },
    tags: { name: 'search_query' },
  })

  const searchEnd = Date.now()
  const searchDuration = searchEnd - searchStart
  searchTime.add(searchDuration)

  // Validate search response
  const success = check(searchRes, {
    'Search status 200': (r) => r.status === 200,
    'Search has results': (r) => {
      try {
        return JSON.parse(r.body).results !== undefined
      } catch {
        return false
      }
    },
    'Search time < 1s': () => searchDuration < 1000,
  })

  if (success) {
    searchSuccess.add(1)

    const body = JSON.parse(searchRes.body)
    const results = body.results || []
    resultsCount.add(results.length)

    // Check relevance (simple check: does result contain query term)
    if (results.length > 0) {
      const relevantCount = results.filter((r) => {
        const content = (r.content || '').toLowerCase()
        return content.includes(query.toLowerCase())
      }).length

      const relevance = relevantCount / results.length
      relevanceScore.add(relevance > 0.5)
    }

    // Optional: Test search suggestions/autocomplete (10% of requests)
    if (Math.random() < 0.1) {
      const suggestStart = Date.now()
      const suggestRes = http.get(`${API_URL}/api/search/suggest?q=${query.substring(0, 3)}`, {
        headers: {
          Authorization: `Bearer ${data.authToken}`,
        },
        tags: { name: 'search_suggest' },
      })

      searchTime.add(Date.now() - suggestStart)

      check(suggestRes, {
        'Suggestions successful': (r) => r.status === 200,
        'Suggestions has data': (r) => {
          try {
            return Array.isArray(JSON.parse(r.body))
          } catch {
            return false
          }
        },
      })
    }
  } else {
    searchFailed.add(1)
    console.error(`Search failed: ${searchRes.status} - ${searchRes.body}`)
  }

  // Think time
  sleep(Math.random() * 2 + 1)
}

// Test search indexing performance
export function indexTest() {
  // This would be a separate test to measure indexing speed
  const start = Date.now()

  // Simulate bulk indexing
  const docs = []
  for (let i = 0; i < 100; i++) {
    docs.push({
      id: `doc_${i}`,
      content: `Test document ${i}`,
      type: 'message',
      created_at: new Date().toISOString(),
    })
  }

  const indexRes = http.post(
    `${API_URL}/api/search/index/bulk`,
    JSON.stringify({ documents: docs }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'bulk_index' },
    }
  )

  const duration = Date.now() - start
  indexTime.add(duration)

  check(indexRes, {
    'Bulk index successful': (r) => r.status === 200,
    'Bulk index time < 5s': () => duration < 5000,
  })
}

export function handleSummary(data) {
  const summary = generateSummary(data)

  return {
    'test-results/search-queries-summary.json': JSON.stringify(data, null, 2),
    'test-results/search-queries-report.txt': summary,
    stdout: summary,
  }
}

function generateSummary(data) {
  const metrics = data.metrics

  let summary = '\n' + '='.repeat(80) + '\n'
  summary += 'Search Performance Load Test - 100 Concurrent Queries\n'
  summary += '='.repeat(80) + '\n\n'

  // Query metrics
  const queriesTotal = metrics.search_queries?.values?.count || 0
  const successTotal = metrics.search_success?.values?.count || 0
  const failedTotal = metrics.search_failed?.values?.count || 0
  const successRate = queriesTotal > 0 ? (successTotal / queriesTotal) * 100 : 0

  summary += 'Query Metrics:\n'
  summary += `  Total Queries: ${queriesTotal}\n`
  summary += `  Successful: ${successTotal}\n`
  summary += `  Failed: ${failedTotal}\n`
  summary += `  Success Rate: ${successRate.toFixed(2)}%\n\n`

  // Performance metrics
  summary += 'Performance Metrics:\n'
  summary += `  Average Query Time: ${(metrics.search_time?.values?.avg || 0).toFixed(2)}ms\n`
  summary += `  p50 Query Time: ${(metrics.search_time?.values?.['p(50)'] || 0).toFixed(2)}ms\n`
  summary += `  p95 Query Time: ${(metrics.search_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  p99 Query Time: ${(metrics.search_time?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += `  Max Query Time: ${(metrics.search_time?.values?.max || 0).toFixed(2)}ms\n\n`

  // Results metrics
  summary += 'Results Metrics:\n'
  summary += `  Average Results per Query: ${(metrics.results_count?.values?.avg || 0).toFixed(2)}\n`
  summary += `  Relevance Score: ${((metrics.relevance_score?.values?.rate || 0) * 100).toFixed(2)}%\n\n`

  // Indexing metrics (if available)
  if (metrics.index_time) {
    summary += 'Indexing Performance:\n'
    summary += `  Average Index Time: ${(metrics.index_time?.values?.avg || 0).toFixed(2)}ms\n`
    summary += `  p95 Index Time: ${(metrics.index_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n\n`
  }

  // Test result
  const passed =
    successRate >= 99 &&
    (metrics.search_time?.values?.['p(95)'] || 999999) < 500 &&
    (metrics.relevance_score?.values?.rate || 0) >= 0.8

  summary += 'Test Result: ' + (passed ? '✅ PASSED' : '❌ FAILED') + '\n'
  summary += '='.repeat(80) + '\n'

  return summary
}
