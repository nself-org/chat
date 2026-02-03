# nChat v0.8.0 - Breaking Changes

**Version:** 0.8.0
**Release Date:** February 1, 2026

---

## Summary

**v0.8.0 contains NO breaking changes.**

This release is fully backward compatible with v0.7.0. All existing features, APIs, database schemas, and configurations remain unchanged.

---

## What This Means

### ✅ No Code Changes Required

Your existing nChat deployment will work without any modifications:

- **Web Application:** Continues to work exactly as before
- **API Endpoints:** All existing endpoints unchanged
- **Database Schema:** No schema migrations required
- **Configuration:** Existing config files compatible
- **User Data:** No data migrations needed
- **Third-Party Integrations:** All integrations work as-is

### ✅ Additive Only

v0.8.0 adds new platforms and features without modifying existing ones:

**New Platforms:**

- iOS app (new)
- Android app (new)
- Desktop apps (new)

**New Features:**

- Offline mode (optional)
- Background sync (optional)
- Mobile-specific APIs (new)

**All new features are optional and don't affect existing functionality.**

---

## Compatibility Matrix

| Component    | v0.7.0 | v0.8.0 | Compatible |
| ------------ | ------ | ------ | ---------- |
| Web App      | ✅     | ✅     | ✅ Yes     |
| API          | ✅     | ✅     | ✅ Yes     |
| Database     | ✅     | ✅     | ✅ Yes     |
| Config       | ✅     | ✅     | ✅ Yes     |
| Auth         | ✅     | ✅     | ✅ Yes     |
| Integrations | ✅     | ✅     | ✅ Yes     |
| iOS App      | ❌     | ✅     | N/A New    |
| Android App  | ❌     | ✅     | N/A New    |
| Desktop Apps | ❌     | ✅     | N/A New    |

---

## Upgrade Path

### Zero-Downtime Upgrade

Because there are no breaking changes, you can upgrade with zero downtime:

1. **Deploy v0.8.0 web app** (standard deployment)
2. **No database migrations** (schema unchanged)
3. **No config changes** (existing config works)
4. **No user data changes** (data format unchanged)

### Rollback Support

If you need to rollback for any reason:

1. **Redeploy v0.7.0 web app**
2. **No database rollback needed** (schema unchanged)
3. **No data cleanup needed** (no data changes)

**Note:** Mobile apps are independent. Rollback doesn't affect mobile users.

---

## Deprecated Features

**None.** No features have been deprecated in v0.8.0.

All v0.7.0 features remain fully supported:

- ✅ Web chat interface
- ✅ Channel management
- ✅ Direct messages
- ✅ File sharing
- ✅ Video/audio calls
- ✅ Search
- ✅ Integrations
- ✅ Admin dashboard
- ✅ User management
- ✅ All other v0.7.0 features

---

## Future Deprecations

**None planned for v0.9.0.**

We are committed to backward compatibility. Any future deprecations will:

1. Be announced at least 2 major versions in advance
2. Include migration guides
3. Maintain support during deprecation period
4. Provide automated migration tools where possible

---

## API Changes

### No Breaking API Changes

All v0.7.0 API endpoints work identically in v0.8.0:

```typescript
// v0.7.0 code works unchanged in v0.8.0
import { useMessages } from '@/hooks/use-messages'
import { useChannels } from '@/hooks/use-channels'

// All existing hooks, utilities, and components work as-is
```

### New APIs (Non-Breaking)

New optional APIs added in v0.8.0:

```typescript
// New mobile-specific APIs (optional)
import { offlineSync } from '@/lib/offline-sync'
import { pushNotifications } from '@/lib/push-notifications'
import { biometrics } from '@/lib/biometrics'

// Existing code doesn't need to use these
// They're available if you want mobile features
```

---

## Database Schema

### No Schema Changes

The database schema is identical to v0.7.0:

- Same tables
- Same columns
- Same indexes
- Same constraints
- Same relationships

### No Migrations Required

```bash
# No migrations needed
# This would normally run migrations:
pnpm db:migrate

# But there are none for v0.8.0
# Output: "No pending migrations"
```

---

## Configuration Changes

### No Breaking Config Changes

All v0.7.0 configuration works in v0.8.0:

```env
# v0.7.0 .env file works unchanged
NEXT_PUBLIC_GRAPHQL_URL=...
NEXT_PUBLIC_AUTH_URL=...
# ... all other v0.7.0 config
```

### New Optional Config

New optional environment variables for mobile features:

```env
# Optional: Firebase for mobile analytics
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Optional: Sentry for mobile crash reporting
NEXT_PUBLIC_SENTRY_DSN_IOS=...
NEXT_PUBLIC_SENTRY_DSN_ANDROID=...

# Optional: Capacitor app config
CAPACITOR_APP_ID=io.nself.chat
CAPACITOR_APP_NAME=nChat
```

**All are optional.** Apps work without them (mobile features disabled).

---

## Dependency Changes

### No Breaking Dependency Updates

