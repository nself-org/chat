# AI Orchestration ɳPlugin

**Version**: 1.0.0
**Category**: ai
**Port**: 3109
**Status**: Production Ready

---

## Overview

Unified AI operations with multi-provider support, cost management, rate limiting, and quality assurance for all AI features in ɳChat.

## Key Features

- **Multi-Provider**: OpenAI, Anthropic, Google, local models
- **Cost Management**: Per-user/org budgets, cost tracking, forecasting
- **Rate Limiting**: Token bucket, sliding window, burst protection
- **Quality Assurance**: Toxicity filtering, PII detection, output validation
- **Optimization**: Response caching, prompt optimization, load balancing

## Installation

```bash
cd backend
nself plugin install ai-orchestration
```

## Configuration

```bash
# .env.plugins
AI_ORCHESTRATION_ENABLED=true
AI_ORCHESTRATION_PORT=3109
AI_OPENAI_API_KEY=${OPENAI_API_KEY}
AI_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
AI_DEFAULT_CHAT_MODEL=gpt-4o-mini
AI_USER_DAILY_LIMIT=1.00
AI_CACHE_ENABLED=true
```

## Supported Providers

| Provider  | Models                  | Cost/1M Tokens |
| --------- | ----------------------- | -------------- |
| OpenAI    | GPT-4o, GPT-4o-mini, o1 | $0.15-$15.00   |
| Anthropic | Claude 3.5 Sonnet       | $3.00-$15.00   |
| Google    | Gemini 2.0 Flash        | $0.075-$0.30   |
| Local     | Ollama (Llama, Mistral) | $0.00          |

## API Endpoints

```typescript
POST /api/ai/chat                     # Chat completion
POST /api/ai/embed                    # Generate embeddings
POST /api/ai/moderate                 # Content moderation
POST /api/ai/summarize                # Text summarization
GET  /api/ai/usage                    # Usage stats
GET  /api/ai/costs                    # Cost breakdown
```

## Example Usage

```typescript
import { AIService } from '@/services/ai-v2'

const ai = new AIService()

// Chat completion with cost tracking
const response = await ai.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Summarize this conversation' }],
  userId: 'user-123',
})

console.log(response.content) // AI response
console.log(response.cost) // $0.0023
console.log(response.cached) // false
```

## Cost Management

```typescript
// Set user budget
await ai.setBudget('user-123', {
  daily: 1.0, // $1 per day
  monthly: 25.0, // $25 per month
})

// Get usage
const usage = await ai.getUsage('user-123', '7d')
console.log(usage.cost) // $5.67
console.log(usage.remaining) // $19.33
```

---

**Full Documentation**: See `/docs/plugins/AI-ORCHESTRATION-PLUGIN.md`
