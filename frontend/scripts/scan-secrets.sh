#!/usr/bin/env bash

# =============================================================================
# Secret Scanner CI Script
# =============================================================================
# Scans the codebase for hardcoded secrets and sensitive data.
# Designed for CI/CD integration with configurable blocking behavior.
#
# Usage:
#   ./scripts/scan-secrets.sh [options]
#
# Options:
#   --block          Block on any findings (default: block on critical/high)
#   --no-block       Never block, just report
#   --json           Output in JSON format
#   --sarif          Output in SARIF format (for GitHub)
#   --output FILE    Write results to file
#   --path PATH      Scan specific path (default: .)
#   --verbose        Show detailed output
#   --help           Show this help message
#
# Environment Variables:
#   SECRET_SCAN_BLOCK_ON_HIGH    Block on high severity (default: true)
#   SECRET_SCAN_BLOCK_ON_MEDIUM  Block on medium severity (default: false)
#   SECRET_SCAN_MIN_SEVERITY     Minimum severity to report (default: low)
#   SECRET_SCAN_ALLOWLIST        Path to allowlist file
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default configuration
BLOCK_MODE="auto"  # auto, always, never
OUTPUT_FORMAT="text"  # text, json, sarif
OUTPUT_FILE=""
SCAN_PATH="${PROJECT_ROOT}"
VERBOSE=false
MIN_SEVERITY="${SECRET_SCAN_MIN_SEVERITY:-low}"
BLOCK_ON_HIGH="${SECRET_SCAN_BLOCK_ON_HIGH:-true}"
BLOCK_ON_MEDIUM="${SECRET_SCAN_BLOCK_ON_MEDIUM:-false}"
ALLOWLIST_FILE="${SECRET_SCAN_ALLOWLIST:-}"

# =============================================================================
# Functions
# =============================================================================

show_help() {
    cat << EOF
Secret Scanner CI Script

Usage:
  ./scripts/scan-secrets.sh [options]

Options:
  --block          Block on any findings
  --no-block       Never block, just report
  --json           Output in JSON format
  --sarif          Output in SARIF format (for GitHub)
  --output FILE    Write results to file
  --path PATH      Scan specific path (default: current directory)
  --min-severity   Minimum severity to report (critical, high, medium, low, info)
  --verbose        Show detailed output
  --help           Show this help message

Environment Variables:
  SECRET_SCAN_BLOCK_ON_HIGH    Block on high severity (default: true)
  SECRET_SCAN_BLOCK_ON_MEDIUM  Block on medium severity (default: false)
  SECRET_SCAN_MIN_SEVERITY     Minimum severity to report (default: low)
  SECRET_SCAN_ALLOWLIST        Path to allowlist file

Exit Codes:
  0  No blocking findings
  1  Critical/high severity findings (or all findings if --block)
  2  Configuration or runtime error

Examples:
  # Standard CI scan
  ./scripts/scan-secrets.sh

  # Scan and output SARIF for GitHub
  ./scripts/scan-secrets.sh --sarif --output results.sarif

  # Scan specific directory
  ./scripts/scan-secrets.sh --path ./src

  # Don't block, just report
  ./scripts/scan-secrets.sh --no-block --verbose
EOF
    exit 0
}

log_info() {
    if [[ "${VERBOSE}" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
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

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --block)
                BLOCK_MODE="always"
                shift
                ;;
            --no-block)
                BLOCK_MODE="never"
                shift
                ;;
            --json)
                OUTPUT_FORMAT="json"
                shift
                ;;
            --sarif)
                OUTPUT_FORMAT="sarif"
                shift
                ;;
            --output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --path)
                SCAN_PATH="$2"
                shift 2
                ;;
            --min-severity)
                MIN_SEVERITY="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                exit 2
                ;;
        esac
    done
}

# Check if Node.js is available
check_dependencies() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 2
    fi

    if ! command -v npx &> /dev/null; then
        log_error "npx is required but not installed"
        exit 2
    fi

    log_info "Dependencies check passed"
}

