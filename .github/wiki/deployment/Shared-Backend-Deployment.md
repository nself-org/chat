# Shared-Backend Deployment Guide

**Version**: 0.9.2
**Last Updated**: February 10, 2026
**Status**: Production Ready

## Overview

Shared-backend deployment means multiple frontend applications share a single nSelf backend infrastructure. This is the most cost-effective deployment model for organizations running multiple apps.

**Recommended For:**
- Organizations with multiple apps (chat, notes, tasks, etc.)
- Cost optimization (shared infrastructure)
- Unified data and user management
- Enterprise deployments
- Multi-tenant SaaS platforms

**Not Recommended For:**
- Single application deployments
- Independent teams requiring full isolation
- Simple use cases (use standalone instead)

## Architecture

```
Platform Infrastructure (Shared):
┌─────────────────────────────────────────┐
│ api.example.com                         │
│   ├── Hasura GraphQL Engine            │
│   ├── PostgreSQL Database              │
│   └── Redis Cache                      │
├─────────────────────────────────────────┤
│ auth.example.com                        │
│   └── Nhost Auth Service               │
├─────────────────────────────────────────┤
│ storage.example.com                     │
│   └── MinIO Object Storage             │
└─────────────────────────────────────────┘

Frontend Applications (Separate):
┌─────────────────────────────────────────┐
│ chat.example.com                        │
│   └── nself-chat (Next.js)             │
├─────────────────────────────────────────┤
│ notes.example.com                       │
│   └── notes-app (Next.js)              │
├─────────────────────────────────────────┤
│ tasks.example.com                       │
│   └── tasks-app (Next.js)              │
└─────────────────────────────────────────┘
```

## Shared Services

### Core Services (Required)

1. **PostgreSQL Database**
   - Shared data store for all apps
   - Schema-based isolation per app
   - Row-level security (RLS) for data separation

2. **Hasura GraphQL Engine**
   - Unified GraphQL API
   - Per-app permissions
   - Real-time subscriptions

3. **Nhost Auth**
   - Centralized authentication
   - Single sign-on (SSO) support
   - Shared user accounts

### Optional Services

4. **Redis**
   - Session storage
   - Rate limiting
   - Cache layer

5. **MinIO (S3-compatible)**
   - File storage
   - Per-app buckets
   - Shared media assets

6. **MeiliSearch**
   - Full-text search
   - Per-app indexes

## Prerequisites

### Infrastructure Requirements

- **Server**: 8GB RAM minimum (16GB recommended)
- **CPU**: 4 cores minimum (8 cores recommended)
- **Storage**: 100GB SSD minimum
- **Network**: Static IP address
- **DNS**: Wildcard DNS or multiple A records

### Software Requirements

- Docker 24.0+
- Docker Compose 2.20+
- nSelf CLI 0.4.2+
- Nginx or Traefik (reverse proxy)
- Let's Encrypt (SSL certificates)

## Backend Setup

### Step 1: Deploy Shared nSelf Backend

```bash
# Clone backend repository
git clone https://github.com/yourusername/nself-backend.git
cd nself-backend

# Install nSelf CLI
npm install -g @nself/cli@latest

# Initialize with all services
nself init --demo
```

### Step 2: Configure for Multi-App

Edit `.backend/.env`:

```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=shared_backend
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=your_admin_secret
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"your_jwt_secret_min_32_chars"}
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com,https://notes.example.com,https://tasks.example.com

# Auth - Multiple redirect URIs
AUTH_CLIENT_URL=https://auth.example.com
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback,https://notes.example.com/auth/callback,https://tasks.example.com/auth/callback
AUTH_SERVER_URL=http://auth:4000

# Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_password

# Redis (optional)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Step 3: Setup Database Schemas

Create schemas for each app:

```sql
-- Connect to PostgreSQL
psql -h localhost -U postgres -d shared_backend

-- Create schemas
CREATE SCHEMA IF NOT EXISTS nchat;
CREATE SCHEMA IF NOT EXISTS notes;
CREATE SCHEMA IF NOT EXISTS tasks;

-- Grant permissions
GRANT ALL ON SCHEMA nchat TO postgres;
GRANT ALL ON SCHEMA notes TO postgres;
GRANT ALL ON SCHEMA tasks TO postgres;
```

### Step 4: Configure Hasura Permissions

**Per-App Role Isolation:**

```yaml
# hasura/metadata/tables.yaml
- table:
    schema: nchat
    name: messages
  select_permissions:
    - role: nchat_user
      permission:
        columns: "*"
        filter:
          user_id:
            _eq: X-Hasura-User-Id
    - role: notes_user
      permission:
        columns: []
        filter: {}  # No access

