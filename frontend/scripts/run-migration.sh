#!/bin/bash
###############################################################################
# Migration Runner Script
# Task 139: Data migration and rollback rehearsals
#
# Safe migration execution with automatic rollback on failure
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="${PROJECT_ROOT}/.backend/migrations"
BACKUP_DIR="${PROJECT_ROOT}/.backend/backups"
LOG_DIR="${PROJECT_ROOT}/.backend/logs"

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nself_production}"
DB_USER="${DB_USER:-postgres}"

# Flags
DRY_RUN=false
SKIP_BACKUP=false
AUTO_ROLLBACK=true
VERIFY_INTEGRITY=true

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <migration_file>

Options:
  -d, --dry-run          Show what would be done without executing
  -s, --skip-backup      Skip database backup (not recommended)
  -n, --no-rollback      Disable automatic rollback on failure
  -v, --no-verify        Skip integrity verification
  -h, --help             Show this help message

Environment Variables:
  DB_HOST                Database host (default: localhost)
  DB_PORT                Database port (default: 5432)
  DB_NAME                Database name (default: nself_production)
  DB_USER                Database user (default: postgres)
  PGPASSWORD             Database password

Examples:
  # Run migration with all safety checks
  $0 051_user_settings_tables.sql

  # Dry run to see what would happen
  $0 --dry-run 052_fix_message_edits_schema.sql

  # Skip backup (staging environment)
  $0 --skip-backup 053_fix_scheduled_messages_schema.sql

EOF
}

###############################################################################
# Pre-flight Checks
###############################################################################

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check psql
    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client."
        exit 1
    fi

    # Check pg_dump
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client."
        exit 1
    fi

    # Check database connection
    if ! PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log_error "Cannot connect to database: $DB_NAME@$DB_HOST:$DB_PORT"
        exit 1
    fi

    # Create directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR"

    log_success "Prerequisites OK"
}

###############################################################################
# Backup & Restore
###############################################################################

create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warning "Skipping backup (--skip-backup flag)"
        return 0
    fi

    local backup_file="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).dump"
    log_info "Creating backup: $backup_file"

    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -Fc \
        -f "$backup_file" \
        "$DB_NAME"; then
        log_success "Backup created: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/latest_backup.txt"
        return 0
    else
        log_error "Backup failed!"
        return 1
    fi
}

verify_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        return 0
    fi

    local backup_file=$(cat "$BACKUP_DIR/latest_backup.txt" 2>/dev/null || echo "")

    if [[ -z "$backup_file" ]] || [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found"
        return 1
    fi

    log_info "Verifying backup..."

    if pg_restore --list "$backup_file" &> /dev/null; then
        local item_count=$(pg_restore --list "$backup_file" | grep -c "^[0-9]" || true)
        log_success "Backup verified: $item_count items"
        return 0
    else
        log_error "Backup verification failed"
        return 1
    fi
}

restore_from_backup() {
    local backup_file=$(cat "$BACKUP_DIR/latest_backup.txt" 2>/dev/null || echo "")

    if [[ -z "$backup_file" ]] || [[ ! -f "$backup_file" ]]; then
        log_error "No backup file available for restore"
        return 1
    fi

    log_warning "Restoring from backup: $backup_file"

    if PGPASSWORD="$PGPASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c \
        "$backup_file"; then
        log_success "Database restored from backup"
        return 0
    else
        log_error "Database restore failed!"
        return 1
    fi
}

###############################################################################
# Migration Execution
###############################################################################

apply_migration() {
    local migration_file="$1"
    local log_file="$LOG_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

    log_info "Applying migration: $(basename "$migration_file")"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN - Would execute:"
        cat "$migration_file" | head -20
        echo "..."
        return 0
    fi

    # Execute migration
    if PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$migration_file" \
        &> "$log_file"; then
        log_success "Migration applied successfully"
        log_info "Log: $log_file"
        return 0
    else
        log_error "Migration failed!"
        log_error "Log: $log_file"
        cat "$log_file"
        return 1
    fi
}

apply_rollback() {
    local migration_file="$1"
    local rollback_file="${migration_file%.sql}.rollback.sql"

    if [[ ! -f "$rollback_file" ]]; then
        log_warning "No rollback file found: $rollback_file"
        log_warning "Will attempt restore from backup instead"
        restore_from_backup
        return $?
    fi

    log_info "Applying rollback: $(basename "$rollback_file")"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN - Would execute rollback"
        return 0
    fi

    local log_file="$LOG_DIR/rollback_$(date +%Y%m%d_%H%M%S).log"

    if PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$rollback_file" \
        &> "$log_file"; then
        log_success "Rollback applied successfully"
        return 0
    else
        log_error "Rollback failed!"
        log_error "Attempting restore from backup..."
        restore_from_backup
        return $?
    fi
}

###############################################################################
# Verification
###############################################################################

