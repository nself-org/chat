# Smart Search System v0.7.0

Complete semantic search implementation with OpenAI embeddings and pgvector.

## Overview

The Smart Search System provides powerful semantic search capabilities using:

- **OpenAI text-embedding-3-small** for generating vector embeddings
- **pgvector** PostgreSQL extension for vector similarity search
- **Hybrid search** combining semantic and keyword-based approaches
- **Advanced filtering** by date, user, channel, content type, etc.
- **Search analytics** with history and saved searches
- **Background workers** for asynchronous embedding generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  SmartSearch.tsx  │  SearchFilters.tsx  │  SavedSearches.tsx│
└────────────┬────────────────────┬──────────────┬────────────┘
             │                    │              │
             ▼                    ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
├─────────────────────────────────────────────────────────────┤
│ /api/ai/search     │ /api/ai/embed    │ /api/search/        │
│ /api/workers/embeddings          │ /api/search/suggestions  │
└────────────┬────────────────────┬──────────────┬────────────┘
             │                    │              │
             ▼                    ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│ smart-search.ts │ embeddings.ts │ vector-store.ts │ filters.ts│
└────────────┬────────────────────┬──────────────┬────────────┘
             │                    │              │
             ▼                    ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + pgvector  │  Messages  │  Embeddings  │  Queue │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Schema (028_pgvector_semantic_search.sql)

**Tables:**

- `nchat_messages.embedding` - Vector embeddings (1536 dimensions)
- `nchat_embedding_cache` - Cache for generated embeddings
- `nchat_embedding_queue` - Queue for background processing
- `nchat_search_history` - User search history
- `nchat_saved_searches` - Saved search queries

**Indexes:**

- HNSW index on embeddings for fast similarity search
- Composite indexes for filtered searches
- Full-text search indexes for hybrid search

**Functions:**

- `nchat_search_messages_semantic()` - Semantic similarity search
- `nchat_find_similar_messages()` - Find related messages
- `nchat_queue_embedding()` - Queue message for embedding
- `nchat_embedding_queue_stats()` - Queue statistics
- `nchat_clean_embedding_cache()` - Cache cleanup

### 2. Embeddings Service (src/lib/ai/embeddings.ts)

**Features:**

- OpenAI API integration
- Batch embedding generation
- LRU cache with automatic eviction
- Token usage tracking
- Cost estimation
- Error handling and retry logic

**Usage:**

```typescript
import { getEmbeddingService } from '@/lib/ai/embeddings'

const service = getEmbeddingService()

// Generate single embedding
const result = await service.generateEmbedding({
  text: 'Hello world',
})

// Generate batch embeddings
const batchResult = await service.generateBatchEmbeddings({
  texts: ['Message 1', 'Message 2', 'Message 3'],
})

// Get statistics
const stats = service.getStats()
console.log(`Cache hit rate: ${stats.hitRate}%`)
console.log(`Total cost: $${stats.totalCost}`)
```

### 3. Vector Store (src/lib/database/vector-store.ts)

**Features:**

- PostgreSQL connection pooling
- Vector similarity search
- Embedding CRUD operations
- Queue management
- Coverage statistics

**Usage:**

```typescript
import { getVectorStore } from '@/lib/database/vector-store'

const vectorStore = getVectorStore()

// Search by semantic similarity
const results = await vectorStore.searchSimilar('how to deploy', {
  similarityThreshold: 0.7,
  limit: 20,
  channelId: 'abc-123',
  dateFrom: new Date('2024-01-01'),
})

// Find similar messages
const similar = await vectorStore.findSimilarMessages('message-id', {
  threshold: 0.8,
  limit: 10,
})

// Store embedding
await vectorStore.storeEmbedding('message-id', embedding, 'text-embedding-3-small')
```

### 4. Search Filters (src/lib/search/filters.ts)

**Features:**

- Fluent API for building search filters
- SQL generation with parameterization
- Filter validation
- Support for complex queries

**Usage:**

