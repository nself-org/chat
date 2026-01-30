# Installation Guide

This guide covers all installation options for nchat, from development setup to production deployment.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Install](#quick-install)
- [Manual Installation](#manual-installation)
- [Docker Installation](#docker-installation)
- [Production Setup](#production-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 10 GB | 50+ GB |
| Node.js | 18.x | 20.x LTS |
| Docker | 20.x | Latest |

### Supported Operating Systems

| OS | Support Level |
|----|---------------|
| macOS 12+ | Full |
| Ubuntu 20.04+ | Full |
| Debian 11+ | Full |
| Windows 10+ (WSL2) | Full |
| Other Linux | Community |

## Quick Install

For a quick development setup:

```bash
# Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# Run setup script
./scripts/setup.sh
```

The setup script will:
1. Check system requirements
2. Install dependencies
3. Initialize the backend
4. Create configuration files
5. Start development services

## Manual Installation

### Step 1: Install nself CLI

The nself CLI provides the backend infrastructure.

```bash
# Install via curl
curl -fsSL https://nself.io/install.sh | bash

# Or via npm
npm install -g @nself/cli

# Verify installation
nself --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/nself/nself-chat.git
cd nself-chat
```

### Step 3: Install Node Dependencies

```bash
# Using npm
npm install

# Or using pnpm
pnpm install

# Or using yarn
yarn install
```

### Step 4: Initialize Backend

```bash
# Create backend directory
mkdir -p .backend
cd .backend

# Initialize with demo mode (all services enabled)
nself init --demo

# Or interactive mode for custom configuration
nself init

# Build Docker configuration
nself build

# Start services
nself start

# Return to project root
cd ..
```

### Step 5: Configure Environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Backend URLs
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Authentication
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development

# Branding (optional)
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
```

### Step 6: Run Database Migrations

```bash
cd .backend
nself migrations apply
cd ..
```

### Step 7: Start Development Server

```bash
npm run dev
```

## Docker Installation

### Full Docker Setup

For a complete Docker-based installation:

```bash
# Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# Build frontend image
docker build -t nchat-frontend .

# Start all services
docker-compose up -d
```

### Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
      - NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
    depends_on:
      - backend

  backend:
    image: nself/backend:latest
    ports:
      - "8080:8080"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  postgres_data:
```

## Production Setup

### Step 1: Clone and Build

```bash
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# Install production dependencies
npm ci --production

# Build for production
npm run build
```

### Step 2: Configure Production Environment

Create `.env.production.local`:

```env
# Production Backend URLs
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.yourdomain.com/v1/storage

# Disable development mode
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_ENV=production

# Security
NEXTAUTH_SECRET=your-secure-secret-here
NEXTAUTH_URL=https://yourdomain.com

# OAuth Providers (if enabled)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 3: Set Up Production Backend

```bash
cd .backend

# Initialize with production settings
nself init --production

# Configure email
nself email setup

# Configure monitoring (optional)
nself metrics enable standard

# Build and start
nself build
nself start
```

### Step 4: Configure SSL/TLS

Using Let's Encrypt with Nginx:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Step 5: Start Production Server

```bash
npm start
```

Or with PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "nchat" -- start

# Enable startup script
pm2 startup
pm2 save
```

## Verification

### Check Frontend

Visit [http://localhost:3000](http://localhost:3000) (or your domain).

You should see either:
- The setup wizard (first run)
- The login page
- The chat interface (if auto-login is enabled)

### Check Backend Services

```bash
cd .backend
nself status
```

Expected output:
```
Service          Status    Port
───────────────────────────────
postgres         running   5432
hasura           running   8080
auth             running   4000
nginx            running   80
minio            running   9000
```

### Check API Connectivity

```bash
# Test GraphQL endpoint
curl -X POST http://api.localhost/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Expected response
{"data":{"__typename":"query_root"}}
```

### Check Database

```bash
cd .backend
nself exec postgres psql -U postgres -c "SELECT version();"
```

## Troubleshooting

### Installation Issues

#### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### nself CLI not found

```bash
# Add to PATH (bash)
echo 'export PATH="$HOME/.nself/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Add to PATH (zsh)
echo 'export PATH="$HOME/.nself/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Docker Issues

#### Docker daemon not running

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

#### Port conflicts

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Container not starting

```bash
# View container logs
docker logs <container-name>

# Rebuild containers
cd .backend && nself stop && nself build && nself start
```

### Database Issues

#### Connection refused

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
cd .backend && nself logs postgres
```

#### Migration failed

```bash
# Reset database (WARNING: destroys data)
cd .backend
nself exec postgres dropdb -U postgres nchat
nself exec postgres createdb -U postgres nchat
nself migrations apply
```

### Network Issues

#### Cannot reach localhost subdomains

Add to `/etc/hosts`:
```
127.0.0.1 api.localhost
127.0.0.1 auth.localhost
127.0.0.1 storage.localhost
```

#### CORS errors

Ensure your environment URLs match the actual service URLs:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
```

### Getting Help

If you're still having issues:

1. Run the diagnostic tool: `cd .backend && nself doctor`
2. Check the [GitHub Issues](https://github.com/nself/nself-chat/issues)
3. Join our [Discord community](https://discord.gg/nself)
4. Search the [FAQ](https://nself.io/faq)
