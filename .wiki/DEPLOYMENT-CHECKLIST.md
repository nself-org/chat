# Production Deployment Checklist - nself-chat v0.9.1

Use this checklist to ensure safe production deployment after the v0.9.1 cleanup.

---

## Pre-Deployment (Local)

### Code Quality

- [ ] Run `pnpm build` - Should complete without errors
- [ ] Run `pnpm type-check` - No TypeScript errors
- [ ] Run `pnpm lint` - All lint checks pass
- [ ] Run `pnpm test` - All tests pass
- [ ] Review `CLEANUP-SUMMARY.txt` for changes overview

### Verification

- [ ] Verify console statements: `find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep "console\." {} + | wc -l` (should be <150)
- [ ] Verify TODOs: `grep -r "TODO:" src --include="*.ts" --include="*.tsx" | wc -l` (should be <20)
- [ ] Verify logger imports: `grep -r "from '@/lib/logger'" src | wc -l` (should be 600+)
- [ ] Check no FIXME: `grep -r "FIXME:" src | wc -l` (should be 0)
- [ ] Check no HACK: `grep -r "HACK:" src | wc -l` (should be 0)

### Documentation Review

- [ ] Read `PRODUCTION-READY.md` - Understand deployment recommendations
- [ ] Review `docs/CLEANUP-REPORT-v0.9.1.md` - Understand what changed
- [ ] Scan `docs/future-enhancements.md` - Know what's planned
- [ ] Review `docs/LOGGING-GUIDE.md` - Understand new logging system

---

## Environment Configuration

### Required Environment Variables

- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- [ ] `SENTRY_AUTH_TOKEN` - Sentry auth token for builds
- [ ] `SENTRY_ORG` - Sentry organization slug
- [ ] `SENTRY_PROJECT` - Sentry project slug
- [ ] `NODE_ENV=production` - Production mode

### Optional Environment Variables

- [ ] `NEXT_PUBLIC_LOG_LEVEL=warn` - Production log level
- [ ] `LOG_LEVEL=warn` - Server-side log level
- [ ] `NEXT_PUBLIC_RELEASE_VERSION=0.9.1` - Version for Sentry

### Backend Configuration

- [ ] Verify `.backend/.env` is properly configured
- [ ] Run `cd .backend && nself status` - All services running
- [ ] Test GraphQL endpoint: `curl http://api.localhost/v1/graphql`
- [ ] Test Auth endpoint: `curl http://auth.localhost/v1/auth/healthz`

---

## Staging Deployment

### Deploy to Staging

- [ ] Deploy to staging environment
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### Staging Tests

- [ ] Open staging URL in browser
- [ ] Test basic functionality (login, channels, messages)
- [ ] Open browser console - Should see minimal logs
- [ ] Trigger an error intentionally
- [ ] Check Sentry - Error should appear within 60 seconds
- [ ] Test logger methods (check console in dev mode)
- [ ] Verify no console.debug statements in production
- [ ] Test authentication flow
- [ ] Test file upload
- [ ] Test real-time messaging

### Performance Tests

- [ ] Check Lighthouse score (should be 80+)
- [ ] Check bundle size: `pnpm build && ls -lh .next/static/chunks`
- [ ] Verify logger overhead is minimal (<1ms per call)
- [ ] Monitor memory usage
- [ ] Check for memory leaks

### Sentry Validation

- [ ] Open Sentry dashboard
- [ ] Verify errors are being captured
- [ ] Check error grouping is working
- [ ] Verify user context is included
- [ ] Check breadcrumbs are helpful
- [ ] Verify source maps are uploaded

---

## Production Deployment

### Pre-Deploy

- [ ] All staging tests passed
- [ ] Team review and approval
- [ ] Create deployment tag: `git tag v0.9.1-production`
- [ ] Backup current production database
- [ ] Document rollback plan

### Deploy

- [ ] Deploy to production
- [ ] Monitor deployment logs
- [ ] Wait for all services to be healthy

### Post-Deploy Verification (15 minutes)

- [ ] **Minute 1**: Check application loads
- [ ] **Minute 2**: Test user login
- [ ] **Minute 3**: Test basic chat functionality
- [ ] **Minute 5**: Check Sentry - No critical errors
- [ ] **Minute 7**: Monitor server logs
- [ ] **Minute 10**: Check error rate in Sentry
- [ ] **Minute 15**: Verify performance metrics

