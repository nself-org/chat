# RTO/RPO Targets and Measurements

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Review Cycle**: Quarterly

## Executive Summary

This document defines Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for all critical services, providing clear targets for disaster recovery and business continuity planning.

## Definitions

**RTO (Recovery Time Objective)**
- Maximum acceptable time to restore a service after failure
- Measured from incident detection to full service restoration
- Includes detection, assessment, recovery, and verification

**RPO (Recovery Point Objective)**
- Maximum acceptable data loss measured in time
- Determined by backup frequency and replication lag
- Represents the "age" of data that could be lost

**MTTR (Mean Time To Repair)**
- Average time to restore service across multiple incidents
- Key metric for trending and improvement

**MTTD (Mean Time To Detect)**
- Average time from failure occurrence to detection
- Critical for reducing overall RTO

**MTTI (Mean Time To Investigate)**
- Average time from detection to identifying root cause
- Affects overall recovery time

---

## Service-Level RTO/RPO Targets

### Critical Services (P0 Impact)

| Service | RTO | RPO | Justification | Business Impact if Down |
|---------|-----|-----|---------------|------------------------|
| **PostgreSQL** | 30 min | 5 min | Core data store | Complete service outage, no user access |
| **Hasura GraphQL** | 15 min | 0 (stateless) | API gateway | Complete service outage |
| **Auth Service** | 15 min | 5 min | User authentication | No logins, existing sessions may persist |
| **Nginx (Reverse Proxy)** | 10 min | 0 (stateless) | Request routing | Complete service outage |

### High Priority Services (P1 Impact)

| Service | RTO | RPO | Justification | Business Impact if Down |
|---------|-----|-----|---------------|------------------------|
| **Redis** | 15 min | 15 min | Session/cache | Session loss, performance degradation |
| **MinIO** | 1 hour | 1 hour | File storage | Media uploads/downloads unavailable |

### Medium Priority Services (P2 Impact)

| Service | RTO | RPO | Justification | Business Impact if Down |
|---------|-----|-----|---------------|------------------------|
| **MeiliSearch** | 2 hours | 1 day | Full-text search | Search unavailable, can use DB queries |
| **Functions** | 1 hour | 0 (stateless) | Serverless functions | Some automations unavailable |

### Monitoring Services (P3 Impact)

| Service | RTO | RPO | Justification | Business Impact if Down |
|---------|-----|-----|---------------|------------------------|
| **Prometheus** | 4 hours | 15 min | Metrics | Observability gap, no user impact |
| **Grafana** | 4 hours | 0 (stateless) | Dashboards | Reduced visibility |
| **Loki** | 4 hours | 15 min | Log aggregation | Debugging harder |

---

## Scenario-Based RTO/RPO

### Disaster Scenarios

| Scenario | Target RTO | Target RPO | Complexity | Priority |
|----------|------------|------------|------------|----------|
| Single service restart | 5 min | 0 | Low | P1 |
| Database restore from backup | 30 min | 5 min | Medium | P0 |
| Database PITR (corruption) | 60 min | <1 min | High | P0 |
| Complete system outage | 15 min | 0 | Medium | P0 |
| Cascading service failure | 20 min | 0 | Medium | P1 |
| Regional failover | 30 min | 15 min | High | P0 |
| Data center loss | 4 hours | 1 hour | Very High | P0 |

### Recovery Time Breakdown

For a typical database restore (30 min RTO):

```
Detection:           5 minutes  (16%)
Assessment:          5 minutes  (16%)
Backup Retrieval:    3 minutes  (10%)
Restore Execution:  12 minutes  (40%)
Verification:        5 minutes  (18%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:              30 minutes (100%)
```

Optimization opportunities:
- Faster detection (monitoring improvements)
- Automated assessment (runbooks)
- Parallel verification steps

---

## Current Performance (Q1 2026)

### Actual vs Target RTO