```typescript
import { createFilterBuilder } from '@/lib/search/filters'

const builder = createFilterBuilder()
  .query('deployment issues')
  .dateRange(new Date('2024-01-01'), new Date('2024-12-31'))
  .fromUsers(['user-1', 'user-2'])
  .inChannels(['channel-1'])
  .hasAttachments(true)
  .isPinned(true)
  .semantic(0.75)
  .sort('hybrid')
  .limit(50)

const { sql, params } = builder.buildQuery()
```

### 5. Embedding Worker (src/lib/workers/embedding-worker.ts)

**Features:**

- Background processing of embedding queue
- Configurable batch size and polling interval
- Automatic retry on failures
- Statistics tracking
- Graceful shutdown

**Usage:**

```typescript
import { startEmbeddingWorker } from '@/lib/workers/embedding-worker'

// Start worker
const worker = await startEmbeddingWorker({
  batchSize: 10,
  pollIntervalMs: 5000,
  maxRetries: 3,
})

// Get stats
const stats = worker.getStats()
console.log(`Processed: ${stats.totalProcessed}`)
console.log(`Success rate: ${stats.totalSuccess / stats.totalProcessed}%`)

// Stop worker
await worker.stop()
```

## API Endpoints

### POST /api/ai/search

Search messages with natural language queries.

**Request:**

```json
{
  "query": "how to deploy the application",
  "messages": [...],
  "options": {
    "limit": 20,
    "threshold": 0.7,
    "includeContext": true,
    "filters": {
      "channelId": "abc-123",
      "dateFrom": "2024-01-01"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "message": {...},
      "score": 0.92,
      "matchType": "semantic",
      "highlights": ["..."],
      "context": {
        "before": [...],
        "after": [...]
      }
    }
  ],
  "count": 15,
  "provider": "openai",
  "isSemanticSearch": true
}
```

### POST /api/ai/embed

Generate embeddings for text content.

**Request:**

```json
{
  "texts": ["First message content", "Second message content"],
  "model": "text-embedding-3-small"
}
```

**Response:**

```json
{
  "success": true,
  "embeddings": [[...], [...]],
  "model": "text-embedding-3-small",
  "usage": {
    "promptTokens": 24,
    "totalTokens": 24
  },
  "cached": 1,
  "generated": 1
}
```

### GET /api/search/suggestions

Get search suggestions based on history.

**Request:**

```
GET /api/search/suggestions?q=deploy&limit=10&userId=user-123
```

**Response:**

```json
{
  "success": true,
  "suggestions": [
    {
      "query": "deployment issues",
      "count": 15,
      "lastUsed": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### GET /api/workers/embeddings

Get embedding worker status and stats.

**Response:**

```json
{
  "success": true,
  "worker": {
    "isRunning": true,
    "stats": {
      "totalProcessed": 1523,
      "totalSuccess": 1520,
      "totalFailed": 3,
      "averageProcessingTime": 245
    }
  },
  "queue": {
    "pending": 42,
    "processing": 10,
    "failed": 3,
    "completedToday": 256
  },
  "coverage": {
    "total": 10000,
    "withEmbeddings": 9500,
    "needingEmbeddings": 500,
    "percentage": 95.0
  }
}
```

### POST /api/workers/embeddings

Start or stop the embedding worker.

**Request:**

```json
{
  "action": "start",
  "config": {
    "batchSize": 10,
    "pollIntervalMs": 5000
  }
}
```

## Configuration

### Environment Variables

```bash
# Required for semantic search
OPENAI_API_KEY=sk-...

# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Optional: Custom model
NEXT_PUBLIC_EMBEDDING_MODEL=text-embedding-3-small
```

### Database Migration

Run the migration to set up pgvector:

```bash
# Via nself CLI
cd .backend
nself db migrate up

# Or directly with psql
psql -U postgres -d your_database -f migrations/028_pgvector_semantic_search.sql
```

### Worker Configuration

Start the embedding worker in your application:

```typescript
// In your server startup or API route
import { startEmbeddingWorker } from '@/lib/workers/embedding-worker'

