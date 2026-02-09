#!/bin/bash
# ============================================================================
# nself-chat Staging Deployment Script
# ============================================================================
# Deploys nself-chat to staging environment with comprehensive validation
# - Pre-deployment checks and validation
# - Backend deployment via Docker/K8s
# - Frontend build and deployment
# - Post-deployment health checks
# - Automated rollback on failure
#
# Usage:
#   ./scripts/deploy-staging.sh                    # Full staging deployment
#   ./scripts/deploy-staging.sh --skip-tests       # Skip test suite
#   ./scripts/deploy-staging.sh --dry-run          # Preview changes
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
ENVIRONMENT="staging"
NAMESPACE="nself-chat-staging"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-nself/nself-chat}"
DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false
SKIP_VALIDATION=false
SKIP_HEALTH_CHECK=false
AUTO_ROLLBACK=true
DEPLOYMENT_TIMEOUT="300s"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

# Deployment tracking
DEPLOYMENT_START_TIME=""
PREVIOUS_REVISION=""
DEPLOYED_REVISION=""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}==>${NC} $1"
}

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Deploy nself-chat to staging environment with validation and health checks.

Options:
    --skip-tests          Skip test suite execution
    --skip-build          Skip Docker image build
    --skip-validation     Skip pre-deployment validation
    --skip-health-check   Skip post-deployment health checks
    --no-rollback         Disable automatic rollback on failure
    --tag TAG             Image tag (default: git commit SHA)
    --dry-run             Preview deployment without executing
    -h, --help            Show this help message

Examples:
    $(basename "$0")                           # Full staging deployment
    $(basename "$0") --skip-tests             # Skip tests
    $(basename "$0") --tag v1.0.0             # Deploy specific version
    $(basename "$0") --dry-run                # Preview deployment

Environment Variables:
    IMAGE_TAG             Image tag to deploy (default: git SHA)
    DOCKER_REGISTRY       Docker registry (default: ghcr.io)
    NAMESPACE             K8s namespace (default: nself-chat-staging)
    KUBECONFIG            Path to kubeconfig file

Prerequisites:
    - kubectl configured for staging cluster
    - Docker registry authentication
    - Build tools (Docker, Node.js, pnpm)
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --no-rollback)
                AUTO_ROLLBACK=false
                shift
                ;;
            --tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
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
    if [ "$SKIP_VALIDATION" = true ]; then
        log_warn "Skipping environment validation"
        return 0
    fi

    log_step "Validating environment"

    # Check required tools
    local required_tools=("docker" "kubectl" "node" "pnpm" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    log_info "✓ All required tools available"

    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        log_error "Check KUBECONFIG and cluster connection"
        exit 1
    fi
    log_info "✓ Connected to cluster: $(kubectl config current-context)"

    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warn "Namespace $NAMESPACE does not exist"
        if [ "$DRY_RUN" = false ]; then
            read -p "Create namespace? (y/N) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl create namespace "$NAMESPACE"
                log_info "✓ Created namespace: $NAMESPACE"
            else
                log_error "Deployment requires namespace $NAMESPACE"
                exit 1
            fi
        fi
    else
        log_info "✓ Namespace exists: $NAMESPACE"
    fi

    # Check Docker registry authentication
    if [ "$SKIP_BUILD" = false ]; then
        if docker info > /dev/null 2>&1; then
            log_info "✓ Docker daemon is running"
        else
            log_error "Docker daemon is not running"
            exit 1
        fi
    fi

    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Working directory has uncommitted changes"
        if [ "$DRY_RUN" = false ]; then
            git status --short
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi

    log_info "Environment validation passed"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warn "Skipping test suite"
        return 0
    fi

    log_step "Running test suite"

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = false ]; then
        # Run unit tests
        log_info "Running unit tests..."
        if ! pnpm test --passWithNoTests --maxWorkers=2 > /tmp/test-staging.log 2>&1; then
            log_error "Unit tests failed"
            cat /tmp/test-staging.log | tail -50
            exit 1
        fi
        log_info "✓ Unit tests passed"

        # Type check
        log_info "Running type check..."
        if ! pnpm type-check > /tmp/typecheck-staging.log 2>&1; then
            log_error "Type check failed"
            cat /tmp/typecheck-staging.log | tail -20
            exit 1
        fi
        log_info "✓ Type check passed"

        # Lint
        log_info "Running linter..."
        if ! pnpm lint > /tmp/lint-staging.log 2>&1; then
            log_warn "Linter warnings found (non-blocking)"
        else
            log_info "✓ Linter passed"
        fi
    else
        log_info "[DRY RUN] Would run test suite"
    fi

    log_info "All tests passed"
}

