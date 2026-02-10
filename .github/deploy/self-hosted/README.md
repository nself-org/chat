# Self-Hosted Deployment

Complete self-hosted deployment setup for nself-chat with one-line installation.

## Quick Start

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | bash
```

That's it! The installer will:

- Install Docker and Docker Compose
- Download and configure nself-chat
- Set up SSL with Let's Encrypt
- Configure automatic backups
- Start all services

## Documentation

- **[Complete Deployment Guide](../../docs/guides/deployment/self-hosted.md)** - Comprehensive installation guide
- **[Troubleshooting Guide](../../docs/guides/deployment/self-hosted-troubleshooting.md)** - Common issues and solutions
- **[Production Deployment](../../docs/guides/deployment/production-deployment.md)** - Production best practices

## Files in This Directory

```
deploy/
├── nginx/                          # Nginx reverse proxy configuration
│   ├── nginx.conf                 # Main nginx config
│   └── conf.d/
│       └── nchat.conf             # Virtual host with SSL
├── postgres/                       # PostgreSQL configuration
│   ├── postgresql.conf            # Optimized settings
│   └── init-scripts/
│       └── 01-init.sql            # Initial setup
├── monitoring/                     # Monitoring stack
│   ├── prometheus/
│   │   └── prometheus.yml        # Metrics collection
│   ├── grafana/
│   │   ├── provisioning/         # Auto-provisioning
│   │   └── dashboards/           # Pre-built dashboards
│   ├── loki/                     # Log aggregation
│   ├── promtail/                 # Log shipping
│   └── alertmanager/             # Alert routing
└── self-hosted/
    └── README.md                  # This file
```

## Architecture

```
                    ┌─────────────────┐
                    │   Internet      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx (SSL)    │
                    │  Port 80/443    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
    │ Next.js  │      │  Hasura    │     │   Auth     │
    │  :3000   │      │   :8080    │     │   :4000    │
    └────┬─────┘      └─────┬──────┘     └─────┬──────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │     :5432       │
                   └─────────────────┘
```

## Scripts

### Installation

```bash
# Interactive installation
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | bash

# Non-interactive (automation)
curl -fsSL https://raw.githubusercontent.com/yourusername/nself-chat/main/scripts/self-hosted-install.sh | \
  DOMAIN=chat.example.com \
  SSL_EMAIL=admin@example.com \
  ADMIN_EMAIL=admin@example.com \
  COMPANY_NAME="Acme Inc" \
  bash -s -- --non-interactive
```

### Management

```bash
# Update to latest version
sudo /usr/local/bin/update-nchat

# Create backup
sudo /usr/local/bin/backup-nchat

# Run diagnostics
sudo /usr/local/bin/diagnose-nchat

# Check service status
cd /opt/nself-chat
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart services
docker compose -f docker-compose.production.yml restart
```

## Requirements

### Minimum

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB
- **OS**: Ubuntu 20.04+ (or compatible)
- **Network**: 100 Mbps
- **Domain**: Required for SSL

### Recommended

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 50+ GB SSD
- **Network**: 1 Gbps
- **Backup**: Offsite backup solution

## Configuration

### Environment Variables

All configuration is done via `.env.production`:

```bash
# Copy example configuration
cp .env.production.example .env.production

# Edit configuration
nano .env.production

# Required settings:
DOMAIN=chat.example.com
SSL_EMAIL=admin@example.com
POSTGRES_PASSWORD=strong_password_here
HASURA_ADMIN_SECRET=strong_secret_here
```

See [.env.production.example](../../.env.production.example) for all available options.

### SMTP Setup

Email is required for password resets and invitations. Configure in `.env.production`:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
SMTP_FROM=noreply@chat.example.com
```

**Recommended providers:**

- SendGrid (100/day free)
- Mailgun (5,000/month free)
- AWS SES (62,000/month free with EC2)

### SSL Configuration

SSL is automatically configured via Let's Encrypt. Manual setup:

```bash
# Obtain certificate
sudo certbot certonly --standalone \
  -d chat.example.com \
  --email admin@example.com \
  --agree-tos

# Auto-renewal is configured automatically
sudo systemctl enable certbot.timer
```

## Monitoring (Optional)

Enable comprehensive monitoring with Grafana and Prometheus:

```bash
# Enable during installation
ENABLE_MONITORING=true ./scripts/self-hosted-install.sh

# Or manually enable
cd /opt/nself-chat
docker compose -f docker-compose.production.yml \
               -f docker-compose.monitoring.yml up -d
```

**Access dashboards:**

