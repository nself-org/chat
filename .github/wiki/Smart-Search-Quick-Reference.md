# Smart Search Quick Reference

## Setup (5 minutes)

```bash
# 1. Run migration
cd .backend && nself db migrate up

# 2. Set environment variable
export OPENAI_API_KEY=sk-...

# 3. Start worker (in code or separate process)
```

```typescript
import { startEmbeddingWorker } from '@/lib/workers/embedding-worker'
await startEmbeddingWorker({ batchSize: 20, pollIntervalMs: 10000 })
```

## Basic Usage

### Semantic Search

```typescript
import { getSmartSearch } from '@/lib/ai/smart-search'

const search = getSmartSearch()
const results = await search.search('how to deploy', messages, {
  limit: 20,
  threshold: 0.7,
})
```

### Vector Store

```typescript
import { getVectorStore } from '@/lib/database/vector-store'

const vectorStore = getVectorStore()

// Search
const results = await vectorStore.searchSimilar('query text', {
  similarityThreshold: 0.7,
  limit: 20,
  channelId: 'abc-123',
})

// Find similar
const similar = await vectorStore.findSimilarMessages('msg-id', {
  threshold: 0.8,
  limit: 10,
})

// Queue for embedding
await vectorStore.queueEmbedding('msg-id', priority)
```

### Filters

```typescript
import { createFilterBuilder } from '@/lib/search/filters'

const { sql, params } = createFilterBuilder()
  .query('deployment')
  .after(new Date('2024-01-01'))
  .fromUsers(['alice', 'bob'])
  .hasAttachments(true)
  .semantic(0.75)
  .limit(50)
  .buildQuery()
```

## API Endpoints

```bash
# Generate embeddings
POST /api/ai/embed
{
  "texts": ["message 1", "message 2"]
}

# Search
POST /api/ai/search
{
  "query": "deployment",
  "messages": [...],
  "options": { "limit": 20, "threshold": 0.7 }
}

# Suggestions
GET /api/search/suggestions?q=deploy&limit=5

# Worker status
GET /api/workers/embeddings

# Start/stop worker
POST /api/workers/embeddings
{
  "action": "start",
  "config": { "batchSize": 20 }
}
```

## Database Functions

```sql
-- Semantic search
SELECT * FROM nchat_search_messages_semantic(
  '[...]'::vector(1536),  -- query embedding
  0.7,                     -- threshold
  20,                      -- limit
  'channel-id'::uuid,      -- channel filter
  NULL,                    -- user filter
  NULL,                    -- date from
  NULL,                    -- date to
  FALSE                    -- include deleted
);

-- Find similar
SELECT * FROM nchat_find_similar_messages(
  'message-id'::uuid,
  0.8,   -- threshold
  10     -- limit
);

-- Queue stats
SELECT * FROM nchat_embedding_queue_stats();

-- Coverage stats
SELECT * FROM nchat_embedding_coverage;
```

## Search Query Syntax

```
# Basic
deployment issues

# Filters
from:alice in:engineering after:2024-01-01
has:link has:file is:pinned
```

## Monitoring

```typescript
// Worker stats
const worker = getEmbeddingWorker()
const stats = worker.getStats()

// Queue stats
const vectorStore = getVectorStore()
const queueStats = await vectorStore.getQueueStats()

// Coverage
const coverage = await vectorStore.getCoverageStats()
console.log(`Coverage: ${coverage.coveragePercentage}%`)
```

## Performance Tips

1. **Use batch operations** - 50-100 embeddings per batch
2. **Enable caching** - 70-90% hit rate saves costs
3. **Filter before searching** - Reduces comparisons
4. **Use HNSW index** - Faster than IVFFlat
5. **Adjust threshold** - Higher = faster but fewer results

## Cost Control

```typescript
const service = getEmbeddingService()
const stats = service.getStats()

console.log(`Tokens: ${stats.totalTokens}`)
console.log(`Cost: $${stats.totalCost.toFixed(4)}`)
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
```

text-embedding-3-small: $0.02/1M tokens

- 1K messages (~50 tokens each) = $0.001
- 10K messages = $0.01
- 100K messages = $0.10
- With 90% cache = ~10% actual cost

## Troubleshooting

```bash
# Check pgvector
psql -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check index
psql -c "SELECT indexname FROM pg_indexes WHERE tablename = 'nchat_messages' AND indexname LIKE '%embedding%';"

# Queue status
curl http://localhost:3000/api/workers/embeddings

# Restart worker
curl -X POST http://localhost:3000/api/workers/embeddings \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'

curl -X POST http://localhost:3000/api/workers/embeddings \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "config": {"batchSize": 20}}'
```

## Files Overview

```
.backend/migrations/
  028_pgvector_semantic_search.sql     # Database schema

src/lib/ai/
  embeddings.ts                         # Embeddings service
  smart-search.ts                       # Search engine (existing)

src/lib/database/
  vector-store.ts                       # pgvector integration

src/lib/search/
  filters.ts                            # Advanced filters

src/lib/workers/
  embedding-worker.ts                   # Background processor

src/app/api/ai/
  embed/route.ts                        # Embeddings API
  search/route.ts                       # Search API (existing)

src/app/api/search/
  suggestions/route.ts                  # Suggestions API

src/app/api/workers/
  embeddings/route.ts                   # Worker management

docs/
  Smart-Search-System.md                # Full documentation
  Smart-Search-Quick-Reference.md       # This file
```

## Configuration

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
DATABASE_URL=postgresql://...
NEXT_PUBLIC_EMBEDDING_MODEL=text-embedding-3-small

# Worker config (in code)
{
  batchSize: 20,           # Messages per batch
  pollIntervalMs: 10000,   # Poll every 10s
  idleDelayMs: 60000,      # Wait 60s when idle
  maxRetries: 3            # Retry failed 3x
}
```

## Success Metrics

- Coverage > 95%
- Cache hit rate > 80%
- Search latency < 100ms (p95)
- Queue pending < 1000
- Failed rate < 1%
- Monthly cost < budget

## Support

1. Full docs: `docs/Smart-Search-System.md`
2. Implementation: `.claude/implementation/smart-search-implementation.md`
3. Database: Check migrations and functions
4. API: Test endpoints individually
5. Worker: Check logs and stats

---

Smart Search v0.7.0 | Quick Reference