build_image() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warn "Skipping Docker image build"
        return 0
    fi

    log_step "Building Docker image"

    local full_image="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

    if [ "$DRY_RUN" = false ]; then
        log_info "Building image: $full_image"

        # Build using existing docker-build.sh script
        if [ -f "$SCRIPT_DIR/docker-build.sh" ]; then
            "$SCRIPT_DIR/docker-build.sh" \
                --tag "$IMAGE_TAG" \
                --registry "$REGISTRY" \
                --name "$IMAGE_NAME" \
                --push
        else
            log_error "docker-build.sh not found"
            exit 1
        fi

        log_info "✓ Image built and pushed: $full_image"
    else
        log_info "[DRY RUN] Would build and push: $full_image"
    fi
}

save_current_state() {
    log_step "Saving current deployment state"

    if [ "$DRY_RUN" = false ]; then
        # Get current revision
        if kubectl get deployment nself-chat -n "$NAMESPACE" &> /dev/null; then
            PREVIOUS_REVISION=$(kubectl rollout history deployment/nself-chat -n "$NAMESPACE" | tail -2 | head -1 | awk '{print $1}')
            log_info "Current revision: $PREVIOUS_REVISION"
        else
            log_info "No existing deployment found"
        fi
    else
        log_info "[DRY RUN] Would save current state"
    fi
}

deploy_application() {
    log_step "Deploying application"

    DEPLOYMENT_START_TIME=$(date +%s)

    if [ "$DRY_RUN" = false ]; then
        # Update image in deployment
        log_info "Updating deployment image..."
        kubectl set image deployment/nself-chat \
            nself-chat="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" \
            -n "$NAMESPACE"

        # Wait for rollout
        log_info "Waiting for rollout to complete (timeout: $DEPLOYMENT_TIMEOUT)..."
        if kubectl rollout status deployment/nself-chat \
            -n "$NAMESPACE" \
            --timeout="$DEPLOYMENT_TIMEOUT"; then
            log_info "✓ Deployment rollout completed"
            DEPLOYED_REVISION=$(kubectl rollout history deployment/nself-chat -n "$NAMESPACE" | tail -1 | awk '{print $1}')
        else
            log_error "Deployment rollout failed or timed out"
            return 1
        fi
    else
        log_info "[DRY RUN] Would deploy image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    fi
}