# Run the TypeScript scanner
run_scanner() {
    log_info "Running secret scanner on ${SCAN_PATH}"

    # Create a temporary runner script
    local runner_script="${PROJECT_ROOT}/node_modules/.cache/secret-scanner-runner.mjs"
    mkdir -p "$(dirname "${runner_script}")"

    cat > "${runner_script}" << 'SCRIPT_EOF'
import { createSecretScanner, formatScanResult, formatScanResultJson, toSarif } from '../../../src/lib/secrets/secret-scanner.ts';

const args = process.argv.slice(2);
const config = JSON.parse(args[0] || '{}');

const scanner = createSecretScanner({
  rootDir: config.path || process.cwd(),
  minSeverity: config.minSeverity || 'low',
  includeFalsePositives: false,
});

const result = scanner.scan();

if (config.format === 'json') {
  console.log(formatScanResultJson(result));
} else if (config.format === 'sarif') {
  console.log(JSON.stringify(toSarif(result), null, 2));
} else {
  console.log(formatScanResult(result));
}

// Exit with appropriate code
if (config.blockMode === 'always' && result.findings.length > 0) {
  process.exit(1);
} else if (config.blockMode === 'auto' && result.shouldBlockDeployment) {
  process.exit(1);
} else if (config.blockMode === 'never') {
  process.exit(0);
} else {
  process.exit(result.shouldBlockDeployment ? 1 : 0);
}
SCRIPT_EOF

    # Build the config JSON
    local config_json=$(cat << EOF
{
  "path": "${SCAN_PATH}",
  "format": "${OUTPUT_FORMAT}",
  "minSeverity": "${MIN_SEVERITY}",
  "blockMode": "${BLOCK_MODE}"
}
EOF
)

    # Run with ts-node or tsx
    local result_output
    local exit_code=0

    if command -v tsx &> /dev/null; then
        result_output=$(cd "${PROJECT_ROOT}" && tsx "${runner_script}" "${config_json}" 2>&1) || exit_code=$?
    elif command -v ts-node &> /dev/null; then
        result_output=$(cd "${PROJECT_ROOT}" && ts-node --esm "${runner_script}" "${config_json}" 2>&1) || exit_code=$?
    else
        # Fallback to Node.js with TypeScript loader
        result_output=$(cd "${PROJECT_ROOT}" && node --loader ts-node/esm "${runner_script}" "${config_json}" 2>&1) || exit_code=$?
    fi

    # Output results
    if [[ -n "${OUTPUT_FILE}" ]]; then
        echo "${result_output}" > "${OUTPUT_FILE}"
        log_info "Results written to ${OUTPUT_FILE}"
    fi

    echo "${result_output}"

    return ${exit_code}
}

# Alternative: Use npx with a simpler approach
run_scanner_simple() {
    log_info "Running simple secret scanner"

    cd "${PROJECT_ROOT}"

    # Use Node.js directly with inline TypeScript compilation
    node --experimental-strip-types -e "
const { createSecretScanner, formatScanResult, formatScanResultJson, toSarif } = require('./src/lib/secrets/secret-scanner.ts');

const scanner = createSecretScanner({
  rootDir: '${SCAN_PATH}',
  minSeverity: '${MIN_SEVERITY}',
  includeFalsePositives: false,
});

const result = scanner.scan();

if ('${OUTPUT_FORMAT}' === 'json') {
  console.log(formatScanResultJson(result));
} else if ('${OUTPUT_FORMAT}' === 'sarif') {
  console.log(JSON.stringify(toSarif(result), null, 2));
} else {
  console.log(formatScanResult(result));
}

process.exit(result.shouldBlockDeployment ? 1 : 0);
" 2>/dev/null || {
        # Fallback to grep-based scanning
        run_scanner_grep
        return $?
    }
}

