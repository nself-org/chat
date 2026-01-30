# Production Deployment Checklist

Use this checklist before deploying nself-chat to production.

## Pre-Deployment Validation

### 1. Environment Variables ✓

- [ ] All required variables are set:
  - [ ] `NEXT_PUBLIC_GRAPHQL_URL` (production URL, not localhost)
  - [ ] `NEXT_PUBLIC_AUTH_URL` (production URL, not localhost)
  - [ ] `NEXT_PUBLIC_STORAGE_URL` (production URL, not localhost)
  - [ ] `HASURA_ADMIN_SECRET` (minimum 32 characters)
  - [ ] `JWT_SECRET` (minimum 32 characters)

- [ ] Run validation script:
  ```bash
  pnpm validate:env:prod
  ```

### 2. Security Configuration ✓

- [ ] Development auth is disabled:
  ```bash
  NEXT_PUBLIC_USE_DEV_AUTH=false
  ```

- [ ] Strong secrets are generated (use openssl):
  ```bash
  openssl rand -base64 48
  ```

- [ ] Secrets are stored securely (not in code):
  - Platform environment variables
  - Secret management service (AWS Secrets Manager, etc.)
  - Kubernetes Secrets

### 3. URL Configuration ✓

- [ ] No localhost patterns in URLs:
  - ❌ `localhost`
  - ❌ `127.0.0.1`
  - ❌ `0.0.0.0`
  - ❌ `.local`
  - ❌ `host.docker.internal`

- [ ] All URLs use HTTPS (not HTTP):
  - ✓ `https://graphql.example.com/v1/graphql`
  - ✓ `https://auth.example.com/v1/auth`
  - ✓ `https://storage.example.com/v1/storage`

### 4. Build Validation ✓

- [ ] TypeScript compiles without errors:
  ```bash
  pnpm type-check
  ```

- [ ] Build succeeds:
  ```bash
  pnpm build
  ```

- [ ] No console errors or warnings

### 5. Testing ✓

- [ ] All tests pass:
  ```bash
  pnpm test
  ```

- [ ] E2E tests pass (if applicable):
  ```bash
  pnpm test:e2e
  ```

- [ ] Manual testing in staging environment

## Deployment Steps

### Vercel

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_GRAPHQL_URL production
vercel env add NEXT_PUBLIC_AUTH_URL production
vercel env add NEXT_PUBLIC_STORAGE_URL production
vercel env add HASURA_ADMIN_SECRET production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_USE_DEV_AUTH production

# Deploy
vercel --prod
```

### Netlify

```bash
# Deploy with environment variables
netlify deploy --prod
```

### Docker

```bash
# Build image
docker build -t nself-chat:latest .

# Run with environment file
docker run --env-file .env.production -p 3000:3000 nself-chat:latest
```

### Kubernetes

```bash
# Apply configuration
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/secrets.yaml
kubectl apply -f deploy/k8s/deployment.yaml

# Verify deployment
kubectl rollout status deployment/nchat
```

## Post-Deployment Verification

### 1. Health Checks ✓

- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Database connections established
- [ ] Storage is accessible
- [ ] Real-time features working

### 2. Monitoring Setup ✓

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics enabled
- [ ] Logging configured
- [ ] Alerts set up

### 3. Security Audit ✓

- [ ] SSL/TLS certificate valid
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] No sensitive data in logs

### 4. Performance ✓

- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] CDN configured for static assets
- [ ] Caching configured

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**:
   ```bash
   # Vercel
   vercel rollback

   # Netlify
   netlify sites:list-deploys
   netlify deploy --site-id=<site-id> --prod --alias=production

   # Kubernetes
   kubectl rollout undo deployment/nchat
   ```

2. **Investigate Issues**:
   - Check deployment logs
   - Review error tracking
   - Test in staging environment

3. **Fix and Redeploy**:
   - Address root cause
   - Run validation again
   - Deploy to staging first
   - Deploy to production

## Common Issues

### Issue: "Missing required environment variables"

**Solution**:
```bash
# Verify all required variables are set
pnpm validate:env:prod
```

### Issue: "Production URLs cannot use localhost"

**Solution**:
```bash
# Update URLs to production endpoints
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage
```

### Issue: "JWT_SECRET must be at least 32 characters long"

**Solution**:
```bash
# Generate a secure secret
openssl rand -base64 48
```

### Issue: "NEXT_PUBLIC_USE_DEV_AUTH is enabled in production"

**Solution**:
```bash
# Disable development auth
NEXT_PUBLIC_USE_DEV_AUTH=false
```

## Security Best Practices

1. **Rotate Secrets Regularly**
   - JWT secrets every 90 days
   - Database passwords every 6 months
   - API keys as needed

2. **Use Environment-Specific Secrets**
   - Never reuse production secrets in staging/dev
   - Generate unique secrets per environment

3. **Secret Management**
   - Use a secret management service
   - Never commit secrets to version control
   - Use encrypted storage for backups

4. **Access Control**
   - Limit who can access production secrets
   - Use role-based access control (RBAC)
   - Enable audit logging

## Validation Command Reference

```bash
# Basic validation
pnpm validate:env

# Production validation (strict)
pnpm validate:env:prod

# With custom environment
NODE_ENV=production NEXT_PUBLIC_ENV=production pnpm validate:env:prod

# Test validation script
./scripts/test-prod-validation.sh
```

## Emergency Contacts

- **DevOps Lead**: [contact]
- **Security Team**: [contact]
- **On-call Engineer**: [contact]
- **Platform Support**: [platform support]

## Documentation Links

- [Production Validation Guide](./Production-Validation.md)
- [Environment Variables Reference](../.env.example)
- [Deployment Guide](./Deployment.md)
- [Troubleshooting Guide](./Troubleshooting.md)

---

**Last Updated**: 2025-01-29
**Version**: 1.0.0
