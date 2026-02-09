# Incident Response & Disaster Recovery - Quick Reference Card

**Print this page and keep it handy during incidents**

---

## 🚨 Incident Response (First 5 Minutes)

### 1. Declare Incident Priority

| Priority | Description | Response Time |
|----------|-------------|---------------|
| **P0** | Complete outage / Data loss | 15 minutes |
| **P1** | Major feature down | 30 minutes |
| **P2** | Degraded performance | 2 hours |
| **P3** | Minor issue | 1 business day |

### 2. Initial Actions

```bash
# Quick health check
cd /Users/admin/Sites/nself-chat
./scripts/ops/verify-system-health.sh

# Check what's down
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check logs for errors
cd .backend && nself logs --tail 100 | grep -i error
```

### 3. Assemble Team

- **P0/P1**: Create war room immediately
- **Slack**: #incident-response
- **Create ticket**: [Incident Tracking System]
- **Start timeline**: Document all actions

---

## 🔧 Common Recovery Commands

### Service Recovery (Ordered)

```bash
# Automated recovery (use this!)
./scripts/ops/start-services-ordered.sh

# Manual restart (if needed)
docker start nself-postgres   # Wait 30s
docker start nself-redis      # Wait 10s
docker start nself-minio      # Wait 15s
docker start nself-auth       # Wait 15s
docker start nself-hasura     # Wait 20s
```

### Health Verification

```bash
# Complete health check
./scripts/ops/verify-system-health.sh

# Data integrity check
./scripts/ops/verify-data-integrity.sh

# Quick service checks
docker exec nself-postgres pg_isready
docker exec nself-redis redis-cli ping
curl http://localhost:8080/healthz  # Hasura
curl http://localhost:4000/healthz  # Auth
```

### Database Recovery

```bash
# Stop dependent services first
docker stop nself-hasura nself-auth

# Restore from latest backup
./scripts/ops/restore-database.sh /backups/postgres/daily/latest.dump

# Verify and restart
./scripts/ops/verify-data-integrity.sh
./scripts/ops/start-services-ordered.sh
```

---

## 📊 RTO/RPO Targets

| Service | RTO | RPO | Recovery Method |
|---------|-----|-----|-----------------|
| PostgreSQL | 30 min | 5 min | Restore + WAL replay |
| Hasura | 15 min | 0 | Restart |
| Auth | 15 min | 5 min | Restart + DB restore if needed |
| Redis | 15 min | 15 min | Restart + RDB restore |

---

## 📞 Escalation

### Escalation Path

```
On-Call Engineer (0-15 min)
    ↓
Engineering Manager + Senior Engineer (30 min)
    ↓
CTO (1 hour) + CEO (customer comms)
    ↓
Security Team (if security incident)
    ↓
Legal/PR (if data breach)
```

### Emergency Contacts

- **On-Call**: [Phone/Pager]
- **Backup On-Call**: [Phone/Pager]
- **Engineering Manager**: [Phone]
- **CTO**: [Phone]

---

## 💬 Communication Templates

### Initial Alert (P0/P1)

```
🚨 [P0] Production Incident - [Brief Description]

Status: INVESTIGATING
Impact: [user-facing impact]
Services Affected: [list]

CURRENT SITUATION:
[What we know]

ACTIONS TAKEN:
- [timestamp] [action]

NEXT STEPS:
[What we're doing next]

Next Update: [time]
Incident Commander: [name]
```

### Status Update

```
📊 Update #[N] - [Brief Description]

Status: [INVESTIGATING|IDENTIFIED|MONITORING|RESOLVED]
Duration: [elapsed time]

UPDATE:
[New information]

CURRENT STATUS:
[Service status, recovery progress]

ETA: [updated estimate]
Next Update: [time]
```

### Resolution

```
✅ [RESOLVED] - [Brief Description]

Duration: [total time]
Impact: [summary]

RESOLUTION:
[What fixed it]

ROOT CAUSE:
[Brief explanation]

Post-mortem within 48 hours.
```

---

## 🎯 Recovery Scenarios

### Scenario 1: Database Down

```bash
# Check status
docker exec nself-postgres pg_isready

# If down, restart
docker restart nself-postgres

# If corrupted, restore
# See: docs/ops/DISASTER-RECOVERY-PROCEDURES.md
```

### Scenario 2: Hasura Down

```bash
# Check health
curl http://localhost:8080/healthz

# Restart
docker restart nself-hasura

# Verify DB connection
docker exec nself-hasura curl http://nself-postgres:5432
```

### Scenario 3: Auth Service Down

```bash
# Check health
curl http://localhost:4000/healthz

# Check dependencies
docker exec nself-auth curl http://nself-postgres:5432
docker exec nself-auth curl http://nself-redis:6379

# Restart
docker restart nself-auth
```

### Scenario 4: All Services Down

```bash
# Use automated recovery
./scripts/ops/start-services-ordered.sh

# Takes ~10-15 minutes
# Monitors health of each service
# Reports any failures
```

---

## 📝 Post-Incident Checklist

- [ ] Service restored and verified
- [ ] Status page updated (resolved)
- [ ] Customers notified
- [ ] Timeline documented
- [ ] Post-mortem scheduled (within 48 hours)
- [ ] Action items created
- [ ] Runbooks updated if needed

---

## 🔍 Troubleshooting Quick Tips

### Check Disk Space

```bash
df -h /
# If > 80%, clean up logs or expand disk
```

### Check Memory

```bash
free -h
docker stats --no-stream
# If exhausted, restart heavy services
```

### Check Logs

```bash
# All services
nself logs --since 10m

# Specific service
docker logs nself-postgres --tail 100
docker logs nself-hasura --tail 100 | grep ERROR
```

### Check Network

```bash
# Between containers
docker exec nself-hasura ping nself-postgres
docker exec nself-auth ping nself-redis

# From host
curl http://localhost:8080/healthz
curl http://localhost:4000/healthz
```

---

## 📚 Full Documentation

- **Incident Response**: `docs/ops/INCIDENT-RESPONSE-PLAYBOOK.md`
- **Disaster Recovery**: `docs/ops/DISASTER-RECOVERY-PROCEDURES.md`
- **Drill Scenarios**: `docs/ops/RECOVERY-DRILL-SCENARIOS.md`
- **RTO/RPO Details**: `docs/ops/RTO-RPO-TARGETS.md`

---

## 🧪 Monthly Drills

- **Week 1**: Database restore drill
- **Week 2**: Service recovery drill
- **Week 3**: PITR drill
- **Week 4**: Cascading failure drill

```bash
# Run a drill
export DRILL_MODE=test
./scripts/ops/run-recovery-drill.sh service-outage
```

---

**Keep calm and follow the runbooks! 🚀**

*Last Updated: February 9, 2026*
*Version: 1.0.0*
