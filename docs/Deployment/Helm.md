# Helm Deployment Guide

This guide covers deploying nself-chat using Helm charts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Chart Overview](#chart-overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Upgrading](#upgrading)
- [Rollback](#rollback)
- [Uninstallation](#uninstallation)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Kubernetes cluster (1.25+)
- Helm 3.x
- kubectl configured with cluster access
- Container registry access

## Quick Start

```bash
# Deploy with defaults
./scripts/helm-deploy.sh

# Deploy to staging
./scripts/helm-deploy.sh --env staging

# Deploy to production
./scripts/helm-deploy.sh --env production --tag v1.0.0

# Preview changes
./scripts/helm-deploy.sh --dry-run
```

## Chart Overview

```
helm/nself-chat/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values-production.yaml  # Production overrides
├── values-staging.yaml     # Staging overrides
└── templates/
    ├── _helpers.tpl        # Template helpers
    ├── deployment.yaml     # Deployment template
    ├── service.yaml        # Service template
    ├── ingress.yaml        # Ingress template
    ├── configmap.yaml      # ConfigMap template
    ├── secrets.yaml        # Secrets template
    ├── hpa.yaml           # HPA template
    ├── pdb.yaml           # PDB template
    ├── serviceaccount.yaml # ServiceAccount template
    └── networkpolicy.yaml  # NetworkPolicy template
```

### Chart Dependencies

Optional dependencies (disabled by default):

```yaml
dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: "18.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

## Installation

### From Local Chart

```bash
# Update dependencies
helm dependency update ./helm/nself-chat

# Install
helm install nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  --create-namespace

# Install with custom values
helm install nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  --create-namespace \
  --values ./helm/nself-chat/values.yaml \
  --values ./helm/nself-chat/values-production.yaml \
  --set image.tag=v1.0.0
```

### From OCI Registry

```bash
# Login to registry
helm registry login ghcr.io -u <username>

# Install from OCI
helm install nself-chat oci://ghcr.io/nself/charts/nself-chat \
  --version 0.2.0 \
  --namespace nself-chat \
  --create-namespace
```

### With Environment Values

```bash
# Staging
helm install nself-chat ./helm/nself-chat \
  -f ./helm/nself-chat/values.yaml \
  -f ./helm/nself-chat/values-staging.yaml \
  --namespace nself-chat-staging \
  --create-namespace

# Production
helm install nself-chat ./helm/nself-chat \
  -f ./helm/nself-chat/values.yaml \
  -f ./helm/nself-chat/values-production.yaml \
  --namespace nself-chat \
  --create-namespace
```

## Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `ghcr.io/nself/nself-chat` |
| `image.tag` | Image tag | Chart appVersion |
| `image.pullPolicy` | Pull policy | `IfNotPresent` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.hosts` | Ingress hosts | `[{host: chat.nself.io}]` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `256Mi` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Min replicas | `2` |
| `autoscaling.maxReplicas` | Max replicas | `10` |

### External Services

Configure external service URLs:

```yaml
externalServices:
  graphql:
    url: https://api.example.com/v1/graphql
  auth:
    url: https://auth.example.com
  storage:
    url: https://storage.example.com
```

### Secrets

**Option 1**: Use existing secret (recommended):

```yaml
secrets:
  create: false
  existingSecret: my-existing-secret
```

**Option 2**: Create from values (not recommended for production):

```yaml
secrets:
  create: true
  hasuraAdminSecret: "change-me"
  hasuraJwtSecret: '{"type":"HS256","key":"..."}'
  postgresPassword: "change-me"
  redisPassword: "change-me"
```

### Ingress

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: chat.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: chat-tls
      hosts:
        - chat.example.com
```

### Resources

```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

## Upgrading

### Standard Upgrade

```bash
helm upgrade nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  --reuse-values \
  --set image.tag=v1.1.0
```

### Upgrade with New Values

```bash
helm upgrade nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  -f ./helm/nself-chat/values.yaml \
  -f ./helm/nself-chat/values-production.yaml \
  --set image.tag=v1.1.0
```

### Atomic Upgrade

Automatically rollback on failure:

```bash
helm upgrade nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  --atomic \
  --timeout 300s
```

### Check Upgrade Status

```bash
helm status nself-chat -n nself-chat
kubectl rollout status deployment/nself-chat -n nself-chat
```

## Rollback

### View History

```bash
helm history nself-chat -n nself-chat
```

### Rollback to Previous

```bash
helm rollback nself-chat -n nself-chat
```

### Rollback to Specific Revision

```bash
helm rollback nself-chat 3 -n nself-chat
```

### Using Rollback Script

```bash
./scripts/rollback.sh --helm --namespace nself-chat --revision 3
```

## Uninstallation

```bash
# Uninstall release
helm uninstall nself-chat -n nself-chat

# Delete namespace (optional)
kubectl delete namespace nself-chat

# Delete PVCs (if using persistent storage)
kubectl delete pvc -n nself-chat --all
```

## Customization

### Custom Values File

Create a custom values file:

```yaml
# my-values.yaml
app:
  name: "My Chat"
  environment: production

image:
  tag: v1.0.0

replicaCount: 3

ingress:
  hosts:
    - host: chat.mycompany.com
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    cpu: 200m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

Install with custom values:

```bash
helm install nself-chat ./helm/nself-chat \
  -f my-values.yaml \
  --namespace nself-chat
```

### Template Customization

To customize templates, copy and modify:

```bash
# Export current templates
helm template nself-chat ./helm/nself-chat > manifests.yaml

# Modify as needed
# Apply directly with kubectl
kubectl apply -f manifests.yaml
```

### Adding Extra Resources

Add extra templates in `templates/`:

```yaml
# templates/extra-configmap.yaml
{{- if .Values.extraConfig }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "nself-chat.fullname" . }}-extra
data:
  {{- toYaml .Values.extraConfig | nindent 2 }}
{{- end }}
```

### Hooks

Add lifecycle hooks:

```yaml
# templates/hooks/pre-upgrade-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "nself-chat.fullname" . }}-pre-upgrade
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: pre-upgrade
          image: {{ include "nself-chat.image" . }}
          command: ["npm", "run", "db:migrate"]
      restartPolicy: Never
```

## Troubleshooting

### Helm Commands

```bash
# Check release status
helm status nself-chat -n nself-chat

# Get release values
helm get values nself-chat -n nself-chat

# Get release manifest
helm get manifest nself-chat -n nself-chat

# Test chart rendering
helm template nself-chat ./helm/nself-chat --debug
```

### Common Issues

#### Dependency Update Failed

```bash
# Clear cache and retry
rm -rf ./helm/nself-chat/charts ./helm/nself-chat/Chart.lock
helm dependency update ./helm/nself-chat
```

#### Template Rendering Errors

```bash
# Debug template rendering
helm template nself-chat ./helm/nself-chat --debug 2>&1 | head -100
```

#### Installation Timeout

```bash
# Increase timeout
helm install nself-chat ./helm/nself-chat \
  --timeout 600s \
  --wait
```

#### Values Not Applied

```bash
# Check computed values
helm get values nself-chat -n nself-chat -a

# Re-apply with explicit values
helm upgrade nself-chat ./helm/nself-chat \
  --namespace nself-chat \
  -f values.yaml \
  --force
```

### Debug Mode

```bash
# Enable debug output
helm install nself-chat ./helm/nself-chat \
  --debug \
  --dry-run
```

### Pod Issues

```bash
# Check pods
kubectl get pods -n nself-chat -l app.kubernetes.io/name=nself-chat

# Describe pod
kubectl describe pod <pod-name> -n nself-chat

# Check logs
kubectl logs -n nself-chat -l app.kubernetes.io/name=nself-chat
```

## Best Practices

1. **Use values files** for environment-specific configuration
2. **Never commit secrets** to values files
3. **Use semantic versioning** for chart and image tags
4. **Test with --dry-run** before applying
5. **Use --atomic** for production upgrades
6. **Keep chart dependencies updated**
7. **Document custom values** in README

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Deploy to Kubernetes
  run: |
    helm upgrade --install nself-chat ./helm/nself-chat \
      --namespace nself-chat \
      --create-namespace \
      -f ./helm/nself-chat/values.yaml \
      -f ./helm/nself-chat/values-production.yaml \
      --set image.tag=${{ github.sha }} \
      --wait \
      --atomic \
      --timeout 300s
```

## Related Documentation

- [Docker Deployment](./Docker.md)
- [Kubernetes Deployment](./Kubernetes.md)
