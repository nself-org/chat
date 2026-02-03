# nChat v0.8.0 - Migration Guide

**Version:** 0.8.0
**Release Date:** February 1, 2026

---

## Summary

**No database migrations are required for v0.8.0.**

This release maintains 100% database compatibility with v0.7.0. The schema remains unchanged, and no data migrations are needed.

---

## Database Schema

### Schema Status

| Component   | v0.7.0         | v0.8.0         | Changes |
| ----------- | -------------- | -------------- | ------- |
| Tables      | 42 tables      | 42 tables      | None    |
| Columns     | 287 columns    | 287 columns    | None    |
| Indexes     | 93 indexes     | 93 indexes     | None    |
| Constraints | 64 constraints | 64 constraints | None    |
| Functions   | 12 functions   | 12 functions   | None    |
| Triggers    | 8 triggers     | 8 triggers     | None    |
| Views       | 5 views        | 5 views        | None    |

**Conclusion:** Database schema is identical.

---

## Migration Steps

### Step 1: Verify Database Version

```bash
# Connect to database
psql -h localhost -U postgres -d nchat

# Check schema version
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1;

# Expected output: Latest migration from v0.7.0
# Example: 20250115_add_ai_features
```

### Step 2: Backup Database (Recommended)

Even though no migrations are needed, always backup before major upgrades:

```bash
# Full database backup
pg_dump -h localhost -U postgres -d nchat > backup-$(date +%Y%m%d).sql

# Compressed backup
pg_dump -h localhost -U postgres -d nchat | gzip > backup-$(date +%Y%m%d).sql.gz

# Custom format (for faster restore)
pg_dump -h localhost -U postgres -d nchat -Fc > backup-$(date +%Y%m%d).dump
```

### Step 3: Run Migration Check

```bash
# Check for pending migrations
cd .backend
nself db migrate status

# Expected output: "No pending migrations"
```

### Step 4: Verify Database Health

```bash
# Run database health check
nself db doctor

# Or manually verify
psql -h localhost -U postgres -d nchat

# Check all tables exist
\dt nchat_*

# Check table counts
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Data Compatibility

### Existing Data

All existing data remains fully compatible:

- ✅ **Users:** All user data unchanged
- ✅ **Messages:** All messages unchanged
- ✅ **Channels:** All channels unchanged
- ✅ **Files:** All file references unchanged
- ✅ **Settings:** All settings unchanged
- ✅ **Permissions:** All permissions unchanged

### New Data

v0.8.0 doesn't add any new database tables or columns. Mobile-specific data is stored in:

1. **Client-side:** IndexedDB for offline cache
2. **Third-party:** Firebase for analytics
3. **Third-party:** Sentry for crash reports

**None of this data is stored in your PostgreSQL database.**

---

## Configuration Changes

### No Configuration Migration

Your existing `AppConfig` remains fully compatible:

```typescript
// v0.7.0 config works unchanged in v0.8.0
interface AppConfig {
  setup: { ... }
  owner: { ... }
  branding: { ... }
  theme: { ... }
  features: { ... }
  integrations: { ... }
  // ... all other v0.7.0 fields
}
```

### Optional New Config Fields

If you want to enable mobile features, you can optionally add:

```typescript
interface AppConfig {
  // ... existing v0.7.0 fields ...

  // Optional: Mobile-specific config
  mobile?: {
    offlineCache: {
      enabled: boolean
      maxMessages: number // default: 1000
      maxMediaSize: number // default: 500 MB
    }
    backgroundSync: {
      enabled: boolean
      interval: number // minutes
    }
    analytics: {
      enabled: boolean
      firebaseConfig: {
        apiKey: string
        projectId: string
        // ...
      }
    }
  }
}
```

**These are completely optional.** Apps work without them.

---

## File Storage Migration

### No File Migration Needed

File storage remains unchanged:

- **Storage backend:** Same (local, S3, MinIO, etc.)
- **File paths:** Same
- **File metadata:** Same
- **Access control:** Same

### Mobile File Handling

Mobile apps handle files transparently:

1. **Upload:** Mobile apps upload files to same backend as web
2. **Download:** Mobile apps download from same URLs
3. **Cache:** Mobile apps cache files locally (optional)
4. **Sync:** Mobile apps sync with same storage backend

**No migration or data duplication.**

---

## User Data Migration

### No User Data Migration

User data structure remains identical:

```sql
-- Same user table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'nchat_users'
ORDER BY ordinal_position;

