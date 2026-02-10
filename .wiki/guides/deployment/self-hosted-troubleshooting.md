# Self-Hosted Troubleshooting Guide

Comprehensive troubleshooting guide for self-hosted nself-chat deployments.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Service-Specific Issues](#service-specific-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Run Full Diagnostic

```bash
sudo /usr/local/bin/diagnose-nchat
```

This checks:

- All service health
- Disk space
- Memory usage
- Recent errors
- Network connectivity

### Manual Checks

```bash
# Check all services
cd /opt/nself-chat
docker compose -f docker-compose.production.yml ps

# Check logs for errors
docker compose -f docker-compose.production.yml logs --tail=100 | grep -i error

# Check specific service
docker compose -f docker-compose.production.yml logs -f nchat

# Test application health
curl -I https://chat.example.com/api/health

# Check SSL certificate
openssl s_client -connect chat.example.com:443 -servername chat.example.com < /dev/null | grep -A2 "Certificate chain"
```

---

## Common Issues

### Issue 1: Services Won't Start

**Symptoms:**

- Containers exit immediately
- "Error starting userland proxy" message
- Services show "Restarting" status

**Diagnosis:**

```bash
# Check which services are failing
docker compose -f docker-compose.production.yml ps

# View logs for failed service
docker compose -f docker-compose.production.yml logs postgres
docker compose -f docker-compose.production.yml logs nchat

# Check port conflicts
sudo netstat -tulpn | grep -E ':(80|443|3000|5432|8080|4000|9000)'
```

**Solutions:**

```bash
# Solution 1: Port conflict
# Stop conflicting services
sudo systemctl stop nginx apache2
sudo lsof -ti:80 | xargs sudo kill -9
sudo lsof -ti:443 | xargs sudo kill -9

# Restart nself-chat
docker compose -f docker-compose.production.yml up -d

# Solution 2: Permission issues
sudo chown -R $USER:$USER /opt/nself-chat
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Solution 3: Corrupted volumes
docker compose -f docker-compose.production.yml down -v
# WARNING: This deletes all data! Restore from backup after
docker compose -f docker-compose.production.yml up -d
```

---

### Issue 2: Cannot Access Website (502 Bad Gateway)

**Symptoms:**

- 502 Bad Gateway error
- "upstream prematurely closed connection"
- Cannot load website

**Diagnosis:**

```bash
# Check nginx
docker compose -f docker-compose.production.yml logs nginx

# Check application
docker compose -f docker-compose.production.yml logs nchat

# Test backend directly
curl http://localhost:3000/api/health
```

**Solutions:**

```bash
# Solution 1: Application not ready
# Wait for services to fully start
sleep 30
docker compose -f docker-compose.production.yml ps

# Solution 2: Nginx configuration error
# Test nginx config
docker compose -f docker-compose.production.yml exec nginx nginx -t

# Reload nginx
docker compose -f docker-compose.production.yml restart nginx

# Solution 3: Application crashed
# Restart application
docker compose -f docker-compose.production.yml restart nchat

# Check logs
docker compose -f docker-compose.production.yml logs -f nchat
```

---

### Issue 3: SSL Certificate Problems

**Symptoms:**

- "Your connection is not private" warning
- SSL certificate expired
- Mixed content warnings

**Diagnosis:**

```bash
# Check certificate status
sudo certbot certificates

# Check certificate expiry
echo | openssl s_client -servername chat.example.com -connect chat.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Check nginx SSL config
docker compose -f docker-compose.production.yml exec nginx nginx -t
```

**Solutions:**

```bash
# Solution 1: Certificate expired
# Renew certificate
sudo certbot renew --force-renewal

# Restart nginx
docker compose -f docker-compose.production.yml restart nginx

# Solution 2: Certificate not found
# Check certificate location
ls -la /etc/letsencrypt/live/chat.example.com/

# Obtain new certificate
sudo certbot certonly --standalone \
  -d chat.example.com \
  --email admin@example.com \
  --agree-tos \
  --force-renewal

# Solution 3: Wrong domain in certificate
# Update DOMAIN in .env.production
nano /opt/nself-chat/.env.production

# Obtain certificate for correct domain
sudo certbot certonly --standalone -d NEW_DOMAIN.com
```

---

### Issue 4: Database Connection Errors

**Symptoms:**

- "could not connect to server"
- "password authentication failed"
- Application can't start

**Diagnosis:**

```bash
# Check PostgreSQL is running
docker compose -f docker-compose.production.yml ps postgres

# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres

# Test connection
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT version();"
```

**Solutions:**

```bash
# Solution 1: PostgreSQL not running
docker compose -f docker-compose.production.yml restart postgres

# Wait for PostgreSQL to be ready
sleep 10

# Solution 2: Wrong password
# Check password in .env.production
grep POSTGRES_PASSWORD /opt/nself-chat/.env.production

# Update password if needed (requires data migration)
# Restart all services
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Solution 3: Database corrupted
# Restore from backup
sudo /usr/local/bin/restore-nchat /var/backups/nself-chat/nchat-backup-LATEST.tar.gz
```

---

### Issue 5: Out of Disk Space

**Symptoms:**

- "No space left on device"
- Services crashing randomly
- Cannot save files

**Diagnosis:**

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Find large directories
du -sh /var/lib/docker/*
du -sh /opt/nself-chat/*
```

**Solutions:**

```bash
# Solution 1: Clean Docker
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# Full cleanup
docker system prune -a --volumes

# Solution 2: Clean old backups
find /var/backups/nself-chat -mtime +30 -delete

# Solution 3: Clean logs
# Truncate Docker logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Rotate nginx logs
docker compose -f docker-compose.production.yml exec nginx \
  sh -c 'echo > /var/log/nginx/access.log'
docker compose -f docker-compose.production.yml exec nginx \
  sh -c 'echo > /var/log/nginx/error.log'
```

---

### Issue 6: High Memory Usage

**Symptoms:**

- Server running slow
- OOM (Out of Memory) errors
- Services being killed

**Diagnosis:**

```bash
# Check memory usage
free -h

# Check Docker container memory
docker stats

# Check which container is using most memory
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | sort -k 2 -h
```

**Solutions:**

```bash
# Solution 1: Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Solution 2: Reduce memory limits
# Edit docker-compose.production.yml
nano /opt/nself-chat/docker-compose.production.yml

# Adjust memory limits under deploy.resources.limits
# Restart services
docker compose -f docker-compose.production.yml up -d

# Solution 3: Restart services
docker compose -f docker-compose.production.yml restart

# Solution 4: Upgrade server
# Consider upgrading to a larger instance
```

---

### Issue 7: Application Slow/Unresponsive

**Symptoms:**

- Pages load slowly
- Timeouts
- High CPU usage

**Diagnosis:**

```bash
# Check CPU usage
top

# Check Docker container CPU
docker stats

# Check application logs
docker compose -f docker-compose.production.yml logs nchat | tail -100

# Check database performance
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT * FROM pg_stat_activity;"
```

**Solutions:**

```bash
# Solution 1: Restart services
docker compose -f docker-compose.production.yml restart

# Solution 2: Optimize database
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "VACUUM ANALYZE;"

# Solution 3: Clear Redis cache
docker compose -f docker-compose.production.yml exec redis redis-cli FLUSHALL

# Solution 4: Check for resource-intensive queries
# Enable slow query logging
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
docker compose -f docker-compose.production.yml restart postgres
```

---

### Issue 8: Email Not Sending

**Symptoms:**

- Password reset emails not received
- Invitation emails not sent
- No email notifications

**Diagnosis:**

```bash
# Check auth service logs
docker compose -f docker-compose.production.yml logs auth | grep -i smtp

# Check SMTP configuration
grep SMTP /opt/nself-chat/.env.production

# Test SMTP connection
docker compose -f docker-compose.production.yml exec auth \
  nc -zv $SMTP_HOST $SMTP_PORT
```

**Solutions:**

```bash
# Solution 1: Fix SMTP credentials
# Update .env.production with correct SMTP settings
nano /opt/nself-chat/.env.production

# Update:
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-api-key
# SMTP_FROM=noreply@chat.example.com

# Restart auth service
docker compose -f docker-compose.production.yml restart auth

# Solution 2: Use different SMTP provider
# Try with Gmail, SendGrid, Mailgun, etc.

# Solution 3: Test with Mailpit (development)
# Enable mailpit for testing
docker compose -f docker-compose.production.yml \
  -f docker-compose.dev.yml up -d mailpit
```

---

## Service-Specific Issues

### PostgreSQL Issues

**Cannot start PostgreSQL:**

```bash
# Check if data directory is corrupted
docker compose -f docker-compose.production.yml logs postgres

# If corruption detected, restore from backup
docker compose -f docker-compose.production.yml down
docker volume rm nself-chat-prod_postgres-data
docker compose -f docker-compose.production.yml up -d postgres

# Restore database
gunzip < /var/backups/nself-chat/db-LATEST.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres nchat
```

**Slow queries:**

```bash
# Analyze query performance
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Add indexes (if needed)
# Rebuild database statistics
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "ANALYZE;"
```

---

### Hasura Issues

**GraphQL queries failing:**

```bash
# Check Hasura logs
docker compose -f docker-compose.production.yml logs hasura

# Check Hasura health
curl http://localhost:8080/healthz

# Restart Hasura
docker compose -f docker-compose.production.yml restart hasura
```

**Console not accessible:**

```bash
# Enable console (production)
# Edit .env.production
nano /opt/nself-chat/.env.production

# Add or update:
# HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Restart Hasura
docker compose -f docker-compose.production.yml restart hasura

# Access at: https://chat.example.com/console
```

---

### Redis Issues

**Redis connection errors:**

```bash
# Check Redis is running
docker compose -f docker-compose.production.yml ps redis

# Test Redis connection
docker compose -f docker-compose.production.yml exec redis redis-cli ping

# Clear Redis cache
docker compose -f docker-compose.production.yml exec redis redis-cli FLUSHALL

# Restart Redis
docker compose -f docker-compose.production.yml restart redis
```

---

### MinIO Issues

**Cannot upload files:**

```bash
# Check MinIO logs
docker compose -f docker-compose.production.yml logs storage

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Create bucket if missing
docker compose -f docker-compose.production.yml exec storage \
  mc mb minio/nchat-uploads

# Restart MinIO
docker compose -f docker-compose.production.yml restart storage
```

---

## Performance Issues

### High CPU Usage

```bash
# Identify CPU-intensive container
docker stats --no-stream | sort -k 3 -h

# Check for runaway processes
docker compose -f docker-compose.production.yml exec nchat top

# Restart affected service
docker compose -f docker-compose.production.yml restart nchat
```

### High Memory Usage

```bash
# Check memory per container
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Restart high-memory containers
docker compose -f docker-compose.production.yml restart

# Increase swap if needed (see Issue 6 above)
```

### Slow Database

```bash
# Check active connections
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"

# Optimize database
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "VACUUM FULL ANALYZE;"
```

---

## Security Issues

### Unauthorized Access

```bash
# Check access logs for suspicious activity
docker compose -f docker-compose.production.yml logs nginx | grep -E "40[13]|500"

# Enable IP whitelisting in nginx
nano /opt/nself-chat/deploy/nginx/conf.d/nchat.conf

# Add to sensitive locations (/console, /minio):
# allow 192.168.1.0/24;
# deny all;

# Restart nginx
docker compose -f docker-compose.production.yml restart nginx
```

### Brute Force Attacks

```bash
# Install fail2ban
sudo apt-get install -y fail2ban

# Create nginx filter
sudo tee /etc/fail2ban/filter.d/nginx-auth.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*" 401
ignoreregex =
EOF

# Configure jail
sudo tee /etc/fail2ban/jail.d/nginx-auth.conf << 'EOF'
[nginx-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/nchat-access.log
maxretry = 5
findtime = 600
bantime = 3600
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
```

### SSL/TLS Issues

```bash
# Test SSL configuration
openssl s_client -connect chat.example.com:443 -servername chat.example.com

# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=chat.example.com

# Update SSL protocols (if needed)
nano /opt/nself-chat/deploy/nginx/conf.d/nchat.conf

# Ensure:
# ssl_protocols TLSv1.2 TLSv1.3;
```

---

## Getting Help

### Generate Diagnostic Bundle

```bash
# Generate support bundle
sudo /usr/local/bin/diagnose-nchat --bundle

# Upload to support
# File location: /tmp/nchat-diagnostics-TIMESTAMP.tar.gz
```

### Community Support

1. **Documentation**: https://docs.nself.chat
2. **GitHub Issues**: https://github.com/yourusername/nself-chat/issues
3. **Discord**: https://discord.gg/nself
4. **Forum**: https://community.nself.chat

### Commercial Support

For priority support:

- Email: support@nself.chat
- Include diagnostic bundle
- Describe issue in detail
- Include steps to reproduce

---

## Preventive Maintenance

### Daily

```bash
# Check service health
docker compose -f docker-compose.production.yml ps

# Check disk space
df -h

# Check logs for errors
docker compose -f docker-compose.production.yml logs --since=24h | grep -i error
```

### Weekly

```bash
# Run backup manually
sudo /usr/local/bin/backup-nchat

# Check backup integrity
tar tzf /var/backups/nself-chat/nchat-backup-LATEST.tar.gz

# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Clean Docker
docker system prune -f
```

### Monthly

```bash
# Update nself-chat
sudo /usr/local/bin/update-nchat

# Review logs
docker compose -f docker-compose.production.yml logs --since=720h | grep -i "error\|warning" | less

# Review security
sudo /usr/local/bin/security-audit-nchat

# Test restore procedure
# (on test server, not production!)
```

---

## Advanced Troubleshooting

### Enable Debug Logging

```bash
# Edit .env.production
nano /opt/nself-chat/.env.production

# Add:
LOG_LEVEL=debug
HASURA_GRAPHQL_LOG_LEVEL=debug

# Restart services
docker compose -f docker-compose.production.yml restart
```

### Network Debugging

```bash
# Check network connectivity
docker compose -f docker-compose.production.yml exec nchat ping -c 3 hasura
docker compose -f docker-compose.production.yml exec nchat ping -c 3 postgres

# Check DNS resolution
docker compose -f docker-compose.production.yml exec nchat nslookup hasura
docker compose -f docker-compose.production.yml exec nchat nslookup postgres

# Inspect network
docker network inspect nself-chat-prod_nchat-network
```

### Database Debugging

```bash
# Check database connections
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT * FROM pg_stat_activity;"

# Check database size
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT pg_size_pretty(pg_database_size('nchat'));"

# Check table sizes
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
