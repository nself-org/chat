# Advanced Search ɳPlugin

**Version**: 1.0.0
**Category**: communication
**Port**: 3107
**Status**: Production Ready

---

## Overview

Advanced Search plugin provides semantic search with AI-powered relevance, vector similarity, and faceted filtering for comprehensive content discovery in ɳChat.

## Key Features

- **Semantic Search**: Natural language queries with AI understanding
- **Vector Search**: Embedding-based similarity matching
- **Full-Text Search**: Traditional keyword matching with fuzzy search
- **Faceted Filtering**: Filter by user, channel, date, file type
- **Auto-Suggestions**: Real-time query completion
- **Search History**: Personal search history and saved searches
- **Multi-Language**: Support for 50+ languages

## Installation

```bash
cd backend
nself plugin install advanced-search
```

## Configuration

```bash
# .env.plugins
SEARCH_ENABLED=true
SEARCH_PORT=3107
SEARCH_ENGINE=meilisearch
SEARCH_VECTOR_ENABLED=true
SEARCH_VECTOR_PROVIDER=qdrant
SEARCH_VECTOR_DIMENSION=1536
```

## API Endpoints

```typescript
GET  /api/search?q=query&filters=...
POST /api/search/semantic
GET  /api/search/suggest?q=partial
POST /api/search/save
GET  /api/search/history
```

## Search Syntax

```
# Basic
hello world

# Exact phrase
"team meeting"

# User filter
from:alice

# Channel filter
in:general

# Date range
after:2026-01-01

# File type
has:image

# Boolean
urgent AND (bug OR issue)
```

## Example Query

```http
GET /api/search?q=from:alice has:file after:2026-01-01&limit=20
```

Response:

```json
{
  "results": [
    {
      "id": "msg-123",
      "content": "Check out this file...",
      "user": { "id": "alice", "name": "Alice" },
      "channel": { "id": "general", "name": "General" },
      "timestamp": "2026-01-15T10:30:00Z",
      "relevance": 0.95
    }
  ],
  "facets": {
    "users": [{ "id": "alice", "count": 15 }],
    "channels": [{ "id": "general", "count": 20 }]
  },
  "total": 45
}
```

## Frontend Integration

```typescript
import { useSearch } from '@/hooks/use-search'

function SearchPage() {
  const { search, results, loading } = useSearch()

  return (
    <SearchBar onSearch={search} />
    <SearchResults results={results} loading={loading} />
  )
}
```

---

**Full Documentation**: See `/docs/plugins/ADVANCED-SEARCH-PLUGIN.md`