-- Output: Identical to v0.7.0
```

### Mobile User Sessions

Mobile users authenticate the same way:

1. **Login:** Same authentication flow
2. **Tokens:** Same JWT tokens
3. **Permissions:** Same RBAC system
4. **Sessions:** Same session management

**No changes to user authentication or authorization.**

---

## API Migration

### No API Migration

All API endpoints remain unchanged:

```typescript
// v0.7.0 API calls work identically in v0.8.0

// GraphQL queries
query GetMessages($channelId: ID!) {
  messages(channelId: $channelId) {
    id
    text
    user { id name }
  }
}

// REST endpoints
GET /api/channels
POST /api/messages
PUT /api/users/:id
DELETE /api/messages/:id

// All work identically
```

### New Mobile APIs (Optional)

New APIs added for mobile features:

```typescript
// Optional: Offline sync API
POST / api / sync / queue
GET / api / sync / status

// Optional: Push notification registration
POST / api / push / register
DELETE / api / push / unregister

// These are additive, not required
```

---

## Rollback Procedure

### Rollback to v0.7.0

If you need to rollback, it's simple (no database changes):

```bash
# 1. No database rollback needed
# (Schema unchanged, so no schema rollback)

# 2. Redeploy v0.7.0 application
git checkout v0.7.0
pnpm install
pnpm build
pnpm deploy

# 3. Verify rollback
curl https://your-domain.com/api/health
# Expected: {"status":"ok","version":"0.7.0"}

# 4. No data cleanup needed
# (No v0.8.0-specific data in database)
```

### Rollback Mobile Apps

Mobile apps are independent:

1. **iOS:** Remove from App Store (or don't publish)
2. **Android:** Remove from Play Store (or don't publish)
3. **Desktop:** Remove from download links

**Users on web continue working normally.**

---

## Testing

### Pre-Migration Testing

Test in staging before production:

```bash
# 1. Clone production database to staging
pg_dump -h prod-db -U postgres -d nchat | \
  psql -h staging-db -U postgres -d nchat

# 2. Deploy v0.8.0 to staging
git checkout v0.8.0
pnpm install
pnpm build
# Deploy to staging environment

# 3. Run integration tests
pnpm test:e2e

# 4. Verify all features work
# - Login
# - Send messages
# - Upload files
# - Search
# - Admin functions

# 5. Check database health
psql -h staging-db -U postgres -d nchat
SELECT COUNT(*) FROM nchat_messages;
SELECT COUNT(*) FROM nchat_channels;
SELECT COUNT(*) FROM nchat_users;

# 6. Verify data integrity
# - Check message counts match
# - Check user counts match
# - Check no data corruption
```

### Post-Migration Testing

After production upgrade:

```bash
# 1. Verify database health
psql -h prod-db -U postgres -d nchat
SELECT COUNT(*) FROM nchat_messages;
# Compare to pre-upgrade count

# 2. Run smoke tests
curl https://your-domain.com/api/health
curl https://your-domain.com/api/channels

# 3. Test critical workflows
# - User login
# - Send message
# - Upload file
# - Search messages

# 4. Monitor logs
tail -f /var/log/nchat/application.log
# Or Docker logs, K8s logs, etc.

# 5. Check error rates
# - Application logs
# - Database logs
# - Sentry errors (if configured)
```

---

## Monitoring

### What to Monitor

After migration, monitor:

1. **Application Health**
   - Response times
   - Error rates
   - Resource usage (CPU, memory)

2. **Database Health**
   - Query performance
   - Connection pool usage
   - Disk usage
   - Index usage

3. **User Experience**
   - Page load times
   - API response times
   - Error messages
   - User complaints

4. **Mobile Apps** (if deployed)
   - Crash rates
   - ANR (Android Not Responding)
   - Memory usage
   - Battery usage

### Monitoring Queries

```sql
-- Check database size
SELECT
  pg_size_pretty(pg_database_size('nchat')) as database_size;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check active connections
SELECT
  COUNT(*) as connection_count,
  state
