# Incident Response Playbook

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Owner**: Operations Team
**Review Cycle**: Quarterly

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Response Procedures](#response-procedures)
3. [Communication Templates](#communication-templates)
4. [Escalation Paths](#escalation-paths)
5. [Post-Mortem Process](#post-mortem-process)

---

## Incident Classification

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0** | Critical - Complete service outage | 15 minutes | Total system down, data loss |
| **P1** | High - Major functionality unavailable | 30 minutes | Auth service down, messages not sending |
| **P2** | Medium - Degraded performance | 2 hours | Slow queries, intermittent errors |
| **P3** | Low - Minor issues | 1 business day | UI glitches, non-critical features |
| **P4** | Info - Monitoring alerts | Best effort | Resource usage warnings |

### Impact Assessment Matrix

```
IMPACT x URGENCY = PRIORITY

High Impact + High Urgency = P0
High Impact + Low Urgency = P1
Low Impact + High Urgency = P1
Low Impact + Low Urgency = P2/P3
```

### Detection Methods

1. **Automated Monitoring**
   - Sentry error rate alerts
   - Grafana threshold violations
   - Health check failures
   - Resource exhaustion warnings

2. **User Reports**
   - Support tickets
   - Social media mentions
   - Direct customer contact
   - Status page comments

3. **Internal Discovery**
   - Team member observation
   - Routine maintenance checks
   - Security scans
   - Performance testing

---

## Response Procedures

### P0: Critical Incident Response

**Objective**: Restore service within 1 hour (RTO)

#### Initial Response (0-15 minutes)

```bash
# 1. ACKNOWLEDGE THE INCIDENT
# Log into incident tracking system
# Create incident ticket with P0 tag

# 2. ASSEMBLE WAR ROOM
# Slack: #incident-response
# Zoom: incidents.zoom.us/warroom
# Google Doc: Incident Log Template

# 3. QUICK HEALTH CHECK
cd /Users/admin/Sites/nself-chat/.backend
nself status

# Check all critical services
docker ps --filter "label=nself.service=critical"

# Check disk space
df -h

# Check memory
free -h

# Check database connectivity
docker exec nself-postgres pg_isready

# Check Hasura
curl -f http://localhost:8080/healthz || echo "HASURA DOWN"

# Check Auth
curl -f http://localhost:4000/healthz || echo "AUTH DOWN"
```

#### Triage Phase (15-30 minutes)

```bash
# 1. IDENTIFY FAILING COMPONENT
# Check service logs
nself logs postgres --tail 100
nself logs hasura --tail 100
nself logs auth --tail 100

# Check Sentry for errors
# https://sentry.io/organizations/[org]/issues/

# Check Grafana dashboards
# http://localhost:3000/d/system-overview

# 2. ISOLATE THE PROBLEM
# Is it a single service or cascading failure?
# Is data at risk?
# Can we fail over to backup?

# 3. ESTIMATE RECOVERY TIME
# Quick fix available? < 30 min
# Requires restore? 1-2 hours
# Requires rebuild? 2-4 hours
```

#### Recovery Actions

**Scenario 1: Database Failure**
```bash
# Stop all services writing to DB
docker stop nself-hasura nself-auth

# Assess corruption
docker exec nself-postgres psql -U postgres -c "SELECT 1"

# If corrupted, initiate restore
# See: DISASTER-RECOVERY-PROCEDURES.md

# If successful, restart services
docker start nself-hasura nself-auth

# Verify writes working
docker exec nself-postgres psql -U postgres -d nself_db -c \
  "INSERT INTO health_check (timestamp) VALUES (NOW())"
```

**Scenario 2: Service Crash Loop**
```bash
# Identify crashing service
docker ps -a | grep Restarting

# Get crash logs
docker logs [container-id] --tail 200

# Check resource limits
docker stats --no-stream

# Try safe restart with increased limits
docker update --memory 4g --cpus 2 [container-id]
docker restart [container-id]

# If still failing, rollback to last known good
# See: DISASTER-RECOVERY-PROCEDURES.md
```

**Scenario 3: Network Partition**
```bash
# Check connectivity between services
docker network inspect nself_default

# Test DNS resolution
docker exec nself-hasura ping nself-postgres

# Check firewall rules
sudo iptables -L -n

# Recreate network if needed
docker network rm nself_default
docker network create nself_default
# Restart services to reconnect
```

#### Communication (Ongoing)

```bash
# Update status page every 15 minutes
# Template: "We are investigating reports of [issue].
#           Current impact: [description].
#           Next update: [time]"

# Internal updates every 10 minutes in war room
# Use: INCIDENT-STATUS-TEMPLATE.md
```

#### Resolution & Verification

```bash
# 1. VERIFY ALL SERVICES HEALTHY
./scripts/ops/verify-system-health.sh

# 2. RUN SMOKE TESTS
pnpm test:e2e:smoke

# 3. CHECK DATA INTEGRITY
./scripts/ops/verify-data-integrity.sh

# 4. MONITOR FOR 30 MINUTES
# Watch error rates, response times, resource usage

# 5. DECLARE RESOLUTION
# Update status page
# Send all-clear to stakeholders
# Schedule post-mortem
```

### P1: High Priority Response

**Objective**: Restore functionality within 4 hours

#### Response Pattern

1. **Assessment** (0-30 min): Understand scope and impact
2. **Containment** (30-60 min): Prevent escalation
3. **Resolution** (60-240 min): Fix root cause
4. **Verification** (ongoing): Confirm restoration

#### Common P1 Scenarios

**Auth Service Unavailable**
```bash
# Check auth container
docker logs nself-auth --tail 100

# Common fix: JWT secret misconfiguration
docker exec nself-auth env | grep JWT

# Restart auth service
docker restart nself-auth

# Verify login working
curl -X POST http://localhost:4000/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Messages Not Sending**
```bash
# Check GraphQL engine
curl http://localhost:8080/healthz

# Check database connection pool
docker exec nself-postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"

# Check message queue if applicable
docker logs nself-redis --tail 50

# Test message insert directly
docker exec nself-postgres psql -U postgres -d nself_db -c \
  "INSERT INTO nchat_messages (content, user_id, channel_id)
   VALUES ('test', '123', '456') RETURNING id"
```

### P2: Medium Priority Response

**Objective**: Resolve within 1 business day

- Performance degradation (>500ms p95 latency)
- Intermittent errors (<5% error rate)
- Non-critical feature outages

**Response**: Standard troubleshooting during business hours

### P3-P4: Low Priority Response

**Objective**: Schedule for next maintenance window

- Cosmetic issues
- Feature requests
- Performance optimization opportunities

---

## Communication Templates

### Initial Incident Report (P0/P1)

```
Subject: [P0/P1] Production Incident - [Brief Description]

Status: INVESTIGATING
Start Time: [timestamp]
Impact: [user-facing impact]
Services Affected: [list]

CURRENT SITUATION:
[What we know]

ACTIONS TAKEN:
- [timestamp] [action]
- [timestamp] [action]

NEXT STEPS:
[What we're doing next]

ESTIMATED RESOLUTION: [time or "unknown"]

Next Update: [time]

Incident Commander: [name]
War Room: [link]
```

### Update Template

```
Subject: [P0/P1] Update #[N] - [Brief Description]

Status: [INVESTIGATING|IDENTIFIED|MONITORING|RESOLVED]
Duration: [elapsed time]
Last Updated: [timestamp]

UPDATE:
[New information since last update]

ACTIONS TAKEN:
- [new actions]

CURRENT STATUS:
[Service status, recovery progress]

NEXT STEPS:
[What's happening next]

ESTIMATED RESOLUTION: [updated estimate]

Next Update: [time] or when significant change occurs
```

### Resolution Announcement

```
Subject: [RESOLVED] [P0/P1] - [Brief Description]

Status: RESOLVED
Start Time: [timestamp]
End Time: [timestamp]
Total Duration: [duration]
Impact: [summary]

RESOLUTION:
[What fixed the issue]

ROOT CAUSE:
[Brief explanation - detailed post-mortem to follow]

PREVENTIVE MEASURES:
[What we're doing to prevent recurrence]

We apologize for the disruption. A detailed post-mortem will be
published within 48 hours.

Questions? Contact: [support email]
```

### Internal War Room Updates

```
[HH:MM] [NAME]: Current status check
  - Service A: [status]
  - Service B: [status]
  - Root cause: [hypothesis]
  - Current action: [what's being done]
  - Blockers: [any blockers]
  - ETA: [estimate]
```

---

## Escalation Paths

### Escalation Matrix

```
P0 Incident Detected
    ↓
On-Call Engineer (0-15 min)
    ↓ (if not resolved in 30 min)
Senior Engineer + Engineering Manager
    ↓ (if not resolved in 1 hour)
CTO + CEO (for customer communication)
    ↓ (if data breach or security)
Legal + PR Team
```

### Contact List (Role-Based)

```yaml
on-call-engineer:
  primary: [contact info]
  backup: [contact info]
  escalation_time: 15 minutes

engineering-manager:
  contact: [info]
  escalation_time: 30 minutes

senior-engineer:
  contact: [info]
  availability: 24/7 for P0

cto:
  contact: [info]
  notify_for: P0, Security incidents

ceo:
  contact: [info]
  notify_for: P0 > 1 hour, Data breach

security-team:
  contact: [info]
  notify_for: Any security incident

legal:
  contact: [info]
  notify_for: Data breach, Compliance violation
```

### When to Escalate

**Immediate Escalation to CTO:**
- Data loss or corruption
- Security breach detected
- Estimated downtime > 4 hours
- Customer data exposed

**Immediate Escalation to CEO:**
- Media attention
- Major customer impact (>1000 users)
- Legal/compliance implications
- Potential PR crisis

---

## Post-Mortem Process

### Timeline

- **0-24 hours**: Initial data collection
- **24-48 hours**: Draft post-mortem
- **48-72 hours**: Review and finalize
- **1 week**: Present to team
- **2 weeks**: Complete action items

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date**: [incident date]
**Authors**: [names]
**Status**: [Draft|Review|Final]
**Severity**: [P0|P1|P2]

## Executive Summary

[2-3 sentence overview]

## Impact

- **Duration**: [total time]
- **Users Affected**: [number/percentage]
- **Services Affected**: [list]
- **Revenue Impact**: [$amount or N/A]
- **Data Loss**: [description or "none"]

## Timeline (UTC)

| Time | Event |
|------|-------|
| HH:MM | [first symptom detected] |
| HH:MM | [incident declared] |
| HH:MM | [action taken] |
| HH:MM | [service restored] |
| HH:MM | [incident resolved] |

## Root Cause

[Detailed technical explanation]

### Contributing Factors

1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

## Resolution

[How we fixed it]

## What Went Well

- ✅ [positive aspect]
- ✅ [positive aspect]

## What Went Poorly

- ❌ [negative aspect]
- ❌ [negative aspect]

## Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| [Action 1] | [name] | [date] | [Open/Done] |
| [Action 2] | [name] | [date] | [Open/Done] |

## Lessons Learned

1. [Lesson 1]
2. [Lesson 2]

## Prevention

[How we'll prevent this in the future]

## Appendix

- Logs: [link]
- Metrics: [link]
- War Room Notes: [link]
```

### Blameless Culture

**Key Principles:**

1. **Focus on Systems, Not People**
   - "The system failed to prevent..." not "Person X caused..."

2. **Assume Good Intent**
   - Everyone was doing their best with available information

3. **Learn and Improve**
   - Every incident is a learning opportunity

4. **Psychological Safety**
   - Encourage honest reporting
   - No punishment for mistakes
   - Reward transparency

### Post-Mortem Meeting Agenda

1. **Review Timeline** (10 min)
2. **Discuss Root Cause** (15 min)
3. **Identify Contributing Factors** (10 min)
4. **Brainstorm Action Items** (15 min)
5. **Assign Owners and Deadlines** (5 min)
6. **Document Lessons Learned** (5 min)

---

## Incident Metrics

### Track for Each Incident

- **MTTD** (Mean Time To Detect): Detection → Acknowledgment
- **MTTA** (Mean Time To Acknowledge): Alert → Response
- **MTTI** (Mean Time To Investigate): Acknowledgment → Root Cause
- **MTTR** (Mean Time To Repair): Detection → Resolution
- **MTTF** (Mean Time To Fix): Issue Identified → Fix Deployed

### Monthly Reporting

```
INCIDENT SUMMARY - [Month Year]

Total Incidents: [number]
  - P0: [count] (target: 0)
  - P1: [count] (target: <2)
  - P2: [count] (target: <5)
  - P3: [count]

Average MTTR by Priority:
  - P0: [time] (target: <1 hour)
  - P1: [time] (target: <4 hours)
  - P2: [time] (target: <1 day)

Top Causes:
  1. [cause] - [count]
  2. [cause] - [count]
  3. [cause] - [count]

Action Items Completed: [x/y] ([%])

Trending: [up/down/stable]
```

---

## Tools and Resources

### Essential Links

- **Status Page**: status.example.com
- **Sentry**: sentry.io/organizations/[org]
- **Grafana**: grafana.example.com
- **PagerDuty**: (if applicable)
- **War Room**: zoom.us/j/warroom
- **Runbook**: DISASTER-RECOVERY-PROCEDURES.md

### Quick Commands Reference

```bash
# Service health check
nself status

# View all logs
nself logs --follow

# Database backup
./scripts/ops/backup-database.sh

# Restore from backup
./scripts/ops/restore-database.sh [backup-file]

# Check resource usage
docker stats --no-stream

# View recent errors
docker logs nself-hasura --since 10m 2>&1 | grep ERROR
```

---

## Appendix

### Incident Classification Flowchart

```
Is the entire system down?
    YES → P0
    NO ↓

Is critical functionality unavailable?
    YES → P1
    NO ↓

Is performance significantly degraded?
    YES → P2
    NO ↓

Is a non-critical feature affected?
    YES → P3
    NO ↓

Is it just a warning or informational?
    YES → P4
```

### Communication Checklist

For each incident:

- [ ] Create incident ticket
- [ ] Post initial status update
- [ ] Notify on-call engineer
- [ ] Create war room
- [ ] Update status page
- [ ] Send customer notification (P0/P1)
- [ ] Post updates every 15 min (P0) or 30 min (P1)
- [ ] Declare resolution
- [ ] Send resolution notification
- [ ] Schedule post-mortem
- [ ] Complete post-mortem within 48 hours
- [ ] Track action items to completion

---

**Related Documents:**
- [Disaster Recovery Procedures](./DISASTER-RECOVERY-PROCEDURES.md)
- [Recovery Drill Scenarios](./RECOVERY-DRILL-SCENARIOS.md)
- [Operations Runbook](./OPERATIONS-RUNBOOK.md)
