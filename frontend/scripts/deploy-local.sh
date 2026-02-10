#!/bin/bash
# ============================================================================
# nself-chat Local Deployment Script
# ============================================================================
# Deploys nself-chat to local development environment
# - Backend: nself build/start in .backend/
# - Frontend: Next.js development server
#
# Usage:
#   ./scripts/deploy-local.sh                    # Full local deployment
#   ./scripts/deploy-local.sh --backend-only     # Backend only
#   ./scripts/deploy-local.sh --frontend-only    # Frontend only
#   ./scripts/deploy-local.sh --dry-run          # Preview changes
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
BACKEND_DIR=".backend"
BACKEND_ONLY=false
FRONTEND_ONLY=false
DRY_RUN=false
SKIP_HEALTH_CHECK=false
SKIP_VALIDATION=false
DEV_PORT=3000

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

Deploy nself-chat to local development environment.

Options:
    --backend-only        Deploy backend services only
    --frontend-only       Deploy frontend only
    --dry-run             Preview deployment without executing
    --skip-health-check   Skip post-deployment health checks
    --skip-validation     Skip pre-deployment validation
    --port PORT           Frontend dev port (default: 3000)
    -h, --help            Show this help message

Examples:
    $(basename "$0")                           # Full local deployment
    $(basename "$0") --backend-only           # Backend services only
    $(basename "$0") --frontend-only          # Frontend only
    $(basename "$0") --dry-run                # Preview deployment

Environment:
    NEXT_PUBLIC_USE_DEV_AUTH=true    Use development authentication
    NEXT_PUBLIC_ENV=development      Development mode

Prerequisites:
    - nself CLI v0.4.2+ installed
    - Docker and Docker Compose installed
    - Node.js 20+ and pnpm installed
    - .backend/ directory initialized
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                BACKEND_ONLY=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --port)
                DEV_PORT="$2"
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
    if [ "$SKIP_VALIDATION" = true ]; then
        log_warn "Skipping environment validation"
        return 0
    fi

    log_step "Validating environment"

    # Check required tools
    local required_tools=("docker" "docker-compose" "node" "pnpm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
        log_info "✓ $tool is available"
    done

    # Check Node version
    local node_version=$(node -v | cut -d'.' -f1 | tr -d 'v')
    if [ "$node_version" -lt 20 ]; then
        log_error "Node.js version must be 20 or higher (found: $(node -v))"
        exit 1
    fi
    log_info "✓ Node.js version: $(node -v)"

    # Check pnpm version
    local pnpm_version=$(pnpm -v)
    log_info "✓ pnpm version: $pnpm_version"

    # Check if nself is installed (for backend deployment)
    if [ "$FRONTEND_ONLY" = false ]; then
        if ! command -v nself &> /dev/null; then
            log_error "nself CLI is not installed or not in PATH"
            log_error "Install with: npm install -g @nself/cli"
            exit 1
        fi
        log_info "✓ nself CLI is available: $(nself --version)"
    fi

    # Check backend directory
    if [ "$FRONTEND_ONLY" = false ]; then
        if [ ! -d "$PROJECT_ROOT/$BACKEND_DIR" ]; then
            log_error "Backend directory not found: $PROJECT_ROOT/$BACKEND_DIR"
            log_error "Initialize with: nself init"
            exit 1
        fi
        log_info "✓ Backend directory exists"
    fi

    # Check for .env.local
    if [ "$BACKEND_ONLY" = false ]; then
        if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
            log_warn ".env.local not found, creating from .env.example"
            if [ -f "$PROJECT_ROOT/.env.example" ]; then
                cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env.local"
                log_info "✓ Created .env.local from .env.example"
            fi
        else
            log_info "✓ .env.local exists"
        fi
    fi

    log_info "Environment validation passed"
}

deploy_backend() {
    log_step "Deploying backend services"

    cd "$PROJECT_ROOT/$BACKEND_DIR"

    # Check if services are already running
    if nself status &> /dev/null; then
        log_warn "Backend services are already running"
        read -p "Stop and restart? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ "$DRY_RUN" = false ]; then
                log_info "Stopping existing services..."
                nself stop
            else
                log_info "[DRY RUN] Would stop existing services"
            fi
        fi
    fi

    # Build docker-compose configuration
    if [ "$DRY_RUN" = false ]; then
        log_info "Building backend configuration..."
        nself build
    else
        log_info "[DRY RUN] Would build backend configuration"
    fi

    # Start services
    if [ "$DRY_RUN" = false ]; then
        log_info "Starting backend services..."
        nself start

        # Wait for services to be ready
        log_info "Waiting for services to initialize..."
        sleep 10
    else
        log_info "[DRY RUN] Would start backend services"
    fi

    cd "$PROJECT_ROOT"
    log_info "Backend deployment complete"
}

