#!/bin/bash

# ============================================================================
# Security Scan Script for nself-chat
# ============================================================================
# Runs comprehensive security scans locally including:
# - SAST (Static Application Security Testing)
# - SCA (Software Composition Analysis / Dependency Scanning)
# - Secret Detection
# - License Compliance
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
PASSED=0
FAILED=0
WARNINGS=0

# Configuration
FAIL_ON_CRITICAL=true
FAIL_ON_HIGH=true
OUTPUT_DIR="security-reports"
VERBOSE=false
SCAN_TYPE="all"

# ============================================================================
# Usage
# ============================================================================

usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help          Show this help message"
  echo "  -v, --verbose       Enable verbose output"
  echo "  -o, --output DIR    Output directory for reports (default: security-reports)"
  echo "  -t, --type TYPE     Scan type: all, sast, sca, secrets, license (default: all)"
  echo "  --no-fail-critical  Don't fail on critical findings"
  echo "  --no-fail-high      Don't fail on high findings"
  echo ""
  echo "Examples:"
  echo "  $0                  # Run all scans"
  echo "  $0 -t sast          # Run only SAST scan"
  echo "  $0 -t sca -v        # Run SCA scan with verbose output"
  echo ""
  exit 0
}

# ============================================================================
# Parse Arguments
# ============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -t|--type)
      SCAN_TYPE="$2"
      shift 2
      ;;
    --no-fail-critical)
      FAIL_ON_CRITICAL=false
      shift
      ;;
    --no-fail-high)
      FAIL_ON_HIGH=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((PASSED++)) || true
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
  ((WARNINGS++)) || true
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((FAILED++)) || true
}

log_section() {
  echo ""
  echo -e "${BOLD}${CYAN}========================================${NC}"
  echo -e "${BOLD}${CYAN}$1${NC}"
  echo -e "${BOLD}${CYAN}========================================${NC}"
  echo ""
}

verbose_log() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}[DEBUG]${NC} $1"
  fi
}

# ============================================================================
# Setup
# ============================================================================

setup() {
  log_section "Security Scan Setup"

  # Create output directory
  mkdir -p "$OUTPUT_DIR"
  log_info "Output directory: $OUTPUT_DIR"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  log_info "Node.js version: $(node --version)"

  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed"
    exit 1
  fi
  log_info "pnpm version: $(pnpm --version)"

  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
  fi

  echo ""
}

# ============================================================================
# SAST Scan
# ============================================================================

run_sast_scan() {
  log_section "SAST Scan (Static Application Security Testing)"

  local sast_file="$OUTPUT_DIR/sast-report.json"
  local sast_critical=0
  local sast_high=0
  local sast_medium=0
  local sast_low=0

  # Run our custom SAST scanner
  log_info "Running custom SAST scanner..."

  if [ -f "scripts/run-sast-scan.ts" ]; then
    pnpm tsx scripts/run-sast-scan.ts --output "$sast_file" 2>/dev/null || true

    if [ -f "$sast_file" ]; then
      sast_critical=$(jq -r '.summary.critical // 0' "$sast_file")
      sast_high=$(jq -r '.summary.high // 0' "$sast_file")
      sast_medium=$(jq -r '.summary.medium // 0' "$sast_file")
      sast_low=$(jq -r '.summary.low // 0' "$sast_file")

      verbose_log "SAST results saved to $sast_file"
    fi
  else
    log_warning "Custom SAST scanner not found, using pattern-based scan"

    # Fallback: basic pattern scanning
    local patterns_found=0

    # Check for eval usage
    if grep -rn "eval\s*(" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".test."; then
      log_warning "Found eval() usage - potential code injection"
      ((patterns_found++)) || true
    fi

    # Check for innerHTML
    if grep -rn "innerHTML\s*=" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".test."; then
      log_warning "Found innerHTML usage - potential XSS"
      ((patterns_found++)) || true
    fi

    # Check for SQL injection patterns
    if grep -rn 'query.*`.*\${' src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".test."; then
      log_warning "Found potential SQL injection pattern"
      ((patterns_found++)) || true
    fi

    sast_medium=$patterns_found
  fi

  # Update counters
  CRITICAL=$((CRITICAL + sast_critical))
  HIGH=$((HIGH + sast_high))
  MEDIUM=$((MEDIUM + sast_medium))
  LOW=$((LOW + sast_low))

  # Report results
  echo ""
  echo -e "  ${BOLD}SAST Results:${NC}"
  echo -e "  - Critical: ${RED}$sast_critical${NC}"
  echo -e "  - High:     ${YELLOW}$sast_high${NC}"
  echo -e "  - Medium:   ${CYAN}$sast_medium${NC}"
  echo -e "  - Low:      ${GREEN}$sast_low${NC}"

  if [ "$sast_critical" -gt 0 ] || [ "$sast_high" -gt 0 ]; then
    log_error "SAST scan found critical/high severity issues"
  elif [ "$sast_medium" -gt 0 ]; then
    log_warning "SAST scan found medium severity issues"
  else
    log_success "SAST scan passed"
  fi
}

