# Subdomain Routing Guide

**Version**: 0.9.2
**Last Updated**: February 10, 2026
**Status**: Production Ready

## Overview

Subdomain routing enables shared-backend deployments where multiple frontend applications connect to centralized backend services via subdomains. This guide covers DNS, reverse proxy, SSL, and authentication configuration.

## Subdomain Architecture

### Typical Setup

```
Platform Services:
- api.example.com       → Hasura GraphQL Engine
- auth.example.com      → Nhost Auth Service
- storage.example.com   → MinIO Object Storage
- admin.example.com     → Admin Dashboard

Frontend Applications:
- chat.example.com      → nself-chat app
- notes.example.com     → Notes app
- tasks.example.com     → Tasks app
- docs.example.com      → Documentation app
```

### Routing Flow

```
User Request (chat.example.com)
    ↓
DNS Resolution (A record → IP)
    ↓
Reverse Proxy (Nginx/Traefik)
    ↓
Frontend App (port 3001)
    ↓
API Calls (api.example.com)
    ↓
Backend Services (Hasura/Auth)
```

## DNS Configuration

### Option 1: Wildcard DNS (Recommended)

**Pros:**
- Covers all subdomains automatically
- Easier to add new apps
- Single certificate for all domains

**Configuration:**

```dns
# DNS Zone File
$TTL 3600
@       IN      SOA     ns1.example.com. admin.example.com. (
                        2026021001 ; Serial
                        3600       ; Refresh
                        1800       ; Retry
                        604800     ; Expire
                        3600 )     ; Minimum TTL

; Name servers
@       IN      NS      ns1.example.com.
@       IN      NS      ns2.example.com.

; A records
@       IN      A       203.0.113.10
*       IN      A       203.0.113.10
```

**DNS Provider Examples:**

**Cloudflare:**
```
Type    Name    Content             Proxied    TTL
A       @       203.0.113.10       Yes        Auto
A       *       203.0.113.10       Yes        Auto
```

**AWS Route 53:**
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "*.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          { "Value": "203.0.113.10" }
        ]
      }
    }
  ]
}
```

**DigitalOcean:**
```bash
# Using doctl CLI
doctl compute domain records create example.com \
  --record-type A \
  --record-name "*" \
  --record-data 203.0.113.10 \
  --record-ttl 3600
```

### Option 2: Individual A Records

**Pros:**
- More control over each subdomain
- Can route to different IPs
- Explicit configuration

**Configuration:**

```dns
; Individual A records
api         IN      A       203.0.113.10
auth        IN      A       203.0.113.10
storage     IN      A       203.0.113.11  # Different server
admin       IN      A       203.0.113.10
chat        IN      A       203.0.113.20  # Different server
notes       IN      A       203.0.113.20
tasks       IN      A       203.0.113.20
```

### Option 3: CNAME Records

**Pros:**
- Easy to update (change one A record)
- Cleaner management

**Configuration:**

```dns
; Primary A record
@           IN      A       203.0.113.10

; CNAME records pointing to root
api         IN      CNAME   example.com.
auth        IN      CNAME   example.com.
storage     IN      CNAME   example.com.
chat        IN      CNAME   example.com.
notes       IN      CNAME   example.com.
```

**Note:** CNAME records cannot be used for the root domain (@).

### DNS Verification

```bash
# Check DNS propagation
dig api.example.com +short
dig auth.example.com +short
dig chat.example.com +short

# Check all nameservers
dig api.example.com @8.8.8.8 +short
dig api.example.com @1.1.1.1 +short

# Full DNS record info
dig api.example.com ANY

# Check DNS propagation globally
curl https://www.whatsmydns.net/api/query?server=world&type=A&query=api.example.com
```

## Reverse Proxy Configuration

### Nginx

**Main Configuration** (`/etc/nginx/nginx.conf`):

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

    # Include site configs
    include /etc/nginx/sites-enabled/*;
}
```

