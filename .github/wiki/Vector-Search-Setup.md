# Vector Search Infrastructure - Setup Guide

## Overview

The vector search infrastructure enables semantic search across messages using OpenAI embeddings and PostgreSQL's pgvector extension. This guide covers setup, configuration, and operation.

## Architecture

### Components

1. **Database Layer** (pgvector)
   - Vector storage in PostgreSQL
   - HNSW index for fast similarity search
   - Automatic embedding triggers

2. **Embedding Service** (OpenAI)
   - Text-to-vector conversion
   - Batch processing support
   - Cost tracking and caching

3. **Vector Store** (TypeScript)
   - High-level API for vector operations
   - Similarity search functions
   - Batch operations

4. **Embedding Pipeline**
   - Automatic embedding generation
   - Retry logic for failures
   - Progress tracking

5. **Background Workers**
   - Continuous queue processing
   - Periodic maintenance
   - Index optimization

6. **Admin Dashboard**
   - Monitoring and statistics
   - Job management
   - Performance metrics

## Installation

### 1. Database Migration

Run the pgvector migration:

```bash
cd .backend
psql -U postgres -d nself_chat -f migrations/031_vector_search_infrastructure.sql
```

Or use your migration tool:

```bash
# Hasura CLI
hasura migrate apply --version 031

# Or nself CLI (if supported)
nself db migrate
```

### 2. Install pgvector Extension

The migration automatically installs pgvector, but you can verify:

```sql
-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Manually install if needed
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Environment Variables

Add to your `.env.local`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Embedding Model (optional, defaults to text-embedding-3-small)
EMBEDDING_MODEL=text-embedding-3-small

# Embedding Version (optional)
EMBEDDING_VERSION=1.0.0
```

### 4. Install Dependencies

The required dependencies are already in `package.json`:

```bash
pnpm install
```

## Configuration

### Embedding Models

Three OpenAI models are supported:

| Model                  | Dimensions | Cost (per 1M tokens) | Use Case                |
| ---------------------- | ---------- | -------------------- | ----------------------- |
| text-embedding-3-small | 1536       | $0.02                | Default, cost-effective |
| text-embedding-3-large | 3072       | $0.13                | Higher accuracy         |
| text-embedding-ada-002 | 1536       | $0.10                | Legacy model            |

**Recommendation**: Use `text-embedding-3-small` for most applications.

### Vector Index Parameters

The HNSW index is optimized for performance:

- **Distance Metric**: Cosine (best for OpenAI embeddings)
- **Index Type**: HNSW (fast approximate nearest neighbor search)
- **Dimensions**: 1536 (for small/ada models)

To change index settings, modify the migration file before running.

## Usage

### Starting Background Workers

#### Embedding Worker

Processes the queue continuously:

```bash
# Start worker
node -r ts-node/register src/workers/embedding-worker.ts

# Or with pnpm script (add to package.json)
pnpm worker:embeddings
```

#### Maintenance Worker

Runs periodic maintenance:

```bash
# Start maintenance worker
node -r ts-node/register src/workers/embedding-maintenance-worker.ts

# Or with pnpm script
pnpm worker:maintenance
```

#### Production Deployment

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start workers
pm2 start src/workers/embedding-worker.ts --name embedding-worker
pm2 start src/workers/embedding-maintenance-worker.ts --name embedding-maintenance

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

### Admin Dashboard

Access the embeddings dashboard at:

```
http://localhost:3000/admin/embeddings
```

Features:

- Coverage statistics
- Index health metrics
- Job management
- Performance monitoring
- Cost tracking

### API Endpoints

#### Generate Embeddings

```bash
# Start bulk generation
curl -X POST http://localhost:3000/api/admin/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "initial", "userId": "user-id"}'

# Retry failed embeddings
curl -X POST http://localhost:3000/api/admin/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "repair"}'
```

#### Get Job Status

