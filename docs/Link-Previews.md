# Link Previews & URL Unfurling

Complete implementation of rich link previews with Open Graph metadata extraction, Twitter Cards, and platform-specific handlers.

## Features

### Auto-Detection

- ✅ Automatic URL detection in message content
- ✅ Extracts up to 2-3 URLs per message (configurable)
- ✅ Real-time preview fetching as messages are sent
- ✅ Smart URL pattern matching

### Metadata Extraction

- ✅ Open Graph protocol support (title, description, images, videos)
- ✅ Twitter Card metadata
- ✅ Fallback to basic HTML meta tags
- ✅ Favicon extraction
- ✅ Theme color detection
- ✅ Author and publication date

### Platform-Specific Handlers

- ✅ YouTube video previews with thumbnails
- ✅ GitHub repository and issue/PR previews
- ✅ Twitter/X post previews
- ✅ Spotify track/album/playlist previews
- ✅ Code snippet previews (Gist, CodePen, CodeSandbox)
- ✅ Direct image and video URL handling

### Security & Performance

- ✅ SSRF protection (blocks private IPs and localhost)
- ✅ Rate limiting per domain (10 requests/minute)
- ✅ Client rate limiting (30 requests/minute)
- ✅ Server-side caching (1 hour TTL)
- ✅ Request timeout (10 seconds)
- ✅ Response size limits (5MB max)
- ✅ Blocked ports protection

### User Controls

- ✅ Privacy mode to hide/show previews
- ✅ Dismiss individual previews
- ✅ Disable auto-unfurl option
- ✅ Loading states with skeletons
- ✅ Error handling with fallback display

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Message Component                        │
├─────────────────────────────────────────────────────────────┤
│  MessageContent                                              │
│    ├── Text Content                                          │
│    └── LinkPreview Component                                 │
│         ├── Auto-detect URLs                                 │
│         ├── Fetch previews via API                           │
│         └── Display LinkPreviewCard(s)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route (/api/unfurl)                   │
├─────────────────────────────────────────────────────────────┤
│  1. Rate Limiting                                            │
│  2. URL Validation & SSRF Check                              │
│  3. Cache Check                                              │
│  4. Fetch URL with timeout                                   │
│  5. Parse HTML                                               │
│  6. Extract Metadata                                         │
│  7. Cache Result                                             │
│  8. Return Preview Data                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 URL Unfurler Service                         │
├─────────────────────────────────────────────────────────────┤
│  unfurlUrl()                                                 │
│    ├── Security checks (SSRF, blocked domains)              │
│    ├── Rate limit enforcement                                │
│    ├── Cache management                                      │
│    ├── HTTP fetch with protection                            │
│    └── HTML parsing                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Parser Services                            │
├─────────────────────────────────────────────────────────────┤
│  Open Graph Parser                                           │
│    └── parseOpenGraph() - Extract og: meta tags             │
│  Twitter Card Parser                                         │
│    └── parseTwitterCard() - Extract twitter: meta tags      │
│  Basic Metadata Parser                                       │
│    └── parseBasicMetadata() - Extract <title>, etc.         │
│  Domain Handlers                                             │
│    ├── YouTube handler                                       │
│    ├── GitHub handler                                        │
│    ├── Twitter handler                                       │
│    └── Spotify handler                                       │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── components/chat/
│   ├── LinkPreview.tsx              # Main preview component
│   ├── link-preview-card.tsx        # (Integrated in LinkPreview.tsx)
│   └── message-content.tsx          # Updated with preview support
│
├── lib/
│   ├── link-preview/
│   │   ├── preview-types.ts         # TypeScript types
│   │   ├── unfurl.ts                # Main unfurl logic
│   │   ├── og-parser.ts             # Open Graph parser
│   │   ├── twitter-parser.ts        # Twitter Card parser
│   │   ├── domain-handlers.ts       # Platform-specific handlers
│   │   ├── preview-sanitizer.ts     # Security sanitization
│   │   ├── preview-cache.ts         # Cache management
│   │   └── index.ts                 # Public API
│   │
│   ├── social/
│   │   ├── url-unfurler.ts          # Server-side unfurl service
│   │   └── og-parser.ts             # Complete OG implementation
│   │
│   └── messages/
│       └── link-preview.ts          # Client-side helpers
│
└── app/api/
    ├── unfurl/
    │   └── route.ts                 # Main unfurl API endpoint
    └── link-preview/
        └── route.ts                 # Alternative endpoint
