# AI Features Troubleshooting Guide

**Version**: 0.7.0
**Last Updated**: January 31, 2026
**Project**: nself-chat (nchat)

---

## Table of Contents

1. [Summarization Issues](#summarization-issues)
2. [Search Issues](#search-issues)
3. [Bot Issues](#bot-issues)
4. [Moderation Issues](#moderation-issues)
5. [API Issues](#api-issues)
6. [Performance Issues](#performance-issues)
7. [Configuration Issues](#configuration-issues)
8. [Database Issues](#database-issues)
9. [Monitoring and Debugging](#monitoring-and-debugging)
10. [Common Error Messages](#common-error-messages)

---

## Summarization Issues

### 1. Summaries Not Generating

#### Symptoms

- Loading spinner appears but never completes
- "Failed to generate summary" error message
- Empty summary returned
- UI shows "No summary available"

#### Causes

1. **API Key Issues**
   - Missing or invalid Anthropic API key
   - API key not loaded in environment
   - Key revoked or expired

2. **Message Access Issues**
   - User lacks permission to read messages
   - Messages deleted before summarization
   - Channel access revoked mid-process

3. **Network Issues**
   - Timeout connecting to Anthropic API
   - Network proxy blocking requests
   - Firewall rules blocking outbound HTTPS

4. **Service Issues**
   - Anthropic API downtime
   - Rate limits exceeded
   - Service maintenance window

#### Solutions

**Step 1: Verify API Key**

```bash
# Check environment variable
echo $ANTHROPIC_API_KEY

# Test API key validity
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

**Step 2: Check Message Access**

```typescript
// In browser console
const messages = await fetch('/api/messages?channelId=YOUR_CHANNEL_ID').then((r) => r.json())
console.log('Messages:', messages.length)
```

**Step 3: Test Summarization Endpoint**

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"id": "1", "content": "Test message", "author": {"name": "User"}}
    ]
  }'
```

**Step 4: Check Logs**

```bash
# Application logs
docker logs nself-chat-app -f | grep "summarize"

# Check for errors
docker logs nself-chat-app --tail 100 | grep -i error
```

**Step 5: Verify Rate Limits**

```typescript
// Check rate limiter state
import { rateLimiter } from '@/lib/ai/rate-limiter'
const status = await rateLimiter.getStatus()
console.log('Rate limit:', status)
```

#### Prevention Tips

- Set up health checks for Anthropic API
- Implement retry logic with exponential backoff
- Monitor API key usage in Anthropic dashboard
- Cache summaries to reduce API calls
- Set up alerts for API failures

#### Related Logs

```bash
# Summarization requests
grep "Generating summary" /var/log/nself-chat/app.log

# API errors
grep "Anthropic API error" /var/log/nself-chat/app.log

# Rate limit hits
grep "Rate limit exceeded" /var/log/nself-chat/app.log
```

---

### 2. Poor Quality Summaries

#### Symptoms

- Summaries too short or too long
- Missing important information
- Hallucinated content not in messages
- Summaries in wrong language
- Repetitive or nonsensical output

#### Causes

1. **Prompt Issues**
   - System prompt not optimized
   - Missing context in prompt
   - Conflicting instructions

2. **Message Quality**
   - Too few messages to summarize
   - Messages lack context
   - Mixed languages in messages

3. **Model Configuration**
   - Temperature too high (hallucinations)
   - Max tokens too low (truncated)
   - Wrong model selected

#### Solutions

**Step 1: Review Summarization Prompt**

```typescript
// Check current prompt in src/lib/ai/message-summarizer.ts
import { MessageSummarizer } from '@/lib/ai/message-summarizer'

// Update system prompt
const summarizer = new MessageSummarizer({
  systemPrompt: `You are a helpful assistant that creates concise, accurate summaries.
- Focus on key decisions and action items
- Maintain original context and meaning
- Use bullet points for clarity
- Highlight important names and dates
- Flag any urgent matters`,
})
```

**Step 2: Adjust Model Parameters**

```typescript
// In src/lib/ai/message-summarizer.ts
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024, // Increase for longer summaries
  temperature: 0.3, // Lower = more focused, higher = more creative
  messages: [
    /* ... */
  ],
})
```

**Step 3: Filter Message Input**

```typescript
// Remove low-quality messages before summarization
const qualityMessages = messages.filter((msg) => {
  // Remove very short messages
  if (msg.content.length < 10) return false

  // Remove system messages
  if (msg.type === 'system') return false

  // Remove deleted/edited markers
  if (msg.content.includes('[deleted]')) return false

  return true
})
```

**Step 4: Add Context Enrichment**

```typescript
// Add channel/thread context
const contextPrompt = `
Summarize the following conversation from #${channel.name}.
Participants: ${participants.map((p) => p.name).join(', ')}
Time period: ${startDate} to ${endDate}
Topic: ${thread?.title || 'General discussion'}

Messages:
${formatMessages(messages)}
`
```

#### Prevention Tips

- A/B test different prompts and collect feedback
- Set minimum message thresholds (e.g., 5+ messages)
- Implement summary quality scoring
- Allow users to rate summaries
- Periodically review summary quality metrics

#### Related Logs

```bash
# Summary requests with message counts
grep "Summary generated" /var/log/nself-chat/app.log | grep "messages:"

# Check prompt versions
grep "System prompt version" /var/log/nself-chat/app.log
```

---

### 3. Timeout Errors

#### Symptoms

- "Request timeout" error after 30-60 seconds
- Summary generation aborted mid-process
- Gateway timeout (504) errors
- Client disconnects before completion

#### Causes

1. **Long Message Threads**
   - Too many messages to process
   - Very long individual messages
   - Context window exceeded

2. **API Latency**
   - Slow Anthropic API responses
   - Network latency issues
   - Server overload

3. **Configuration Issues**
   - Timeout settings too low
   - Missing streaming support
   - Blocking async operations

#### Solutions

**Step 1: Implement Chunking**

```typescript
// In src/lib/ai/message-summarizer.ts
async summarizeLarge(messages: Message[]): Promise<string> {
  const CHUNK_SIZE = 50 // Messages per chunk

  if (messages.length <= CHUNK_SIZE) {
    return this.summarize(messages)
  }

  // Split into chunks
  const chunks = []
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE))
  }

  // Summarize each chunk
  const chunkSummaries = await Promise.all(
    chunks.map(chunk => this.summarize(chunk))
  )

  // Create final summary from chunk summaries
  return this.summarize(
    chunkSummaries.map((summary, i) => ({
      id: `chunk-${i}`,
      content: summary,
      author: { name: 'System' },
      createdAt: new Date(),
    }))
  )
}
```

**Step 2: Increase Timeout Settings**

```typescript
// In src/lib/ai/providers/anthropic-provider.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    /* ... */
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(120000), // 120 seconds
})
```

**Step 3: Enable Streaming**

```typescript
// Stream response to avoid timeouts
async summarizeStreaming(messages: Message[]): Promise<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: this.formatMessages(messages),
  })

  let summary = ''
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      summary += chunk.delta.text
      // Send progress updates to client
      this.emit('progress', { text: summary })
    }
  }

  return summary
}
```

**Step 4: Add Progress Indicators**

```typescript
// In API route (src/app/api/ai/summarize/route.ts)
export async function POST(req: Request) {
  const { messages } = await req.json()

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const summarizer = new MessageSummarizer()

      summarizer.on('progress', ({ text }) => {
        controller.enqueue(`data: ${JSON.stringify({ text })}\n\n`)
      })

      const summary = await summarizer.summarizeStreaming(messages)

      controller.enqueue(`data: ${JSON.stringify({ done: true, summary })}\n\n`)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

#### Prevention Tips

- Set appropriate timeout limits (60-120s)
- Implement chunking for large threads
- Use streaming for real-time feedback
- Cache summaries aggressively
- Monitor average response times

#### Related Logs

```bash
# Timeout errors
grep "timeout" /var/log/nself-chat/app.log | grep "summarize"

# Long-running requests
grep "Summary took" /var/log/nself-chat/app.log | awk '$NF > 30000'
```

---

### 4. Language Issues

#### Symptoms

- Summaries in wrong language
- Mixed languages in output
- Translation instead of summary
- Character encoding errors

#### Causes

1. **Message Language Detection**
   - Mixed language messages
   - Auto-detection failures
   - Missing language hints

2. **Model Behavior**
   - Default language not set
   - Prompt in different language
   - Training data bias

#### Solutions

**Step 1: Add Language Detection**

```typescript
import { franc } from 'franc'

function detectLanguage(messages: Message[]): string {
  const text = messages.map((m) => m.content).join(' ')
  const lang = franc(text, { minLength: 10 })
  return lang === 'und' ? 'en' : lang // Default to English
}
```

**Step 2: Update Prompt with Language**

```typescript
async summarize(messages: Message[], language = 'en'): Promise<string> {
  const langNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ar: 'Arabic',
  }

  const prompt = `Create a summary in ${langNames[language] || 'English'}.
Do not translate the content, just summarize it in the same language.

Messages:
${this.formatMessages(messages)}`

  return this.generate(prompt)
}
```

**Step 3: Handle Mixed Languages**

```typescript
async summarizeMultilingual(messages: Message[]): Promise<string> {
  // Group messages by language
  const byLanguage = messages.reduce((acc, msg) => {
    const lang = franc(msg.content)
    if (!acc[lang]) acc[lang] = []
    acc[lang].push(msg)
    return acc
  }, {} as Record<string, Message[]>)

  // Summarize each language separately
  const summaries = await Promise.all(
    Object.entries(byLanguage).map(async ([lang, msgs]) => {
      const summary = await this.summarize(msgs, lang)
      return `[${lang.toUpperCase()}] ${summary}`
    })
  )

  return summaries.join('\n\n')
}
```

#### Prevention Tips

- Auto-detect message language
- Allow users to specify summary language
- Test with multilingual datasets
- Document supported languages
- Handle RTL languages properly

#### Related Logs

```bash
# Language detection
grep "Language detected" /var/log/nself-chat/app.log

# Encoding errors
grep "encoding" /var/log/nself-chat/app.log
```

---

## Search Issues

### 1. No Results Found

#### Symptoms

- Search returns empty results
- "No matches found" message
- Search works for some queries but not others
- Newly added content not searchable

#### Causes

1. **Embeddings Not Generated**
   - Message embeddings missing
   - Embedding generation failed
   - Queue backlog too large

2. **Database Issues**
   - Vector extension not enabled
   - Embeddings table empty
   - Index not created

3. **Query Issues**
   - Search query too specific
   - Stop words filtered out
   - Similarity threshold too high

#### Solutions

**Step 1: Verify Vector Extension**

```sql
-- Connect to PostgreSQL
\c nself_chat

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- If not installed
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify embeddings table
SELECT COUNT(*) FROM message_embeddings;
SELECT COUNT(*) FROM message_embeddings WHERE embedding IS NOT NULL;
```

**Step 2: Check Embedding Generation**

```typescript
// Test embedding generation
import { EmbeddingService } from '@/lib/ai/embedding-service'

const service = new EmbeddingService()
const embedding = await service.generateEmbedding('test query')
console.log('Embedding dimensions:', embedding.length)
console.log('First values:', embedding.slice(0, 5))
```

**Step 3: Regenerate Missing Embeddings**

```typescript
// In src/lib/ai/embedding-pipeline.ts
async regenerateMissingEmbeddings(): Promise<void> {
  const messages = await db.query(`
    SELECT m.id, m.content
    FROM messages m
    LEFT JOIN message_embeddings e ON e.message_id = m.id
    WHERE e.embedding IS NULL
    ORDER BY m.created_at DESC
    LIMIT 1000
  `)

  console.log(`Found ${messages.length} messages without embeddings`)

  for (const msg of messages) {
    await this.generateEmbedding(msg.id, msg.content)
    await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
  }
}
```

**Step 4: Lower Similarity Threshold**

```typescript
// In src/lib/ai/embeddings.ts
async searchMessages(query: string, options = {}) {
  const threshold = options.threshold || 0.5 // Lower from 0.7 to 0.5

  return db.query(`
    SELECT m.*, 1 - (e.embedding <=> $1::vector) as similarity
    FROM messages m
    JOIN message_embeddings e ON e.message_id = m.id
    WHERE 1 - (e.embedding <=> $1::vector) > $2
    ORDER BY similarity DESC
    LIMIT $3
  `, [queryEmbedding, threshold, options.limit || 20])
}
```

**Step 5: Add Hybrid Search Fallback**

```typescript
async search(query: string) {
  // Try vector search first
  let results = await this.vectorSearch(query)

  // If no results, fall back to full-text search
  if (results.length === 0) {
    console.log('No vector results, trying full-text search')
    results = await this.fullTextSearch(query)
  }

  return results
}

async fullTextSearch(query: string) {
  return db.query(`
    SELECT *
    FROM messages
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
    ORDER BY created_at DESC
    LIMIT 20
  `, [query])
}
```

#### Prevention Tips

- Monitor embedding generation queue
- Set up alerts for embedding failures
- Implement automatic retry for failed embeddings
- Create database indexes for vector searches
- Test search with various query types

#### Related Logs

```bash
# Embedding generation
grep "Generated embedding" /var/log/nself-chat/app.log

# Search queries
grep "Search query" /var/log/nself-chat/app.log

# No results
grep "No results found" /var/log/nself-chat/app.log
```

---

### 2. Irrelevant Results

#### Symptoms

- Search returns unrelated messages
- Results don't match query intent
- Poor ranking of results
- Too many false positives

#### Causes

1. **Embedding Quality**
   - Low-quality message embeddings
   - Query embedding issues
   - Model not suitable for domain

2. **Ranking Issues**
   - Similarity metric incorrect
   - No re-ranking applied
   - Missing metadata filters

3. **Data Quality**
   - Noisy training data
   - Spam messages in index
   - Duplicate content

#### Solutions

**Step 1: Improve Query Embeddings**

```typescript
// Add query expansion
async expandQuery(query: string): Promise<string> {
  const synonyms = {
    'bug': ['error', 'issue', 'problem', 'defect'],
    'feature': ['functionality', 'capability', 'enhancement'],
    'deploy': ['deployment', 'release', 'ship'],
  }

  let expanded = query
  for (const [term, syns] of Object.entries(synonyms)) {
    if (query.toLowerCase().includes(term)) {
      expanded += ' ' + syns.join(' ')
    }
  }

  return expanded
}

async search(query: string) {
  const expandedQuery = await this.expandQuery(query)
  return this.vectorSearch(expandedQuery)
}
```

**Step 2: Implement Re-ranking**

```typescript
async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
  // Score based on multiple factors
  return results.map(result => {
    let score = result.similarity

    // Boost recent messages
    const age = Date.now() - result.createdAt.getTime()
    const daysSince = age / (1000 * 60 * 60 * 24)
    score += Math.max(0, (30 - daysSince) / 30) * 0.1

    // Boost messages with reactions
    score += Math.min(result.reactions?.length || 0, 10) * 0.01

    // Boost messages from certain channels
    if (result.channel?.important) {
      score += 0.05
    }

    return { ...result, score }
  }).sort((a, b) => b.score - a.score)
}
```

**Step 3: Add Metadata Filtering**

```typescript
interface SearchOptions {
  channelIds?: string[]
  userIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  hasAttachments?: boolean
  minReactions?: number
}

async search(query: string, options: SearchOptions = {}) {
  let conditions = ['1 - (e.embedding <=> $1::vector) > $2']
  const params: any[] = [queryEmbedding, 0.5]

  if (options.channelIds?.length) {
    params.push(options.channelIds)
    conditions.push(`m.channel_id = ANY($${params.length})`)
  }

  if (options.dateFrom) {
    params.push(options.dateFrom)
    conditions.push(`m.created_at >= $${params.length}`)
  }

  if (options.hasAttachments) {
    conditions.push(`m.attachments IS NOT NULL AND array_length(m.attachments, 1) > 0`)
  }

  const sql = `
    SELECT m.*, 1 - (e.embedding <=> $1::vector) as similarity
    FROM messages m
    JOIN message_embeddings e ON e.message_id = m.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY similarity DESC
    LIMIT 20
  `

  return db.query(sql, params)
}
```

**Step 4: Filter Out Noise**

```typescript
async cleanupSearchIndex(): Promise<void> {
  // Remove embeddings for spam messages
  await db.query(`
    DELETE FROM message_embeddings
    WHERE message_id IN (
      SELECT id FROM messages WHERE is_spam = true
    )
  `)

  // Remove embeddings for deleted messages
  await db.query(`
    DELETE FROM message_embeddings
    WHERE message_id NOT IN (SELECT id FROM messages)
  `)

  // Remove duplicate embeddings
  await db.query(`
    DELETE FROM message_embeddings a
    USING message_embeddings b
    WHERE a.id > b.id
    AND a.message_id = b.message_id
  `)
}
```

#### Prevention Tips

- Regularly clean search index
- Implement feedback loop for search quality
- Use query analytics to find common issues
- A/B test different ranking algorithms
- Monitor search result click-through rates

#### Related Logs

```bash
# Search relevance scores
grep "Search similarity" /var/log/nself-chat/app.log

# Re-ranking applied
grep "Re-ranked results" /var/log/nself-chat/app.log
```

---

### 3. Slow Search Performance

#### Symptoms

- Search takes >3 seconds
- Database CPU spikes during search
- UI freezes while searching
- Timeout errors on large searches

#### Causes

1. **Missing Indexes**
   - No vector index created
   - Missing GIN indexes for full-text
   - No indexes on filter columns

2. **Large Dataset**
   - Millions of embeddings
   - No partitioning strategy
   - Full table scans

3. **Inefficient Queries**
   - No query optimization
   - Missing query caching
   - Unnecessary joins

#### Solutions

**Step 1: Create Vector Indexes**

```sql
-- Create IVFFLAT index for faster approximate search
CREATE INDEX IF NOT EXISTS idx_message_embeddings_vector
ON message_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze table for better query planning
ANALYZE message_embeddings;

-- For exact search, create HNSW index (pgvector 0.5.0+)
CREATE INDEX IF NOT EXISTS idx_message_embeddings_hnsw
ON message_embeddings
USING hnsw (embedding vector_cosine_ops);
```

**Step 2: Add Filter Indexes**

```sql
-- Index on channel_id for filtering
CREATE INDEX IF NOT EXISTS idx_messages_channel_id
ON messages(channel_id);

-- Index on created_at for date filtering
CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages(created_at DESC);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_messages_channel_date
ON messages(channel_id, created_at DESC);

-- GIN index for full-text search fallback
CREATE INDEX IF NOT EXISTS idx_messages_content_fts
ON messages USING GIN (to_tsvector('english', content));
```

**Step 3: Implement Query Caching**

```typescript
import { LRUCache } from 'lru-cache'

const searchCache = new LRUCache<string, SearchResult[]>({
  max: 1000, // Cache up to 1000 queries
  ttl: 1000 * 60 * 5, // 5 minutes
})

async search(query: string, options: SearchOptions = {}) {
  const cacheKey = JSON.stringify({ query, options })

  // Check cache first
  const cached = searchCache.get(cacheKey)
  if (cached) {
    console.log('Cache hit for query:', query)
    return cached
  }

  // Perform search
  const results = await this.vectorSearch(query, options)

  // Cache results
  searchCache.set(cacheKey, results)

  return results
}
```

**Step 4: Optimize Query**

```sql
-- Before: Slow query with multiple joins
SELECT m.*, u.name, c.name as channel_name,
       1 - (e.embedding <=> $1::vector) as similarity
FROM messages m
JOIN message_embeddings e ON e.message_id = m.id
JOIN users u ON u.id = m.user_id
JOIN channels c ON c.id = m.channel_id
WHERE 1 - (e.embedding <=> $1::vector) > 0.5
ORDER BY similarity DESC
LIMIT 20;

-- After: Optimized query with selective joins
WITH ranked AS (
  SELECT m.id, m.content, m.user_id, m.channel_id,
         1 - (e.embedding <=> $1::vector) as similarity
  FROM messages m
  JOIN message_embeddings e ON e.message_id = m.id
  WHERE 1 - (e.embedding <=> $1::vector) > 0.5
  ORDER BY similarity DESC
  LIMIT 20
)
SELECT r.*, u.name, c.name as channel_name
FROM ranked r
LEFT JOIN users u ON u.id = r.user_id
LEFT JOIN channels c ON c.id = r.channel_id
ORDER BY r.similarity DESC;
```

**Step 5: Implement Pagination**

```typescript
async searchPaginated(
  query: string,
  page = 1,
  pageSize = 20
): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> {
  const offset = (page - 1) * pageSize

  // Get total count (cached separately)
  const countKey = `search:count:${query}`
  let total = searchCache.get(countKey) as number

  if (!total) {
    const countResult = await db.query(`
      SELECT COUNT(*)
      FROM messages m
      JOIN message_embeddings e ON e.message_id = m.id
      WHERE 1 - (e.embedding <=> $1::vector) > 0.5
    `, [queryEmbedding])

    total = parseInt(countResult[0].count)
    searchCache.set(countKey, total)
  }

  // Get page results
  const results = await db.query(`
    SELECT m.*, 1 - (e.embedding <=> $1::vector) as similarity
    FROM messages m
    JOIN message_embeddings e ON e.message_id = m.id
    WHERE 1 - (e.embedding <=> $1::vector) > 0.5
    ORDER BY similarity DESC
    LIMIT $2 OFFSET $3
  `, [queryEmbedding, pageSize, offset])

  return {
    results,
    total,
    hasMore: offset + pageSize < total,
  }
}
```

#### Prevention Tips

- Create all recommended indexes
- Monitor query performance with EXPLAIN ANALYZE
- Implement result caching
- Use pagination for large result sets
- Consider read replicas for search traffic

#### Related Logs

```bash
# Slow queries
grep "Query took" /var/log/nself-chat/app.log | awk '$NF > 3000'

# Cache hit rates
grep "Cache hit" /var/log/nself-chat/app.log | wc -l
```

---

## Bot Issues

### 1. Bot Not Responding

#### Symptoms

- Bot doesn't reply to mentions
- Commands not recognized
- No response in subscribed channels
- Bot appears offline

#### Causes

1. **Registration Issues**
   - Bot not registered in database
   - Bot disabled or deleted
   - Registration incomplete

2. **Permission Issues**
   - Bot lacks channel access
   - Insufficient role permissions
   - User blocked bot

3. **Event Handling**
   - Event listeners not attached
   - Message processing errors
   - Queue backlog

4. **State Issues**
   - Bot crashed and not restarted
   - State corruption
   - Memory leaks

#### Solutions

**Step 1: Verify Bot Registration**

```sql
-- Check bot exists and is enabled
SELECT id, name, enabled, created_at
FROM bots
WHERE id = 'YOUR_BOT_ID';

-- Check bot permissions
SELECT b.name, bp.permission, bp.granted
FROM bots b
JOIN bot_permissions bp ON bp.bot_id = b.id
WHERE b.id = 'YOUR_BOT_ID';

-- Check channel subscriptions
SELECT b.name, c.name as channel, bc.events
FROM bots b
JOIN bot_channels bc ON bc.bot_id = b.id
JOIN channels c ON c.id = bc.channel_id
WHERE b.id = 'YOUR_BOT_ID';
```

**Step 2: Test Bot Manually**

```typescript
// In browser console or Node.js
import { BotSDK } from '@/lib/bots/bot-sdk'

const bot = new BotSDK('YOUR_BOT_ID')

// Test basic functionality
const response = await bot.handleMessage({
  id: 'test-1',
  content: 'Hello bot!',
  channelId: 'general',
  userId: 'test-user',
})

console.log('Bot response:', response)
```

**Step 3: Check Event Listeners**

```typescript
// In src/lib/bots/bot-manager.ts
class BotManager {
  async startBot(botId: string): Promise<void> {
    const bot = await this.loadBot(botId)

    // Verify event listeners are attached
    console.log('Registering listeners for bot:', bot.name)

    this.eventBus.on('message.created', async (message) => {
      console.log(`Bot ${bot.name} received message:`, message.id)

      try {
        await bot.handleMessage(message)
      } catch (error) {
        console.error(`Bot ${bot.name} error:`, error)
        // Don't let one error crash the bot
      }
    })

    console.log(`Bot ${bot.name} started successfully`)
  }
}
```

**Step 4: Implement Health Checks**

```typescript
// Add health check endpoint
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const botId = searchParams.get('botId')

  const bot = await db.query(
    `
    SELECT id, name, enabled, last_active_at
    FROM bots
    WHERE id = $1
  `,
    [botId]
  )

  if (!bot.length) {
    return Response.json({ error: 'Bot not found' }, { status: 404 })
  }

  const health = {
    id: bot[0].id,
    name: bot[0].name,
    enabled: bot[0].enabled,
    lastActive: bot[0].last_active_at,
    status: bot[0].enabled ? 'online' : 'offline',
    uptime: Date.now() - new Date(bot[0].last_active_at).getTime(),
  }

  return Response.json(health)
}
```

**Step 5: Auto-Restart Failed Bots**

```typescript
// Bot supervisor process
class BotSupervisor {
  private bots = new Map<string, BotInstance>()
  private healthCheckInterval = 30000 // 30 seconds

  async monitor(): Promise<void> {
    setInterval(async () => {
      for (const [botId, instance] of this.bots) {
        try {
          const health = await this.checkHealth(botId)

          if (!health.responding) {
            console.log(`Bot ${botId} not responding, restarting...`)
            await this.restart(botId)
          }
        } catch (error) {
          console.error(`Health check failed for bot ${botId}:`, error)
        }
      }
    }, this.healthCheckInterval)
  }

  async restart(botId: string): Promise<void> {
    await this.stopBot(botId)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.startBot(botId)
  }
}
```

#### Prevention Tips

- Implement bot health monitoring
- Set up automatic restarts for crashed bots
- Log all bot errors to Sentry
- Test bot registration flow thoroughly
- Monitor bot response times

#### Related Logs

```bash
# Bot registrations
grep "Bot registered" /var/log/nself-chat/app.log

# Bot errors
grep "Bot error" /var/log/nself-chat/app.log

# Bot responses
grep "Bot responded" /var/log/nself-chat/app.log
```

---

### 2. Bot Errors

#### Symptoms

- "Bot encountered an error" message
- Stack traces in logs
- Partial bot responses
- Commands fail silently

#### Causes

1. **Code Errors**
   - Unhandled exceptions
   - Null reference errors
   - Type mismatches

2. **API Errors**
   - External API failures
   - Authentication errors
   - Rate limits hit

3. **Resource Issues**
   - Out of memory
   - Too many async operations
   - Database connection pool exhausted

#### Solutions

**Step 1: Add Comprehensive Error Handling**

```typescript
// In bot implementation
class MyBot extends BotSDK {
  async handleMessage(message: Message): Promise<void> {
    try {
      // Bot logic here
      await this.processMessage(message)
    } catch (error) {
      // Log detailed error
      console.error('Bot error:', {
        botId: this.id,
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Send user-friendly error message
      await this.sendMessage(message.channelId, {
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        metadata: { errorId: generateErrorId() },
      })

      // Report to Sentry
      Sentry.captureException(error, {
        tags: { botId: this.id, messageId: message.id },
      })
    }
  }
}
```

**Step 2: Implement Retry Logic**

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, delay: 1000 }
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.log(`Attempt ${i + 1} failed, retrying...`)
      await new Promise(resolve => setTimeout(resolve, options.delay * (i + 1)))
    }
  }

  throw lastError!
}

// Usage in bot
async callExternalAPI(endpoint: string): Promise<any> {
  return withRetry(async () => {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  })
}
```

**Step 3: Add Resource Limits**

```typescript
class BotSDK {
  private maxConcurrentOperations = 10
  private operationSemaphore = new Semaphore(this.maxConcurrentOperations)

  async handleMessage(message: Message): Promise<void> {
    // Acquire semaphore
    await this.operationSemaphore.acquire()

    try {
      await this.processMessage(message)
    } finally {
      // Always release semaphore
      this.operationSemaphore.release()
    }
  }
}

class Semaphore {
  private current = 0
  private waiting: (() => void)[] = []

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++
      return
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    this.current--
    const next = this.waiting.shift()
    if (next) {
      this.current++
      next()
    }
  }
}
```

**Step 4: Implement Circuit Breaker**

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
}

// Usage in bot
const apiBreaker = new CircuitBreaker()

async callAPI(endpoint: string): Promise<any> {
  return apiBreaker.execute(async () => {
    const response = await fetch(endpoint)
    return response.json()
  })
}
```

#### Prevention Tips

- Add error boundaries around all bot operations
- Implement circuit breakers for external APIs
- Set resource limits (memory, concurrency)
- Monitor error rates and patterns
- Test error scenarios thoroughly

#### Related Logs

```bash
# Bot errors by type
grep "Bot error" /var/log/nself-chat/app.log | cut -d':' -f3 | sort | uniq -c

# Retry attempts
grep "Retrying" /var/log/nself-chat/app.log

# Circuit breaker trips
grep "Circuit breaker" /var/log/nself-chat/app.log
```

---

## Moderation Issues

### 1. False Positives

#### Symptoms

- Legitimate messages flagged
- Users complaining about over-moderation
- High false positive rate in metrics
- Important messages blocked

#### Causes

1. **Model Sensitivity**
   - Toxicity threshold too low
   - Context not considered
   - Training data bias

2. **Keyword Matching**
   - Overly broad patterns
   - No context awareness
   - Cultural differences ignored

3. **Spam Detection**
   - Normal patterns flagged
   - New user penalty too high
   - Link detection too aggressive

#### Solutions

**Step 1: Adjust Thresholds**

```typescript
// In src/lib/moderation/toxicity-detector.ts
interface ToxicityThresholds {
  block: number      // Auto-block (0.9)
  review: number     // Queue for review (0.7)
  warn: number       // Warn user (0.5)
}

const thresholds: ToxicityThresholds = {
  block: 0.95,   // Very high confidence only
  review: 0.75,  // Moderate confidence
  warn: 0.60,    // Low confidence
}

async detectToxicity(content: string): Promise<ModerationResult> {
  const score = await this.getScore(content)

  if (score >= thresholds.block) {
    return { action: 'block', score, reason: 'High toxicity' }
  } else if (score >= thresholds.review) {
    return { action: 'review', score, reason: 'Moderate toxicity' }
  } else if (score >= thresholds.warn) {
    return { action: 'warn', score, reason: 'Low toxicity' }
  }

  return { action: 'allow', score }
}
```

**Step 2: Add Context Awareness**

```typescript
async moderateWithContext(
  message: Message,
  context: MessageContext
): Promise<ModerationResult> {
  let score = await this.getBaseScore(message.content)

  // Adjust score based on context

  // Trusted users get benefit of doubt
  if (context.user.trustScore > 0.8) {
    score *= 0.8
  }

  // Consider channel type
  if (context.channel.type === 'private') {
    score *= 0.9 // Less strict in private channels
  }

  // Check if quote/discussion
  if (message.content.includes('>') || message.replyTo) {
    score *= 0.85 // Likely quoting/discussing, not endorsing
  }

  // Professional channels need different rules
  if (context.channel.tags?.includes('professional')) {
    score *= 1.2 // More strict
  }

  return this.applyThresholds(score)
}
```

**Step 3: Implement Allowlists**

```typescript
// In src/lib/moderation/content-classifier.ts
const allowedPatterns = [
  // Technical terms that might trigger false positives
  /\b(kill process|kill -9)\b/i,
  /\b(master\/slave|whitelist\/blacklist)\b/i, // Legacy tech terms

  // Common phrases
  /\b(that's insane|crazy good)\b/i,

  // Medical/scientific terms
  /\b(retarded growth|spastic colon)\b/i,
]

async classify(content: string): Promise<Classification> {
  // Check allowlist first
  for (const pattern of allowedPatterns) {
    if (pattern.test(content)) {
      return {
        category: 'allowed',
        confidence: 1.0,
        reason: 'Matched allowlist pattern',
      }
    }
  }

  // Proceed with normal classification
  return this.normalClassify(content)
}
```

**Step 4: Add User Trust Scores**

```typescript
interface UserTrustMetrics {
  accountAge: number // Days since joined
  messageCount: number // Total messages sent
  flaggedCount: number // Messages flagged
  manualReviewCount: number // Manual reviews needed
  appealSuccessRate: number // % of successful appeals
}

function calculateTrustScore(metrics: UserTrustMetrics): number {
  let score = 0.5 // Start neutral

  // Account age (max +0.2)
  score += Math.min(metrics.accountAge / 365, 0.2)

  // Message history (max +0.2)
  if (metrics.messageCount > 1000) score += 0.2
  else if (metrics.messageCount > 100) score += 0.1

  // Clean record (max +0.3)
  const flagRate = metrics.flaggedCount / Math.max(metrics.messageCount, 1)
  if (flagRate < 0.01) score += 0.3
  else if (flagRate < 0.05) score += 0.15

  // Successful appeals (max +0.2)
  score += metrics.appealSuccessRate * 0.2

  // Penalties
  if (metrics.manualReviewCount > 10) score -= 0.2

  return Math.max(0, Math.min(1, score))
}
```

**Step 5: Enable User Appeals**

```typescript
// Add appeal system
async appealModeration(
  messageId: string,
  userId: string,
  reason: string
): Promise<void> {
  await db.query(`
    INSERT INTO moderation_appeals (message_id, user_id, reason, status)
    VALUES ($1, $2, $3, 'pending')
  `, [messageId, userId, reason])

  // Notify moderators
  await notifyModerators({
    type: 'appeal_submitted',
    messageId,
    userId,
    reason,
  })
}

// Review appeal
async reviewAppeal(appealId: string, decision: 'approve' | 'reject'): Promise<void> {
  const appeal = await db.query(`
    SELECT * FROM moderation_appeals WHERE id = $1
  `, [appealId])

  if (decision === 'approve') {
    // Restore message
    await db.query(`
      UPDATE messages
      SET moderation_status = 'approved'
      WHERE id = $1
    `, [appeal.message_id])

    // Update user trust score
    await updateTrustScore(appeal.user_id, +0.05)
  }

  // Record decision
  await db.query(`
    UPDATE moderation_appeals
    SET status = $1, reviewed_at = NOW()
    WHERE id = $2
  `, [decision === 'approve' ? 'approved' : 'rejected', appealId])
}
```

#### Prevention Tips

- Regularly review false positive rates
- Implement user appeals process
- Use context-aware moderation
- Maintain allowlists for common false positives
- Monitor and adjust thresholds based on feedback

#### Related Logs

```bash
# False positives (later approved)
grep "Appeal approved" /var/log/nself-chat/app.log

# Flagging patterns
grep "Flagged:" /var/log/nself-chat/app.log | cut -d':' -f3 | sort | uniq -c
```

---

## API Issues

### 1. Rate Limiting Errors

#### Symptoms

- "Rate limit exceeded" errors
- 429 HTTP status codes
- Requests queued indefinitely
- Intermittent API failures

#### Causes

1. **Anthropic API Limits**
   - Too many requests per minute
   - Token limits exceeded
   - Concurrent request limits

2. **Application Limits**
   - No request queuing
   - Burst traffic not handled
   - Missing backoff logic

#### Solutions

**Step 1: Implement Request Queue**

```typescript
// In src/lib/ai/request-queue.ts
import PQueue from 'p-queue'

class AnthropicRequestQueue {
  private queue: PQueue

  constructor() {
    this.queue = new PQueue({
      concurrency: 5, // Max 5 concurrent requests
      interval: 60000, // Per minute
      intervalCap: 50, // Max 50 requests per minute
    })
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.add(fn)
  }

  getStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
    }
  }
}

export const requestQueue = new AnthropicRequestQueue()
```

**Step 2: Add Exponential Backoff**

```typescript
async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000)
        console.log(`Rate limited, waiting ${delay}ms before retry ${i + 1}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }

  throw new Error('Max retries exceeded')
}
```

**Step 3: Monitor Rate Limits**

```typescript
// Track rate limit headers
class RateLimitMonitor {
  private remaining = 0
  private resetAt = 0

  updateFromHeaders(headers: Headers): void {
    this.remaining = parseInt(headers.get('anthropic-ratelimit-requests-remaining') || '0')
    this.resetAt = parseInt(headers.get('anthropic-ratelimit-requests-reset') || '0')
  }

  shouldThrottle(): boolean {
    return this.remaining < 5 // Throttle when low
  }

  getWaitTime(): number {
    if (this.remaining > 0) return 0
    return Math.max(0, this.resetAt - Date.now())
  }
}

const monitor = new RateLimitMonitor()

async function makeRequest(payload: any): Promise<any> {
  if (monitor.shouldThrottle()) {
    const wait = monitor.getWaitTime()
    console.log(`Throttling requests, waiting ${wait}ms`)
    await new Promise((resolve) => setTimeout(resolve, wait))
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      /* ... */
    },
    body: JSON.stringify(payload),
  })

  monitor.updateFromHeaders(response.headers)

  return response.json()
}
```

#### Prevention Tips

- Implement request queuing from the start
- Monitor rate limit headers
- Set up alerts for rate limit warnings
- Use caching to reduce API calls
- Consider upgrading API tier if needed

#### Related Logs

```bash
# Rate limit errors
grep "Rate limit" /var/log/nself-chat/app.log

# Queue status
grep "Queue size" /var/log/nself-chat/app.log
```

---

## Performance Issues

### 1. Slow AI Responses

#### Symptoms

- AI operations take >10 seconds
- UI becomes unresponsive
- Users abandon features
- Timeout errors

#### Causes

1. **Large Inputs**
   - Too many messages sent to API
   - Very long individual messages
   - Unnecessary context included

2. **Network Latency**
   - Slow connection to Anthropic API
   - No CDN/edge optimization
   - Multiple round trips required

3. **Inefficient Processing**
   - No parallel processing
   - Blocking operations
   - Missing caching

#### Solutions

**Step 1: Optimize Input Size**

```typescript
function prepareMessages(messages: Message[], maxTokens = 4000): Message[] {
  // Truncate very long messages
  const truncated = messages.map((msg) => ({
    ...msg,
    content: msg.content.slice(0, 2000), // Max 2000 chars per message
  }))

  // Estimate tokens (rough: 1 token ≈ 4 chars)
  let tokenCount = 0
  const selected: Message[] = []

  // Prioritize recent messages
  for (let i = truncated.length - 1; i >= 0; i--) {
    const msgTokens = truncated[i].content.length / 4
    if (tokenCount + msgTokens > maxTokens) break

    selected.unshift(truncated[i])
    tokenCount += msgTokens
  }

  return selected
}
```

**Step 2: Enable Parallel Processing**

```typescript
async function processMultiple(items: any[]): Promise<any[]> {
  // Process in parallel with concurrency limit
  const results = await Promise.all(items.map((item) => requestQueue.add(() => process(item))))

  return results
}

// Example: Summarize multiple threads
async function summarizeThreads(threadIds: string[]): Promise<Map<string, string>> {
  const summaries = await Promise.all(
    threadIds.map(async (id) => {
      const messages = await getMessages(id)
      const summary = await summarize(messages)
      return [id, summary] as [string, string]
    })
  )

  return new Map(summaries)
}
```

**Step 3: Implement Response Streaming**

```typescript
// Stream responses to show progress
async function* streamSummary(messages: Message[]): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: formatMessages(messages),
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      yield chunk.delta.text
    }
  }
}

// In API route
export async function POST(req: Request) {
  const { messages } = await req.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const text of streamSummary(messages)) {
        controller.enqueue(encoder.encode(`data: ${text}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

**Step 4: Add Aggressive Caching**

```typescript
import { LRUCache } from 'lru-cache'

const summaryCache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour
  updateAgeOnGet: true,
})

// Generate cache key from message IDs
function getCacheKey(messages: Message[]): string {
  const ids = messages
    .map((m) => m.id)
    .sort()
    .join(',')
  return createHash('sha256').update(ids).digest('hex')
}

async function summarizeWithCache(messages: Message[]): Promise<string> {
  const key = getCacheKey(messages)

  // Check cache
  const cached = summaryCache.get(key)
  if (cached) {
    console.log('Cache hit for summary')
    return cached
  }

  // Generate summary
  const summary = await summarize(messages)

  // Cache result
  summaryCache.set(key, summary)

  return summary
}
```

#### Prevention Tips

- Optimize input size before API calls
- Use streaming for long operations
- Cache aggressively
- Process operations in parallel
- Monitor and optimize slow endpoints

#### Related Logs

```bash
# Slow operations
grep "took" /var/log/nself-chat/app.log | awk '$NF > 10000'

# Cache effectiveness
grep "Cache hit" /var/log/nself-chat/app.log | wc -l
```

---

## Common Error Messages

### Error: "API key not configured"

**Solution**: Set `ANTHROPIC_API_KEY` environment variable

### Error: "Embedding dimensions mismatch"

**Solution**: Regenerate all embeddings with consistent model

### Error: "Bot not found"

**Solution**: Re-register bot in database

### Error: "Moderation queue full"

**Solution**: Increase queue workers or clear backlog

### Error: "Vector extension not installed"

**Solution**: Run `CREATE EXTENSION vector` in PostgreSQL

### Error: "Rate limit exceeded"

**Solution**: Implement request queuing and backoff

### Error: "Context window exceeded"

**Solution**: Truncate input messages

### Error: "Sentiment analysis failed"

**Solution**: Check input language and format

---

## Monitoring and Debugging

### Enable Debug Logging

```typescript
// Set environment variable
DEBUG=ai:*

// Or in code
import debug from 'debug'
const log = debug('ai:summarizer')
log('Processing %d messages', messages.length)
```

### Check Service Health

```bash
# API health
curl http://localhost:3000/api/health

# Database health
psql -c "SELECT 1"

# Check all AI services
curl http://localhost:3000/api/ai/status
```

### Monitor Metrics

```typescript
// Track key metrics
import { metrics } from '@/lib/monitoring/metrics'

metrics.increment('ai.summarize.requests')
metrics.histogram('ai.summarize.duration', duration)
metrics.gauge('ai.queue.size', queue.size)
```

---

**End of AI Features Troubleshooting Guide**

For additional support:

- Check `/Users/admin/Sites/nself-chat/.claude/COMMON-ISSUES.md`
- Review Sentry error dashboard
- Consult API documentation in `/Users/admin/Sites/nself-chat/docs/`