```bash
# Get specific job
curl http://localhost:3000/api/admin/embeddings/status?jobId=job-uuid

# Get all recent jobs
curl http://localhost:3000/api/admin/embeddings/status?limit=10
```

#### Get Statistics

```bash
# Get comprehensive stats (last 30 days)
curl http://localhost:3000/api/admin/embeddings/stats

# Get stats for specific period
curl http://localhost:3000/api/admin/embeddings/stats?days=7
```

#### Cancel Job

```bash
curl -X POST http://localhost:3000/api/admin/embeddings/cancel \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job-uuid"}'
```

### Programmatic Usage

#### Generate Embedding

```typescript
import { embeddingService } from '@/lib/ai/embedding-service'

const result = await embeddingService.generateEmbedding('Hello, world!')
console.log(result.embedding) // [0.123, -0.456, ...]
```

#### Batch Generate

```typescript
const results = await embeddingService.batchGenerateEmbeddings([
  { text: 'First message', messageId: 'msg-1' },
  { text: 'Second message', messageId: 'msg-2' },
])

console.log(results.totalTokens) // 150
console.log(results.estimatedCost) // 0.000003
```

#### Search by Similarity

```typescript
import { vectorStore } from '@/lib/database/vector-store'

const results = await vectorStore.search(queryEmbedding, {
  threshold: 0.7,
  limit: 10,
  channelId: 'channel-uuid',
})

for (const result of results) {
  console.log(`${result.similarity}: ${result.content}`)
}
```

#### Monitor Performance

```typescript
import { embeddingMonitor } from '@/lib/ai/embedding-monitor'

// Get monitoring report
const report = await embeddingMonitor.getReport(24) // Last 24 hours

console.log(`Avg duration: ${report.performance.avgDuration}ms`)
console.log(`Success rate: ${report.performance.successRate}%`)
console.log(`Cache hit rate: ${report.cache.hitRate}%`)
console.log(`Total cost: $${report.cost.totalCost}`)
```

## Monitoring

### Key Metrics

1. **Coverage**: Percentage of messages with embeddings
2. **Cache Hit Rate**: Efficiency of embedding cache
3. **Success Rate**: Percentage of successful embeddings
4. **Average Duration**: Time to generate embeddings
5. **Total Cost**: Cumulative API costs

### Alerts

The monitor automatically detects:

- Low success rate (< 95%)
- Slow performance (> 5s average)
- High low-quality rate (> 10%)
- Index efficiency issues

### Database Queries

```sql
-- Check coverage
SELECT * FROM nchat.get_embedding_coverage();

-- Check index health
SELECT * FROM nchat.get_embedding_index_health();

-- Recent failed embeddings
SELECT id, content, embedding_error, embedding_retry_count
FROM nchat.nchat_messages
WHERE embedding_error IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Queue status
SELECT COUNT(*) as pending FROM nchat.embedding_queue WHERE claimed_at IS NULL;
SELECT COUNT(*) as processing FROM nchat.embedding_queue WHERE claimed_at IS NOT NULL;
```

## Maintenance

### Periodic Tasks

The maintenance worker automatically:

1. **Cleans queue** - Removes stale items (every hour)
2. **Cleans cache** - Removes unused entries (every hour)
3. **Optimizes index** - Rebuilds for performance (daily)

### Manual Maintenance

```sql
-- Clean up queue
SELECT nchat.cleanup_embedding_queue();

-- Clean up cache (entries unused for 90+ days)
SELECT nchat.cleanup_embedding_cache(90);

-- Optimize index (may take time on large datasets)
SELECT nchat.optimize_embedding_index();

-- Vacuum analyze for better performance
VACUUM ANALYZE nchat.nchat_messages;
```

### Backup Considerations

**Vector data is large!** Consider:

1. **Selective backups**: Exclude embeddings from frequent backups
2. **Regeneration**: Embeddings can be regenerated from messages
3. **Cache backups**: Cache can be rebuilt, low priority

