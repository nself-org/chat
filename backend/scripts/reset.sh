#!/bin/bash
# =============================================================================
# nself-chat Backend Reset Script
# =============================================================================
# Purpose: Reset database to clean state
# Usage: ./scripts/reset.sh
# WARNING: This will DELETE ALL DATA!
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
echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║${NC}          nself-chat Backend Reset                       ${RED}║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Warning
log_warning "This will DELETE ALL DATA!"
log_warning "All database tables, users, messages, and files will be removed."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Reset cancelled"
    exit 0
fi

# Check if running from backend directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "This script must be run from the backend/ directory"
    exit 1
fi

# Step 1: Stop all services
log_info "Stopping all services..."

if ! nself stop; then
    log_warning "Failed to stop services gracefully, forcing stop..."
    docker compose down
fi

log_success "Services stopped"

# Step 2: Remove database volumes
log_info "Removing database volumes..."

if [ -d ".volumes/postgres" ]; then
    log_info "Removing PostgreSQL data..."
    rm -rf .volumes/postgres
    log_success "PostgreSQL data removed"
fi

if [ -d ".volumes/minio" ]; then
    log_info "Removing MinIO data..."
    rm -rf .volumes/minio
    log_success "MinIO data removed"
fi

if [ -d ".volumes/meilisearch" ]; then
    log_info "Removing MeiliSearch data..."
    rm -rf .volumes/meilisearch
    log_success "MeiliSearch data removed"
fi

if [ -d ".volumes/redis" ]; then
    log_info "Removing Redis data..."
    rm -rf .volumes/redis
    log_success "Redis data removed"
fi

# Step 3: Remove logs
log_info "Removing logs..."

if [ -d "logs" ]; then
    rm -rf logs/*
    log_success "Logs removed"
fi

# Step 4: Restart services
log_info "Starting services with clean state..."

if ! nself start; then
    log_error "Failed to start services"
    exit 1
fi

log_success "Services started"

# Step 5: Wait for services to be healthy
log_info "Waiting for services to be healthy..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker ps --format '{{.Names}}\t{{.Status}}' | grep -q "healthy"; then
        log_success "Services are healthy"
        break
    fi

    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        log_warning "Services took longer than expected"
        break
    fi

    sleep 2
done

# Step 6: Re-run migrations
log_info "Re-running migrations..."

sleep 5  # Wait for PostgreSQL

log_warning "Manual migration step required"
log_info "Run: nself db migrate up"

# Step 7: Success
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                  Reset Complete!                        ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Run migrations:     nself db migrate up"
echo "  2. Seed data:          ./scripts/seed.sh"
echo "  3. Check status:       nself status"
echo ""