# ============================================================================
# SCA Scan (Dependency Scanning)
# ============================================================================

run_sca_scan() {
  log_section "SCA Scan (Software Composition Analysis)"

  local audit_file="$OUTPUT_DIR/dependency-audit.json"
  local sca_critical=0
  local sca_high=0
  local sca_moderate=0
  local sca_low=0

  # Run pnpm audit
  log_info "Running pnpm audit..."
  pnpm audit --json > "$audit_file" 2>&1 || true

  if [ -f "$audit_file" ] && [ -s "$audit_file" ]; then
    # Try to parse as JSON
    if jq -e . "$audit_file" > /dev/null 2>&1; then
      sca_critical=$(jq -r '.metadata.vulnerabilities.critical // 0' "$audit_file" 2>/dev/null || echo "0")
      sca_high=$(jq -r '.metadata.vulnerabilities.high // 0' "$audit_file" 2>/dev/null || echo "0")
      sca_moderate=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$audit_file" 2>/dev/null || echo "0")
      sca_low=$(jq -r '.metadata.vulnerabilities.low // 0' "$audit_file" 2>/dev/null || echo "0")
    else
      verbose_log "Audit output is not valid JSON, parsing text output"
      # Parse text output
      if grep -q "found 0 vulnerabilities" "$audit_file" 2>/dev/null; then
        sca_critical=0
        sca_high=0
        sca_moderate=0
        sca_low=0
      fi
    fi
  fi

  # Update counters
  CRITICAL=$((CRITICAL + sca_critical))
  HIGH=$((HIGH + sca_high))
  MEDIUM=$((MEDIUM + sca_moderate))
  LOW=$((LOW + sca_low))

  # Report results
  echo ""
  echo -e "  ${BOLD}Dependency Vulnerabilities:${NC}"
  echo -e "  - Critical: ${RED}$sca_critical${NC}"
  echo -e "  - High:     ${YELLOW}$sca_high${NC}"
  echo -e "  - Moderate: ${CYAN}$sca_moderate${NC}"
  echo -e "  - Low:      ${GREEN}$sca_low${NC}"

  if [ "$sca_critical" -gt 0 ] || [ "$sca_high" -gt 0 ]; then
    log_error "Dependency scan found critical/high vulnerabilities"
    echo ""
    log_info "Run 'pnpm audit' for details"
    log_info "Run 'pnpm audit fix' to auto-fix where possible"
  elif [ "$sca_moderate" -gt 0 ]; then
    log_warning "Dependency scan found moderate vulnerabilities"
  else
    log_success "Dependency scan passed"
  fi
}

# ============================================================================
# Secrets Scan
# ============================================================================

