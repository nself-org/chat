# nself-chat API Documentation

Welcome to the **nself-chat (nchat)** API documentation. This guide covers everything you need to integrate with the nchat API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints Overview](#api-endpoints-overview)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)
- [Support](#support)

---

## Getting Started

### Base URLs

- **Local Development**: `http://localhost:3000`
- **Production**: `https://api.nchat.app` (or your custom domain)

### Interactive Documentation

Visit `/api-docs` to explore the API interactively using Swagger UI:

- **Local**: http://localhost:3000/api-docs
- **Production**: https://your-domain.com/api-docs

### OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

- `/openapi.yaml` - YAML format
- Download: [openapi.yaml](../openapi.yaml)

You can import this into tools like Postman, Insomnia, or generate client SDKs.

---

## Authentication

### Overview

nchat uses **JWT (JSON Web Tokens)** for authentication. Most endpoints require a valid JWT token in the `Authorization` header.

### Obtaining Tokens

#### 1. Sign In

**Endpoint**: `POST /api/auth/signin`

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

**Response**:

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "role": "member",
    "status": "online"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Sign Up

**Endpoint**: `POST /api/auth/signup`

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePassword123",
    "username": "johndoe",
    "displayName": "John Doe"
  }'
```

The first user to sign up automatically becomes the **owner** with full admin privileges.

### Using Tokens

Include the access token in the `Authorization` header for authenticated requests:

```bash
curl -X GET http://localhost:3000/api/config?history=true \
  -H "Authorization: Bearer <your-access-token>"
```

### Token Expiry

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 30 days

**Note**: Token refresh functionality is not yet implemented in the API. You'll need to re-authenticate when the access token expires.

### Role-Based Access Control

| Role          | Permissions                                           |
| ------------- | ----------------------------------------------------- |
| **owner**     | Full system access, can manage all users and settings |
| **admin**     | Can manage users, channels, and configuration         |
| **moderator** | Can moderate content, manage channels                 |
| **member**    | Standard user access                                  |
| **guest**     | Limited read-only access                              |

Admin-only endpoints return `403 Forbidden` for non-admin users.

---

## Common Patterns

### Request Format

All POST/PATCH requests expect JSON payloads:

```bash
curl -X POST <endpoint> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "key": "value" }'
```

### Response Format

All API responses follow a consistent structure:

**Success Response**:

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Pagination

Endpoints that return lists support pagination:

**Parameters**:

- `page` - Page number (1-indexed)
- `limit` - Items per page (default: 20, max: 100)
- `offset` - Number of items to skip (alternative to page)

**Example**:

```bash
curl "http://localhost:3000/api/search?q=hello&limit=20&offset=0"
```

**Response includes pagination metadata**:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### Filtering and Sorting

Many endpoints support filtering and sorting:

```bash
# Quick search
GET /api/search?q=query&limit=20

