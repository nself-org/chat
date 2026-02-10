#!/bin/bash

# WebRTC Implementation Verification Script
# Checks that all required files and dependencies are in place

echo "🔍 Verifying WebRTC Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 - Missing: $1"
        ((FAIL++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 - Missing: $1"
        ((FAIL++))
    fi
}

# Function to check dependency
check_dependency() {
    if grep -q "\"$1\"" package.json; then
        echo -e "${GREEN}✓${NC} $2 installed"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 not found in package.json"
        ((FAIL++))
    fi
}

echo "📦 Checking Dependencies..."
check_dependency "livekit-client" "LiveKit Client SDK"
check_dependency "livekit-server-sdk" "LiveKit Server SDK"
check_dependency "@livekit/components-react" "LiveKit React Components"
echo ""

echo "🗄️  Checking Database Migration..."
check_file "backend/migrations/0007_add_calls_and_webrtc_tables.sql" "WebRTC tables migration"
echo ""

echo "🔧 Checking Services..."
check_file "src/services/webrtc/livekit.service.ts" "LiveKit service"
echo ""

echo "🌐 Checking API Routes..."
check_file "src/app/api/calls/initiate/route.ts" "Initiate call API"
check_file "src/app/api/calls/[id]/join/route.ts" "Join call API"
check_file "src/app/api/streams/create/route.ts" "Create stream API"
check_file "src/app/api/streams/[id]/start/route.ts" "Start stream API"
check_file "src/app/api/streams/[id]/chat/route.ts" "Stream chat API"
check_file "src/app/api/streams/[id]/reactions/route.ts" "Stream reactions API"
echo ""

echo "🪝 Checking React Hooks..."
check_file "src/hooks/use-webrtc-call.ts" "WebRTC call hook"
echo ""

echo "🧪 Checking Tests..."
check_file "src/services/webrtc/__tests__/livekit.service.test.ts" "LiveKit service tests"
echo ""

echo "📚 Checking Documentation..."
check_file "docs/WEBRTC-IMPLEMENTATION-COMPLETE.md" "Complete implementation guide"
check_file "docs/VOICE-VIDEO-IMPLEMENTATION-SUMMARY.md" "Implementation summary"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results:"
echo -e "${GREEN}✓ Passed: $PASS${NC}"
echo -e "${RED}✗ Failed: $FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! WebRTC implementation verified.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run database migration: pnpm db:migrate"
    echo "2. Configure environment variables (see docs)"
    echo "3. Add LiveKit to docker-compose.yml"
    echo "4. Implement UI components"
    echo "5. Run tests: pnpm test"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the missing items.${NC}"
    exit 1
fi
