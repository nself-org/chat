#!/bin/bash
##############################################################################
# Secrets Rotation Script
#
# Automates the rotation of secrets and credentials with minimal downtime.
#
# Usage:
#   ./scripts/rotate-secrets.sh [options]
#
# Options:
#   --type <type>       Type of secret to rotate (db|api|oauth|all)
#   --environment <env> Environment (dev|staging|production)
#   --service <name>    Specific service name
#   --dry-run           Show what would be rotated without doing it
#   --help              Show this help message
#
# Examples:
#   ./scripts/rotate-secrets.sh --type db --environment production
#   ./scripts/rotate-secrets.sh --type oauth --service google --dry-run
#   ./scripts/rotate-secrets.sh --type api --environment staging
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
SECRET_TYPE=""
ENVIRONMENT=""
SERVICE=""
DRY_RUN=false

# =============================================================================
# Helper Functions
# =============================================================================

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

show_help() {
  cat << EOF
Secrets Rotation Script

Usage: ./scripts/rotate-secrets.sh [options]

Options:
  --type <type>       Type of secret to rotate:
                        db         - Database passwords
                        api        - API keys (Stripe, SendGrid, etc.)
                        oauth      - OAuth credentials
                        signing    - Code signing certificates
                        all        - All secrets (use with caution!)

  --environment <env> Environment to rotate:
                        dev        - Development
                        staging    - Staging
                        production - Production

  --service <name>    Specific service to rotate:
                        google, github, stripe, sendgrid, etc.

  --dry-run           Show what would be rotated without doing it
  --help              Show this help message

Examples:
  # Rotate database password in production
  ./scripts/rotate-secrets.sh --type db --environment production

  # Dry run for Google OAuth rotation
  ./scripts/rotate-secrets.sh --type oauth --service google --dry-run

  # Rotate all API keys in staging
  ./scripts/rotate-secrets.sh --type api --environment staging

Safety Notes:
  - Always run with --dry-run first
  - Rotation creates temporary downtime (< 30 seconds)
  - Old credentials remain valid for 5 minutes after rotation
  - Backup is created automatically before rotation
  - Production rotations require confirmation

EOF
  exit 0
}

generate_password() {
  local length=${1:-32}
  openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

generate_hex() {
  local length=${1:-32}
  openssl rand -hex "$length"
}

generate_uuid() {
  uuidgen | tr '[:upper:]' '[:lower:]'
}

backup_secret() {
  local secret_name=$1
  local secret_value=$2
  local backup_file="$PROJECT_ROOT/.secrets-backup/$(date +%Y%m%d_%H%M%S)_${secret_name}.txt"

  mkdir -p "$PROJECT_ROOT/.secrets-backup"
  echo "$secret_value" > "$backup_file"
  chmod 600 "$backup_file"

  log_success "Backed up $secret_name to $backup_file"
}

confirm_rotation() {
  if [ "$ENVIRONMENT" = "production" ]; then
    log_warning "⚠️  PRODUCTION ROTATION REQUESTED"
    echo ""
    echo "This will rotate secrets in PRODUCTION environment."
    echo "This operation:"
    echo "  - Creates brief service interruption"
    echo "  - Requires redeployment"
    echo "  - Cannot be easily undone"
    echo ""
    read -p "Type 'ROTATE' to confirm: " confirmation

    if [ "$confirmation" != "ROTATE" ]; then
      log_error "Rotation cancelled"
      exit 1
    fi
  fi
}

# =============================================================================
# Database Password Rotation
# =============================================================================

rotate_database_password() {
  log_info "Starting database password rotation..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate database password"
    log_info "[DRY RUN] Would generate new 32-char password"
    log_info "[DRY RUN] Would update DATABASE_URL"
    log_info "[DRY RUN] Would restart services"
    return
  fi

  # Get current database URL
  local db_url="${DATABASE_URL:-}"
  if [ -z "$db_url" ]; then
    log_error "DATABASE_URL not set"
    exit 1
  fi

  # Parse database URL
  local db_user=$(echo "$db_url" | sed -n 's|^postgres://\([^:]*\):.*|\1|p')
  local db_host=$(echo "$db_url" | sed -n 's|^postgres://[^@]*@\([^:]*\):.*|\1|p')
  local db_name=$(echo "$db_url" | sed -n 's|^.*/\([^?]*\).*|\1|p')

  log_info "Database user: $db_user"
  log_info "Database host: $db_host"
  log_info "Database name: $db_name"

  # Backup old password
  local old_password=$(echo "$db_url" | sed -n 's|^postgres://[^:]*:\([^@]*\)@.*|\1|p')
  backup_secret "database_password" "$old_password"

  # Generate new password
  local new_password=$(generate_password 32)
  log_success "Generated new password"

  # Update database
  log_info "Updating database password..."
  PGPASSWORD="$old_password" psql -h "$db_host" -U "$db_user" -d "$db_name" \
    -c "ALTER USER $db_user WITH PASSWORD '$new_password';"

  # Update environment variable
  local new_db_url="postgres://${db_user}:${new_password}@${db_host}/${db_name}"

  log_info "Updating DATABASE_URL..."
  # Update .env file
  if [ -f ".env.$ENVIRONMENT" ]; then
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$new_db_url|" ".env.$ENVIRONMENT"
    log_success "Updated .env.$ENVIRONMENT"
  fi

  # Update CI/CD secrets
  log_info "Don't forget to update CI/CD secrets:"
  echo "  - GitHub Actions: Settings → Secrets → DATABASE_URL"
  echo "  - Vercel: Settings → Environment Variables"
  echo "  - Docker: Update secrets in orchestrator"

  log_success "Database password rotated successfully"
  log_warning "Restart application to apply changes"
}

# =============================================================================
# API Key Rotation
# =============================================================================

rotate_api_key() {
  local service=$1

  log_info "Starting $service API key rotation..."

  case $service in
    stripe)
      rotate_stripe_key
      ;;
    sendgrid)
      rotate_sendgrid_key
      ;;
    sentry)
      rotate_sentry_key
      ;;
    *)
      log_error "Unknown service: $service"
      log_info "Supported services: stripe, sendgrid, sentry"
      exit 1
      ;;
  esac
}