# Fallback grep-based scanner
run_scanner_grep() {
    log_info "Using grep-based fallback scanner"

    local findings=0
    local critical=0
    local high=0

    echo ""
    echo "======================================"
    echo "       SECRET SCAN RESULTS"
    echo "======================================"
    echo ""

    # AWS Keys
    log_info "Checking for AWS keys..."
    local aws_keys=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" \
        -E "(AKIA|A3T[A-Z0-9]|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" || true)

    if [[ -n "${aws_keys}" ]]; then
        echo -e "${RED}[CRITICAL]${NC} AWS Access Key ID found:"
        echo "${aws_keys}" | head -5
        ((critical++))
        ((findings++))
    fi

    # GitHub Tokens
    log_info "Checking for GitHub tokens..."
    local github_tokens=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" \
        -E "gh[pousr]_[a-zA-Z0-9]{36}" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" || true)

    if [[ -n "${github_tokens}" ]]; then
        echo -e "${RED}[CRITICAL]${NC} GitHub token found:"
        echo "${github_tokens}" | head -5
        ((critical++))
        ((findings++))
    fi

    # Stripe Keys
    log_info "Checking for Stripe keys..."
    local stripe_keys=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" \
        -E "sk_(live|test)_[0-9a-zA-Z]{24,}" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" || true)

    if [[ -n "${stripe_keys}" ]]; then
        echo -e "${RED}[CRITICAL]${NC} Stripe secret key found:"
        echo "${stripe_keys}" | head -5
        ((critical++))
        ((findings++))
    fi

    # Private Keys
    log_info "Checking for private keys..."
    local private_keys=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" --include="*.pem" --include="*.key" \
        -E "-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" || true)

    if [[ -n "${private_keys}" ]]; then
        echo -e "${RED}[CRITICAL]${NC} Private key found:"
        echo "${private_keys}" | head -5
        ((critical++))
        ((findings++))
    fi

    # Database URLs with passwords
    log_info "Checking for database URLs..."
    local db_urls=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" \
        -E "postgres(ql)?://[^:]+:[^@]+@" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" | grep -v ".example" || true)

    if [[ -n "${db_urls}" ]]; then
        echo -e "${YELLOW}[HIGH]${NC} Database URL with credentials found:"
        echo "${db_urls}" | head -5
        ((high++))
        ((findings++))
    fi

    # Slack Webhooks
    log_info "Checking for Slack webhooks..."
    local slack_hooks=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env" \
        -E "https://hooks\.slack\.com/services/T[0-9A-Z]+/B[0-9A-Z]+/[0-9a-zA-Z]{24}" \
        "${SCAN_PATH}" 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "secret-scanner" || true)

    if [[ -n "${slack_hooks}" ]]; then
        echo -e "${YELLOW}[HIGH]${NC} Slack webhook URL found:"
        echo "${slack_hooks}" | head -5
        ((high++))
        ((findings++))
    fi

    echo ""
    echo "======================================"
    echo "Summary:"
    echo "  Critical: ${critical}"
    echo "  High:     ${high}"
    echo "  Total:    ${findings}"
    echo "======================================"
    echo ""

    # Determine exit code
    if [[ "${BLOCK_MODE}" == "never" ]]; then
        return 0
    elif [[ "${BLOCK_MODE}" == "always" && ${findings} -gt 0 ]]; then
        log_error "Deployment blocked: ${findings} findings detected"
        return 1
    elif [[ ${critical} -gt 0 || (${high} -gt 0 && "${BLOCK_ON_HIGH}" == "true") ]]; then
        log_error "Deployment blocked: Critical or high severity findings detected"
        return 1
    fi

    log_success "No blocking findings detected"
    return 0
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}       nchat Secret Scanner${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""

    parse_args "$@"
    check_dependencies

    log_info "Configuration:"
    log_info "  Path: ${SCAN_PATH}"
    log_info "  Format: ${OUTPUT_FORMAT}"
    log_info "  Block Mode: ${BLOCK_MODE}"
    log_info "  Min Severity: ${MIN_SEVERITY}"

    # Try the TypeScript scanner first, fall back to grep
    if [[ -f "${PROJECT_ROOT}/src/lib/secrets/secret-scanner.ts" ]]; then
        # Check if we can use tsx or ts-node
        if command -v tsx &> /dev/null || command -v ts-node &> /dev/null; then
            run_scanner || exit $?
        else
            run_scanner_grep || exit $?
        fi
    else
        run_scanner_grep || exit $?
    fi
}

main "$@"
