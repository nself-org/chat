# Production Deployment Guide for nself-chat

**Version**: 1.0.0
**Last Updated**: January 31, 2026
**Target Audience**: DevOps Engineers, System Administrators

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Options](#deployment-options)
5. [Quick Start Guides](#quick-start-guides)
6. [Detailed Deployment Instructions](#detailed-deployment-instructions)
7. [nself CLI Backend Configuration](#nself-cli-backend-configuration)
8. [Infrastructure Requirements](#infrastructure-requirements)
9. [SSL/TLS Setup](#ssltls-setup)
10. [Monitoring & Observability](#monitoring--observability)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [Scaling Strategies](#scaling-strategies)
13. [Security Best Practices](#security-best-practices)
14. [Troubleshooting](#troubleshooting)
15. [Cost Optimization](#cost-optimization)
16. [Deployment Checklist](#deployment-checklist)

---

## Overview

nself-chat is a white-label team communication platform built on Next.js 15 with a robust backend powered by **nself CLI**. This guide provides comprehensive instructions for deploying nchat to production across multiple cloud providers and deployment strategies.

### Key Features

- ✅ **Full-stack deployment** (Frontend + Backend)
- ✅ **Multiple deployment options** (VPS, Kubernetes, Serverless)
- ✅ **Automatic SSL/TLS** via Let's Encrypt
- ✅ **Built-in monitoring** (Sentry, Prometheus, Grafana)
- ✅ **Zero-downtime deployments**
- ✅ **Automatic backups**
- ✅ **Multi-platform support** (Docker, Kubernetes, Cloud platforms)

### What You'll Deploy

```
┌─────────────────────────────────────────────────────┐
│                   nself-chat                        │
│             (Next.js 15 Frontend)                   │
│                   Port: 3000                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├──────────────────────┐
                   │                      │
       ┌───────────▼──────────┐  ┌───────▼──────────┐
       │   Hasura GraphQL     │  │   Nhost Auth     │
       │     Port: 8080       │  │   Port: 4000     │
       └───────────┬──────────┘  └───────┬──────────┘
                   │                      │
                   └──────────┬───────────┘
                              │
                   ┌──────────▼──────────┐
                   │   PostgreSQL 16     │
                   │     Port: 5432      │
                   └─────────────────────┘
```

**Powered by nself CLI v0.4.2+**

---

## Prerequisites

### Required Knowledge

- Basic Linux/Unix command line
- Docker fundamentals
- DNS configuration
- SSH access to servers

### Required Software

| Software      | Version | Purpose                |
| ------------- | ------- | ---------------------- |
| **Node.js**   | 20.0+   | Frontend build         |
| **pnpm**      | 9.15.4+ | Package management     |
| **Docker**    | 24.0+   | Container runtime      |
| **nself CLI** | 0.4.2+  | Backend infrastructure |
| **Git**       | 2.40+   | Version control        |

### For Kubernetes Deployments

| Tool             | Version | Purpose                    |
| ---------------- | ------- | -------------------------- |
| **kubectl**      | 1.28+   | Kubernetes CLI             |
| **Helm**         | 3.12+   | Package manager (optional) |
| **cert-manager** | 1.13+   | SSL certificate management |

### Required Accounts

- ☑️ **Domain name** with DNS control
- ☑️ **Cloud provider account** (AWS, GCP, DigitalOcean, etc.)
- ☑️ **GitHub account** (for CI/CD and container registry)
- ☑️ **Sentry account** (optional, for error tracking)

### Domain Requirements

Before deploying, ensure you have:

1. A registered domain (e.g., `chat.example.com`)
2. Access to DNS records (A/CNAME)
3. (Optional) Wildcard DNS for subdomains (`*.chat.example.com`)

---

## Architecture Overview

### Single-Server Deployment

**Best for**: < 1,000 users, small teams, development/staging

```mermaid
graph TB
    A[Users] -->|HTTPS| B[Nginx/Traefik]
    B --> C[nself-chat Frontend]
    C --> D[Hasura GraphQL]
    C --> E[Nhost Auth]
    D --> F[PostgreSQL]
    E --> F
    D --> G[Redis Cache]
    C --> H[MinIO Storage]

    style B fill:#4CAF50
    style F fill:#FF9800
    style C fill:#2196F3
```

**Infrastructure**: 1 VPS (4 vCPU, 8GB RAM, 80GB SSD)
**Monthly Cost**: $40-80

### Kubernetes Deployment

**Best for**: > 1,000 users, high availability, auto-scaling

```mermaid
graph TB
    A[Users] -->|HTTPS| B[Ingress Controller]
    B --> C1[nchat Pod 1]
    B --> C2[nchat Pod 2]
    B --> C3[nchat Pod N...]

    C1 --> D[Hasura Service]
    C2 --> D
    C3 --> D

    D --> E[PostgreSQL StatefulSet]
    C1 --> F[Auth Service]
    F --> E

    C1 --> G[Redis Cluster]
    C1 --> H[S3/MinIO]

    I[HPA] -.->|Auto-scale| C1
    I -.->|Auto-scale| C2
    I -.->|Auto-scale| C3

    style B fill:#4CAF50
    style E fill:#FF9800
    style I fill:#9C27B0
```

**Infrastructure**: Kubernetes cluster (3-10 nodes)
**Monthly Cost**: $500-2,000

### Serverless Deployment

**Best for**: Variable traffic, cost optimization, quick deployment

```
Frontend: Vercel/Netlify (Edge)
    ↓
Backend: VPS or Railway (Docker Compose)
    ↓
Database: Neon/Supabase (Managed PostgreSQL)
    ↓
Storage: Cloudflare R2 / AWS S3
```

**Monthly Cost**: $50-200

---

## Deployment Options

### Option 1: Single VPS (Recommended for Small-Medium Teams)

**Providers**: Hetzner, DigitalOcean, Linode, Vultr

| Provider         | Size  | RAM | vCPU | Storage   | Cost/month      |
| ---------------- | ----- | --- | ---- | --------- | --------------- |
| **Hetzner**      | CX31  | 8GB | 2    | 80GB SSD  | €8.79 (~$10) ⭐ |
| **DigitalOcean** | Basic | 8GB | 4    | 160GB SSD | $48             |
| **Vultr**        | HF    | 8GB | 4    | 180GB SSD | $48             |
| **Linode**       | 8GB   | 8GB | 4    | 160GB SSD | $48             |

**✅ Pros**: Simple, cost-effective, easy to manage
**❌ Cons**: Single point of failure, manual scaling

### Option 2: Kubernetes (Recommended for Production)

**Managed Kubernetes Providers**:

| Provider         | Service | Min Cost/month        | Auto-scaling |
| ---------------- | ------- | --------------------- | ------------ |
| **DigitalOcean** | DOKS    | $36 (3 nodes)         | ✅           |
| **Google Cloud** | GKE     | $74 (3 nodes)         | ✅           |
| **AWS**          | EKS     | $73 (cluster) + nodes | ✅           |
| **Linode**       | LKE     | $30 (3 nodes)         | ✅           |

**✅ Pros**: Auto-scaling, high availability, zero-downtime deploys
**❌ Cons**: Complex setup, higher costs

### Option 3: Hybrid (Frontend Serverless + Backend VPS)

**Frontend**: Vercel or Netlify ($0-40/month)
**Backend**: Hetzner VPS ($10-20/month)
**Total**: $10-60/month

**✅ Pros**: Best cost/performance, global CDN
**❌ Cons**: Multiple platforms to manage

### Option 4: Fully Managed Platforms

| Platform    | Type      | Cost/month | Best For               |
| ----------- | --------- | ---------- | ---------------------- |
| **Railway** | Container | $5-50      | Quick deployments      |
| **Render**  | Container | $7-100     | Simple setup           |
| **Fly.io**  | Container | $0-50      | Global edge deployment |

**✅ Pros**: Zero infrastructure management
**❌ Cons**: Higher costs at scale, vendor lock-in

---

## Quick Start Guides

### 🚀 Quick Start: Hetzner VPS (Budget-Friendly)

**Total time**: 30-45 minutes
**Monthly cost**: ~$13

```bash
# 1. Provision Hetzner Cloud server
# Create CX31 instance via Hetzner Cloud Console
# OS: Ubuntu 24.04 LTS

# 2. Connect to server
ssh root@YOUR_SERVER_IP

# 3. Install nself CLI
curl -fsSL https://get.nself.org/install.sh | bash
source ~/.bashrc

# 4. Initialize server
nself server init root@YOUR_SERVER_IP --domain chat.example.com

# 5. Clone nself-chat
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# 6. Setup backend
cd .backend
nself init --demo
nself config secrets generate --env prod
nself build
nself start

# 7. Build and deploy frontend
cd ..
pnpm install
pnpm build

# 8. Configure environment
cp .env.example .env.production
# Edit .env.production with your settings

# 9. Run with Docker
docker build -t nself-chat:latest .
docker run -d \
  --name nself-chat \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  nself-chat:latest

# 10. Setup Nginx + SSL
nself auth ssl bootstrap --env prod

# ✅ Done! Access at https://chat.example.com
```

### 🚀 Quick Start: DigitalOcean Kubernetes

**Total time**: 1-2 hours
**Monthly cost**: ~$100

```bash
# 1. Create Kubernetes cluster via DigitalOcean UI
# - 3 nodes, 2 vCPU, 4GB RAM each

# 2. Get kubeconfig
doctl kubernetes cluster kubeconfig save nself-chat-prod

# 3. Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# 4. Create namespace
kubectl create namespace nself-chat

# 5. Generate secrets
kubectl create secret generic nself-chat-secrets \
  --namespace=nself-chat \
  --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=HASURA_ADMIN_SECRET=$(openssl rand -base64 32) \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32)

# 6. Deploy with Helm
helm install nself-chat ./deploy/helm/nself-chat \
  --namespace nself-chat \
  --values deploy/helm/nself-chat/values-production.yaml \
  --set ingress.hosts[0].host=chat.example.com

# 7. Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 8. Verify deployment
kubectl get pods -n nself-chat
kubectl get ingress -n nself-chat

# ✅ Done! Access at https://chat.example.com
```

### 🚀 Quick Start: Vercel + Railway Hybrid

**Total time**: 20-30 minutes
**Monthly cost**: ~$20-40

```bash
# 1. Deploy backend to Railway
# - Go to railway.app
# - Create new project from GitHub repo
# - Set environment variables
# - Deploy .backend/ directory

# 2. Deploy frontend to Vercel
vercel login
cd nself-chat
vercel link

# 3. Configure environment variables
vercel env add NEXT_PUBLIC_GRAPHQL_URL production
# Enter your Railway backend URL

vercel env add NEXT_PUBLIC_AUTH_URL production
# Enter your Railway auth URL

# 4. Deploy to production
vercel --prod

# ✅ Done! Access at your Vercel URL
```

---

## Detailed Deployment Instructions

### Option A: Docker Deployment (Single VPS)

#### Step 1: Prepare Server

```bash
# Connect to your VPS
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install docker-compose-plugin -y

# Install nself CLI
curl -fsSL https://get.nself.org/install.sh | bash
source ~/.bashrc
```

#### Step 2: Configure Backend (nself CLI)

```bash
# Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat/.backend

# Initialize nself project
nself init --demo

# Generate production secrets
nself config secrets generate --env prod

# Configure environment
cat > .env <<EOF
ENV=prod
PROJECT_NAME=nchat
BASE_DOMAIN=chat.example.com

# Services
POSTGRES_ENABLED=true
HASURA_ENABLED=true
AUTH_ENABLED=true
REDIS_ENABLED=true
MINIO_ENABLED=true
MONITORING_ENABLED=true

# Custom configuration
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_DEV_MODE=false
EOF

# Build configuration
nself build

# Start all services
nself start

# Verify services
nself status
nself urls
```

#### Step 3: Build Frontend

```bash
cd /root/nself-chat

# Create production environment file
cat > .env.production <<EOF
NODE_ENV=production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_APP_NAME=nchat

# Backend URLs (from nself urls command)
NEXT_PUBLIC_GRAPHQL_URL=https://api.chat.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.chat.example.com
NEXT_PUBLIC_STORAGE_URL=https://storage.chat.example.com

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
NEXT_PUBLIC_RELEASE_VERSION=1.0.0
EOF

# Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_GRAPHQL_URL=https://api.chat.example.com/v1/graphql \
  --build-arg NEXT_PUBLIC_AUTH_URL=https://auth.chat.example.com \
  --build-arg NEXT_PUBLIC_STORAGE_URL=https://storage.chat.example.com \
  -t nself-chat:v1.0.0 \
  -f Dockerfile \
  .
```

#### Step 4: Run Frontend Container

```bash
# Run container
docker run -d \
  --name nself-chat \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  --network nself-network \
  --health-cmd="/healthcheck.sh || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  nself-chat:v1.0.0

# Verify container
docker ps | grep nself-chat
docker logs -f nself-chat

# Test health endpoint
curl http://localhost:3000/api/health
```

#### Step 5: Configure Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx -y

# Create configuration
cat > /etc/nginx/sites-available/nself-chat <<'EOF'
upstream nself-chat {
    server localhost:3000;
    keepalive 32;
}

# HTTP redirect
server {
    listen 80;
    listen [::]:80;
    server_name chat.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name chat.example.com;

    # SSL certificates (managed by Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss text/javascript;

    # Main location
    location / {
        proxy_pass http://nself-chat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://nself-chat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check (no auth, no logging)
    location /api/health {
        proxy_pass http://nself-chat;
        access_log off;
    }

    # Rate limiting for API
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://nself-chat;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/nself-chat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain certificate
certbot --nginx -d chat.example.com

# Test auto-renewal
certbot renew --dry-run

# Enable auto-renewal (already set up by certbot)
systemctl status certbot.timer
```

#### Step 7: Configure DNS

Point your domain to your server IP:

```
A Record:  chat.example.com → YOUR_SERVER_IP
```

Wait for DNS propagation (5-60 minutes).

#### Step 8: Verify Deployment

```bash
# Check all services
nself status

# Check frontend
curl https://chat.example.com/api/health

# View logs
docker logs -f nself-chat
nself logs hasura

# Monitor resources
docker stats nself-chat
```

**✅ Deployment complete!** Access your application at `https://chat.example.com`

---

### Option B: Kubernetes Deployment

#### Step 1: Prepare Kubernetes Cluster

**Using DigitalOcean:**

```bash
# Install doctl
brew install doctl  # macOS
# or snap install doctl  # Linux

# Authenticate
doctl auth init

# Create cluster
doctl kubernetes cluster create nself-chat-prod \
  --count 3 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --auto-upgrade

# Get kubeconfig
doctl kubernetes cluster kubeconfig save nself-chat-prod
```

**Using Google Cloud (GKE):**

```bash
# Create cluster
gcloud container clusters create nself-chat-prod \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --region=us-central1 \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10

# Get credentials
gcloud container clusters get-credentials nself-chat-prod --region us-central1
```

**Using AWS (EKS):**

```bash
# Create cluster (using eksctl)
eksctl create cluster \
  --name nself-chat-prod \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --name nself-chat-prod --region us-east-1
```

#### Step 2: Install Prerequisites

```bash
# Install Ingress Controller (nginx)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installations
kubectl get pods -n ingress-nginx
kubectl get pods -n cert-manager
```

#### Step 3: Create Namespace and Secrets

```bash
# Clone repository
git clone https://github.com/nself/nself-chat.git
cd nself-chat

# Create namespace
kubectl apply -f deploy/k8s/namespace.yaml

# Generate strong secrets
POSTGRES_PASSWORD=$(openssl rand -base64 32)
HASURA_ADMIN_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Create secrets
kubectl create secret generic nself-chat-secrets \
  --namespace=nself-chat \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=POSTGRES_DB=nchat \
  --from-literal=HASURA_ADMIN_SECRET="$HASURA_ADMIN_SECRET" \
  --from-literal=HASURA_JWT_SECRET="{\"type\":\"HS256\",\"key\":\"$JWT_SECRET\"}" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD"

# Save secrets securely
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .secrets.production
echo "HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET" >> .secrets.production
echo "JWT_SECRET=$JWT_SECRET" >> .secrets.production
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .secrets.production
chmod 600 .secrets.production

# Create image pull secret (if using private registry)
kubectl create secret docker-registry nself-chat-registry \
  --namespace=nself-chat \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

#### Step 4: Configure Application

```bash
# Edit ConfigMap with your domain
nano deploy/k8s/configmap.yaml

# Update these values:
# NEXT_PUBLIC_GRAPHQL_URL: https://api.chat.example.com/v1/graphql
# NEXT_PUBLIC_AUTH_URL: https://auth.chat.example.com
# NEXT_PUBLIC_STORAGE_URL: https://storage.chat.example.com

# Apply ConfigMap
kubectl apply -f deploy/k8s/configmap.yaml
```

#### Step 5: Deploy Backend Services

```bash
# Deploy PostgreSQL
kubectl apply -f deploy/k8s/postgres-statefulset.yaml

# Deploy Redis
kubectl apply -f deploy/k8s/redis-deployment.yaml

# Deploy MinIO (or use cloud storage)
kubectl apply -f deploy/k8s/minio-deployment.yaml

# Wait for services to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n nself-chat --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n nself-chat --timeout=300s
```

#### Step 6: Deploy Application

```bash
# Deploy nself-chat application
kubectl apply -f deploy/k8s/deployment.yaml

# Deploy service
kubectl apply -f deploy/k8s/service.yaml

# Deploy Horizontal Pod Autoscaler
kubectl apply -f deploy/k8s/hpa.yaml

# Deploy Pod Disruption Budget
kubectl apply -f deploy/k8s/pdb.yaml

# Verify deployment
kubectl get pods -n nself-chat -w
kubectl get svc -n nself-chat
```

#### Step 7: Configure Ingress and SSL

```bash
# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF

# Edit ingress with your domain
nano deploy/k8s/ingress.yaml
# Update host: chat.example.com

# Apply ingress
kubectl apply -f deploy/k8s/ingress.yaml

# Check ingress
kubectl get ingress -n nself-chat
kubectl describe ingress nself-chat -n nself-chat
```

#### Step 8: Configure DNS

Get your Load Balancer IP:

```bash
kubectl get ingress -n nself-chat
```

Create DNS records:

```
A Record:  chat.example.com → YOUR_LOAD_BALANCER_IP
```

#### Step 9: Verify Deployment

```bash
# Check all pods
kubectl get pods -n nself-chat

# Check logs
kubectl logs -f deployment/nself-chat -n nself-chat

# Check certificate
kubectl get certificate -n nself-chat

# Test application
curl https://chat.example.com/api/health

# Check HPA status
kubectl get hpa -n nself-chat
```

**✅ Kubernetes deployment complete!**

---

## nself CLI Backend Configuration

The backend uses nself CLI for comprehensive service management. See [nself CLI documentation](https://github.com/nself/nself/docs) for complete reference.

### Core Commands

```bash
# Initialize new project
nself init
nself init --demo  # With demo data

# Server management
nself server init root@your-server.com --domain example.com
nself server check root@your-server.com

# Environment management
nself env create prod prod
nself config secrets generate --env prod
nself config validate prod

# Deployment
nself build
nself start
nself stop
nself restart [service]
nself status

# Service management
nself logs [service]
nself exec <service> -- <command>
nself urls

# Backup & restore
nself backup create
nself backup rollback --env prod

# SSL management
nself auth ssl bootstrap --env prod
nself auth ssl renew
nself auth ssl status

# Monitoring
nself doctor
nself metrics
```

### Environment Configuration

Create `.backend/.env`:

```bash
# Environment
ENV=prod
PROJECT_NAME=nchat
BASE_DOMAIN=chat.example.com

# Core Services
POSTGRES_ENABLED=true
HASURA_ENABLED=true
AUTH_ENABLED=true
NGINX_ENABLED=true

# Optional Services
REDIS_ENABLED=true
MINIO_ENABLED=true
MEILISEARCH_ENABLED=false
MONITORING_ENABLED=true  # Prometheus, Grafana, Loki

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_DB=nchat
# POSTGRES_PASSWORD set in .env.secrets

# Hasura Configuration
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_DEV_MODE=false
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com
# HASURA_GRAPHQL_ADMIN_SECRET set in .env.secrets
# HASURA_GRAPHQL_JWT_SECRET set in .env.secrets

# Auth Configuration
AUTH_CLIENT_URL=https://chat.example.com
AUTH_SERVER_URL=https://auth.chat.example.com
AUTH_SMTP_HOST=smtp.sendgrid.net
AUTH_SMTP_PORT=587
AUTH_SMTP_USER=apikey
# AUTH_SMTP_PASSWORD set in .env.secrets
AUTH_SMTP_SENDER=noreply@chat.example.com

# Storage Configuration (MinIO or S3)
MINIO_ROOT_USER=minio
# MINIO_ROOT_PASSWORD set in .env.secrets
# OR use AWS S3
# AWS_ACCESS_KEY_ID=set-in-secrets
# AWS_SECRET_ACCESS_KEY=set-in-secrets
# S3_BUCKET=nchat-storage
# S3_REGION=us-east-1

# Redis Configuration
# REDIS_PASSWORD set in .env.secrets

# SSL Configuration
LETSENCRYPT_EMAIL=admin@example.com
DNS_PROVIDER=cloudflare  # For wildcard certs
# DNS_API_TOKEN=set-in-secrets
```

### Secrets Management

```bash
# Generate all secrets automatically
nself config secrets generate --env prod

# This creates .environments/prod/.env.secrets with:
# - POSTGRES_PASSWORD (44 chars)
# - HASURA_GRAPHQL_ADMIN_SECRET (64 chars)
# - AUTH_JWT_SECRET (64 chars)
# - REDIS_PASSWORD (44 chars)
# - MINIO_ROOT_PASSWORD (44 chars)
# - MEILISEARCH_MASTER_KEY (44 chars)
# - GRAFANA_ADMIN_PASSWORD (32 chars)
# - ENCRYPTION_KEY (32 chars)

# View secrets (masked)
nself config secrets show --env prod

# Rotate secrets
nself config secrets rotate POSTGRES_PASSWORD --env prod
nself config secrets rotate --all --env prod  # Rotate all

# Validate configuration
nself config validate prod
nself config validate prod --strict  # Treat warnings as errors
```

### Production Deployment Workflow

```bash
# 1. Server initialization (one-time)
nself server init root@your-server.com --domain chat.example.com

# 2. Create production environment
nself env create prod prod

# 3. Generate secure secrets
nself config secrets generate --env prod

# 4. Configure environment variables
nano .environments/prod/.env

# 5. Validate before deployment
nself config validate prod

# 6. Deploy to production
nself deploy prod

# 7. Check deployment health
nself deploy health --env prod

# 8. View service URLs
nself urls
```

### Service URLs

After deployment, nself provides URLs for all services:

```bash
$ nself urls

Frontend:        https://chat.example.com
Hasura Console:  https://api.chat.example.com/console
Hasura GraphQL:  https://api.chat.example.com/v1/graphql
Auth:            https://auth.chat.example.com
Storage:         https://storage.chat.example.com
Grafana:         https://grafana.chat.example.com (if monitoring enabled)
Prometheus:      https://prometheus.chat.example.com (if monitoring enabled)
```

### Database Migrations

```bash
# Navigate to backend
cd .backend

# Run migrations
nself exec hasura -- hasura migrate apply --database-name default

# Seed data
nself exec postgres -- psql -U postgres -d nchat -f /seed.sql

# Backup database
nself backup create database

# Restore from backup
nself backup restore database --file=backup-20260131.sql
```

### Using Managed Databases

Instead of self-hosting PostgreSQL, you can use managed services:

**AWS RDS:**

```bash
# Update .backend/.env
POSTGRES_HOST=mydb.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_USER=nchat_admin
POSTGRES_DB=nchat
# POSTGRES_PASSWORD in secrets

HASURA_GRAPHQL_DATABASE_URL=postgres://nchat_admin:${POSTGRES_PASSWORD}@mydb.us-east-1.rds.amazonaws.com:5432/nchat

# Disable local PostgreSQL
POSTGRES_ENABLED=false
```

**Neon (Serverless PostgreSQL):**

```bash
# Get connection string from Neon dashboard
HASURA_GRAPHQL_DATABASE_URL=postgres://user:pass@ep-xyz.us-east-2.aws.neon.tech/nchat?sslmode=require

POSTGRES_ENABLED=false
```

**Supabase:**

```bash
# Get connection string from Supabase dashboard
HASURA_GRAPHQL_DATABASE_URL=postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

POSTGRES_ENABLED=false
AUTH_ENABLED=false  # Use Supabase Auth
```

---

## Infrastructure Requirements

### Minimum Requirements (< 1,000 users)

```yaml
Server:
  CPU: 2 vCPUs
  RAM: 4GB
  Storage: 40GB SSD
  Bandwidth: 1TB/month

Software:
  - Docker 24.0+
  - nself CLI 0.4.2+
  - Nginx or Traefik
  - Ubuntu 22.04+ or Debian 12+

Estimated Cost: $40-80/month (VPS)
```

### Recommended Requirements (1,000 - 10,000 users)

```yaml
Server:
  CPU: 4 vCPUs
  RAM: 16GB
  Storage: 160GB SSD
  Bandwidth: 4TB/month

Infrastructure:
  - Kubernetes cluster (3-5 nodes)
  - Managed PostgreSQL or dedicated DB server
  - Redis cluster (3 nodes)
  - Object storage (S3/MinIO)
  - CDN (Cloudflare/CloudFront)

Estimated Cost: $500-1,000/month
```

### Enterprise Requirements (> 10,000 users)

```yaml
Infrastructure:
  - Multi-region Kubernetes (10-20 nodes per region)
  - Managed PostgreSQL with HA + read replicas
  - Redis Cluster (10+ nodes)
  - Multi-region object storage
  - Global CDN
  - DDoS protection
  - Web Application Firewall (WAF)

Monitoring:
  - Prometheus + Grafana
  - Datadog or New Relic
  - Sentry for error tracking
  - Log aggregation (ELK/Better Stack)

Security:
  - HashiCorp Vault for secrets
  - Compliance (SOC 2, HIPAA, GDPR)
  - Regular penetration testing
  - 24/7 security monitoring

Estimated Cost: $5,000-20,000+/month
```

---

## SSL/TLS Setup

### Let's Encrypt (Recommended - Free)

**For VPS deployments:**

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain certificate
certbot --nginx -d chat.example.com

# Test auto-renewal
certbot renew --dry-run

# Auto-renewal is configured automatically via systemd timer
systemctl status certbot.timer
```

**For Kubernetes with cert-manager:**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF

# Certificate is automatically provisioned via Ingress annotation
```

**Using nself CLI:**

```bash
# Automatic SSL setup during server init
nself server init root@server.com --domain chat.example.com

# Manual SSL setup
nself auth ssl bootstrap --env prod

# Renew certificates
nself auth ssl renew

# Check status
nself auth ssl status
```

### Wildcard Certificates

For `*.chat.example.com`:

```bash
# Configure DNS provider in .backend/.env
DNS_PROVIDER=cloudflare
DNS_API_TOKEN=your-cloudflare-api-token

# Supported providers:
# - cloudflare
# - route53 (AWS)
# - digitalocean
# - google (Google Cloud DNS)

# Generate wildcard certificate
nself auth ssl bootstrap --wildcard --env prod
```

**Kubernetes wildcard cert:**

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-cert
  namespace: nself-chat
spec:
  secretName: wildcard-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - 'chat.example.com'
    - '*.chat.example.com'
  solvers:
    - dns01:
        cloudflare:
          email: admin@example.com
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
EOF
```

### Custom SSL Certificates

If you have your own certificates:

**VPS:**

```bash
# Copy certificates
cp fullchain.pem /etc/letsencrypt/live/chat.example.com/
cp privkey.pem /etc/letsencrypt/live/chat.example.com/

# Update Nginx config
# ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

# Reload Nginx
nginx -t && systemctl reload nginx
```

**Kubernetes:**

```bash
# Create TLS secret
kubectl create secret tls nself-chat-tls \
  --cert=fullchain.pem \
  --key=privkey.pem \
  --namespace=nself-chat

# Reference in Ingress
# spec:
#   tls:
#     - hosts:
#         - chat.example.com
#       secretName: nself-chat-tls
```

---

## Monitoring & Observability

### Sentry Integration (Error Tracking)

Already configured in nself-chat. Setup:

```bash
# 1. Create Sentry project at sentry.io

# 2. Configure environment variables
# In .env.production:
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_RELEASE_VERSION=1.0.0

# 3. Automatic instrumentation is already set up in:
# - src/instrumentation.ts
# - src/sentry.client.config.ts
# - src/instrumentation.node.ts
# - src/instrumentation.edge.ts

# 4. Deploy and verify in Sentry dashboard
```

**Sentry Features:**

- ✅ Automatic error capture
- ✅ Performance monitoring
- ✅ Session replay
- ✅ Release tracking
- ✅ User feedback
- ✅ Source maps upload

### Prometheus + Grafana (Infrastructure Monitoring)

**Enable via nself CLI:**

```bash
# In .backend/.env
MONITORING_ENABLED=true

# Start monitoring stack
nself start

# Access Grafana
nself urls
# Opens https://grafana.chat.example.com

# Default credentials:
# Username: admin
# Password: (from .env.secrets)
```

**Kubernetes deployment:**

```bash
# Deploy monitoring stack
kubectl apply -f deploy/k8s/monitoring/prometheus-config.yaml
kubectl apply -f deploy/k8s/monitoring/grafana-deployment.yaml
kubectl apply -f deploy/k8s/monitoring/alertmanager-config.yaml

# Access Grafana via port-forward
kubectl port-forward svc/grafana 3000:80 -n nself-chat
# Open http://localhost:3000
```

**Pre-configured dashboards:**

- Application Performance
- Database Metrics
- Redis Metrics
- Kubernetes Cluster Overview
- Node Metrics
- Ingress Metrics

### Application Health Checks

**Endpoints:**

| Endpoint       | Purpose            | Response          |
| -------------- | ------------------ | ----------------- |
| `/api/health`  | Basic health       | `{"status":"ok"}` |
| `/api/ready`   | Readiness probe    | `{"ready":true}`  |
| `/api/metrics` | Prometheus metrics | Metrics format    |

**Docker health check:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh || exit 1
```

**Kubernetes probes:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

startupProbe:
  httpGet:
    path: /api/health
    port: 3000
  failureThreshold: 30
  periodSeconds: 5
```

### Logging

**Structured logging:**

```typescript
import { captureError, addSentryBreadcrumb } from '@/lib/sentry-utils'

// Log errors with context
try {
  await operation()
} catch (error) {
  captureError(error, {
    tags: { feature: 'chat', action: 'send-message' },
    extra: { channelId, userId },
  })
}

// Add breadcrumbs
addSentryBreadcrumb('user', 'Message sent', { channelId })
```

**View logs:**

```bash
# Docker
docker logs -f nself-chat

# Kubernetes
kubectl logs -f deployment/nself-chat -n nself-chat

# All pods
kubectl logs -l app.kubernetes.io/name=nself-chat -n nself-chat

# nself CLI
nself logs hasura
nself logs postgres
nself logs nginx
```

### Alerting

**Configure alerts in Prometheus:**

```yaml
# deploy/k8s/monitoring/alertmanager-config.yaml
groups:
  - name: nself-chat
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: 'High error rate detected'

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m

      - alert: PodDown
        expr: up{job="nself-chat"} == 0
        for: 1m
```

**Alert destinations:**

- Email
- Slack
- PagerDuty
- Microsoft Teams
- Webhooks

---

## Backup & Disaster Recovery

### Database Backups

**Automated daily backups (nself CLI):**

```bash
# Configure in .backend/.env
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # 2 AM daily
BACKUP_RETENTION_DAYS=30

# Cloud backup (optional)
BACKUP_S3_ENABLED=true
BACKUP_S3_BUCKET=nchat-backups
BACKUP_S3_REGION=us-east-1

# Manual backup
nself backup create
nself backup create database
nself backup create storage

# List backups
nself backup list

# Restore from backup
nself backup restore --file=backup-20260131.tar.gz
nself backup rollback --env prod
```

**Manual PostgreSQL backup:**

```bash
# Docker
docker exec nchat-postgres pg_dump -U postgres nchat | gzip > backup-$(date +%Y%m%d).sql.gz

# Kubernetes
kubectl exec -n nself-chat postgres-0 -- \
  pg_dump -U postgres nchat | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup-20260131.sql.gz | docker exec -i nchat-postgres psql -U postgres nchat
```

**Automated backup script:**

```bash
#!/bin/bash
# /opt/scripts/backup-nchat.sh

BACKUP_DIR="/backups/nchat"
DATE=$(date +%Y%m%d-%H%M%S)
S3_BUCKET="s3://nchat-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker exec nchat-postgres pg_dump -U postgres nchat | \
  gzip > $BACKUP_DIR/database-$DATE.sql.gz

# Storage backup (MinIO)
docker exec nchat-storage mc mirror myminio/nchat-storage $BACKUP_DIR/storage-$DATE/

# Configuration backup
cp -r /opt/nself-chat/.backend/.env $BACKUP_DIR/backend-env-$DATE
cp -r /opt/nself-chat/.env.production $BACKUP_DIR/frontend-env-$DATE

# Upload to S3
aws s3 sync $BACKUP_DIR $S3_BUCKET/backups/$DATE/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

**Schedule with cron:**

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-nchat.sh >> /var/log/nchat-backup.log 2>&1
```

### Storage Backups

**MinIO/S3:**

```bash
# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket nchat-storage \
  --versioning-configuration Status=Enabled

# Enable cross-region replication
aws s3api put-bucket-replication \
  --bucket nchat-storage \
  --replication-configuration file://replication.json

# Backup to another bucket
aws s3 sync s3://nchat-storage s3://nchat-storage-backup
```

### Disaster Recovery Plan

**Recovery Time Objectives (RTO):**

| Tier          | Service        | RTO      | RPO       |
| ------------- | -------------- | -------- | --------- |
| **Critical**  | Database       | 1 hour   | 5 minutes |
| **Critical**  | Authentication | 1 hour   | 5 minutes |
| **Critical**  | Core API       | 1 hour   | 5 minutes |
| **Important** | File Storage   | 4 hours  | 1 hour    |
| **Important** | Search         | 4 hours  | 1 hour    |
| **Low**       | Analytics      | 24 hours | 24 hours  |

**Recovery Steps:**

```bash
# 1. Assess situation
nself doctor
nself status

# 2. Restore database
nself backup restore database --file=latest

# 3. Restore storage
aws s3 sync s3://nchat-storage-backup s3://nchat-storage

# 4. Restart services
nself restart

# 5. Verify
nself deploy health --env prod
curl https://chat.example.com/api/health

# 6. Monitor
kubectl get pods -n nself-chat -w
nself logs
```

---

## Scaling Strategies

### Horizontal Scaling (Add More Instances)

**Kubernetes Auto-scaling:**

```yaml
# HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nself-chat
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nself-chat
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Manual scaling:**

```bash
# Kubernetes
kubectl scale deployment nself-chat --replicas=10 -n nself-chat

# Docker (manual)
docker run -d --name nself-chat-2 nself-chat:latest
# Update load balancer configuration
```

### Vertical Scaling (Add More Resources)

**Increase container resources:**

```yaml
# Kubernetes deployment
resources:
  requests:
    cpu: '1000m'
    memory: '2Gi'
  limits:
    cpu: '4000m'
    memory: '8Gi'
```

**Upgrade VPS:**

```bash
# DigitalOcean
doctl compute droplet-action resize <droplet-id> --size s-4vcpu-8gb

# Hetzner
# Via Hetzner Cloud Console: Resize server

# AWS
aws ec2 modify-instance-attribute \
  --instance-id i-xxx \
  --instance-type t3.xlarge
```

### Database Scaling

**Read Replicas:**

```bash
# PostgreSQL replication
# Primary server: .backend/.env
POSTGRES_REPLICATION_MODE=master
POSTGRES_REPLICATION_USER=replicator

# Replica servers
POSTGRES_REPLICATION_MODE=slave
POSTGRES_MASTER_HOST=primary-db.example.com
```

**Connection Pooling (PgBouncer):**

```yaml
# docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  environment:
    DATABASES: nchat=host=postgres dbname=nchat
    AUTH_TYPE: md5
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 25
```

**Managed Database Scaling:**

```bash
# AWS RDS
aws rds modify-db-instance \
  --db-instance-identifier nchat-prod \
  --db-instance-class db.r5.2xlarge \
  --apply-immediately

# Add read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier nchat-prod-replica-1 \
  --source-db-instance-identifier nchat-prod
```

### Caching Strategy

**Redis Cluster:**

```yaml
# Kubernetes
redis:
  cluster:
    enabled: true
    nodes: 6 # 3 masters + 3 replicas
  persistence:
    enabled: true
    size: 10Gi
```

**Cache-Aside Pattern:**

```typescript
async function getChannel(id: string) {
  // Try cache first
  const cached = await redis.get(`channel:${id}`)
  if (cached) return JSON.parse(cached)

  // Fetch from database
  const channel = await db.channels.findUnique({ where: { id } })

  // Set cache (TTL: 5 minutes)
  await redis.setex(`channel:${id}`, 300, JSON.stringify(channel))

  return channel
}
```

### CDN Configuration

**Cloudflare:**

```nginx
# Cache static assets
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache images
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

**CloudFront (AWS):**

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name chat.example.com \
  --default-root-object index.html \
  --compress
```

### Load Testing

**Using k6:**

```javascript
// load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 }, // Spike to 500
    { duration: '5m', target: 500 }, // Stay at 500
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
}

export default function () {
  const res = http.get('https://chat.example.com')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  })
  sleep(1)
}
```

**Run test:**

```bash
k6 run load-test.js
```

---

## Security Best Practices

### 1. Secrets Management

**Never commit secrets to Git:**

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
.backend/.env
.backend/.env.secrets
.secrets.production
.environments/*/
```

**Use environment-specific secrets:**

```bash
# Development
.env.local

# Staging
.env.staging

# Production
.env.production
```

**Rotate secrets regularly:**

```bash
# Every 90 days
nself config secrets rotate --all --env prod

# Update application
kubectl rollout restart deployment/nself-chat -n nself-chat
```

### 2. Network Security

**Firewall rules:**

```bash
# UFW (Ubuntu)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Block PostgreSQL from external access
ufw deny 5432/tcp

# Allow from internal network only
ufw allow from 10.0.0.0/8 to any port 5432
```

**Kubernetes Network Policies:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nself-chat-policy
  namespace: nself-chat
spec:
  podSelector:
    matchLabels:
      app: nself-chat
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
```

### 3. SSL/TLS Best Practices

**Strong SSL configuration:**

```nginx
# /etc/nginx/sites-available/nself-chat

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

**Test SSL configuration:**

```bash
# SSL Labs
https://www.ssllabs.com/ssltest/analyze.html?d=chat.example.com

# Or use testssl.sh
docker run --rm -ti drwetter/testssl.sh chat.example.com
```

### 4. Security Headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### 5. Rate Limiting

**Nginx rate limiting:**

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# Apply to API endpoints
location /api/ {
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;
    proxy_pass http://nself-chat;
}

# Stricter limits for auth
location /api/auth/ {
    limit_req zone=auth burst=10 nodelay;
    proxy_pass http://nself-chat;
}
```

### 6. Database Security

**Strong passwords:**

```bash
# Generate strong password (32 characters)
openssl rand -base64 32
```

**Restrict database access:**

```sql
-- PostgreSQL
-- Create app-specific user
CREATE USER nchat_app WITH PASSWORD 'strong-password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE nchat TO nchat_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nchat_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nchat_app;

-- Deny superuser access from app
REVOKE ALL PRIVILEGES ON SCHEMA pg_catalog FROM nchat_app;
```

### 7. Container Security

**Scan for vulnerabilities:**

```bash
# Trivy
trivy image nself-chat:latest

# Snyk
snyk container test nself-chat:latest
```

**Run as non-root user:**

```dockerfile
# Dockerfile (already configured)
USER nextjs
```

**Read-only root filesystem:**

```yaml
# Kubernetes
securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1001
```

### 8. Monitoring & Auditing

**Enable audit logs:**

```bash
# PostgreSQL audit logging
# In postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'all'
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Monitor failed login attempts:**

```typescript
// Track in Sentry
import { captureMessage } from '@/lib/sentry-utils'

function handleFailedLogin(email: string) {
  captureMessage('Failed login attempt', {
    level: 'warning',
    tags: { feature: 'auth' },
    extra: { email },
  })
}
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Container Won't Start

**Symptoms**: Container exits immediately with code 1 or 137

**Diagnosis:**

```bash
# Check logs
docker logs nself-chat

# Check exit code
docker inspect nself-chat --format='{{.State.ExitCode}}'

# Exit code meanings:
# 1: Application error
# 137: Out of memory (OOM killed)
# 139: Segmentation fault
```

**Solutions:**

```bash
# 1. Check environment variables
docker exec nself-chat env

# 2. Increase memory limit
docker run -d --memory="4g" nself-chat:latest

# 3. Check port conflicts
netstat -tulpn | grep 3000

# 4. Verify image was built correctly
docker images | grep nself-chat
docker history nself-chat:latest
```

#### Issue 2: Database Connection Failed

**Symptoms**: `ECONNREFUSED` or timeout errors

**Diagnosis:**

```bash
# Test database connectivity
docker exec nchat-postgres pg_isready -U postgres

# Check database logs
docker logs nchat-postgres

# Test connection from app container
docker exec nself-chat nc -zv postgres 5432
```

**Solutions:**

```bash
# 1. Verify credentials
echo $POSTGRES_PASSWORD

# 2. Check network
docker network inspect nself-network

# 3. Restart PostgreSQL
docker restart nchat-postgres

# 4. Check firewall
ufw status | grep 5432
```

#### Issue 3: SSL Certificate Not Working

**Symptoms**: Certificate errors, HTTPS not working

**Diagnosis:**

```bash
# Check certificate
openssl s_client -connect chat.example.com:443 -servername chat.example.com

# Check cert-manager (Kubernetes)
kubectl describe certificate nself-chat-tls -n nself-chat

# Check Let's Encrypt logs
journalctl -u certbot.timer
```

**Solutions:**

```bash
# 1. Verify DNS points to correct IP
dig chat.example.com +short

# 2. Check port 80/443 are open
ufw status | grep -E "80|443"

# 3. Force renewal
certbot renew --force-renewal -d chat.example.com

# 4. Check Nginx configuration
nginx -t
```

#### Issue 4: High Memory Usage / OOM

**Symptoms**: Container killed, exit code 137

**Diagnosis:**

```bash
# Check memory usage
docker stats nself-chat

# Kubernetes
kubectl top pod -n nself-chat
kubectl describe pod -l app=nself-chat -n nself-chat
```

**Solutions:**

```bash
# 1. Increase memory limit
# Docker
docker run -d --memory="4g" nself-chat:latest

# Kubernetes
resources:
  limits:
    memory: "4Gi"

# 2. Optimize build (reduce dependencies)
pnpm prune --prod

# 3. Enable swap (temporary, not recommended for production)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

#### Issue 5: Slow Performance

**Symptoms**: High response times, slow page loads

**Diagnosis:**

```bash
# Check resource usage
docker stats nself-chat

# Check database performance
docker exec nchat-postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
docker exec nchat-postgres psql -U postgres -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Solutions:**

```bash
# 1. Enable Redis caching
# In .backend/.env
REDIS_ENABLED=true

# 2. Add database indexes
# 3. Enable CDN for static assets
# 4. Scale horizontally
kubectl scale deployment nself-chat --replicas=5 -n nself-chat

# 5. Increase resources
docker run -d --cpus="2" --memory="4g" nself-chat:latest
```

### Debug Commands

**Docker:**

```bash
# Shell into container
docker exec -it nself-chat sh

# View real-time logs
docker logs -f --tail 100 nself-chat

# Inspect container
docker inspect nself-chat

# Check resource usage
docker stats nself-chat

# List all containers
docker ps -a
```

**Kubernetes:**

```bash
# Get pod status
kubectl get pods -n nself-chat -o wide

# Describe pod
kubectl describe pod -l app.kubernetes.io/name=nself-chat -n nself-chat

# View logs
kubectl logs -f deployment/nself-chat -n nself-chat

# Shell into pod
kubectl exec -it deployment/nself-chat -n nself-chat -- sh

# Port forward for local testing
kubectl port-forward deployment/nself-chat 3000:3000 -n nself-chat

# Check events
kubectl get events -n nself-chat --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n nself-chat
kubectl top nodes
```

**nself CLI:**

```bash
# Diagnose issues
nself doctor

# Check service status
nself status

# View service logs
nself logs hasura
nself logs postgres
nself logs nginx

# Run health checks
nself deploy health --env prod

# Shell into service
nself exec postgres -- bash
nself exec hasura -- sh
```

### Emergency Procedures

#### Rollback Deployment

**Docker:**

```bash
# Stop current container
docker stop nself-chat
docker rm nself-chat

# Start previous version
docker run -d --name nself-chat nself-chat:v1.0.0
```

**Kubernetes:**

```bash
# Rollback to previous revision
kubectl rollout undo deployment/nself-chat -n nself-chat

# Rollback to specific revision
kubectl rollout history deployment/nself-chat -n nself-chat
kubectl rollout undo deployment/nself-chat --to-revision=2 -n nself-chat

# Check rollout status
kubectl rollout status deployment/nself-chat -n nself-chat
```

#### Enable Maintenance Mode

**Create maintenance page:**

```html
<!-- /var/www/maintenance.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maintenance - nchat</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .container {
        text-align: center;
        padding: 2rem;
      }
      h1 {
        font-size: 3rem;
        margin: 0 0 1rem 0;
      }
      p {
        font-size: 1.25rem;
        opacity: 0.9;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🔧 We'll be back soon!</h1>
      <p>We're performing scheduled maintenance.</p>
      <p>Please check back in a few minutes.</p>
    </div>
  </body>
</html>
```

**Enable in Nginx:**

```nginx
# Add to server block
location / {
    if (-f /var/www/maintenance.html) {
        return 503;
    }
    proxy_pass http://nself-chat;
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www;
    rewrite ^(.*)$ /maintenance.html break;
}
```

**Toggle maintenance mode:**

```bash
# Enable
touch /var/www/maintenance.html

# Disable
rm /var/www/maintenance.html

# Reload Nginx
systemctl reload nginx
```

---

## Cost Optimization

### Provider Comparison (Monthly Costs)

**For 4GB RAM, 2 vCPU, 80GB SSD:**

| Provider         | Instance        | RAM  | vCPU | Storage  | Bandwidth | Price/mo    |
| ---------------- | --------------- | ---- | ---- | -------- | --------- | ----------- |
| **Hetzner** ⭐   | CX21            | 4GB  | 2    | 40GB SSD | 20TB      | €5.83 (~$6) |
| **Oracle** 🆓    | Free Tier (ARM) | 24GB | 4    | 200GB    | 10TB      | **$0**      |
| **Vultr**        | Regular         | 4GB  | 2    | 80GB SSD | 3TB       | $12         |
| **DigitalOcean** | Basic           | 4GB  | 2    | 80GB SSD | 4TB       | $24         |
| **Linode**       | 4GB             | 4GB  | 2    | 80GB SSD | 4TB       | $24         |
| **AWS**          | t3.medium       | 4GB  | 2    | 40GB SSD | 100GB+pay | ~$30        |
| **GCP**          | e2-medium       | 4GB  | 2    | 40GB SSD | 100GB+pay | ~$32        |

**💡 Best value**: Oracle Free Tier (if available) or Hetzner

### Cost Optimization Strategies

**1. Right-sizing:**

```bash
# Start small, scale as needed
# Small team (<100 users): 2GB RAM, 1 vCPU = $6-12/month
# Growing team (100-1000 users): 4GB RAM, 2 vCPU = $12-24/month
# Scaling team (1000+ users): Kubernetes = $100-500/month
```

**2. Spot instances (AWS/GCP):**

```bash
# Save 60-90% for non-critical workloads
# Good for: Development, staging, batch processing
# Bad for: Production databases, critical services
```

**3. Reserved instances:**

```bash
# 1-year commitment: 30-40% savings
# 3-year commitment: 50-60% savings
# Best for: Stable production workloads
```

**4. Optimize storage:**

```bash
# Use object storage lifecycle policies
# Move old files to cold storage after 90 days
# Delete temporary files after 7 days

# AWS S3 lifecycle example
aws s3api put-bucket-lifecycle-configuration \
  --bucket nchat-storage \
  --lifecycle-configuration file://lifecycle.json
```

**5. Use CDN:**

```bash
# Cloudflare (Free plan)
# - Unlimited bandwidth
# - Global CDN
# - DDoS protection
# - SSL certificates
# = $0/month

# Reduces origin bandwidth costs by 60-80%
```

**6. Database optimization:**

```bash
# Connection pooling reduces instance size needs
# Read replicas instead of larger primary
# Scheduled backups instead of continuous
# Archive old data to cheaper storage
```

### Total Cost Examples

**Small Deployment (<1,000 users):**

```
Hetzner CX21 (4GB):        $6/month
Cloudflare (Free):         $0/month
Cloudflare R2 (10GB):      $0.15/month
Sentry (Free tier):        $0/month
TOTAL:                     ~$7/month
```

**Medium Deployment (1,000-10,000 users):**

```
DigitalOcean K8s (3 nodes):   $72/month
Managed PostgreSQL:           $15/month
Redis (1GB):                  $10/month
S3 Storage (50GB):            $1.15/month
CloudFront CDN:               $10/month
Sentry Team:                  $26/month
TOTAL:                        ~$134/month
```

**Large Deployment (10,000+ users):**

```
Kubernetes (10 nodes):        $500/month
RDS PostgreSQL (multi-AZ):    $200/month
Redis Cluster:                $100/month
S3 + CloudFront:              $50/month
Monitoring (Datadog):         $100/month
Sentry Business:              $99/month
TOTAL:                        ~$1,049/month
```

---

## Deployment Checklist

Use this checklist to ensure a smooth deployment:

### Pre-Deployment

- [ ] Domain registered and DNS configured
- [ ] SSL certificates obtained or configured
- [ ] Environment variables documented
- [ ] Secrets generated (strong, random passwords)
- [ ] Backup strategy defined
- [ ] Monitoring configured (Sentry account created)
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] Documentation reviewed
- [ ] Rollback plan tested

### Deployment Day

- [ ] Notify team of deployment window
- [ ] Create full backup of current system
- [ ] Verify DNS propagation
- [ ] Deploy backend services (nself CLI)
- [ ] Verify backend health
- [ ] Deploy frontend application
- [ ] Configure reverse proxy (Nginx)
- [ ] Enable SSL/TLS
- [ ] Verify SSL certificate
- [ ] Run smoke tests
- [ ] Check all health endpoints
- [ ] Monitor error rates in Sentry
- [ ] Verify logging is working
- [ ] Test user workflows

### Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Check performance metrics
- [ ] Verify backups are running
- [ ] Test disaster recovery
- [ ] Update documentation
- [ ] Schedule post-mortem (if issues)
- [ ] Plan next deployment improvements

### Weekly Maintenance

- [ ] Check error rates in Sentry
- [ ] Review server resource usage
- [ ] Verify backups completed
- [ ] Check SSL certificate expiry
- [ ] Review security alerts
- [ ] Update dependencies (if needed)

### Monthly Maintenance

- [ ] Rotate secrets
- [ ] Review and optimize costs
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Review and archive old logs
- [ ] Update disaster recovery plan
- [ ] Test backup restoration
- [ ] Security audit
- [ ] Performance review

---

## Getting Help

### Community Support

- **GitHub Issues**: [nself-chat/issues](https://github.com/nself/nself-chat/issues)
- **GitHub Discussions**: [nself-chat/discussions](https://github.com/nself/nself-chat/discussions)
- **Discord**: [nself Community](https://discord.gg/nself)
- **Stack Overflow**: Tag `#nself-chat`

### Documentation

- **nself-chat Docs**: `/Users/admin/Sites/nself-chat/docs/`
- **nself CLI Docs**: [~/Sites/nself/docs](https://github.com/nself/nself/docs)
- **Deployment Examples**: `/Users/admin/Sites/nself-chat/deploy/`
- **API Reference**: `/Users/admin/Sites/nself-chat/docs/api/`

### Professional Support

For enterprise deployments or custom support:

- **Email**: support@nself.org
- **Enterprise Plans**: Available for teams >100 users
- **Custom Consulting**: Architecture review, deployment assistance, training

---

## Conclusion

This guide provides comprehensive instructions for deploying nself-chat to production across multiple platforms and deployment strategies. Choose the option that best fits your team size, budget, and technical requirements.

### Quick Recommendations

**🏢 Small Team (<100 users)**:

- Deploy to: Hetzner VPS or Oracle Free Tier
- Cost: $0-10/month
- Time to deploy: 1-2 hours

**🏢 Growing Team (100-1,000 users)**:

- Deploy to: DigitalOcean Kubernetes or Railway
- Cost: $50-200/month
- Time to deploy: 2-4 hours

**🏢 Enterprise (1,000+ users)**:

- Deploy to: Multi-region Kubernetes (AWS/GCP/Azure)
- Cost: $500-5,000+/month
- Time to deploy: 1-2 weeks

### Next Steps

1. Choose your deployment strategy
2. Provision infrastructure
3. Configure nself CLI backend
4. Deploy frontend application
5. Configure monitoring
6. Test thoroughly
7. Go live! 🚀

---

**Document Version**: 1.0.0
**Last Updated**: January 31, 2026
**Maintained By**: nself-chat Team

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/nself/nself-chat).

**Happy deploying! 🎉**
