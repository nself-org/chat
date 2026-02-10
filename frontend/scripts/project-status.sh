#!/bin/bash

# ɳChat Project Status Script
# Quick overview of project metrics and health

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             ɳChat Project Status Report                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Version
echo -e "${CYAN}📦 Version${NC}"
VERSION=$(node -p "require('./package.json').version")
echo "  Current: v$VERSION"
echo ""

# Git Status
echo -e "${CYAN}🔀 Git Status${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "  Branch: $BRANCH"

COMMIT=$(git rev-parse --short HEAD)
echo "  Commit: $COMMIT"

COMMITS_AHEAD=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "0")
COMMITS_BEHIND=$(git rev-list --count HEAD..@{upstream} 2>/dev/null || echo "0")
echo "  Commits ahead: $COMMITS_AHEAD"
echo "  Commits behind: $COMMITS_BEHIND"

UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -eq 0 ]; then
  echo -e "  ${GREEN}Working directory clean${NC}"
else
  echo -e "  ${YELLOW}$UNCOMMITTED uncommitted changes${NC}"
fi
echo ""

# File Statistics
echo -e "${CYAN}📂 Codebase Statistics${NC}"
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "  TypeScript files: $TS_FILES"

TEST_FILES=$(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "  Test files: $TEST_FILES"

E2E_FILES=$(find e2e -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "  E2E test files: $E2E_FILES"

COMPONENT_FILES=$(find src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "  Component files: $COMPONENT_FILES"

echo ""

# Lines of Code
echo -e "${CYAN}📊 Lines of Code${NC}"
if command -v cloc &> /dev/null; then
  cloc src --quiet --csv | tail -1 | awk -F',' '{print "  Total: " $5 " lines"}'
else
  SRC_LINES=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
  echo "  Approximate: $SRC_LINES lines"
fi
echo ""

# Dependencies
echo -e "${CYAN}📦 Dependencies${NC}"
DEPS=$(node -p "Object.keys(require('./package.json').dependencies || {}).length")
DEV_DEPS=$(node -p "Object.keys(require('./package.json').devDependencies || {}).length")
echo "  Production: $DEPS packages"
echo "  Development: $DEV_DEPS packages"
echo ""

# Node Modules Size
if [ -d "node_modules" ]; then
  NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | awk '{print $1}')
  echo "  node_modules: $NODE_MODULES_SIZE"
fi
echo ""

# Build Size
if [ -d ".next" ]; then
  echo -e "${CYAN}🏗️  Build Status${NC}"
  BUILD_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
  echo "  .next directory: $BUILD_SIZE"

  if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo -e "  ${GREEN}Last build: $BUILD_ID${NC}"
  fi
else
  echo -e "${YELLOW}⚠ No build found - run 'pnpm build'${NC}"
fi
echo ""

# Backend Status
if [ -d ".backend" ]; then
  echo -e "${CYAN}🔧 Backend Services${NC}"
  if command -v nself &> /dev/null; then
    cd .backend
    if nself status &> /dev/null; then
      echo -e "  ${GREEN}Services running${NC}"
      nself status | grep -E "Running|Stopped" | while read line; do
        echo "  $line"
      done
    else
      echo -e "  ${YELLOW}Services not running${NC}"
    fi
    cd ..
  else
    echo "  nself CLI not installed"
  fi
else
  echo -e "${YELLOW}⚠ No backend directory found${NC}"
fi
echo ""

# TypeScript Status
echo -e "${CYAN}🔍 Type Check${NC}"
if pnpm type-check > /tmp/typecheck.log 2>&1; then
  echo -e "  ${GREEN}✓ 0 TypeScript errors${NC}"
else
  ERROR_COUNT=$(grep -c "error TS" /tmp/typecheck.log || echo "0")
  echo -e "  ${YELLOW}✗ $ERROR_COUNT TypeScript errors${NC}"
fi
echo ""

# Test Status
echo -e "${CYAN}🧪 Test Status${NC}"
if [ -d "coverage" ]; then
  if command -v jq &> /dev/null && [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "unknown")
    echo "  Coverage: ${COVERAGE}%"
  fi
fi

# Count test files
TOTAL_TESTS=$(find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l | tr -d ' ')
echo "  Test files: $TOTAL_TESTS"
echo ""

# Documentation
echo -e "${CYAN}📚 Documentation${NC}"
DOCS=(
  "README.md"
  "CHANGELOG.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "API.md"
  "DEPLOYMENT.md"
  "FAQ.md"
  "UPGRADE-GUIDE.md"
  "PRODUCTION-CHECKLIST.md"
)

DOC_COUNT=0
for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    ((DOC_COUNT++))
  fi
done

echo "  Documentation files: $DOC_COUNT/${#DOCS[@]}"
echo ""

# Recent Activity
echo -e "${CYAN}📅 Recent Activity${NC}"
LAST_COMMIT=$(git log -1 --format="%ar" 2>/dev/null || echo "unknown")
echo "  Last commit: $LAST_COMMIT"

LAST_COMMIT_MSG=$(git log -1 --format="%s" 2>/dev/null | cut -c1-60)
echo "  \"$LAST_COMMIT_MSG\""
echo ""

# Quick Health Check
echo -e "${CYAN}💊 Health Check${NC}"

HEALTH_SCORE=0
TOTAL_CHECKS=5

# Check 1: Clean working directory
if [ "$UNCOMMITTED" -eq 0 ]; then
  ((HEALTH_SCORE++))
  echo -e "  ${GREEN}✓${NC} Clean working directory"
else
  echo -e "  ${YELLOW}⚠${NC} Uncommitted changes"
fi

# Check 2: TypeScript passes
if pnpm type-check > /dev/null 2>&1; then
  ((HEALTH_SCORE++))
  echo -e "  ${GREEN}✓${NC} TypeScript check passes"
else
  echo -e "  ${YELLOW}✗${NC} TypeScript errors present"
fi

# Check 3: Build exists
if [ -d ".next" ]; then
  ((HEALTH_SCORE++))
  echo -e "  ${GREEN}✓${NC} Production build exists"
else
  echo -e "  ${YELLOW}⚠${NC} No production build"
fi

# Check 4: Dependencies installed
if [ -d "node_modules" ]; then
  ((HEALTH_SCORE++))
  echo -e "  ${GREEN}✓${NC} Dependencies installed"
else
  echo -e "  ${YELLOW}✗${NC} Dependencies not installed"
fi

# Check 5: Required docs exist
if [ $DOC_COUNT -ge 7 ]; then
  ((HEALTH_SCORE++))
  echo -e "  ${GREEN}✓${NC} Documentation complete"
else
  echo -e "  ${YELLOW}⚠${NC} Missing documentation"
fi

echo ""
HEALTH_PERCENT=$((HEALTH_SCORE * 100 / TOTAL_CHECKS))
if [ $HEALTH_PERCENT -ge 80 ]; then
  echo -e "  ${GREEN}Project Health: $HEALTH_PERCENT% ($HEALTH_SCORE/$TOTAL_CHECKS checks passed)${NC}"
elif [ $HEALTH_PERCENT -ge 60 ]; then
  echo -e "  ${YELLOW}Project Health: $HEALTH_PERCENT% ($HEALTH_SCORE/$TOTAL_CHECKS checks passed)${NC}"
else
  echo -e "  ${YELLOW}Project Health: $HEALTH_PERCENT% ($HEALTH_SCORE/$TOTAL_CHECKS checks passed)${NC}"
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "For detailed checks, run: ./scripts/pre-deploy-check.sh"
echo "══════════════════════════════════════════════════════════"
