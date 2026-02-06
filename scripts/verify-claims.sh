#!/bin/bash

# ɳChat v0.9.1 Claims Verification Script
# Phase 1 QA Audit
# Date: 2026-02-05

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ɳChat v0.9.1 - Phase 1 Claims Verification Script      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

print_pass() {
    echo -e "   ${GREEN}✓${NC} $1"
    ((PASS++))
}

print_fail() {
    echo -e "   ${RED}✗${NC} $1"
    ((FAIL++))
}

print_warn() {
    echo -e "   ${YELLOW}⚠${NC} $1"
    ((WARN++))
}

# 1. BACKEND VERIFICATION
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. BACKEND SERVICES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".backend" ]; then
    print_pass ".backend directory exists"

    if [ -f ".backend/docker-compose.yml" ]; then
        print_pass "docker-compose.yml exists"
    else
        print_fail "docker-compose.yml NOT FOUND"
    fi

    echo "   Checking backend status..."
    if cd .backend && nself status 2>&1 | grep -q "running\|healthy"; then
        print_pass "Backend services are running"
    else
        print_warn "Backend services may not be running (run: cd .backend && nself start)"
    fi
    cd ..
else
    print_fail ".backend directory NOT FOUND"
fi

# 2. SOURCE FILES VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. SOURCE FILES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TS_COUNT=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "   TypeScript files found: $TS_COUNT"
if [ "$TS_COUNT" -ge 2500 ]; then
    print_pass "Source file count matches claim (2,500+)"
elif [ "$TS_COUNT" -ge 2000 ]; then
    print_warn "Source file count lower than claimed (found: $TS_COUNT, claimed: 2,500+)"
else
    print_fail "Source file count MUCH lower than claimed (found: $TS_COUNT, claimed: 2,500+)"
fi

# 3. TESTS VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. TESTS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_COUNT=$(find src e2e -name "*.test.ts*" -o -name "*.spec.ts*" 2>/dev/null | wc -l | tr -d ' ')
echo "   Test files found: $TEST_COUNT"
if [ "$TEST_COUNT" -ge 250 ]; then
    print_pass "Test file count matches claim (250+)"
elif [ "$TEST_COUNT" -ge 200 ]; then
    print_warn "Test file count lower than claimed (found: $TEST_COUNT, claimed: 250+)"
else
    print_fail "Test file count MUCH lower than claimed (found: $TEST_COUNT, claimed: 250+)"
fi

# 4. API ROUTES VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. API ROUTES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "src/app/api" ]; then
    API_COUNT=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo "   API routes found: $API_COUNT"
    if [ "$API_COUNT" -ge 100 ]; then
        print_pass "API route count matches claim (100+)"
    elif [ "$API_COUNT" -ge 80 ]; then
        print_warn "API route count lower than claimed (found: $API_COUNT, claimed: 100+)"
    else
        print_fail "API route count MUCH lower than claimed (found: $API_COUNT, claimed: 100+)"
    fi
else
    print_fail "src/app/api directory NOT FOUND"
fi

