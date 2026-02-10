#!/bin/bash
# ============================================================================
# nself-chat Docker Build Script
# ============================================================================
# Builds the Docker image for nself-chat
#
# Usage:
#   ./scripts/docker-build.sh                    # Build with default tag
#   ./scripts/docker-build.sh --tag v1.0.0       # Build with specific tag
#   ./scripts/docker-build.sh --dev              # Build development image
#   ./scripts/docker-build.sh --push             # Build and push
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-nself/nself-chat}"
TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="Dockerfile"
BUILD_CONTEXT="."
PUSH=false
DEV_MODE=false
NO_CACHE=false
PLATFORM="${BUILD_PLATFORM:-linux/amd64}"

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
    -t, --tag TAG         Image tag (default: latest)
    -r, --registry REG    Docker registry (default: ghcr.io)
    -n, --name NAME       Image name (default: nself/nself-chat)
    -d, --dev             Build development image
    -p, --push            Push after building
    --no-cache            Build without cache
    --platform PLATFORM   Target platform (default: linux/amd64)
    -h, --help            Show this help message

Examples:
    $(basename "$0")                           # Build latest
    $(basename "$0") --tag v1.0.0             # Build with tag
    $(basename "$0") --dev                     # Build dev image
    $(basename "$0") --tag v1.0.0 --push      # Build and push
    $(basename "$0") --platform linux/arm64   # Build for ARM64
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
            -d|--dev)
                DEV_MODE=true
                DOCKERFILE="Dockerfile.dev"
                TAG="${TAG:-dev}"
                shift
                ;;
            -p|--push)
                PUSH=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --platform)
                PLATFORM="$2"
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

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if [ ! -f "$PROJECT_ROOT/$DOCKERFILE" ]; then
        log_error "Dockerfile not found: $PROJECT_ROOT/$DOCKERFILE"
        exit 1
    fi

    log_info "Environment validation passed"
}

build_image() {
    local full_image="${REGISTRY}/${IMAGE_NAME}:${TAG}"
    local build_args=()

    log_info "Building Docker image: $full_image"
    log_info "Using Dockerfile: $DOCKERFILE"
    log_info "Platform: $PLATFORM"

    # Build arguments
    build_args+=(
        "--file" "$PROJECT_ROOT/$DOCKERFILE"
        "--tag" "$full_image"
        "--platform" "$PLATFORM"
    )

    # Add cache control
    if [ "$NO_CACHE" = true ]; then
        build_args+=("--no-cache")
    fi

    # Add build-time variables for production
    if [ "$DEV_MODE" = false ]; then
        build_args+=(
            "--build-arg" "NEXT_PUBLIC_ENV=production"
        )

        # Pass through environment variables if set
        if [ -n "${NEXT_PUBLIC_GRAPHQL_URL:-}" ]; then
            build_args+=("--build-arg" "NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL}")
        fi
        if [ -n "${NEXT_PUBLIC_AUTH_URL:-}" ]; then
            build_args+=("--build-arg" "NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}")
        fi
        if [ -n "${NEXT_PUBLIC_STORAGE_URL:-}" ]; then
            build_args+=("--build-arg" "NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}")
        fi
    fi

    # Add labels
    build_args+=(
        "--label" "org.opencontainers.image.source=https://github.com/nself/nself-chat"
        "--label" "org.opencontainers.image.version=${TAG}"
        "--label" "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    )

    # Build context
    build_args+=("$PROJECT_ROOT")

    # Execute build
    log_info "Executing: docker build ${build_args[*]}"
    docker build "${build_args[@]}"

    if [ $? -eq 0 ]; then
        log_info "Successfully built: $full_image"

        # Also tag as latest if not already
        if [ "$TAG" != "latest" ] && [ "$DEV_MODE" = false ]; then
            local latest_image="${REGISTRY}/${IMAGE_NAME}:latest"
            docker tag "$full_image" "$latest_image"
            log_info "Also tagged as: $latest_image"
        fi
    else
        log_error "Failed to build image"
        exit 1
    fi
}

push_image() {
    local full_image="${REGISTRY}/${IMAGE_NAME}:${TAG}"

    log_info "Pushing image: $full_image"
    docker push "$full_image"

    if [ "$TAG" != "latest" ] && [ "$DEV_MODE" = false ]; then
        local latest_image="${REGISTRY}/${IMAGE_NAME}:latest"
        log_info "Pushing image: $latest_image"
        docker push "$latest_image"
    fi

    log_info "Successfully pushed images"
}

main() {
    cd "$PROJECT_ROOT"

    parse_args "$@"
    validate_environment
    build_image

    if [ "$PUSH" = true ]; then
        push_image
    fi

    log_info "Build completed successfully!"
}

main "$@"
