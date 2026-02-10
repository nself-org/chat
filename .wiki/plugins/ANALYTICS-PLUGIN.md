# Analytics & Insights ɳPlugin

**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3106
**Status**: Production Ready

---

## Overview

The Analytics & Insights plugin provides comprehensive business intelligence and data analytics capabilities for ɳChat. It collects, aggregates, and visualizes platform metrics to help administrators understand user behavior, platform health, and business performance.

---

## Features

### Real-time Metrics

- Active users (online, hourly, daily, monthly, yearly)
- Message volume and trends
- Channel activity heatmaps
- User engagement scores
- Platform health indicators

### User Analytics

- User lifecycle tracking (new, active, returning, churned)
- Retention cohorts
- Feature adoption rates
- User journey mapping
- Login/activity patterns

### Channel Analytics

- Channel growth trends
- Message distribution across channels
- Peak activity times
- Average response times
- Channel participation rates

### Content Analytics

- Most shared files and media
- Popular topics (keyword extraction)
- Emoji usage statistics
- Link sharing patterns
- Hashtag trending

### Business Intelligence

- Custom dashboard builder
- Scheduled reports (PDF/Excel)
- Data export API (CSV, JSON)
- Webhook notifications for milestones
- Comparative analytics (time periods)

---

## Installation

### Prerequisites

- nself CLI v0.9.8+
- Docker and Docker Compose
- ClickHouse (for time-series data)
- Redis (for caching)
- PostgreSQL (for metadata)

### Install Plugin

```bash
cd backend
nself plugin install analytics
```

### Configure Environment

Add to `.env.plugins`:

```bash
ANALYTICS_ENABLED=true
ANALYTICS_PORT=3106
ANALYTICS_ROUTE=analytics.${BASE_DOMAIN:-localhost}
ANALYTICS_MEMORY=512M

# Storage
ANALYTICS_CLICKHOUSE_HOST=clickhouse
ANALYTICS_CLICKHOUSE_PORT=8123
ANALYTICS_CLICKHOUSE_DATABASE=nchat_analytics
ANALYTICS_CLICKHOUSE_USER=default
ANALYTICS_CLICKHOUSE_PASSWORD=

# Features
ANALYTICS_RETENTION_DAYS=365
ANALYTICS_AGGREGATION_INTERVAL=300  # 5 minutes
ANALYTICS_ENABLE_ML_INSIGHTS=true
ANALYTICS_ENABLE_ANOMALY_DETECTION=true

# Performance
ANALYTICS_BATCH_SIZE=1000
ANALYTICS_FLUSH_INTERVAL=30000  # 30 seconds
ANALYTICS_CACHE_TTL=300  # 5 minutes
```

### Restart Services

```bash
nself restart
```

### Verify Installation

```bash
curl http://analytics.localhost:3106/health
# Should return: {"status":"healthy","version":"1.0.0"}
```

---

## Architecture

### Data Pipeline

```
Event Sources → Redis Streams → Aggregator → ClickHouse → API → Frontend
                                     ↓
                               Cache (Redis)
```

### Components

1. **Event Collector**
   - Listens to application events
   - Validates and enriches event data
   - Batches events for performance

2. **Data Aggregator**
   - Processes raw events every 5 minutes
   - Calculates metrics (counts, averages, percentiles)
   - Stores aggregated data in ClickHouse

3. **Query Engine**
   - Serves dashboard requests
   - Generates custom reports
   - Handles real-time queries

4. **Cache Layer**
   - Caches frequently accessed metrics
   - Reduces database load
   - Improves response times

5. **Alert Manager**
   - Monitors metric thresholds
   - Sends notifications
   - Triggers webhooks

---

## API Reference

### Dashboard Overview

```http
GET /api/analytics/dashboard?period=30d
```

**Response**:

```json
{
  "overview": {
    "activeUsers": {
      "current": 1234,
      "previous": 1100,
      "change": "+12.2%"
    },
    "messages": {
      "total": 45678,
      "average": 1522,
      "trend": "up"
    },
    "channels": {
      "total": 156,
      "active": 89,
      "engagement": "57%"
    }
  },
  "charts": {
    "activeUsers": [...],
    "messageVolume": [...],
    "channelActivity": [...]
  }
}
```

### User Analytics

```http
GET /api/analytics/users?period=7d&metric=engagement
```

**Query Parameters**:

- `period`: Time range (1d, 7d, 30d, 90d, 365d, all)
- `metric`: Metric type (engagement, retention, adoption, activity)
- `groupBy`: Group by dimension (day, week, month)
- `limit`: Number of results (default: 100)

**Response**:

