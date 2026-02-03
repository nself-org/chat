# nself CLI - Overview

**Version**: v0.4.2
**Last Updated**: February 1, 2026
**Category**: Backend Infrastructure

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is nself CLI?](#what-is-nself-cli)
3. [Why Use nself CLI?](#why-use-nself-cli)
4. [Core Features](#core-features)
5. [Architecture Overview](#architecture-overview)
6. [Service Ecosystem](#service-ecosystem)
7. [Use Cases](#use-cases)
8. [Comparison with Alternatives](#comparison-with-alternatives)
9. [Getting Started](#getting-started)
10. [Resources](#resources)

---

## Introduction

**nself CLI** is a comprehensive backend infrastructure tool that provides everything you need to build production-ready applications with a single command. It eliminates the complexity of setting up and managing multiple backend services by providing a unified, Docker-based infrastructure stack.

### Quick Facts

| Property              | Value                         |
| --------------------- | ----------------------------- |
| **Current Version**   | v0.4.2                        |
| **License**           | Open Source                   |
| **Platform**          | macOS, Linux, Windows (WSL2)  |
| **Requirements**      | Docker/Podman, 16GB+ RAM      |
| **Language**          | Go (CLI), Multiple (Services) |
| **Project Structure** | `.backend/` directory         |

---

## What is nself CLI?

nself CLI is a **backend-as-code** infrastructure tool that bundles:

- **PostgreSQL 16** - Production-grade database with 60+ extensions
- **Hasura GraphQL Engine** - Instant GraphQL API for your database
- **Nhost Auth** - Complete authentication system with social providers
- **MinIO** - S3-compatible object storage
- **Redis** - High-performance caching and session management
- **Nginx** - Reverse proxy with automatic SSL/TLS
- **MeiliSearch** - Lightning-fast full-text search
- **Monitoring Stack** - Prometheus, Grafana, Loki, and more

All services are:

- ✅ **Pre-configured** - Works out of the box with sensible defaults
- ✅ **Production-ready** - Battle-tested configurations
- ✅ **Docker-based** - Consistent across environments
- ✅ **Locally networked** - Services communicate seamlessly
- ✅ **Automated** - One command to start everything

### The Problem nself CLI Solves

**Traditional Approach:**

```bash
# Install PostgreSQL
brew install postgresql@16
createdb myapp

# Install Redis
brew install redis
redis-server &

# Set up Hasura
docker run -d hasura/graphql-engine
# ...configure environment variables
# ...set up metadata
# ...configure permissions

# Set up Auth
# ...find an auth solution
# ...configure OAuth providers
# ...set up email templates
# ...configure JWT secrets

# Set up Storage
# ...configure S3 or MinIO
# ...set up buckets
# ...configure CORS

# Days/weeks of configuration later...
```

**With nself CLI:**

```bash
nself init myapp
cd myapp/.backend
nself start

# Everything running in 2 minutes!
```

---

## Why Use nself CLI?

### 1. **Instant Development Environment**

Get a complete backend stack running in minutes instead of days:

- No more hunting for Docker Compose configurations
- No more wrestling with environment variables
- No more service integration headaches
- No more authentication boilerplate

### 2. **Production-Ready from Day One**

Every service is configured with production best practices:

- Security hardening built-in
- Performance optimizations included
- Monitoring and observability ready
- Backup and recovery strategies

### 3. **Consistent Across Team**

Everyone on your team gets the same environment:

- No "works on my machine" issues
- Identical dev/staging/production setups
- Version-controlled configuration
- Easy onboarding for new developers

### 4. **Focus on Your Application**

Stop managing infrastructure, start building features:

- GraphQL API auto-generated from your database
- Authentication handled (email, social, magic links)
- File storage ready to use
- Real-time subscriptions included

### 5. **Cost-Effective**

Open-source and self-hostable:

- No per-user licensing fees
- No vendor lock-in
- Run on any cloud provider
- Scale on your terms

### 6. **Flexibility When You Need It**

Start simple, add complexity as needed:

- Core services (4): PostgreSQL, Hasura, Auth, Nginx
- Optional services (7): Redis, MinIO, Functions, Search, Email
- Monitoring bundle (10): Full observability stack
- Custom services: Add your own as needed

---

## Core Features

### 🎯 **One Command Infrastructure**

```bash
nself start  # Start all services
nself stop   # Stop all services
nself status # Check service health
nself logs   # View service logs
```

### 🐘 **PostgreSQL 16 with Extensions**

60+ PostgreSQL extensions available including:

- **pgcrypto** - Cryptographic functions
- **pg_stat_statements** - Query performance tracking
- **uuid-ossp** - UUID generation
- **pg_trgm** - Full-text search similarity
- **postgis** - Geographic objects (optional)
- **timescaledb** - Time-series data (optional)
- **pg_cron** - Job scheduling (optional)

### ⚡ **Hasura GraphQL Engine**

Instant GraphQL API with:

- Auto-generated queries and mutations
- Real-time subscriptions
- Role-based permissions
- Remote schemas
- Event triggers
- Actions (custom business logic)

### 🔐 **Nhost Authentication**

Complete auth system supporting:

- Email/Password authentication
- Magic link (passwordless) login
- Social OAuth (Google, GitHub, Apple, etc.)
- Multi-factor authentication (TOTP)
- Session management
- JWT token generation
- Email verification
- Password reset flows

### 📦 **MinIO Object Storage**

S3-compatible storage with:

- Bucket management
- File upload/download
- Pre-signed URLs
- Access control policies
- Versioning
- Lifecycle policies
- Browser console

### 🚀 **Redis Cache**

High-performance caching for:

- Session storage
- Query result caching
- Rate limiting
- Real-time features
- Pub/Sub messaging
- Job queues

### 🔍 **MeiliSearch** (Optional)

Lightning-fast search with:

- Typo tolerance
- Faceted search
- Filtering and sorting
- Instant search-as-you-type
- Multi-language support
- Custom ranking rules

### 📊 **Monitoring Bundle** (Optional)

Complete observability with 10 services:

- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **Loki** - Log aggregation
- **Promtail** - Log shipping
- **Alertmanager** - Alert management
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics
- **Jaeger** - Distributed tracing
- **Tempo** - Trace aggregation
- **OpenTelemetry Collector** - Telemetry pipeline

### 🎨 **nself-admin UI** (Optional)

Web-based administration panel on port 3021:

- Service health monitoring
- Database management
- User administration
- Log viewer
- Metrics dashboard
- Configuration editor

---

## Architecture Overview

### Service Communication

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Port 80/443)                 │
│                   SSL/TLS Termination                   │
│                   Reverse Proxy + Router                │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌─────────┐      ┌─────────┐
│ Hasura  │      │  Auth   │
│  :8080  │◄────►│  :4000  │
└────┬────┘      └────┬────┘
     │                │
     │    ┌───────────┴────────┐
     │    │                    │
     ▼    ▼                    ▼
┌──────────────┐          ┌─────────┐
│  PostgreSQL  │          │  MinIO  │
│    :5432     │          │  :9000  │
└──────────────┘          └─────────┘
     ▲                         ▲
     │                         │
     │    ┌───────────┬────────┘
     │    │           │
     ▼    ▼           ▼
┌─────────┐      ┌─────────┐
│  Redis  │      │ Storage │
│  :6379  │      │  :5001  │
└─────────┘      └─────────┘
```

### Docker Network

All services run on a dedicated Docker network:

```yaml
Network: {project_name}_network
Driver: bridge
Isolation: Container-to-container communication
External Access: Via Nginx reverse proxy only
```

### Data Persistence

```
volumes/
├── postgres_data/    # Database files
├── minio_data/       # Object storage files
├── redis_data/       # Cache data
├── mailpit_data/     # Dev email storage
└── admin_data/       # nself-admin data
```

### Port Mapping

| Service     | Internal Port | External Port | URL                                 |
| ----------- | ------------- | ------------- | ----------------------------------- |
| Nginx       | 80, 443       | 80, 443       | http://localhost                    |
| Hasura      | 8080          | 8080          | http://api.localhost/v1/graphql     |
| Auth        | 4000          | -             | http://auth.localhost/v1/auth       |
| PostgreSQL  | 5432          | 5432          | localhost:5432                      |
| MinIO       | 9000, 9001    | -             | http://storage.localhost            |
| Redis       | 6379          | 6379          | localhost:6379                      |
| Storage     | 5001          | -             | http://storage.localhost/v1/storage |
| Mailpit     | 8025          | 8025          | http://localhost:8025               |
| nself-admin | 3021          | 3021          | http://localhost:3021               |

---

## Service Ecosystem

### Core Services (Always Enabled)

#### 1. **PostgreSQL**

- **Image**: `postgres:16-alpine`
- **Purpose**: Primary data store
- **Configuration**:
  - Shared buffers: 256MB
  - Max connections: 200
  - Extensions: 60+ available
- **Health Check**: `pg_isready`

#### 2. **Hasura GraphQL Engine**

- **Image**: `hasura/graphql-engine:v2.44.0`
- **Purpose**: GraphQL API layer
- **Features**:
  - Auto-generated CRUD operations
  - Real-time subscriptions
  - Permission system
  - Event triggers
- **Console**: Enabled in dev mode

#### 3. **Nhost Auth**

- **Image**: `nhost/hasura-auth:0.36.0`
- **Purpose**: Authentication service
- **Features**:
  - Multiple auth providers
  - JWT token generation
  - Email verification
  - Password reset
- **Health Check**: `/healthz` endpoint

#### 4. **Nginx**

- **Image**: `nginx:alpine`
- **Purpose**: Reverse proxy and SSL termination
- **Features**:
  - Automatic routing
  - SSL certificate management
  - WebSocket support
  - Static file serving

### Optional Services (Enable as Needed)

#### 5. **MinIO** (`MINIO_ENABLED=true`)

- **Purpose**: S3-compatible object storage
- **Console**: Port 9001
- **Default Credentials**: minioadmin/minioadmin

#### 6. **Redis** (`REDIS_ENABLED=true`)

- **Purpose**: Caching and session storage
- **Persistence**: AOF + RDB snapshots
- **Eviction**: LRU policy

#### 7. **Hasura Storage** (Auto-enabled with MinIO)

- **Purpose**: File upload/download API
- **Features**:
  - S3 integration
  - Access control
  - Image transformations

#### 8. **Mailpit** (`MAILPIT_ENABLED=true`)

- **Purpose**: Email testing (development)
- **UI**: Port 8025
- **SMTP**: Port 1025
- **Replaces**: MailHog (deprecated)

#### 9. **MeiliSearch** (`MEILISEARCH_ENABLED=true`)

- **Purpose**: Full-text search
- **API**: Port 7700
- **Features**: Instant search, typo tolerance

#### 10. **Serverless Functions** (`FUNCTIONS_ENABLED=true`)

- **Purpose**: Custom business logic
- **Runtime**: Node.js, Python, Go
- **Deployment**: Hot reload in dev

#### 11. **MLflow** (`MLFLOW_ENABLED=true`)

- **Purpose**: ML experiment tracking
- **UI**: Port 5000
- **Storage**: S3/MinIO backend

### Monitoring Bundle (`MONITORING_ENABLED=true`)

Enables 10 services for full observability:

| Service        | Port  | Purpose            |
| -------------- | ----- | ------------------ |
| Prometheus     | 9090  | Metrics storage    |
| Grafana        | 3000  | Dashboards         |
| Loki           | 3100  | Log aggregation    |
| Promtail       | 9080  | Log collection     |
| Alertmanager   | 9093  | Alert routing      |
| Node Exporter  | 9100  | Host metrics       |
| cAdvisor       | 8080  | Container metrics  |
| Jaeger         | 16686 | Trace UI           |
| Tempo          | 3200  | Trace storage      |
| OTEL Collector | 4317  | Telemetry pipeline |

### Administrative Services

#### **nself-admin** (`NSELF_ADMIN_ENABLED=true`)

- **Port**: 3021 (NOT 3100 - Loki uses 3100)
- **Purpose**: Web-based admin panel
- **Features**:
  - Service status dashboard
  - Log viewer
  - Database browser
  - User management
  - Configuration editor
  - Metrics overview

---

## Use Cases

### 1. **SaaS Application Backend**

Perfect for building multi-tenant SaaS applications:

```yaml
Stack:
  - Frontend: Next.js, React, Vue
  - Backend: nself CLI (GraphQL API)
  - Database: PostgreSQL (multi-tenant schema)
  - Auth: Social login + email
  - Storage: User uploads to MinIO
  - Cache: Redis for sessions
  - Search: MeiliSearch for app search
```

**Example**: nself-chat (this project!)

### 2. **E-commerce Platform**

Everything needed for online stores:

```yaml
Features:
  - Product catalog (PostgreSQL)
  - Image storage (MinIO)
  - Search (MeiliSearch)
  - User accounts (Nhost Auth)
  - Shopping cart (Redis)
  - Order processing (Functions)
  - Email notifications (SMTP integration)
```

### 3. **Content Management System**

Build a headless CMS:

```yaml
Stack:
  - Content: PostgreSQL (structured data)
  - Media: MinIO (images, videos, PDFs)
  - API: Hasura (auto-generated GraphQL)
  - Search: MeiliSearch (content search)
  - Drafts: Redis (temporary storage)
  - Publishing: Functions (webhooks)
```

### 4. **Analytics Platform**

Data collection and visualization:

```yaml
Stack:
  - Events: PostgreSQL (time-series data)
  - Processing: Functions (data transformation)
  - Caching: Redis (query results)
  - Dashboards: Grafana (visualization)
  - Metrics: Prometheus (time-series metrics)
```

### 5. **Social Network**

Build the next big social platform:

```yaml
Features:
  - User profiles (PostgreSQL)
  - Posts and comments (PostgreSQL)
  - Media uploads (MinIO)
  - Real-time updates (Hasura subscriptions)
  - Feed caching (Redis)
  - Content search (MeiliSearch)
  - Notifications (Functions)
```

### 6. **API Gateway**

Create a unified API for microservices:

```yaml
Architecture:
  - API Layer: Hasura (GraphQL gateway)
  - Services: Remote schemas
  - Auth: Nhost (SSO)
  - Cache: Redis (response caching)
  - Rate Limiting: Redis
  - Monitoring: Prometheus + Grafana
```

---

## Comparison with Alternatives

### vs. Firebase

| Feature        | nself CLI         | Firebase          |
| -------------- | ----------------- | ----------------- |
| **Hosting**    | Self-hosted       | Cloud only        |
| **Cost**       | Free (your infra) | Pay per use       |
| **Database**   | PostgreSQL (SQL)  | Firestore (NoSQL) |
| **Queries**    | GraphQL + SQL     | Limited queries   |
| **Lock-in**    | None              | Vendor lock-in    |
| **Offline**    | Full control      | Limited           |
| **Extensions** | 60+ PostgreSQL    | Limited           |
| **Auth**       | Self-hosted       | Cloud-based       |

**Winner**: nself CLI for self-hosting, Firebase for quick prototypes

### vs. Supabase

| Feature         | nself CLI         | Supabase           |
| --------------- | ----------------- | ------------------ |
| **Hosting**     | Self-hosted       | Cloud or self-host |
| **Cost**        | Free              | Free tier + paid   |
| **GraphQL**     | Hasura (advanced) | PostgREST (basic)  |
| **Auth**        | Nhost Auth        | Supabase Auth      |
| **Storage**     | MinIO             | Supabase Storage   |
| **Admin UI**    | nself-admin       | Supabase Studio    |
| **Flexibility** | Very high         | Medium             |
| **Setup**       | One command       | Docker Compose     |

**Winner**: Tie - nself CLI for control, Supabase for managed service

### vs. Hasura Cloud

| Feature      | nself CLI        | Hasura Cloud   |
| ------------ | ---------------- | -------------- |
| **Hosting**  | Self-hosted      | Cloud only     |
| **Cost**     | Free             | $99+/month     |
| **Features** | Full stack       | GraphQL only   |
| **Auth**     | Included (Nhost) | Bring your own |
| **Storage**  | Included (MinIO) | Bring your own |
| **Database** | Included         | Bring your own |
| **Setup**    | One command      | Manual config  |

**Winner**: nself CLI (Hasura Cloud is expensive for small teams)

### vs. AWS Amplify

| Feature        | nself CLI     | AWS Amplify     |
| -------------- | ------------- | --------------- |
| **Vendor**     | Open source   | AWS             |
| **Cost**       | Free          | Pay per use     |
| **Lock-in**    | None          | AWS ecosystem   |
| **Database**   | PostgreSQL    | DynamoDB/Aurora |
| **Learning**   | Standard tech | AWS-specific    |
| **Local Dev**  | Full-featured | Limited         |
| **Deployment** | Flexible      | AWS only        |

**Winner**: nself CLI for portability, Amplify for AWS shops

### vs. Docker Compose

| Feature          | nself CLI      | Docker Compose     |
| ---------------- | -------------- | ------------------ |
| **Setup**        | Automated      | Manual             |
| **Config**       | Smart defaults | Full manual config |
| **Services**     | 20+ ready      | Build yourself     |
| **Updates**      | One command    | Manual updates     |
| **Monitoring**   | Built-in       | DIY                |
| **Docs**         | Comprehensive  | Per-service        |
| **Time to prod** | Hours          | Days/weeks         |

**Winner**: nself CLI (it generates optimized Docker Compose!)

---

## Getting Started

### 1. **Check Prerequisites**

```bash
# Docker
docker --version  # 20.10+ required

# Docker Compose
docker compose version  # v2.0+ required

# Disk space
df -h  # 10GB+ free space recommended

# Memory
# 16GB RAM recommended (8GB minimum)
```

### 2. **Install nself CLI**

```bash
# macOS/Linux
curl -fsSL https://nself.org/install.sh | sh

# Verify installation
nself --version  # Should show v0.4.2
```

### 3. **Initialize Your First Project**

```bash
# Create new project
nself init myapp

# Navigate to backend
cd myapp/.backend

# Review configuration
cat .env

# Start all services
nself start

# Check status
nself status

# View URLs
nself urls
```

### 4. **Access Your Services**

```bash
# Hasura Console
open http://localhost:8080/console

# API Endpoint
curl http://api.localhost/v1/graphql

# Admin UI (if enabled)
open http://localhost:3021

# Email Testing (if enabled)
open http://localhost:8025
```

### 5. **Connect Your Frontend**

```javascript
// Next.js example
// .env.local
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage
```

---

## Resources

### Documentation

- **Installation Guide**: `docs/nself-cli/Installation.md`
- **Quick Start**: `docs/nself-cli/Quick-Start.md`
- **Commands Reference**: `docs/nself-cli/Commands.md`
- **Services Guide**: `docs/nself-cli/Services.md`
- **Configuration**: `docs/nself-cli/Configuration.md`
- **Troubleshooting**: `docs/nself-cli/Troubleshooting.md`

### Official Links

- **Website**: https://nself.org
- **GitHub**: https://github.com/nself/nself
- **Documentation**: https://docs.nself.org
- **Discord**: https://discord.gg/nself
- **Twitter**: https://twitter.com/nself_dev

### Example Projects

- **nself-chat**: Full-featured team communication platform
- **nself-cms**: Headless content management system
- **nself-shop**: E-commerce starter
- **nself-social**: Social network boilerplate

### Community

- **Discord**: Join 5,000+ developers
- **GitHub Discussions**: Ask questions, share projects
- **Twitter**: Follow for updates and tips
- **YouTube**: Video tutorials and demos

---

## Next Steps

1. **Read the Quick Start** → Get up and running in 5 minutes
2. **Explore Services** → Learn what each service provides
3. **Review Commands** → Master the CLI
4. **Configure Your Stack** → Enable optional services
5. **Build Your App** → Focus on your application logic!

---

## Philosophy

nself CLI is built on these principles:

1. **Convention over Configuration** - Smart defaults that just work
2. **Developer Experience First** - Make common tasks effortless
3. **Production-Ready** - No "toy" configs, real battle-tested setups
4. **Open and Flexible** - No vendor lock-in, modify anything
5. **Community-Driven** - Built by developers, for developers

---

**Ready to build? Head to the [Quick Start Guide](./Quick-Start.md)!**