deploy_frontend() {
    log_step "Deploying frontend"

    cd "$PROJECT_ROOT"

    # Check if port is already in use
    if lsof -Pi :$DEV_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "Port $DEV_PORT is already in use"
        local pid=$(lsof -ti:$DEV_PORT)
        log_info "Process using port: $pid"
        read -p "Kill process and continue? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ "$DRY_RUN" = false ]; then
                kill -9 $pid || true
                sleep 2
            else
                log_info "[DRY RUN] Would kill process $pid"
            fi
        else
            log_error "Cannot start frontend with port in use"
            exit 1
        fi
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        if [ "$DRY_RUN" = false ]; then
            log_info "Installing dependencies..."
            pnpm install --frozen-lockfile
        else
            log_info "[DRY RUN] Would install dependencies"
        fi
    else
        log_info "Dependencies already installed"
    fi

    # Set development environment variables
    export NEXT_PUBLIC_USE_DEV_AUTH=true
    export NEXT_PUBLIC_ENV=development
    export NODE_ENV=development

    # Start development server
    if [ "$DRY_RUN" = false ]; then
        log_info "Starting Next.js development server on port $DEV_PORT..."
        log_info "Press Ctrl+C to stop"
        log_info ""
        pnpm dev
    else
        log_info "[DRY RUN] Would start Next.js development server on port $DEV_PORT"
    fi
}

health_check() {
    if [ "$SKIP_HEALTH_CHECK" = true ]; then
        log_warn "Skipping health checks"
        return 0
    fi

    log_step "Running health checks"

    local all_healthy=true

    # Check backend health
    if [ "$FRONTEND_ONLY" = false ]; then
        cd "$PROJECT_ROOT/$BACKEND_DIR"

        log_info "Checking backend services..."
        if nself status > /tmp/nself-status.log 2>&1; then
            log_info "✓ Backend services are running"

            # Check critical services
            if grep -q "hasura.*running" /tmp/nself-status.log; then
                log_info "  ✓ Hasura GraphQL Engine"
            else
                log_error "  ✗ Hasura is not running"
                all_healthy=false
            fi

            if grep -q "postgres.*running" /tmp/nself-status.log; then
                log_info "  ✓ PostgreSQL Database"
            else
                log_error "  ✗ PostgreSQL is not running"
                all_healthy=false
            fi

            if grep -q "auth.*running" /tmp/nself-status.log; then
                log_info "  ✓ Authentication Service"
            else
                log_error "  ✗ Auth service is not running"
                all_healthy=false
            fi
        else
            log_error "Backend services are not running"
            all_healthy=false
        fi

        cd "$PROJECT_ROOT"
    fi

    # Check frontend health
    if [ "$BACKEND_ONLY" = false ]; then
        log_info "Checking frontend..."

        # Try to connect to dev server
        if curl -f -s -o /dev/null "http://localhost:$DEV_PORT" 2>/dev/null; then
            log_info "✓ Frontend is accessible on port $DEV_PORT"
        else
            log_warn "Frontend is not yet accessible (may still be starting)"
        fi
    fi

    if [ "$all_healthy" = true ]; then
        log_info "All health checks passed"
    else
        log_error "Some health checks failed"
        return 1
    fi
}

print_urls() {
    log_step "Service URLs"

    if [ "$FRONTEND_ONLY" = false ]; then
        echo ""
        echo "Backend Services:"
        echo "  GraphQL:  http://localhost:8080/v1/graphql"
        echo "  Hasura:   http://localhost:8080/console"
        echo "  Auth:     http://localhost:4000"
        echo "  Admin:    http://localhost:3021"
        echo ""
    fi

    if [ "$BACKEND_ONLY" = false ]; then
        echo "Frontend:"
        echo "  Dev Server:  http://localhost:$DEV_PORT"
        echo ""
    fi

    echo "Development Credentials:"
    echo "  Email:    owner@nself.org"
    echo "  Password: password123"
    echo ""
}

main() {
    parse_args "$@"

    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       nself-chat Local Deployment                        ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""

    validate_environment

    # Deploy based on flags
    if [ "$BACKEND_ONLY" = true ]; then
        deploy_backend
    elif [ "$FRONTEND_ONLY" = true ]; then
        deploy_frontend
    else
        deploy_backend
        sleep 5
        health_check
        print_urls
        deploy_frontend
    fi

    echo ""
    log_info "Local deployment complete!"

    if [ "$DRY_RUN" = true ]; then
        log_warn "This was a dry run. No changes were applied."
    fi
}

main "$@"
