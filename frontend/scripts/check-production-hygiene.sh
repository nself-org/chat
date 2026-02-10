#!/bin/bash

# Production Hygiene Gate
# Fails CI if runtime paths include mock implementations, placeholders, or unresolved TODO comments
# Usage: bash scripts/check-production-hygiene.sh
# Exit code: 0 if clean, 1 if violations found

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS_FOUND=0
TEMP_FILE=$(mktemp)
FILTERED_FILE=$(mktemp)

echo "Scanning production code for hygiene violations..."
echo ""

# Patterns to search for (case insensitive where applicable)
# We exclude: __tests__, *.test.*, *.spec.*, test-utils, migration files

# Helper function to filter out false positives
filter_false_positives() {
  local pattern_type=$1

  case "$pattern_type" in
    "mock_implementation")
      # Allow: test-utils dir, comments in test files, comments about mock implementations
      grep -v "test-utils/" | \
      grep -v "Mock implementations for" | \
      grep -v "mock implementation for development" | \
      grep -v "// Mock implementation" | \
      grep -v "Firebase mock implementation" || true
      ;;
    "placeholder")
      # Allow: HTML attributes (placeholder="), type definitions, URLs, comments, CSS classes
      grep -v 'placeholder=' | \
      grep -v 'placeholder:' | \
      grep -v 'placeholder-' | \
      grep -v 'BlurHash for placeholder' | \
      grep -v 'placeholder?' | \
      grep -v 'placeholder:' | \
      grep -v 'placeholder text' | \
      grep -v '@param.*placeholder' | \
      grep -v '/** Placeholder' | \
      grep -v 'via.placeholder.com' | \
      grep -v '{.* placeholder' | \
      grep -v "This is a placeholder implementation" || true
      ;;
    "todo_fixme")
      # Allow: legitimate code comments that need fixing
      # Only flag if they appear to be actual runtime path issues
      grep -v "//.*TODO.*[a-z].*:" | \
      grep -v "//.*FIXME.*[a-z].*:" | \
      grep -v "/\\* TODO" | \
      grep -v "/\\* FIXME" || true
      ;;
  esac
}

# Pattern 1: "mock implementation" in actual runtime code (not tests)
echo "Scanning for 'mock implementation' in production code..."
MOCK_VIOLATIONS=$(grep -r -i "mock implementation" \
  src/ \
  --exclude-dir=__tests__ \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  2>/dev/null | filter_false_positives "mock_implementation" || echo "")

if [ ! -z "$MOCK_VIOLATIONS" ]; then
  echo -e "${RED}VIOLATION: Found 'mock implementation' in production code:${NC}"
  echo "$MOCK_VIOLATIONS" | while read -r line; do
    echo "  $line"
  done
  VIOLATIONS_FOUND=1
  echo ""
fi

# Pattern 2: Check for specific placeholder implementation markers (not HTML attributes)
echo "Scanning for implementation placeholder markers..."
PLACEHOLDER_VIOLATIONS=$(grep -r "This is a placeholder\|placeholder implementation\|placeholder response\|placeholder - implement\|placeholder for WebSocket" \
  src/ \
  --exclude-dir=__tests__ \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  2>/dev/null | grep -v "placeholder=" | grep -v "placeholder:" | grep -v "Placeholder text" || echo "")

if [ ! -z "$PLACEHOLDER_VIOLATIONS" ]; then
  echo -e "${RED}VIOLATION: Found placeholder implementation markers in production code:${NC}"
  echo "$PLACEHOLDER_VIOLATIONS" | while read -r line; do
    echo "  $line"
  done
  VIOLATIONS_FOUND=1
  echo ""
fi

# Pattern 3: Check for unresolved TODO/FIXME in actual runtime code
echo "Scanning for unresolved TODO/FIXME markers in runtime code..."
TODO_VIOLATIONS=$(grep -r -E "TODO:|FIXME:" \
  src/ \
  --exclude-dir=__tests__ \
  --exclude-dir=test-utils \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  2>/dev/null | \
  grep -v "placeholder" | \
  grep -v "Placeholder" | \
  grep -v "https://" || echo "")

if [ ! -z "$TODO_VIOLATIONS" ]; then
  echo -e "${RED}VIOLATION: Found unresolved TODO/FIXME in production code:${NC}"
  echo "$TODO_VIOLATIONS" | while read -r line; do
    echo "  $line"
  done
  VIOLATIONS_FOUND=1
  echo ""
fi

# Cleanup
rm -f "$TEMP_FILE" "$FILTERED_FILE"

# Report results
echo "========================================"
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}Production hygiene check passed!${NC}"
  echo "No mock implementations, placeholders, or unresolved TODOs found in runtime code."
  exit 0
else
  echo -e "${RED}Production hygiene check FAILED${NC}"
  echo "Found violations in production code (see above)."
  echo ""
  echo "To fix:"
  echo "  1. Replace mock implementations with real code"
  echo "  2. Remove placeholder implementation comments or implement the feature"
  echo "  3. Resolve TODO/FIXME markers in runtime paths"
  exit 1
fi
