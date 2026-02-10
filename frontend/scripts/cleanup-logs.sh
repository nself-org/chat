#!/bin/bash
#
# Console Log Cleanup Script
# Removes debug console.log/debug statements from production code
#

set -e

SRC_DIR="/Users/admin/Sites/nself-chat/src"
COUNT_REMOVED=0
FILES_PROCESSED=0

echo "==================================================================="
echo "Console Log Cleanup for nchat v0.9.1"
echo "==================================================================="
echo ""

# Find all TypeScript files (excluding tests and examples)
FILES=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) \
  | grep -v "node_modules" \
  | grep -v "__tests__" \
  | grep -v ".test.ts" \
  | grep -v ".spec.ts" \
  | grep -v "examples/" \
  | grep -v ".example.ts")

echo "Processing files..."
echo ""

while IFS= read -r file; do
  # Count console.log and console.debug before
  BEFORE=$(grep -o "console\.\(log\|debug\)" "$file" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$BEFORE" -gt 0 ]; then
    # Comment out console.log and console.debug
    sed -i '' 's/^\(\s*\)console\.log(/\1\/\/ console.log(/g' "$file"
    sed -i '' 's/^\(\s*\)console\.debug(/\1\/\/ console.debug(/g' "$file"

    # Remove standalone commented console.log lines that are already dead code
    sed -i '' '/^[[:space:]]*\/\/ console\.\(log\|debug\)/d' "$file"

    AFTER=$(grep -o "console\.\(log\|debug\)" "$file" 2>/dev/null | wc -l | tr -d ' ')
    REMOVED=$((BEFORE - AFTER))

    if [ "$REMOVED" -gt 0 ]; then
      echo "✓ $(basename "$file"): removed $REMOVED debug statements"
      COUNT_REMOVED=$((COUNT_REMOVED + REMOVED))
      FILES_PROCESSED=$((FILES_PROCESSED + 1))
    fi
  fi
done < <(echo "$FILES")

echo ""
echo "==================================================================="
echo "Summary:"
echo "  Files processed: $FILES_PROCESSED"
echo "  Debug statements removed: $COUNT_REMOVED"
echo "==================================================================="
echo ""
echo "✅ Console.log cleanup complete!"
echo ""
echo "Next: Review console.error/warn and replace with logger where appropriate."