run_secrets_scan() {
  log_section "Secrets Scan"

  local secrets_found=0
  local secrets_file="$OUTPUT_DIR/secrets-report.txt"

  > "$secrets_file"

  log_info "Scanning for hardcoded secrets..."

  # Define patterns to search for
  declare -a patterns=(
    'AKIA[0-9A-Z]{16}'                              # AWS Access Key
    'gh[pousr]_[A-Za-z0-9_]{36,}'                   # GitHub Token
    'sk_(live|test)_[0-9a-zA-Z]{24,}'              # Stripe Secret Key
    'xox[baprs]-[0-9A-Za-z-]+'                      # Slack Token
    'ya29\.[0-9A-Za-z_-]+'                          # Google OAuth
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'   # Private Key
  )

  for pattern in "${patterns[@]}"; do
    if grep -rEn "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | grep -v ".spec." | grep -v "__mocks__" | grep -v "fixtures"; then
      echo "Pattern: $pattern" >> "$secrets_file"
      grep -rEn "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" 2>/dev/null | grep -v "node_modules" | grep -v ".test." >> "$secrets_file" 2>&1 || true
      ((secrets_found++)) || true
    fi
  done

  # Check for common secret variable names with hardcoded values
  log_info "Scanning for hardcoded credentials..."
  if grep -rEn "(password|secret|api[_-]?key|auth[_-]?token)\s*[:=]\s*['\"][^'\"]{8,}['\"]" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | grep -v ".spec." | grep -v "__mocks__" | grep -v "example" | grep -v "placeholder"; then
    echo "Hardcoded credentials found:" >> "$secrets_file"
    grep -rEn "(password|secret|api[_-]?key|auth[_-]?token)\s*[:=]\s*['\"][^'\"]{8,}['\"]" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".test." >> "$secrets_file" 2>&1 || true
    ((secrets_found++)) || true
  fi

  # Check .env files are not committed
  log_info "Checking for committed .env files..."
  if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.production" ]; then
    if ! git check-ignore .env .env.local .env.production > /dev/null 2>&1; then
      log_warning ".env files may not be properly gitignored"
      ((secrets_found++)) || true
    fi
  fi

  # Report results
  echo ""
  if [ "$secrets_found" -gt 0 ]; then
    log_error "Found $secrets_found potential secret patterns"
    echo ""
    log_info "Review: $secrets_file"
    CRITICAL=$((CRITICAL + secrets_found))
  else
    log_success "No hardcoded secrets detected"
  fi
}

# ============================================================================
# License Compliance
# ============================================================================

run_license_check() {
  log_section "License Compliance Check"

  local license_file="$OUTPUT_DIR/license-report.txt"
  local restricted_found=false

  # Allowed licenses (permissive)
  ALLOWED="MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;CC-BY-3.0;CC-BY-4.0;0BSD;Unlicense;Python-2.0;Zlib;WTFPL;BlueOak-1.0.0"

  log_info "Checking dependency licenses..."

  if npx license-checker --production --onlyAllow "$ALLOWED" --summary > "$license_file" 2>&1; then
    log_success "All licenses are compliant"
  else
    restricted_found=true
    log_warning "Some dependencies have restricted or unknown licenses"
  fi

  # Show license summary
  if [ "$VERBOSE" = true ]; then
    echo ""
    echo -e "  ${BOLD}License Summary:${NC}"
    npx license-checker --production --summary 2>/dev/null | head -20
  fi

  if [ "$restricted_found" = true ]; then
    echo ""
    log_info "Review: $license_file"
    WARNINGS=$((WARNINGS + 1))
  fi
}

# ============================================================================
# Generate Report
# ============================================================================

