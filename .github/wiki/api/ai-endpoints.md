# AI API Endpoints Reference

> **Version**: v0.7.0
> **Last Updated**: January 31, 2026
> **Status**: Production-ready

Complete API reference for all AI-powered endpoints in nself-chat, including summarization, search, moderation, and admin capabilities.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Cost Estimates](#cost-estimates)
- [Summarization Endpoints](#summarization-endpoints)
  - [POST /api/ai/summarize](#post-apiai-summarize)
  - [POST /api/ai/digest](#post-apiai-digest)
  - [POST /api/ai/sentiment](#post-apiai-sentiment)
- [Search Endpoints](#search-endpoints)
  - [POST /api/ai/search](#post-apiai-search)
  - [POST /api/ai/embed](#post-apiai-embed)
  - [GET /api/search/suggestions](#get-apisearch-suggestions)
- [Moderation Endpoints](#moderation-endpoints)
  - [POST /api/moderation/analyze](#post-apimoderationanalyze)
  - [POST /api/moderation/batch](#post-apimoderationbatch)
  - [POST /api/moderation/actions](#post-apimoderationactions)
  - [GET /api/moderation/stats](#get-apimoderationstats)
- [Admin Endpoints](#admin-endpoints)
  - [GET /api/admin/ai/usage](#get-apiadminaiusage)
  - [GET /api/admin/ai/costs](#get-apiadminaicosts)
  - [GET /api/admin/ai/config](#get-apiadminaiconfig)
  - [POST /api/admin/ai/config](#post-apiadminaiconfig)
  - [GET /api/admin/embeddings/stats](#get-apiadminembeddingsstats)
  - [POST /api/admin/embeddings/generate](#post-apiadminembeddingsgenerate)
  - [GET /api/admin/embeddings/status](#get-apiadminembeddingsstatus)
  - [POST /api/admin/embeddings/cancel](#post-apiadminembeddingscancel)
- [Error Codes](#error-codes)
- [Code Examples](#code-examples)

---

## Overview

The nself-chat AI API provides intelligent features powered by OpenAI GPT-4o-mini and Claude 3.5 Haiku. All endpoints support JSON request/response formats and include comprehensive error handling.

**Base URL**: `https://your-domain.com/api`

**Supported AI Providers**:

- OpenAI (GPT-4o-mini, GPT-3.5-turbo)
- Anthropic (Claude 3.5 Haiku, Claude 3 Haiku)
- Local fallbacks for basic operations

---

## Authentication

All API endpoints require authentication via one of the following methods:

### Bearer Token (Recommended)

```http
Authorization: Bearer <your_access_token>
```

### Session Cookie

```http
Cookie: nhost-session=<session_token>
```

### Development Mode

In development (`NEXT_PUBLIC_USE_DEV_AUTH=true`), authentication is bypassed for testing.

---

## Rate Limits

Rate limits are enforced per user and per organization:

| Endpoint Category | User Limit   | Org Limit      | Window   |
| ----------------- | ------------ | -------------- | -------- |
| Summarization     | 50 requests  | 500 requests   | 1 hour   |
| Search            | 20 requests  | 1,000 requests | 1 minute |
| Embeddings        | 10 requests  | 100 requests   | 1 minute |
| Moderation        | 100 requests | 1,000 requests | 1 hour   |
| Admin             | 30 requests  | N/A            | 1 minute |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706745600
```

**429 Response**:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Cost Estimates

Approximate costs per operation (USD):

| Operation             | Model                  | Cost per Request    |
| --------------------- | ---------------------- | ------------------- |
| Brief Summary         | GPT-4o-mini            | $0.0001 - $0.0005   |
| Channel Digest        | GPT-4o-mini            | $0.001 - $0.005     |
| Sentiment Analysis    | Claude 3.5 Haiku       | $0.0001 - $0.0003   |
| Embedding (batch 100) | text-embedding-3-small | $0.00002            |
| Semantic Search       | text-embedding-3-small | $0.000001 per query |
| Content Moderation    | GPT-4o-mini            | $0.0002 - $0.0008   |

**Note**: Actual costs vary based on content length and complexity. Enable cost tracking in admin settings.

---

## Summarization Endpoints

### POST /api/ai/summarize

Generate intelligent summaries of messages using AI.

#### Request

**Method**: `POST`
**Path**: `/api/ai/summarize`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter                  | Type        | Required | Description                                                                              |
| -------------------------- | ----------- | -------- | ---------------------------------------------------------------------------------------- |
| `messages`                 | `Message[]` | Yes      | Array of messages to summarize (max 500)                                                 |
| `type`                     | `string`    | No       | Summary type: `brief`, `digest`, `thread`, `catchup`, `meeting-notes` (default: `brief`) |
| `options`                  | `object`    | No       | Summary options                                                                          |
| `options.style`            | `string`    | No       | Style: `brief`, `detailed`, `bullets` (default: `brief`)                                 |
| `options.maxLength`        | `number`    | No       | Max summary length in words (default: 100)                                               |
| `options.includeKeyPoints` | `boolean`   | No       | Include key discussion points (default: false)                                           |
| `meetingOptions`           | `object`    | No       | Meeting notes options (for `meeting-notes` type)                                         |

**Message Object**:

```typescript
{
  id: string
  content: string
  author_id: string
  author_name: string
  created_at: string (ISO 8601)
  channel_id?: string
  reactions?: Array<{ emoji: string, count: number }>
}
```

**Example Request**:

```json
{
  "messages": [
    {
      "id": "msg-1",
      "content": "Let's discuss the Q1 roadmap for our product.",
      "author_id": "user-123",
      "author_name": "Alice",
      "created_at": "2026-01-31T10:00:00Z"
    },
    {
      "id": "msg-2",
      "content": "I think we should focus on improving the search feature.",
      "author_id": "user-456",
      "author_name": "Bob",
      "created_at": "2026-01-31T10:05:00Z"
    }
  ],
  "type": "brief",
  "options": {
    "style": "bullets",
    "maxLength": 150,
    "includeKeyPoints": true
  }
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "summary": "Team discussion on Q1 roadmap:\n• Focus on search feature improvements\n• Alice initiated planning discussion\n• Bob suggested prioritization",
  "provider": "openai",
  "qualityScore": 0.92,
  "costInfo": {
    "totalCost": 0.00023,
    "requestCount": 1
  }
}
```

**Response Fields**:

| Field           | Type      | Description                                      |
| --------------- | --------- | ------------------------------------------------ |
| `success`       | `boolean` | Whether the request succeeded                    |
| `summary`       | `string`  | Generated summary text                           |
| `digest`        | `object`  | Full digest object (for `digest` type)           |
| `threadSummary` | `object`  | Thread summary details (for `thread` type)       |
| `provider`      | `string`  | AI provider used: `openai`, `anthropic`, `local` |
| `qualityScore`  | `number`  | Quality score 0-1 (brief type only)              |
| `costInfo`      | `object`  | Cost tracking information                        |

#### Errors

**400 Bad Request**:

```json
{
  "success": false,
  "error": "Invalid request: messages array required"
}
```

**400 Too Many Messages**:

```json
{
  "success": false,
  "error": "Too many messages. Maximum: 500"
}
```

**500 Internal Server Error**:

```json
{
  "success": false,
  "error": "Summarization failed"
}
```

#### Code Examples

**cURL**:

```bash
curl -X POST https://api.example.com/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [
      {
        "id": "msg-1",
        "content": "Project discussion content",
        "author_id": "user-123",
        "author_name": "Alice",
        "created_at": "2026-01-31T10:00:00Z"
      }
    ],
    "type": "brief",
    "options": { "style": "bullets" }
  }'
```

**JavaScript (fetch)**:

```javascript
const response = await fetch('/api/ai/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    messages: [
      {
        id: 'msg-1',
        content: 'Project discussion content',
        author_id: 'user-123',
        author_name: 'Alice',
        created_at: new Date().toISOString(),
      },
    ],
    type: 'brief',
    options: { style: 'bullets', maxLength: 100 },
  }),
})

const data = await response.json()
console.log('Summary:', data.summary)
```

**Python (requests)**:

```python
import requests
from datetime import datetime

response = requests.post(
    'https://api.example.com/api/ai/summarize',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'messages': [
            {
                'id': 'msg-1',
                'content': 'Project discussion content',
                'author_id': 'user-123',
                'author_name': 'Alice',
                'created_at': datetime.utcnow().isoformat() + 'Z'
            }
        ],
        'type': 'brief',
        'options': {'style': 'bullets', 'maxLength': 100}
    }
)

data = response.json()
print(f"Summary: {data['summary']}")
print(f"Cost: ${data['costInfo']['totalCost']}")
```

---

### POST /api/ai/digest

Generate comprehensive channel digests with activity summaries, key discussions, and trends.

#### Request

**Method**: `POST`
**Path**: `/api/ai/digest`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter               | Type        | Required | Description                                             |
| ----------------------- | ----------- | -------- | ------------------------------------------------------- |
| `channelId`             | `string`    | Yes      | Channel ID                                              |
| `messages`              | `Message[]` | Yes      | Messages to include in digest (max 1,000)               |
| `options`               | `object`    | No       | Digest options                                          |
| `options.period`        | `string`    | No       | Period: `daily`, `weekly`, `monthly` (default: `daily`) |
| `options.includeStats`  | `boolean`   | No       | Include message statistics (default: true)              |
| `options.includeTopics` | `boolean`   | No       | Extract discussion topics (default: true)               |
| `options.includeTrends` | `boolean`   | No       | Identify trending discussions (default: true)           |

**Example Request**:

```json
{
  "channelId": "channel-general",
  "messages": [
    {
      "id": "msg-1",
      "content": "We need to improve our deployment process",
      "author_id": "user-123",
      "author_name": "Alice",
      "created_at": "2026-01-31T09:00:00Z"
    }
  ],
  "options": {
    "period": "daily",
    "includeStats": true,
    "includeTopics": true,
    "includeTrends": true
  }
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "digest": {
    "summary": "Active day in #general with 24 messages from 8 participants...",
    "period": {
      "start": "2026-01-31T00:00:00Z",
      "end": "2026-01-31T23:59:59Z"
    },
    "stats": {
      "totalMessages": 24,
      "activeUsers": 8,
      "threadsStarted": 3,
      "reactions": 15
    },
    "keyTopics": [
      {
        "topic": "Deployment Process",
        "messageCount": 12,
        "participants": ["Alice", "Bob", "Charlie"]
      },
      {
        "topic": "Code Review",
        "messageCount": 8,
        "participants": ["David", "Eve"]
      }
    ],
    "highlights": [
      "Alice proposed new deployment automation",
      "Team agreed to implement CI/CD improvements",
      "Code review guidelines updated"
    ],
    "trends": {
      "mostActive": "Alice (8 messages)",
      "mostReacted": "Bob's deployment proposal (5 reactions)",
      "peakHours": ["10:00-11:00", "14:00-15:00"]
    }
  },
  "provider": "openai"
}
```

#### Errors

Same as `/api/ai/summarize` with additional:

**400 Missing Channel ID**:

```json
{
  "success": false,
  "error": "Invalid request: channelId required"
}
```

#### GET /api/ai/digest?channelId=xxx

Get digest schedule information for a channel.

**Response**:

```json
{
  "success": true,
  "provider": "openai",
  "available": true,
  "schedule": {
    "enabled": true,
    "nextRun": "2026-02-01T00:00:00Z",
    "frequency": "daily"
  }
}
```

---

### POST /api/ai/sentiment

Analyze sentiment and emotional tone of messages.

#### Request

**Method**: `POST`
**Path**: `/api/ai/sentiment`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter      | Type        | Required    | Description                                                    |
| -------------- | ----------- | ----------- | -------------------------------------------------------------- |
| `message`      | `Message`   | Conditional | Single message (required for `single` type)                    |
| `messages`     | `Message[]` | Conditional | Multiple messages (required for `trend`, `morale` types)       |
| `type`         | `string`    | No          | Analysis type: `single`, `trend`, `morale` (default: `single`) |
| `period`       | `object`    | Conditional | Time period (required for `morale` type)                       |
| `period.start` | `string`    | Yes         | Start date (ISO 8601)                                          |
| `period.end`   | `string`    | Yes         | End date (ISO 8601)                                            |
| `options`      | `object`    | No          | Analysis options                                               |

**Example Requests**:

**Single Message Sentiment**:

```json
{
  "message": {
    "id": "msg-1",
    "content": "Great job on the release! Everything went smoothly.",
    "author_id": "user-123",
    "author_name": "Alice",
    "created_at": "2026-01-31T10:00:00Z"
  },
  "type": "single"
}
```

**Sentiment Trend Analysis**:

```json
{
  "messages": [
    /* array of messages */
  ],
  "type": "trend"
}
```

**Team Morale Report**:

```json
{
  "messages": [
    /* array of messages */
  ],
  "type": "morale",
  "period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-31T23:59:59Z"
  }
}
```

#### Response

**Single Sentiment (200 OK)**:

```json
{
  "success": true,
  "result": {
    "sentiment": "positive",
    "score": 0.87,
    "confidence": 0.92,
    "emotions": {
      "joy": 0.75,
      "trust": 0.63,
      "anticipation": 0.42
    },
    "tone": "enthusiastic",
    "keywords": ["great", "smoothly", "job"]
  },
  "provider": "anthropic"
}
```

**Sentiment Trend (200 OK)**:

```json
{
  "success": true,
  "trend": {
    "overall": "improving",
    "averageScore": 0.68,
    "timeline": [
      { "date": "2026-01-29", "score": 0.55, "sentiment": "mixed" },
      { "date": "2026-01-30", "score": 0.65, "sentiment": "positive" },
      { "date": "2026-01-31", "score": 0.82, "sentiment": "positive" }
    ],
    "shifts": [
      {
        "timestamp": "2026-01-30T14:00:00Z",
        "from": "mixed",
        "to": "positive",
        "trigger": "Product launch success"
      }
    ]
  },
  "provider": "anthropic"
}
```

**Team Morale Report (200 OK)**:

```json
{
  "success": true,
  "moraleReport": {
    "overall": "positive",
    "score": 7.2,
    "trend": "improving",
    "breakdown": {
      "positive": 65,
      "neutral": 25,
      "negative": 10
    },
    "topPositiveTopics": ["Product launch", "Team collaboration", "Feature releases"],
    "concerns": ["Deployment complexity", "Meeting frequency"],
    "recommendations": [
      "Continue current momentum on product releases",
      "Address deployment process concerns raised by team"
    ]
  },
  "provider": "anthropic"
}
```

#### Errors

**400 Invalid Type**:

```json
{
  "success": false,
  "error": "Invalid type. Must be: single, trend, or morale"
}
```

**400 Missing Period**:

```json
{
  "success": false,
  "error": "Period required for morale report"
}
```

---

## Search Endpoints

### POST /api/ai/search

Perform AI-powered semantic search across messages using embeddings.

#### Request

**Method**: `POST`
**Path**: `/api/ai/search`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter                | Type                  | Required | Description                                   |
| ------------------------ | --------------------- | -------- | --------------------------------------------- |
| `query`                  | `string`              | Yes      | Search query (min 2 chars, max 200 chars)     |
| `messages`               | `SearchableMessage[]` | Yes      | Messages to search (max 10,000)               |
| `options`                | `object`              | No       | Search options                                |
| `options.limit`          | `number`              | No       | Max results to return (default: 20)           |
| `options.threshold`      | `number`              | No       | Similarity threshold 0-1 (default: 0.7)       |
| `options.includeContext` | `boolean`             | No       | Include surrounding messages (default: false) |

**SearchableMessage Object**:

```typescript
{
  id: string
  content: string
  author_id: string
  author_name: string
  channel_id: string
  created_at: string
  embedding?: number[] // Pre-computed embedding
}
```

**Example Request**:

```json
{
  "query": "deployment issues",
  "messages": [
    {
      "id": "msg-1",
      "content": "The deployment failed due to missing environment variables",
      "author_id": "user-123",
      "author_name": "Alice",
      "channel_id": "channel-dev",
      "created_at": "2026-01-31T10:00:00Z"
    }
  ],
  "options": {
    "limit": 10,
    "threshold": 0.75,
    "includeContext": true
  }
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "results": [
    {
      "message": {
        "id": "msg-1",
        "content": "The deployment failed due to missing environment variables",
        "author_id": "user-123",
        "author_name": "Alice",
        "channel_id": "channel-dev",
        "created_at": "2026-01-31T10:00:00Z"
      },
      "similarity": 0.92,
      "rank": 1,
      "context": [
        {
          "id": "msg-0",
          "content": "Starting deployment to production",
          "position": "before"
        }
      ]
    }
  ],
  "count": 1,
  "provider": "openai",
  "isSemanticSearch": true
}
```

**Response Fields**:

| Field              | Type             | Description                                  |
| ------------------ | ---------------- | -------------------------------------------- |
| `results`          | `SearchResult[]` | Array of search results ranked by similarity |
| `count`            | `number`         | Number of results returned                   |
| `provider`         | `string`         | Search provider: `openai`, `local`           |
| `isSemanticSearch` | `boolean`        | Whether semantic search was used             |

#### Errors

**400 Query Too Short**:

```json
{
  "success": false,
  "error": "Query too short. Minimum 2 characters required."
}
```

**400 Too Many Messages**:

```json
{
  "success": false,
  "error": "Too many messages to search. Maximum: 10000"
}
```

---

### POST /api/ai/embed

Generate embeddings for text content in batch.

#### Request

**Method**: `POST`
**Path**: `/api/ai/embed`
**Content-Type**: `application/json`
**Max Duration**: 60 seconds

**Body Parameters**:

| Parameter | Type       | Required | Description                                         |
| --------- | ---------- | -------- | --------------------------------------------------- |
| `texts`   | `string[]` | Yes      | Array of texts to embed (max 100)                   |
| `model`   | `string`   | No       | Embedding model (default: `text-embedding-3-small`) |

**Constraints**:

- Maximum batch size: 100 texts
- Maximum text length: 8,000 characters per text
- Empty strings not allowed

**Example Request**:

```json
{
  "texts": [
    "The deployment completed successfully",
    "We need to review the code changes",
    "Great work on the new feature"
  ],
  "model": "text-embedding-3-small"
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "embeddings": [
    [0.123, -0.456, 0.789 /* ... 1536 dimensions */],
    [-0.234, 0.567, -0.89 /* ... 1536 dimensions */],
    [0.345, -0.678, 0.901 /* ... 1536 dimensions */]
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "promptTokens": 24,
    "totalTokens": 24
  },
  "cached": 1,
  "generated": 2
}
```

**Response Fields**:

| Field        | Type         | Description                                  |
| ------------ | ------------ | -------------------------------------------- |
| `embeddings` | `number[][]` | Array of embedding vectors (1536 dimensions) |
| `model`      | `string`     | Model used for generation                    |
| `usage`      | `object`     | Token usage information                      |
| `cached`     | `number`     | Number of embeddings served from cache       |
| `generated`  | `number`     | Number of embeddings newly generated         |

#### GET /api/ai/embed

Get embedding service status and statistics.

**Response**:

```json
{
  "success": true,
  "available": true,
  "model": {
    "name": "text-embedding-3-small",
    "provider": "openai",
    "dimensions": 1536,
    "maxTokens": 8191
  },
  "stats": {
    "cacheSize": 15234,
    "cacheHits": 8521,
    "cacheMisses": 3421,
    "totalRequests": 11942,
    "totalTokens": 285408,
    "totalCost": 0.0057,
    "hitRate": 71
  }
}
```

#### Errors

**400 Invalid Text**:

```json
{
  "success": false,
  "error": "Text at index 2 is too long. Maximum: 8000 characters"
}
```

**400 Batch Too Large**:

```json
{
  "success": false,
  "error": "Batch size too large. Maximum: 100"
}
```

**503 Service Unavailable**:

```json
{
  "success": false,
  "error": "Embedding service not available. Please configure OpenAI API key."
}
```

---

### GET /api/search/suggestions

Get autocomplete suggestions based on search history.

#### Request

**Method**: `GET`
**Path**: `/api/search/suggestions`

**Query Parameters**:

| Parameter | Type     | Required | Description                            |
| --------- | -------- | -------- | -------------------------------------- |
| `q`       | `string` | No       | Partial query to match (default: `""`) |
| `limit`   | `number` | No       | Max suggestions (1-50, default: 10)    |
| `userId`  | `string` | No       | User ID for personalized suggestions   |

**Example Request**:

```
GET /api/search/suggestions?q=deploy&limit=5&userId=user-123
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "suggestions": [
    {
      "query": "deployment issues",
      "count": 24,
      "lastUsed": "2026-01-31T14:30:00Z"
    },
    {
      "query": "deploy to production",
      "count": 18,
      "lastUsed": "2026-01-30T09:15:00Z"
    },
    {
      "query": "deployment process",
      "count": 12,
      "lastUsed": "2026-01-29T16:45:00Z"
    }
  ]
}
```

#### Errors

**400 Invalid Limit**:

```json
{
  "success": false,
  "error": "Limit must be between 1 and 50"
}
```

---

## Moderation Endpoints

### POST /api/moderation/analyze

Analyze content with AI-powered moderation using multiple detection models.

#### Request

**Method**: `POST`
**Path**: `/api/moderation/analyze`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter              | Type      | Required | Description                                                                    |
| ---------------------- | --------- | -------- | ------------------------------------------------------------------------------ |
| `contentId`            | `string`  | Yes      | Unique content identifier                                                      |
| `content`              | `string`  | Yes      | Content to analyze                                                             |
| `contentType`          | `string`  | No       | Type: `text`, `image`, `video`, `file`, `profile`, `channel` (default: `text`) |
| `metadata`             | `object`  | No       | Additional metadata                                                            |
| `metadata.userId`      | `string`  | No       | User ID (for violation tracking)                                               |
| `metadata.channelId`   | `string`  | No       | Channel ID                                                                     |
| `policy`               | `object`  | No       | Custom moderation policy                                                       |
| `enableToxicity`       | `boolean` | No       | Enable toxicity detection (default: true)                                      |
| `enableSpam`           | `boolean` | No       | Enable spam detection (default: true)                                          |
| `enableClassification` | `boolean` | No       | Enable content classification (default: true)                                  |

**Example Request**:

```json
{
  "contentId": "msg-123",
  "content": "This is a test message for moderation",
  "contentType": "text",
  "metadata": {
    "userId": "user-456",
    "channelId": "channel-general"
  },
  "enableToxicity": true,
  "enableSpam": true,
  "enableClassification": true
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "analysis": {
    "shouldFlag": false,
    "riskScore": 0.12,
    "priority": "low",
    "detectedIssues": [],
    "categories": {
      "toxicity": 0.05,
      "spam": 0.02,
      "profanity": 0.01,
      "nsfw": 0.03
    },
    "recommendedAction": "approve",
    "autoAction": "none",
    "confidence": 0.94
  },
  "toxicityAnalysis": {
    "isToxic": false,
    "score": 0.05,
    "categories": {
      "hate": 0.01,
      "harassment": 0.02,
      "violence": 0.01,
      "sexual": 0.01
    }
  },
  "spamAnalysis": {
    "isSpam": false,
    "score": 0.02,
    "indicators": []
  },
  "classification": {
    "category": "general_discussion",
    "subcategory": "casual",
    "confidence": 0.87,
    "tags": ["conversation", "team"]
  }
}
```

**Flagged Content (200 OK)**:

```json
{
  "success": true,
  "analysis": {
    "shouldFlag": true,
    "riskScore": 0.89,
    "priority": "high",
    "detectedIssues": [
      {
        "type": "profanity",
        "severity": "medium",
        "confidence": 0.92,
        "details": "Contains offensive language"
      },
      {
        "type": "toxicity",
        "severity": "high",
        "confidence": 0.87,
        "details": "Potentially harmful content detected"
      }
    ],
    "categories": {
      "toxicity": 0.87,
      "spam": 0.15,
      "profanity": 0.92,
      "nsfw": 0.23
    },
    "recommendedAction": "flag",
    "autoAction": "hide",
    "confidence": 0.9
  },
  "toxicityAnalysis": {
    /* ... */
  },
  "spamAnalysis": {
    /* ... */
  },
  "classification": {
    /* ... */
  }
}
```

#### GET /api/moderation/analyze

Get current moderation policy configuration.

**Response**:

```json
{
  "success": true,
  "policy": {
    "toxicityThreshold": 0.7,
    "spamThreshold": 0.6,
    "profanityAction": "flag",
    "nsfwAction": "hide",
    "autoModeration": true
  },
  "toxicityConfig": {
    /* ... */
  },
  "spamConfig": {
    /* ... */
  },
  "classifierConfig": {
    /* ... */
  }
}
```

#### PUT /api/moderation/analyze

Update moderation policy configuration.

**Request**:

```json
{
  "policy": {
    "toxicityThreshold": 0.8,
    "autoModeration": true
  },
  "toxicityConfig": {
    /* ... */
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "Policy updated successfully"
}
```

---

### POST /api/moderation/batch

Process multiple content items in parallel for efficient bulk moderation.

#### Request

**Method**: `POST`
**Path**: `/api/moderation/batch`
**Content-Type**: `application/json`
**Max Duration**: 60 seconds

**Body Parameters**:

| Parameter        | Type          | Required | Description                             |
| ---------------- | ------------- | -------- | --------------------------------------- |
| `items`          | `BatchItem[]` | Yes      | Array of items to moderate (max 100)    |
| `policy`         | `object`      | No       | Custom moderation policy                |
| `maxConcurrency` | `number`      | No       | Max concurrent processing (default: 10) |

**BatchItem Object**:

```typescript
{
  contentId: string
  contentType: 'text' | 'image' | 'video' | 'file' | 'profile' | 'channel'
  content: string
  metadata?: any
}
```

**Example Request**:

```json
{
  "items": [
    {
      "contentId": "msg-1",
      "contentType": "text",
      "content": "First message content",
      "metadata": { "userId": "user-123" }
    },
    {
      "contentId": "msg-2",
      "contentType": "text",
      "content": "Second message content",
      "metadata": { "userId": "user-456" }
    }
  ],
  "maxConcurrency": 5
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "stats": {
    "total": 2,
    "success": 2,
    "failure": 0,
    "flagged": 0,
    "highPriority": 0,
    "processingTime": 1245,
    "avgProcessingTime": 622.5
  },
  "results": [
    {
      "contentId": "msg-1",
      "success": true,
      "analysis": {
        /* ... */
      },
      "processingTime": 584
    },
    {
      "contentId": "msg-2",
      "success": true,
      "analysis": {
        /* ... */
      },
      "processingTime": 661
    }
  ]
}
```

**With Errors (200 OK)**:

```json
{
  "success": true,
  "stats": {
    "total": 2,
    "success": 1,
    "failure": 1,
    "flagged": 0,
    "highPriority": 0,
    "processingTime": 1180,
    "avgProcessingTime": 590
  },
  "results": [
    {
      "contentId": "msg-1",
      "success": true,
      "analysis": {
        /* ... */
      },
      "processingTime": 620
    },
    {
      "contentId": "msg-2",
      "success": false,
      "error": "Content too long",
      "processingTime": 560
    }
  ],
  "errors": ["msg-2: Content too long"]
}
```

#### Errors

**400 Invalid Request**:

```json
{
  "error": "Items array is required"
}
```

**400 Batch Too Large**:

```json
{
  "error": "Maximum batch size is 100 items"
}
```

---

### POST /api/moderation/actions

Take moderation actions on content or users.

#### Request

**Method**: `POST`
**Path**: `/api/moderation/actions`
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter      | Type       | Required    | Description                                                                                                    |
| -------------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `action`       | `string`   | Yes         | Action type: `flag`, `hide`, `delete`, `warn`, `mute`, `unmute`, `ban`, `unban`, `approve`, `reject`, `appeal` |
| `itemId`       | `string`   | Conditional | Queue item ID (for approve/reject/appeal)                                                                      |
| `moderatorId`  | `string`   | Conditional | Moderator user ID (required for manual actions)                                                                |
| `reason`       | `string`   | No          | Action reason                                                                                                  |
| `targetType`   | `string`   | Conditional | Target type for flag/hide/delete                                                                               |
| `targetId`     | `string`   | Conditional | Target ID for flag/hide/delete                                                                                 |
| `targetUserId` | `string`   | Conditional | Target user ID                                                                                                 |
| `duration`     | `number`   | No          | Duration in minutes (for mute/ban)                                                                             |
| `bulk`         | `object[]` | No          | Bulk action targets                                                                                            |
| `appealText`   | `string`   | Conditional | Appeal text (for appeal action)                                                                                |

**Action Types**:

| Action    | Description             | Required Fields                                      |
| --------- | ----------------------- | ---------------------------------------------------- |
| `flag`    | Flag content for review | `targetType`, `targetId`, `targetUserId`             |
| `hide`    | Hide content from view  | `targetType`, `targetId`, `targetUserId`             |
| `delete`  | Delete content          | `targetType`, `targetId`, `targetUserId`             |
| `warn`    | Warn user               | `moderatorId`, `targetUserId`                        |
| `mute`    | Mute user               | `moderatorId`, `targetUserId`, `duration` (optional) |
| `unmute`  | Unmute user             | `moderatorId`, `targetUserId`                        |
| `ban`     | Ban user                | `moderatorId`, `targetUserId`, `duration` (optional) |
| `unban`   | Unban user              | `moderatorId`, `targetUserId`                        |
| `approve` | Approve flagged content | `moderatorId`, `itemId`                              |
| `reject`  | Reject flagged content  | `moderatorId`, `itemId`                              |
| `appeal`  | Submit appeal           | `itemId`, `appealText`                               |

**Example Requests**:

**Flag Content**:

```json
{
  "action": "flag",
  "targetType": "message",
  "targetId": "msg-123",
  "targetUserId": "user-456",
  "moderatorId": "moderator-789",
  "reason": "Inappropriate language"
}
```

**Mute User (Temporary)**:

```json
{
  "action": "mute",
  "targetUserId": "user-456",
  "moderatorId": "moderator-789",
  "reason": "Spam violation",
  "duration": 1440
}
```

**Bulk Action**:

```json
{
  "action": "hide",
  "moderatorId": "moderator-789",
  "reason": "Coordinated spam attack",
  "bulk": [
    { "targetType": "message", "targetId": "msg-1", "targetUserId": "user-1" },
    { "targetType": "message", "targetId": "msg-2", "targetUserId": "user-2" }
  ]
}
```

#### Response

**Single Action (200 OK)**:

```json
{
  "success": true,
  "actionId": "action-abc123",
  "message": "Content flagged successfully",
  "affectedItems": 1
}
```

**Bulk Action (200 OK)**:

```json
{
  "success": true,
  "stats": {
    "total": 2,
    "success": 2,
    "failure": 0
  },
  "results": [
    {
      "targetId": "msg-1",
      "success": true,
      "actionId": "action-abc123"
    },
    {
      "targetId": "msg-2",
      "success": true,
      "actionId": "action-def456"
    }
  ]
}
```

#### GET /api/moderation/actions

Get moderation action audit log.

**Response**:

```json
{
  "success": true,
  "auditLog": [
    {
      "id": "action-abc123",
      "action": "flag",
      "moderatorId": "moderator-789",
      "targetType": "message",
      "targetId": "msg-123",
      "reason": "Inappropriate language",
      "timestamp": "2026-01-31T14:30:00Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/moderation/stats

Get comprehensive moderation analytics and statistics.

#### Request

**Method**: `GET`
**Path**: `/api/moderation/stats`

**Query Parameters**:

| Parameter   | Type     | Required | Description                                             |
| ----------- | -------- | -------- | ------------------------------------------------------- |
| `period`    | `string` | No       | Period: `1d`, `7d`, `30d`, `90d`, `all` (default: `7d`) |
| `startDate` | `string` | No       | Custom start date (ISO 8601)                            |
| `endDate`   | `string` | No       | Custom end date (ISO 8601)                              |

**Example Request**:

```
GET /api/moderation/stats?period=30d
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-31T23:59:59Z",
    "label": "30d"
  },
  "metrics": {
    "totalFlagged": 145,
    "pendingReview": 12,
    "highPriority": 3,
    "totalActions": 133,
    "automatedActions": 98,
    "manualActions": 35,
    "avgResponseTime": 1847,
    "flaggedRate": 0.023
  },
  "queueStats": {
    "total": 145,
    "byStatus": {
      "pending": 12,
      "reviewing": 2,
      "approved": 78,
      "rejected": 51,
      "auto_resolved": 2
    },
    "byPriority": {
      "low": 42,
      "medium": 78,
      "high": 23,
      "critical": 2
    },
    "byAutoAction": {
      "none": 47,
      "flagged": 35,
      "hidden": 42,
      "warned": 18,
      "muted": 2,
      "deleted": 1
    }
  },
  "actionStats": {
    "total": 133,
    "byType": {
      "flagged": 35,
      "approved": 78,
      "rejected": 51,
      "deleted": 1,
      "warned": 18,
      "muted": 2,
      "banned": 0,
      "appealed": 3
    },
    "automatedCount": 98,
    "manualCount": 35,
    "aiCount": 87,
    "ruleBasedCount": 11
  },
  "topViolators": [
    {
      "user_id": "user-123",
      "total_violations": 12,
      "toxic_violations": 8,
      "nsfw_violations": 0,
      "spam_violations": 4,
      "profanity_violations": 6,
      "trust_score": 0.45,
      "warnings_received": 3,
      "mutes_received": 1,
      "bans_received": 0
    }
  ],
  "responseTimeDistribution": {
    "under1h": 45,
    "under6h": 78,
    "under24h": 18,
    "over24h": 4
  },
  "violationTrends": {
    "toxicity": [
      /* daily data points */
    ],
    "spam": [
      /* daily data points */
    ],
    "profanity": [
      /* daily data points */
    ],
    "nsfw": [
      /* daily data points */
    ]
  },
  "topCategories": [
    { "category": "profanity", "count": 68 },
    { "category": "toxicity", "count": 45 },
    { "category": "spam", "count": 32 }
  ],
  "autoActionEffectiveness": {
    "accuracy": 0.89,
    "falsePositiveRate": 0.07,
    "falseNegativeRate": 0.04,
    "precision": 0.93,
    "recall": 0.96
  }
}
```

---

## Admin Endpoints

### GET /api/admin/ai/usage

Get AI usage statistics for monitoring and billing.

#### Request

**Method**: `GET`
**Path**: `/api/admin/ai/usage`
**Authentication**: Admin role required

**Query Parameters**:

| Parameter | Type     | Required | Description                                             |
| --------- | -------- | -------- | ------------------------------------------------------- |
| `userId`  | `string` | No       | Filter by user ID                                       |
| `orgId`   | `string` | No       | Filter by organization ID                               |
| `period`  | `string` | No       | Period: `daily`, `weekly`, `monthly` (default: `daily`) |
| `date`    | `string` | No       | Target date (ISO 8601, default: today)                  |

**Example Request**:

```
GET /api/admin/ai/usage?period=monthly&date=2026-01-01
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "usage": {
      "requests": 1245,
      "totalTokens": 485920,
      "promptTokens": 245680,
      "completionTokens": 240240,
      "totalCost": 9.72,
      "byModel": {
        "gpt-4o-mini": {
          "requests": 892,
          "tokens": 345680,
          "cost": 6.91
        },
        "claude-3-5-haiku-20241022": {
          "requests": 353,
          "tokens": 140240,
          "cost": 2.81
        }
      },
      "byFeature": {
        "summarization": {
          "requests": 456,
          "cost": 3.65
        },
        "search": {
          "requests": 678,
          "cost": 2.71
        },
        "moderation": {
          "requests": 111,
          "cost": 3.36
        }
      }
    },
    "queues": [
      {
        "name": "summarization",
        "metrics": {
          "pending": 5,
          "processing": 2,
          "completed": 456,
          "failed": 3,
          "avgWaitTime": 234,
          "avgProcessingTime": 1847
        }
      }
    ],
    "cache": {
      "summarization": {
        "size": 1245,
        "hits": 892,
        "misses": 353,
        "hitRate": 0.72
      },
      "search": {
        "size": 3421,
        "hits": 2156,
        "misses": 1265,
        "hitRate": 0.63
      },
      "embeddings": {
        "size": 15234,
        "hits": 8521,
        "misses": 6713,
        "hitRate": 0.56
      }
    },
    "period": "monthly",
    "date": "2026-01-01T00:00:00Z"
  }
}
```

---

### GET /api/admin/ai/costs

Get detailed cost analysis and breakdowns.

#### Request

**Method**: `GET`
**Path**: `/api/admin/ai/costs`
**Authentication**: Admin role required

**Query Parameters**:

| Parameter   | Type     | Required | Description               |
| ----------- | -------- | -------- | ------------------------- |
| `userId`    | `string` | No       | Filter by user ID         |
| `orgId`     | `string` | No       | Filter by organization ID |
| `startDate` | `string` | Yes      | Start date (ISO 8601)     |
| `endDate`   | `string` | Yes      | End date (ISO 8601)       |

**Example Request**:

```
GET /api/admin/ai/costs?startDate=2026-01-01&endDate=2026-01-31
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCost": 287.45,
      "totalRequests": 38542,
      "avgCostPerRequest": 0.00746,
      "byDay": [
        {
          "date": "2026-01-01",
          "cost": 8.92,
          "requests": 1245
        }
      ],
      "byModel": {
        "gpt-4o-mini": {
          "cost": 189.23,
          "requests": 27841,
          "avgCostPerRequest": 0.0068
        },
        "claude-3-5-haiku-20241022": {
          "cost": 98.22,
          "requests": 10701,
          "avgCostPerRequest": 0.0092
        }
      },
      "byFeature": {
        "summarization": 125.67,
        "search": 89.34,
        "moderation": 72.44
      }
    },
    "topUsers": [
      {
        "userId": "user-123",
        "userName": "Alice Developer",
        "totalCost": 45.23,
        "requests": 5842,
        "topFeature": "summarization"
      }
    ],
    "pricing": {
      "gpt-4o-mini": {
        "input": 0.00015,
        "output": 0.0006
      },
      "claude-3-5-haiku-20241022": {
        "input": 0.00025,
        "output": 0.00125
      },
      "text-embedding-3-small": {
        "input": 0.00002,
        "output": 0
      }
    },
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-31T23:59:59Z"
    }
  }
}
```

---

### GET /api/admin/ai/config

Get current AI configuration.

#### Request

**Method**: `GET`
**Path**: `/api/admin/ai/config`
**Authentication**: Admin role required

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "openai": {
      "enabled": true,
      "apiKey": "sk-...xyz",
      "organization": "org-...",
      "defaultModel": "gpt-4o-mini",
      "fallbackModel": "gpt-3.5-turbo",
      "timeout": 60000,
      "maxRetries": 3
    },
    "anthropic": {
      "enabled": true,
      "apiKey": "sk-...abc",
      "defaultModel": "claude-3-5-haiku-20241022",
      "fallbackModel": "claude-3-haiku-20240307",
      "timeout": 60000,
      "maxRetries": 3
    },
    "rateLimits": {
      "summarize": {
        "userMaxRequests": 50,
        "userWindowMs": 3600000,
        "orgMaxRequests": 500,
        "orgWindowMs": 3600000
      },
      "search": {
        "userMaxRequests": 20,
        "userWindowMs": 60000,
        "orgMaxRequests": 1000,
        "orgWindowMs": 3600000
      },
      "chat": {
        "userMaxRequests": 10,
        "userWindowMs": 60000,
        "orgMaxRequests": 1000,
        "orgWindowMs": 3600000
      }
    },
    "cache": {
      "enabled": true,
      "summarizationTtl": 1800,
      "searchTtl": 3600,
      "chatTtl": 300,
      "embeddingsTtl": 7200
    },
    "budgets": {
      "dailyLimit": 100,
      "monthlyLimit": 1000,
      "alertThresholds": [50, 75, 90, 100]
    }
  }
}
```

---

### POST /api/admin/ai/config

Update AI configuration settings.

#### Request

**Method**: `POST`
**Path**: `/api/admin/ai/config`
**Authentication**: Admin role required
**Content-Type**: `application/json`

**Body Parameters**: Partial `AIConfig` object (see GET response for full schema)

**Example Request**:

```json
{
  "openai": {
    "defaultModel": "gpt-4o",
    "timeout": 90000
  },
  "rateLimits": {
    "summarize": {
      "userMaxRequests": 100
    }
  },
  "budgets": {
    "dailyLimit": 200,
    "monthlyLimit": 2000
  }
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    /* updated config */
  },
  "message": "AI configuration updated successfully"
}
```

---

### GET /api/admin/embeddings/stats

Get comprehensive embedding generation statistics.

#### Request

**Method**: `GET`
**Path**: `/api/admin/embeddings/stats`
**Authentication**: Admin role required

**Query Parameters**:

| Parameter | Type     | Required | Description                             |
| --------- | -------- | -------- | --------------------------------------- |
| `days`    | `number` | No       | Number of days to include (default: 30) |

**Example Request**:

```
GET /api/admin/embeddings/stats?days=90
```

#### Response

**Success (200 OK)**:

```json
{
  "coverage": {
    "totalMessages": 125842,
    "messagesWithEmbeddings": 118956,
    "coveragePercentage": 94.5,
    "pendingEmbeddings": 6886,
    "failedEmbeddings": 34,
    "oldestUnembeddedMessage": "2026-01-15T09:23:00Z"
  },
  "indexHealth": {
    "indexName": "nchat_message_embeddings",
    "indexSize": 1458920,
    "totalVectors": 118956,
    "indexEfficiency": 0.97
  },
  "performance": {
    "totalEmbeddings": 118956,
    "totalTokens": 4758240,
    "totalCost": "0.0952",
    "avgCostPerEmbedding": "0.000001",
    "cacheHitRate": "71.23",
    "errorRate": "0.03"
  },
  "queue": {
    "pending": 6886,
    "processing": 42,
    "failed": 34
  },
  "cache": {
    "totalEntries": 118956,
    "totalUsage": 847251,
    "recentlyUsed": 45678,
    "avgUsagePerEntry": 7
  },
  "dailyStats": [
    {
      "date": "2026-01-31",
      "model": "text-embedding-3-small",
      "total_embeddings": 3842,
      "total_tokens": 153680,
      "estimated_cost": "0.0031",
      "avg_processing_time_ms": 234,
      "cache_hit_count": 2156,
      "cache_miss_count": 1686,
      "error_count": 2
    }
  ]
}
```

---

### POST /api/admin/embeddings/generate

Start bulk embedding generation job.

#### Request

**Method**: `POST`
**Path**: `/api/admin/embeddings/generate`
**Authentication**: Admin role required
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter | Type     | Required | Description                                                   |
| --------- | -------- | -------- | ------------------------------------------------------------- |
| `userId`  | `string` | No       | User to run job as                                            |
| `type`    | `string` | No       | Job type: `initial`, `reindex`, `repair` (default: `initial`) |

**Example Request**:

```json
{
  "type": "initial",
  "userId": "admin-123"
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "jobId": "job-abc123def456",
  "message": "Embedding generation job started (type: initial)"
}
```

---

### GET /api/admin/embeddings/status

Get status of embedding generation jobs.

#### Request

**Method**: `GET`
**Path**: `/api/admin/embeddings/status`
**Authentication**: Admin role required

**Query Parameters**:

| Parameter | Type     | Required | Description                                |
| --------- | -------- | -------- | ------------------------------------------ |
| `jobId`   | `string` | No       | Specific job ID (omit for all recent jobs) |
| `limit`   | `number` | No       | Max jobs to return (default: 10)           |

**Example Requests**:

```
GET /api/admin/embeddings/status?jobId=job-abc123def456
GET /api/admin/embeddings/status?limit=20
```

#### Response

**Single Job (200 OK)**:

```json
{
  "job": {
    "id": "job-abc123def456",
    "job_type": "initial",
    "status": "running",
    "total_messages": 125842,
    "processed_messages": 45678,
    "successful_embeddings": 45632,
    "failed_embeddings": 46,
    "error_message": null,
    "started_at": "2026-01-31T10:00:00Z",
    "completed_at": null,
    "created_at": "2026-01-31T09:58:00Z",
    "updated_at": "2026-01-31T14:23:00Z",
    "metadata": {},
    "percentage": 36,
    "estimatedTimeRemaining": 15480000
  }
}
```

**All Jobs (200 OK)**:

```json
{
  "jobs": [
    {
      "id": "job-abc123def456",
      "job_type": "initial",
      "status": "running",
      "total_messages": 125842,
      "processed_messages": 45678,
      "successful_embeddings": 45632,
      "failed_embeddings": 46,
      "started_at": "2026-01-31T10:00:00Z",
      "completed_at": null,
      "created_at": "2026-01-31T09:58:00Z"
    }
  ]
}
```

---

### POST /api/admin/embeddings/cancel

Cancel a running embedding generation job.

#### Request

**Method**: `POST`
**Path**: `/api/admin/embeddings/cancel`
**Authentication**: Admin role required
**Content-Type**: `application/json`

**Body Parameters**:

| Parameter | Type     | Required | Description      |
| --------- | -------- | -------- | ---------------- |
| `jobId`   | `string` | Yes      | Job ID to cancel |

**Example Request**:

```json
{
  "jobId": "job-abc123def456"
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "message": "Job cancelled successfully",
  "job": {
    "id": "job-abc123def456",
    "status": "cancelled",
    "completed_at": "2026-01-31T14:30:00Z"
  }
}
```

**404 Not Found**:

```json
{
  "error": "Job not found"
}
```

---

## Error Codes

Standard HTTP status codes and error responses:

| Code | Name                  | Description                       |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Request successful                |
| 400  | Bad Request           | Invalid request parameters        |
| 401  | Unauthorized          | Missing or invalid authentication |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource not found                |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server-side error                 |
| 503  | Service Unavailable   | AI service unavailable            |

**Error Response Format**:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

**Common Error Codes**:

| Code                       | Description                     |
| -------------------------- | ------------------------------- |
| `MISSING_QUERY`            | Search query parameter missing  |
| `QUERY_TOO_SHORT`          | Query below minimum length      |
| `VALIDATION_ERROR`         | Request validation failed       |
| `RATE_LIMIT_EXCEEDED`      | Too many requests               |
| `SERVICE_UNAVAILABLE`      | AI provider unavailable         |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `INVALID_JSON`             | Request body is not valid JSON  |

---

## Code Examples

### Complete Summarization Workflow

**TypeScript/React Hook**:

```typescript
import { useState } from 'react'

interface Message {
  id: string
  content: string
  author_id: string
  author_name: string
  created_at: string
}

export function useSummarize() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summarize = async (messages: Message[], type: 'brief' | 'digest' = 'brief') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          type,
          options: {
            style: 'bullets',
            maxLength: 150,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      return data.summary
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { summarize, loading, error }
}
```

### Semantic Search with Caching

**Python Implementation**:

```python
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import hashlib
import json

class SemanticSearch:
    def __init__(self, api_base: str, api_key: str):
        self.api_base = api_base
        self.api_key = api_key
        self.cache: Dict[str, any] = {}
        self.cache_ttl = timedelta(hours=1)

    def _cache_key(self, query: str, options: dict) -> str:
        """Generate cache key from query and options."""
        data = json.dumps({'query': query, 'options': options}, sort_keys=True)
        return hashlib.md5(data.encode()).hexdigest()

    def search(
        self,
        query: str,
        messages: List[dict],
        threshold: float = 0.7,
        limit: int = 20
    ) -> List[dict]:
        """Perform semantic search with caching."""
        options = {'threshold': threshold, 'limit': limit}
        cache_key = self._cache_key(query, options)

        # Check cache
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                print(f"Cache hit for query: {query}")
                return cached_data

        # Make API request
        response = requests.post(
            f'{self.api_base}/api/ai/search',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            },
            json={
                'query': query,
                'messages': messages,
                'options': options
            }
        )

        response.raise_for_status()
        data = response.json()

        if not data['success']:
            raise Exception(data['error'])

        results = data['results']

        # Cache results
        self.cache[cache_key] = (results, datetime.now())

        return results

# Usage
search = SemanticSearch(
    api_base='https://api.example.com',
    api_key='your-api-key'
)

messages = [
    {
        'id': 'msg-1',
        'content': 'We fixed the deployment bug yesterday',
        'author_id': 'user-1',
        'author_name': 'Alice',
        'channel_id': 'dev',
        'created_at': datetime.utcnow().isoformat() + 'Z'
    }
]

results = search.search(
    query='deployment issues',
    messages=messages,
    threshold=0.75,
    limit=10
)

for result in results:
    print(f"Match ({result['similarity']:.2f}): {result['message']['content']}")
```

### Batch Moderation with Retry Logic

**Node.js/Express**:

```javascript
const axios = require('axios')

class ModerationClient {
  constructor(apiBase, apiKey) {
    this.apiBase = apiBase
    this.apiKey = apiKey
    this.maxRetries = 3
  }

  async analyzeBatch(items, options = {}) {
    const { maxConcurrency = 10, retryDelay = 1000 } = options

    let attempt = 0

    while (attempt < this.maxRetries) {
      try {
        const response = await axios.post(
          `${this.apiBase}/api/moderation/batch`,
          {
            items,
            maxConcurrency,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 60000,
          }
        )

        if (!response.data.success) {
          throw new Error(response.data.error || 'Batch moderation failed')
        }

        return response.data
      } catch (error) {
        attempt++

        if (attempt >= this.maxRetries) {
          throw error
        }

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1)
        console.log(`Retry ${attempt}/${this.maxRetries} after ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  async processQueue(messages, batchSize = 50) {
    const items = messages.map((msg) => ({
      contentId: msg.id,
      contentType: 'text',
      content: msg.content,
      metadata: {
        userId: msg.author_id,
        channelId: msg.channel_id,
      },
    }))

    const results = []

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      console.log(`Processing batch ${i / batchSize + 1}...`)

      const batchResult = await this.analyzeBatch(batch)
      results.push(...batchResult.results)

      console.log(`Batch stats:`, batchResult.stats)
    }

    return results
  }
}

// Usage
const client = new ModerationClient('https://api.example.com', 'your-api-key')

const messages = [
  /* your messages */
]

client
  .processQueue(messages, 50)
  .then((results) => {
    const flagged = results.filter((r) => r.success && r.analysis.shouldFlag)
    console.log(`Flagged ${flagged.length} out of ${results.length} messages`)
  })
  .catch((err) => console.error('Moderation failed:', err))
```

---

## Best Practices

### 1. Rate Limiting

Always implement client-side rate limiting to avoid 429 errors:

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false

  constructor(private maxPerMinute: number) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const fn = this.queue.shift()!

    await fn()

    setTimeout(() => {
      this.processing = false
      this.process()
    }, 60000 / this.maxPerMinute)
  }
}
```

### 2. Cost Optimization

Monitor and optimize API costs:

- Use caching aggressively
- Batch requests when possible
- Set appropriate `maxLength` limits for summaries
- Use cheaper models for simple tasks
- Monitor `/api/admin/ai/costs` regularly

### 3. Error Handling

Implement comprehensive error handling:

```typescript
async function robustAPICall<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status

        // Don't retry client errors (except rate limits)
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error
        }

        // For rate limits, wait before retry
        if (status === 429) {
          const retryAfter = error.response?.headers['retry-after']
          await new Promise((resolve) => setTimeout(resolve, (retryAfter || 60) * 1000))
        }
      }

      // Last attempt
      if (i === maxRetries - 1) throw error

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw new Error('Max retries exceeded')
}
```

### 4. Monitoring

Set up monitoring for AI endpoints:

```typescript
// Track API usage
const metrics = {
  requests: 0,
  errors: 0,
  totalCost: 0,
  avgLatency: 0,
}

async function monitoredRequest<T>(endpoint: string, request: () => Promise<T>): Promise<T> {
  const start = Date.now()
  metrics.requests++

  try {
    const result = await request()

    // Track cost if available
    if ('costInfo' in result) {
      metrics.totalCost += result.costInfo.totalCost
    }

    return result
  } catch (error) {
    metrics.errors++
    throw error
  } finally {
    const latency = Date.now() - start
    metrics.avgLatency = (metrics.avgLatency * (metrics.requests - 1) + latency) / metrics.requests

    console.log(
      `[${endpoint}] Latency: ${latency}ms, Error rate: ${(
        (metrics.errors / metrics.requests) *
        100
      ).toFixed(2)}%`
    )
  }
}
```

---

## Support

For issues, questions, or feature requests:

- **Documentation**: [https://docs.example.com](https://docs.example.com)
- **GitHub Issues**: [https://github.com/org/repo/issues](https://github.com/org/repo/issues)
- **Support Email**: support@example.com
- **Status Page**: [https://status.example.com](https://status.example.com)

---

**Last Updated**: January 31, 2026
**API Version**: v0.7.0
**Document Version**: 1.0.0
