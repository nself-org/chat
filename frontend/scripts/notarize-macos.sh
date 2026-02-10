#!/usr/bin/env bash
#
# Notarize macOS application with Apple
# Usage: ./scripts/notarize-macos.sh <app-path>
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <app-path>"
    echo ""
    echo "Examples:"
    echo "  $0 dist/nchat.app"
    echo "  $0 dist/nchat.dmg"
    exit 1
fi

APP_PATH="$1"

# Validate app path
if [ ! -e "$APP_PATH" ]; then
    log_error "App not found: $APP_PATH"
    exit 1
fi

# Check required environment variables
if [ -z "${APPLE_ID:-}" ]; then
    log_error "APPLE_ID environment variable is required"
    exit 1
fi

if [ -z "${APPLE_APP_SPECIFIC_PASSWORD:-}" ] && [ -z "${APPLE_PASSWORD:-}" ]; then
    log_error "APPLE_APP_SPECIFIC_PASSWORD or APPLE_PASSWORD is required"
    log_info "Generate an app-specific password at: https://appleid.apple.com/account/manage"
    exit 1
fi

if [ -z "${APPLE_TEAM_ID:-}" ]; then
    log_error "APPLE_TEAM_ID environment variable is required"
    exit 1
fi

APPLE_PASSWORD="${APPLE_APP_SPECIFIC_PASSWORD:-$APPLE_PASSWORD}"

cd "$PROJECT_ROOT"

log_info "Notarizing macOS application: $APP_PATH"

# Determine if we're notarizing a .app or .dmg
if [[ "$APP_PATH" == *.app ]]; then
    # Create a ZIP for notarization
    log_info "Creating ZIP for notarization..."
    ZIP_PATH="${APP_PATH}.zip"
    ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"
    NOTARIZE_PATH="$ZIP_PATH"
elif [[ "$APP_PATH" == *.dmg ]]; then
    NOTARIZE_PATH="$APP_PATH"
elif [[ "$APP_PATH" == *.pkg ]]; then
    NOTARIZE_PATH="$APP_PATH"
else
    log_error "Unsupported file type: $APP_PATH (must be .app, .dmg, or .pkg)"
    exit 1
fi

# Submit for notarization
log_info "Submitting to Apple notarization service..."
log_warning "This may take several minutes..."

# Use xcrun notarytool (Xcode 13+)
if command -v xcrun &> /dev/null && xcrun notarytool --help &> /dev/null; then
    log_info "Using notarytool (Xcode 13+)"

    # Store credentials in keychain
    KEYCHAIN_PROFILE="nchat-notarization"

    # Check if profile already exists
    if ! xcrun notarytool history --keychain-profile "$KEYCHAIN_PROFILE" &> /dev/null; then
        log_info "Storing credentials in keychain..."
        xcrun notarytool store-credentials "$KEYCHAIN_PROFILE" \
            --apple-id "$APPLE_ID" \
            --team-id "$APPLE_TEAM_ID" \
            --password "$APPLE_PASSWORD"
    fi

    # Submit for notarization
    log_info "Uploading to Apple..."
    SUBMIT_OUTPUT=$(xcrun notarytool submit "$NOTARIZE_PATH" \
        --keychain-profile "$KEYCHAIN_PROFILE" \
        --wait 2>&1)

    echo "$SUBMIT_OUTPUT"

    # Check if successful
    if echo "$SUBMIT_OUTPUT" | grep -q "status: Accepted"; then
        log_success "Notarization successful!"

        # Staple the ticket (for .app and .dmg)
        if [[ "$APP_PATH" == *.app ]] || [[ "$APP_PATH" == *.dmg ]]; then
            log_info "Stapling notarization ticket..."
            xcrun stapler staple "$APP_PATH"

            # Verify stapling
            log_info "Verifying stapled ticket..."
            if xcrun stapler validate "$APP_PATH"; then
                log_success "Notarization ticket stapled successfully"
            else
                log_error "Failed to staple notarization ticket"
                exit 1
            fi
        fi

        # Clean up ZIP if created
        if [[ "$APP_PATH" == *.app ]] && [ -f "$ZIP_PATH" ]; then
            rm -f "$ZIP_PATH"
        fi

        log_success "macOS application notarized successfully!"
        log_info "The application is now ready for distribution"

    elif echo "$SUBMIT_OUTPUT" | grep -q "status: Invalid"; then
        log_error "Notarization failed - Invalid submission"

        # Get submission ID
        SUBMISSION_ID=$(echo "$SUBMIT_OUTPUT" | grep "id:" | head -1 | awk '{print $2}')

        if [ -n "$SUBMISSION_ID" ]; then
            log_info "Fetching notarization log..."
            xcrun notarytool log "$SUBMISSION_ID" \
                --keychain-profile "$KEYCHAIN_PROFILE" \
                notarization-log.json

            if [ -f notarization-log.json ]; then
                log_error "Notarization log saved to: notarization-log.json"
                if command -v jq &> /dev/null; then
                    log_error "Issues found:"
                    jq '.issues' notarization-log.json
                fi
            fi
        fi

        exit 1

    else
        log_error "Notarization failed with unknown status"
        echo "$SUBMIT_OUTPUT"
        exit 1
    fi

