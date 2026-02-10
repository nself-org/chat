/**
 * k6 API Load Test
 *
 * Tests GraphQL API endpoints under load with various query patterns.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Counter, Rate } from 'k6/metrics'
import { config, getTestOptions, generateTestUser, randomItem } from './config.js'

// Custom metrics
const queryDuration = new Trend('query_duration')
const mutationDuration = new Trend('mutation_duration')
const queryComplexity = new Trend('query_complexity')
const cacheHits = new Counter('cache_hits')
const cacheMisses = new Counter('cache_misses')
const errorRate = new Rate('error_rate')

// Test options - use 'load' scenario by default
export const options = getTestOptions(process.env.SCENARIO || 'load')

// Setup: Create test data
export function setup() {
  console.log('Setting up test data...')

  const users = []
  const channels = []

  // Create test users
  for (let i = 0; i < 100; i++) {
    const user = generateTestUser(i)
    users.push(user)
  }

  // Create test channels
  for (let i = 0; i < 20; i++) {
    channels.push({
      id: `channel-${i}`,
      name: `test-channel-${i}`,
    })
  }

  return { users, channels }
}

// Main test function
export default function (data) {
  const user = randomItem(data.users)
  const channel = randomItem(data.channels)

  // Test 1: Login
  testLogin(user)

  // Test 2: Fetch channels
  testFetchChannels()

  // Test 3: Fetch messages
  testFetchMessages(channel.id)

  // Test 4: Send message
  testSendMessage(channel.id, user.email)

  // Test 5: Fetch user profile
  testFetchUserProfile(user.email)

  // Test 6: Search messages
  testSearchMessages('test')

  sleep(1)
}

// Teardown
export function teardown(data) {
  console.log('Cleaning up test data...')
}

// ============================================================================
// Test Functions
// ============================================================================

function testLogin(user) {
  const query = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          email
          displayName
        }
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query,
      variables: {
        email: user.email,
        password: user.password,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'login' },
    }
  )

  const duration = Date.now() - startTime
  mutationDuration.add(duration)

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      const body = JSON.parse(r.body)
      return body.data?.login?.token !== undefined
    },
  })

  errorRate.add(!success)
}

function testFetchChannels() {
  const query = `
    query GetChannels($limit: Int = 50, $offset: Int = 0) {
      nchat_channels(
        limit: $limit
        offset: $offset
        where: { deleted_at: { _is_null: true } }
        order_by: { created_at: desc }
      ) {
        id
        name
        type
        description
        visibility
        member_count: channel_members_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query,
      variables: { limit: 50, offset: 0 },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'fetch_channels' },
    }
  )

  const duration = Date.now() - startTime
  queryDuration.add(duration)
  queryComplexity.add(estimateComplexity(query))

  // Check for cache headers
  if (response.headers['X-Cache-Hit']) {
    cacheHits.add(1)
  } else {
    cacheMisses.add(1)
  }

  const success = check(response, {
    'fetch channels status is 200': (r) => r.status === 200,
    'fetch channels has data': (r) => {
      const body = JSON.parse(r.body)
      return body.data?.nchat_channels !== undefined
    },
    'fetch channels response time < 100ms': (r) => duration < 100,
  })

  errorRate.add(!success)
}

function testFetchMessages(channelId) {
  const query = `
    query GetMessages($channelId: uuid!, $limit: Int = 50) {
      nchat_messages(
        where: {
          channel_id: { _eq: $channelId }
          deleted_at: { _is_null: true }
        }
        order_by: { created_at: desc }
        limit: $limit
      ) {
        id
        content
        message_type
        user_id
        created_at
        reactions: reactions_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query,
      variables: { channelId, limit: 50 },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'fetch_messages' },
    }
  )

  const duration = Date.now() - startTime
  queryDuration.add(duration)
  queryComplexity.add(estimateComplexity(query))

  const success = check(response, {
    'fetch messages status is 200': (r) => r.status === 200,
    'fetch messages response time < 100ms': (r) => duration < 100,
  })

  errorRate.add(!success)
}

function testSendMessage(channelId, userId) {
  const mutation = `
    mutation SendMessage($channelId: uuid!, $userId: uuid!, $content: String!) {
      insert_nchat_messages_one(
        object: {
          channel_id: $channelId
          user_id: $userId
          content: $content
          message_type: "text"
        }
      ) {
        id
        content
        created_at
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query: mutation,
      variables: {
        channelId,
        userId,
        content: `Load test message ${Date.now()}`,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'send_message' },
    }
  )

  const duration = Date.now() - startTime
  mutationDuration.add(duration)

  const success = check(response, {
    'send message status is 200': (r) => r.status === 200,
    'send message response time < 50ms': (r) => duration < 50,
  })

  errorRate.add(!success)
}

function testFetchUserProfile(userId) {
  const query = `
    query GetUserProfile($userId: uuid!) {
      users_by_pk(id: $userId) {
        id
        email
        displayName: display_name
        avatarUrl: avatar_url
        metadata
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query,
      variables: { userId },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'fetch_user_profile' },
    }
  )

  const duration = Date.now() - startTime
  queryDuration.add(duration)

  const success = check(response, {
    'fetch user profile status is 200': (r) => r.status === 200,
  })

  errorRate.add(!success)
}

function testSearchMessages(searchQuery) {
  const query = `
    query SearchMessages($query: String!, $limit: Int = 20) {
      search_messages(
        args: { search: $query }
        limit: $limit
      ) {
        id
        content
        channel_id
        user_id
        created_at
      }
    }
  `

  const startTime = Date.now()
  const response = http.post(
    config.apiUrl,
    JSON.stringify({
      query,
      variables: { query: searchQuery, limit: 20 },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'search_messages' },
    }
  )

  const duration = Date.now() - startTime
  queryDuration.add(duration)
  queryComplexity.add(estimateComplexity(query))

  const success = check(response, {
    'search messages status is 200': (r) => r.status === 200,
  })

  errorRate.add(!success)
}

// ============================================================================
// Utility Functions
// ============================================================================

function estimateComplexity(query) {
  // Simple complexity estimation based on field count
  const fields = (query.match(/\w+\s*{/g) || []).length
  const aggregates = (query.match(/_aggregate/g) || []).length
  return fields * 10 + aggregates * 50
}