generate_report() {
  log_section "Security Scan Summary"

  local report_file="$OUTPUT_DIR/security-summary.md"

  cat > "$report_file" << EOF
# Security Scan Report

Generated: $(date -u)

## Summary

| Severity | Count |
|----------|-------|
| Critical | $CRITICAL |
| High | $HIGH |
| Medium | $MEDIUM |
| Low | $LOW |

## Scan Results

| Check | Status |
|-------|--------|
| SAST Scan | $([ "$FAILED" -eq 0 ] && echo "Passed" || echo "Issues Found") |
| Dependency Scan | $([ "$HIGH" -eq 0 ] && [ "$CRITICAL" -eq 0 ] && echo "Passed" || echo "Vulnerabilities Found") |
| Secrets Scan | $([ "$CRITICAL" -eq 0 ] && echo "Passed" || echo "Secrets Detected") |
| License Check | $([ "$WARNINGS" -eq 0 ] && echo "Passed" || echo "Review Required") |

## Remediation

EOF

  if [ "$CRITICAL" -gt 0 ]; then
    echo "### Critical Issues" >> "$report_file"
    echo "" >> "$report_file"
    echo "These must be fixed before deployment:" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. Review SAST findings in \`$OUTPUT_DIR/sast-report.json\`" >> "$report_file"
    echo "2. Run \`pnpm audit fix\` to fix dependency vulnerabilities" >> "$report_file"
    echo "3. Remove any hardcoded secrets from the codebase" >> "$report_file"
    echo "" >> "$report_file"
  fi

  if [ "$HIGH" -gt 0 ]; then
    echo "### High Severity Issues" >> "$report_file"
    echo "" >> "$report_file"
    echo "These should be addressed soon:" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. Review dependency audit results" >> "$report_file"
    echo "2. Check for updates to vulnerable packages" >> "$report_file"
    echo "" >> "$report_file"
  fi

  # Print summary to console
  echo -e "  ${BOLD}Overall Results:${NC}"
  echo -e "  - Critical: ${RED}$CRITICAL${NC}"
  echo -e "  - High:     ${YELLOW}$HIGH${NC}"
  echo -e "  - Medium:   ${CYAN}$MEDIUM${NC}"
  echo -e "  - Low:      ${GREEN}$LOW${NC}"
  echo ""
  echo -e "  ${BOLD}Check Summary:${NC}"
  echo -e "  - Passed:   ${GREEN}$PASSED${NC}"
  echo -e "  - Warnings: ${YELLOW}$WARNINGS${NC}"
  echo -e "  - Failed:   ${RED}$FAILED${NC}"
  echo ""
  log_info "Full report: $report_file"
  echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
  echo ""
  echo -e "${BOLD}${BLUE}========================================"
  echo "  nself-chat Security Scanner"
  echo "========================================${NC}"
  echo ""

  setup

  # Run selected scans
  case $SCAN_TYPE in
    all)
      run_sast_scan
      run_sca_scan
      run_secrets_scan
      run_license_check
      ;;
    sast)
      run_sast_scan
      ;;
    sca)
      run_sca_scan
      ;;
    secrets)
      run_secrets_scan
      ;;
    license)
      run_license_check
      ;;
    *)
      log_error "Unknown scan type: $SCAN_TYPE"
      exit 1
      ;;
  esac

  generate_report

  # Determine exit code
  EXIT_CODE=0

  if [ "$FAIL_ON_CRITICAL" = true ] && [ "$CRITICAL" -gt 0 ]; then
    echo -e "${RED}${BOLD}BLOCKED: Critical vulnerabilities found${NC}"
    EXIT_CODE=1
  elif [ "$FAIL_ON_HIGH" = true ] && [ "$HIGH" -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}BLOCKED: High severity vulnerabilities found${NC}"
    EXIT_CODE=1
  elif [ "$MEDIUM" -gt 0 ] || [ "$LOW" -gt 0 ]; then
    echo -e "${CYAN}${BOLD}PASSED with warnings${NC}"
  else
    echo -e "${GREEN}${BOLD}PASSED: No security issues found${NC}"
  fi

  echo ""
  exit $EXIT_CODE
}

main "$@"
