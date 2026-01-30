#!/bin/bash

###############################################################################
# Live Streaming Setup Script
#
# This script sets up the live streaming system for nself-chat.
#
# Usage:
#   ./scripts/setup-live-streaming.sh
#
# Prerequisites:
#   - nself CLI installed and configured
#   - .backend/ directory initialized
#   - Database running
###############################################################################

set -e

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

# Main script
main() {
    log_info "Setting up Live Streaming for nself-chat v0.4.0"
    echo

    # Check if .backend exists
    if [ ! -d ".backend" ]; then
        log_error ".backend/ directory not found"
        log_info "Please run 'nself init' first"
        exit 1
    fi

    # Check if migration file exists
    if [ ! -f ".backend/migrations/016_live_streaming.sql" ]; then
        log_error "Migration file not found: .backend/migrations/016_live_streaming.sql"
        exit 1
    fi

    log_info "Migration file found"
    echo

    # Run migration
    log_info "Running database migration..."
    cd .backend

    if nself db migrate up; then
        log_success "Database migration completed"
    else
        log_error "Database migration failed"
        log_info "Check .backend/logs/ for details"
        exit 1
    fi

    cd ..
    echo

    # Check environment variables
    log_info "Checking environment variables..."

    if [ -f ".env.local" ]; then
        if grep -q "NEXT_PUBLIC_STREAM_INGEST_URL" .env.local; then
            log_success "NEXT_PUBLIC_STREAM_INGEST_URL found"
        else
            log_warning "NEXT_PUBLIC_STREAM_INGEST_URL not found in .env.local"
            log_info "Add: NEXT_PUBLIC_STREAM_INGEST_URL=rtmp://localhost:1935/live"
        fi

        if grep -q "NEXT_PUBLIC_HLS_BASE_URL" .env.local; then
            log_success "NEXT_PUBLIC_HLS_BASE_URL found"
        else
            log_warning "NEXT_PUBLIC_HLS_BASE_URL not found in .env.local"
            log_info "Add: NEXT_PUBLIC_HLS_BASE_URL=http://localhost:8080/hls"
        fi
    else
        log_warning ".env.local not found"
        log_info "Creating .env.local with streaming configuration..."

        cat >> .env.local << EOF

# Live Streaming Configuration
NEXT_PUBLIC_STREAM_INGEST_URL=rtmp://localhost:1935/live
NEXT_PUBLIC_HLS_BASE_URL=http://localhost:8080/hls
STREAM_RECORDING_ENABLED=true
STREAM_RECORDING_PATH=/var/recordings
EOF
        log_success "Created .env.local with streaming configuration"
    fi

    echo

    # Summary
    log_success "Live Streaming setup complete!"
    echo
    log_info "Next steps:"
    echo "  1. Install dependencies: pnpm install"
    echo "  2. Setup media server (see docs/Live-Streaming-Implementation.md)"
    echo "  3. Configure environment variables in .env.local"
    echo "  4. Start development server: pnpm dev"
    echo "  5. Test broadcasting: /broadcast or /go-live"
    echo
    log_info "Documentation:"
    echo "  - Quick Start: docs/Live-Streaming-Quick-Start.md"
    echo "  - Full Guide: docs/Live-Streaming-Implementation.md"
    echo "  - Library README: src/lib/streaming/README.md"
    echo
    log_success "Happy streaming! 🎥"
}

# Run main
main "$@"
