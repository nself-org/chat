#!/bin/bash
# ============================================================================
# nself-chat Kubernetes Deployment Script
# ============================================================================
# Deploys nself-chat to a Kubernetes cluster using kubectl
#
# Usage:
#   ./scripts/k8s-deploy.sh                     # Deploy to default namespace
#   ./scripts/k8s-deploy.sh --namespace prod    # Deploy to specific namespace
#   ./scripts/k8s-deploy.sh --dry-run           # Preview changes
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
NAMESPACE="${NAMESPACE:-nself-chat}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DRY_RUN=false
WAIT=true
TIMEOUT="300s"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Options:
    -n, --namespace NS    Kubernetes namespace (default: nself-chat)
    -t, --tag TAG         Image tag (default: latest)
    -d, --dry-run         Preview changes without applying
    --no-wait             Don't wait for rollout
    --timeout DURATION    Rollout timeout (default: 300s)
    -h, --help            Show this help message

Examples:
    $(basename "$0")                           # Deploy to nself-chat namespace
    $(basename "$0") -n production             # Deploy to production namespace
    $(basename "$0") --tag v1.0.0              # Deploy specific version
    $(basename "$0") --dry-run                 # Preview changes

Environment Variables:
    NAMESPACE             Target namespace
    IMAGE_TAG             Image tag to deploy
    KUBECONFIG            Path to kubeconfig file
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-wait)
                WAIT=false
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

validate_environment() {
    log_info "Validating environment..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    if [ ! -d "$K8S_DIR" ]; then
        log_error "Kubernetes manifests directory not found: $K8S_DIR"
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        log_error "Please check your KUBECONFIG or cluster connection"
        exit 1
    fi

    log_info "Connected to cluster: $(kubectl config current-context)"
    log_info "Environment validation passed"
}

create_namespace() {
    log_info "Checking namespace: $NAMESPACE"

    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Namespace $NAMESPACE already exists"
    else
        log_info "Creating namespace: $NAMESPACE"
        if [ "$DRY_RUN" = true ]; then
            kubectl apply -f "$K8S_DIR/namespace.yaml" --dry-run=client
        else
            kubectl apply -f "$K8S_DIR/namespace.yaml"
        fi
    fi
}

apply_manifests() {
    local kubectl_args=()

    if [ "$DRY_RUN" = true ]; then
        kubectl_args+=("--dry-run=client")
    fi

    # Order matters for dependencies
    local manifests=(
        "configmap.yaml"
        "secrets.yaml"
        "networkpolicy.yaml"
        "service.yaml"
        "deployment.yaml"
        "ingress.yaml"
        "hpa.yaml"
        "pdb.yaml"
    )

    log_info "Applying Kubernetes manifests..."

    for manifest in "${manifests[@]}"; do
        local manifest_path="$K8S_DIR/$manifest"
        if [ -f "$manifest_path" ]; then
            log_info "Applying: $manifest"

            # Replace image tag in deployment
            if [ "$manifest" = "deployment.yaml" ]; then
                sed "s|:latest|:${IMAGE_TAG}|g" "$manifest_path" | \
                    kubectl apply -n "$NAMESPACE" "${kubectl_args[@]}" -f -
            else
                kubectl apply -n "$NAMESPACE" "${kubectl_args[@]}" -f "$manifest_path"
            fi
        else
            log_warn "Manifest not found: $manifest_path (skipping)"
        fi
    done

    log_info "Manifests applied successfully"
}

wait_for_rollout() {
    if [ "$WAIT" = false ] || [ "$DRY_RUN" = true ]; then
        return 0
    fi

    log_info "Waiting for deployment rollout (timeout: $TIMEOUT)..."

    if kubectl rollout status deployment/nself-chat -n "$NAMESPACE" --timeout="$TIMEOUT"; then
        log_info "Deployment rolled out successfully"
    else
        log_error "Deployment rollout failed or timed out"
        log_info "Checking pod status..."
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=nself-chat
        kubectl describe pods -n "$NAMESPACE" -l app.kubernetes.io/name=nself-chat | tail -50
        exit 1
    fi
}

verify_deployment() {
    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    log_info "Verifying deployment..."

    echo ""
    log_info "Deployment status:"
    kubectl get deployment nself-chat -n "$NAMESPACE"

    echo ""
    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=nself-chat

    echo ""
    log_info "Service status:"
    kubectl get svc nself-chat -n "$NAMESPACE"

    echo ""
    log_info "Ingress status:"
    kubectl get ingress -n "$NAMESPACE" 2>/dev/null || log_warn "No ingress found"
}

main() {
    parse_args "$@"
    validate_environment

    log_info "Starting deployment to namespace: $NAMESPACE"
    log_info "Image tag: $IMAGE_TAG"

    create_namespace
    apply_manifests
    wait_for_rollout
    verify_deployment

    echo ""
    log_info "Deployment completed successfully!"

    if [ "$DRY_RUN" = true ]; then
        log_warn "This was a dry run. No changes were applied."
    fi
}

main "$@"