**Backend API** (`/etc/nginx/sites-available/api.example.com`):

```nginx
# Upstream definition
upstream hasura {
    least_conn;
    server localhost:8080 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    # Hasura GraphQL
    location / {
        proxy_pass http://hasura;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check
    location /healthz {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Auth Service** (`/etc/nginx/sites-available/auth.example.com`):

```nginx
upstream auth {
    server localhost:4000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name auth.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name auth.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Rate limiting (stricter for auth)
    limit_req zone=auth_limit burst=10 nodelay;

    location / {
        proxy_pass http://auth;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (for all apps)
        add_header Access-Control-Allow-Origin "https://chat.example.com" always;
        add_header Access-Control-Allow-Origin "https://notes.example.com" always;
        add_header Access-Control-Allow-Origin "https://tasks.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age "3600" always;

        if ($request_method = OPTIONS) {
            return 204;
        }

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
```

**Frontend App** (`/etc/nginx/sites-available/chat.example.com`):

```nginx
upstream chat_app {
    server localhost:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name chat.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Frontend app
    location / {
        proxy_pass http://chat_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Next.js specific
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://chat_app;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        proxy_pass http://chat_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable Sites:**

```bash
# Enable all sites
for site in api auth storage chat notes tasks; do
    sudo ln -sf /etc/nginx/sites-available/${site}.example.com /etc/nginx/sites-enabled/
done

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Traefik

**Dynamic Configuration** (`traefik/dynamic.yml`):

```yaml
http:
  routers:
    # API router
    api-router:
      rule: "Host(`api.example.com`)"
      service: hasura
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

    # Auth router
    auth-router:
      rule: "Host(`auth.example.com`)"
      service: auth
      entryPoints:
        - websecure
      middlewares:
        - auth-cors
      tls:
        certResolver: letsencrypt

    # Chat app router
    chat-router:
      rule: "Host(`chat.example.com`)"
      service: chat
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

  services:
    hasura:
      loadBalancer:
        servers:
          - url: "http://localhost:8080"

    auth:
      loadBalancer:
        servers:
          - url: "http://localhost:4000"

    chat:
      loadBalancer:
        servers:
          - url: "http://localhost:3001"

  middlewares:
    auth-cors:
      headers:
        accessControlAllowOriginList:
          - "https://chat.example.com"
          - "https://notes.example.com"
          - "https://tasks.example.com"
        accessControlAllowMethods:
          - "GET"
          - "POST"
          - "OPTIONS"
        accessControlAllowHeaders:
          - "Authorization"
          - "Content-Type"
        accessControlAllowCredentials: true
        accessControlMaxAge: 3600
```

**Static Configuration** (`traefik.yml`):

```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  file:
    filename: /traefik/dynamic.yml
    watch: true

api:
  dashboard: true
  insecure: false

log:
  level: INFO

accessLog:
  filePath: /var/log/traefik/access.log
```

### Caddy

**Caddyfile:**

```caddy
# API
api.example.com {
    reverse_proxy localhost:8080

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}

# Auth
auth.example.com {
    reverse_proxy localhost:4000

    header {
        Access-Control-Allow-Origin https://chat.example.com https://notes.example.com
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
        Access-Control-Allow-Credentials "true"
    }
}

# Chat app
chat.example.com {
    reverse_proxy localhost:3001

    encode gzip zstd

    header /_next/static/* {
        Cache-Control "public, max-age=31536000, immutable"
    }
}

# Notes app
notes.example.com {
    reverse_proxy localhost:3002
}

# Tasks app
tasks.example.com {
    reverse_proxy localhost:3003
}
```

## SSL Certificates

### Wildcard Certificate (Recommended)

**Let's Encrypt with DNS Challenge:**

```bash
# Install certbot with DNS plugin (Cloudflare example)
sudo apt-get install certbot python3-certbot-dns-cloudflare

# Create API token at https://dash.cloudflare.com/profile/api-tokens
# Permissions: Zone:DNS:Edit for all zones

# Create credentials file
sudo mkdir -p /etc/letsencrypt
sudo nano /etc/letsencrypt/cloudflare.ini
```

**Cloudflare credentials** (`/etc/letsencrypt/cloudflare.ini`):

```ini
dns_cloudflare_api_token = your_cloudflare_api_token_here
```

```bash
# Set permissions
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# Obtain wildcard certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d example.com \
  -d *.example.com \
  --email admin@example.com \
  --agree-tos \
  --non-interactive

# Verify certificate
sudo certbot certificates
```

**Auto-renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Cron job (already installed by certbot)
# Runs twice daily
cat /etc/cron.d/certbot
```

**Other DNS Providers:**

```bash
# Route 53 (AWS)
sudo apt-get install python3-certbot-dns-route53
sudo certbot certonly --dns-route53 -d example.com -d *.example.com

# DigitalOcean
sudo apt-get install python3-certbot-dns-digitalocean
sudo certbot certonly --dns-digitalocean -d example.com -d *.example.com

# Google Cloud DNS
sudo apt-get install python3-certbot-dns-google
sudo certbot certonly --dns-google -d example.com -d *.example.com
```

### Individual Certificates

```bash
# Obtain certificate for each subdomain
sudo certbot --nginx -d api.example.com
sudo certbot --nginx -d auth.example.com
sudo certbot --nginx -d storage.example.com
sudo certbot --nginx -d chat.example.com
sudo certbot --nginx -d notes.example.com
sudo certbot --nginx -d tasks.example.com

# Or all at once
sudo certbot --nginx -d api.example.com -d auth.example.com -d storage.example.com -d chat.example.com -d notes.example.com -d tasks.example.com
```

### Custom/Purchased Certificate

```bash
# Install certificate files
sudo mkdir -p /etc/ssl/certs/example.com
sudo cp fullchain.pem /etc/ssl/certs/example.com/
sudo cp privkey.pem /etc/ssl/private/example.com/

# Set permissions
sudo chmod 644 /etc/ssl/certs/example.com/fullchain.pem
sudo chmod 600 /etc/ssl/private/example.com/privkey.pem

# Update Nginx config
# ssl_certificate /etc/ssl/certs/example.com/fullchain.pem;
# ssl_certificate_key /etc/ssl/private/example.com/privkey.pem;
```

## Auth Cookie Domain

### Shared Cookie Domain (SSO)

**Configuration for SSO across subdomains:**

```typescript
// src/config/auth.config.ts
export const authConfig = {
  // Cookie configuration
  cookie: {
    // Set domain to allow sharing across all subdomains
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.example.com',

    // Cookie name (shared across apps)
    name: 'auth_token',

    // Security settings
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,  // 'lax' allows cross-subdomain

    // Expiration (7 days)
    maxAge: 7 * 24 * 60 * 60 * 1000,

    // Path
    path: '/',
  },
}
```

**Setting cookie on login:**

```typescript
// src/services/auth/auth.service.ts
import { authConfig } from '@/config/auth.config'

export function setAuthCookie(response: Response, token: string) {
  response.cookie(
    authConfig.cookie.name,
    token,
    {
      domain: authConfig.cookie.domain,
      httpOnly: authConfig.cookie.httpOnly,
      secure: authConfig.cookie.secure,
      sameSite: authConfig.cookie.sameSite,
      maxAge: authConfig.cookie.maxAge,
      path: authConfig.cookie.path,
    }
  )
}
```

**Reading cookie in apps:**

```typescript
// Any app can read the shared cookie
import { cookies } from 'next/headers'
import { authConfig } from '@/config/auth.config'

export async function getAuthToken() {
  const cookieStore = cookies()
  const token = cookieStore.get(authConfig.cookie.name)
  return token?.value
}
```

### Per-App Cookies (No SSO)

If you want separate authentication per app:

```typescript
export const authConfig = {
  cookie: {
    // Specific domain (no leading dot)
    domain: 'chat.example.com',  // Only works on this subdomain
    name: 'chat_auth_token',     // Different name per app
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,  // Strict isolation
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  },
}
```

### Cookie Security Best Practices

```typescript
// src/middleware.ts - Verify cookie domain
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Verify cookie is for correct domain
  if (!hostname.endsWith('.example.com')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}
```

## CORS Configuration

### Backend CORS (Multiple Origins)

**Hasura** (`.backend/.env`):

```bash
# Comma-separated list of allowed origins
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com,https://notes.example.com,https://tasks.example.com

# Allow credentials (cookies)
HASURA_GRAPHQL_ENABLE_TELEMETRY=false
```

**Nhost Auth** (`.backend/.env`):

```bash
# Multiple redirect URIs
AUTH_CLIENT_URL=https://auth.example.com
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback,https://notes.example.com/auth/callback,https://tasks.example.com/auth/callback

# Allowed origins for CORS
AUTH_CORS_ALLOWED_ORIGINS=https://chat.example.com,https://notes.example.com,https://tasks.example.com
```

### Frontend CORS

**Next.js Configuration** (`next.config.mjs`):

```javascript
const allowedOrigins = [
  'https://api.example.com',
  'https://auth.example.com',
  'https://storage.example.com',
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(','),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

## Testing

### DNS Testing

```bash
# Check all subdomains resolve
for subdomain in api auth storage chat notes tasks; do
    echo -n "$subdomain.example.com: "
    dig +short $subdomain.example.com
done

# Check from different DNS servers
dig @8.8.8.8 api.example.com +short
dig @1.1.1.1 api.example.com +short
dig @208.67.222.222 api.example.com +short
```

### SSL Testing

```bash
# Check certificate
openssl s_client -connect api.example.com:443 -servername api.example.com

# Check certificate details
echo | openssl s_client -connect api.example.com:443 2>/dev/null | openssl x509 -noout -text

# Test SSL configuration
curl -vI https://api.example.com
```

### Routing Testing

```bash
# Test backend services
curl https://api.example.com/healthz
curl https://auth.example.com/healthz

# Test CORS
curl -H "Origin: https://chat.example.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.example.com/v1/graphql

# Test authentication
curl -X POST https://auth.example.com/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
```

### Cookie Testing

```bash
# Test cookie setting
curl -c cookies.txt https://auth.example.com/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'

# Check cookie contents
cat cookies.txt

# Test cookie sharing between subdomains
curl -b cookies.txt https://chat.example.com/api/profile
curl -b cookies.txt https://notes.example.com/api/profile
```

## Troubleshooting

### Issue: DNS not resolving

```bash
# Check DNS propagation
dig api.example.com +trace

# Flush local DNS cache
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns
```

### Issue: SSL certificate errors

```bash
# Check certificate validity
curl -vI https://api.example.com 2>&1 | grep -i certificate

# Renew certificate
sudo certbot renew --force-renewal

# Check certificate chain
openssl s_client -connect api.example.com:443 -showcerts
```

### Issue: CORS errors

```bash
# Check CORS headers
curl -I -X OPTIONS https://api.example.com/v1/graphql \
     -H "Origin: https://chat.example.com"

# Verify Nginx configuration
sudo nginx -t
sudo grep -r "Access-Control" /etc/nginx/sites-enabled/
```

### Issue: Cookie not shared across subdomains

```javascript
// Verify cookie domain in browser console
document.cookie.split(';').forEach(cookie => console.log(cookie))

// Check cookie attributes
// Should show: domain=.example.com
```

## Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN Cookies Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

**Related Guides:**
- [Standalone Deployment](./Standalone-Deployment.md)
- [Shared-Backend Deployment](./Shared-Backend-Deployment.md)
- [Environment Variables](./Environment-Variables.md)