- table:
    schema: notes
    name: documents
  select_permissions:
    - role: notes_user
      permission:
        columns: "*"
        filter:
          user_id:
            _eq: X-Hasura-User-Id
    - role: nchat_user
      permission:
        columns: []
        filter: {}  # No access
```

### Step 5: Start Backend Services

```bash
# Start all services
nself start

# Verify services
nself status

# Check logs
nself logs hasura
nself logs auth
```

**Expected Output:**
```
✓ PostgreSQL     Running     Port 5432
✓ Hasura         Running     Port 8080
✓ Auth           Running     Port 4000
✓ MinIO          Running     Port 9000
✓ Redis          Running     Port 6379
✓ Admin          Running     Port 3021
```

## Subdomain Routing

### Step 1: DNS Configuration

**Option A: Wildcard DNS (Recommended)**

```
Type    Name    Value                   TTL
A       @       your.server.ip.address  3600
A       *       your.server.ip.address  3600
```

This creates:
- `api.example.com`
- `auth.example.com`
- `storage.example.com`
- `chat.example.com`
- `notes.example.com`
- `tasks.example.com`

**Option B: Individual A Records**

```
Type    Name        Value                   TTL
A       api         your.server.ip.address  3600
A       auth        your.server.ip.address  3600
A       storage     your.server.ip.address  3600
A       chat        your.server.ip.address  3600
A       notes       your.server.ip.address  3600
A       tasks       your.server.ip.address  3600
```

### Step 2: Nginx Configuration

**Main Config** (`/etc/nginx/nginx.conf`):

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Include site configs
    include /etc/nginx/sites-enabled/*;
}
```

**Backend API** (`/etc/nginx/sites-available/api.example.com`):

```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Hasura GraphQL
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Auth Service** (`/etc/nginx/sites-available/auth.example.com`):

```nginx
server {
    listen 80;
    server_name auth.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Auth service
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for auth
        add_header Access-Control-Allow-Origin "https://chat.example.com" always;
        add_header Access-Control-Allow-Origin "https://notes.example.com" always;
        add_header Access-Control-Allow-Origin "https://tasks.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}
```

**Storage Service** (`/etc/nginx/sites-available/storage.example.com`):

```nginx
server {
    listen 80;
    server_name storage.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name storage.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # MinIO S3
    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS for storage
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
    }
}
```

**Enable Sites:**

```bash
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/auth.example.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/storage.example.com /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: SSL Certificates

**Wildcard Certificate (Recommended):**

```bash
# Install certbot with DNS plugin (example: Cloudflare)
sudo apt-get install certbot python3-certbot-dns-cloudflare

# Create credentials file
sudo nano /etc/letsencrypt/cloudflare.ini
# Add:
# dns_cloudflare_api_token = your_cloudflare_api_token

sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# Obtain wildcard certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com \
  -d *.example.com

# Auto-renewal is configured automatically
```

**Individual Certificates:**

```bash
# Obtain certificate for each subdomain
sudo certbot --nginx -d api.example.com
sudo certbot --nginx -d auth.example.com
sudo certbot --nginx -d storage.example.com
```

## App Deployment

### App #1: nself-chat

**Environment Variables** (`.env.local`):

```bash
# Shared backend URLs
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage

# App-specific
NEXT_PUBLIC_APP_NAME=nself-chat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
NEXT_PUBLIC_ENV=production

# App role (for Hasura permissions)
NEXT_PUBLIC_APP_ROLE=nchat_user
```

**Deploy to Vercel:**

```bash
# From nself-chat directory
vercel --prod

# Configure domain
# Vercel Dashboard → Domains → Add chat.example.com
```

**Nginx Config** (`/etc/nginx/sites-available/chat.example.com`):

```nginx
server {
    listen 80;
    server_name chat.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Frontend app
    location / {
        proxy_pass http://localhost:3001;  # Different port per app
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### App #2: Notes App

**Environment Variables:**

```bash
# Shared backend URLs (same as chat)
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage

# App-specific
NEXT_PUBLIC_APP_NAME=notes
NEXT_PUBLIC_PRIMARY_COLOR=#10b981
NEXT_PUBLIC_ENV=production

