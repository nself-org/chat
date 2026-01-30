# Kubernetes Deployment Guide

This guide covers deploying nself-chat to a Kubernetes cluster using kubectl.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manifests Overview](#manifests-overview)
- [Deployment Steps](#deployment-steps)
- [Configuration](#configuration)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured with cluster access
- Container registry access (ghcr.io)
- Ingress controller (nginx-ingress recommended)
- cert-manager (for TLS certificates)

## Quick Start

```bash
# Deploy with default settings
./scripts/k8s-deploy.sh

# Deploy to specific namespace
./scripts/k8s-deploy.sh --namespace production

# Deploy specific version
./scripts/k8s-deploy.sh --tag v1.0.0

# Preview changes (dry-run)
./scripts/k8s-deploy.sh --dry-run
```

## Manifests Overview

```
k8s/
├── namespace.yaml      # Namespace definition
├── configmap.yaml      # Application configuration
├── secrets.yaml        # Secrets template
├── deployment.yaml     # Main application deployment
├── service.yaml        # Service definitions
├── ingress.yaml        # Ingress rules
├── hpa.yaml           # Horizontal Pod Autoscaler
├── pdb.yaml           # Pod Disruption Budget
└── networkpolicy.yaml  # Network policies
```

### Manifest Details

#### namespace.yaml
Creates the `nself-chat` namespace with appropriate labels.

#### configmap.yaml
Non-sensitive configuration:
- `NODE_ENV`: Environment mode
- `NEXT_PUBLIC_*`: Public environment variables
- `LOG_LEVEL`: Logging verbosity

#### secrets.yaml
Sensitive data template (do not commit actual values):
- Database credentials
- Hasura admin secret
- JWT secret
- Redis password
- SMTP credentials

#### deployment.yaml
Application deployment with:
- Rolling update strategy
- Resource limits and requests
- Liveness, readiness, and startup probes
- Security context
- Affinity rules

#### service.yaml
ClusterIP service exposing port 80 internally.

#### ingress.yaml
Ingress rules with:
- TLS termination
- Rate limiting annotations
- WebSocket support
- Security headers

#### hpa.yaml
Autoscaling based on:
- CPU utilization (70% target)
- Memory utilization (80% target)
- Scale from 2 to 10 replicas

#### pdb.yaml
Pod Disruption Budget:
- Minimum 1 pod available during disruptions

#### networkpolicy.yaml
Network segmentation:
- Default deny ingress
- Allow from ingress controller
- Allow internal namespace communication
- Allow Prometheus scraping

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

**Important**: Never commit actual secrets to git!

Option A: Create from command line:
```bash
kubectl create secret generic nself-chat-secrets \
  --namespace=nself-chat \
  --from-literal=POSTGRES_USER=nchat \
  --from-literal=POSTGRES_PASSWORD=<password> \
  --from-literal=HASURA_ADMIN_SECRET=<secret> \
  --from-literal=HASURA_JWT_SECRET='{"type":"HS256","key":"<32-char-key>"}' \
  --from-literal=REDIS_PASSWORD=<password>
```

Option B: Use external secrets operator:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: nself-chat-secrets
spec:
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: nself-chat-secrets
  data:
    - secretKey: POSTGRES_PASSWORD
      remoteRef:
        key: nself-chat/postgres
        property: password
```

### 3. Create Image Pull Secret

If using a private registry:

```bash
kubectl create secret docker-registry nself-chat-registry \
  --namespace=nself-chat \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token>
```

### 4. Apply ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### 5. Deploy Application

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 6. Configure Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### 7. Enable Autoscaling

```bash
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
```

### 8. Apply Network Policies

```bash
kubectl apply -f k8s/networkpolicy.yaml
```

## Configuration

### Environment Variables

Update `configmap.yaml` for non-sensitive configuration:

```yaml
data:
  NODE_ENV: "production"
  NEXT_PUBLIC_APP_NAME: "My Chat App"
  LOG_LEVEL: "warn"
```

### Resource Limits

Adjust in `deployment.yaml`:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "256Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"
```

### Replica Count

For manual scaling:

```yaml
spec:
  replicas: 3
```

Or use HPA for automatic scaling.

### Ingress Configuration

Customize annotations in `ingress.yaml`:

```yaml
annotations:
  nginx.ingress.kubernetes.io/rate-limit: "20"
  nginx.ingress.kubernetes.io/proxy-body-size: "100m"
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment nself-chat --replicas=5 -n nself-chat
```

### Autoscaling

The HPA automatically scales based on metrics:

```yaml
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

View HPA status:

```bash
kubectl get hpa -n nself-chat
kubectl describe hpa nself-chat -n nself-chat
```

### Custom Metrics

For custom metrics (e.g., requests per second):

1. Install Prometheus Adapter
2. Configure custom metrics:

```yaml
metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

## Monitoring

### Health Checks

Verify pod health:

```bash
kubectl get pods -n nself-chat
kubectl describe pod <pod-name> -n nself-chat
```

### Logs

```bash
# All pods
kubectl logs -n nself-chat -l app.kubernetes.io/name=nself-chat

# Specific pod
kubectl logs -n nself-chat <pod-name>

# Follow logs
kubectl logs -f -n nself-chat -l app.kubernetes.io/name=nself-chat
```

### Events

```bash
kubectl get events -n nself-chat --sort-by='.lastTimestamp'
```

### Metrics

If Prometheus is installed:

```bash
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
```

Visit http://localhost:9090 and query:
- `container_cpu_usage_seconds_total{namespace="nself-chat"}`
- `container_memory_usage_bytes{namespace="nself-chat"}`

## Rollback

### Using kubectl

```bash
# View rollout history
kubectl rollout history deployment/nself-chat -n nself-chat

# Rollback to previous version
kubectl rollout undo deployment/nself-chat -n nself-chat

# Rollback to specific revision
kubectl rollout undo deployment/nself-chat --to-revision=3 -n nself-chat
```

### Using the rollback script

```bash
./scripts/rollback.sh --namespace nself-chat --revision 3
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n nself-chat

# Check events
kubectl get events -n nself-chat | grep <pod-name>

# Check logs
kubectl logs <pod-name> -n nself-chat --previous
```

Common issues:
- **ImagePullBackOff**: Check image name and registry credentials
- **CrashLoopBackOff**: Check application logs
- **Pending**: Check resource availability

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints nself-chat -n nself-chat

# Test service internally
kubectl run test --rm -it --image=curlimages/curl -- curl http://nself-chat.nself-chat.svc.cluster.local/api/health
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress nself-chat -n nself-chat

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### Network Policy Issues

Temporarily disable to test:

```bash
kubectl delete networkpolicy --all -n nself-chat
```

Then re-apply after testing.

### Resource Issues

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n nself-chat

# Check resource quotas
kubectl describe resourcequota -n nself-chat
```

## Security Best Practices

1. **Use RBAC**: Limit service account permissions
2. **Network Policies**: Restrict pod-to-pod communication
3. **Pod Security Standards**: Use restricted policies
4. **Image Scanning**: Scan images for vulnerabilities
5. **Secrets Management**: Use external secrets operator
6. **Audit Logging**: Enable Kubernetes audit logs

## Related Documentation

- [Docker Deployment](./Docker.md)
- [Helm Deployment](./Helm.md)
