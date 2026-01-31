# AI Administration Guide

**Version**: 1.0.0 (v0.7.0)
**Last Updated**: January 31, 2026
**Target Audience**: System Administrators, DevOps Engineers, AI Platform Managers

A comprehensive guide to administering AI features in nself-chat, including usage monitoring, cost management, provider configuration, rate limiting, and troubleshooting.

---

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Usage Monitoring](#usage-monitoring)
3. [Cost Management](#cost-management)
4. [Provider Configuration](#provider-configuration)
5. [Rate Limiting](#rate-limiting)
6. [Embedding Management](#embedding-management)
7. [Bot Management](#bot-management)
8. [Moderation Settings](#moderation-settings)
9. [Troubleshooting](#troubleshooting)

---

## Dashboard Overview

### Accessing the AI Dashboard

The AI Administration Dashboard provides a unified view of all AI-related metrics and controls.

**Navigation**:
1. Sign in as an admin user
2. Go to **Admin Panel** (gear icon in sidebar)
3. Click **AI Management** in the left menu
4. Select **Dashboard** tab

**Dashboard URL**: `/admin/ai/dashboard`

### Key Metrics at a Glance

The dashboard displays real-time metrics across four main areas:

#### 1. Cost Summary Card

```
┌────────────────────────────────────┐
│ 💰 Total Cost                     │
│ $234.56                            │
│                                    │
│ ████████████░░░░ 78% of budget    │
│ $65.44 remaining                   │
└────────────────────────────────────┘
```

**Metrics**:
- **Total Cost**: Current spending for selected period (daily/monthly)
- **Budget Progress**: Visual progress bar showing budget utilization
- **Remaining Budget**: How much you have left before hitting limits
- **Budget Status**: Color-coded indicator (green/yellow/red)

**Color Codes**:
- 🟢 Green (0-70%): Healthy spending
- 🟡 Yellow (71-90%): Approaching limit
- 🔴 Red (91-100%): Near or over budget

#### 2. Request Volume Card

```
┌────────────────────────────────────┐
│ 📊 Total Requests                 │
│ 12,458                             │
│                                    │
│ Avg: $0.0188 per request          │
└────────────────────────────────────┘
```

**Metrics**:
- **Total Requests**: Number of AI API calls made
- **Average Cost**: Cost per request calculation
- **Trend**: Up/down arrow showing change vs previous period

#### 3. Cache Performance Card

```
┌────────────────────────────────────┐
│ ⚡ Cache Hit Rate                 │
│ 87.3%                              │
│                                    │
│ 10,879 hits · 1,579 misses        │
└────────────────────────────────────┘
```

**Metrics**:
- **Hit Rate**: Percentage of requests served from cache
- **Total Hits**: Number of cached responses used
- **Total Misses**: Number of requests that required API calls
- **Cache Savings**: Estimated cost savings from caching

**Target Hit Rate**: 80%+ is excellent, 60-80% is good, <60% needs optimization

#### 4. Queue Status Card

```
┌────────────────────────────────────┐
│ ⏱️  Queue Status                   │
│ 47                                 │
│                                    │
│ 12 processing · 35 pending        │
└────────────────────────────────────┘
```

**Metrics**:
- **Total Queued**: Items waiting or being processed
- **Processing**: Currently active jobs
- **Pending**: Waiting in queue
- **Failed**: Recent failures requiring attention

### Period Selector

Toggle between reporting periods:

```
[ Today ] [ This Month ]
```

- **Today**: Shows metrics since midnight (resets daily)
- **This Month**: Shows metrics since the 1st of the current month

**Auto-refresh**: Dashboard refreshes every 30 seconds automatically

### Action Buttons

Three primary action buttons in the header:

1. **🔄 Refresh**: Manually refresh all data immediately
2. **📥 Export**: Download current data as CSV or JSON
3. **⚙️ Settings**: Quick access to AI configuration

---

## Usage Monitoring

### API Calls by Feature

Track which AI features consume the most API calls and budget.

**View**: Dashboard → **By Endpoint** tab

#### Distribution Chart

```
┌─────────────────────────────────────────────────────────┐
│  Requests by Endpoint                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Summarization ████████████ 5,234 (42%)         │  │
│  │  Search        ████████ 3,456 (28%)              │  │
│  │  Embeddings    ██████ 2,345 (19%)                │  │
│  │  Chat          ███ 1,234 (10%)                   │  │
│  │  Moderation    █ 189 (1%)                        │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Endpoint Breakdown**:

| Endpoint | Requests | % of Total | Avg Cost | Total Cost |
|----------|----------|------------|----------|------------|
| `/ai/summarize` | 5,234 | 42% | $0.0234 | $122.47 |
| `/search` | 3,456 | 28% | $0.0015 | $5.18 |
| `/ai/embed` | 2,345 | 19% | $0.0002 | $0.47 |
| `/ai/chat` | 1,234 | 10% | $0.0456 | $56.27 |
| `/moderation/analyze` | 189 | 1% | $0.0123 | $2.32 |

**Actions**:
- Click any endpoint to see detailed breakdown
- Export endpoint data for analysis
- Configure rate limits per endpoint

### Users Consuming Most AI

Identify top AI users to understand usage patterns and potential optimization opportunities.

**View**: Dashboard → **Top Users** tab

#### Top Users Table

```
┌──────────────────────────────────────────────────────────────┐
│  Rank  User             Requests  Cost      % of Total       │
├──────────────────────────────────────────────────────────────┤
│  1     sarah@example    1,847     $89.23    38.0%  ████████ │
│  2     mike@example     1,234     $56.78    24.2%  ██████   │
│  3     alex@example     891       $34.12    14.5%  ████     │
│  4     emma@example     567       $23.45    10.0%  ███      │
│  5     david@example    423       $18.90    8.1%   ██       │
└──────────────────────────────────────────────────────────────┘
```

**Columns Explained**:
- **Rank**: Position by cost (1 = highest spender)
- **User**: User email or username
- **Requests**: Total API calls made by this user
- **Cost**: Total spending attributed to this user
- **% of Total**: Percentage of total AI budget consumed
- **Visual Bar**: Quick visual comparison

**Filtering Options**:
- Filter by date range (last 7 days, 30 days, all time)
- Filter by feature (summarization only, search only, etc.)
- Filter by organization (for multi-tenant setups)

**Use Cases**:

1. **Power User Identification**: Find users who heavily rely on AI features
2. **Training Opportunities**: Identify users who might benefit from efficiency training
3. **Budget Allocation**: Understand if costs are concentrated or distributed
4. **Abuse Detection**: Spot unusual usage patterns that might indicate misuse

**Actions**:
- Click user to see detailed activity log
- Set per-user rate limits
- Send usage reports to users
- Configure usage alerts

### Peak Usage Times

Understand when AI features are most heavily used to optimize capacity and costs.

**View**: Dashboard → **Usage Trends** tab

#### Hourly Usage Chart

```
┌─────────────────────────────────────────────────────────┐
│  Requests per Hour (Last 24 Hours)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 800                                               │  │
│  │ 600      ▄▄                                       │  │
│  │ 400    ▄▄██▄▄                                     │  │
│  │ 200  ▄▄██████▄▄                                   │  │
│  │   0▄▄██████████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄         │  │
│  │    00 02 04 06 08 10 12 14 16 18 20 22          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Insights**:
- **Peak Hours**: Typically 9 AM - 11 AM and 2 PM - 4 PM (work hours)
- **Low Usage**: Nights and weekends
- **Patterns**: Identify daily/weekly patterns

**Cost Optimization Opportunities**:

1. **Off-Peak Processing**: Schedule bulk operations during low-usage hours
2. **Cache Pre-warming**: Warm caches before peak hours
3. **Capacity Planning**: Scale resources based on predicted demand
4. **Budget Pacing**: Monitor real-time spending vs expected daily budget

#### Weekly Pattern Analysis

```
Weekly Usage Pattern:
Monday    ████████████ 2,345 requests
Tuesday   ███████████░ 2,123 requests
Wednesday ████████████ 2,401 requests
Thursday  ███████████░ 2,234 requests
Friday    ██████████░░ 1,956 requests
Saturday  ████░░░░░░░░ 567 requests
Sunday    ███░░░░░░░░░ 423 requests
```

**Typical Patterns**:
- **Weekdays**: Consistent high usage (2,000-2,500 requests/day)
- **Weekends**: 70-80% reduction in usage
- **Monday Peak**: Often highest due to catch-up activities

### Real-Time Monitoring

**Live Feed**: `/admin/ai/monitoring/live`

View AI requests in real-time as they happen:

```
┌─────────────────────────────────────────────────────────┐
│  Live AI Request Feed                                   │
├─────────────────────────────────────────────────────────┤
│  14:23:45  sarah@example    /ai/summarize     $0.0234  │
│  14:23:43  mike@example     /search           $0.0015  │
│  14:23:41  alex@example     /ai/embed         $0.0002  │
│  14:23:39  emma@example     /ai/chat          $0.0456  │
│  14:23:37  david@example    /ai/summarize     $0.0234  │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Auto-updating (1-second refresh)
- Color-coded by endpoint
- Click to see full request details
- Filter by user, endpoint, or time range
- Pause/resume feed
- Export recent activity

**Use Cases**:
- Debug user-reported issues in real-time
- Monitor system health during deployments
- Observe effects of configuration changes
- Detect anomalies or spikes

---

## Cost Management

### Real-Time Cost Tracking

The cost tracking system provides accurate, up-to-the-minute spending information.

#### How Costs Are Calculated

**Formula**:
```
Total Cost = (Input Tokens / 1000) × Input Price + (Output Tokens / 1000) × Output Price
```

**Example** (GPT-4o-mini):
```
Request:
- Input: 2,345 tokens × $0.00015/1k = $0.00035
- Output: 567 tokens × $0.0006/1k = $0.00034
- Total: $0.00069
```

**Current Model Pricing** (as of January 2026):

| Model | Provider | Input ($/1k) | Output ($/1k) | Typical Use |
|-------|----------|--------------|---------------|-------------|
| GPT-4o-mini | OpenAI | $0.00015 | $0.0006 | Summarization, chat |
| GPT-4o | OpenAI | $0.005 | $0.015 | Complex reasoning |
| GPT-4 Turbo | OpenAI | $0.01 | $0.03 | High-quality summaries |
| Claude 3.5 Haiku | Anthropic | $0.0008 | $0.004 | Fast responses |
| Claude 3.5 Sonnet | Anthropic | $0.003 | $0.015 | Balanced performance |
| text-embedding-3-small | OpenAI | $0.00002 | $0 | Embeddings (default) |

**Cost Tracking Features**:

1. **Per-Request Tracking**: Every API call is logged with exact token usage
2. **User Attribution**: Costs are attributed to the requesting user
3. **Organization Rollup**: Multi-tenant setups track per-organization costs
4. **Model Breakdown**: See which models cost the most
5. **Historical Data**: 90-day retention for trend analysis

### Budget Alerts Setup

Configure automatic alerts to prevent unexpected cost overruns.

**Navigation**: Admin Panel → AI Configuration → Budgets tab

#### Creating a Budget Alert

**Step-by-step**:

1. **Click "Create Budget Alert"**

2. **Configure Alert Settings**:

```
┌─────────────────────────────────────────────────────────┐
│  Create Budget Alert                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Alert Name: *                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Production Daily Budget                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Budget Limit: *                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ $ 100.00                                        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Period: *                                              │
│  ◉ Daily    ○ Weekly    ○ Monthly                     │
│                                                          │
│  Alert Thresholds:                                      │
│  ☑ 50%   ☑ 75%   ☑ 90%   ☑ 100%                      │
│                                                          │
│  Notification Recipients:                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ admin@example.com, devops@example.com          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Notification Methods:                                  │
│  ☑ Email    ☑ Slack    ☐ Webhook                     │
│                                                          │
│  [ Cancel ]                    [ Create Alert ]        │
└─────────────────────────────────────────────────────────┘
```

3. **Configure Notification Settings**:

**Email Template**:
```
Subject: [nself-chat] AI Budget Alert - 75% Threshold Reached

Your AI spending has reached 75% of the daily budget.

Current Spending: $75.00
Daily Limit: $100.00
Remaining: $25.00
Time Left: 8 hours 23 minutes

Top Consumers:
1. sarah@example.com - $28.50 (38%)
2. mike@example.com - $19.75 (26%)
3. alex@example.com - $12.25 (16%)

View Details: https://your-instance.com/admin/ai/dashboard
```

**Slack Notification**:
```
⚠️ AI Budget Alert - 75% Threshold Reached

Current: $75.00 / $100.00 (75%)
Remaining: $25.00

Top consumers:
• sarah@example.com - $28.50 (38%)
• mike@example.com - $19.75 (26%)

[View Dashboard]
```

#### Alert Configuration Options

**Alert Types**:

1. **Global Budget**: Workspace-wide spending limit
2. **Per-User Budget**: Individual user spending caps
3. **Per-Org Budget**: Organization-level limits (multi-tenant)
4. **Per-Feature Budget**: Limit spending per AI feature

**Alert Actions**:

- **Notify Only**: Send alert but continue service
- **Throttle**: Reduce rate limits when threshold reached
- **Suspend**: Temporarily disable AI features at 100%
- **Fallback**: Switch to cheaper models (e.g., GPT-4o → GPT-4o-mini)

**Best Practices**:

✅ **Do**:
- Set multiple thresholds (50%, 75%, 90%, 100%)
- Include multiple notification recipients
- Test alerts before going live
- Review and adjust monthly based on usage
- Set both daily and monthly budgets

❌ **Avoid**:
- Setting limits too low (causes service disruption)
- Only alerting at 100% (no time to respond)
- Ignoring repeated alerts (indicates need for adjustment)
- Setting budgets without baseline data

### Cost Optimization Tips

#### 1. Model Selection Optimization

**Recommendation**: Use the cheapest model that meets quality requirements.

**Model Tier Guide**:

```
┌─────────────────────────────────────────────────────┐
│  Task Complexity          Recommended Model         │
├─────────────────────────────────────────────────────┤
│  Simple summarization    → GPT-4o-mini             │
│  Search embeddings       → text-embedding-3-small   │
│  Chat responses          → Claude 3.5 Haiku        │
│  Complex analysis        → GPT-4o                   │
│  High-quality content    → Claude 3.5 Sonnet       │
│  Critical accuracy       → GPT-4 Turbo             │
└─────────────────────────────────────────────────────┘
```

**Cost Comparison** (1,000 requests, 1,000 tokens each):

| Model | Input Cost | Output Cost | Total Cost | vs GPT-4o-mini |
|-------|------------|-------------|------------|----------------|
| GPT-4o-mini | $0.15 | $0.60 | **$0.75** | 1x (baseline) |
| Claude 3.5 Haiku | $0.80 | $4.00 | **$4.80** | 6.4x |
| GPT-4o | $5.00 | $15.00 | **$20.00** | 26.7x |
| GPT-4 Turbo | $10.00 | $30.00 | **$40.00** | 53.3x |

**Optimization Strategy**:
1. Start with GPT-4o-mini for all features
2. Monitor quality metrics
3. Upgrade specific features if quality is insufficient
4. A/B test to validate quality improvements justify cost increases

#### 2. Caching Strategies

**Cache Effectiveness**:
- 80% hit rate = 80% cost reduction for cached requests
- Embedding cache saves 100% of embedding API costs on cache hits

**Cache Configuration**: Admin Panel → AI Configuration → Cache tab

**Recommended TTL (Time-To-Live) Settings**:

| Feature | Recommended TTL | Reasoning |
|---------|----------------|-----------|
| Summarization | 1 hour | Conversations change frequently |
| Search Results | 5 minutes | Balance freshness vs cost |
| Embeddings | 24 hours | Message content is immutable |
| Chat Responses | Disabled | Each conversation is unique |

**Cache Tuning**:

```javascript
// Increase cache TTL for stable content
{
  summarizationTtl: 3600,    // 1 hour
  searchTtl: 300,            // 5 minutes
  embeddingsTtl: 86400,      // 24 hours
  chatTtl: 0                 // Disabled
}
```

**Monitoring Cache Performance**:
- Target: 80%+ hit rate for embeddings
- Target: 60%+ hit rate for summarization
- Target: 40%+ hit rate for search

**Improving Hit Rate**:
1. Increase TTL values
2. Normalize cache keys (e.g., lowercase, trim whitespace)
3. Use semantic similarity for near-match caching
4. Pre-populate cache for common queries

#### 3. Batch Processing

Process multiple items in a single API call to reduce overhead.

**Example - Batch Embedding Generation**:

```javascript
// ❌ Bad: Individual requests (100 API calls)
for (const message of messages) {
  await generateEmbedding(message)
}

// ✅ Good: Batch request (1 API call)
await generateEmbeddings(messages)
```

**Cost Savings**:
- Individual: 100 requests × $0.0002 = $0.02
- Batch: 1 request × $0.0002 = $0.0002
- **Savings: 99%**

**Batch Processing Features**:

1. **Bulk Embedding Generation**: `/admin/ai/embeddings/generate-bulk`
2. **Scheduled Digest Jobs**: Process summaries off-peak
3. **Async Processing**: Queue low-priority tasks

#### 4. Rate Limit Optimization

Balance user experience with cost control.

**Per-User Limits** (Recommended):

```javascript
{
  summarization: {
    maxRequests: 50,      // 50 requests per hour
    windowMs: 3600000     // 1 hour window
  },
  search: {
    maxRequests: 20,      // 20 searches per minute
    windowMs: 60000       // 1 minute window
  },
  chat: {
    maxRequests: 10,      // 10 chats per minute
    windowMs: 60000       // 1 minute window
  }
}
```

**Progressive Rate Limiting**:
```
Free Tier:     10 requests/hour
Standard:      50 requests/hour
Premium:       200 requests/hour
Enterprise:    Unlimited
```

#### 5. Model Fallback Chains

Automatically downgrade to cheaper models on rate limits or budget exhaustion.

**Configuration**:

```javascript
{
  openai: {
    defaultModel: 'gpt-4o',
    fallbackModel: 'gpt-4o-mini',  // 26x cheaper
    maxRetries: 3
  },
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    fallbackModel: 'claude-3-5-haiku-20241022',  // 6x cheaper
    maxRetries: 3
  }
}
```

**Fallback Triggers**:
1. Rate limit exceeded → Try fallback model
2. Budget threshold (90%) → Switch to fallback automatically
3. API error (500-series) → Retry with fallback
4. Timeout → Use faster fallback model

**Cost Impact Example**:
- 1,000 requests normally on GPT-4o = $20.00
- 200 fallback to GPT-4o-mini = $0.15
- **Total: $16.15 (19% savings)**

---

## Provider Configuration

### OpenAI Setup

Configure OpenAI as your primary AI provider for summarization and embeddings.

**Navigation**: Admin Panel → AI Configuration → Providers tab → OpenAI

#### Step-by-Step Configuration

**1. Obtain API Key**:

- Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Click "Create new secret key"
- Copy the key (starts with `sk-`)
- Store securely (shown only once)

**2. Configure Environment Variable**:

```bash
# .env.local (for self-hosted deployments)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Enable OpenAI in Admin Panel**:

```
┌─────────────────────────────────────────────────────────┐
│  OpenAI Configuration                       [ Enabled ] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  API Key Status: ✅ Configured (via environment)        │
│                                                          │
│  Default Model: *                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ GPT-4o-mini ▼                                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Fallback Model: *                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ GPT-3.5 Turbo ▼                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Timeout (ms): *                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ 30000                                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Max Retries: *                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 3                                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Organization ID (optional):                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ org-xxxxxxxxxxxxx                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [ Test Connection ]            [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

**4. Test Connection**:

Click "Test Connection" to verify:
```
✅ Connection successful
✅ Model access verified (gpt-4o-mini)
✅ Embedding model available (text-embedding-3-small)
ℹ️  Rate limits: 10,000 RPM, 2,000,000 TPM
```

#### Model Selection Guide

**Summarization Models**:

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| GPT-4o-mini | ⚡⚡⚡ | 💰 | ⭐⭐⭐ | High-volume, cost-sensitive |
| GPT-4o | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐ | Balanced quality & cost |
| GPT-4 Turbo | ⚡ | 💰💰💰💰💰 | ⭐⭐⭐⭐⭐ | Highest quality needed |

**Embedding Models**:

| Model | Dimensions | Cost | Performance |
|-------|-----------|------|-------------|
| text-embedding-3-small | 1536 | $0.00002/1k | Recommended (default) |
| text-embedding-3-large | 3072 | $0.00013/1k | Higher accuracy, 6.5x cost |

**Recommendation**: Use `gpt-4o-mini` + `text-embedding-3-small` for 99% of use cases.

#### Advanced Settings

**Temperature** (Randomness):
```
0.0 = Deterministic (same input → same output)
0.7 = Balanced creativity (recommended)
1.0 = Maximum creativity
```

**Max Tokens** (Response Length):
```
Summarization: 500 tokens (≈375 words)
Chat: 1000 tokens (≈750 words)
```

**Presence Penalty** (Avoid repetition):
```
0.0 = No penalty
0.6 = Moderate (recommended)
1.0 = Strong penalty
```

### Anthropic Setup

Configure Anthropic Claude for high-quality summarization and chat.

**Navigation**: Admin Panel → AI Configuration → Providers tab → Anthropic

#### Step-by-Step Configuration

**1. Obtain API Key**:

- Go to [https://console.anthropic.com/](https://console.anthropic.com/)
- Navigate to API Keys
- Click "Create Key"
- Copy the key (starts with `sk-ant-`)

**2. Configure Environment Variable**:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Enable Anthropic in Admin Panel**:

```
┌─────────────────────────────────────────────────────────┐
│  Anthropic Configuration                    [ Enabled ] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  API Key Status: ✅ Configured (via environment)        │
│                                                          │
│  Default Model: *                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ Claude 3.5 Haiku ▼                              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Fallback Model: *                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ Claude 3 Haiku ▼                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [ Test Connection ]            [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

**4. Test Connection**:

```
✅ Connection successful
✅ Model access verified (claude-3-5-haiku-20241022)
ℹ️  Rate limits: 1,000 RPM, 100,000 TPM
```

#### When to Use Anthropic vs OpenAI

**Use Anthropic (Claude) when**:
- ✅ Need highest quality summarization
- ✅ Processing very long conversations (200k token context)
- ✅ Want better handling of nuanced content
- ✅ Cost is less of a concern

**Use OpenAI when**:
- ✅ Need embeddings (Anthropic doesn't offer embeddings)
- ✅ Cost optimization is priority
- ✅ Need faster response times
- ✅ High request volume

**Hybrid Approach** (Recommended):
```
Summarization: Anthropic Claude 3.5 Haiku
Embeddings: OpenAI text-embedding-3-small
Search: OpenAI (requires embeddings)
Chat: Anthropic Claude 3.5 Haiku
Moderation: Local TensorFlow.js (free)
```

### Switching Providers

Change AI providers dynamically without downtime.

#### Provider Switching Process

**1. Navigate to Provider Settings**:
Admin Panel → AI Configuration → Providers

**2. Change Primary Provider**:

```
┌─────────────────────────────────────────────────────────┐
│  Primary Provider Selection                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Summarization:                                          │
│  ◉ OpenAI      ○ Anthropic      ○ Local                │
│                                                          │
│  Embeddings:                                             │
│  ◉ OpenAI      ○ Local                                  │
│                                                          │
│  Chat:                                                   │
│  ○ OpenAI      ◉ Anthropic      ○ Local                │
│                                                          │
│  [ Apply Changes ]                                       │
└─────────────────────────────────────────────────────────┘
```

**3. Verify Switch**:
- System will test new provider
- Show confirmation message
- Log switch event for audit

**4. Monitor Performance**:
- Watch error rates for 24 hours
- Compare quality metrics
- Review user feedback

#### Graceful Migration

**Best Practices**:

1. **Test in Staging First**:
   ```bash
   # Staging environment
   NEXT_PUBLIC_ENV=staging npm run test:ai-providers
   ```

2. **Enable Fallback Chain**:
   ```javascript
   {
     primary: 'anthropic',
     fallback: 'openai',
     localFallback: true
   }
   ```

3. **Gradual Rollout**:
   - 10% of users for 1 day
   - 50% of users for 1 day
   - 100% of users

4. **Monitor Metrics**:
   - Error rate (should stay <5%)
   - Response time (should be within 20% of baseline)
   - Cost per request
   - User satisfaction scores

**Rollback Plan**:
```bash
# Quick rollback if issues detected
curl -X POST https://your-instance.com/api/admin/ai/providers/revert
```

### Fallback Configuration

Configure automatic failover when primary provider has issues.

```
┌─────────────────────────────────────────────────────────┐
│  Fallback Chain Configuration                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Fallback Strategy:                                      │
│  ◉ Cascade (try each in order)                         │
│  ○ Round-robin (distribute load)                        │
│  ○ Cost-optimized (cheapest first)                      │
│                                                          │
│  Summarization Fallback Chain:                           │
│  1. Anthropic Claude 3.5 Haiku   (Primary)              │
│  2. OpenAI GPT-4o-mini           (First fallback)       │
│  3. Local summarization          (Last resort)          │
│                                                          │
│  Fallback Triggers:                                      │
│  ☑ Rate limit exceeded                                  │
│  ☑ API error (500-series)                               │
│  ☑ Timeout (>30 seconds)                                │
│  ☑ Budget threshold (90%)                               │
│  ☐ Quality score below threshold                        │
│                                                          │
│  [ Save Configuration ]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Rate Limiting

### Per-User Limits

Control individual user AI consumption to prevent abuse and manage costs.

**Navigation**: Admin Panel → AI Configuration → Rate Limits tab → Per User

#### Default User Rate Limits

```
┌─────────────────────────────────────────────────────────┐
│  Per-User Rate Limits                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Summarization:                                          │
│  Max Requests: 50        Window: 1 hour                 │
│  ┌────────────┐         ┌───────────┐                  │
│  │ 50         │         │ 3600000   │  milliseconds    │
│  └────────────┘         └───────────┘                  │
│                                                          │
│  Search:                                                 │
│  Max Requests: 20        Window: 1 minute               │
│  ┌────────────┐         ┌───────────┐                  │
│  │ 20         │         │ 60000     │  milliseconds    │
│  └────────────┘         └───────────┘                  │
│                                                          │
│  Chat:                                                   │
│  Max Requests: 10        Window: 1 minute               │
│  ┌────────────┐         ┌───────────┐                  │
│  │ 10         │         │ 60000     │  milliseconds    │
│  └────────────┘         └───────────┘                  │
│                                                          │
│  Embeddings:                                             │
│  Max Requests: 30        Window: 1 minute               │
│  ┌────────────┐         ┌───────────┐                  │
│  │ 30         │         │ 60000     │  milliseconds    │
│  └────────────┘         └───────────┘                  │
│                                                          │
│  [ Reset to Defaults ]          [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

#### Rate Limit Algorithm

**Token Bucket Implementation**:
- Each user has a "bucket" of tokens
- Each request consumes 1 token
- Bucket refills at a constant rate
- When bucket is empty, requests are rejected

**Example**:
```
User Rate Limit: 50 requests/hour
Bucket Size: 50 tokens
Refill Rate: 50 tokens / 3600 seconds = 0.0139 tokens/second

Time 0:00  → Bucket: 50 tokens (full)
Request 1  → Bucket: 49 tokens
Request 2  → Bucket: 48 tokens
...
Time 0:01  → Bucket: 48.83 tokens (refilled 0.83)
```

#### User-Specific Overrides

Set custom limits for specific users or groups.

**Navigation**: Admin Panel → Users → [Select User] → AI Limits

```
┌─────────────────────────────────────────────────────────┐
│  Custom Rate Limits for sarah@example.com               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Override Default Limits:  [Enabled]                    │
│                                                          │
│  Tier: ◉ Premium   ○ Enterprise   ○ Custom             │
│                                                          │
│  Premium Tier Limits:                                    │
│  Summarization: 200/hour (vs 50 default)                │
│  Search: 100/minute (vs 20 default)                     │
│  Chat: 50/minute (vs 10 default)                        │
│                                                          │
│  [ Revert to Default ]          [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

**Tier Definitions**:

| Tier | Summarization | Search | Chat | Cost Budget |
|------|---------------|--------|------|-------------|
| Free | 10/hour | 5/min | 3/min | $5/month |
| Standard | 50/hour | 20/min | 10/min | $25/month |
| Premium | 200/hour | 100/min | 50/min | $100/month |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

### Per-Organization Limits

Control organization-wide AI consumption in multi-tenant environments.

**Navigation**: Admin Panel → Organizations → [Select Org] → AI Limits

```
┌─────────────────────────────────────────────────────────┐
│  Organization Rate Limits: Acme Corp                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Current Usage (Last Hour):                              │
│  Requests: 3,847 / 5,000  (77%)  ███████████░░░        │
│                                                          │
│  Organization Limits:                                    │
│                                                          │
│  Summarization:                                          │
│  Max Requests: 5000      Window: 1 hour                 │
│  ┌────────────┐         ┌───────────┐                  │
│  │ 5000       │         │ 3600000   │  milliseconds    │
│  └────────────┘         └───────────┘                  │
│                                                          │
│  Total Budget: $1000/month                              │
│  Current Spend: $687.34  (69%)  ██████████████░░░      │
│                                                          │
│  [ View Usage Report ]          [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

**Organization-Level Features**:

1. **Aggregate Limits**: Total requests across all users
2. **Cost Caps**: Prevent runaway costs
3. **Fair Use Enforcement**: Prevent single user from consuming all quota
4. **Reporting**: Detailed per-org analytics

### Endpoint-Specific Limits

Fine-tune rate limits per AI feature/endpoint.

**Configuration**: `/admin/ai/rate-limits/endpoints`

```
┌────────────────────────────────────────────────────────────────┐
│  Endpoint-Specific Rate Limits                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /api/ai/summarize                                              │
│  ├─ User:  50 req/hour                                         │
│  ├─ Org:   500 req/hour                                        │
│  └─ Global: 10,000 req/hour                                    │
│                                                                 │
│  /api/search                                                    │
│  ├─ User:  20 req/min                                          │
│  ├─ Org:   1,000 req/hour                                      │
│  └─ Global: 50,000 req/hour                                    │
│                                                                 │
│  /api/ai/embed                                                  │
│  ├─ User:  30 req/min                                          │
│  ├─ Org:   5,000 req/hour                                      │
│  └─ Global: 100,000 req/hour                                   │
│                                                                 │
│  /api/ai/chat                                                   │
│  ├─ User:  10 req/min                                          │
│  ├─ Org:   1,000 req/hour                                      │
│  └─ Global: 20,000 req/hour                                    │
│                                                                 │
│  [ Edit All ]  [ Export Config ]  [ Reset to Defaults ]       │
└────────────────────────────────────────────────────────────────┘
```

**Endpoint-Specific Strategies**:

1. **Expensive Operations** (Summarization):
   - Lower limits (50/hour)
   - Longer windows (hourly)
   - Higher costs justify stricter controls

2. **High-Volume Operations** (Search):
   - Higher limits (20/minute)
   - Shorter windows (per-minute)
   - Frequent but cheap operations

3. **Real-Time Features** (Chat):
   - Moderate limits (10/minute)
   - Short windows (per-minute)
   - Balance UX and cost

---

## Embedding Management

### Coverage Statistics

Monitor how many messages have embeddings generated for search functionality.

**Navigation**: Admin Panel → AI Management → Embeddings → Coverage

#### Coverage Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Embedding Coverage Report                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Overall Coverage:                                       │
│  ████████████████████░░ 87.3% (45,234 / 51,823)        │
│                                                          │
│  By Channel:                                             │
│  #engineering      ████████████████████ 95.2% ✅       │
│  #design           ███████████████████░ 89.1% ✅       │
│  #general          ██████████████░░░░░░ 71.3% ⚠️       │
│  #random           ████░░░░░░░░░░░░░░░░ 23.4% ❌       │
│                                                          │
│  Missing Embeddings: 6,589 messages                     │
│  Failed Embeddings: 234 messages (requires retry)       │
│  Queued for Processing: 1,423 messages                  │
│                                                          │
│  [ Generate Missing ]  [ Retry Failed ]  [ View Log ]  │
└─────────────────────────────────────────────────────────┘
```

**Coverage Thresholds**:
- 🟢 90-100%: Excellent (search works great)
- 🟡 70-89%: Good (some search gaps)
- 🔴 <70%: Poor (search quality degraded)

#### Historical Coverage Trends

```
Coverage Over Time (Last 30 Days):

100% ┤                                               ╭──
 90% ┤                                       ╭───────╯
 80% ┤                               ╭───────╯
 70% ┤                       ╭───────╯
 60% ┤               ╭───────╯
 50% ┤       ╭───────╯
     └─┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬
       1     5     10    15    20    25    30

 ✅ Target coverage (90%) reached on Day 28
```

### Bulk Generation

Generate embeddings for multiple messages at once to improve search coverage.

**Navigation**: Admin Panel → AI Management → Embeddings → Bulk Generate

#### Bulk Generation Interface

```
┌─────────────────────────────────────────────────────────┐
│  Bulk Embedding Generation                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Scope:                                                  │
│  ◉ All missing embeddings (6,589 messages)             │
│  ○ Specific channel: [Select Channel ▼]                │
│  ○ Date range: [From: ___] [To: ___]                   │
│                                                          │
│  Estimated Cost: $0.13 (6,589 messages × $0.00002)     │
│  Estimated Time: 12 minutes (9 requests/sec)            │
│                                                          │
│  Processing Options:                                     │
│  Priority: ◉ Normal  ○ High  ○ Low                     │
│  Batch Size: [100] messages per request                │
│                                                          │
│  Schedule:                                               │
│  ◉ Start immediately                                    │
│  ○ Schedule for: [Date/Time Picker]                    │
│                                                          │
│  [ Cancel ]                    [ Start Generation ]     │
└─────────────────────────────────────────────────────────┘
```

#### Bulk Generation Progress

Once started, monitor progress in real-time:

```
┌─────────────────────────────────────────────────────────┐
│  Bulk Generation in Progress                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Progress: 4,234 / 6,589 (64.3%)                        │
│  ████████████████████████░░░░░░░░░░░░░░                │
│                                                          │
│  Status: Processing batch 43/66...                      │
│  Rate: 127 messages/min                                 │
│  Time Elapsed: 7m 32s                                   │
│  Time Remaining: ~4m 15s                                │
│                                                          │
│  Statistics:                                             │
│  ✅ Successful: 4,189                                   │
│  ⏳ In Progress: 100                                    │
│  ❌ Failed: 45                                          │
│  ⏸️  Queued: 2,255                                      │
│                                                          │
│  [ Pause ]  [ Cancel ]  [ View Details ]                │
└─────────────────────────────────────────────────────────┘
```

**Best Practices**:

1. **Off-Peak Hours**: Schedule bulk jobs during low usage times (nights, weekends)
2. **Batch Size**: Use 100-200 messages per batch for optimal performance
3. **Priority**: Use "Low" priority to avoid impacting user requests
4. **Monitoring**: Watch for rate limit errors; adjust rate if needed

### Re-indexing

Regenerate embeddings for existing messages (e.g., after model upgrades).

**When to Re-index**:

1. **Model Upgrade**: Switched from embedding-3-small to embedding-3-large
2. **Quality Issues**: Detecting poor search results
3. **Data Corruption**: Embeddings corrupted or lost
4. **Configuration Change**: Changed embedding dimensions

**Navigation**: Admin Panel → AI Management → Embeddings → Re-index

```
┌─────────────────────────────────────────────────────────┐
│  Re-index Embeddings                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠️  Warning: Re-indexing will regenerate all          │
│     embeddings, incurring API costs.                    │
│                                                          │
│  Scope:                                                  │
│  ◉ All messages (51,823 messages)                      │
│  ○ Messages with embeddings (45,234 messages)          │
│  ○ Specific date range                                  │
│                                                          │
│  New Model:                                              │
│  ┌────────────────────────────────────────────────┐    │
│  │ text-embedding-3-large ▼                        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Estimated Cost: $6.74 (51,823 × $0.00013)             │
│  Estimated Time: 47 minutes                             │
│                                                          │
│  Options:                                                │
│  ☑ Keep old embeddings as backup                       │
│  ☑ Update search index after completion                │
│  ☑ Send notification when complete                     │
│                                                          │
│  Confirmation:                                           │
│  Type "REINDEX" to confirm: [____________]              │
│                                                          │
│  [ Cancel ]                    [ Start Re-indexing ]    │
└─────────────────────────────────────────────────────────┘
```

**Re-indexing Strategy**:

1. **Incremental Re-indexing**: Re-index in batches over multiple days
2. **A/B Testing**: Keep old embeddings, compare search quality
3. **Rollback Plan**: Easy to revert if new embeddings perform worse

### Index Health

Monitor the quality and performance of your embedding index.

**Navigation**: Admin Panel → AI Management → Embeddings → Health Check

```
┌─────────────────────────────────────────────────────────┐
│  Embedding Index Health Report                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Overall Health: ✅ Excellent (95/100)                  │
│                                                          │
│  Metrics:                                                │
│                                                          │
│  Coverage:           ████████████████████░ 87.3% ✅    │
│  Quality Score:      ████████████████████░ 92.1% ✅    │
│  Search Performance: ████████████████████░ 94.8% ✅    │
│  Freshness:          ████████████████████░ 89.2% ✅    │
│  Error Rate:         ████████████████████░ 0.4%  ✅    │
│                                                          │
│  Quality Issues Detected:                                │
│  ⚠️  127 low-quality embeddings (quality score <70)    │
│  ⚠️  45 messages failed embedding generation            │
│  ℹ️   234 embeddings older than 30 days                 │
│                                                          │
│  Recommendations:                                        │
│  1. Retry failed embeddings (45 messages)               │
│  2. Investigate low-quality cases                       │
│  3. Consider re-indexing old embeddings                 │
│                                                          │
│  [ Run Full Diagnostics ]  [ Export Report ]            │
└─────────────────────────────────────────────────────────┘
```

**Health Metrics Explained**:

1. **Coverage** (87.3%): Percentage of messages with embeddings
2. **Quality Score** (92.1%): Average embedding quality (vector magnitude, distribution)
3. **Search Performance** (94.8%): Search relevance scores from user feedback
4. **Freshness** (89.2%): Percentage of embeddings generated in last 7 days
5. **Error Rate** (0.4%): Percentage of embedding generation failures

**Quality Score Calculation**:

```javascript
qualityScore = (
  vectorMagnitude * 0.3 +      // Proper normalization
  dimensionVariance * 0.2 +    // Good distribution
  noZeroValues * 0.2 +         // No degenerate values
  withinExpectedRange * 0.3    // Values in expected range
) * 100
```

---

## Bot Management

### Enabling/Disabling Bots

Control which bots are active in your workspace.

**Navigation**: Admin Panel → Bots → Manage

#### Bot Management Interface

```
┌────────────────────────────────────────────────────────────────┐
│  Bot Management                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 👋 HelloBot                                 [Enabled ▼] │ │
│  │ Greetings and ice-breaker jokes                         │ │
│  │ Commands: /hello, /hi, /joke                            │ │
│  │ Usage: 1,234 invocations this month                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📊 PollBot                                  [Enabled ▼] │ │
│  │ Create and manage polls                                 │ │
│  │ Commands: /poll, /vote, /results                        │ │
│  │ Usage: 567 polls created                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📝 SummaryBot                              [Enabled ▼] │ │
│  │ AI-powered summarization                                │ │
│  │ Commands: /summarize, /digest                           │ │
│  │ Usage: 2,345 summaries generated                        │ │
│  │ AI Cost: $45.67 this month                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [ Add Custom Bot ]  [ Import from Marketplace ]               │
└────────────────────────────────────────────────────────────────┘
```

**Bot States**:
- **Enabled**: Bot responds to commands and events
- **Disabled**: Bot is inactive (commands show "disabled" message)
- **Restricted**: Bot only available to specific channels/users

**Disabling a Bot**:
1. Click dropdown next to bot name
2. Select "Disabled"
3. Confirm action
4. Bot immediately stops responding

### Monitoring Bot Performance

Track bot usage, errors, and user satisfaction.

**Navigation**: Admin Panel → Bots → Analytics

```
┌─────────────────────────────────────────────────────────┐
│  Bot Performance Analytics                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SummaryBot (Last 30 Days)                              │
│                                                          │
│  Usage:                                                  │
│  Total Invocations: 2,345                               │
│  Success Rate: 98.7%  (2,315 / 2,345)                   │
│  Avg Response Time: 2.3s                                │
│                                                          │
│  Performance Trend:                                      │
│  ┌───────────────────────────────────────────────┐     │
│  │ 100                                   ╭─╮     │     │
│  │  80               ╭─╮         ╭─╮    │ │     │     │
│  │  60       ╭─╮     │ │ ╭─╮     │ │╭─╮ │ │     │     │
│  │  40   ╭─╮ │ │╭─╮  │ │ │ │╭─╮  │ ││ │ │ │     │     │
│  │  20───┴─┴─┴─┴┴─┴──┴─┴─┴─┴┴─┴──┴─┴┴─┴─┴─┴────│     │
│  │       Week 1   Week 2   Week 3   Week 4      │     │
│  └───────────────────────────────────────────────┘     │
│                                                          │
│  Top Users:                                              │
│  1. sarah@example    - 456 invocations                  │
│  2. mike@example     - 234 invocations                  │
│  3. alex@example     - 189 invocations                  │
│                                                          │
│  Recent Errors (2.3%):                                   │
│  ❌ Rate limit exceeded (23 occurrences)                │
│  ❌ Timeout (8 occurrences)                             │
│  ❌ Invalid input (4 occurrences)                       │
│                                                          │
│  [ View Detailed Logs ]  [ Export Report ]              │
└─────────────────────────────────────────────────────────┘
```

**Key Metrics**:

1. **Success Rate**: Percentage of successful bot responses
2. **Response Time**: Average time from invocation to response
3. **Error Rate**: Percentage of failed invocations
4. **User Satisfaction**: Based on reactions and feedback

**Performance Thresholds**:
- Success Rate: >95% is good
- Response Time: <3s is good
- Error Rate: <5% is acceptable

### Bot Analytics

Deep dive into bot usage patterns and ROI.

**Navigation**: Admin Panel → Bots → [Select Bot] → Analytics

```
┌─────────────────────────────────────────────────────────┐
│  SummaryBot - Detailed Analytics                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Command Usage Breakdown:                                │
│  /summarize   ████████████████ 1,890 (80.6%)           │
│  /digest      ████░░░░░░░░░░░░ 455 (19.4%)             │
│                                                          │
│  User Engagement:                                        │
│  Active Users: 87                                       │
│  Avg Uses/User: 27                                      │
│  Power Users (>50 uses): 12                             │
│                                                          │
│  Time Distribution:                                      │
│  Morning (6-12):   ███████░ 35%                         │
│  Afternoon (12-6): █████████ 45%                        │
│  Evening (6-12):   ████░░░░ 18%                         │
│  Night (12-6):     █░░░░░░░ 2%                          │
│                                                          │
│  Value Metrics:                                          │
│  Time Saved: ~156 hours (estimated)                     │
│  Cost: $45.67 (API calls)                               │
│  ROI: $3,900 saved / $45.67 spent = 85x return          │
│                                                          │
│  User Satisfaction:                                      │
│  👍 Positive: 92.3%                                     │
│  👎 Negative: 7.7%                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**ROI Calculation**:
```
Time Saved = (Summaries Generated × Avg Manual Summary Time)
Cost = API Calls × Cost per Call
ROI = (Time Saved × Hourly Wage) / Cost
```

---

## Moderation Settings

### Threshold Configuration

Adjust sensitivity of auto-moderation to balance safety and false positives.

**Navigation**: Admin Panel → Moderation → Thresholds

#### Toxicity Thresholds

```
┌─────────────────────────────────────────────────────────┐
│  Toxicity Detection Thresholds                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Overall Toxicity:                                       │
│  Threshold: 70%   [░░░░░░░░░░░░░███████░░░░░░░]        │
│                   0%     50%    70%    100%              │
│                                                          │
│  Actions:                                                │
│  0-49%:   ✅ Allow                                      │
│  50-69%:  ⚠️  Flag for review                          │
│  70-89%:  🚫 Hide message, warn user                   │
│  90-100%: 🔇 Hide message, mute user (1 hour)          │
│                                                          │
│  Sub-Categories:                                         │
│  Identity Attack:     75% [███████████████░░░░░░]      │
│  Insult:              70% [██████████████░░░░░░░]      │
│  Threat:              60% [████████████░░░░░░░░░]      │
│  Profanity:           80% [████████████████░░░░]      │
│  Sexually Explicit:   85% [█████████████████░░░]      │
│                                                          │
│  [ Reset to Defaults ]          [ Save Changes ]        │
└─────────────────────────────────────────────────────────┘
```

**Threshold Recommendations**:

| Workspace Type | Recommended Threshold | Reasoning |
|----------------|----------------------|-----------|
| Professional (Corporate) | 60-70% | Strict, low tolerance |
| Community (Open) | 75-85% | Balanced, some tolerance |
| Gaming/Casual | 80-90% | Relaxed, high tolerance |
| Educational | 65-75% | Moderate, context-aware |

**Fine-Tuning Tips**:

1. **Start Conservative** (70%): Lower threshold = stricter moderation
2. **Monitor False Positives**: Track appeals and adjust
3. **Category-Specific**: Adjust sub-categories independently
4. **A/B Test**: Test changes with small user group first

### Auto-Action Rules

Define automatic actions taken when content violates policies.

**Navigation**: Admin Panel → Moderation → Auto-Actions

```
┌─────────────────────────────────────────────────────────┐
│  Auto-Action Rules Configuration                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Rule 1: High Toxicity                                   │
│  Condition: Toxicity score ≥ 90%                        │
│  Actions:                                                │
│  ☑ Hide message immediately                             │
│  ☑ Send warning to user                                 │
│  ☑ Temporary mute (1 hour)                              │
│  ☑ Notify moderators                                    │
│  ☐ Permanent ban (requires manual review)              │
│                                                          │
│  Rule 2: Spam Detection                                  │
│  Condition: Spam score ≥ 85%                            │
│  Actions:                                                │
│  ☑ Hide message immediately                             │
│  ☑ Notify user (educational message)                    │
│  ☐ Temporary mute                                       │
│  ☐ Notify moderators                                    │
│                                                          │
│  Rule 3: Repeat Offenders                                │
│  Condition: 3+ violations in 24 hours                   │
│  Actions:                                                │
│  ☑ Escalate to manual review                           │
│  ☑ Temporary mute (24 hours)                            │
│  ☑ Email notification to user                           │
│  ☑ Notify admin team                                    │
│                                                          │
│  [ Add New Rule ]  [ Import Rules ]  [ Save Changes ]   │
└─────────────────────────────────────────────────────────┘
```

**Available Actions**:

| Action | Effect | User Impact | Reversible |
|--------|--------|-------------|------------|
| Flag | Add to moderation queue | None (message visible) | N/A |
| Hide | Remove from view | Hidden from all users | Yes |
| Warn | Send warning notification | Alert displayed | N/A |
| Mute (1h) | Prevent messaging | Cannot send for 1 hour | Auto |
| Mute (24h) | Prevent messaging | Cannot send for 24 hours | Manual |
| Escalate | Add to review queue | Pending moderator decision | Yes |
| Ban | Remove from workspace | Permanent removal | Manual only |

### Whitelist Management

Manage exceptions to moderation rules (allowed terms, trusted users).

**Navigation**: Admin Panel → Moderation → Whitelists

#### Whitelist Types

**1. Term Whitelist**:

```
┌─────────────────────────────────────────────────────────┐
│  Allowed Terms (False Positive Prevention)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Technical Jargon:                                       │
│  • kill process                                          │
│  • abort transaction                                     │
│  • dump memory                                           │
│  • terminate thread                                      │
│  • crash report                                          │
│                                                          │
│  Industry-Specific:                                      │
│  • [Your custom terms here]                             │
│                                                          │
│  [ Add Term ]  [ Import List ]  [ Export ]              │
└─────────────────────────────────────────────────────────┘
```

**2. User Whitelist**:

```
┌─────────────────────────────────────────────────────────┐
│  Trusted Users (Bypass Moderation)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ☑ admin@example.com      (Admin)                       │
│  ☑ moderator@example.com  (Moderator)                   │
│  ☑ bot@example.com        (Bot Account)                 │
│  ☐ sarah@example.com      (Trusted User)                │
│                                                          │
│  ⚠️  Warning: Whitelisted users bypass all moderation   │
│                                                          │
│  [ Add User ]  [ Remove All ]  [ Save Changes ]         │
└─────────────────────────────────────────────────────────┘
```

**3. Channel Whitelist**:

```
┌─────────────────────────────────────────────────────────┐
│  Exempt Channels (No Moderation)                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ☑ #bot-testing       (For bot development)            │
│  ☑ #admin-lounge      (Private admin channel)          │
│  ☐ #general           (Public channel)                  │
│                                                          │
│  Use Case: Testing, admin channels, private groups      │
│                                                          │
│  [ Add Channel ]  [ Save Changes ]                      │
└─────────────────────────────────────────────────────────┘
```

**Whitelist Best Practices**:

✅ **Do**:
- Whitelist technical terms that trigger false positives
- Exempt bot testing channels
- Document why each term/user is whitelisted
- Regular review (quarterly) to remove stale entries

❌ **Avoid**:
- Blanket whitelisting of users (creates accountability gaps)
- Whitelisting profanity without strong justification
- Forgetting to remove former employees from whitelist

---

## Troubleshooting

### API Errors

Common AI API errors and how to resolve them.

#### Error: Rate Limit Exceeded

**Symptom**:
```json
{
  "error": "Rate limit exceeded",
  "code": "rate_limit_exceeded",
  "retry_after": 32
}
```

**User sees**: "AI features temporarily unavailable. Please try again in 32 seconds."

**Causes**:
1. Too many requests in short time
2. Org-wide rate limit hit
3. Provider-side rate limit (OpenAI/Anthropic)

**Solutions**:

**Short-term**:
```bash
# Increase rate limits temporarily
curl -X POST /api/admin/ai/rate-limits/adjust \
  -d '{"endpoint": "summarization", "multiplier": 1.5}'
```

**Long-term**:
1. Review and adjust rate limits (see [Rate Limiting](#rate-limiting))
2. Implement request queuing
3. Add request deduplication
4. Contact provider to increase limits

**Prevention**:
- Monitor usage trends
- Set up rate limit alerts
- Educate users on efficient AI usage

#### Error: Insufficient Quota

**Symptom**:
```json
{
  "error": "Insufficient quota",
  "code": "insufficient_quota",
  "quota_remaining": 0
}
```

**Causes**:
1. OpenAI/Anthropic account out of credits
2. Payment method failed
3. Free tier limits exceeded

**Solutions**:

1. **Check Provider Dashboard**:
   - OpenAI: https://platform.openai.com/account/billing
   - Anthropic: https://console.anthropic.com/settings/billing

2. **Add Credits**:
   - Add payment method
   - Purchase credits
   - Upgrade tier

3. **Enable Fallback**:
   ```javascript
   // Automatically fall back to local processing
   {
     autoFallbackOnQuotaExceeded: true
   }
   ```

#### Error: Invalid API Key

**Symptom**:
```json
{
  "error": "Invalid API key",
  "code": "invalid_api_key"
}
```

**Causes**:
1. API key expired or revoked
2. Wrong API key for provider
3. API key not set in environment

**Solutions**:

1. **Verify Environment Variable**:
   ```bash
   # Check if API key is set
   echo $OPENAI_API_KEY
   echo $ANTHROPIC_API_KEY
   ```

2. **Regenerate API Key**:
   - Go to provider dashboard
   - Create new API key
   - Update environment variable
   - Restart application

3. **Test Connection**:
   ```bash
   # Test OpenAI key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Cost Overruns

Unexpected high AI costs and how to investigate.

#### Investigating Cost Spikes

**Step 1: Identify Spike**:

```
Cost Trend (Last 7 Days):

$200 ┤                                           ╭────
$150 ┤                                       ╭───╯
$100 ┤                                   ╭───╯
 $50 ┤───────────────────────────────────╯
  $0 ┴───────┬───────┬───────┬───────┬───────┬───────┬
     Day 1   Day 2   Day 3   Day 4   Day 5   Day 6   Day 7

⚠️ Spike detected: Day 5-7 (400% increase)
```

**Step 2: Drill Down by Endpoint**:

```
Cost by Endpoint (Last 24 Hours):

/ai/summarize    $89.23  (45%) ████████████
/ai/chat         $67.45  (34%) ████████
/search          $32.10  (16%) ████
/ai/embed        $8.92   (5%)  █
```

**Step 3: Identify Top Users**:

```
Top Spenders (Last 24 Hours):

sarah@example    $145.67 (73%)  ████████████████
mike@example     $32.45  (16%)  ████
alex@example     $15.23  (8%)   ██
Others           $4.35   (3%)   █
```

**Step 4: Investigate User Activity**:

```
sarah@example - Detailed Activity:

Time Range: Jan 30, 14:00 - 15:00
Requests: 1,234 (unusual: avg is 50/hour)
Cost: $89.23

Endpoint Breakdown:
/ai/summarize × 1,200 requests = $85.50
/search × 34 requests = $3.73

⚠️ Possible automation/script detected
```

**Step 5: Take Action**:

1. **Contact User**: Investigate if intentional
2. **Suspend if Abuse**: Temporary suspension
3. **Adjust Rate Limits**: Prevent future spikes
4. **Enable Alerts**: Get notified of unusual activity

#### Cost Control Measures

**Immediate Actions**:

1. **Pause AI Features** (Emergency):
   ```bash
   # Admin panel or API
   curl -X POST /api/admin/ai/emergency-pause
   ```

2. **Reduce Rate Limits**:
   ```bash
   # Cut all limits by 50%
   curl -X POST /api/admin/ai/rate-limits/reduce \
     -d '{"factor": 0.5}'
   ```

3. **Switch to Cheaper Models**:
   ```bash
   # Force fallback to GPT-4o-mini
   curl -X POST /api/admin/ai/config/model \
     -d '{"provider": "openai", "model": "gpt-4o-mini"}'
   ```

**Long-term Solutions**:

1. **Budget Caps**: Set hard spending limits
2. **User Education**: Teach efficient AI usage
3. **Cost Monitoring**: Daily budget review
4. **Optimization**: Improve caching, batching

### Performance Issues

Slow AI responses and how to diagnose.

#### Diagnosis Checklist

**1. Check Response Times**:

```
Average Response Times (Last Hour):

Summarization:  2.3s  ✅ (target: <3s)
Search:         0.8s  ✅ (target: <1s)
Chat:           4.7s  ⚠️  (target: <3s)
Embeddings:     1.2s  ✅ (target: <2s)
```

**2. Check Provider Status**:

```bash
# Check OpenAI status
curl https://status.openai.com/api/v2/status.json

# Check Anthropic status
curl https://status.anthropic.com/api/v2/status.json
```

**3. Check Queue Backlog**:

```
Queue Status:

Summarization:  12 queued, 3 processing  ✅
Search:         0 queued, 0 processing   ✅
Chat:           347 queued, 10 processing ⚠️ BACKLOG
Embeddings:     23 queued, 5 processing  ✅
```

**4. Check Cache Hit Rate**:

```
Cache Performance:

Summarization:  87% hit rate  ✅ (target: >80%)
Search:         45% hit rate  ⚠️  (target: >60%)
Embeddings:     92% hit rate  ✅ (target: >80%)
```

#### Performance Optimization

**Increase Concurrency**:

```javascript
// Admin Panel → AI Configuration → Advanced
{
  maxConcurrentRequests: 10,  // Increase from 5
  requestTimeout: 30000,      // 30 seconds
  retryAttempts: 3
}
```

**Optimize Caching**:

```javascript
// Increase cache TTL
{
  summarizationTtl: 7200,  // 2 hours (was 1 hour)
  searchTtl: 600,          // 10 minutes (was 5 minutes)
}
```

**Add Request Deduplication**:

```javascript
// Automatically deduplicate identical requests
{
  deduplication: {
    enabled: true,
    windowMs: 5000  // 5 seconds
  }
}
```

**Use CDN/Edge Caching**:

```javascript
// Cache responses at edge (Cloudflare, Vercel)
{
  edgeCaching: {
    enabled: true,
    ttl: 300  // 5 minutes
  }
}
```

---

## Appendix

### Common Admin Tasks Quick Reference

| Task | Location | Quick Action |
|------|----------|--------------|
| View AI costs | Dashboard | `/admin/ai/dashboard` |
| Adjust rate limits | Rate Limits tab | Update values, save |
| Disable a bot | Bot Management | Toggle "Disabled" |
| Generate missing embeddings | Embeddings → Bulk | Click "Generate Missing" |
| Check API key status | Provider Config | View "API Key Status" |
| View top AI users | Usage Monitoring → Top Users | Sort by cost |
| Set budget alert | Budgets tab | Create alert, set threshold |
| Whitelist a term | Moderation → Whitelists | Add to term whitelist |
| Export usage data | Dashboard | Click "Export" button |
| Pause AI features | Emergency | `/admin/ai/emergency-pause` |

### Support Resources

**Documentation**:
- AI Features User Guide: `/docs/guides/features/ai-features-complete.md`
- Bot SDK Guide: `/docs/guides/development/bot-sdk-complete.md`
- API Documentation: `/docs/api/ai-endpoints.md`

**Community**:
- Forum: [community.nself.org](https://community.nself.org)
- Discord: [discord.gg/nself](https://discord.gg/nself)
- GitHub Issues: [github.com/nself/nself-chat/issues](https://github.com/nself/nself-chat/issues)

**Professional Support**:
- Email: support@nself.org
- Enterprise Support: enterprise@nself.org
- Slack Connect: Request invite via email

### Changelog

**v1.0.0** (January 31, 2026):
- Initial release
- Comprehensive AI administration guide
- Coverage of all AI features

---

**Last Updated**: January 31, 2026
**Version**: v0.7.0
**Next Review**: February 28, 2026
**Maintained By**: nself-chat Core Team
