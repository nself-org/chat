# ɳChat Plugins - Quick Start Guide

**Last Updated**: 2026-02-05
**Status**: MVP Implementation Complete

---

## Overview

5 new backend plugins are now implemented with minimal viable functionality:

| Plugin           | Port | Status | Endpoints |
| ---------------- | ---- | ------ | --------- |
| Analytics        | 3106 | ✅ MVP | 5         |
| Advanced Search  | 3107 | ✅ MVP | 4         |
| Media Pipeline   | 3108 | ✅ MVP | 5         |
| AI Orchestration | 3109 | ✅ MVP | 7         |
| Workflows        | 3110 | ✅ MVP | 9         |

---

## Quick Start (All Plugins)

### 1. Install Dependencies

```bash
# Navigate to backend services
cd /Users/admin/Sites/nself-chat/.backend/services

# Install for all plugins
for plugin in analytics advanced-search media-pipeline ai-orchestration workflows; do
  echo "Installing $plugin..."
  cd $plugin && npm install && cd ..
done
```

### 2. Configure Environment

```bash
# Copy environment templates
for plugin in analytics advanced-search media-pipeline ai-orchestration workflows; do
  cp $plugin/.env.example $plugin/.env
done

# Edit AI Orchestration to add your OpenAI key (optional)
# nano ai-orchestration/.env
# Add: OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Services

```bash
# Start all services in background
cd analytics && npm run dev > /tmp/analytics.log 2>&1 &
cd ../advanced-search && npm run dev > /tmp/search.log 2>&1 &
cd ../media-pipeline && npm run dev > /tmp/media.log 2>&1 &
cd ../ai-orchestration && npm run dev > /tmp/ai.log 2>&1 &
cd ../workflows && npm run dev > /tmp/workflows.log 2>&1 &

# Or start individually
cd analytics && npm run dev
```

### 4. Verify Health

```bash
# Test all health checks
curl http://localhost:3106/api/analytics/health
curl http://localhost:3107/api/search/health
curl http://localhost:3108/api/media/health
curl http://localhost:3109/api/ai/health
curl http://localhost:3110/api/workflows/health

# Expected response for each:
# {"status":"healthy","version":"1.0.0","service":"<plugin-name>"}
```

---

## Individual Plugin Guides

### Analytics Plugin (Port 3106)

**Location**: `.backend/services/analytics/`

#### Start Service

```bash
cd .backend/services/analytics
npm install
npm run dev
```

#### Test Endpoints

```bash
# Health check
curl http://localhost:3106/api/analytics/health

# Dashboard overview
curl "http://localhost:3106/api/analytics/dashboard?period=30d"

# User analytics
curl "http://localhost:3106/api/analytics/users?period=7d&limit=10"

# Channel analytics
curl "http://localhost:3106/api/analytics/channels?limit=10"

# Track event
curl -X POST http://localhost:3106/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event":"test_event","userId":"user-123","properties":{"test":true}}'
```

#### Use Cases

- Dashboard metrics (active users, messages, channels)
- User engagement tracking
- Channel activity monitoring
- Custom event tracking

---

### Advanced Search Plugin (Port 3107)

**Location**: `.backend/services/advanced-search/`

#### Start Service

```bash
cd .backend/services/advanced-search
npm install
npm run dev
```

#### Test Endpoints

```bash
# Health check
curl http://localhost:3107/api/search/health

# Basic search
curl "http://localhost:3107/api/search/search?q=hello&limit=10"

# Search with filters
curl "http://localhost:3107/api/search/search?q=from:alice%20in:general&limit=10"

# Auto-suggestions
curl "http://localhost:3107/api/search/suggest?q=ali"

# Save search
curl -X POST http://localhost:3107/api/search/save \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","query":"important messages"}'

# Search history
curl "http://localhost:3107/api/search/history?userId=user-123&limit=10"
```

#### Search Syntax

```
# Basic search
hello world

# User filter
from:alice

# Channel filter
in:general

# Date filter
after:2026-01-01

# Attachment filter
has:file
```

---

### Media Pipeline Plugin (Port 3108)

**Location**: `.backend/services/media-pipeline/`

#### Start Service

```bash
cd .backend/services/media-pipeline
npm install
npm run dev
```

#### Test Endpoints

```bash
# Health check
curl http://localhost:3108/api/media/health

# Upload image (with file)
curl -X POST http://localhost:3108/api/media/upload \
  -F "file=@/path/to/image.jpg" \
  -F "format=webp" \
  -F "quality=85" \
  -F "thumbnail=true"

# Get thumbnail
curl http://localhost:3108/api/media/image-123/thumbnail

# Get metadata
curl "http://localhost:3108/api/media/image-123/metadata?filePath=/uploads/image.jpg&mimeType=image/jpeg"
```

#### Supported Formats

- **Input**: JPEG, PNG, GIF, WebP, AVIF
- **Output**: WebP (default), JPEG, PNG
- **Thumbnails**: 200x200 WebP

---

### AI Orchestration Plugin (Port 3109)

**Location**: `.backend/services/ai-orchestration/`

#### Start Service

```bash
cd .backend/services/ai-orchestration
cp .env.example .env
# Edit .env and add OPENAI_API_KEY=sk-your-key-here
npm install
npm run dev
```

#### Test Endpoints

```bash
# Health check
curl http://localhost:3109/api/ai/health

# Chat completion
curl -X POST http://localhost:3109/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}],
    "userId": "user-123"
  }'

# Generate embeddings
curl -X POST http://localhost:3109/api/ai/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'

# Content moderation
curl -X POST http://localhost:3109/api/ai/moderate \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a test message"}'