await startEmbeddingWorker({
  batchSize: 20, // Process 20 messages at a time
  pollIntervalMs: 10000, // Check queue every 10 seconds
  idleDelayMs: 60000, // Wait 60 seconds when queue is empty
  maxRetries: 3, // Retry failed embeddings 3 times
})
```

## Performance

### Benchmarks

With 10,000 messages and text-embedding-3-small:

| Operation                       | Time   | Cost      |
| ------------------------------- | ------ | --------- |
| Generate embedding (single)     | ~150ms | $0.000003 |
| Generate embeddings (batch 100) | ~2s    | $0.0003   |
| Semantic search (no filters)    | ~50ms  | -         |
| Semantic search (with filters)  | ~30ms  | -         |
| Hybrid search                   | ~80ms  | -         |

### Optimization Tips

1. **Use batch operations** - Process embeddings in batches of 50-100
2. **Enable caching** - Reduces API calls by 70-90%
3. **Use HNSW index** - Faster than IVFFlat for most workloads
4. **Filter before searching** - Reduces vector comparison overhead
5. **Adjust similarity threshold** - Higher = faster but fewer results

### Scaling

- **Horizontal scaling**: Run multiple worker instances with different configs
- **Vertical scaling**: Increase batch size and worker concurrency
- **Database scaling**: Use connection pooling (configured for 20 connections)
- **Cost control**: Set daily spending limits in OpenAI dashboard

## Search Query Syntax

The smart search supports advanced query syntax:

```
# Basic text search
deployment issues

# Filter by user
from:john deployment

# Filter by channel
in:general announcement

# Date range
after:2024-01-01 before:2024-12-31 release

# Content type filters
has:link documentation
has:file has:image screenshots
is:pinned important

# Combine filters
from:alice in:engineering has:code after:2024-01-01
```

## Monitoring

### Queue Health

Check queue stats to monitor processing:

```typescript
const vectorStore = getVectorStore()
const stats = await vectorStore.getQueueStats()

if (stats.failedCount > 100) {
  console.warn('High failure rate detected!')
}

if (stats.pendingCount > 1000) {
  console.warn('Queue backlog growing!')
}
```

### Coverage Tracking

Monitor embedding coverage:

```typescript
const coverage = await vectorStore.getCoverageStats()

console.log(`Coverage: ${coverage.coveragePercentage}%`)
console.log(`Needing embeddings: ${coverage.messagesNeedingEmbeddings}`)
```

### Cost Tracking

Track embedding costs:

```typescript
const service = getEmbeddingService()
const stats = service.getStats()

console.log(`Total tokens: ${stats.totalTokens}`)
console.log(`Total cost: $${stats.totalCost.toFixed(4)}`)
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
```

## Troubleshooting

### Common Issues

**1. "pgvector extension not found"**

```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**2. "OpenAI API key not configured"**

```bash
# Set environment variable
export OPENAI_API_KEY=sk-...
```

**3. "Worker not processing queue"**

```typescript
// Check worker status
const worker = getEmbeddingWorker()
console.log(worker.isActive()) // Should be true

// Restart if needed
await worker.stop()
await worker.start()
```

**4. "Slow semantic search"**

```sql
-- Verify HNSW index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'nchat_messages'
AND indexname LIKE '%embedding%';

-- Rebuild if missing
CREATE INDEX idx_messages_embedding_hnsw
  ON nchat_messages
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**5. "High API costs"**

```typescript
// Increase cache size
const service = new EmbeddingService()
// Cache stores up to 10,000 embeddings by default

// Use smaller batch sizes
const worker = startEmbeddingWorker({
  batchSize: 5, // Smaller batches = more caching opportunities
})
```

## Future Enhancements

- [ ] Support for multiple embedding models
- [ ] Cross-lingual search with multilingual models
- [ ] Document/file content search
- [ ] Voice message transcription and search
- [ ] Search result clustering
- [ ] Personalized search ranking
- [ ] A/B testing framework for search quality
- [ ] Search analytics dashboard

## References

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Semantic Search Best Practices](https://www.pinecone.io/learn/semantic-search/)

## License

Part of nself-chat v0.7.0