All major dependencies remain at compatible versions:

- ✅ `next@^15.5.10` (same major version)
- ✅ `react@^19.0.0` (same major version)
- ✅ `@apollo/client@^3.14.0` (same major version)
- ✅ All other core dependencies unchanged

### New Dependencies (Additive)

New dependencies for mobile platforms:

```json
{
  "@capacitor/android": "^6.2.0",
  "@capacitor/ios": "^6.2.0",
  "@capacitor-firebase/analytics": "^6.1.0",
  "@sentry/capacitor": "^0.18.0",
  "@sentry/electron": "^4.19.0",
  "detox": "^20.29.3",
  "appium": "^2.15.2"
}
```

**These don't affect web app.** They're only used for mobile/desktop builds.

---

## Build Process

### No Build Changes for Web

Web build process unchanged:

```bash
# Same build commands as v0.7.0
pnpm build        # Works identically
pnpm start        # Works identically
pnpm deploy       # Works identically
```

### New Build Commands (Optional)

New optional build commands for mobile/desktop:

```bash
# Optional: Build mobile apps
pnpm ios:build
pnpm android:build

# Optional: Build desktop apps
pnpm electron:build

# These are additive, not required for web deployment
```

---

## Testing

### No Test Changes Required

All v0.7.0 tests work unchanged:

```bash
# Same test commands
pnpm test         # All tests pass
pnpm test:e2e     # All E2E tests pass
```

### New Tests (Additive)

New optional test suites for mobile:

```bash
# Optional: Mobile E2E tests
pnpm test:e2e:ios
pnpm test:e2e:android
```

---

## User Impact

### Zero User Impact for Web Users

Web users experience no breaking changes:

- ✅ Same UI
- ✅ Same features
- ✅ Same workflows
- ✅ Same performance
- ✅ No retraining needed

### New Options for Mobile Users

Mobile users get new options (opt-in):

- ✅ Download iOS app (optional)
- ✅ Download Android app (optional)
- ✅ Download desktop app (optional)
- ✅ Continue using web app (still fully supported)

---

## Migration Checklist

### Pre-Upgrade

- [ ] **Review release notes** (RELEASE-NOTES.md)
- [ ] **Review features** (FEATURES.md)
- [ ] **Backup database** (standard precaution)
- [ ] **Test in staging** (recommended)

### Upgrade

- [ ] **Deploy v0.8.0 web app** (standard deployment)
- [ ] **Verify web app** (smoke test)
- [ ] **Monitor logs** (check for errors)

### Post-Upgrade

- [ ] **Verify all features** (web app works)
- [ ] **Check analytics** (monitor usage)
- [ ] **Build mobile apps** (optional)
- [ ] **Distribute mobile apps** (optional)

### Rollback (If Needed)

- [ ] **Redeploy v0.7.0** (simple rollback)
- [ ] **No data cleanup** (no data changes)
- [ ] **Verify rollback** (web app works)

---

## Support

### Need Help?

If you encounter any issues:

1. **Check documentation:** [docs/releases/v0.8.0/](.)
2. **Review troubleshooting:** [TROUBLESHOOTING.md](../../troubleshooting/)
3. **GitHub Issues:** https://github.com/nself/nself-chat/issues
4. **Discord:** https://discord.gg/nchat
5. **Email:** support@nself.org

### Reporting Issues

If you believe you've found a breaking change:

1. **Verify:** Check if it's actually breaking (not just new feature)
2. **Search:** Check existing GitHub issues
3. **Report:** Create detailed issue with:
   - What broke
   - How to reproduce
   - Expected vs actual behavior
   - v0.7.0 vs v0.8.0 comparison

---

## Conclusion

**v0.8.0 is a safe, backward-compatible upgrade.**

- ✅ No breaking changes
- ✅ No code modifications required
- ✅ No database migrations
- ✅ No configuration changes
- ✅ Zero-downtime deployment
- ✅ Simple rollback if needed

**Upgrade with confidence!**

---

## Appendix: Change Summary

### What Changed

**Added:**

- iOS app (new platform)
- Android app (new platform)
- Desktop apps (new platforms)
- Offline mode (new feature)
- Background sync (new feature)
- Mobile APIs (new APIs)
- Mobile tests (new tests)
- Mobile docs (new documentation)

**Modified:**

- Nothing (all changes are additive)

**Removed:**

- Nothing (no features removed)

**Deprecated:**

- Nothing (no features deprecated)

### Version Compatibility

| Version | Compatible with v0.8.0     |
| ------- | -------------------------- |
| v0.7.0  | ✅ Yes (100%)              |
| v0.6.0  | ✅ Yes (via v0.7.0)        |
| v0.5.0  | ⚠️ Upgrade to v0.7.0 first |
| <v0.5.0 | ⚠️ Upgrade to v0.7.0 first |

**Recommendation:** If on v0.6.0 or earlier, upgrade to v0.7.0 first, then v0.8.0.

---

**Questions?** Contact support@nself.org