| Service | Target RTO | Actual RTO (Avg) | Status | Trend |
|---------|------------|------------------|--------|-------|
| PostgreSQL | 30 min | 27 min | ✅ Meeting | ⬇️ Improving |
| Hasura | 15 min | 12 min | ✅ Meeting | ⬇️ Improving |
| Auth | 15 min | 13 min | ✅ Meeting | ➡️ Stable |
| Redis | 15 min | 18 min | ⚠️ Slightly over | ⬆️ Needs attention |

### Actual vs Target RPO

| Service | Target RPO | Actual RPO (Avg) | Status | Backup Frequency |
|---------|------------|------------------|--------|------------------|
| PostgreSQL | 5 min | 3 min | ✅ Better than target | WAL every 60s + hourly snapshots |
| Auth | 5 min | 3 min | ✅ Better than target | Shared PostgreSQL backup |
| Redis | 15 min | 12 min | ✅ Meeting | RDB snapshots + AOF |
| MinIO | 1 hour | 45 min | ✅ Better than target | Continuous replication |

---

## RTO/RPO Improvement Roadmap

### Completed Improvements

- ✅ Implemented WAL archiving for PostgreSQL (reduced RPO from 1 hour to 5 minutes)
- ✅ Created automated recovery scripts (reduced RTO by 40%)
- ✅ Set up continuous replication for MinIO (reduced RPO from 24 hours to 1 hour)
- ✅ Implemented health check monitoring (reduced MTTD from 15 min to 2 min)

### In Progress (Q1 2026)

- 🔄 Database streaming replication to standby (target: RPO <1 min)
- 🔄 Geographic failover automation (target: RTO 15 min for regional failure)
- 🔄 Redis cluster for HA (target: eliminate single point of failure)

### Planned (Q2 2026)

- 📋 Multi-region active-active setup (target: RTO 5 min for regional failure)
- 📋 Automated failover testing (monthly drills)
- 📋 Predictive alerting using ML (target: MTTD <1 min)

### Future Considerations (Q3-Q4 2026)

- 💡 Real-time data replication across regions (target: RPO near-zero)
- 💡 Chaos engineering integration
- 💡 Self-healing infrastructure

---

## Backup Strategy and RPO

### Backup Frequency by Service

**PostgreSQL:**
```
WAL Archiving:       Every 60 seconds or 16MB
Hourly Snapshots:    Every hour (keep 24)
Daily Full Backups:  02:00 UTC (keep 30 days)
Weekly Backups:      Sunday 03:00 UTC (keep 12 weeks)
Monthly Backups:     1st of month (keep 12 months)

Effective RPO: 1-5 minutes (depending on WAL archive timing)
```

**Redis:**
```
RDB Snapshots:       900s if 1 key changed
                     300s if 10 keys changed
                     60s if 10000 keys changed
AOF Rewrite:         Automatic when size doubles
AOF Sync:            Every second

Effective RPO: 1-15 minutes
```

**MinIO:**
```
Versioning:          Enabled (30 versions retained)
Replication:         Real-time to secondary instance
Snapshot:            Daily to S3

Effective RPO: 0-1 hour (depends on replication lag)
```

**MeiliSearch:**
```
Index Snapshots:     Before major changes (manual)
Database Rebuild:    Can rebuild from PostgreSQL
Retention:           Last 5 snapshots

Effective RPO: 1-7 days (acceptable for search index)
```

---

## Cost vs RTO/RPO Analysis

### Infrastructure Costs by RPO Target

| RPO Target | Infrastructure | Annual Cost | Notes |
|------------|---------------|-------------|-------|
| **1 hour** | Single instance + daily backups | $X | Minimum viable |
| **5 minutes** | WAL archiving + hot standby | $X | Current setup |
| **1 minute** | Streaming replication | $X | Recommended |
| **Near-zero** | Multi-region active-active | $X | Enterprise |

### RTO Optimization ROI

Reducing RTO from 60 min to 15 min:
- Infrastructure cost: +$X/month
- Expected downtime reduction: 75%
- Annual downtime cost savings: $X
- Break-even: Y months

---

## Monitoring and Alerting

### RTO/RPO Monitoring

