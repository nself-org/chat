#!/bin/bash
# ============================================================================
# nself-chat Helm Deployment Script
# ============================================================================
# Deploys nself-chat using Helm
#
# Usage:
#   ./scripts/helm-deploy.sh                              # Deploy with defaults
#   ./scripts/helm-deploy.sh --env production             # Deploy to production
#   ./scripts/helm-deploy.sh --env staging --dry-run      # Preview staging
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
RELEASE_NAME="${RELEASE_NAME:-nself-chat}"
NAMESPACE="${NAMESPACE:-nself-chat}"
ENVIRONMENT="${ENVIRONMENT:-}"
IMAGE_TAG="${IMAGE_TAG:-}"
DRY_RUN=false
WAIT=true
TIMEOUT="300"
ATOMIC=true

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HELM_DIR="$PROJECT_ROOT/helm/nself-chat"

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
    -r, --release NAME    Helm release name (default: nself-chat)
    -n, --namespace NS    Kubernetes namespace (default: nself-chat)
    -e, --env ENV         Environment: staging, production (loads values-ENV.yaml)
    -t, --tag TAG         Image tag override
    -d, --dry-run         Preview changes without applying
    --no-wait             Don't wait for deployment
    --no-atomic           Don't rollback on failure
    --timeout SECONDS     Deployment timeout (default: 300)
    -h, --help            Show this help message

Examples:
    $(basename "$0")                              # Deploy with default values
    $(basename "$0") --env production             # Deploy to production
    $(basename "$0") --env staging --tag v1.0.0  # Deploy specific version to staging
    $(basename "$0") --dry-run                    # Preview changes

Environment Variables:
    RELEASE_NAME          Helm release name
    NAMESPACE             Target namespace
    ENVIRONMENT           Target environment
    IMAGE_TAG             Image tag to deploy
    KUBECONFIG            Path to kubeconfig file
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -e|--env)
                ENVIRONMENT="$2"
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
            --no-atomic)
                ATOMIC=false
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

    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed or not in PATH"
        exit 1
    fi

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    if [ ! -d "$HELM_DIR" ]; then
        log_error "Helm chart directory not found: $HELM_DIR"
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_info "Connected to cluster: $(kubectl config current-context)"
    log_info "Environment validation passed"
}

update_dependencies() {
    log_info "Updating Helm dependencies..."
    helm dependency update "$HELM_DIR"
}

deploy() {
    local helm_args=(
        "upgrade"
        "--install"
        "$RELEASE_NAME"
        "$HELM_DIR"
        "--namespace" "$NAMESPACE"
        "--create-namespace"
    )

    # Add values files
    helm_args+=("--values" "$HELM_DIR/values.yaml")

    if [ -n "$ENVIRONMENT" ]; then
        local env_values="$HELM_DIR/values-${ENVIRONMENT}.yaml"
        if [ -f "$env_values" ]; then
            log_info "Using environment values: $env_values"
            helm_args+=("--values" "$env_values")
        else
            log_warn "Environment values file not found: $env_values"
        fi
    fi

    # Add image tag override
    if [ -n "$IMAGE_TAG" ]; then
        helm_args+=("--set" "image.tag=${IMAGE_TAG}")
    fi

    # Add flags
    if [ "$DRY_RUN" = true ]; then
        helm_args+=("--dry-run" "--debug")
    fi

    if [ "$WAIT" = true ]; then
        helm_args+=("--wait" "--timeout" "${TIMEOUT}s")
    fi

    if [ "$ATOMIC" = true ] && [ "$DRY_RUN" = false ]; then
        helm_args+=("--atomic")
    fi

    log_info "Deploying nself-chat..."
    log_info "Release: $RELEASE_NAME"
    log_info "Namespace: $NAMESPACE"
    log_info "Environment: ${ENVIRONMENT:-default}"
    log_info "Image tag: ${IMAGE_TAG:-chart default}"

    echo ""
    log_info "Executing: helm ${helm_args[*]}"
    echo ""

    helm "${helm_args[@]}"
}

verify_deployment() {
    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    log_info "Verifying deployment..."

    echo ""
    log_info "Helm release status:"
    helm status "$RELEASE_NAME" -n "$NAMESPACE"

    echo ""
    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
}

main() {
    parse_args "$@"
    validate_environment
    update_dependencies
    deploy
    verify_deployment

    echo ""
    log_info "Deployment completed successfully!"

    if [ "$DRY_RUN" = true ]; then
        log_warn "This was a dry run. No changes were applied."
    fi
}

main "$@"