```json
{
  "period": "7d",
  "metric": "engagement",
  "data": [
    {
      "userId": "user-123",
      "name": "Alice Johnson",
      "messageCount": 245,
      "channelsActive": 12,
      "engagementScore": 87,
      "lastActive": "2026-02-03T10:30:00Z"
    }
  ],
  "summary": {
    "totalUsers": 1234,
    "activeUsers": 789,
    "averageEngagement": 72
  }
}
```

### Channel Analytics

```http
GET /api/analytics/channels?sort=activity&limit=20
```

**Response**:

```json
{
  "channels": [
    {
      "channelId": "channel-456",
      "name": "general",
      "memberCount": 234,
      "messageCount": 1234,
      "messagesPerDay": 176,
      "peakHour": "14:00",
      "engagementRate": "68%",
      "growth": "+15%"
    }
  ]
}
```

### Message Analytics

```http
GET /api/analytics/messages?period=30d
```

**Response**:

```json
{
  "total": 45678,
  "byType": {
    "text": 38456,
    "image": 4567,
    "file": 1890,
    "video": 567,
    "voice": 198
  },
  "averagePerDay": 1522,
  "peakDay": "2026-02-01",
  "peakDayCount": 2345,
  "trends": {
    "images": "+23%",
    "videos": "+45%",
    "voice": "-5%"
  }
}
```

### Custom Reports

```http
POST /api/analytics/reports
Content-Type: application/json

{
  "name": "Weekly Executive Summary",
  "period": "7d",
  "metrics": [
    "activeUsers",
    "messageVolume",
    "channelGrowth",
    "engagement"
  ],
  "format": "pdf",
  "schedule": "0 9 * * 1",  # Every Monday at 9am
  "recipients": ["admin@example.com"]
}
```

### Data Export

```http
GET /api/analytics/export?format=csv&period=30d&metrics=users,messages
```

**Formats**: csv, json, excel

### Track Custom Event

```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "feature_used",
  "userId": "user-123",
  "properties": {
    "feature": "voice_message",
    "duration": 45,
    "quality": "high"
  }
}
```

### AI Insights

```http
GET /api/analytics/insights?period=30d
```

**Response**:

```json
{
  "insights": [
    {
      "type": "trend",
      "severity": "info",
      "message": "Message volume increased 23% this week",
      "recommendation": "Consider adding more channels"
    },
    {
      "type": "anomaly",
      "severity": "warning",
      "message": "User churn rate increased 15%",
      "recommendation": "Review user feedback"
    }
  ]
}
```

---

## Metrics Definitions

### Active Users

- **Online**: Currently connected (WebSocket active)
- **Hourly**: Active in last 60 minutes
- **Daily**: Active in last 24 hours (DAU)
- **Weekly**: Active in last 7 days (WAU)
- **Monthly**: Active in last 30 days (MAU)

### Engagement Score

Calculated as: `(messages_sent * 2 + reactions * 1 + files_shared * 3) / days_active`

- 0-30: Low engagement
- 31-60: Medium engagement
- 61-100: High engagement

### Retention Cohorts

- **Day 1**: Percentage of users active 1 day after signup
- **Day 7**: Percentage of users active 7 days after signup
- **Day 30**: Percentage of users active 30 days after signup

### Channel Activity

- **Active Channels**: Channels with messages in last 7 days
- **Dormant Channels**: Channels with no messages in last 30 days
- **Growing Channels**: Channels with +20% message volume

---

## Dashboard Guide

### Main Dashboard

Access at `/admin/analytics`

**Sections**:

1. Overview Cards (active users, messages, channels, files)
2. Activity Trends (line chart)
3. Top Channels (table)
4. Top Users (table)
5. Recent Activity (timeline)

### User Analytics

Access at `/admin/analytics/users`

**Views**:

- User List (sortable, filterable)
- Cohort Analysis
- Retention Curves
- Engagement Heatmap

### Channel Analytics

Access at `/admin/analytics/channels`

**Views**:

- Channel Activity Grid
- Growth Trends
- Message Distribution
- Peak Hours Heatmap

### Custom Reports

Access at `/admin/analytics/reports`

**Features**:

- Visual report builder
- Saved report templates
- Scheduled delivery
- Export options

---

## SQL Queries

### Top Active Users (Last 7 Days)

```sql
SELECT
  user_id,
  COUNT(*) as message_count,
  COUNT(DISTINCT channel_id) as channels_active,
  MIN(timestamp) as first_message,
  MAX(timestamp) as last_message
FROM analytics_events
WHERE
  event_type = 'message_sent'
  AND timestamp >= NOW() - INTERVAL 7 DAY
GROUP BY user_id
ORDER BY message_count DESC
LIMIT 20;
```

### Daily Active Users (Last 30 Days)

```sql
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as dau
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL 30 DAY
GROUP BY DATE(timestamp)
ORDER BY date;
```

