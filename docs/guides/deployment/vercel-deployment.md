# Vercel Deployment Guide for nself-chat (nchat)

**Version**: 1.0.0
**Last Updated**: 2026-01-31
**Difficulty**: Beginner-Friendly
**Estimated Time**: 15-30 minutes

This guide provides step-by-step instructions for deploying nchat to Vercel with one-click deployment support.

---

## Table of Contents

- [Why Vercel?](#why-vercel)
- [Prerequisites](#prerequisites)
- [Quick Start: One-Click Deploy](#quick-start-one-click-deploy)
- [Manual Deployment](#manual-deployment)
- [Environment Variables Setup](#environment-variables-setup)
- [Backend Configuration](#backend-configuration)
- [Custom Domain Setup](#custom-domain-setup)
- [Deployment Status & Monitoring](#deployment-status--monitoring)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Why Vercel?

Vercel is the ideal platform for deploying nchat because:

- **Zero Configuration**: Works out-of-the-box with Next.js 15
- **Global CDN**: Automatic edge caching and fast page loads
- **Automatic SSL**: Free HTTPS certificates for all deployments
- **Preview Deployments**: Every git push gets a preview URL
- **Serverless Functions**: Built-in API route support
- **Free Tier**: Generous free tier for hobby projects
- **Easy Rollbacks**: One-click rollback to previous deployments

---

## Prerequisites

Before deploying, ensure you have:

- [ ] **GitHub Account** - For connecting your repository
- [ ] **Vercel Account** - [Sign up free](https://vercel.com/signup)
- [ ] **Backend Services** - Running nself backend OR Nhost cloud account
- [ ] **Environment Variables** - Listed below

> **Note**: If you don't have a backend yet, you can deploy the frontend first and connect it later.

---

## Quick Start: One-Click Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Fork the Repository**
   - Visit [https://github.com/yourusername/nself-chat](https://github.com/yourusername/nself-chat)
   - Click "Fork" in the top-right corner

2. **Deploy to Vercel**

   Click the button below to deploy:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nself-chat&env=NEXT_PUBLIC_USE_DEV_AUTH,NEXT_PUBLIC_APP_NAME,NEXT_PUBLIC_APP_URL,NEXT_PUBLIC_GRAPHQL_URL,NEXT_PUBLIC_AUTH_URL,NEXT_PUBLIC_STORAGE_URL&envDescription=Environment%20variables%20required%20for%20nchat&envLink=https://github.com/yourusername/nself-chat/blob/main/docs/guides/deployment/vercel-deployment.md&project-name=nchat&repository-name=nself-chat)

3. **Configure Environment Variables** (see [Environment Variables Setup](#environment-variables-setup))

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Visit your new deployment URL

### Option 2: Deploy from Vercel Dashboard

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your forked `nself-chat` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables** (see next section)

5. **Deploy!**

---

## Manual Deployment

### Using Vercel CLI

1. **Install Vercel CLI**

   ```bash
   pnpm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**

   ```bash
   cd /path/to/nself-chat
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - Project name? **nchat** (or your preference)
   - Directory? **./** (current directory)
   - Override settings? **N** (use defaults)

5. **Deploy to Production**

   ```bash
   vercel --prod
   ```

---

## Environment Variables Setup

### Required Variables

These variables **must** be set for nchat to work:

| Variable                   | Description                                     | Example                                            |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_USE_DEV_AUTH` | Enable dev auth (set to `false` for production) | `false`                                            |
| `NEXT_PUBLIC_APP_NAME`     | Your app name                                   | `nchat`                                            |
| `NEXT_PUBLIC_APP_URL`      | Your deployment URL                             | `https://nchat.vercel.app`                         |
| `NEXT_PUBLIC_GRAPHQL_URL`  | Hasura GraphQL endpoint                         | `https://api.yourproject.nhost.run/v1/graphql`     |
| `NEXT_PUBLIC_AUTH_URL`     | Authentication service URL                      | `https://auth.yourproject.nhost.run/v1/auth`       |
| `NEXT_PUBLIC_STORAGE_URL`  | File storage URL                                | `https://storage.yourproject.nhost.run/v1/storage` |

### Adding Variables in Vercel Dashboard

1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Name**: Variable name (e.g., `NEXT_PUBLIC_APP_NAME`)
   - **Value**: Variable value (e.g., `nchat`)
   - **Environment**: Select "Production", "Preview", and "Development"
4. Click "Save"

### Adding Variables via CLI

```bash
# Add single variable
vercel env add NEXT_PUBLIC_APP_NAME production

# Add from .env file
vercel env pull .env.production
```

### Optional Variables

For enhanced features, add these optional variables:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Social Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Service
SENDGRID_API_KEY=your-sendgrid-key
```

---

## Backend Configuration

nchat requires a backend for full functionality. You have two options:

### Option A: Use Nhost Cloud (Recommended for Beginners)

1. **Sign up for Nhost**
   - Visit [nhost.io](https://nhost.io)
   - Create a free account
   - Create a new project

2. **Get Your URLs**
   - Go to project "Settings" → "Overview"
   - Copy these URLs:
     - GraphQL URL
     - Auth URL
     - Storage URL

3. **Add to Vercel**
   - Add the URLs as environment variables in Vercel
   - Redeploy your project

### Option B: Self-Host with nself CLI

1. **Deploy nself Backend**

   See [nself CLI Documentation](https://github.com/nself/nself) for deployment options:
   - Docker Compose
   - Kubernetes
   - Traditional server

2. **Configure Public URLs**

   Ensure your backend services are accessible via HTTPS:
   - `https://api.yourdomain.com` → Hasura
   - `https://auth.yourdomain.com` → Auth service
   - `https://storage.yourdomain.com` → Storage service

3. **Update Environment Variables**

   Point your Vercel deployment to your backend URLs.

### Development Mode (Testing Only)

For testing without a backend:

```bash
NEXT_PUBLIC_USE_DEV_AUTH=true
```

This enables 8 test users with auto-login. **DO NOT use in production!**

---

## Custom Domain Setup

### Add Custom Domain

1. **Go to Vercel Dashboard**
   - Select your project
   - Click "Settings" → "Domains"

2. **Add Domain**
   - Enter your domain (e.g., `chat.yourdomain.com`)
   - Click "Add"

3. **Configure DNS**

   Vercel will show you DNS records to add:

   **For subdomain (chat.yourdomain.com)**:

   ```
   Type: CNAME
   Name: chat
   Value: cname.vercel-dns.com
   ```

   **For root domain (yourdomain.com)**:

   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

4. **Wait for Verification**
   - DNS propagation takes 5-60 minutes
   - Vercel automatically provisions SSL certificate
   - Domain status will change to "Valid"

5. **Update Environment Variable**

   Update `NEXT_PUBLIC_APP_URL` to your custom domain:

   ```bash
   NEXT_PUBLIC_APP_URL=https://chat.yourdomain.com
   ```

---

## Deployment Status & Monitoring

### View Deployment Status

1. **Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click your project
   - See recent deployments with status

2. **Deployment Logs**
   - Click any deployment
   - View build logs and runtime logs
   - Check for errors or warnings

### Using the In-App Status Checker

nchat includes a built-in deployment status checker in the admin panel:

1. Login as admin
2. Go to "Settings" → "Deployment"
3. View:
   - Current deployment status
   - Build information
   - Environment health checks
   - SSL certificate status

### Monitoring with Sentry

For production error tracking:

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Copy your DSN
4. Add to Vercel environment variables:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Fails: "Cannot find module 'pnpm'"

**Problem**: Vercel doesn't recognize pnpm

**Solution**: Add `package.json` field:

```json
{
  "packageManager": "pnpm@9.15.4"
}
```

Or create `pnpm-lock.yaml` in root directory.

---

#### 2. Runtime Error: "Invalid GraphQL URL"

**Problem**: Backend URLs are not set or incorrect

**Solution**:

1. Check environment variables in Vercel
2. Ensure URLs are HTTPS (not HTTP)
3. Test URLs in browser/Postman
4. Redeploy after fixing

---

#### 3. Authentication Not Working

**Problem**: `NEXT_PUBLIC_USE_DEV_AUTH` is `true` in production

**Solution**:

1. Set `NEXT_PUBLIC_USE_DEV_AUTH=false`
2. Ensure `NEXT_PUBLIC_AUTH_URL` is correct
3. Redeploy

---

#### 4. Images/Files Not Loading

**Problem**: Storage URL is incorrect or CORS not configured

**Solution**:

1. Verify `NEXT_PUBLIC_STORAGE_URL`
2. Configure CORS in your storage service:
   ```json
   {
     "allowed_origins": ["https://your-domain.vercel.app"],
     "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
     "allowed_headers": ["*"]
   }
   ```

---

#### 5. Function Timeout (Serverless Function Execution Timeout)

**Problem**: API routes take too long (10s free tier, 60s Pro)

**Solution**:

1. Optimize database queries
2. Add indexes to frequently queried fields
3. Implement caching (Redis/Vercel KV)
4. Upgrade to Pro plan for 60s timeout

---

#### 6. Environment Variables Not Updating

**Problem**: Changed env vars but app still uses old values

**Solution**:

1. Redeploy after changing env vars
2. Clear Vercel cache: `vercel --force`
3. Check variable scope (Production/Preview/Development)

---

#### 7. "This Page Could Not Be Found" on Routes

**Problem**: Dynamic routes not working

**Solution**:

1. Ensure `next.config.js` doesn't override routes
2. Check file names in `src/app/` match URL structure
3. Clear `.next` cache and rebuild

---

#### 8. GraphQL Subscriptions Not Working

**Problem**: WebSocket connections fail

**Solution**:

1. Vercel doesn't support WebSockets on edge
2. Use Hasura Cloud or separate WebSocket server
3. Configure WebSocket URL separately:
   ```bash
   NEXT_PUBLIC_WS_URL=wss://your-hasura.nhost.run/v1/graphql
   ```

---

#### 9. Large Bundle Size Warning

**Problem**: Build warns about large bundle size

**Solution**:

1. Enable bundle analysis:
   ```bash
   ANALYZE=true pnpm build
   ```
2. Optimize imports (import only what you need)
3. Enable code splitting
4. Lazy load heavy components

---

#### 10. Rate Limiting on Free Tier

**Problem**: Too many requests/bandwidth

**Solution**:

1. Implement caching with `Cache-Control` headers
2. Use Vercel Edge Config for static data
3. Upgrade to Pro plan for higher limits

---

### Getting Help

If you're still stuck:

1. **Check Vercel Logs**
   - Deployment logs
   - Runtime logs
   - Error tracking

2. **Community Support**
   - [Vercel Discord](https://vercel.com/discord)
   - [Vercel Discussions](https://github.com/vercel/next.js/discussions)
   - [nself Community](https://github.com/nself/nself/discussions)

3. **Professional Support**
   - [Vercel Support](https://vercel.com/support) (Pro plan)
   - [nself Support](mailto:support@nself.org)

---

## Advanced Configuration

### Custom Build Configuration

Create/edit `vercel.json`:

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/chat",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/graphql",
      "destination": "https://api.yourproject.nhost.run/v1/graphql"
    }
  ]
}
```

### Edge Runtime Configuration

For faster API routes, use Edge Runtime:

```typescript
// src/app/api/config/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  // Your API logic
}
```

### Preview Deployments

Every git push to a branch creates a preview deployment:

1. Push to any branch:

   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   ```

2. Vercel automatically deploys
3. Get unique preview URL
4. Share with team for testing
5. Merge to main for production deployment

### Deployment Protection

Enable deployment protection:

1. Go to "Settings" → "Deployment Protection"
2. Enable options:
   - **Password Protection**: Require password to access
   - **Vercel Authentication**: Only team members can access
   - **Trusted IPs**: Allow specific IP addresses

### Performance Optimizations

1. **Enable Image Optimization**

   ```typescript
   // next.config.js
   module.exports = {
     images: {
       domains: ['storage.yourproject.nhost.run'],
       formats: ['image/avif', 'image/webp'],
     },
   }
   ```

2. **Enable Compression**

   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Content-Encoding",
             "value": "gzip"
           }
         ]
       }
     ]
   }
   ```

3. **Use Vercel Edge Config**

   ```typescript
   import { get } from '@vercel/edge-config'

   const config = await get('app-config')
   ```

---

## Deployment Checklist

Before going live, verify:

- [ ] **Environment Variables**: All required vars set
- [ ] **Dev Auth Disabled**: `NEXT_PUBLIC_USE_DEV_AUTH=false`
- [ ] **Backend Connected**: GraphQL/Auth/Storage URLs working
- [ ] **Custom Domain**: DNS configured and SSL active
- [ ] **Error Tracking**: Sentry configured
- [ ] **Analytics**: Google Analytics or similar enabled
- [ ] **Testing**: Preview deployment tested thoroughly
- [ ] **Performance**: Lighthouse score > 90
- [ ] **Security**: Secrets not exposed in client-side code
- [ ] **Monitoring**: Uptime monitoring configured
- [ ] **Backups**: Database backups enabled
- [ ] **Documentation**: Updated with deployment URLs

---

## Cost Estimation

### Vercel Pricing

| Tier           | Price     | Limits                                      |
| -------------- | --------- | ------------------------------------------- |
| **Hobby**      | Free      | 100 GB bandwidth, 1000 serverless functions |
| **Pro**        | $20/month | 1 TB bandwidth, 1M serverless functions     |
| **Enterprise** | Custom    | Unlimited, SLA, custom support              |

### Backend Costs

| Option            | Price       | Notes                               |
| ----------------- | ----------- | ----------------------------------- |
| **Nhost Free**    | Free        | 1 GB database, 1 GB storage         |
| **Nhost Starter** | $25/month   | 8 GB database, 20 GB storage        |
| **Self-hosted**   | $5-50/month | VPS costs (DigitalOcean, AWS, etc.) |

**Total Estimated Cost for Small Team**: $0-45/month

---

## Next Steps

After successful deployment:

1. **Configure Setup Wizard** - Run the 9-step setup wizard
2. **Create Channels** - Set up your team channels
3. **Invite Users** - Send invitation links
4. **Customize Branding** - Update logo, colors, theme
5. **Enable Features** - Turn on features you need
6. **Monitor Performance** - Check Vercel analytics and Sentry

---

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [nself CLI Guide](https://github.com/nself/nself)
- [Nhost Documentation](https://docs.nhost.io)
- [nchat Documentation](../../README.md)

---

**Questions?** Open an issue on [GitHub](https://github.com/yourusername/nself-chat/issues) or join our [Discord](https://discord.gg/nself).