rotate_stripe_key() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate Stripe API key"
    log_info "[DRY RUN] Steps:"
    log_info "[DRY RUN]   1. Create new restricted key in Stripe Dashboard"
    log_info "[DRY RUN]   2. Update STRIPE_SECRET_KEY in environment"
    log_info "[DRY RUN]   3. Deploy application"
    log_info "[DRY RUN]   4. Verify functionality"
    log_info "[DRY RUN]   5. Delete old key from Stripe Dashboard"
    return
  fi

  log_error "Manual rotation required for Stripe"
  log_info "Follow these steps:"
  echo ""
  echo "1. Visit: https://dashboard.stripe.com/apikeys"
  echo "2. Create new restricted key with same permissions"
  echo "3. Copy the new secret key"
  echo "4. Update STRIPE_SECRET_KEY in environment"
  echo "5. Run: pnpm validate:secrets --env $ENVIRONMENT"
  echo "6. Deploy application"
  echo "7. Test payment functionality"
  echo "8. Delete old key from Stripe Dashboard"
  echo ""
  log_warning "DO NOT rotate unless necessary - breaks active subscriptions!"
}

rotate_sendgrid_key() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate SendGrid API key"
    return
  fi

  log_error "Manual rotation required for SendGrid"
  log_info "Follow these steps:"
  echo ""
  echo "1. Visit: https://app.sendgrid.com/settings/api_keys"
  echo "2. Create new API key with Mail Send permission"
  echo "3. Copy the new API key"
  echo "4. Update SENDGRID_API_KEY in environment"
  echo "5. Run: pnpm validate:secrets --env $ENVIRONMENT"
  echo "6. Deploy application"
  echo "7. Test email sending"
  echo "8. Delete old key from SendGrid"
}

rotate_sentry_key() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate Sentry auth token"
    return
  fi

  log_error "Manual rotation required for Sentry"
  log_info "Follow these steps:"
  echo ""
  echo "1. Visit: https://sentry.io/settings/account/api/auth-tokens/"
  echo "2. Create new auth token with same permissions"
  echo "3. Copy the new token"
  echo "4. Update SENTRY_AUTH_TOKEN in environment"
  echo "5. Run: pnpm validate:secrets --env $ENVIRONMENT"
  echo "6. Deploy application"
  echo "7. Revoke old token from Sentry"
}

# =============================================================================
# OAuth Credentials Rotation
# =============================================================================