# Advanced search with filters
POST /api/search
{
  "query": "project update",
  "types": ["messages", "files"],
  "channelIds": ["channel-1"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "sortBy": "date",
  "sortOrder": "desc"
}
```

---

## Error Handling

### HTTP Status Codes

| Code    | Meaning               | Common Causes                           |
| ------- | --------------------- | --------------------------------------- |
| **200** | OK                    | Request successful                      |
| **201** | Created               | Resource created successfully           |
| **400** | Bad Request           | Invalid input, validation failed        |
| **401** | Unauthorized          | Missing or invalid authentication token |
| **403** | Forbidden             | Insufficient permissions                |
| **404** | Not Found             | Resource doesn't exist                  |
| **429** | Too Many Requests     | Rate limit exceeded                     |
| **500** | Internal Server Error | Server-side error                       |
| **503** | Service Unavailable   | Service temporarily unavailable         |

### Error Codes

Common error codes returned in the `code` field:

| Code                  | Description                      |
| --------------------- | -------------------------------- |
| `BAD_REQUEST`         | Invalid request parameters       |
| `VALIDATION_ERROR`    | Input validation failed          |
| `UNAUTHORIZED`        | Authentication required          |
| `INVALID_TOKEN`       | JWT token is invalid or expired  |
| `FORBIDDEN`           | Insufficient permissions         |
| `NOT_FOUND`           | Resource not found               |
| `RATE_LIMIT_EXCEEDED` | Too many requests                |
| `FILE_TOO_LARGE`      | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE`   | File type not allowed            |

### Error Response Example

```json
{
  "success": false,
  "error": "Validation failed: branding.appName must be 1-50 characters",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "branding.appName",
    "constraint": "length"
  }
}
```

### Handling Errors in Code

**JavaScript/TypeScript**:

```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Request failed')
  }

  // Handle success
  console.log(result.data)
} catch (error) {
  console.error('API error:', error.message)
}
```

---

## Rate Limiting

### Limits by Endpoint

| Endpoint         | Limit                   | Window     |
| ---------------- | ----------------------- | ---------- |
| Most endpoints   | 60 requests             | 60 seconds |
| `/api/upload`    | 30 requests             | 60 seconds |
| `/api/search`    | 60 requests             | 60 seconds |
| `/api/webhook/*` | 30 requests per webhook | 60 seconds |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

When you exceed the rate limit, the API returns `429 Too Many Requests`:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Best practices**:

- Check `X-RateLimit-Remaining` header
- Implement exponential backoff on 429 responses
- Cache responses when possible
- Use webhooks instead of polling

**Retry Logic Example**:

```typescript
async function apiRequestWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options)

    if (response.status !== 429) {
      return response
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, i) * 1000
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  throw new Error('Max retries exceeded')
}
```

---

## API Endpoints Overview

### Health & Monitoring

| Endpoint       | Method    | Description        | Auth |
| -------------- | --------- | ------------------ | ---- |
| `/api/health`  | GET       | Basic health check | No   |
| `/api/ready`   | GET, HEAD | Readiness probe    | No   |
| `/api/metrics` | GET       | Prometheus metrics | No   |

### Configuration

| Endpoint      | Method | Description                    | Auth        |
| ------------- | ------ | ------------------------------ | ----------- |
| `/api/config` | GET    | Get app configuration          | No (cached) |
| `/api/config` | POST   | Update configuration (full)    | Admin       |
| `/api/config` | PATCH  | Update configuration (partial) | Admin       |

### Authentication

| Endpoint                    | Method | Description                 | Auth |
| --------------------------- | ------ | --------------------------- | ---- |
| `/api/auth/signin`          | POST   | Sign in with email/password | No   |
| `/api/auth/signup`          | POST   | Create new account          | No   |
| `/api/auth/verify-password` | POST   | Verify password             | Yes  |
| `/api/auth/change-password` | POST   | Change password             | Yes  |

### File Upload

| Endpoint               | Method | Description               | Auth     |
| ---------------------- | ------ | ------------------------- | -------- |
| `/api/upload`          | GET    | Get upload service status | No       |
| `/api/upload`          | POST   | Initialize file upload    | Optional |
| `/api/upload/complete` | POST   | Mark upload as complete   | Optional |

### Search

| Endpoint      | Method | Description                  | Auth     |
| ------------- | ------ | ---------------------------- | -------- |
| `/api/search` | GET    | Quick search                 | Optional |
| `/api/search` | POST   | Advanced search with filters | Optional |

### Webhooks

| Endpoint            | Method | Description          | Auth  |
| ------------------- | ------ | -------------------- | ----- |
| `/api/webhook/{id}` | GET    | Get webhook info     | Token |
| `/api/webhook/{id}` | POST   | Send webhook message | Token |

### Audit Logs

| Endpoint            | Method | Description            | Auth  |
| ------------------- | ------ | ---------------------- | ----- |
| `/api/audit`        | GET    | Query audit logs       | Yes   |
| `/api/audit`        | POST   | Create audit log entry | Yes   |
| `/api/audit`        | DELETE | Delete audit logs      | Admin |
| `/api/audit/export` | GET    | Export audit logs      | Admin |

### Other

| Endpoint            | Method | Description       | Auth |
| ------------------- | ------ | ----------------- | ---- |
| `/api/translate`    | POST   | Translate text    | No   |
| `/api/link-preview` | GET    | Get link metadata | No   |
| `/api/gif`          | GET    | Search GIFs       | No   |
| `/api/save-svg`     | POST   | Save SVG logo     | No   |

---

## Code Examples

### JavaScript/TypeScript

#### Basic Request

```typescript
async function getConfig() {
  const response = await fetch('/api/config')
  const data = await response.json()
  return data.config
}
```

#### Authenticated Request

```typescript
async function updateConfig(updates: Partial<AppConfig>, token: string) {
  const response = await fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return response.json()
}
```

#### File Upload

```typescript
async function uploadFile(file: File, token: string) {
  // Step 1: Initialize upload
  const initResponse = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  })

  const { fileId, uploadUrl, method, headers } = await initResponse.json()

  // Step 2: Upload file to presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method,
    headers,
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error('Upload failed')
  }

  return fileId
}
```

#### Search

```typescript
async function searchMessages(query: string, channelId: string) {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      types: ['messages'],
      channelIds: [channelId],
      limit: 50,
    }),
  })

  const data = await response.json()
  return data.results
}
```

### Python

```python
import requests

# Sign in
def sign_in(email: str, password: str):
    response = requests.post('http://localhost:3000/api/auth/signin', json={
        'email': email,
        'password': password
    })
    response.raise_for_status()
    return response.json()

# Get config
def get_config(token: str = None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    response = requests.get('http://localhost:3000/api/config', headers=headers)
    response.raise_for_status()
    return response.json()['config']

# Update config
def update_config(updates: dict, token: str):
    response = requests.post(
        'http://localhost:3000/api/config',
        json=updates,
        headers={'Authorization': f'Bearer {token}'}
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get config
curl http://localhost:3000/api/config

# Update config (admin)
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "branding": {
      "appName": "My Team Chat"
    }
  }'

# Search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "project update",
    "types": ["messages"],
    "limit": 20
  }'

# Send webhook
curl -X POST http://localhost:3000/api/webhook/webhook-id/token \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Deployment successful!",
    "username": "CI/CD Bot"
  }'
```

---

## Best Practices

### 1. Authentication

- **Store tokens securely**: Use httpOnly cookies or secure storage
- **Refresh tokens**: Implement token refresh before expiry
- **Don't expose tokens**: Never log or expose tokens in URLs
- **Use HTTPS**: Always use HTTPS in production

### 2. Error Handling

- **Check status codes**: Don't rely solely on response body
- **Handle all error types**: Network errors, timeouts, API errors
- **Retry on transient errors**: Implement retry logic for 5xx errors
- **Log errors**: Log errors for debugging but sanitize sensitive data

### 3. Performance

- **Cache when possible**: Use cache headers and client-side caching
- **Batch requests**: Combine multiple operations when possible
- **Use pagination**: Don't fetch all records at once
- **Compress payloads**: Use gzip/brotli compression
- **Minimize payload size**: Only request fields you need

### 4. Rate Limiting

- **Respect limits**: Monitor `X-RateLimit-*` headers
- **Implement backoff**: Use exponential backoff on 429 responses
- **Use webhooks**: Instead of polling, use webhooks for real-time updates
- **Cache responses**: Reduce redundant API calls

### 5. Security

- **Validate input**: Always validate and sanitize user input
- **Use webhooks securely**: Validate webhook signatures
- **Monitor for abuse**: Implement monitoring and alerting
- **Keep dependencies updated**: Regularly update client libraries

### 6. Integration

- **Test in development**: Use development environment first
- **Handle version changes**: Monitor API version and changelog
- **Implement health checks**: Use `/api/health` and `/api/ready`
- **Log API calls**: Log requests/responses for debugging

---

## Support

### Resources

- **Interactive Docs**: http://localhost:3000/api-docs
- **OpenAPI Spec**: [openapi.yaml](../openapi.yaml)
- **GitHub**: https://github.com/nself-chat
- **Documentation**: [docs/](../)

### Getting Help

1. **Check Documentation**: Review this guide and API docs
2. **Check Examples**: See code examples above
3. **Check Issues**: Search existing GitHub issues
4. **Create Issue**: Open a new issue with:
   - API endpoint
   - Request/response
   - Error message
   - Environment details

### Reporting Bugs

When reporting API bugs, include:

- **Endpoint**: Full URL and HTTP method
- **Request**: Headers and body
- **Response**: Status code, headers, body
- **Expected**: What you expected to happen
- **Environment**: Development/production, version

### Feature Requests

To request new API features:

1. Check if it already exists
2. Describe the use case
3. Provide example request/response
4. Explain the benefit

---

## Changelog

### v0.2.0 (2025-01-29)

- Initial API documentation
- OpenAPI 3.0 specification
- Interactive Swagger UI
- Complete endpoint coverage
- Authentication flow
- Rate limiting
- Error handling

---

**Happy Building!** 🚀

For questions or feedback, reach out via GitHub Issues or contribute to the project.