```

## Usage

### Basic Usage

The LinkPreview component automatically detects and displays previews for URLs in messages:

```tsx
import { MessageContent } from '@/components/chat/message-content'
;<MessageContent
  content="Check out this article: https://example.com/article"
  showLinkPreviews={true} // Default: true
/>
```

### Manual Preview Rendering

You can also render previews manually:

```tsx
import { LinkPreview } from '@/components/chat/LinkPreview'
;<LinkPreview
  content="https://github.com/vercel/next.js"
  maxPreviews={3}
  autoFetch={true}
  allowDismiss={true}
  onDismiss={(url) => console.log('Dismissed:', url)}
/>
```

### API Usage

Fetch preview data directly:

```typescript
// Single URL
const response = await fetch('/api/unfurl?url=' + encodeURIComponent(url))
const result = await response.json()

if (result.success) {
  console.log('Title:', result.data.title)
  console.log('Image:', result.data.image)
  console.log('Description:', result.data.description)
}

// Batch URLs
const response = await fetch('/api/unfurl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://example.com', 'https://github.com/vercel/next.js'],
    forceRefresh: false,
  }),
})
const result = await response.json()

// result.results contains a map of URL -> preview data
```

### Server-Side Usage

Use the unfurler service directly in API routes or server components:

```typescript
import { unfurlUrl } from '@/lib/social/url-unfurler'

const result = await unfurlUrl('https://example.com', {
  forceRefresh: false,
  timeout: 10000,
  cacheTtl: 3600000, // 1 hour
})

if (result.success) {
  console.log('Preview:', result.data)
}
```

## Configuration

### Environment Variables

```bash
# Optional: Custom user agent
UNFURL_USER_AGENT="nchat-bot/1.0 (+https://nchat.app/bot)"

# Optional: Custom timeout (milliseconds)
UNFURL_TIMEOUT=10000

# Optional: Cache duration (milliseconds)
UNFURL_CACHE_DURATION=3600000
```

### Rate Limiting

Default limits (configurable in code):

```typescript
// Per domain
RATE_LIMIT_PER_DOMAIN: 10 requests/minute

// Per client (IP)
CLIENT_RATE_LIMIT: 30 requests/minute
```

### SSRF Protection

Automatically blocks:

- Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- Loopback addresses (127.x.x.x, ::1)
- Link-local addresses (169.254.x.x)
- Cloud metadata services
- Blocked ports (22, 23, 25, 3389, 5432, 3306, 6379, 27017)

## Preview Data Structure

```typescript
interface LinkPreviewData {
  // Core fields
  url: string
  type: 'generic' | 'article' | 'video' | 'image' | 'audio' | ...
  status: 'pending' | 'loading' | 'success' | 'error'
  domain: string
  isSecure: boolean

  // Content
  title?: string
  description?: string
  siteName?: string
  favicon?: string

  // Media
  image?: string
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
  video?: string
  audio?: string

  // Metadata
  author?: string
  publishedTime?: string
  modifiedTime?: string
  locale?: string
  themeColor?: string

  // Cache
  fetchedAt: number
  expiresAt: number

