# Docker Deployment Guide

This guide covers building and running nself-chat using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Building Images](#building-images)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10 or later
- Docker Compose v2 or later
- 4GB RAM minimum (8GB recommended)
- 10GB disk space

## Quick Start

### Local Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f nchat

# Stop services
docker compose down
```

The application will be available at:
- **Application**: http://localhost:3000
- **Hasura Console**: http://localhost:8080
- **Mailpit**: http://localhost:8025
- **MinIO Console**: http://localhost:9001

### Default Credentials (Development)

| Service | Username | Password |
|---------|----------|----------|
| Hasura | - | `nself-admin-secret` |
| MinIO | `minio` | `minio123` |
| PostgreSQL | `postgres` | `postgres` |

## Building Images

### Production Build

```bash
# Build with default tag (latest)
./scripts/docker-build.sh

# Build with specific tag
./scripts/docker-build.sh --tag v1.0.0

# Build and push to registry
./scripts/docker-build.sh --tag v1.0.0 --push

# Build for multiple platforms
./scripts/docker-build.sh --platform linux/amd64,linux/arm64
```

### Development Build

```bash
# Build development image
./scripts/docker-build.sh --dev
```

### Build Arguments

The Dockerfile accepts these build arguments:

| Argument | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL endpoint URL | - |
| `NEXT_PUBLIC_AUTH_URL` | Auth service URL | - |
| `NEXT_PUBLIC_STORAGE_URL` | Storage service URL | - |
| `NEXT_PUBLIC_APP_NAME` | Application name | `nchat` |
| `NEXT_PUBLIC_ENV` | Environment name | `production` |

Example:

```bash
docker build \
  --build-arg NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql \
  --build-arg NEXT_PUBLIC_AUTH_URL=https://auth.example.com \
  -t nself-chat:custom .
```

## Local Development

### docker-compose.yml

The development compose file includes:

- **nchat**: Next.js application with hot-reload
- **postgres**: PostgreSQL 16 database
- **hasura**: Hasura GraphQL Engine
- **auth**: Nhost authentication service
- **storage**: MinIO S3-compatible storage
- **redis**: Redis cache
- **mailpit**: Email testing server

### Volume Mounts

Development uses volume mounts for hot-reload:

```yaml
volumes:
  - .:/app
  - /app/node_modules    # Exclude node_modules
  - /app/.next           # Exclude build output
```

### Environment Variables

Copy the example environment file:

```bash
cp docker/.env.example docker/.env
```

Key variables:

```bash
# Development mode
NEXT_PUBLIC_USE_DEV_AUTH=true

# Auto-reload
WATCHPACK_POLLING=true
```

## Production Deployment

### docker-compose.prod.yml

Production compose includes security hardening:

- Non-root user
- Read-only filesystem
- Resource limits
- Health checks
- Logging configuration

```bash
# Start production stack
docker compose -f docker-compose.prod.yml up -d

# With environment file
docker compose -f docker-compose.prod.yml --env-file docker/.env.production up -d
```

### Environment Variables

Required production variables:

```bash
# Database
POSTGRES_USER=nchat
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=nchat

# Hasura
HASURA_ADMIN_SECRET=<secure-secret>
HASURA_JWT_SECRET='{"type":"HS256","key":"<32-char-secret>"}'

# Redis
REDIS_PASSWORD=<secure-password>

# SMTP
SMTP_HOST=smtp.example.com
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
```

### SSL/TLS

For production, configure SSL certificates:

1. Create SSL directory:
   ```bash
   mkdir -p docker/ssl
   ```

2. Add certificates:
   ```bash
   docker/ssl/cert.pem
   docker/ssl/key.pem
   ```

3. Nginx will automatically use these certificates.

### Scaling

Scale the application:

```bash
# Scale to 3 replicas
docker compose -f docker-compose.prod.yml up -d --scale nchat=3
```

## Configuration

### Nginx Configuration

The `docker/nginx.conf` provides:

- SSL termination
- Rate limiting
- Gzip compression
- Security headers
- WebSocket support
- Static asset caching

Customize rate limits:

```nginx
# Adjust rate limits
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

### Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Logging

Configure logging driver:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

For centralized logging, use:

```yaml
logging:
  driver: "fluentd"
  options:
    fluentd-address: "localhost:24224"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs nchat

# Check container status
docker compose ps

# Inspect container
docker inspect nchat-dev
```

### Database Connection Issues

```bash
# Verify postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U postgres -d nchat
```

### Build Failures

```bash
# Clean build cache
docker builder prune

# Rebuild without cache
./scripts/docker-build.sh --no-cache
```

### Memory Issues

Increase Docker memory limit (Docker Desktop):
- Settings > Resources > Memory > 8GB

### Hot Reload Not Working

Enable polling in development:

```bash
WATCHPACK_POLLING=true
```

Or in docker-compose.yml:

```yaml
environment:
  - WATCHPACK_POLLING=true
```

### Permission Issues

If you encounter permission errors:

```bash
# Fix ownership
sudo chown -R $(id -u):$(id -g) .

# Or run as specific user
docker compose exec --user 1001 nchat sh
```

## Image Size Optimization

The production image is optimized:

| Stage | Purpose | Size |
|-------|---------|------|
| deps | Install dependencies | ~800MB |
| builder | Build application | ~1.2GB |
| runner | Production image | ~200MB |

Further optimization:
- Use `output: 'standalone'` in next.config.js
- Minimize dependencies
- Use multi-stage builds

## Security Considerations

1. **Never commit secrets** to docker-compose files
2. **Use secrets management** (Docker Secrets, Vault)
3. **Scan images** for vulnerabilities
4. **Run as non-root** user
5. **Use read-only** filesystems where possible
6. **Limit resources** to prevent DoS
7. **Keep images updated** with security patches

## Related Documentation

- [Kubernetes Deployment](./Kubernetes.md)
- [Helm Deployment](./Helm.md)