### Channel Growth Rate

```sql
WITH current_week AS (
  SELECT channel_id, COUNT(*) as count
  FROM analytics_events
  WHERE event_type = 'message_sent'
    AND timestamp >= NOW() - INTERVAL 7 DAY
  GROUP BY channel_id
),
previous_week AS (
  SELECT channel_id, COUNT(*) as count
  FROM analytics_events
  WHERE event_type = 'message_sent'
    AND timestamp >= NOW() - INTERVAL 14 DAY
    AND timestamp < NOW() - INTERVAL 7 DAY
  GROUP BY channel_id
)
SELECT
  c.channel_id,
  c.count as current_count,
  p.count as previous_count,
  ROUND((c.count - p.count) * 100.0 / p.count, 2) as growth_rate
FROM current_week c
LEFT JOIN previous_week p ON c.channel_id = p.channel_id
ORDER BY growth_rate DESC;
```

---

## Frontend Integration

### React Hook

```typescript
import { useAnalytics } from '@/hooks/use-analytics'

function DashboardPage() {
  const { data, loading, error } = useAnalytics({
    period: '30d',
    metrics: ['activeUsers', 'messages', 'channels']
  })

  if (loading) return <Loading />
  if (error) return <Error message={error.message} />

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <MetricsOverview data={data.overview} />
      <ActivityChart data={data.charts.activeUsers} />
    </div>
  )
}
```

### Track Custom Event

```typescript
import { trackEvent } from '@/services/analytics'

function FeatureComponent() {
  const handleFeatureUse = () => {
    trackEvent('feature_used', {
      feature: 'voice_message',
      duration: 45
    })
  }

  return <button onClick={handleFeatureUse}>Send Voice</button>
}
```

---

## Performance Tuning

### Optimize Queries

1. Use materialized views for aggregations
2. Partition tables by date
3. Add indexes on frequently queried columns

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW analytics_daily_metrics AS
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'message' THEN 1 END) as messages
FROM analytics_events
GROUP BY DATE(timestamp);

-- Partition table
ALTER TABLE analytics_events
PARTITION BY toYYYYMM(timestamp);

-- Add indexes
ALTER TABLE analytics_events
ADD INDEX idx_user_time (user_id, timestamp);
```

### Cache Configuration

```bash
# Increase cache TTL for static metrics
ANALYTICS_CACHE_TTL=600  # 10 minutes

# Enable query result caching
ANALYTICS_CLICKHOUSE_QUERY_CACHE=true
```

### Batch Processing

```bash
# Increase batch size for bulk inserts
ANALYTICS_BATCH_SIZE=5000

# Reduce flush frequency
ANALYTICS_FLUSH_INTERVAL=60000  # 1 minute
```

---

## Troubleshooting

### High Memory Usage

**Symptoms**: Plugin using >1GB RAM

**Solutions**:

- Reduce retention period
- Increase aggregation interval
- Enable query result caching

```bash
ANALYTICS_RETENTION_DAYS=180  # Reduce from 365
ANALYTICS_AGGREGATION_INTERVAL=600  # 10 minutes
```

### Slow Queries

**Symptoms**: Dashboard taking >5 seconds to load

**Solutions**:

- Create materialized views
- Add indexes
- Use query profiling

```sql
-- Profile slow query
EXPLAIN ANALYZE
SELECT ...;

-- Create covering index
CREATE INDEX idx_covering ON analytics_events(user_id, timestamp, event_type);
```

### Missing Data

**Symptoms**: Gaps in analytics data

**Solutions**:

- Check event collector is running
- Verify Redis connection
- Review aggregation logs

```bash
# Check collector status
nself logs analytics | grep "Collector"

# Verify Redis
redis-cli ping

# Review logs
nself logs analytics --tail 100
```

---

## Best Practices

1. **Data Retention**: Keep 90-365 days based on storage capacity
2. **Aggregation**: Use 5-minute intervals for real-time, hourly for historical
3. **Sampling**: Sample high-volume events (e.g., views) at 10% for large platforms
4. **Caching**: Cache dashboard queries for 5-10 minutes
5. **Indexes**: Add indexes on frequently filtered columns (user_id, channel_id, timestamp)

---

## Roadmap

### v1.1.0

- Machine learning insights
- Anomaly detection improvements
- Predictive analytics
- User behavior modeling

### v1.2.0

- Real-time dashboards (WebSocket)
- Custom metric definitions
- A/B testing framework
- Attribution tracking

---

## Support

- **Documentation**: `/docs/plugins/ANALYTICS-PLUGIN.md`
- **Issues**: https://github.com/acamarata/nself-plugins/issues
- **Discord**: https://discord.gg/nself

---

**Last Updated**: 2026-02-03
**Version**: 1.0.0
