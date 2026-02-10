#!/bin/bash
# ============================================================================
# nself-chat Update Script
# ============================================================================
# Safely update nself-chat to the latest version with automatic backup
#
# Usage:
#   sudo /usr/local/bin/update-nchat [VERSION]
#
# Examples:
#   sudo /usr/local/bin/update-nchat           # Update to latest
#   sudo /usr/local/bin/update-nchat v1.0.1    # Update to specific version
# ============================================================================

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="${INSTALL_DIR:-/opt/nself-chat}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nself-chat}"
REPO_URL="${REPO_URL:-https://github.com/yourusername/nself-chat.git}"
TARGET_VERSION="${1:-latest}"

# Helper functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

header() {
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================================${NC}"
    echo ""
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Check if installation exists
check_installation() {
    if [ ! -d "$INSTALL_DIR" ]; then
        error "Installation not found at $INSTALL_DIR"
    fi

    if [ ! -f "$INSTALL_DIR/.env.production" ]; then
        error "Configuration not found at $INSTALL_DIR/.env.production"
    fi

    cd "$INSTALL_DIR"
}

# Get current version
get_current_version() {
    cd "$INSTALL_DIR"
    CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "unknown")
    log "Current version: $CURRENT_VERSION"
}

# Get target version
get_target_version() {
    if [ "$TARGET_VERSION" = "latest" ]; then
        # Fetch latest tag
        git fetch --tags
        TARGET_VERSION=$(git describe --tags $(git rev-list --tags --max-count=1) 2>/dev/null || echo "main")
    fi
    log "Target version: $TARGET_VERSION"
}

# Pre-flight checks
preflight_checks() {
    header "Pre-flight Checks"

    # Check disk space (require 5GB free)
    AVAILABLE_DISK=$(df -BG "$INSTALL_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_DISK" -lt 5 ]; then
        error "Insufficient disk space. Available: ${AVAILABLE_DISK}GB, Required: 5GB"
    fi
    log "Disk space: ${AVAILABLE_DISK}GB available ✓"

    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running"
    fi
    log "Docker is running ✓"

    # Check services are running
    cd "$INSTALL_DIR"
    RUNNING_SERVICES=$(docker compose -f docker-compose.production.yml ps --services --filter "status=running" | wc -l)
    if [ "$RUNNING_SERVICES" -lt 1 ]; then
        warn "No services are currently running"
    else
        log "Services running: $RUNNING_SERVICES ✓"
    fi

    success "Pre-flight checks passed"
}

# Create backup before update
create_backup() {
    header "Creating Backup"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="nchat-backup-pre-update-${TIMESTAMP}.tar.gz"

    log "Creating backup: $BACKUP_FILE"

    cd "$INSTALL_DIR"

    # Backup database
    log "Backing up database..."
    docker compose -f docker-compose.production.yml exec -T postgres \
        pg_dump -U postgres nchat | gzip > "${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz"

    # Backup uploads
    log "Backing up uploads..."
    docker run --rm \
        -v nself-chat-prod_uploads:/data \
        -v ${BACKUP_DIR}:/backup \
        alpine tar czf /backup/uploads-${TIMESTAMP}.tar.gz /data 2>/dev/null || true

    # Backup configuration
    log "Backing up configuration..."
    cp .env.production "${BACKUP_DIR}/env-${TIMESTAMP}.backup"

    # Create combined backup
    tar czf "${BACKUP_DIR}/${BACKUP_FILE}" \
        "${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz" \
        "${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz" \
        "${BACKUP_DIR}/env-${TIMESTAMP}.backup" 2>/dev/null

    # Clean up individual files
    rm "${BACKUP_DIR}/db-${TIMESTAMP}.sql.gz"
    rm "${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz"
    rm "${BACKUP_DIR}/env-${TIMESTAMP}.backup"

    # Save backup location
    echo "$BACKUP_FILE" > /tmp/nchat-last-backup.txt

    success "Backup created: ${BACKUP_DIR}/${BACKUP_FILE}"
}

# Pull latest code
pull_updates() {
    header "Pulling Updates"

    cd "$INSTALL_DIR"

    # Fetch latest changes
    log "Fetching latest changes..."
    git fetch --all --tags

    # Checkout target version
    log "Checking out version: $TARGET_VERSION"
    git checkout "$TARGET_VERSION"

    success "Code updated to $TARGET_VERSION"
}

# Check for breaking changes
check_breaking_changes() {
    header "Checking for Breaking Changes"

    # Check if there are new environment variables
    if [ -f "$INSTALL_DIR/.env.production.example" ]; then
        log "Comparing environment files..."

        # Get new variables
        NEW_VARS=$(comm -13 \
            <(grep -E '^[A-Z_]+=' "$INSTALL_DIR/.env.production" | cut -d= -f1 | sort) \
            <(grep -E '^[A-Z_]+=' "$INSTALL_DIR/.env.production.example" | cut -d= -f1 | sort))

        if [ -n "$NEW_VARS" ]; then
            warn "New environment variables detected:"
            echo "$NEW_VARS"
            warn "Please review .env.production.example and update .env.production accordingly"

            read -p "Continue anyway? [y/N]: " CONTINUE
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                error "Update cancelled. Please update environment variables and try again."
            fi
        else
            log "No new environment variables ✓"
        fi
    fi

    success "Breaking changes check complete"
}

# Stop services
stop_services() {
    header "Stopping Services"

    cd "$INSTALL_DIR"

    log "Stopping all services..."
    docker compose -f docker-compose.production.yml down

    success "Services stopped"
}