FROM pg_stat_activity
WHERE datname = 'nchat'
GROUP BY state;
```

---

## Troubleshooting

### Issue: Database Connection Errors

**Symptom:** Application can't connect to database after upgrade

**Solution:**

```bash
# Check database is running
pg_isready -h localhost -U postgres

# Check connection from app
psql -h localhost -U postgres -d nchat

# Verify connection string in .env
cat .env | grep DATABASE_URL
```

### Issue: Missing Data

**Symptom:** Data appears to be missing after upgrade

**Solution:**

```sql
-- Verify data exists
SELECT COUNT(*) FROM nchat_messages;
SELECT COUNT(*) FROM nchat_users;
SELECT COUNT(*) FROM nchat_channels;

-- Check for soft-deleted records
SELECT COUNT(*) FROM nchat_messages WHERE deleted_at IS NOT NULL;

-- Restore from backup if needed
psql -h localhost -U postgres -d nchat < backup-20260201.sql
```

### Issue: Performance Degradation

**Symptom:** Database queries are slow after upgrade

**Solution:**

```sql
-- Analyze tables
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;

-- Rebuild indexes
REINDEX DATABASE nchat;

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY n_distinct DESC;
```

---

## Migration Checklist

Use this checklist for your migration:

### Pre-Migration

- [ ] Read migration guide (this document)
- [ ] Verify no schema changes needed
- [ ] Backup production database
- [ ] Test in staging environment
- [ ] Document rollback procedure
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team about upgrade

### Migration

- [ ] Put application in maintenance mode (optional)
- [ ] Run migration check (`nself db migrate status`)
- [ ] Verify no pending migrations
- [ ] Deploy v0.8.0 application
- [ ] Verify application starts successfully
- [ ] Remove maintenance mode (if used)

### Post-Migration

- [ ] Verify database health
- [ ] Run smoke tests
- [ ] Test critical workflows
- [ ] Monitor logs for errors
- [ ] Check performance metrics
- [ ] Verify data integrity
- [ ] Notify team of successful upgrade

### Rollback (If Needed)

- [ ] Put in maintenance mode
- [ ] Redeploy v0.7.0 application
- [ ] Verify rollback successful
- [ ] Remove maintenance mode
- [ ] Document issues encountered
- [ ] Contact support if needed

---

## FAQ

### Q: Do I need to run any database migrations?

**A:** No. v0.8.0 has zero database migrations. The schema is identical to v0.7.0.

### Q: Will my existing data be affected?

**A:** No. All existing data remains unchanged and fully compatible.

### Q: How long does the migration take?

**A:** There is no database migration, so it takes 0 seconds. Application deployment takes 5-10 minutes.

### Q: Can I rollback if something goes wrong?

**A:** Yes, easily. Just redeploy v0.7.0. No database rollback needed.

### Q: Do I need downtime for the migration?

**A:** No. Zero-downtime deployment is possible since there are no database changes.

### Q: What about mobile user data?

**A:** Mobile apps use the same database as web. No separate data migration needed.

### Q: How do I migrate offline cache data?

**A:** There's nothing to migrate. Offline cache is new in v0.8.0. It populates automatically.

### Q: Do I need to update my backup scripts?

**A:** No. Same database, same backup procedures.

### Q: What if I'm on v0.6.0 or earlier?

**A:** Upgrade to v0.7.0 first, then to v0.8.0. See v0.7.0 migration guide for schema changes.

### Q: Are there any performance implications?

**A:** No. Database performance is identical to v0.7.0.

---

## Support

Need help with migration?

- **Documentation:** https://docs.nchat.io
- **GitHub Issues:** https://github.com/nself/nself-chat/issues
- **Discord:** https://discord.gg/nchat
- **Email:** support@nself.org
- **Slack:** #nself-chat (for enterprise customers)

---

## Summary

**v0.8.0 Migration Summary:**

✅ **No database migrations required**
✅ **No schema changes**
✅ **No data changes**
✅ **No configuration migrations**
✅ **No file storage changes**
✅ **Zero-downtime deployment possible**
✅ **Simple rollback procedure**
✅ **100% backward compatible**

**This is the easiest migration ever!** 🎉

---

**Questions?** Contact support@nself.org