# App role
NEXT_PUBLIC_APP_ROLE=notes_user
```

**Nginx Config** (`/etc/nginx/sites-available/notes.example.com`):

```nginx
server {
    listen 80;
    server_name notes.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name notes.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;  # Different port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### App #3: Tasks App

Similar configuration with `tasks_user` role and port 3003.

## Auth Configuration

### Multiple Redirect URIs

Update Auth service to allow all app callbacks:

```bash
# .backend/.env
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback,https://notes.example.com/auth/callback,https://tasks.example.com/auth/callback
```

### Cookie Domain Configuration

**Shared Cookie Domain** (allows SSO):

```typescript
// In each app's auth configuration
export const authConfig = {
  cookieDomain: '.example.com',  // Works for all *.example.com
  cookieName: 'shared_auth_token',
  cookieSecure: true,
  cookieHttpOnly: true,
  cookieSameSite: 'strict',
}
```

**Benefits:**
- Single sign-on (SSO) across all apps
- User logs in once, authenticated everywhere
- Shared session management

**Implementation** (`src/config/auth.config.ts`):

```typescript
import { CookieOptions } from 'express'

export const cookieConfig: CookieOptions = {
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.example.com',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie('auth_token', token, cookieConfig)
}
```

### CORS Configuration

**Multiple Origins:**

```typescript
// Backend CORS configuration
const allowedOrigins = [
  'https://chat.example.com',
  'https://notes.example.com',
  'https://tasks.example.com',
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))
```

**Hasura CORS** (`.backend/.env`):

```bash
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com,https://notes.example.com,https://tasks.example.com
```

## Database Isolation

### Schema-Based Isolation

Each app uses its own PostgreSQL schema:

```sql
-- App schemas
CREATE SCHEMA nchat;
CREATE SCHEMA notes;
CREATE SCHEMA tasks;

-- Tables in separate schemas
CREATE TABLE nchat.messages (...);
CREATE TABLE notes.documents (...);
CREATE TABLE tasks.items (...);
```

### Row-Level Security (RLS)

Enforce data isolation at database level:

```sql
-- Enable RLS
ALTER TABLE nchat.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY user_isolation_policy ON nchat.messages
  FOR ALL
  USING (user_id = current_setting('hasura.user_id')::uuid);

CREATE POLICY user_isolation_policy ON notes.documents
  FOR ALL
  USING (user_id = current_setting('hasura.user_id')::uuid);
```

### Per-App User Namespacing

Add app context to user sessions:

```typescript
// JWT claims
interface JWTClaims {
  'https://hasura.io/jwt/claims': {
    'x-hasura-allowed-roles': string[]
    'x-hasura-default-role': string
    'x-hasura-user-id': string
    'x-hasura-app-context': string  // 'nchat' | 'notes' | 'tasks'
  }
}

// Set on login
const claims = {
  'https://hasura.io/jwt/claims': {
    'x-hasura-allowed-roles': ['nchat_user'],
    'x-hasura-default-role': 'nchat_user',
    'x-hasura-user-id': user.id,
    'x-hasura-app-context': 'nchat',
  },
}
```

## Cost Comparison

### Standalone vs Shared-Backend

**3 Apps Scenario:**

**Standalone (3 separate backends):**

| Service | Unit Cost | Quantity | Total |
|---------|-----------|----------|-------|
| Frontend (Vercel) | $20/mo | 3 | $60/mo |
| Backend (DigitalOcean) | $24/mo | 3 | $72/mo |
| Database (Managed) | $15/mo | 3 | $45/mo |
| Storage | $5/mo | 3 | $15/mo |
| **Total** | | | **$192/month** |

**Shared-Backend:**

| Service | Unit Cost | Quantity | Total |
|---------|-----------|----------|-------|
| Frontend (Vercel) | $20/mo | 3 | $60/mo |
| Backend (DigitalOcean 8GB) | $48/mo | 1 | $48/mo |
| Database (Managed) | $30/mo | 1 | $30/mo |
| Storage | $10/mo | 1 | $10/mo |
| **Total** | | | **$148/month** |

**Savings: $44/month (23% reduction)**

## Scaling Strategies

### Horizontal Scaling

**Load Balancer + Multiple Frontend Instances:**

```nginx
# Nginx load balancer
upstream chat_app {
    least_conn;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 443 ssl http2;
    server_name chat.example.com;

    location / {
        proxy_pass http://chat_app;
    }
}
```

**Backend Scaling:**

```yaml
# Kubernetes HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hasura-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hasura
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling

**Read Replicas:**

```yaml
# PostgreSQL read replicas
primary:
  host: db-primary.example.com
  port: 5432

replicas:
  - host: db-replica-1.example.com
    port: 5432
  - host: db-replica-2.example.com
    port: 5432
```

**Connection Pooling:**

```bash
# PgBouncer configuration
[databases]
shared_backend = host=localhost port=5432 dbname=shared_backend

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

## Security Considerations

### Tenant Isolation

1. **Schema-level separation**: Each app in separate schema
2. **RLS policies**: Enforce at database level
3. **JWT app context**: Include app ID in tokens
4. **Hasura permissions**: Per-app role restrictions

### Network Security

```bash
# Firewall rules (ufw example)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Restrict backend ports to localhost only
sudo ufw deny 5432  # PostgreSQL
sudo ufw deny 8080  # Hasura
sudo ufw deny 4000  # Auth
```

### Secrets Management

Use environment-specific secrets:

```bash
# Backend secrets
POSTGRES_PASSWORD=<strong-password>
HASURA_GRAPHQL_ADMIN_SECRET=<random-32-chars>
JWT_SECRET=<random-64-chars>

# Rotate secrets regularly (quarterly)
```

### Rate Limiting

```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /v1/graphql {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:8080;
    }
}
```

## Monitoring

### Service Health Checks

```bash
# Backend health
curl https://api.example.com/healthz

# Auth health
curl https://auth.example.com/healthz

# App health
curl https://chat.example.com/api/health
```

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hasura'
    static_configs:
      - targets: ['localhost:8080']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']  # postgres_exporter

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']  # nginx_exporter
```

### Grafana Dashboards

Pre-configured dashboards:
- PostgreSQL metrics
- Hasura query performance
- Nginx traffic
- Application errors

## Troubleshooting

### Issue: Apps can't authenticate

**Symptoms:** Login fails, 401 errors

**Solutions:**

1. Check redirect URIs
   ```bash
   # Verify in .backend/.env
   echo $AUTH_REDIRECT_URL
   ```

2. Verify cookie domain
   ```javascript
   // Check in browser console
   document.cookie
   ```

3. Check CORS configuration
   ```bash
   curl -I https://auth.example.com/v1/auth
   ```

### Issue: Cross-app data leakage

**Symptoms:** User sees data from other apps

**Solutions:**

1. Verify RLS policies
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'messages';
   ```

2. Check Hasura permissions
   ```bash
   # Hasura Console → Data → Table → Permissions
   ```

3. Verify JWT app context
   ```typescript
   // Decode JWT and check claims
   const decoded = jwt.decode(token)
   console.log(decoded['x-hasura-app-context'])
   ```

### Issue: Performance degradation

**Symptoms:** Slow queries, timeouts

**Solutions:**

1. Check database connections
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. Enable connection pooling (PgBouncer)

3. Add database indexes
   ```sql
   CREATE INDEX idx_messages_user_id ON nchat.messages(user_id);
   ```

## Migration Guide

### From Standalone to Shared-Backend

**Step 1: Backup existing data**

```bash
# Backup each standalone database
pg_dump -h localhost -U postgres app1_db > app1_backup.sql
pg_dump -h localhost -U postgres app2_db > app2_backup.sql
```

**Step 2: Create schemas in shared database**

```sql
CREATE SCHEMA app1;
CREATE SCHEMA app2;
```

**Step 3: Restore data to schemas**

```bash
# Restore with schema prefix
psql -h localhost -U postgres shared_backend < app1_backup.sql
```

**Step 4: Update app configurations**

Change environment variables to point to shared backend.

**Step 5: Test thoroughly**

Verify data isolation and authentication.

## Next Steps

1. **Setup Monitoring**: [Monitoring.md](../operations/Monitoring.md)
2. **Configure Backups**: [Backup-Strategy.md](../operations/Backup-Strategy.md)
3. **Review Security**: [Security-Checklist.md](../security/Security-Checklist.md)

## Resources

- [Subdomain Routing Guide](./Subdomain-Routing.md)
- [Environment Variables Guide](./Environment-Variables.md)
- [Deployment Comparison](./Deployment-Comparison.md)
- [nSelf Multi-Tenant Docs](https://nself.dev/docs/multi-tenant)

---

**Need Help?**
- GitHub Issues: https://github.com/yourusername/nself-chat/issues
- Community Discord: https://discord.gg/nself
