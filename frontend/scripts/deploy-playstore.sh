#!/usr/bin/env bash
#
# Deploy Android app to Google Play Store
# Usage: ./scripts/deploy-playstore.sh [--track <track>] [--rollout <percentage>]
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

# Default values
TRACK="internal"
ROLLOUT_PERCENTAGE=""
AAB_PATH=""
PACKAGE_NAME="io.nself.chat"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --track)
            TRACK="$2"
            shift 2
            ;;
        --rollout)
            ROLLOUT_PERCENTAGE="$2"
            shift 2
            ;;
        --aab)
            AAB_PATH="$2"
            shift 2
            ;;
        --package)
            PACKAGE_NAME="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 [--track <internal|alpha|beta|production>] [--rollout <percentage>] [--aab <path>]"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

# Validate track
if [[ ! "$TRACK" =~ ^(internal|alpha|beta|production)$ ]]; then
    log_error "Invalid track: $TRACK (must be internal, alpha, beta, or production)"
    exit 1
fi

# Validate rollout percentage if specified
if [ -n "$ROLLOUT_PERCENTAGE" ]; then
    if ! [[ "$ROLLOUT_PERCENTAGE" =~ ^[0-9]+$ ]] || [ "$ROLLOUT_PERCENTAGE" -lt 1 ] || [ "$ROLLOUT_PERCENTAGE" -gt 100 ]; then
        log_error "Invalid rollout percentage: $ROLLOUT_PERCENTAGE (must be 1-100)"
        exit 1
    fi
fi

# Check required environment variables
if [ -z "${PLAY_STORE_JSON_KEY:-}" ]; then
    log_error "PLAY_STORE_JSON_KEY environment variable is required"
    log_info "Set it to the base64-encoded service account JSON key"
    exit 1
fi

# Get version info
VERSION=$(node -p "require('./package.json').version")
VERSION_CODE=$(date +%Y%m%d%H%M)

log_info "Deploying nChat v${VERSION} (${VERSION_CODE}) to Play Store ($TRACK track)"

# Find AAB file if not specified
if [ -z "$AAB_PATH" ]; then
    if [ -f "platforms/capacitor/android/app/build/outputs/bundle/release/app-release.aab" ]; then
        AAB_PATH="platforms/capacitor/android/app/build/outputs/bundle/release/app-release.aab"
    elif [ -f "platforms/capacitor/dist/nchat-release.aab" ]; then
        AAB_PATH="platforms/capacitor/dist/nchat-release.aab"
    else
        log_error "AAB file not found. Please build the app first or specify --aab path"
        exit 1
    fi
fi

log_info "Using AAB: $AAB_PATH"

# Validate AAB
if [ ! -f "$AAB_PATH" ]; then
    log_error "AAB file not found: $AAB_PATH"
    exit 1
fi

# Create temporary service account JSON file
SERVICE_ACCOUNT_JSON=$(mktemp)
trap "rm -f $SERVICE_ACCOUNT_JSON" EXIT

echo "$PLAY_STORE_JSON_KEY" | base64 --decode > "$SERVICE_ACCOUNT_JSON"

# Validate service account JSON
if ! jq empty "$SERVICE_ACCOUNT_JSON" 2>/dev/null; then
    log_error "Invalid service account JSON"
    exit 1
fi

log_info "Service account JSON validated"

# Install or check for Google Play CLI tools
if ! command -v bundletool &> /dev/null; then
    log_warning "bundletool not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install bundletool
    else
        log_error "Please install bundletool manually: https://github.com/google/bundletool"
        exit 1
    fi
fi

# Validate AAB with bundletool
log_info "Validating AAB..."
if ! bundletool validate --bundle="$AAB_PATH"; then
    log_error "AAB validation failed"
    exit 1
fi

log_success "AAB validated successfully"

# Create release notes
RELEASE_NOTES_DIR=$(mktemp -d)
trap "rm -rf $RELEASE_NOTES_DIR" EXIT

mkdir -p "$RELEASE_NOTES_DIR/en-US"

# Generate release notes from CHANGELOG if available
if [ -f "CHANGELOG.md" ]; then
    # Extract latest version notes
    awk "/## \[${VERSION}\]/,/## \[/" CHANGELOG.md | head -n -1 | tail -n +2 > "$RELEASE_NOTES_DIR/en-US/default.txt"
else
    echo "Bug fixes and performance improvements" > "$RELEASE_NOTES_DIR/en-US/default.txt"
