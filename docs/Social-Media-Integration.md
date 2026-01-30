# Social Media Integration System

Comprehensive social media integration for nself-chat v0.3.0, enabling automatic importing of Twitter, Instagram, and LinkedIn posts into announcement channels.

## Overview

The social media integration system allows administrators to:

1. **Connect Social Accounts** - Link Twitter, Instagram, and LinkedIn accounts via OAuth
2. **Configure Integrations** - Map social accounts to announcement channels
3. **Filter Content** - Apply hashtag, keyword, and engagement filters
4. **Auto-Import** - Automatically poll for new posts and import them
5. **Rich Embeds** - Display posts with images, videos, and engagement stats

## Architecture

### Database Tables

- **`nchat_social_accounts`** - Stores connected social media accounts
- **`nchat_social_posts`** - Imported social media posts
- **`nchat_social_integrations`** - Maps accounts to channels with filters
- **`nchat_social_import_logs`** - Audit log of import jobs

### API Clients

- **`TwitterClient`** - Twitter API v2 integration
- **`InstagramClient`** - Instagram Graph API integration
- **`LinkedInClient`** - LinkedIn API v2 integration

### Components

- **`SocialAccountManager`** - Connect and manage social accounts
- **`SocialIntegrationSettings`** - Configure channel mappings and filters
- **`SocialPostHistory`** - View imported posts

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```bash
# Social Media API Credentials
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_BEARER_TOKEN=your-bearer-token

INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
SOCIAL_MEDIA_ENCRYPTION_KEY=your-encryption-key-here

# App URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration

Run the migration:

```bash
cd .backend
nself exec postgres psql -U postgres -d nself < ../migrations/012_social_media_integration.sql
```

### 3. Obtain API Credentials

#### Twitter (X) API

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new Project + App
3. Enable OAuth 2.0 with PKCE
4. Add callback URL: `http://localhost:3000/api/social/twitter/callback`
5. Request permissions: `tweet.read`, `users.read`, `offline.access`
6. Copy Client ID and Client Secret
7. Upgrade to Essential tier ($100/month) for full access

#### Instagram API

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new Facebook App (Business type)
3. Add Instagram Basic Display product
4. Add OAuth Redirect URI: `http://localhost:3000/api/social/instagram/callback`
5. Connect an Instagram Business Account to a Facebook Page
6. Copy App ID and App Secret
7. Request permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`

#### LinkedIn API

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create a new App
3. Request access to Marketing Developer Platform
4. Add Redirect URL: `http://localhost:3000/api/social/linkedin/callback`
5. Request permissions: `r_liteprofile`, `r_emailaddress`, `w_member_social`, `r_organization_social`
6. Copy Client ID and Client Secret

### 4. Setup Polling (Cron Job)

Create a cron job to poll every 5 minutes:

```bash
# Edit crontab
crontab -e

# Add this line (polls every 5 minutes)
*/5 * * * * curl -X POST http://localhost:3000/api/social/poll
```

Or use a service like **Vercel Cron**, **Render Cron**, or **EasyCron**.

For production, use a job queue system (see below).

## Usage

### Connect a Social Account

1. Navigate to **Admin → Social Media**
2. Click **Connect Twitter/Instagram/LinkedIn**
3. Authorize the app in the OAuth flow
4. Account will appear in the Connected Accounts list

### Create an Integration

1. Go to **Integrations** tab
2. Select the connected account
3. Choose a channel (e.g., `#announcements`)
4. Configure filters:
   - **Hashtags**: Only import posts with specific hashtags (e.g., `#news`, `#updates`)
   - **Keywords**: Only import posts containing keywords (e.g., `"product launch"`)
   - **Exclude Retweets**: (Twitter) Skip retweets
   - **Exclude Replies**: (Twitter) Skip reply tweets
   - **Min Engagement**: Only import posts with X+ likes/shares
5. Click **Create Integration**

### Manual Import

Click the refresh icon next to any account to manually trigger an import.

### View Post History

Go to **Post History** tab to see all imported posts and their status.

## Filtering Logic

Posts are imported only if they match ALL configured filters:

- **Hashtags**: Post must include at least one of the specified hashtags
- **Keywords**: Post content must contain at least one of the keywords
- **Min Engagement**: Total engagement (likes + shares + comments) must be >= threshold
- **Exclude Retweets**: Skip if post is a retweet (Twitter only)
- **Exclude Replies**: Skip if post is a reply (Twitter only)

If no filters are configured, all posts are imported.

## Rich Embed Format

Imported posts are displayed as rich embeds with:

