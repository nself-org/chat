#!/bin/sh
# ============================================================================
# nself-chat Container Entrypoint Script
# ============================================================================
# Handles container initialization and graceful shutdown
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# Signal Handlers
# ============================================================================

cleanup() {
    log_info "Received shutdown signal, gracefully stopping..."

    # Send SIGTERM to the main process
    if [ -n "$MAIN_PID" ]; then
        kill -TERM "$MAIN_PID" 2>/dev/null || true

        # Wait for graceful shutdown (max 30 seconds)
        timeout=30
        while kill -0 "$MAIN_PID" 2>/dev/null && [ $timeout -gt 0 ]; do
            sleep 1
            timeout=$((timeout - 1))
        done

        # Force kill if still running
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            log_warn "Process did not terminate gracefully, forcing..."
            kill -KILL "$MAIN_PID" 2>/dev/null || true
        fi
    fi

    log_info "Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# ============================================================================
# Environment Validation
# ============================================================================

validate_environment() {
    log_info "Validating environment..."

    # Required variables for production
    if [ "$NODE_ENV" = "production" ]; then
        REQUIRED_VARS="NEXT_PUBLIC_GRAPHQL_URL NEXT_PUBLIC_AUTH_URL"

        for var in $REQUIRED_VARS; do
            eval "value=\$$var"
            if [ -z "$value" ]; then
                log_error "Required environment variable $var is not set"
                exit 1
            fi
        done
    fi

    log_info "Environment validation passed"
}

# ============================================================================
# Health Check Wait
# ============================================================================

wait_for_services() {
    log_info "Waiting for dependent services..."

    # Wait for GraphQL endpoint if configured
    if [ -n "$NEXT_PUBLIC_GRAPHQL_URL" ]; then
        log_info "Waiting for GraphQL endpoint..."
        timeout=60
        while [ $timeout -gt 0 ]; do
            if curl -sf "${NEXT_PUBLIC_GRAPHQL_URL}" -X POST \
                -H "Content-Type: application/json" \
                -d '{"query":"{ __typename }"}' > /dev/null 2>&1; then
                log_info "GraphQL endpoint is ready"
                break
            fi
            sleep 1
            timeout=$((timeout - 1))
        done

        if [ $timeout -eq 0 ]; then
            log_warn "GraphQL endpoint not ready after 60 seconds, continuing anyway..."
        fi
    fi
}

# ============================================================================
# Pre-start Tasks
# ============================================================================

run_prestart() {
    log_info "Running pre-start tasks..."

    # Create tmp directory if needed
    if [ ! -d "/tmp" ]; then
        mkdir -p /tmp
    fi

    # Run database migrations if enabled
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        log_info "Running database migrations..."
        # Add migration command here
        # pnpm run db:migrate || log_warn "Migration failed, continuing..."
    fi

    log_info "Pre-start tasks completed"
}

# ============================================================================
# Main Entry Point
# ============================================================================

main() {
    log_info "Starting nself-chat container..."
    log_info "Node.js version: $(node --version)"
    log_info "Environment: ${NODE_ENV:-development}"

    # Run initialization steps
    validate_environment

    # Wait for services in production
    if [ "$NODE_ENV" = "production" ] && [ "$SKIP_SERVICE_WAIT" != "true" ]; then
        wait_for_services
    fi

    run_prestart

    # Start the application
    log_info "Starting Next.js application..."

    if [ "$NODE_ENV" = "production" ]; then
        # Production mode - run the standalone server
        exec node server.js &
    else
        # Development mode - run the dev server
        exec pnpm dev &
    fi

    MAIN_PID=$!
    log_info "Application started with PID: $MAIN_PID"

    # Wait for the main process
    wait $MAIN_PID
}

# ============================================================================
# Execute
# ============================================================================

main "$@"