# 5. DATABASE MIGRATIONS VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. DATABASE MIGRATIONS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MIGRATION_COUNT=0
if [ -d ".backend/migrations" ]; then
    MIGRATION_COUNT=$(ls .backend/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
elif [ -d "backend/migrations" ]; then
    MIGRATION_COUNT=$(ls backend/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
fi

echo "   Migration files found: $MIGRATION_COUNT"
if [ "$MIGRATION_COUNT" -ge 15 ]; then
    print_pass "Migration count matches claim (15-18)"
elif [ "$MIGRATION_COUNT" -ge 10 ]; then
    print_warn "Migration count lower than claimed (found: $MIGRATION_COUNT, claimed: 15-18)"
else
    print_fail "Migration count MUCH lower than claimed (found: $MIGRATION_COUNT, claimed: 15-18)"
fi

# 6. CRITICAL FEATURES VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CRITICAL FEATURES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# WebRTC/Voice/Video
if [ -d "src/lib/webrtc" ] || [ -d "src/services/voice" ] || [ -d "src/services/video" ]; then
    print_pass "Voice/Video implementation found"
    WEBRTC_FILES=$(find src -name "*webrtc*" -o -name "*call*" -o -name "*voice*" -o -name "*video*" 2>/dev/null | wc -l | tr -d ' ')
    echo "      → WebRTC-related files: $WEBRTC_FILES"
else
    print_fail "Voice/Video implementation NOT FOUND (claimed: 100% complete)"
fi

# E2EE/Encryption
if [ -d "src/lib/encryption" ] || [ -d "src/services/encryption" ]; then
    print_pass "E2EE implementation found"
    ENCRYPT_FILES=$(find src -name "*encrypt*" -o -name "*signal*" -o -name "*e2e*" 2>/dev/null | wc -l | tr -d ' ')
    echo "      → Encryption-related files: $ENCRYPT_FILES"
else
    print_fail "E2EE implementation NOT FOUND (claimed: 100% complete)"
fi

# Payments
if [ -d "src/lib/payments" ] || [ -d "src/services/payments" ]; then
    print_pass "Payments implementation found"
else
    print_warn "Payments implementation NOT FOUND (claimed: 100% complete)"
fi

# Realtime
if [ -d "src/services/realtime" ]; then
    print_pass "Realtime services found"
else
    print_warn "Realtime services NOT FOUND"
fi

# 7. DOCUMENTATION VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. DOCUMENTATION VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "docs" ]; then
    DOC_COUNT=$(find docs -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    echo "   Documentation files found: $DOC_COUNT"
    if [ "$DOC_COUNT" -ge 40 ]; then
        print_pass "Documentation count meets minimum claim (40+)"
    else
        print_warn "Documentation count lower than claimed (found: $DOC_COUNT, claimed: 40+)"
    fi
else
    print_fail "docs directory NOT FOUND"
fi

# 8. BUILD VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. BUILD VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   Attempting production build..."
if pnpm build 2>&1 | grep -q "Compiled successfully"; then
    print_pass "Production build succeeds"
elif pnpm build 2>&1 | grep -q "completed in"; then
    print_pass "Production build completes"
else
    print_fail "Production build FAILS (check: pnpm build)"
fi

# 9. TYPE CHECK VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. TYPE CHECK VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   Running TypeScript type check..."
if pnpm type-check 2>&1 | grep -q "Found 0 errors"; then
    print_pass "TypeScript type check passes (0 errors)"
else
    TS_ERRORS=$(pnpm type-check 2>&1 | grep "error TS" | wc -l | tr -d ' ')
    print_fail "TypeScript type check has errors (count: $TS_ERRORS)"
fi

# 10. RECENT COMMITS VERIFICATION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. RECENT COMMITS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   Recent commits (last 10):"
git log --oneline -10 | sed 's/^/      /'

COMMITS_SINCE_FEB3=$(git log --oneline --since="2026-02-03" | wc -l | tr -d ' ')
echo ""
echo "   Commits since 2026-02-03: $COMMITS_SINCE_FEB3"
if [ "$COMMITS_SINCE_FEB3" -ge 15 ]; then
    print_pass "Significant recent activity (15+ commits)"
elif [ "$COMMITS_SINCE_FEB3" -ge 5 ]; then
    print_warn "Some recent activity ($COMMITS_SINCE_FEB3 commits)"
else
    print_warn "Limited recent activity ($COMMITS_SINCE_FEB3 commits)"
fi

# SUMMARY
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION SUMMARY                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "   ${GREEN}Passed:${NC}  $PASS"
echo -e "   ${YELLOW}Warnings:${NC} $WARN"
echo -e "   ${RED}Failed:${NC}  $FAIL"
echo ""

TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo "   Overall Score: $SCORE%"
echo ""

if [ "$SCORE" -ge 80 ]; then
    echo -e "   ${GREEN}Status: GOOD - Most claims verified${NC}"
    exit 0
elif [ "$SCORE" -ge 60 ]; then
    echo -e "   ${YELLOW}Status: CONCERNING - Some claims unverified${NC}"
    exit 1
else
    echo -e "   ${RED}Status: CRITICAL - Major claims unverified${NC}"
    exit 2
fi