**Metrics Tracked:**
- Backup success/failure rates
- Backup completion times
- Replication lag
- Recovery drill RTO/RPO results
- Actual incident RTO/RPO

**Alerts Configured:**
- Backup failure (P1)
- Replication lag > 5 minutes (P2)
- WAL archive delay > 10 minutes (P2)
- Disk space < 20% (P1)

### SLA Dashboard

Real-time dashboard showing:
- Current RTO/RPO status
- Last successful backup
- Replication lag
- Backup storage usage
- Recovery drill history

---

## Compliance Requirements

### Industry Standards

**GDPR (Data Protection):**
- RPO: Must minimize data loss
- RTO: Reasonable timeframes to restore access
- Our targets: Exceed minimum requirements

**HIPAA (Healthcare):**
- Required: Documented disaster recovery plan
- Required: Regular testing (annual minimum)
- Our practice: Monthly drills

**SOC 2:**
- Required: Defined RTO/RPO
- Required: Backup verification
- Required: Incident response procedures
- Our status: Compliant

### Audit Trail

All disaster recovery activities must be:
- Documented with timestamps
- Reviewed in post-mortems
- Tracked in incident system
- Reported to management quarterly

---

## Testing and Validation

### Monthly Drill Schedule

**Week 1: Database Restore Drill**
- Target: Meet 30 min RTO
- Validates: Backup restore process
- Verifies: Data integrity

**Week 2: Service Recovery Drill**
- Target: Meet 15 min RTO
- Validates: Service startup order
- Verifies: Health checks

**Week 3: PITR Drill**
- Target: Meet 60 min RTO, <1 min RPO
- Validates: Point-in-time recovery
- Verifies: WAL replay

**Week 4: Cascading Failure Drill**
- Target: Meet 20 min RTO
- Validates: Root cause identification
- Verifies: Dependency handling

### Quarterly Full DR Test

Once per quarter:
- Test regional failover
- Validate all documentation
- Update contact lists
- Review and update RTO/RPO targets

---

## Continuous Improvement

### Quarterly Review Process

1. **Analyze Metrics**
   - Actual RTO/RPO vs targets
   - Drill performance trends
   - Incident response times

2. **Identify Gaps**
   - Services missing targets
   - Process bottlenecks
   - Documentation issues

3. **Update Targets**
   - Adjust based on business needs
   - Factor in new services
   - Balance cost vs benefit

4. **Implement Improvements**
   - Automate manual steps
   - Optimize slow processes
   - Update tooling

### Success Metrics

**Leading Indicators (Predictive):**
- Backup success rate: >99.5%
- Drill pass rate: 100%
- Replication lag: <1 min average
- MTTD: <2 minutes

**Lagging Indicators (Historical):**
- Actual RTO vs target: Within 10%
- Actual RPO vs target: Within target
- Unplanned downtime: <4 hours/year
- Data loss incidents: 0/year

---

## Appendix

### RTO/RPO Calculator

Use this formula to determine if RTO/RPO targets are met:

```
RTO_MET = (Actual_RTO <= Target_RTO)
RPO_MET = (Actual_RPO <= Target_RPO)

Overall_Success = RTO_MET AND RPO_MET
```

### Cost of Downtime

Estimated business impact per hour of downtime:
- Complete outage: $X/hour (all users affected)
- Degraded performance: $Y/hour (partial functionality)
- Single service: $Z/hour (depends on service)

These estimates inform RTO target setting.

### Contact Information

**RTO/RPO Targets Owner**: Operations Team
**Review Board**: CTO, VP Engineering, Operations Manager
**Emergency Contact**: [phone/email]

---

**Related Documents:**
- [Incident Response Playbook](./INCIDENT-RESPONSE-PLAYBOOK.md)
- [Disaster Recovery Procedures](./DISASTER-RECOVERY-PROCEDURES.md)
- [Recovery Drill Scenarios](./RECOVERY-DRILL-SCENARIOS.md)
- [Backup Configuration](./BACKUP-CONFIGURATION.md)
