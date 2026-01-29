# nself-chat Deployment Guide

This directory contains all deployment configurations for nself-chat across different environments and platforms.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Directory Structure](#directory-structure)
- [Environment Setup](#environment-setup)
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Local Development

```bash
# Start all services with Docker Compose
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f nchat
```

### Production Deployment

```bash
# Deploy to Kubernetes (requires kubectl configured)
kubectl apply -f k8s/

# Or use Helm
helm install nself-chat ./helm/nself-chat -f helm/nself-chat/values-production.yaml

# Or use Terraform for full infrastructure
cd terraform && terraform apply
```

## Deployment Options

| Option | Best For | Complexity | Scale |
|--------|----------|------------|-------|
| **Docker Compose** | Local dev, small teams | Low | 1-10 users |
| **Kubernetes** | Production, enterprise | Medium | 10-10,000+ users |
| **Terraform + K8s** | Full infrastructure | High | 100-100,000+ users |
| **Managed Platforms** | Quick deployment | Low | Variable |

## Directory Structure

```
deploy/
├── docker/                     # Docker Compose configurations
│   ├── .env.development       # Development environment variables
│   ├── .env.staging           # Staging environment variables
│   ├── .env.production        # Production environment variables
│   ├── nginx/                 # Nginx configurations
│   ├── postgres/              # PostgreSQL configurations
│   └── redis/                 # Redis configurations
│
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml         # Namespace definition
│   ├── configmap.yaml         # Configuration maps
│   ├── secrets.yaml           # Secrets (template)
│   ├── deployment.yaml        # Application deployment
│   ├── service.yaml           # Services
│   ├── ingress.yaml           # Ingress rules
│   ├── hpa.yaml              # Horizontal Pod Autoscaler
│   ├── postgres-statefulset.yaml  # PostgreSQL StatefulSet
│   ├── redis-deployment.yaml      # Redis deployment
│   ├── minio-deployment.yaml      # MinIO deployment
│   └── monitoring/            # Monitoring stack
│       ├── prometheus-config.yaml
│       ├── grafana-deployment.yaml
│       └── alertmanager-config.yaml
│
├── helm/                      # Helm charts
│   └── nself-chat/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-production.yaml
│       ├── values-staging.yaml
│       └── templates/
│
├── terraform/                 # Terraform IaC
│   ├── main.tf               # Main configuration
│   ├── variables.tf          # Variable definitions
│   ├── outputs.tf            # Output values
│   ├── providers.tf          # Provider configurations
│   └── modules/              # Reusable modules
│       ├── vpc/
│       ├── eks/
│       ├── rds/
│       ├── redis/
│       └── s3/
│
└── README.md                  # This file
```

## Environment Setup

### 1. Development Environment

**Requirements:**
- Docker Desktop or Docker Engine
- Docker Compose v2.0+
- 8GB RAM minimum

**Setup:**

```bash
# Copy environment file
cp docker/.env.development .env.local

# Start services
docker compose up -d

# Verify
curl http://localhost:3000/api/health
```

**Services:**
- Application: http://localhost:3000
- Hasura Console: http://localhost:8080
- MinIO Console: http://localhost:9001
- Mailpit UI: http://localhost:8025

### 2. Staging Environment

**Requirements:**
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.0+
- 16GB RAM across nodes

**Setup:**

```bash
# Create namespace
kubectl create namespace nself-chat

# Deploy secrets (replace with actual values)
kubectl create secret generic nself-chat-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=hasura-admin-secret="..." \
  --from-literal=jwt-secret="..." \
  -n nself-chat

# Deploy with Helm
helm install nself-chat ./helm/nself-chat \
  -f helm/nself-chat/values-staging.yaml \
  -n nself-chat

# Verify deployment
kubectl get pods -n nself-chat
kubectl logs -f deployment/nself-chat -n nself-chat
```

### 3. Production Environment

**Requirements:**
- Kubernetes cluster (1.24+) with 3+ nodes
- kubectl configured
- Helm 3.0+
- Terraform 1.6+ (if using IaC)
- Managed database (AWS RDS, Cloud SQL, etc.)
- Secrets manager (AWS Secrets Manager, Vault, etc.)

**Setup with Terraform:**

```bash
# Navigate to Terraform directory
cd terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Configure kubectl with new cluster
aws eks update-kubeconfig --name nself-chat-production --region us-east-1

# Deploy application
cd ..
helm install nself-chat ./helm/nself-chat \
  -f helm/nself-chat/values-production.yaml \
  -n nself-chat \
  --create-namespace
```

## Prerequisites

### All Environments

- Git
- Command-line tools (bash, curl, jq)

### Docker Deployments

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- Minimum 8GB RAM, 20GB disk space

### Kubernetes Deployments

- Kubernetes cluster 1.24+
- kubectl 1.24+
- Helm 3.0+
- Minimum resources:
  - **Staging:** 3 nodes, 4 vCPU, 16GB RAM each
  - **Production:** 5+ nodes, 8 vCPU, 32GB RAM each

### Terraform Deployments

- Terraform 1.6+
- AWS CLI (for AWS deployments)
- Appropriate cloud provider credentials

## Deployment Methods

### Method 1: Docker Compose (Development)

**Pros:**
- Fast setup
- Easy debugging
- Local development

**Cons:**
- Not scalable
- Single-host only
- No high availability

**Steps:**

1. **Prepare environment:**
   ```bash
   cp docker/.env.development .env.local
   # Edit .env.local with your settings
   ```

2. **Start services:**
   ```bash
   docker compose up -d
   ```

3. **Initialize database:**
   ```bash
   docker compose exec nchat pnpm db:migrate
   docker compose exec nchat pnpm db:seed
   ```

4. **Access application:**
   - Application: http://localhost:3000
   - Login with: owner@nself.org / password123

### Method 2: Kubernetes (Staging/Production)

**Pros:**
- Highly scalable
- High availability
- Auto-healing
- Rolling updates

**Cons:**
- Complex setup
- Requires K8s knowledge
- Higher resource needs

**Steps:**

1. **Prepare cluster:**
   ```bash
   # Create namespace
   kubectl create namespace nself-chat

   # Create image pull secret (if using private registry)
   kubectl create secret docker-registry nself-chat-registry \
     --docker-server=ghcr.io \
     --docker-username=$GITHUB_USERNAME \
     --docker-password=$GITHUB_TOKEN \
     -n nself-chat
   ```

2. **Configure secrets:**
   ```bash
   # Create secrets from file
   kubectl create secret generic nself-chat-secrets \
     --from-env-file=docker/.env.production \
     -n nself-chat
   ```

3. **Deploy database:**
   ```bash
   kubectl apply -f k8s/postgres-statefulset.yaml
   kubectl apply -f k8s/redis-deployment.yaml
   kubectl apply -f k8s/minio-deployment.yaml
   ```

4. **Deploy application:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   kubectl apply -f k8s/hpa.yaml
   ```

5. **Deploy monitoring:**
   ```bash
   kubectl apply -f k8s/monitoring/
   ```

6. **Verify deployment:**
   ```bash
   kubectl get pods -n nself-chat
   kubectl logs -f deployment/nself-chat -n nself-chat
   ```

### Method 3: Helm Charts

**Pros:**
- Templated configurations
- Easy upgrades
- Version management
- Reusable

**Cons:**
- Learning curve
- Template complexity

**Steps:**

1. **Install chart:**
   ```bash
   helm install nself-chat ./helm/nself-chat \
     -f helm/nself-chat/values-production.yaml \
     -n nself-chat \
     --create-namespace
   ```

2. **Upgrade release:**
   ```bash
   helm upgrade nself-chat ./helm/nself-chat \
     -f helm/nself-chat/values-production.yaml \
     -n nself-chat
   ```

3. **Rollback if needed:**
   ```bash
   helm rollback nself-chat -n nself-chat
   ```

### Method 4: Terraform + Kubernetes

**Pros:**
- Full infrastructure automation
- Reproducible environments
- State management
- Multi-cloud support

**Cons:**
- Highest complexity
- Requires Terraform knowledge
- State management needed

**Steps:**

1. **Configure backend:**
   ```bash
   # Edit terraform/main.tf backend configuration
   # Set up S3 bucket and DynamoDB table for state
   ```

2. **Set variables:**
   ```bash
   # Create terraform/terraform.tfvars
   cat > terraform/terraform.tfvars <<EOF
   environment = "production"
   region = "us-east-1"
   cluster_name = "nself-chat-prod"
   domain_name = "nchat.example.com"
   EOF
   ```

3. **Deploy infrastructure:**
   ```bash
   cd terraform
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

4. **Configure kubectl:**
   ```bash
   aws eks update-kubeconfig --name nself-chat-prod --region us-east-1
   ```

5. **Deploy application:**
   ```bash
   cd ..
   helm install nself-chat ./helm/nself-chat \
     -f helm/nself-chat/values-production.yaml \
     -n nself-chat \
     --create-namespace
   ```

## Monitoring

### Prometheus Metrics

Access Prometheus:
```bash
kubectl port-forward svc/prometheus 9090:9090 -n nself-chat
# Open http://localhost:9090
```

### Grafana Dashboards

Access Grafana:
```bash
kubectl port-forward svc/grafana 3000:3000 -n nself-chat
# Open http://localhost:3000
# Default: admin / <from secret>
```

Pre-configured dashboards:
- Application Metrics
- Database Performance
- Redis Metrics
- Kubernetes Cluster Overview

### Alertmanager

Configure alerts in `k8s/monitoring/alertmanager-config.yaml`

Alerts configured:
- High error rate
- High response time
- Application down
- Database issues
- High resource usage

## Troubleshooting

### Common Issues

#### Pods not starting

```bash
# Check pod status
kubectl get pods -n nself-chat

# Check pod events
kubectl describe pod <pod-name> -n nself-chat

# Check logs
kubectl logs <pod-name> -n nself-chat
```

#### Database connection issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:16 --restart=Never -n nself-chat -- \
  psql -h postgres -U nchat_user -d nchat

# Check database pod
kubectl logs statefulset/postgres -n nself-chat
```

#### Image pull errors

```bash
# Verify image pull secret
kubectl get secret nself-chat-registry -n nself-chat

# Test image pull
docker pull ghcr.io/nself/nself-chat:latest
```

#### Ingress not working

```bash
# Check ingress status
kubectl get ingress -n nself-chat
kubectl describe ingress nself-chat -n nself-chat

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Kubernetes health
kubectl get --raw /healthz

# Database health
kubectl exec -it postgres-0 -n nself-chat -- pg_isready

# Redis health
kubectl exec -it deployment/redis -n nself-chat -- redis-cli ping
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n nself-chat
kubectl top nodes

# Scale deployment
kubectl scale deployment/nself-chat --replicas=5 -n nself-chat

# Check HPA status
kubectl get hpa -n nself-chat
```

## Security Considerations

### Secrets Management

**DO NOT** commit secrets to Git. Use:
- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault
- Environment variables

### Network Policies

Apply network policies to restrict pod communication:
```bash
kubectl apply -f k8s/networkpolicy.yaml
```

### SSL/TLS

Ensure all external traffic uses HTTPS:
- Configure cert-manager for Let's Encrypt
- Or provide your own certificates

### RBAC

Review and apply least-privilege RBAC:
```bash
kubectl apply -f k8s/rbac.yaml
```

## Backup and Recovery

### Database Backups

Automated backups configured via:
- Kubernetes CronJob (k8s/postgres-statefulset.yaml)
- RDS automated backups (Terraform)

Manual backup:
```bash
kubectl exec -it postgres-0 -n nself-chat -- \
  pg_dump -U nchat_user nchat > backup.sql
```

Restore:
```bash
kubectl exec -i postgres-0 -n nself-chat -- \
  psql -U nchat_user nchat < backup.sql
```

### Disaster Recovery

1. **Database:** Daily automated backups, 30-day retention
2. **Redis:** Snapshots every 6 hours
3. **Object Storage:** Versioning enabled, 30-day retention
4. **Configuration:** Stored in Git

## Scaling

### Horizontal Scaling

Automatically handled by HPA based on:
- CPU usage > 70%
- Memory usage > 80%

Manual scaling:
```bash
kubectl scale deployment/nself-chat --replicas=10 -n nself-chat
```

### Vertical Scaling

Update resource requests/limits in deployment.yaml or Helm values.

### Database Scaling

For RDS:
```bash
terraform apply -var="db_instance_class=db.r5.2xlarge"
```

## Cost Optimization

### Development

Use `docker compose` with local resources.

### Staging

- Use smaller instance types
- Single-AZ deployments
- Spot instances for non-critical workloads

### Production

- Multi-AZ for high availability
- Reserved instances for baseline
- Spot instances for burst capacity
- CloudWatch cost monitoring

## Support

For deployment issues:
- Check logs: `kubectl logs -f deployment/nself-chat -n nself-chat`
- Review events: `kubectl get events -n nself-chat`
- Consult runbook: `RUNBOOK.md`
- Open issue: https://github.com/nself/nself-chat/issues