- Grafana: https://chat.example.com/grafana
- Prometheus: https://chat.example.com/prometheus

**Default credentials:**

- Username: admin
- Password: admin (change on first login)

## Backup and Restore

### Automatic Backups

Backups run daily at 2 AM and are kept for 30 days:

```bash
# Backups stored in
/var/backups/nself-chat/

# View backups
ls -lh /var/backups/nself-chat/
```

### Manual Backup

```bash
# Create backup
sudo /usr/local/bin/backup-nchat

# Backup includes:
# - Database dump
# - Uploaded files
# - Configuration
```

### Restore

```bash
# Restore from backup
cd /opt/nself-chat

# Stop services
docker compose -f docker-compose.production.yml down

# Restore database
gunzip < /var/backups/nself-chat/db-TIMESTAMP.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres nchat

# Restore uploads
tar xzf /var/backups/nself-chat/uploads-TIMESTAMP.tar.gz -C /

# Start services
docker compose -f docker-compose.production.yml up -d
```

## Updates

### Automatic Updates

```bash
# Update to latest version
sudo /usr/local/bin/update-nchat

# Update to specific version
sudo /usr/local/bin/update-nchat v1.0.1
```

The update script:

- Creates automatic backup
- Pulls latest code
- Updates Docker images
- Runs database migrations
- Restarts services
- Verifies update

### Manual Update

```bash
cd /opt/nself-chat

# Backup first
sudo /usr/local/bin/backup-nchat

# Pull latest
git fetch --tags
git checkout $(git describe --tags `git rev-list --tags --max-count=1`)

# Rebuild
docker compose -f docker-compose.production.yml build --no-cache

# Restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

## Troubleshooting

### Quick Checks

```bash
# Check service health
docker compose -f docker-compose.production.yml ps

# Check logs
docker compose -f docker-compose.production.yml logs --tail=100 | grep -i error

# Run diagnostics
sudo /usr/local/bin/diagnose-nchat

# Test application
curl -I https://chat.example.com/api/health
```

### Common Issues

**Services won't start:**

```bash
# Check port conflicts
sudo netstat -tulpn | grep -E ':(80|443|3000|5432)'

# Restart Docker
sudo systemctl restart docker

# Restart services
docker compose -f docker-compose.production.yml restart
```

**SSL errors:**

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Restart nginx
docker compose -f docker-compose.production.yml restart nginx
```

**Database issues:**

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

See [Troubleshooting Guide](../../docs/guides/deployment/self-hosted-troubleshooting.md) for detailed solutions.

## Security

### Essential Steps

1. **Change default passwords**

   ```bash
   # Generate strong passwords
   openssl rand -base64 32

   # Update .env.production
   nano .env.production
   ```

2. **Enable firewall**

   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Set up fail2ban**

   ```bash
   sudo apt-get install -y fail2ban
   ```

4. **Regular updates**

   ```bash
   # System updates
   sudo apt-get update && sudo apt-get upgrade -y

   # Application updates
   sudo /usr/local/bin/update-nchat
   ```

### Advanced Security

- Enable 2FA in admin panel
- Configure IP whitelisting for admin areas
- Set up DDoS protection (Cloudflare)
- Enable database encryption
- Regular security audits

## Performance Tuning

### Database Optimization

PostgreSQL is pre-configured for an 8GB server. Adjust for your specs:

```bash
# Edit PostgreSQL config
nano /opt/nself-chat/deploy/postgres/postgresql.conf

# Key settings (for 8GB RAM):
shared_buffers = 2GB           # 25% of RAM
effective_cache_size = 6GB     # 75% of RAM

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

### Application Optimization

```bash
# Increase Node.js memory
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env.production

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

## Cost Estimation

### Small Team (1-25 users)

- Server: $24/month (DigitalOcean 4GB)
- Storage: Included
- Total: ~$25/month

### Medium Team (25-100 users)

- Server: $48/month (DigitalOcean 8GB)
- Storage: $5/month
- Total: ~$55/month

### Large Team (100-500 users)

- Server: $96/month (DigitalOcean 16GB)
- Storage: $20/month
- Email: $30/month
- Total: ~$160/month

**Comparison:** Self-hosting saves 80-90% vs Slack/Microsoft Teams.

## Support

- **Documentation**: https://docs.nself.chat
- **GitHub Issues**: https://github.com/yourusername/nself-chat/issues
- **Community Discord**: https://discord.gg/nself
- **Email Support**: support@nself.chat

## License

nself-chat is open source software licensed under the [MIT License](../../LICENSE).

---

**Made with ❤️ by the nself team**
