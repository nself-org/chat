#!/bin/bash
# =============================================================================
# nself-chat Backend Seed Script
# =============================================================================
# Purpose: Load development/test data
# Usage: ./scripts/seed.sh [environment]
# Examples:
#   ./scripts/seed.sh           # Default (dev)
#   ./scripts/seed.sh dev       # Development data
#   ./scripts/seed.sh test      # Test data
#   ./scripts/seed.sh demo      # Demo data
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

# Get environment parameter
SEED_ENV="${1:-dev}"

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           nself-chat Backend Seeding                    ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}           Environment: ${SEED_ENV}                            ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from backend directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "This script must be run from the backend/ directory"
    exit 1
fi

# Check if database is running
if ! docker ps | grep -q postgres; then
    log_error "PostgreSQL is not running. Start it with: nself start"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    log_error ".env file not found"
    exit 1
fi

# Database connection info
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-nself}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD}"

log_info "Database: $DB_NAME"
log_info "Environment: $SEED_ENV"
echo ""

# Step 1: Check if seed directory exists
SEED_DIR="db/seeds"

if [ ! -d "$SEED_DIR" ]; then
    log_warning "Seed directory not found: $SEED_DIR"
    log_info "Creating seed directory..."
    mkdir -p "$SEED_DIR"
fi

# Step 2: Check for seed files
SEED_FILE="$SEED_DIR/${SEED_ENV}.sql"

if [ ! -f "$SEED_FILE" ]; then
    log_warning "Seed file not found: $SEED_FILE"
    log_info "Creating sample seed file..."

    # Create sample seed file
    cat > "$SEED_FILE" << 'EOF'
-- =============================================================================
-- Development Seed Data
-- =============================================================================

-- Test Users
INSERT INTO nchat_users (id, email, display_name, status, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner@nself.org', 'Owner User', 'active', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'admin@nself.org', 'Admin User', 'active', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'member@nself.org', 'Member User', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Workspace
INSERT INTO nchat_workspaces (id, name, slug, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'nself Team', 'nself', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Channels
INSERT INTO nchat_channels (id, workspace_id, name, description, type, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'general', 'General discussion', 'public', NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'random', 'Random chat', 'public', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Messages
INSERT INTO nchat_messages (id, channel_id, user_id, content, type, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Welcome to nself-chat!', 'text', NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hello everyone!', 'text', NOW())
ON CONFLICT (id) DO NOTHING;

EOF

    log_success "Created sample seed file: $SEED_FILE"
fi

# Step 3: Load seed data
log_info "Loading seed data from $SEED_FILE..."

# Execute seed file via Docker
if docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME" < "$SEED_FILE"; then
    log_success "Seed data loaded successfully"
else
    log_error "Failed to load seed data"
    exit 1
fi

# Step 4: Verify data
log_info "Verifying seed data..."

USER_COUNT=$(docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM nchat_users;" | tr -d '[:space:]')

CHANNEL_COUNT=$(docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM nchat_channels;" | tr -d '[:space:]')

MESSAGE_COUNT=$(docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM nchat_messages;" | tr -d '[:space:]')

echo ""
log_success "Users created: $USER_COUNT"
log_success "Channels created: $CHANNEL_COUNT"
log_success "Messages created: $MESSAGE_COUNT"

# Step 5: Success
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                  Seeding Complete!                      ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Test Users:"
echo "  - owner@nself.org   (Owner)"
echo "  - admin@nself.org   (Admin)"
echo "  - member@nself.org  (Member)"
echo ""
echo "Test Channels:"
echo "  - #general"
echo "  - #random"
echo ""
echo "You can now start the frontend and login with any test user."
echo "Password for all users: password123"
echo ""