else
    # Fallback to altool (deprecated but still works)
    log_warning "notarytool not found, using altool (deprecated)"

    log_info "Uploading to Apple..."
    UPLOAD_OUTPUT=$(xcrun altool --notarize-app \
        --primary-bundle-id "io.nself.chat" \
        --username "$APPLE_ID" \
        --password "$APPLE_PASSWORD" \
        --asc-provider "$APPLE_TEAM_ID" \
        --file "$NOTARIZE_PATH" 2>&1)

    echo "$UPLOAD_OUTPUT"

    # Extract RequestUUID
    REQUEST_UUID=$(echo "$UPLOAD_OUTPUT" | grep "RequestUUID" | awk '{print $3}')

    if [ -z "$REQUEST_UUID" ]; then
        log_error "Failed to submit for notarization"
        echo "$UPLOAD_OUTPUT"
        exit 1
    fi

    log_info "Request UUID: $REQUEST_UUID"
    log_info "Waiting for notarization to complete..."

    # Poll for status
    MAX_ATTEMPTS=60
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        sleep 30
        ATTEMPT=$((ATTEMPT + 1))

        STATUS_OUTPUT=$(xcrun altool --notarization-info "$REQUEST_UUID" \
            --username "$APPLE_ID" \
            --password "$APPLE_PASSWORD" 2>&1)

        if echo "$STATUS_OUTPUT" | grep -q "Status: success"; then
            log_success "Notarization successful!"

            # Staple the ticket
            if [[ "$APP_PATH" == *.app ]] || [[ "$APP_PATH" == *.dmg ]]; then
                log_info "Stapling notarization ticket..."
                xcrun stapler staple "$APP_PATH"

                if xcrun stapler validate "$APP_PATH"; then
                    log_success "Notarization ticket stapled successfully"
                else
                    log_error "Failed to staple notarization ticket"
                    exit 1
                fi
            fi

            # Clean up
            if [[ "$APP_PATH" == *.app ]] && [ -f "$ZIP_PATH" ]; then
                rm -f "$ZIP_PATH"
            fi

            log_success "macOS application notarized successfully!"
            exit 0

        elif echo "$STATUS_OUTPUT" | grep -q "Status: invalid"; then
            log_error "Notarization failed"
            echo "$STATUS_OUTPUT"

            # Get log URL
            LOG_URL=$(echo "$STATUS_OUTPUT" | grep "LogFileURL:" | awk '{print $2}')
            if [ -n "$LOG_URL" ]; then
                log_info "Downloading notarization log..."
                curl -o notarization-log.json "$LOG_URL"
                log_error "Log saved to: notarization-log.json"
            fi

            exit 1

        else
            log_info "Status: in progress (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        fi
    done

    log_error "Notarization timed out after $MAX_ATTEMPTS attempts"
    exit 1
fi