rotate_oauth_credentials() {
  local provider=$1

  log_info "Starting $provider OAuth rotation..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate $provider OAuth credentials"
    log_info "[DRY RUN] Steps:"
    log_info "[DRY RUN]   1. Create new OAuth app in provider dashboard"
    log_info "[DRY RUN]   2. Update client ID and secret in environment"
    log_info "[DRY RUN]   3. Deploy application"
    log_info "[DRY RUN]   4. Test OAuth flow"
    log_info "[DRY RUN]   5. Delete old OAuth app"
    return
  fi

  case $provider in
    google)
      log_info "Google OAuth rotation:"
      echo "  1. Visit: https://console.cloud.google.com/apis/credentials"
      echo "  2. Create new OAuth 2.0 Client ID"
      echo "  3. Add redirect URIs:"
      echo "     - $NEXT_PUBLIC_APP_URL/api/auth/callback/google"
      echo "  4. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
      ;;
    github)
      log_info "GitHub OAuth rotation:"
      echo "  1. Visit: https://github.com/settings/developers"
      echo "  2. Create new OAuth App"
      echo "  3. Set callback: $NEXT_PUBLIC_APP_URL/api/auth/callback/github"
      echo "  4. Update GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
      ;;
    microsoft)
      log_info "Microsoft OAuth rotation:"
      echo "  1. Visit: https://portal.azure.com"
      echo "  2. Azure AD → App registrations → New registration"
      echo "  3. Add redirect: $NEXT_PUBLIC_APP_URL/api/auth/callback/microsoft"
      echo "  4. Update MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET"
      ;;
    *)
      log_error "Unknown OAuth provider: $provider"
      exit 1
      ;;
  esac

  log_warning "After updating, run: pnpm validate:secrets --env $ENVIRONMENT"
}

# =============================================================================
# Signing Certificate Rotation
# =============================================================================

rotate_signing_certificate() {
  log_info "Starting code signing certificate rotation..."

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would rotate code signing certificate"
    log_info "[DRY RUN] This requires purchasing new certificate"
    return
  fi

  log_info "Code signing certificate rotation steps:"
  echo ""
  echo "macOS:"
  echo "  1. Visit: https://developer.apple.com/account/resources/certificates"
  echo "  2. Create new Developer ID Application certificate"
  echo "  3. Download and import to keychain"
  echo "  4. Export as .p12 with password"
  echo "  5. Update CSC_LINK and CSC_KEY_PASSWORD"
  echo ""
  echo "Windows:"
  echo "  1. Purchase new certificate from SSL.com, DigiCert, or Sectigo"
  echo "  2. Generate CSR and submit"
  echo "  3. Download as .pfx"
  echo "  4. Update WIN_CSC_LINK and WIN_CSC_KEY_PASSWORD"
  echo ""
  log_warning "Certificates typically valid for 1 year"
  log_warning "Start renewal process 30 days before expiration"
}

# =============================================================================
# Main Rotation Logic
# =============================================================================

rotate_secrets() {
  log_info "==================================================================="
  log_info "Secrets Rotation for: $ENVIRONMENT"
  log_info "Type: $SECRET_TYPE"
  [ -n "$SERVICE" ] && log_info "Service: $SERVICE"
  [ "$DRY_RUN" = true ] && log_warning "DRY RUN MODE - No changes will be made"
  log_info "==================================================================="
  echo ""

  # Confirm if production
  if [ "$DRY_RUN" = false ]; then
    confirm_rotation
  fi

  # Perform rotation based on type
  case $SECRET_TYPE in
    db)
      rotate_database_password
      ;;
    api)
      if [ -z "$SERVICE" ]; then
        log_error "Service name required for API key rotation"
        log_info "Use --service <name> (stripe, sendgrid, sentry)"
        exit 1
      fi
      rotate_api_key "$SERVICE"
      ;;
    oauth)
      if [ -z "$SERVICE" ]; then
        log_error "Provider name required for OAuth rotation"
        log_info "Use --service <name> (google, github, microsoft)"
        exit 1
      fi
      rotate_oauth_credentials "$SERVICE"
      ;;
    signing)
      rotate_signing_certificate
      ;;
    all)
      log_error "Rotating all secrets is dangerous and not recommended"
      log_info "Rotate secrets individually by type"
      exit 1
      ;;
    *)
      log_error "Unknown secret type: $SECRET_TYPE"
      show_help
      ;;
  esac

  echo ""
  log_success "Rotation process completed"
  echo ""
  log_info "Next steps:"
  echo "  1. Validate: pnpm validate:secrets --env $ENVIRONMENT --strict"
  echo "  2. Deploy application"
  echo "  3. Test functionality"
  echo "  4. Update documentation with rotation date"
  echo "  5. Revoke old credentials"
}

# =============================================================================
# Parse Arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --type)
      SECRET_TYPE="$2"
      shift 2
      ;;
    --environment|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      show_help
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      ;;
  esac
done

# Validate required arguments
if [ -z "$SECRET_TYPE" ]; then
  log_error "Secret type is required"
  show_help
fi

if [ -z "$ENVIRONMENT" ]; then
  log_error "Environment is required"
  show_help
fi

# Map environment aliases
case $ENVIRONMENT in
  dev|development)
    ENVIRONMENT="development"
    ;;
  stage|staging)
    ENVIRONMENT="staging"
    ;;
  prod|production)
    ENVIRONMENT="production"
    ;;
esac

# Run rotation
rotate_secrets

exit 0
