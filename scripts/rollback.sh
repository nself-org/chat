#!/bin/bash
# ============================================================================
# nself-chat Rollback Script
# ============================================================================
# Rolls back a deployment to a previous version
#
# Usage:
#   ./scripts/rollback.sh                          # Rollback to previous version
#   ./scripts/rollback.sh --revision 3             # Rollback to specific revision
#   ./scripts/rollback.sh --helm                   # Use Helm rollback
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
REVISION=""
USE_HELM=false
DRY_RUN=false
WAIT=true

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    --revision REV        Target revision number
    --helm                Use Helm for rollback (otherwise kubectl)
    -d, --dry-run         Preview rollback without applying
    --no-wait             Don't wait for rollback completion
    -h, --help            Show this help message

Examples:
    $(basename "$0")                    # Rollback to previous version
    $(basename "$0") --revision 3       # Rollback to revision 3
    $(basename "$0") --helm             # Use Helm rollback
    $(basename "$0") --dry-run          # Preview rollback

Notes:
    - Without --revision, rolls back to the previous version
    - Use 'kubectl rollout history' or 'helm history' to see available revisions
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
            --revision)
                REVISION="$2"
                shift 2
                ;;
            --helm)
                USE_HELM=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-wait)
                WAIT=false
                shift
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

    if [ "$USE_HELM" = true ] && ! command -v helm &> /dev/null; then
        log_error "Helm is not installed or not in PATH"
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_info "Connected to cluster: $(kubectl config current-context)"
}

show_history() {
    log_info "Deployment history:"
    echo ""

    if [ "$USE_HELM" = true ]; then
        helm history "$RELEASE_NAME" -n "$NAMESPACE"
    else
        kubectl rollout history deployment/nself-chat -n "$NAMESPACE"
    fi

    echo ""
}

kubectl_rollback() {
    log_info "Rolling back using kubectl..."

    local kubectl_args=(
        "rollout"
        "undo"
        "deployment/nself-chat"
        "-n" "$NAMESPACE"
    )

    if [ -n "$REVISION" ]; then
        kubectl_args+=("--to-revision=$REVISION")
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "Would execute: kubectl ${kubectl_args[*]}"
        return 0
    fi

    kubectl "${kubectl_args[@]}"

    if [ "$WAIT" = true ]; then
        log_info "Waiting for rollback to complete..."
        kubectl rollout status deployment/nself-chat -n "$NAMESPACE" --timeout=300s
    fi
}

helm_rollback() {
    log_info "Rolling back using Helm..."

    local helm_args=(
        "rollback"
        "$RELEASE_NAME"
        "-n" "$NAMESPACE"
    )

    if [ -n "$REVISION" ]; then
        helm_args+=("$REVISION")
    fi

    if [ "$WAIT" = true ]; then
        helm_args+=("--wait" "--timeout" "300s")
    fi

    if [ "$DRY_RUN" = true ]; then
        helm_args+=("--dry-run")
    fi

    helm "${helm_args[@]}"
}

verify_rollback() {
    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    log_info "Verifying rollback..."
    echo ""

    log_info "Current deployment status:"
    kubectl get deployment nself-chat -n "$NAMESPACE"
    echo ""

    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=nself-chat
    echo ""

    if [ "$USE_HELM" = true ]; then
        log_info "Helm release status:"
        helm status "$RELEASE_NAME" -n "$NAMESPACE"
    fi
}

main() {
    parse_args "$@"
    validate_environment

    log_info "Starting rollback for: $RELEASE_NAME"
    log_info "Namespace: $NAMESPACE"
    log_info "Target revision: ${REVISION:-previous}"

    show_history

    # Confirm rollback
    if [ "$DRY_RUN" = false ]; then
        echo ""
        read -p "Proceed with rollback? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    if [ "$USE_HELM" = true ]; then
        helm_rollback
    else
        kubectl_rollback
    fi

    verify_rollback

    echo ""
    if [ "$DRY_RUN" = true ]; then
        log_warn "This was a dry run. No changes were applied."
    else
        log_info "Rollback completed successfully!"
    fi
}

main "$@"
