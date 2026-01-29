#!/bin/bash
# ============================================================================
# nself-chat Docker Push Script
# ============================================================================
# Pushes Docker images to the registry
#
# Usage:
#   ./scripts/docker-push.sh                    # Push latest
#   ./scripts/docker-push.sh --tag v1.0.0       # Push specific tag
#   ./scripts/docker-push.sh --all              # Push all local tags
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-nself/nself-chat}"
TAG="${IMAGE_TAG:-latest}"
PUSH_ALL=false

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

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Options:
    -t, --tag TAG         Image tag to push (default: latest)
    -r, --registry REG    Docker registry (default: ghcr.io)
    -n, --name NAME       Image name (default: nself/nself-chat)
    -a, --all             Push all local tags
    -h, --help            Show this help message

Examples:
    $(basename "$0")                    # Push latest
    $(basename "$0") --tag v1.0.0      # Push specific tag
    $(basename "$0") --all             # Push all local tags

Environment Variables:
    DOCKER_REGISTRY       Registry URL (default: ghcr.io)
    DOCKER_USERNAME       Registry username
    DOCKER_PASSWORD       Registry password/token
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                TAG="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -n|--name)
                IMAGE_NAME="$2"
                shift 2
                ;;
            -a|--all)
                PUSH_ALL=true
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

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    log_info "Environment validation passed"
}

docker_login() {
    log_info "Checking Docker authentication..."

    # Check if already logged in
    if docker info 2>/dev/null | grep -q "Username"; then
        log_info "Already logged in to Docker"
        return 0
    fi

    # Try to login if credentials are available
    if [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
        log_info "Logging in to $REGISTRY..."
        echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    else
        log_warn "Docker credentials not found in environment"
        log_warn "Attempting push anyway (may fail if not authenticated)"
    fi
}

push_single_tag() {
    local tag="$1"
    local full_image="${REGISTRY}/${IMAGE_NAME}:${tag}"

    log_info "Pushing: $full_image"

    if ! docker image inspect "$full_image" &> /dev/null; then
        log_error "Image not found locally: $full_image"
        return 1
    fi

    docker push "$full_image"

    if [ $? -eq 0 ]; then
        log_info "Successfully pushed: $full_image"
    else
        log_error "Failed to push: $full_image"
        return 1
    fi
}

push_all_tags() {
    log_info "Finding all local tags for ${REGISTRY}/${IMAGE_NAME}..."

    local tags
    tags=$(docker images --format "{{.Tag}}" "${REGISTRY}/${IMAGE_NAME}" | sort -u)

    if [ -z "$tags" ]; then
        log_error "No local images found for ${REGISTRY}/${IMAGE_NAME}"
        exit 1
    fi

    log_info "Found tags: $tags"

    local failed=0
    for tag in $tags; do
        if ! push_single_tag "$tag"; then
            ((failed++))
        fi
    done

    if [ $failed -gt 0 ]; then
        log_warn "$failed tag(s) failed to push"
        return 1
    fi
}

main() {
    parse_args "$@"
    validate_environment
    docker_login

    if [ "$PUSH_ALL" = true ]; then
        push_all_tags
    else
        push_single_tag "$TAG"
    fi

    log_info "Push completed successfully!"
}

main "$@"
