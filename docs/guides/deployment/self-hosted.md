# Self-Hosted Deployment Guide

Complete guide for deploying nself-chat on your own infrastructure with automatic SSL and minimal configuration.

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [One-Line Installation](#one-line-installation)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Backup and Restore](#backup-and-restore)
- [Updates and Upgrades](#updates-and-upgrades)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

The fastest way to get nself-chat running on your own server:

```bash
# One-line installation (installs everything)
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | bash
```

This will:

- Install Docker and Docker Compose if needed
- Download and configure nself-chat
- Set up SSL with Let's Encrypt
- Start all services
- Configure automatic backups

---

## Requirements

### Minimum Server Specifications

| Resource    | Minimum       | Recommended      | Notes                                     |
| ----------- | ------------- | ---------------- | ----------------------------------------- |
| **CPU**     | 2 cores       | 4+ cores         | More cores = better real-time performance |
| **RAM**     | 4 GB          | 8+ GB            | 8GB recommended for 50+ concurrent users  |
| **Disk**    | 20 GB         | 50+ GB SSD       | SSD highly recommended for database       |
| **Network** | 100 Mbps      | 1 Gbps           | Upload speed matters for video calls      |
| **OS**      | Ubuntu 20.04+ | Ubuntu 22.04 LTS | Also supports Debian, CentOS, RHEL        |

### Software Requirements

- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Domain name**: Required for SSL (e.g., `chat.example.com`)
- **Ports open**: 80, 443, 3000

### Supported Operating Systems

- Ubuntu 20.04 LTS or newer (recommended)
- Debian 11 or newer
- CentOS 8 or newer
- RHEL 8 or newer
- Fedora 36 or newer
- Amazon Linux 2023

### Cloud Provider Recommendations

| Provider         | Instance Type      | Monthly Cost (approx) | Notes                       |
| ---------------- | ------------------ | --------------------- | --------------------------- |
| **DigitalOcean** | Premium 4GB        | $24/month             | Best value for small teams  |
| **Hetzner**      | CPX21              | €8.46/month           | Excellent price/performance |
| **AWS**          | t3.medium          | $30-40/month          | Use with reserved instances |
| **Google Cloud** | e2-medium          | $25-35/month          | Good integration options    |
| **Linode**       | 4GB Dedicated      | $24/month             | Reliable performance        |
| **Vultr**        | 4GB High Frequency | $24/month             | Fast NVMe storage           |

---

## One-Line Installation

### Interactive Installation

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | bash
```

The installer will prompt you for:

1. **Domain name** (e.g., `chat.example.com`)
2. **Email address** (for Let's Encrypt SSL)
3. **Admin email** (for nself-chat owner account)
4. **Company/Organization name**
5. **Enable monitoring** (optional Grafana/Prometheus)

### Non-Interactive Installation

For automation, provide all values as environment variables:

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | \
  DOMAIN=chat.example.com \
  SSL_EMAIL=admin@example.com \
  ADMIN_EMAIL=admin@example.com \
  COMPANY_NAME="Acme Inc" \
  ENABLE_MONITORING=true \
  bash -s -- --non-interactive
```

### What Gets Installed

The installer sets up:

1. **Docker Engine** (if not present)
2. **Docker Compose** (if not present)
3. **nself-chat application**
4. **PostgreSQL** database with backups
5. **Hasura** GraphQL engine
6. **Nhost Auth** service
7. **MinIO** for file storage
8. **Redis** for caching
9. **Nginx** reverse proxy
10. **Certbot** for SSL certificates
11. **Automatic backup** cron job
12. **Monitoring stack** (if enabled)

---

## Manual Installation

If you prefer manual control, follow these steps:

### Step 1: Install Docker

**Ubuntu/Debian:**

```bash
# Update packages
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**CentOS/RHEL:**

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Download nself-chat

```bash
# Create installation directory
sudo mkdir -p /opt/nself-chat
cd /opt/nself-chat

# Download latest release
VERSION=$(curl -s https://api.github.com/repos/yourusername/nself-chat/releases/latest | grep tag_name | cut -d '"' -f 4)
curl -L https://github.com/yourusername/nself-chat/archive/refs/tags/${VERSION}.tar.gz | tar xz --strip-components=1

# Or clone from git
git clone https://github.com/yourusername/nself-chat.git .
```

### Step 3: Configure Environment

```bash
# Copy production environment file
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Required environment variables:**

```bash
# Domain Configuration
DOMAIN=chat.example.com
SSL_EMAIL=admin@example.com

# Application
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_ENV=production

# Database
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=nchat

# Hasura
HASURA_ADMIN_SECRET=$(openssl rand -base64 32)
HASURA_JWT_SECRET=$(openssl rand -base64 32)

# Auth
AUTH_CLIENT_URL=https://chat.example.com
AUTH_SERVER_URL=https://chat.example.com/auth

# Storage
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=$(openssl rand -base64 16)
COMPANY_NAME="Your Company"
```

### Step 4: Set Up SSL

**Option A: Let's Encrypt (Automatic)**

```bash
# Install Certbot
sudo apt-get install -y certbot

# Get certificate
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN}

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Option B: Custom Certificate**

```bash
# Place your certificates
sudo mkdir -p /etc/ssl/nchat
sudo cp your-cert.crt /etc/ssl/nchat/cert.pem
sudo cp your-key.key /etc/ssl/nchat/key.pem
sudo chmod 600 /etc/ssl/nchat/key.pem
```

### Step 5: Start Services

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### Step 6: Initialize Database

```bash
# Run migrations
docker compose -f docker-compose.production.yml exec nchat pnpm db:migrate

# Seed initial data
docker compose -f docker-compose.production.yml exec nchat pnpm db:seed
```

### Step 7: Verify Installation

```bash
# Check all services are healthy
docker compose -f docker-compose.production.yml ps

# Test application
curl https://chat.example.com/api/health

# Access in browser
open https://chat.example.com
```

---

## Configuration

### Firewall Setup

**UFW (Ubuntu):**

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**Firewalld (CentOS/RHEL):**

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### DNS Configuration

Point your domain to your server:

```
A Record:    chat.example.com  →  YOUR_SERVER_IP
AAAA Record: chat.example.com  →  YOUR_SERVER_IPv6 (if available)
```

### Email Configuration

nself-chat requires SMTP for:

- User invitations
- Password resets
- Email verification
- Notifications

**Recommended SMTP providers:**

| Provider     | Setup Complexity | Free Tier          | Notes                      |
| ------------ | ---------------- | ------------------ | -------------------------- |
| **Resend**   | Easy             | 100/day            | Modern, developer-friendly |
| **SendGrid** | Easy             | 100/day            | Reliable, good docs        |
| **Mailgun**  | Medium           | 5,000/month        | Powerful, pay-as-go        |
| **AWS SES**  | Medium           | 62,000/month (EC2) | Cheapest at scale          |
| **Postmark** | Easy             | Free trial         | Excellent deliverability   |

**Example SMTP configuration (SendGrid):**

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
SMTP_FROM=noreply@chat.example.com
```

### Storage Configuration

Default storage backend is MinIO (S3-compatible). For larger deployments, consider:

**AWS S3:**

```bash
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=nchat-storage
```

**Cloudflare R2:**

```bash
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=nchat-storage
```

### Resource Limits

Edit `docker-compose.production.yml` to adjust resource limits:

```yaml
services:
  nchat:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

---

## SSL/TLS Setup

### Automatic SSL (Let's Encrypt)

The installation script automatically configures Let's Encrypt. Manual setup:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx \
  -d chat.example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email

# Certificates are stored in:
# /etc/letsencrypt/live/chat.example.com/fullchain.pem
# /etc/letsencrypt/live/chat.example.com/privkey.pem
```

### Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Create renewal script
sudo tee /etc/cron.monthly/renew-ssl << 'EOF'
#!/bin/bash
certbot renew --quiet
docker compose -f /opt/nself-chat/docker-compose.production.yml restart nginx
EOF

sudo chmod +x /etc/cron.monthly/renew-ssl
```

### SSL Best Practices

The production configuration includes:

- **TLS 1.2+ only** (no SSLv3, TLS 1.0, TLS 1.1)
- **Strong cipher suites** (Perfect Forward Secrecy)
- **HSTS headers** (HTTP Strict Transport Security)
- **OCSP stapling** (faster certificate validation)
- **A+ SSL Labs rating**

Verify your SSL configuration:

```bash
# Test SSL
curl -I https://chat.example.com

# Check SSL Labs rating
open https://www.ssllabs.com/ssltest/analyze.html?d=chat.example.com
```

---

## Backup and Restore

### Automatic Backups

The installer sets up automatic daily backups. Manual configuration:

```bash
# Create backup directory
sudo mkdir -p /var/backups/nself-chat

# Create backup script
sudo tee /usr/local/bin/backup-nchat << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/nself-chat"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nchat-backup-${TIMESTAMP}.tar.gz"

cd /opt/nself-chat

# Backup database
docker compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres nchat | gzip > ${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz

# Backup volumes
docker compose -f docker-compose.production.yml exec -T nchat \
  tar czf - /app/public/uploads > ${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz

# Backup configuration
cp .env.production ${BACKUP_DIR}/env-${TIMESTAMP}.backup

# Create combined backup
tar czf ${BACKUP_DIR}/${BACKUP_FILE} \
  ${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz \
  ${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz \
  ${BACKUP_DIR}/env-${TIMESTAMP}.backup

# Clean up individual files
rm ${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz
rm ${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz
rm ${BACKUP_DIR}/env-${TIMESTAMP}.backup

# Delete backups older than 30 days
find ${BACKUP_DIR} -name "nchat-backup-*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"
EOF

sudo chmod +x /usr/local/bin/backup-nchat

# Schedule daily backups (2 AM)
echo "0 2 * * * root /usr/local/bin/backup-nchat >> /var/log/nchat-backup.log 2>&1" | \
  sudo tee /etc/cron.d/nchat-backup
```

### Manual Backup

```bash
# Run backup script
sudo /usr/local/bin/backup-nchat

# Backups are stored in
ls -lh /var/backups/nself-chat/
```

### Restore from Backup

```bash
# Stop services
cd /opt/nself-chat
docker compose -f docker-compose.production.yml down

# Extract backup
BACKUP_FILE="/var/backups/nself-chat/nchat-backup-20260131_020000.tar.gz"
tar xzf ${BACKUP_FILE} -C /tmp/

# Restore database
gunzip < /tmp/var/backups/nself-chat/db-*.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres nchat

# Restore uploads
tar xzf /tmp/var/backups/nself-chat/uploads-*.tar.gz -C /

# Restore configuration (if needed)
cp /tmp/var/backups/nself-chat/env-*.backup .env.production

# Start services
docker compose -f docker-compose.production.yml up -d

echo "Restore completed"
```

### Offsite Backups

**AWS S3:**

```bash
# Install AWS CLI
sudo apt-get install -y awscli

# Configure AWS
aws configure

# Upload to S3
aws s3 sync /var/backups/nself-chat/ s3://your-backup-bucket/nchat/
```

**Backblaze B2:**

```bash
# Install B2 CLI
sudo pip3 install b2

# Configure B2
b2 authorize-account YOUR_KEY_ID YOUR_APPLICATION_KEY

# Upload to B2
b2 sync /var/backups/nself-chat/ b2://your-backup-bucket/nchat/
```

**Rsync to Remote Server:**

```bash
# Set up SSH key authentication first
rsync -avz --delete \
  /var/backups/nself-chat/ \
  backup-server:/backups/nchat/
```

---

## Updates and Upgrades

### Automatic Updates

Use the update script:

```bash
sudo /usr/local/bin/update-nchat
```

### Manual Update

```bash
cd /opt/nself-chat

# Backup before updating
sudo /usr/local/bin/backup-nchat

# Pull latest version
git fetch --tags
git checkout $(git describe --tags `git rev-list --tags --max-count=1`)

# Update environment file if needed
cp .env.production .env.production.backup
# Compare with .env.production.example for new variables

# Rebuild images
docker compose -f docker-compose.production.yml build --no-cache

# Stop services
docker compose -f docker-compose.production.yml down

# Run database migrations
docker compose -f docker-compose.production.yml up -d postgres
sleep 10
docker compose -f docker-compose.production.yml run --rm nchat pnpm db:migrate

# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps
```

### Rollback

If an update fails:

```bash
cd /opt/nself-chat

# Stop services
docker compose -f docker-compose.production.yml down

# Checkout previous version
git checkout v1.0.0  # Replace with previous version tag

# Restore from backup
sudo /usr/local/bin/restore-nchat /var/backups/nself-chat/nchat-backup-TIMESTAMP.tar.gz

# Start services
docker compose -f docker-compose.production.yml up -d
```

### Update Notifications

Subscribe to release notifications:

```bash
# GitHub releases (requires GitHub CLI)
gh repo watch yourusername/nself-chat --releases

# Or set up email notifications in GitHub settings
```

---

## Monitoring

### Basic Monitoring (Included)

Check service health:

```bash
# Service status
docker compose -f docker-compose.production.yml ps

# Resource usage
docker stats

# View logs
docker compose -f docker-compose.production.yml logs -f nchat

# Check specific service
docker compose -f docker-compose.production.yml logs -f postgres
```

### Advanced Monitoring (Optional)

Install monitoring stack with Grafana and Prometheus:

```bash
# Enable monitoring during installation
ENABLE_MONITORING=true ./scripts/self-hosted-install.sh

# Or manually enable
cd /opt/nself-chat
docker compose -f docker-compose.production.yml \
  -f docker-compose.monitoring.yml up -d
```

Access monitoring dashboards:

- **Grafana**: https://chat.example.com/grafana (admin/admin)
- **Prometheus**: https://chat.example.com/prometheus
- **cAdvisor**: https://chat.example.com/cadvisor

### Monitoring Dashboards

Pre-configured dashboards include:

1. **System Overview**
   - CPU, memory, disk usage
   - Network I/O
   - Container health

2. **Application Metrics**
   - Request rate
   - Response times
   - Error rates
   - Active users

3. **Database Metrics**
   - Connection pool
   - Query performance
   - Cache hit rates
   - Disk I/O

4. **Storage Metrics**
   - File upload rates
   - Storage usage
   - Object counts

### Alerts

Configure email alerts in Grafana:

1. Go to Alerting > Contact Points
2. Add email notification channel
3. Set up alert rules for:
   - High CPU usage (>80%)
   - High memory usage (>90%)
   - Disk space low (<10%)
   - Database connection failures
   - Application errors

### Log Management

**Basic log viewing:**

```bash
# Real-time logs
docker compose -f docker-compose.production.yml logs -f

# Last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100

# Filter by service
docker compose -f docker-compose.production.yml logs -f nchat

# Search logs
docker compose -f docker-compose.production.yml logs | grep ERROR
```

**Advanced logging (Loki + Grafana):**

Enable in monitoring stack for centralized log aggregation and search.

---

## Troubleshooting

See [Self-Hosted Troubleshooting Guide](./self-hosted-troubleshooting.md) for detailed solutions.

### Quick Diagnostics

```bash
# Run diagnostic script
sudo /usr/local/bin/diagnose-nchat

# Check all services
docker compose -f docker-compose.production.yml ps

# Check logs for errors
docker compose -f docker-compose.production.yml logs --tail=50 | grep -i error

# Test connectivity
curl -I https://chat.example.com/api/health

# Check disk space
df -h

# Check memory
free -h

# Check Docker
docker info
```

### Common Issues

#### 1. Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs

# Check port conflicts
sudo netstat -tulpn | grep -E ':(80|443|3000|5432|8080)'

# Restart services
docker compose -f docker-compose.production.yml restart
```

#### 2. SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Restart nginx
docker compose -f docker-compose.production.yml restart nginx
```

#### 3. Database Connection Errors

```bash
# Check database is running
docker compose -f docker-compose.production.yml ps postgres

# Test connection
docker compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d nchat -c "SELECT version();"

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

#### 4. Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 5. Disk Space Full

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Remove old backups
find /var/backups/nself-chat -mtime +30 -delete

# Check logs size
du -sh /var/lib/docker/containers/*/*-json.log
```

#### 6. High CPU Usage

```bash
# Identify culprit
docker stats

# Check application logs
docker compose -f docker-compose.production.yml logs nchat | tail -100

# Restart services
docker compose -f docker-compose.production.yml restart
```

### Getting Help

1. **Check documentation**: https://docs.nself.chat
2. **Search issues**: https://github.com/yourusername/nself-chat/issues
3. **Ask community**: https://discord.gg/nself
4. **File a bug**: https://github.com/yourusername/nself-chat/issues/new

### Support Bundles

Generate diagnostic bundle for support:

```bash
sudo /usr/local/bin/diagnose-nchat --bundle

# Uploads diagnostic bundle to: /tmp/nchat-diagnostics-TIMESTAMP.tar.gz
```

The bundle includes:

- Service status
- Recent logs
- Configuration (sanitized)
- System information
- Resource usage

---

## Security Hardening

### Essential Security Steps

1. **Change default passwords**

```bash
# Generate strong passwords
HASURA_ADMIN_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Update .env.production
nano .env.production

# Restart services
docker compose -f docker-compose.production.yml up -d
```

2. **Enable firewall**

```bash
# UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

3. **Set up fail2ban**

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

4. **Regular updates**

```bash
# System updates
sudo apt-get update && sudo apt-get upgrade -y

# Application updates
sudo /usr/local/bin/update-nchat
```

5. **Monitor logs**

```bash
# Set up log monitoring
docker compose -f docker-compose.production.yml logs -f | grep -i "error\|warning\|fail"
```

### Advanced Security

- **Two-factor authentication**: Enable in admin panel
- **IP whitelisting**: Configure in nginx
- **Rate limiting**: Enabled by default
- **DDoS protection**: Consider Cloudflare
- **Database encryption**: Enable at-rest encryption
- **Secrets management**: Use Docker secrets or Vault

---

## Performance Tuning

### Database Optimization

```bash
# Edit PostgreSQL configuration
docker compose -f docker-compose.production.yml exec postgres \
  bash -c 'cat >> /var/lib/postgresql/data/postgresql.conf << EOF

# Performance tuning
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
EOF'

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

### Application Optimization

```bash
# Increase Node.js memory limit
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env.production

# Enable production mode
echo "NODE_ENV=production" >> .env.production

# Restart application
docker compose -f docker-compose.production.yml restart nchat
```

### Redis Optimization

```bash
# Configure Redis for caching
docker compose -f docker-compose.production.yml exec redis \
  redis-cli CONFIG SET maxmemory 1gb
docker compose -f docker-compose.production.yml exec redis \
  redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Migration from Other Platforms

### From Slack

See [Slack Import Guide](../features/slack-import.md)

### From Discord

See [Discord Import Guide](../features/discord-import.md)

### From Mattermost

See [Mattermost Import Guide](../features/mattermost-import.md)

---

## Cost Estimation

### Hosting Costs (Monthly)

**Small Team (1-25 users):**

- Server: $24/month (DigitalOcean 4GB)
- Storage: Included
- Bandwidth: Included
- Email: Free (100/day SendGrid)
- **Total: ~$25/month**

**Medium Team (25-100 users):**

- Server: $48/month (DigitalOcean 8GB)
- Storage: $5/month (100GB)
- Bandwidth: Included
- Email: Free (100/day SendGrid)
- **Total: ~$55/month**

**Large Team (100-500 users):**

- Server: $96/month (DigitalOcean 16GB)
- Storage: $20/month (500GB)
- Bandwidth: $10/month
- Email: $30/month (SendGrid)
- **Total: ~$160/month**

**Comparison to SaaS:**

| Users | Self-Hosted | Slack     | Savings      |
| ----- | ----------- | --------- | ------------ |
| 25    | $25/mo      | $200/mo   | $2,100/year  |
| 50    | $55/mo      | $400/mo   | $4,140/year  |
| 100   | $55/mo      | $800/mo   | $8,940/year  |
| 500   | $160/mo     | $4,000/mo | $46,080/year |

---

## Next Steps

After successful installation:

1. **Complete setup wizard**: https://chat.example.com/setup
2. **Configure authentication**: Email, Google, GitHub, etc.
3. **Customize branding**: Logo, colors, theme
4. **Invite team members**: Admin panel → Users → Invite
5. **Set up integrations**: Slack, GitHub, Jira, etc.
6. **Configure backups**: Test restore procedure
7. **Enable monitoring**: Set up alerts
8. **Review security**: SSL, firewall, 2FA

---

## Resources

- **Documentation**: https://docs.nself.chat
- **GitHub**: https://github.com/yourusername/nself-chat
- **Discord Community**: https://discord.gg/nself
- **Support**: support@nself.chat
- **Security**: security@nself.chat

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
**Maintainer**: nself-chat Team
