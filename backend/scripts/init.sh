#!/bin/bash
# =============================================================================
# nself-chat Backend Initialization Script
# =============================================================================
# Purpose: First-time setup of backend infrastructure
# Usage: ./scripts/init.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}         nself-chat Backend Initialization              ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from backend directory
if [ ! -f "docker-compose.yml" ] && [ ! -f ".env.example" ]; then
    log_error "This script must be run from the backend/ directory"
    exit 1
fi

# Step 1: Check prerequisites
log_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi
log_success "Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
log_success "Docker Compose found: $(docker compose version)"

# Check nself
if ! command -v nself &> /dev/null; then
    log_error "nself CLI is not installed. Please install nself first."
    log_info "Visit: https://nself.org/docs/installation"
    exit 1
fi
log_success "nself CLI found: $(nself version | head -n 1)"

# Step 2: Check environment file
log_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    log_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    log_success "Created .env file"
    log_warning "Please review and update .env with your configuration"
    log_info "Press Enter to continue after updating .env..."
    read -r
fi

# Validate critical env vars
if ! grep -q "PROJECT_NAME=" .env; then
    log_error "PROJECT_NAME not set in .env"
    exit 1
fi

if ! grep -q "BASE_DOMAIN=" .env; then
    log_error "BASE_DOMAIN not set in .env"
    exit 1
fi

log_success "Environment configuration valid"

# Step 3: Build docker-compose.yml
log_info "Building docker-compose.yml with nself..."

if ! nself build; then
    log_error "nself build failed"
    exit 1
fi

log_success "docker-compose.yml generated"

# Step 4: Start services
log_info "Starting backend services..."

if ! nself start; then
    log_error "Failed to start services"
    log_info "Check logs with: nself logs"
    exit 1
fi

log_success "Services started"

# Step 5: Wait for services to be healthy
log_info "Waiting for services to be healthy (this may take a minute)..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker ps --format '{{.Names}}\t{{.Status}}' | grep -q "healthy"; then
        log_success "Services are healthy"
        break
    fi

    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        log_warning "Services took longer than expected to become healthy"
        log_info "Check status with: nself status"
        break
    fi

    sleep 2
done

# Step 6: Run migrations
log_info "Running database migrations..."

if [ -d "db/migrations" ] && [ "$(ls -A db/migrations)" ]; then
    log_info "Found $(ls db/migrations | wc -l) migration files"

    # Wait for PostgreSQL to be ready
    sleep 5

    # Run migrations (would need nself db command or direct psql)
    log_warning "Manual migration step required"
    log_info "Run: nself db migrate up"
else
    log_info "No migrations found"
fi

# Step 7: Show service URLs
log_info "Backend services initialized successfully!"
echo ""
nself urls
echo ""

# Step 8: Next steps
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                    Setup Complete!                      ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Run migrations:     nself db migrate up"
echo "  2. Seed data:          ./scripts/seed.sh"
echo "  3. Check status:       nself status"
echo "  4. View logs:          nself logs -f"
echo "  5. Start frontend:     cd ../frontend && pnpm install && pnpm dev"
echo ""
echo "Service URLs:"
echo "  Chat App:         http://localhost:3000"
echo "  GraphQL Console:  https://api.local.nself.org/console"
echo "  Auth:             https://auth.local.nself.org"
echo "  Storage:          https://storage.local.nself.org"
echo "  Email (dev):      https://mail.local.nself.org"
echo "  Admin:            http://localhost:3021"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
echo ""
