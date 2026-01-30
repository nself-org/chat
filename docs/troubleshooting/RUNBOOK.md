# nself-chat Operations Runbook

Operational procedures and troubleshooting guide for production nself-chat deployment.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Common Operations](#common-operations)
3. [Incident Response](#incident-response)
4. [Troubleshooting](#troubleshooting)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Performance Tuning](#performance-tuning)
7. [Security Procedures](#security-procedures)
8. [Disaster Recovery](#disaster-recovery)

---

## Quick Reference

### Essential Commands

```bash
# Check application status
kubectl get pods -n nself-chat
kubectl logs -f deployment/nself-chat -n nself-chat

# Scale application
kubectl scale deployment/nself-chat --replicas=5 -n nself-chat

# Restart deployment
kubectl rollout restart deployment/nself-chat -n nself-chat

# Check database
kubectl exec -it postgres-0 -n nself-chat -- psql -U nchat_user -d nchat

# Check Redis
kubectl exec -it deployment/redis -n nself-chat -- redis-cli -a $REDIS_PASSWORD ping

# View metrics
kubectl top pods -n nself-chat
kubectl top nodes
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Application | https://nchat.example.com | Main application |
| Grafana | https://monitoring.nchat.example.com | Dashboards |
| Prometheus | Internal only | Metrics |
| Hasura Console | Internal only | GraphQL admin |

### Critical Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | 70% | 85% | Scale up |
| Memory Usage | 75% | 90% | Scale up |
| Disk Usage | 70% | 85% | Expand storage |
| Response Time | 500ms | 1000ms | Investigate |
| Error Rate | 1% | 5% | Incident |
| Database Connections | 150/200 | 190/200 | Investigate |

---

## Common Operations

### Viewing Logs

#### Application Logs

```bash
# Tail logs
kubectl logs -f deployment/nself-chat -n nself-chat

# Tail logs from all pods
kubectl logs -f -l app.kubernetes.io/name=nself-chat -n nself-chat

# Get logs from specific time
kubectl logs deployment/nself-chat -n nself-chat --since=1h

# Get previous pod logs (after crash)
kubectl logs deployment/nself-chat -n nself-chat --previous
```

#### Database Logs

```bash
# PostgreSQL logs
kubectl logs postgres-0 -n nself-chat

# Query slow queries
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c \
  "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### System Events

```bash
# Get cluster events
kubectl get events -n nself-chat --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n nself-chat --watch
```

### Scaling Operations

#### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment/nself-chat --replicas=10 -n nself-chat

# Scale database (if using StatefulSet)
kubectl scale statefulset/postgres --replicas=3 -n nself-chat

# Verify scaling
kubectl get pods -n nself-chat -w
```

#### Autoscaling

```bash
# Check HPA status
kubectl get hpa -n nself-chat
kubectl describe hpa nself-chat -n nself-chat

# Update HPA
kubectl patch hpa nself-chat -n nself-chat -p \
  '{"spec":{"minReplicas":5,"maxReplicas":20}}'
```

### Deployment Updates

#### Rolling Update

```bash
# Update image
kubectl set image deployment/nself-chat \
  nself-chat=ghcr.io/nself/nself-chat:v0.3.1 \
  -n nself-chat

# Watch rollout
kubectl rollout status deployment/nself-chat -n nself-chat

# Pause rollout (if issues detected)
kubectl rollout pause deployment/nself-chat -n nself-chat

# Resume rollout
kubectl rollout resume deployment/nself-chat -n nself-chat
```

#### Using Helm

```bash
# Upgrade release
helm upgrade nself-chat ./deploy/helm/nself-chat \
  -f deploy/helm/nself-chat/values-production.yaml \
  --set image.tag=v0.3.1 \
  -n nself-chat

# Check status
helm status nself-chat -n nself-chat
```

### Configuration Updates

#### Update ConfigMap

```bash
# Edit configmap
kubectl edit configmap nself-chat-config -n nself-chat

# Restart to apply changes
kubectl rollout restart deployment/nself-chat -n nself-chat
```

#### Update Secrets

```bash
# Update secret
kubectl create secret generic nself-chat-secrets \
  --from-literal=new-key=new-value \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to use new secrets
kubectl rollout restart deployment/nself-chat -n nself-chat
```

---

## Incident Response

### Severity Levels

| Level | Response Time | Description |
|-------|---------------|-------------|
| P1 - Critical | Immediate | Complete outage, data loss |
| P2 - High | 15 minutes | Partial outage, severe degradation |
| P3 - Medium | 1 hour | Performance issues, minor features down |
| P4 - Low | 24 hours | Cosmetic issues, non-urgent bugs |

### P1 - Critical Incident (Application Down)

#### Immediate Actions

1. **Verify the issue:**
   ```bash
   curl https://nchat.example.com/api/health
   kubectl get pods -n nself-chat
   kubectl get nodes
   ```

2. **Check pod status:**
   ```bash
   kubectl describe pod <pod-name> -n nself-chat
   kubectl logs <pod-name> -n nself-chat
   ```

3. **Check recent changes:**
   ```bash
   kubectl rollout history deployment/nself-chat -n nself-chat
   kubectl get events -n nself-chat --sort-by='.lastTimestamp' | head -20
   ```

4. **Quick fixes:**
   ```bash
   # Restart deployment
   kubectl rollout restart deployment/nself-chat -n nself-chat

   # OR rollback if recent deployment
   kubectl rollout undo deployment/nself-chat -n nself-chat
   ```

5. **Verify recovery:**
   ```bash
   kubectl rollout status deployment/nself-chat -n nself-chat
   curl https://nchat.example.com/api/health
   ```

### P2 - High Severity (Database Issues)

#### Database Connection Issues

1. **Check database pod:**
   ```bash
   kubectl get pods -n nself-chat | grep postgres
   kubectl logs postgres-0 -n nself-chat
   ```

2. **Test connectivity:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- pg_isready
   ```

3. **Check connections:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c \
     "SELECT count(*) FROM pg_stat_activity;"
   ```

4. **Kill idle connections:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c \
     "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes';"
   ```

#### Database Performance Issues

1. **Check slow queries:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c \
     "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
   ```

2. **Check database size:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c \
     "SELECT pg_size_pretty(pg_database_size('nchat'));"
   ```

3. **Vacuum and analyze:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c "VACUUM ANALYZE;"
   ```

### P3 - Medium Severity (High CPU/Memory)

#### High CPU Usage

1. **Identify resource hogs:**
   ```bash
   kubectl top pods -n nself-chat --sort-by=cpu
   ```

2. **Scale horizontally:**
   ```bash
   kubectl scale deployment/nself-chat --replicas=8 -n nself-chat
   ```

3. **Investigate application:**
   ```bash
   kubectl exec -it deployment/nself-chat -n nself-chat -- node --prof
   ```

#### High Memory Usage

1. **Check memory usage:**
   ```bash
   kubectl top pods -n nself-chat --sort-by=memory
   ```

2. **Look for memory leaks:**
   ```bash
   kubectl logs deployment/nself-chat -n nself-chat | grep -i "out of memory"
   ```

3. **Restart affected pods:**
   ```bash
   kubectl delete pod <pod-name> -n nself-chat
   ```

---

## Troubleshooting

### Application Won't Start

#### Check pod status:
```bash
kubectl get pods -n nself-chat
kubectl describe pod <pod-name> -n nself-chat
```

#### Common issues:

1. **Image pull errors:**
   ```bash
   # Check image pull secret
   kubectl get secret nself-chat-registry -n nself-chat

   # Verify image exists
   docker manifest inspect ghcr.io/nself/nself-chat:v0.3.0
   ```

2. **Insufficient resources:**
   ```bash
   kubectl describe nodes
   kubectl top nodes
   ```

3. **ConfigMap/Secret missing:**
   ```bash
   kubectl get configmap -n nself-chat
   kubectl get secret -n nself-chat
   ```

### Database Connection Failures

1. **Verify database is running:**
   ```bash
   kubectl get pods -n nself-chat | grep postgres
   ```

2. **Test connection:**
   ```bash
   kubectl run pg-test --image=postgres:16 --rm -it --restart=Never -n nself-chat -- \
     psql -h postgres -U nchat_user -d nchat
   ```

3. **Check credentials:**
   ```bash
   kubectl get secret nself-chat-secrets -n nself-chat -o jsonpath='{.data.database-url}' | base64 -d
   ```

### Slow Performance

1. **Check response times:**
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s https://nchat.example.com/api/health
   ```

   Create `curl-format.txt`:
   ```
   time_namelookup:  %{time_namelookup}s\n
   time_connect:  %{time_connect}s\n
   time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
   time_redirect:  %{time_redirect}s\n
   time_starttransfer:  %{time_starttransfer}s\n
   time_total:  %{time_total}s\n
   ```

2. **Check database performance:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U nchat_user -d nchat -c \
     "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Check Redis performance:**
   ```bash
   kubectl exec -it deployment/redis -n nself-chat -- \
     redis-cli -a $REDIS_PASSWORD --latency
   ```

### SSL/TLS Issues

1. **Check certificate:**
   ```bash
   kubectl get certificate -n nself-chat
   kubectl describe certificate nself-chat-tls -n nself-chat
   ```

2. **Verify cert-manager:**
   ```bash
   kubectl get pods -n cert-manager
   kubectl logs -n cert-manager deployment/cert-manager
   ```

3. **Manual certificate check:**
   ```bash
   openssl s_client -connect nchat.example.com:443 -servername nchat.example.com
   ```

---

## Maintenance Procedures

### Database Maintenance

#### Routine Maintenance (Weekly)

```bash
# Vacuum and analyze
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c "VACUUM ANALYZE;"

# Reindex
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c "REINDEX DATABASE nchat;"

# Check for bloat
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

#### Backup Verification

```bash
# Test backup restore (on test environment)
gunzip < backup-20250129.sql.gz | \
  kubectl exec -i postgres-0 -n nself-chat-test -- \
  psql -U nchat_user nchat_test
```

### Application Updates

#### Zero-Downtime Deployment

1. **Prepare:**
   ```bash
   # Ensure HPA is configured
   kubectl get hpa nself-chat -n nself-chat
   ```

2. **Deploy:**
   ```bash
   helm upgrade nself-chat ./deploy/helm/nself-chat \
     -f deploy/helm/nself-chat/values-production.yaml \
     --set image.tag=v0.3.1 \
     -n nself-chat \
     --wait \
     --timeout 10m
   ```

3. **Monitor:**
   ```bash
   kubectl rollout status deployment/nself-chat -n nself-chat
   watch -n 2 'kubectl get pods -n nself-chat'
   ```

4. **Verify:**
   ```bash
   curl https://nchat.example.com/api/health
   kubectl logs -f deployment/nself-chat -n nself-chat
   ```

### Certificate Renewal

Certificates auto-renew via cert-manager. Manual renewal if needed:

```bash
# Delete certificate to force renewal
kubectl delete certificate nself-chat-tls -n nself-chat

# Recreate
kubectl apply -f deploy/k8s/ingress.yaml

# Verify
kubectl get certificate nself-chat-tls -n nself-chat
```

---

## Performance Tuning

### Database Optimization

#### Connection Pooling

Update Hasura environment:
```yaml
HASURA_GRAPHQL_PG_CONNECTIONS: 50
HASURA_GRAPHQL_PG_TIMEOUT: 180
```

#### Query Optimization

```bash
# Enable pg_stat_statements
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c \
  "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Find missing indexes
kubectl exec -it postgres-0 -n nself-chat -- \
  psql -U nchat_user -d nchat -c \
  "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND n_distinct > 100 ORDER BY n_distinct DESC LIMIT 20;"
```

### Redis Optimization

```bash
# Check memory usage
kubectl exec -it deployment/redis -n nself-chat -- \
  redis-cli -a $REDIS_PASSWORD INFO memory

# Set maxmemory policy
kubectl exec -it deployment/redis -n nself-chat -- \
  redis-cli -a $REDIS_PASSWORD CONFIG SET maxmemory-policy allkeys-lru
```

### Application Tuning

Update deployment resources:
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

---

## Security Procedures

### Rotating Secrets

#### Rotate JWT Secret

1. **Generate new secret:**
   ```bash
   NEW_JWT_SECRET=$(openssl rand -base64 64)
   ```

2. **Update secret:**
   ```bash
   kubectl create secret generic nself-chat-secrets \
     --from-literal=jwt-secret="$NEW_JWT_SECRET" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Restart services:**
   ```bash
   kubectl rollout restart deployment/nself-chat -n nself-chat
   kubectl rollout restart deployment/hasura -n nself-chat
   ```

#### Rotate Database Password

1. **Change password in database:**
   ```bash
   kubectl exec -it postgres-0 -n nself-chat -- \
     psql -U postgres -c \
     "ALTER USER nchat_user WITH PASSWORD 'new-secure-password';"
   ```

2. **Update application secret:**
   ```bash
   kubectl create secret generic nself-chat-secrets \
     --from-literal=database-url="postgresql://nchat_user:new-secure-password@postgres:5432/nchat" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Restart application:**
   ```bash
   kubectl rollout restart deployment/nself-chat -n nself-chat
   ```

### Security Audit

```bash
# Check for exposed secrets
kubectl get secrets -n nself-chat

# Review RBAC
kubectl get rolebindings -n nself-chat
kubectl get clusterrolebindings | grep nself-chat

# Check network policies
kubectl get networkpolicies -n nself-chat

# Scan for vulnerabilities (using Trivy)
kubectl run trivy --rm -it --restart=Never \
  --image=aquasec/trivy:latest \
  -- image ghcr.io/nself/nself-chat:latest
```

---

## Disaster Recovery

### Full System Restore

#### Prerequisites:
- Recent database backup
- Infrastructure as Code (Terraform) configurations
- Kubernetes manifests in version control

#### Procedure:

1. **Restore infrastructure (if using Terraform):**
   ```bash
   cd deploy/terraform
   terraform init
   terraform apply
   ```

2. **Deploy application stack:**
   ```bash
   kubectl create namespace nself-chat
   kubectl apply -f deploy/k8s/
   ```

3. **Restore database:**
   ```bash
   aws s3 cp s3://nself-chat-backups/latest.sql.gz .
   gunzip < latest.sql.gz | \
     kubectl exec -i postgres-0 -n nself-chat -- \
     psql -U nchat_user nchat
   ```

4. **Verify services:**
   ```bash
   kubectl get pods -n nself-chat
   curl https://nchat.example.com/api/health
   ```

5. **Restore monitoring:**
   ```bash
   kubectl apply -f deploy/k8s/monitoring/
   ```

### Data Recovery

#### Recover deleted data (if within retention period):

```bash
# List available backups
aws s3 ls s3://nself-chat-backups/

# Download specific backup
aws s3 cp s3://nself-chat-backups/backup-20250128.sql.gz .

# Extract specific table
gunzip < backup-20250128.sql.gz | \
  grep -A 10000 "CREATE TABLE messages" > messages_backup.sql

# Restore specific table
kubectl exec -i postgres-0 -n nself-chat -- \
  psql -U nchat_user nchat < messages_backup.sql
```

---

## Contact Information

### On-Call Rotation

- Primary: [Team Lead]
- Secondary: [Senior Engineer]
- Escalation: [Engineering Manager]

### External Services

- Cloud Provider Support: [Support Link]
- DNS Provider: [Support Link]
- SSL Provider: [Support Link]
- SMTP Service: [Support Link]

### Monitoring Alerts

- Slack: #nself-chat-alerts
- PagerDuty: [Integration Key]
- Email: ops@nchat.example.com

---

## Appendix

### Useful kubectl Aliases

```bash
alias k='kubectl'
alias kn='kubectl -n nself-chat'
alias kgp='kubectl get pods -n nself-chat'
alias kgd='kubectl get deployments -n nself-chat'
alias kgs='kubectl get services -n nself-chat'
alias kl='kubectl logs -f -n nself-chat'
alias kx='kubectl exec -it -n nself-chat'
alias kd='kubectl describe -n nself-chat'
```

### Emergency Commands Reference

```bash
# Nuclear option: Delete and recreate deployment
kubectl delete deployment nself-chat -n nself-chat
kubectl apply -f deploy/k8s/deployment.yaml

# Force pod deletion
kubectl delete pod <pod-name> -n nself-chat --force --grace-period=0

# Drain node for maintenance
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>
```
