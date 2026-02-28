# nchat Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment Checklist

### 1. Backend Setup

- [ ] Backend services are deployed and accessible
- [ ] PostgreSQL database is running (v14+)
- [ ] Hasura GraphQL endpoint is accessible via HTTPS
- [ ] Authentication service is running and accessible
- [ ] Storage service is running (S3/MinIO)
- [ ] All backend URLs are using HTTPS (not HTTP)
- [ ] Database backups are configured
- [ ] Backend health checks are passing

### 2. Environment Variables

- [ ] All required environment variables are set
- [ ] `NEXT_PUBLIC_USE_DEV_AUTH` is set to `false`
- [ ] `NEXT_PUBLIC_APP_URL` matches your domain
- [ ] `NEXT_PUBLIC_GRAPHQL_URL` is correct
- [ ] `NEXT_PUBLIC_AUTH_URL` is correct
- [ ] `NEXT_PUBLIC_STORAGE_URL` is correct
- [ ] No development URLs (localhost, .local) in production vars
- [ ] Secrets are at least 32 characters long
- [ ] API keys are valid and not expired

### 3. Security

- [ ] SSL/TLS certificates are configured
- [ ] CORS settings allow your frontend domain
- [ ] OAuth redirect URLs include your domain
- [ ] Rate limiting is enabled
- [ ] CSRF protection is enabled
- [ ] Secrets are not committed to git
- [ ] `.env.local` is in `.gitignore`
- [ ] Security headers are configured (CSP, X-Frame-Options, etc.)

### 4. Testing

- [ ] Application builds successfully (`pnpm build`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] E2E tests pass (if applicable)
- [ ] Test deployment on preview/staging environment
- [ ] Authentication flow works correctly
- [ ] File uploads work
- [ ] Real-time messaging works
- [ ] Mobile responsive design verified

### 5. Monitoring & Analytics

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Google Analytics, Plausible, etc.)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Alerting set up for critical errors

### 6. Performance

- [ ] Images are optimized
- [ ] Bundle size is acceptable (<500KB first load)
- [ ] Lighthouse score > 90
- [ ] Critical CSS inlined
- [ ] Fonts are preloaded
- [ ] Lazy loading implemented for routes/components
- [ ] API responses are cached appropriately
- [ ] Database queries are optimized (indexes, etc.)

### 7. Content & Configuration

- [ ] Setup wizard completed
- [ ] Branding configured (logo, colors, theme)
- [ ] Default channels created
- [ ] Admin users created
- [ ] Email templates configured
- [ ] Legal pages updated (Privacy Policy, Terms of Service)
- [ ] Support email configured
- [ ] Social media links updated

## Deployment Checklist (Vercel)

### 1. Repository Setup

- [ ] Code is pushed to GitHub
- [ ] Repository is public or Vercel has access
- [ ] `.vercelignore` is configured
- [ ] `vercel.json` is configured (if needed)

### 2. Vercel Configuration

- [ ] Project created in Vercel
- [ ] Correct branch is set for production
- [ ] Build command is set: `pnpm build`
- [ ] Output directory is set: `.next`
- [ ] Framework preset is set: Next.js
- [ ] Environment variables are added
- [ ] All env vars are set for Production environment

### 3. Custom Domain (Optional)

- [ ] Custom domain added in Vercel
- [ ] DNS records configured (A/CNAME)
- [ ] SSL certificate provisioned
- [ ] Domain verification complete
- [ ] `NEXT_PUBLIC_APP_URL` updated to custom domain
- [ ] OAuth redirect URLs updated

### 4. Deployment

- [ ] Initial deployment successful
- [ ] Deployment build logs checked for errors
- [ ] Application loads at deployment URL
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] API routes are working

## Post-Deployment Checklist

### 1. Verification

- [ ] Visit deployment URL and verify it loads
- [ ] Test user authentication (login/signup)
- [ ] Test creating channels
- [ ] Test sending messages
- [ ] Test file uploads
- [ ] Test real-time updates (multiple browsers)
- [ ] Test notifications
- [ ] Test mobile view (responsive)
- [ ] Verify all navigation works
- [ ] Check admin panel access

### 2. Backend Integration

- [ ] GraphQL API is accessible from deployment
- [ ] Authentication works from deployment
- [ ] File uploads work from deployment
- [ ] CORS allows requests from deployment domain
- [ ] WebSocket connections work (real-time)

### 3. Monitoring Setup

- [ ] Verify Sentry is capturing errors
- [ ] Check analytics data is being collected
- [ ] Verify uptime monitoring is active
- [ ] Test alert notifications
- [ ] Review initial performance metrics

### 4. Team Onboarding

- [ ] Invite team members
- [ ] Create initial channels
- [ ] Set up roles and permissions
- [ ] Configure moderation settings
- [ ] Create welcome messages
- [ ] Document internal processes

### 5. Communication

- [ ] Announce launch to team
- [ ] Share deployment URL
- [ ] Provide login instructions
- [ ] Share support contact info
- [ ] Document any known issues

## Ongoing Maintenance

### Daily

- [ ] Check error tracking dashboard
- [ ] Monitor uptime status
- [ ] Review user activity

### Weekly

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review and moderate content
- [ ] Backup verification

### Monthly

- [ ] Update dependencies
- [ ] Review and optimize database
- [ ] Audit user permissions
- [ ] Review and update documentation
- [ ] Analyze usage metrics
- [ ] Plan new features

## Troubleshooting

If you encounter issues during deployment, check:

1. **[Vercel Deployment Guide - Troubleshooting](./vercel-deployment.md#troubleshooting)**
2. **Deployment logs** in Vercel dashboard
3. **Browser console** for client-side errors
4. **Sentry** for server-side errors
5. **Backend health checks** in admin panel

## Getting Help

- **Documentation**: [Full Deployment Guide](./vercel-deployment.md)
- **Community**: [Discord](https://discord.gg/nself)
- **Issues**: [GitHub Issues](https://github.com/nself/nself-chat/issues)
- **Support**: support@nself.org

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
