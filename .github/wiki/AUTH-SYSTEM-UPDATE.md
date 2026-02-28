# Authentication System Update - Production Auth Now Default

**Date**: February 5, 2026
**Version**: v0.9.1
**Breaking Change**: ⚠️ Yes (for local development)

---

## Summary

Starting with v0.9.1, **production authentication (Nhost) is now the default**. Development authentication (FauxAuth with test users) is now opt-in and must be explicitly enabled in local development environments.

### What Changed

| Before (≤ v0.9.0)                         | After (v0.9.1+)                            |
| ----------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_USE_DEV_AUTH=true` (default) | `NEXT_PUBLIC_USE_DEV_AUTH=false` (default) |
| Dev auth enabled by default               | Production auth enabled by default         |
| Test users auto-login                     | Real Nhost authentication required         |

---

## Why This Change?

### Security Best Practices

- **Prevents accidental dev auth in production**: Previously, if someone forgot to set `NEXT_PUBLIC_USE_DEV_AUTH=false`, production deployments would use insecure test accounts
- **Secure by default**: New projects now start with production-ready authentication
- **Explicit opt-in for testing**: Developers must consciously enable test mode

### Production Readiness

- v0.9.1 is production-ready, so production auth should be the default
- Aligns with industry best practices (secure by default)
- Reduces security risks from misconfiguration

### Compliance

- Meets security audit requirements
- Follows principle of least privilege
- Reduces attack surface by default

---

## Migration Guide

### For Local Development

If you're developing locally and want to use test users, update your `.env.local`:

```bash
# Add this line to enable development auth
NEXT_PUBLIC_USE_DEV_AUTH=true
```

### For Production/Staging

No changes needed! Production environments should already have:

```bash
NEXT_PUBLIC_USE_DEV_AUTH=false
```

Or simply omit the variable (defaults to `false` now).

### For CI/CD Pipelines

Verify your CI/CD environment variables:

**✅ Correct** (production):

```bash
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_USE_DEV_AUTH=false  # or omit entirely
```

**✅ Correct** (staging/preview with real auth):

```bash
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_USE_DEV_AUTH=false  # or omit entirely
```

**❌ Incorrect** (do not use):

```bash
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_USE_DEV_AUTH=true  # SECURITY RISK!
```

---

## Authentication Modes Explained

### Production Auth (Default)

**Service**: NhostAuthService
**Backend**: Hasura Auth via nself CLI
**Users**: Real user accounts from database
**Security**: Full production security (hashing, sessions, tokens)

**Requirements**:

- `.backend` services running (`nself start`)
- PostgreSQL database with user tables
- Nhost Auth service configured
- Valid NEXT_PUBLIC_AUTH_URL set

**Usage**:

```bash
# .env.local (or omit NEXT_PUBLIC_USE_DEV_AUTH entirely)
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
```

### Development Auth (Opt-In)

**Service**: FauxAuthService
**Backend**: In-memory mock authentication
**Users**: 8 predefined test accounts
**Security**: ⚠️ NOT FOR PRODUCTION

**Test Users**:
| Email | Password | Role |
|-------|----------|------|
| owner@nself.org | password123 | owner |
| admin@nself.org | password123 | admin |
| moderator@nself.org | password123 | moderator |
| member@nself.org | password123 | member |
| guest@nself.org | password123 | guest |
| alice@nself.org | password123 | member |
| bob@nself.org | password123 | member |
| charlie@nself.org | password123 | member |

**Usage**:

```bash
# .env.local
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development
```

**Features**:

- Auto-login as owner@nself.org on app start
- Switch users programmatically: `useAuth().switchUser('admin@nself.org')`
- No database required
- Instant authentication (no network calls)

---

## Troubleshooting

### "Cannot authenticate" in local development

**Problem**: You're getting authentication errors in local development.

**Solution**: Enable dev mode in `.env.local`:

```bash
NEXT_PUBLIC_USE_DEV_AUTH=true
```

Then restart the dev server:

```bash
pnpm dev
```

### "Invalid credentials" with test users

**Problem**: Test user credentials not working.

**Solution**: Verify dev mode is enabled:

```bash
# Check current environment
grep NEXT_PUBLIC_USE_DEV_AUTH .env.local