  // Error
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}
```

## Platform-Specific Features

### YouTube

- Video ID extraction
- Thumbnail URLs (hqdefault)
- Embed URLs
- Channel information (when available)

### GitHub

- Repository previews with stars/forks
- Issue and PR previews with state
- User/organization information
- OpenGraph images from GitHub CDN

### Twitter/X

- Tweet ID and author extraction
- oEmbed support
- User verification badges
- Media attachments

### Spotify

- Track, album, playlist, artist previews
- Embed URLs for playback
- Album artwork
- Artist information

### Code Snippets

- GitHub Gist
- CodePen
- CodeSandbox
- Embed URLs for live preview

## Error Handling

The system handles various error conditions gracefully:

### Network Errors

- Timeout (10 second limit)
- DNS resolution failures
- Connection refused
- SSL/TLS errors

### Content Errors

- Response too large (5MB limit)
- Non-HTML content type
- Missing metadata
- Malformed HTML

### Security Errors

- Private IP addresses
- Blocked domains
- SSRF attempts
- Blocked ports

### Rate Limiting

- Per-domain rate limits
- Per-client rate limits
- Automatic retry-after headers

## Caching Strategy

### Server-Side Cache

- In-memory cache (use Redis in production)
- 1 hour default TTL
- LRU eviction (max 1000 entries)
- Automatic cache size management

### Client-Side Cache

- Browser cache via Cache-Control headers
- 1 hour max-age
- Stale-while-revalidate for 24 hours
- Per-message preview caching

## Performance

### Optimizations

- Concurrent preview fetching (max 5 parallel)
- Lazy image loading
- Progressive preview rendering
- Cache hits avoid network requests

### Metrics

- Average fetch time: 200-500ms
- Cache hit rate: ~80% (typical)
- Memory usage: ~10KB per cached preview
- Network bandwidth: ~20-50KB per preview

## Testing

### Manual Testing

```bash
# Test single URL
curl "http://localhost:3000/api/unfurl?url=https://github.com/vercel/next.js"

# Test with force refresh
curl "http://localhost:3000/api/unfurl?url=https://example.com&refresh=true"

# Test batch
curl -X POST http://localhost:3000/api/unfurl \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://github.com/vercel/next.js", "https://youtube.com/watch?v=dQw4w9WgXcQ"]}'
```

### Unit Tests

```typescript
import { unfurlUrl } from '@/lib/social/url-unfurler'
import { parseOpenGraph } from '@/lib/social/og-parser'

describe('URL Unfurler', () => {
  it('should unfurl a valid URL', async () => {
    const result = await unfurlUrl('https://example.com')
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('should block private IPs', async () => {
    const result = await unfurlUrl('http://192.168.1.1')
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('BLOCKED')
  })
})
```

## Production Considerations

### Scaling

- Replace in-memory cache with Redis
- Use CDN for preview images
- Implement distributed rate limiting
- Add monitoring and logging

### Security

- Regular security audits
- Update SSRF protection rules
- Monitor for abuse patterns
- Implement IP allowlists

### Performance

- Enable HTTP/2 for parallel fetches
- Optimize image processing
- Implement preview pre-caching
- Use worker threads for parsing

## Troubleshooting

### Preview Not Loading

1. Check network tab for API errors
2. Verify URL is accessible
3. Check rate limits
4. Inspect browser console for errors

### SSRF Errors

1. Verify URL is not private IP
2. Check blocked domains list
3. Ensure port is allowed

### Slow Performance

1. Check cache hit rate
2. Verify network latency
3. Monitor API response times
4. Check concurrent request limits

### Missing Metadata

1. Verify site has Open Graph tags
2. Check robots.txt for bot blocking
3. Verify User-Agent is allowed
4. Test with different parsers

## Future Enhancements

- [ ] oEmbed protocol support
- [ ] Video preview with inline player
- [ ] Audio waveform visualization
- [ ] PDF preview thumbnails
- [ ] RSS feed detection
- [ ] Schema.org structured data
- [ ] Machine learning for preview quality scoring
- [ ] WebSocket for real-time preview updates
- [ ] Preview history and analytics
- [ ] Custom domain handlers registry

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [oEmbed Specification](https://oembed.com/)
- [SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