verify_integrity() {
    if [[ "$VERIFY_INTEGRITY" != "true" ]]; then
        log_warning "Skipping integrity verification (--no-verify flag)"
        return 0
    fi

    log_info "Verifying data integrity..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN - Would verify integrity"
        return 0
    fi

    local check_sql="
    -- Check for orphaned foreign keys
    DO \$\$
    DECLARE
        rec RECORD;
        orphan_count INTEGER;
    BEGIN
        FOR rec IN
            SELECT
                tc.table_schema,
                tc.table_name,
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'nchat'
        LOOP
            EXECUTE format(
                'SELECT COUNT(*) FROM %I.%I t WHERE NOT EXISTS (SELECT 1 FROM %I.%I f WHERE f.%I = t.%I)',
                rec.table_schema, rec.table_name,
                rec.foreign_table_schema, rec.foreign_table_name,
                rec.foreign_column_name, rec.column_name
            ) INTO orphan_count;

            IF orphan_count > 0 THEN
                RAISE WARNING 'Found % orphaned records in %.%',
                    orphan_count, rec.table_schema, rec.table_name;
            END IF;
        END LOOP;
    END \$\$;

    SELECT 'Integrity check complete' AS status;
    "

    if PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "$check_sql" \
        &> /dev/null; then
        log_success "Integrity check passed"
        return 0
    else
        log_error "Integrity check failed!"
        return 1
    fi
}

check_application_health() {
    log_info "Checking application health..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN - Would check application health"
        return 0
    fi

    # Check if health endpoint is accessible
    local health_url="${HEALTH_URL:-http://localhost:3000/api/health}"

    if command -v curl &> /dev/null; then
        if curl -f -s "$health_url" &> /dev/null; then
            log_success "Application health check passed"
            return 0
        else
            log_warning "Application health check failed (this may be expected during deployment)"
            return 0 # Don't fail on health check in migration script
        fi
    else
        log_warning "curl not available, skipping health check"
        return 0
    fi
}

###############################################################################
# Main Migration Flow
###############################################################################

run_migration() {
    local migration_file="$1"

    # Validate file exists
    if [[ ! -f "$migration_file" ]]; then
        log_error "Migration file not found: $migration_file"
        exit 1
    fi

    log_info "=================================================="
    log_info "Migration Runner"
    log_info "=================================================="
    log_info "Migration: $(basename "$migration_file")"
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_info "Dry Run: $DRY_RUN"
    log_info "Auto Rollback: $AUTO_ROLLBACK"
    log_info "=================================================="
    echo ""

    # Step 1: Prerequisites
    check_prerequisites

    # Step 2: Create backup
    if ! create_backup; then
        log_error "Backup failed, aborting migration"
        exit 1
    fi

    # Step 3: Verify backup
    if ! verify_backup; then
        log_error "Backup verification failed, aborting migration"
        exit 1
    fi

    # Step 4: Apply migration
    if ! apply_migration "$migration_file"; then
        log_error "Migration failed!"

        if [[ "$AUTO_ROLLBACK" == "true" ]]; then
            log_warning "Initiating automatic rollback..."
            if apply_rollback "$migration_file"; then
                log_success "Rollback successful"
                exit 1
            else
                log_error "Rollback failed! Database may be in inconsistent state."
                log_error "Manual intervention required."
                exit 2
            fi
        else
            log_warning "Automatic rollback disabled (--no-rollback flag)"
            exit 1
        fi
    fi

    # Step 5: Verify integrity
    if ! verify_integrity; then
        log_error "Integrity verification failed!"

        if [[ "$AUTO_ROLLBACK" == "true" ]]; then
            log_warning "Initiating automatic rollback..."
            apply_rollback "$migration_file"
            exit 1
        fi
    fi

    # Step 6: Check application health
    check_application_health

    # Success!
    echo ""
    log_success "=================================================="
    log_success "Migration completed successfully!"
    log_success "=================================================="
    log_info "Next steps:"
    log_info "1. Monitor application logs for errors"
    log_info "2. Verify critical user flows"
    log_info "3. Monitor performance metrics"
    log_info "4. Keep backup for at least 7 days"
    echo ""

    exit 0
}

###############################################################################
# Entry Point
###############################################################################

main() {
    # Parse arguments
    POSITIONAL_ARGS=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -n|--no-rollback)
                AUTO_ROLLBACK=false
                shift
                ;;
            -v|--no-verify)
                VERIFY_INTEGRITY=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*|--*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                POSITIONAL_ARGS+=("$1")
                shift
                ;;
        esac
    done

    # Restore positional arguments
    set -- "${POSITIONAL_ARGS[@]}"

    # Check for migration file
    if [[ $# -eq 0 ]]; then
        log_error "No migration file specified"
        show_usage
        exit 1
    fi

    local migration_file="$1"

    # If not absolute path, look in migrations directory
    if [[ ! "$migration_file" = /* ]]; then
        migration_file="$MIGRATIONS_DIR/$migration_file"
    fi

    # Run migration
    run_migration "$migration_file"
}

main "$@"