# Should show:
NEXT_PUBLIC_USE_DEV_AUTH=true
```

### Production deployment uses test users

**Problem**: Production site shows test users instead of real authentication.

**Solution**: This should NOT happen with v0.9.1+, but if it does:

1. Check production environment variables:

```bash
echo $NEXT_PUBLIC_USE_DEV_AUTH
# Should be empty or "false"
```

2. Rebuild with production config:

```bash
pnpm build
```

3. Verify build output doesn't include dev auth:

```bash
grep -r "FauxAuthService" .next/
# Should return no results
```

### Backend not running errors

**Problem**: "Cannot connect to auth service" errors.

**Solution**: Start the backend services:

```bash
cd .backend
nself start
```

Verify auth service is running:

```bash
nself status
# Look for "auth" service on port 4000
```

---

## Code Examples

### Detecting Auth Mode in Code

```typescript
// Check which auth mode is active
const isDevAuth = process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true'

if (isDevAuth) {
  console.warn('⚠️ Development authentication enabled')
} else {
  console.log('✅ Production authentication enabled')
}
```

### Switching Users (Dev Mode Only)

```typescript
import { useAuth } from '@/contexts/auth-context'

function DevTools() {
  const { switchUser, user } = useAuth()

  if (process.env.NEXT_PUBLIC_USE_DEV_AUTH !== 'true') {
    return null // Don't show in production
  }

  return (
    <div>
      <p>Current: {user?.email}</p>
      <button onClick={() => switchUser('admin@nself.org')}>
        Switch to Admin
      </button>
    </div>
  )
}
```

### Conditional Features

```typescript
// Feature only available with real auth
function EnterpriseFeature() {
  const isDevAuth = process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true'

  if (isDevAuth) {
    return (
      <div>
        ⚠️ This feature requires production authentication.
        Set NEXT_PUBLIC_USE_DEV_AUTH=false to test.
      </div>
    )
  }

  return <RealEnterpriseFeature />
}
```

---

## Rollback Instructions

If you need to temporarily rollback to dev auth as default (not recommended):

1. Edit `.env.example`:

```bash
NEXT_PUBLIC_USE_DEV_AUTH=true
```

2. Update `.claude/CLAUDE.md` documentation

3. Rebuild:

```bash
pnpm build
```

**Note**: This is not recommended for security reasons. Instead, use `.env.local` for local development only.

---

## Security Considerations

### ✅ DO

- Use production auth in all public environments
- Enable dev auth ONLY in local development
- Keep dev auth credentials out of version control
- Audit environment variables before deployment
- Use `.env.local` for local overrides (gitignored)

### ❌ DON'T

- Enable dev auth in production (CRITICAL SECURITY RISK)
- Commit `.env.local` to git
- Share dev auth credentials publicly
- Use test users for real data
- Skip environment variable validation in CI/CD

---

## Environment Variable Reference

| Variable                   | Default | Production   | Development   | Description       |
| -------------------------- | ------- | ------------ | ------------- | ----------------- |
| `NEXT_PUBLIC_USE_DEV_AUTH` | `false` | `false`      | `true`        | Enable test users |
| `NEXT_PUBLIC_ENV`          | -       | `production` | `development` | Environment name  |
| `NEXT_PUBLIC_AUTH_URL`     | -       | Required     | Optional      | Auth service URL  |

---

## Related Documentation

- [.claude/CLAUDE.md](../.claude/CLAUDE.md) - Main project documentation
- [docs/guides/setup/QUICK-START-PRODUCTION.md](guides/setup/QUICK-START-PRODUCTION.md) - Production deployment guide
- [src/services/auth/README.md](../src/services/auth/README.md) - Auth service documentation

---

## Questions?

**Q: Can I still use test users?**
A: Yes! Just set `NEXT_PUBLIC_USE_DEV_AUTH=true` in `.env.local`

**Q: Will my production deployment break?**
A: No! Production deployments should already have `NEXT_PUBLIC_USE_DEV_AUTH=false`

**Q: Do I need to update my code?**
A: No code changes required. Only environment variable updates for local development.

**Q: How do I test OAuth providers locally?**
A: Use production auth mode (default) and configure OAuth in `.backend/.env`

**Q: What if I forget to disable dev auth in production?**
A: With v0.9.1+, this is much less likely since dev auth is opt-in, not default.

---

## Version History

- **v0.9.1** (2026-02-05): Production auth now default, dev auth opt-in
- **v0.9.0** (2026-02-03): Dev auth was default
- **v0.8.0** (2026-02-01): Dual auth system introduced

---

**Status**: ✅ Complete
**Impact**: Medium (local development only)
**Action Required**: Update `.env.local` if using dev auth
