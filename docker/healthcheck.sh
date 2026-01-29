#!/bin/sh
# ============================================================================
# nself-chat Health Check Script
# ============================================================================
# Used by Docker and Kubernetes for container health probes
# Exit codes: 0 = healthy, 1 = unhealthy
# ============================================================================

set -e

# Configuration
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
TIMEOUT="${HEALTH_TIMEOUT:-5}"

# Perform health check
response=$(curl -sf --max-time "$TIMEOUT" "$HEALTH_URL" 2>/dev/null) || {
    echo "Health check failed: Unable to connect to $HEALTH_URL"
    exit 1
}

# Parse response to check status
status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

case "$status" in
    "healthy")
        echo "Health check passed: status=$status"
        exit 0
        ;;
    "degraded")
        # Degraded is acceptable - service is partially functional
        echo "Health check warning: status=$status"
        exit 0
        ;;
    "unhealthy")
        echo "Health check failed: status=$status"
        exit 1
        ;;
    *)
        echo "Health check failed: unexpected status=$status"
        exit 1
        ;;
esac
