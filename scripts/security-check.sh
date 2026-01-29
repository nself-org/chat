#!/bin/bash

# ============================================================================
# Security Check Script for nself-chat
# ============================================================================
# Runs various security checks before deployment
# ============================================================================

set -e

echo "🔐 Security Check Script for nself-chat"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# ============================================================================
# Helper Functions
# ============================================================================

pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# ============================================================================
# 1. Dependency Vulnerabilities
# ============================================================================

echo "1. Checking for dependency vulnerabilities..."
echo "============================================="

if npm audit --audit-level=high 2>/dev/null; then
  pass "No high/critical vulnerabilities found"
else
  fail "Vulnerabilities found - run 'npm audit fix' to resolve"
fi

echo ""

# ============================================================================
# 2. Environment Configuration
# ============================================================================

echo "2. Checking environment configuration..."
echo "=========================================="

# Check if production env file exists
if [ ! -f ".env.production" ] && [ "$NODE_ENV" = "production" ]; then
  fail ".env.production file missing"
else
  pass ".env.production file exists"
fi

# Check for dev auth in production
if [ -f ".env.production" ]; then
  if grep -q "NEXT_PUBLIC_USE_DEV_AUTH=true" .env.production 2>/dev/null; then
    fail "Dev auth is enabled in production environment"
  else
    pass "Dev auth is properly disabled for production"
  fi
fi

# Check for default secrets
if [ -f ".env.production" ]; then
  if grep -q "dev-admin-secret\|dev-jwt-secret\|postgres\|minio123" .env.production 2>/dev/null; then
    fail "Default/weak secrets detected in production environment"
  else
    pass "No default secrets detected"
  fi
fi

echo ""

# ============================================================================
# 3. TypeScript Type Safety
# ============================================================================

echo "3. Checking TypeScript type safety..."
echo "======================================"

if pnpm type-check 2>/dev/null; then
  pass "No TypeScript errors"
else
  fail "TypeScript errors found - fix before deployment"
fi

echo ""

# ============================================================================
# 4. Security Headers
# ============================================================================

echo "4. Checking security headers configuration..."
echo "=============================================="

if grep -q "Content-Security-Policy" src/middleware.ts; then
  pass "CSP header configured"
else
  warn "CSP header not found in middleware"
fi

if grep -q "X-Frame-Options" src/middleware.ts; then
  pass "X-Frame-Options header configured"
else
  warn "X-Frame-Options header not configured"
fi

if grep -q "Strict-Transport-Security" src/middleware.ts; then
  pass "HSTS header configured"
else
  warn "HSTS header not configured"
fi

echo ""

# ============================================================================
# 5. Sensitive Files
# ============================================================================

echo "5. Checking for sensitive files..."
echo "==================================="

# Check if .env files are gitignored
if git check-ignore .env.local .env.production .env 2>/dev/null; then
  pass ".env files are properly gitignored"
else
  fail ".env files are NOT gitignored - add to .gitignore immediately"
fi

# Check if secrets are committed
if git log --all --full-history --source --find-object -- "*secret*" 2>/dev/null | grep -q "secret"; then
  warn "Potential secrets found in git history - consider using git-filter-repo to remove"
else
  pass "No obvious secrets found in git history"
fi

echo ""

# ============================================================================
# 6. Docker Security
# ============================================================================

echo "6. Checking Docker configuration..."
echo "====================================="

if [ -f "Dockerfile" ]; then
  # Check if running as non-root
  if grep -q "USER node\|USER [0-9]" Dockerfile; then
    pass "Dockerfile runs as non-root user"
  else
    fail "Dockerfile runs as root - add USER directive"
  fi

  # Check for multi-stage build
  if grep -q "FROM.*AS.*builder" Dockerfile; then
    pass "Multi-stage Docker build detected"
  else
    warn "Single-stage Docker build - consider multi-stage for smaller images"
  fi
else
  warn "Dockerfile not found"
fi

echo ""

# ============================================================================
# 7. Kubernetes Security
# ============================================================================

echo "7. Checking Kubernetes configuration..."
echo "========================================"

K8S_DIR="deploy/k8s"

if [ -d "$K8S_DIR" ]; then
  # Check for security context
  if grep -r "runAsNonRoot: true" "$K8S_DIR" 2>/dev/null; then
    pass "Kubernetes pods run as non-root"
  else
    warn "Kubernetes pods should specify runAsNonRoot: true"
  fi

  # Check for read-only filesystem
  if grep -r "readOnlyRootFilesystem: true" "$K8S_DIR" 2>/dev/null; then
    pass "Kubernetes pods use read-only filesystem"
  else
    warn "Consider setting readOnlyRootFilesystem: true for pods"
  fi
else
  warn "Kubernetes config directory not found"
fi

echo ""

# ============================================================================
# 8. SSL/TLS Configuration
# ============================================================================

echo "8. Checking SSL/TLS configuration..."
echo "====================================="

if grep -q "tls:" "$K8S_DIR"/*.yaml 2>/dev/null; then
  pass "TLS configuration found in Kubernetes"
else
  warn "TLS configuration not found - ensure HTTPS is enforced"
fi

echo ""

# ============================================================================
# 9. Input Validation
# ============================================================================

echo "9. Checking input validation..."
echo "================================"

if [ -f "src/lib/security/input-validation.ts" ]; then
  pass "Input validation module exists"
else
  warn "Input validation module not found"
fi

# Check for Zod usage
if grep -r "z\\.string()\|z\\.number()" src/app/api 2>/dev/null | wc -l | grep -q "[1-9]"; then
  pass "Zod validation detected in API routes"
else
  warn "Zod validation not detected in API routes"
fi

echo ""

# ============================================================================
# 10. Rate Limiting
# ============================================================================

echo "10. Checking rate limiting..."
echo "============================="

if [ -f "src/lib/security/rate-limiter.ts" ]; then
  pass "Rate limiter module exists"
else
  warn "Rate limiter module not found"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "========================================"
echo "Security Check Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}⚠ SECURITY ISSUES DETECTED${NC}"
  echo "Fix all failures before deploying to production."
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠ SECURITY WARNINGS${NC}"
  echo "Review warnings and address before production deployment."
  echo ""
  exit 0
else
  echo -e "${GREEN}✓ ALL SECURITY CHECKS PASSED${NC}"
  echo ""
  exit 0
fi
