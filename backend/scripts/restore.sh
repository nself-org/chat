#!/bin/bash
# =============================================================================
# nself-chat Backend Restore Script
# =============================================================================
# Purpose: Restore database from backup
# Usage: ./scripts/restore.sh <backup-name>
# Example:
#   ./scripts/restore.sh backup-2026-02-10-083000.sql.gz
# WARNING: This will OVERWRITE existing data!
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

# Get backup file parameter
BACKUP_FILE="${1}"

if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: ./scripts/restore.sh <backup-file>"
    log_info "Available backups:"
    ls -1 _backups/*.sql.gz 2>/dev/null | xargs -n 1 basename || log_warning "No backups found"
    exit 1
fi

# Header
echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║${NC}           nself-chat Database Restore                   ${RED}║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from backend directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "This script must be run from the backend/ directory"
    exit 1
fi

# Backup directory
BACKUP_DIR="_backups"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    log_error "Backup file not found: $BACKUP_PATH"
    log_info "Available backups:"
    ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | xargs -n 1 basename || log_warning "No backups found"
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

log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"
log_info "Backup size: $(du -h "$BACKUP_PATH" | cut -f1)"
echo ""

# Warning
log_warning "This will OVERWRITE all existing data in the database!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Step 1: Create pre-restore backup
log_info "Creating pre-restore backup..."

PRE_RESTORE_BACKUP="pre-restore-$(date +"%Y-%m-%d-%H%M%S").sql.gz"

if docker ps | grep -q postgres; then
    if docker exec $(docker ps -qf "name=postgres") pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/$PRE_RESTORE_BACKUP"; then
        log_success "Pre-restore backup created: $PRE_RESTORE_BACKUP"
    else
        log_warning "Failed to create pre-restore backup"
        read -p "Continue without pre-restore backup? (yes/no): " continue_anyway
        if [ "$continue_anyway" != "yes" ]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi
else
    log_warning "PostgreSQL not running, skipping pre-restore backup"
fi

# Step 2: Stop services
log_info "Stopping services..."

if ! nself stop; then
    log_warning "Failed to stop services gracefully, forcing stop..."
    docker compose down
fi

log_success "Services stopped"

# Step 3: Start only PostgreSQL
log_info "Starting PostgreSQL..."

docker compose up -d postgres

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
sleep 10

# Step 4: Drop and recreate database
log_info "Dropping existing database..."

docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

log_success "Database dropped"

log_info "Creating fresh database..."

docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

log_success "Database created"

# Step 5: Restore from backup
log_info "Restoring from backup..."

if gunzip -c "$BACKUP_PATH" | docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME"; then
    log_success "Database restored successfully"
else
    log_error "Failed to restore database"
    log_error "Rolling back to pre-restore backup..."

    if [ -f "$BACKUP_DIR/$PRE_RESTORE_BACKUP" ]; then
        gunzip -c "$BACKUP_DIR/$PRE_RESTORE_BACKUP" | docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME"
        log_success "Rolled back to pre-restore backup"
    fi

    exit 1
fi

# Step 6: Restart all services
log_info "Starting all services..."

if ! nself start; then
    log_error "Failed to start services"
    exit 1
fi

log_success "Services started"

# Step 7: Verify restoration
log_info "Verifying restoration..."

sleep 5

USER_COUNT=$(docker exec -i $(docker ps -qf "name=postgres") psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM nchat_users;" 2>/dev/null | tr -d '[:space:]' || echo "0")

log_success "Users restored: $USER_COUNT"

# Step 8: Show metadata
METADATA_FILE="$BACKUP_DIR/${BACKUP_FILE%.sql.gz}.meta"

if [ -f "$METADATA_FILE" ]; then
    log_info "Backup metadata:"
    cat "$METADATA_FILE" | while read -r line; do
        echo "  $line"
    done
fi

# Step 9: Success
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                 Restore Complete!                       ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Database restored from: $BACKUP_FILE"
echo "Pre-restore backup saved: $PRE_RESTORE_BACKUP"
echo ""
echo "Next steps:"
echo "  1. Verify data:        nself db shell"
echo "  2. Check services:     nself status"
echo "  3. View logs:          nself logs"
echo ""