health_check() {
    if [ "$SKIP_HEALTH_CHECK" = true ]; then
        log_warn "Skipping health checks"
        return 0
    fi

    log_step "Running health checks"

    local retry_count=0
    local all_healthy=false

    while [ $retry_count -lt $HEALTH_CHECK_RETRIES ]; do
        if [ "$DRY_RUN" = false ]; then
            log_info "Health check attempt $((retry_count + 1))/$HEALTH_CHECK_RETRIES"

            # Check pod status
            local ready_pods=$(kubectl get pods -n "$NAMESPACE" \
                -l app.kubernetes.io/name=nself-chat \
                -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}' | wc -w)

            local total_pods=$(kubectl get deployment nself-chat -n "$NAMESPACE" \
                -o jsonpath='{.spec.replicas}')

            log_info "Ready pods: $ready_pods/$total_pods"

            if [ "$ready_pods" -eq "$total_pods" ]; then
                # All pods running, check HTTP endpoint
                local service_ip=$(kubectl get svc nself-chat -n "$NAMESPACE" \
                    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

                if [ -n "$service_ip" ]; then
                    if curl -f -s -o /dev/null "http://$service_ip/api/health" 2>/dev/null; then
                        log_info "✓ Health endpoint responding"
                        all_healthy=true
                        break
                    else
                        log_warn "Health endpoint not responding yet"
                    fi
                else
                    log_warn "Service IP not yet assigned"
                fi
            fi

            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $HEALTH_CHECK_RETRIES ]; then
                log_info "Waiting ${HEALTH_CHECK_DELAY}s before retry..."
                sleep $HEALTH_CHECK_DELAY
            fi
        else
            log_info "[DRY RUN] Would perform health check"
            all_healthy=true
            break
        fi
    done

    if [ "$all_healthy" = true ]; then
        log_info "✓ All health checks passed"
        return 0
    else
        log_error "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
        return 1
    fi
}

rollback_deployment() {
    log_step "Rolling back deployment"

    if [ -z "$PREVIOUS_REVISION" ]; then
        log_error "No previous revision found, cannot rollback"
        return 1
    fi

    if [ "$DRY_RUN" = false ]; then
        log_warn "Rolling back to revision: $PREVIOUS_REVISION"

        if [ -f "$SCRIPT_DIR/rollback.sh" ]; then
            "$SCRIPT_DIR/rollback.sh" \
                --namespace "$NAMESPACE" \
                --revision "$PREVIOUS_REVISION" \
                <<< "y"
        else
            kubectl rollout undo deployment/nself-chat \
                -n "$NAMESPACE" \
                --to-revision="$PREVIOUS_REVISION"

            kubectl rollout status deployment/nself-chat \
                -n "$NAMESPACE" \
                --timeout="$DEPLOYMENT_TIMEOUT"
        fi

        log_info "✓ Rollback completed"
    else
        log_info "[DRY RUN] Would rollback to revision: $PREVIOUS_REVISION"
    fi
}

print_deployment_info() {
    log_step "Deployment Information"

    echo ""
    echo "Environment:    $ENVIRONMENT"
    echo "Namespace:      $NAMESPACE"
    echo "Image:          ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    echo "Revision:       ${DEPLOYED_REVISION:-N/A}"
    echo ""

    if [ "$DRY_RUN" = false ]; then
        echo "Service URLs:"
        kubectl get ingress -n "$NAMESPACE" 2>/dev/null || echo "  No ingress configured"
        echo ""

        echo "Pod Status:"
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=nself-chat
        echo ""
    fi

    if [ -n "$DEPLOYMENT_START_TIME" ]; then
        local end_time=$(date +%s)
        local duration=$((end_time - DEPLOYMENT_START_TIME))
        echo "Deployment duration: ${duration}s"
        echo ""
    fi
}

cleanup() {
    local exit_code=$?

    if [ $exit_code -ne 0 ] && [ "$AUTO_ROLLBACK" = true ] && [ "$DRY_RUN" = false ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_warn "Initiating automatic rollback..."
        rollback_deployment || log_error "Rollback failed"
    fi

    exit $exit_code
}

main() {
    # Set up cleanup trap
    trap cleanup EXIT ERR

    parse_args "$@"

    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       nself-chat Staging Deployment                      ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""

    validate_environment
    run_tests
    build_image
    save_current_state
    deploy_application

    # Run health checks
    if ! health_check; then
        log_error "Health checks failed"
        if [ "$AUTO_ROLLBACK" = true ]; then
            rollback_deployment
        fi
        exit 1
    fi

    print_deployment_info

    echo ""
    log_info "Staging deployment completed successfully!"

    if [ "$DRY_RUN" = true ]; then
        log_warn "This was a dry run. No changes were applied."
    fi
}

main "$@"