### Monitoring Setup

- [ ] Set up Sentry alerts for critical errors
- [ ] Monitor CPU usage (should be stable)
- [ ] Monitor memory usage (should not grow)
- [ ] Monitor response times (should be <200ms)
- [ ] Set up log aggregation (if available)

---

## Post-Deployment (24 hours)

### Hour 1

- [ ] Monitor Sentry dashboard
- [ ] Check error rate (should be <1%)
- [ ] Verify no critical errors
- [ ] Check user activity is normal

### Hour 4

- [ ] Review error trends in Sentry
- [ ] Check for any repeated errors
- [ ] Monitor performance metrics
- [ ] Verify logging is not too verbose

### Hour 12

- [ ] Full system health check
- [ ] Review all Sentry errors
- [ ] Check database performance
- [ ] Verify real-time features working

### Hour 24

- [ ] Comprehensive error analysis
- [ ] Performance trend analysis
- [ ] User feedback review
- [ ] Plan any hotfixes if needed

---

## Rollback Plan

### If Critical Issues Found

1. **Immediate Rollback** (< 5 minutes)

   ```bash
   # Revert to previous version
   git checkout v0.9.0-production
   pnpm build
   # Deploy previous build
   ```

2. **Database Rollback** (if needed)

   ```bash
   # Restore from backup
   cd .backend
   # Follow backup restoration procedure
   ```

3. **Communication**
   - Notify team of rollback
   - Document issues found
   - Create hotfix plan

### Non-Critical Issues

- Document in Sentry
- Add to `docs/future-enhancements.md`
- Plan fix for v0.9.2

---

## Success Criteria

### Must Have (Critical)

- [ ] Application loads and functions normally
- [ ] No critical errors in Sentry (P0/P1)
- [ ] Authentication works correctly
- [ ] Real-time messaging works
- [ ] Error rate <1%
- [ ] Response times <200ms
- [ ] No console.debug in production logs

### Should Have (Important)

- [ ] All logger calls working correctly
- [ ] Sentry capturing all errors with context
- [ ] Performance metrics stable
- [ ] No memory leaks detected
- [ ] All integrations working (if enabled)

### Nice to Have

- [ ] Lighthouse score 85+
- [ ] Zero console.log in production logs
- [ ] Beautiful error messages in Sentry
- [ ] Comprehensive breadcrumb trails

---

## Troubleshooting Guide

### Logger Not Working

```bash
# Check logger is imported
grep -r "from '@/lib/logger'" src | wc -l

# Verify Sentry DSN is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Check build includes logger
ls -lh .next/static/chunks | grep logger
```

### Errors Not Appearing in Sentry

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry project settings
3. Verify source maps uploaded
4. Test error manually: `logger.error('Test error', new Error('test'))`
5. Check browser network tab for Sentry requests

### Too Many Logs

1. Set `NEXT_PUBLIC_LOG_LEVEL=error` (temporary)
2. Review verbose log sources
3. Adjust log levels per module if needed

### Performance Issues

1. Check bundle size: `pnpm build && bundlesize`
2. Verify logger overhead with performance tests
3. Check for logging in tight loops
4. Review Sentry performance monitoring

---

## Emergency Contacts

- **Technical Lead**: [Name]
- **DevOps**: [Name]
- **On-Call**: [Name]
- **Sentry Admin**: [Name]

---

## Sign-Off

### Deployment Team

- [ ] Developer: **\*\***\_**\*\*** Date: **\_\_\_**
- [ ] QA: **\*\***\_**\*\*** Date: **\_\_\_**
- [ ] DevOps: **\*\***\_**\*\*** Date: **\_\_\_**
- [ ] Technical Lead: **\*\***\_**\*\*** Date: **\_\_\_**

### Production Deployment

- [ ] Deployed by: **\*\***\_**\*\***
- [ ] Deployment time: **\*\***\_**\*\***
- [ ] Verified by: **\*\***\_**\*\***
- [ ] Approval: **\*\***\_**\*\***

---

## Notes

(Add any deployment-specific notes, issues encountered, or important observations here)

---

**Document Version**: 1.0
**Last Updated**: February 3, 2026
**Related Docs**:

- `PRODUCTION-READY.md`
- `docs/CLEANUP-REPORT-v0.9.1.md`
- `docs/LOGGING-GUIDE.md`