fi

# Truncate to 500 characters (Play Store limit)
if [ $(wc -c < "$RELEASE_NOTES_DIR/en-US/default.txt") -gt 500 ]; then
    log_warning "Release notes truncated to 500 characters"
    head -c 497 "$RELEASE_NOTES_DIR/en-US/default.txt" > "$RELEASE_NOTES_DIR/en-US/default.txt.tmp"
    echo "..." >> "$RELEASE_NOTES_DIR/en-US/default.txt.tmp"
    mv "$RELEASE_NOTES_DIR/en-US/default.txt.tmp" "$RELEASE_NOTES_DIR/en-US/default.txt"
fi

log_info "Release notes prepared"

# Use Google Play API to upload
log_info "Uploading to Play Store..."

# Create upload script using Google Play Publishing API
UPLOAD_SCRIPT=$(mktemp)
trap "rm -f $UPLOAD_SCRIPT" EXIT

cat > "$UPLOAD_SCRIPT" <<'UPLOAD_EOF'
#!/usr/bin/env python3
import os
import sys
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Get parameters
service_account_file = sys.argv[1]
package_name = sys.argv[2]
aab_file = sys.argv[3]
track = sys.argv[4]
rollout = sys.argv[5] if len(sys.argv) > 5 else None

# Authenticate
credentials = service_account.Credentials.from_service_account_file(
    service_account_file,
    scopes=['https://www.googleapis.com/auth/androidpublisher']
)

# Build service
service = build('androidpublisher', 'v3', credentials=credentials)

try:
    # Create edit
    edit_request = service.edits().insert(body={}, packageName=package_name)
    result = edit_request.execute()
    edit_id = result['id']
    print(f"Created edit: {edit_id}")

    # Upload AAB
    aab_response = service.edits().bundles().upload(
        editId=edit_id,
        packageName=package_name,
        media_body=MediaFileUpload(aab_file, mimetype='application/octet-stream')
    ).execute()

    version_code = aab_response['versionCode']
    print(f"Uploaded AAB with version code: {version_code}")

    # Update track
    track_body = {
        'releases': [{
            'versionCodes': [version_code],
            'status': 'completed' if not rollout else 'inProgress',
        }]
    }

    if rollout:
        track_body['releases'][0]['userFraction'] = float(rollout) / 100

    service.edits().tracks().update(
        editId=edit_id,
        track=track,
        packageName=package_name,
        body=track_body
    ).execute()

    print(f"Updated {track} track")

    # Commit edit
    commit_request = service.edits().commit(
        editId=edit_id,
        packageName=package_name
    ).execute()

    print(f"Committed edit: {commit_request['id']}")
    print("Upload successful!")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
UPLOAD_EOF

chmod +x "$UPLOAD_SCRIPT"

# Check if Python and required packages are available
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is required for uploading to Play Store"
    exit 1
fi

# Install required Python packages
if ! python3 -c "import google.oauth2" 2>/dev/null; then
    log_info "Installing required Python packages..."
    pip3 install --upgrade google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
fi

# Execute upload
if [ -n "$ROLLOUT_PERCENTAGE" ]; then
    python3 "$UPLOAD_SCRIPT" "$SERVICE_ACCOUNT_JSON" "$PACKAGE_NAME" "$AAB_PATH" "$TRACK" "$ROLLOUT_PERCENTAGE"
else
    python3 "$UPLOAD_SCRIPT" "$SERVICE_ACCOUNT_JSON" "$PACKAGE_NAME" "$AAB_PATH" "$TRACK"
fi

if [ $? -eq 0 ]; then
    log_success "Successfully deployed to Play Store ($TRACK track)"

    if [ -n "$ROLLOUT_PERCENTAGE" ]; then
        log_info "Staged rollout: ${ROLLOUT_PERCENTAGE}% of users"
    fi

    log_info "Play Console URL: https://play.google.com/console/u/0/developers/$PACKAGE_NAME/app-bundle"
else
    log_error "Failed to deploy to Play Store"
    exit 1
fi

log_success "Deployment complete!"
log_info "Next steps:"
echo "  1. Review the release in Play Console"
echo "  2. Monitor crash reports and ANRs"
echo "  3. Monitor user feedback"
if [ "$TRACK" = "internal" ] || [ "$TRACK" = "alpha" ]; then
    echo "  4. Promote to next track when ready"
fi