# Summarize text
curl -X POST http://localhost:3109/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Long text to summarize...",
    "userId": "user-123"
  }'

# Get usage stats
curl "http://localhost:3109/api/ai/usage?userId=user-123&period=7d"

# Get costs
curl "http://localhost:3109/api/ai/costs?userId=user-123"

# Set budget
curl -X POST http://localhost:3109/api/ai/budget \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "budget": {"daily": 1.00, "monthly": 25.00}
  }'
```

#### Cost Estimates

- **GPT-4o-mini**: ~$0.15-$0.60 per 1M tokens
- **Embeddings**: ~$0.02 per 1M tokens
- **Moderation**: Free

---

### Workflows Plugin (Port 3110)

**Location**: `.backend/services/workflows/`

#### Start Service

```bash
cd .backend/services/workflows
npm install
npm run dev
```

#### Test Endpoints

```bash
# Health check
curl http://localhost:3110/api/workflows/health

# List workflows
curl http://localhost:3110/api/workflows/workflows

# Get templates
curl http://localhost:3110/api/workflows/templates

# Create workflow
curl -X POST http://localhost:3110/api/workflows/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome New Users",
    "enabled": true,
    "trigger": {"type": "event", "event": "user.registered"},
    "actions": [
      {"type": "send_dm", "params": {"message": "Welcome!"}}
    ],
    "createdBy": "admin"
  }'

# Execute workflow
curl -X POST http://localhost:3110/api/workflows/workflows/wf_123/execute \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-456"}'

# Get executions
curl http://localhost:3110/api/workflows/workflows/wf_123/executions
```

#### Pre-built Templates

1. **Welcome New Users** - Auto-onboard new users
2. **Daily Standup Reminder** - Send reminders at 9 AM
3. **Archive Inactive Channels** - Auto-archive after 30 days

---

## Docker Deployment

### Build Images

```bash
cd /Users/admin/Sites/nself-chat/.backend/services

# Build all images
docker build -t nchat-analytics analytics/
docker build -t nchat-search advanced-search/
docker build -t nchat-media media-pipeline/
docker build -t nchat-ai ai-orchestration/
docker build -t nchat-workflows workflows/
```

### Run Containers

```bash
# Run with environment variables
docker run -d \
  -p 3106:3106 \
  -e POSTGRES_HOST=host.docker.internal \
  -e POSTGRES_DB=nchat \
  --name nchat-analytics \
  nchat-analytics

docker run -d \
  -p 3107:3107 \
  -e POSTGRES_HOST=host.docker.internal \
  --name nchat-search \
  nchat-search

docker run -d \
  -p 3108:3108 \
  --name nchat-media \
  nchat-media

docker run -d \
  -p 3109:3109 \
  -e OPENAI_API_KEY=sk-your-key \
  --name nchat-ai \
  nchat-ai

docker run -d \
  -p 3110:3110 \
  -e POSTGRES_HOST=host.docker.internal \
  --name nchat-workflows \
  nchat-workflows
```

### Docker Compose (Future)

```yaml
# docker-compose.plugins.yml
version: '3.8'

services:
  analytics:
    build: ./analytics
    ports:
      - '3106:3106'
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_DB=nchat

  search:
    build: ./advanced-search
    ports:
      - '3107:3107'
    environment:
      - POSTGRES_HOST=postgres

  media:
    build: ./media-pipeline
    ports:
      - '3108:3108'
    volumes:
      - media-uploads:/app/uploads

  ai:
    build: ./ai-orchestration
    ports:
      - '3109:3109'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  workflows:
    build: ./workflows
    ports:
      - '3110:3110'
    environment:
      - POSTGRES_HOST=postgres

volumes:
  media-uploads:
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check if port is already in use
lsof -i :3106  # Replace with plugin port

# Kill process using port
kill -9 <PID>

# Check logs
tail -f /tmp/analytics.log
tail -f /tmp/search.log
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
psql -h localhost -U postgres -d nchat -c "SELECT 1"

# Check environment variables
cat .backend/services/analytics/.env
```

### OpenAI API Issues (AI Orchestration)

```bash
# Verify API key is set
grep OPENAI_API_KEY .backend/services/ai-orchestration/.env

# Test with mock responses (API key not required)
# Plugin will automatically use mock data if OPENAI_API_KEY is not set
```

---

## Development Tips

### Watch Mode

```bash
# Install nodemon globally
npm install -g nodemon

# Run in watch mode
nodemon --watch src --exec "ts-node" src/server.ts
```

### Build TypeScript

```bash
# Compile TypeScript
npm run build

# Run compiled version
npm start
```

### Run Tests

```bash
# Currently only Analytics has tests
cd .backend/services/analytics
npm test
npm run test:watch
npm run test:coverage
```

---

## Next Steps

1. **Add Database Schema**
   - Create PostgreSQL tables for each plugin
   - Add migration files
   - Implement data persistence

2. **Add Authentication**
   - Implement API key validation
   - Add rate limiting
   - Set up CORS properly

3. **Write Tests**
   - Add unit tests for all services
   - Add integration tests
   - Set up CI/CD

4. **Complete Features**
   - Implement advanced features from docs
   - Add caching layers
   - Optimize performance

---

## Resources

- **Full Documentation**: `/docs/plugins/`
- **Implementation Report**: `/docs/PHASE-22-MVP-IMPLEMENTATION-REPORT.md`
- **Individual READMEs**: `.backend/services/{plugin}/README.md`

---

**Status**: ✅ All plugins functional (MVP level)
**Next Milestone**: Database integration + comprehensive testing
