#!/bin/bash

# ɳChat Pre-Deployment Verification Script
# Runs all quality checks before deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
  echo ""
  echo "=================================="
  echo "$1"
  echo "=================================="
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
  ((WARNINGS++))
}

print_info() {
  echo "ℹ $1"
}

# Start checks
clear
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        ɳChat Pre-Deployment Verification v0.3.0         ║"
echo "╚══════════════════════════════════════════════════════════╝"

# 1. Environment Check
print_header "1. Environment Verification"

if [ -f ".env.production" ]; then
  print_success "Production environment file exists"
else
  print_error "Missing .env.production file"
fi

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_success "Node.js installed: $NODE_VERSION"

  # Check version is 20+
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
  if [ "$MAJOR_VERSION" -ge 20 ]; then
    print_success "Node.js version meets requirement (>=20)"
  else
    print_error "Node.js version too old (found $NODE_VERSION, need >=20)"
  fi
else
  print_error "Node.js not installed"
fi

if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  print_success "pnpm installed: $PNPM_VERSION"
else
  print_error "pnpm not installed"
fi

# 2. Dependencies Check
print_header "2. Dependencies Verification"

print_info "Checking for missing dependencies..."
if pnpm install --frozen-lockfile --ignore-scripts 2>&1 | grep -q "No changes"; then
  print_success "All dependencies installed and up to date"
else
  print_warning "Dependencies may need updating"
fi

# 3. TypeScript Check
print_header "3. TypeScript Type Check"

print_info "Running TypeScript compiler..."
if pnpm type-check > /tmp/typecheck.log 2>&1; then
  print_success "TypeScript type check passed (0 errors)"
else
  ERROR_COUNT=$(grep -c "error TS" /tmp/typecheck.log || echo "0")
  print_error "TypeScript has $ERROR_COUNT errors"
  echo "Run 'pnpm type-check' to see details"
fi

# 4. Linting Check
print_header "4. Code Linting"

print_info "Running ESLint..."
if pnpm lint > /tmp/lint.log 2>&1; then
  print_success "ESLint passed with no errors"
else
  WARNING_COUNT=$(grep -c "warning" /tmp/lint.log || echo "0")
  ERROR_COUNT=$(grep -c "error" /tmp/lint.log || echo "0")

  if [ "$ERROR_COUNT" -gt 0 ]; then
    print_error "ESLint found $ERROR_COUNT errors"
  else
    print_warning "ESLint found $WARNING_COUNT warnings"
  fi
fi

# 5. Formatting Check
print_header "5. Code Formatting"

print_info "Checking Prettier formatting..."
if pnpm format:check > /tmp/format.log 2>&1; then
  print_success "All files properly formatted"
else
  UNFORMATTED=$(grep -c "Code style issues" /tmp/format.log || echo "0")
  print_warning "Found unformatted files"
  echo "Run 'pnpm format' to fix formatting"
fi

# 6. Test Suite
print_header "6. Test Suite"

print_info "Running test suite..."
if timeout 120 pnpm test --passWithNoTests > /tmp/test.log 2>&1; then
  TEST_COUNT=$(grep -oP "Tests:\s+\K\d+ passed" /tmp/test.log | awk '{print $1}' || echo "0")
  print_success "All tests passed ($TEST_COUNT tests)"
else
  print_error "Tests failed or timed out"
  echo "Run 'pnpm test' to see details"
fi

# 7. Production Build
print_header "7. Production Build"

print_info "Building production bundle..."
export NEXT_PUBLIC_USE_DEV_AUTH=false
export NEXT_PUBLIC_ENV=production

if timeout 300 pnpm build > /tmp/build.log 2>&1; then
  print_success "Production build succeeded"

  # Check bundle size
  if [ -f ".next/BUILD_ID" ]; then
    BUILD_SIZE=$(du -sh .next | awk '{print $1}')
    print_info "Build size: $BUILD_SIZE"

    # Check for shared baseline
    if grep -q "First Load JS shared by all" /tmp/build.log; then
      SHARED_SIZE=$(grep "First Load JS shared by all" /tmp/build.log | awk '{print $5}')
      if [ -n "$SHARED_SIZE" ]; then
        print_info "Shared JS baseline: $SHARED_SIZE"

        # Extract number from size (e.g., "103" from "103 KB")
        SIZE_NUM=$(echo $SHARED_SIZE | grep -oP '^\d+')
        if [ "$SIZE_NUM" -lt 200 ]; then
          print_success "Bundle size within limits (<200 KB)"
        else
          print_warning "Bundle size is large (${SHARED_SIZE})"
        fi
      fi
    fi
  fi
else
  print_error "Production build failed"
  echo "Run 'pnpm build' to see details"
fi

# 8. Security Check
print_header "8. Security Audit"

print_info "Checking for security vulnerabilities..."
if pnpm audit --production --audit-level=high > /tmp/audit.log 2>&1; then
  print_success "No high-severity vulnerabilities found"
else
  VULN_COUNT=$(grep -c "high severity" /tmp/audit.log || echo "0")
  if [ "$VULN_COUNT" -gt 0 ]; then
    print_error "Found $VULN_COUNT high-severity vulnerabilities"
    echo "Run 'pnpm audit' to see details"
  else
    print_warning "Some moderate vulnerabilities found"
  fi
fi

# 9. Documentation Check
print_header "9. Documentation"

DOCS=(
  "README.md"
  "CHANGELOG.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "API.md"
  "DEPLOYMENT.md"
  "PRODUCTION-CHECKLIST.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    print_success "$doc exists"
  else
    print_warning "$doc missing"
  fi
done

# 10. Git Status
print_header "10. Git Status"

if git diff --quiet && git diff --cached --quiet; then
  print_success "No uncommitted changes"
else
  print_warning "There are uncommitted changes"
  git status --short
fi

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "main" ]; then
  print_success "On main branch"
else
  print_warning "Not on main branch (currently on: $CURRENT_BRANCH)"
fi

# Summary
print_header "Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))
echo ""
echo "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo "╔══════════════════════════════════════════════════════════╗"
    echo -e "║  ${GREEN}✓ ALL CHECKS PASSED - READY FOR DEPLOYMENT${NC}          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 0
  else
    echo "╔══════════════════════════════════════════════════════════╗"
    echo -e "║  ${YELLOW}⚠ PASSED WITH WARNINGS - REVIEW BEFORE DEPLOY${NC}       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 0
  fi
else
  echo "╔══════════════════════════════════════════════════════════╗"
  echo -e "║  ${RED}✗ CHECKS FAILED - DO NOT DEPLOY${NC}                     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  exit 1
fi