- **Platform icon and color** (Twitter blue, Instagram pink, LinkedIn blue)
- **Author info** (name, handle, avatar)
- **Post content** (text, truncated to 500 chars)
- **Media** (images, videos, GIFs - up to 4 displayed)
- **Engagement stats** (likes, retweets, shares, comments)
- **Link to original post**
- **Timestamp** ("Posted 2h ago")

## Polling System

The polling system (`src/lib/social/poller.ts`) runs every 5 minutes and:

1. Fetches all active social accounts
2. For each account:
   - Decrypts OAuth access token
   - Fetches new posts since last poll
   - Saves posts to `nchat_social_posts`
   - Checks integrations for this account
   - Applies filters to each post
   - Posts matching content to configured channels
   - Creates rich embed messages
   - Updates `last_poll_time`
   - Logs results to `nchat_social_import_logs`

## Security

### Token Encryption

OAuth access tokens are encrypted using AES-256-GCM before storage:

```typescript
import { encryptToken, decryptToken } from '@/lib/social/encryption'

const encrypted = encryptToken(accessToken)
// Store in database

const decrypted = decryptToken(encrypted)
// Use for API calls
```

### Token Refresh

- **Twitter**: Tokens expire after 2 hours, refreshed using refresh token
- **Instagram**: Long-lived tokens (60 days), refreshed automatically
- **LinkedIn**: Tokens expire after 60 days (no refresh token)

The system will automatically attempt to refresh tokens when they expire.

## Production Deployment

### Job Queue Setup

For production, replace cron with a proper job queue:

```typescript
// Using Bull (Redis-based)
import Bull from 'bull'

const socialPollQueue = new Bull('social-media-poll', {
  redis: process.env.REDIS_URL
})

// Add recurring job
socialPollQueue.add(
  'poll-all',
  {},
  {
    repeat: { cron: '*/5 * * * *' } // Every 5 minutes
  }
)

// Process jobs
socialPollQueue.process('poll-all', async (job) => {
  const { pollAllAccounts } = await import('@/lib/social/poller')
  const apolloClient = getApolloClient()
  return await pollAllAccounts(apolloClient)
})
```

### Rate Limiting

API rate limits:

- **Twitter**: 300 requests per 15-min window (Essential tier)
- **Instagram**: 200 requests per hour
- **LinkedIn**: Varies by endpoint

The clients handle rate limits with exponential backoff.

### Monitoring

Check import logs:

```sql
SELECT *
FROM nchat_social_import_logs
ORDER BY started_at DESC
LIMIT 10;
```

Monitor for:
- High error rates
- Token expiration
- Failed imports
- Rate limit hits

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/social/twitter/auth` | GET | Start Twitter OAuth |
| `/api/social/twitter/callback` | GET | Twitter OAuth callback |
| `/api/social/instagram/auth` | GET | Start Instagram OAuth |
| `/api/social/instagram/callback` | GET | Instagram OAuth callback |
| `/api/social/linkedin/auth` | GET | Start LinkedIn OAuth |
| `/api/social/linkedin/callback` | GET | LinkedIn OAuth callback |
| `/api/social/accounts` | GET | List all accounts |
| `/api/social/accounts` | POST | Create account |
| `/api/social/accounts` | DELETE | Delete account |
| `/api/social/poll` | POST | Trigger import (manual or all) |
| `/api/social/poll` | GET | Health check |

## Troubleshooting

### OAuth Errors

**"Invalid redirect URI"**
- Ensure callback URLs are added in developer portal
- Check `NEXT_PUBLIC_APP_URL` matches registered URL

**"Insufficient permissions"**
- Request additional scopes in developer portal
- Re-authorize the account

### Import Errors

**"Failed to fetch posts"**
- Check access token validity
- Verify API credentials
- Check rate limits

**"No posts imported"**
- Verify filters aren't too restrictive
- Check if account has recent posts
- Ensure account is active

### Token Expiration

Tokens will automatically refresh if:
- Refresh token is available (Twitter)
- Token hasn't fully expired (Instagram)

If refresh fails, admin must re-authenticate:
1. Go to Admin → Social Media
2. Click account
3. Click "Reconnect"

## Future Enhancements

- [ ] Webhook support (real-time imports)
- [ ] Multi-account posting (post to social from chat)
- [ ] Sentiment analysis on imported posts
- [ ] TikTok integration
- [ ] YouTube integration
- [ ] Reddit integration
- [ ] Advanced analytics dashboard
- [ ] Scheduled posting
- [ ] Draft management

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Twitter API | Essential | $100/month |
| Instagram API | Free | $0 |
| LinkedIn API | Free | $0 |
| **Total** | | **$100/month** |

Note: Twitter is the only paid service. Instagram and LinkedIn APIs are free for standard usage.

## Support

For issues or questions:
- Check logs in `nchat_social_import_logs`
- Review Sentry errors (if enabled)
- Contact nself-chat support

## References

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