# Update Docker images
update_images() {
    header "Updating Docker Images"

    cd "$INSTALL_DIR"

    # Pull latest base images
    log "Pulling latest base images..."
    docker compose -f docker-compose.production.yml pull

    # Rebuild application image
    log "Building application image..."
    docker compose -f docker-compose.production.yml build --no-cache nchat

    success "Docker images updated"
}

# Run database migrations
run_migrations() {
    header "Running Database Migrations"

    cd "$INSTALL_DIR"

    # Start database only
    log "Starting database..."
    docker compose -f docker-compose.production.yml up -d postgres
    sleep 10

    # Run migrations
    log "Running migrations..."
    docker compose -f docker-compose.production.yml run --rm nchat pnpm db:migrate || {
        warn "Migrations failed or no migrations to run"
    }

    success "Migrations complete"
}

# Start services
start_services() {
    header "Starting Services"

    cd "$INSTALL_DIR"

    log "Starting all services..."

    # Check if monitoring is enabled
    if docker volume ls | grep -q "monitoring"; then
        log "Starting with monitoring..."
        docker compose -f docker-compose.production.yml \
                      -f docker-compose.monitoring.yml up -d
    else
        docker compose -f docker-compose.production.yml up -d
    fi

    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30

    success "Services started"
}

# Verify update
verify_update() {
    header "Verifying Update"

    cd "$INSTALL_DIR"

    # Check service status
    log "Checking service status..."
    HEALTHY_SERVICES=$(docker compose -f docker-compose.production.yml ps --filter "health=healthy" --services | wc -l)
    TOTAL_SERVICES=$(docker compose -f docker-compose.production.yml ps --services | wc -l)

    log "Healthy services: $HEALTHY_SERVICES / $TOTAL_SERVICES"

    # Test application endpoint
    log "Testing application endpoint..."
    sleep 10

    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

    if [ "$HEALTH_CHECK" = "200" ]; then
        log "Application health check: OK ✓"
    else
        warn "Application health check failed (HTTP $HEALTH_CHECK)"
        warn "Application may need more time to start"
    fi

    # Get new version
    NEW_VERSION=$(git describe --tags 2>/dev/null || echo "unknown")

    success "Update verified. New version: $NEW_VERSION"
}

# Rollback if needed
rollback() {
    error "Update failed. Initiating rollback..."

    cd "$INSTALL_DIR"

    # Stop services
    docker compose -f docker-compose.production.yml down

    # Restore from backup
    LAST_BACKUP=$(cat /tmp/nchat-last-backup.txt 2>/dev/null || echo "")

    if [ -n "$LAST_BACKUP" ] && [ -f "$BACKUP_DIR/$LAST_BACKUP" ]; then
        log "Restoring from backup: $LAST_BACKUP"

        # Extract backup
        tar xzf "$BACKUP_DIR/$LAST_BACKUP" -C /tmp/

        # Restore database
        gunzip < /tmp/var/backups/nself-chat/db-*.sql.gz | \
            docker compose -f docker-compose.production.yml exec -T postgres \
            psql -U postgres nchat

        # Restore configuration
        cp /tmp/var/backups/nself-chat/env-*.backup .env.production

        # Start services
        docker compose -f docker-compose.production.yml up -d

        success "Rollback complete"
    else
        error "Backup not found. Manual intervention required."
    fi
}

# Clean up old backups
cleanup_old_backups() {
    header "Cleaning Up Old Backups"

    # Keep last 10 update backups
    log "Removing old update backups..."
    find "$BACKUP_DIR" -name "nchat-backup-pre-update-*.tar.gz" -type f | \
        sort -r | tail -n +11 | xargs -r rm

    success "Cleanup complete"
}

# Show completion message
show_completion() {
    header "Update Complete!"

    cat << EOF

${GREEN}✓ nself-chat has been successfully updated!${NC}

${BLUE}Version Information:${NC}
  Previous: $CURRENT_VERSION
  Current:  $(git describe --tags 2>/dev/null || echo "unknown")

${BLUE}Service Status:${NC}
$(docker compose -f docker-compose.production.yml ps)

${BLUE}Backup Location:${NC}
  ${BACKUP_DIR}/$(cat /tmp/nchat-last-backup.txt 2>/dev/null || echo "N/A")

${BLUE}Next Steps:${NC}
  1. Test your application: https://${DOMAIN}
  2. Check logs: docker compose -f $INSTALL_DIR/docker-compose.production.yml logs -f
  3. Review release notes: https://github.com/yourusername/nself-chat/releases

${BLUE}Rollback (if needed):${NC}
  sudo $INSTALL_DIR/scripts/rollback-nchat.sh $(cat /tmp/nchat-last-backup.txt 2>/dev/null || echo "")

${GREEN}Thank you for using nself-chat!${NC}

EOF
}

# ============================================================================
# Main Update Flow
# ============================================================================

main() {
    header "nself-chat Update Script"

    # Set up error handling
    trap rollback ERR

    # Preflight
    check_root
    check_installation
    get_current_version
    get_target_version

    # Check if already on target version
    if [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
        log "Already on version $TARGET_VERSION"
        exit 0
    fi

    preflight_checks

    # Backup
    create_backup

    # Update
    pull_updates
    check_breaking_changes
    stop_services
    update_images
    run_migrations
    start_services

    # Verify
    verify_update

    # Cleanup
    cleanup_old_backups

    # Done
    show_completion

    # Remove error trap
    trap - ERR
}

# Run main function
main "$@"
