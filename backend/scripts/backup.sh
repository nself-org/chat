#!/bin/bash
# =============================================================================
# nself-chat Backend Backup Script
# =============================================================================
# Purpose: Create database backups
# Usage: ./scripts/backup.sh [name]
# Examples:
#   ./scripts/backup.sh                    # Timestamp backup
#   ./scripts/backup.sh pre-deployment     # Named backup
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

# Get backup name parameter
BACKUP_NAME="${1}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")

if [ -z "$BACKUP_NAME" ]; then
    BACKUP_FILE="backup-${TIMESTAMP}.sql.gz"
else
    BACKUP_FILE="${BACKUP_NAME}-${TIMESTAMP}.sql.gz"
fi

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           nself-chat Database Backup                    ${BLUE}║${NC}"
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

# Create backup directory
BACKUP_DIR="_backups"
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"
echo ""

# Step 1: Create backup
log_info "Creating database backup..."

if docker exec $(docker ps -qf "name=postgres") pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_PATH"; then
    log_success "Backup created successfully"
else
    log_error "Failed to create backup"
    exit 1
fi

# Step 2: Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log_success "Backup size: $BACKUP_SIZE"

# Step 3: Create metadata file
METADATA_FILE="$BACKUP_DIR/${BACKUP_FILE%.sql.gz}.meta"

cat > "$METADATA_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "database": "$DB_NAME",
  "user": "$DB_USER",
  "file": "$BACKUP_FILE",
  "size": "$BACKUP_SIZE",
  "created_by": "$(whoami)",
  "hostname": "$(hostname)"
}
EOF

log_success "Metadata saved: ${BACKUP_FILE%.sql.gz}.meta"

# Step 4: List recent backups
echo ""
log_info "Recent backups:"
echo ""

ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 | awk '{printf "  %s  %s  %s\n", $9, $5, $6" "$7" "$8}'

# Step 5: Show backup count
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l | tr -d '[:space:]')
echo ""
log_info "Total backups: $BACKUP_COUNT"

# Step 6: Cleanup old backups (keep last 10)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    log_warning "More than 10 backups exist. Consider cleaning up old backups."
    log_info "Oldest backups:"
    ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +11 | while read -r old_backup; do
        echo "  - $(basename "$old_backup")"
    done
    echo ""
    read -p "Delete old backups? (yes/no): " delete_old

    if [ "$delete_old" = "yes" ]; then
        ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +11 | xargs rm -f
        ls -t "$BACKUP_DIR"/*.meta | tail -n +11 | xargs rm -f
        log_success "Old backups removed"
    fi
fi

# Step 7: Success
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                 Backup Complete!                        ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backup saved to: $BACKUP_PATH"
echo "Backup size: $BACKUP_SIZE"
echo ""
echo "To restore this backup:"
echo "  ./scripts/restore.sh $BACKUP_FILE"
echo ""