```bash
# Backup without embeddings
pg_dump -U postgres -d nself_chat \
  --exclude-table-data=nchat.embedding_cache \
  -f backup_no_embeddings.sql
```

## Troubleshooting

### Embeddings Not Generating

1. Check OpenAI API key:

   ```bash
   echo $OPENAI_API_KEY
   ```

2. Check worker status:

   ```bash
   ps aux | grep embedding-worker
   ```

3. Check queue:

   ```sql
   SELECT COUNT(*) FROM nchat.embedding_queue;
   ```

4. Check errors:
   ```sql
   SELECT * FROM nchat.nchat_messages
   WHERE embedding_error IS NOT NULL
   ORDER BY updated_at DESC
   LIMIT 5;
   ```

### Slow Search Performance

1. Check index usage:

   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM nchat.search_messages_by_embedding(
     '[0.1, 0.2, ...]'::vector(1536),
     0.7,
     10
   );
   ```

2. Rebuild index:

   ```sql
   SELECT nchat.optimize_embedding_index();
   ```

3. Check table statistics:
   ```sql
   ANALYZE nchat.nchat_messages;
   ```

### High API Costs

1. Check cache hit rate (target: > 80%)
2. Review duplicate messages
3. Consider batch sizes (larger = more efficient)
4. Monitor failed retries (avoid unnecessary API calls)

### Low Quality Embeddings

1. Check for very short messages
2. Review content preprocessing
3. Validate embedding dimensions
4. Check for system messages (should not be embedded)

## Performance Optimization

### Indexing Strategy

```sql
-- Additional indexes for filtered searches
CREATE INDEX idx_messages_channel_embedding
ON nchat.nchat_messages (channel_id)
WHERE embedding IS NOT NULL;

CREATE INDEX idx_messages_user_embedding
ON nchat.nchat_messages (user_id)
WHERE embedding IS NOT NULL;
```

### Query Optimization

```typescript
// Use filters to reduce search space
const results = await vectorStore.search(embedding, {
  threshold: 0.8, // Higher threshold = fewer results
  limit: 10,
  channelId: 'specific-channel', // Filter by channel
})
```

### Batch Processing

```typescript
// Process in larger batches for efficiency
const pipeline = new EmbeddingPipeline({
  batchSize: 500, // Larger batches = fewer API calls
  maxConcurrent: 10, // Parallel processing
})
```

## Security

### API Key Protection

- Store in environment variables
- Never commit to version control
- Rotate regularly
- Use read-only keys if available

### Access Control

- Restrict admin endpoints to authenticated admins
- Validate user permissions before operations
- Audit embedding access logs

### Data Privacy

- Embeddings contain semantic information
- Consider privacy implications of caching
- Implement data retention policies

## Cost Management

### Estimation

For 1 million messages (avg 50 tokens each):

- **Small model**: 50M tokens × $0.02/1M = **$1.00**
- **Large model**: 50M tokens × $0.13/1M = **$6.50**
- **Ada model**: 50M tokens × $0.10/1M = **$5.00**

### Cost Reduction

1. **Enable caching** (default)
2. **Use batch operations** (up to 2048 per request)
3. **Filter messages** (skip system messages, very short messages)
4. **Choose appropriate model** (small model sufficient for most cases)
5. **Avoid unnecessary regeneration**

## Next Steps

1. **Set up monitoring** - Configure alerts and dashboards
2. **Tune parameters** - Adjust thresholds and batch sizes
3. **Integrate with search** - Add semantic search to UI
4. **Scale workers** - Add more workers for large datasets
5. **Optimize costs** - Monitor and adjust based on usage

## Support

For issues or questions:

- Check logs: `pm2 logs embedding-worker`
- Review metrics: Admin dashboard
- Database health: `SELECT * FROM nchat.get_embedding_index_health();`
- Monitor API: OpenAI usage dashboard

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
