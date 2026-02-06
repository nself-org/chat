#!/bin/bash
LOG_FILE="$1"

echo "=== Test Results Summary ==="
echo ""
echo "Passing test suites:"
grep -c "^PASS " "$LOG_FILE" 2>/dev/null || echo "0"
echo ""
echo "Failing test suites:"
grep -c "^FAIL " "$LOG_FILE" 2>/dev/null || echo "0"
echo ""
echo "Total test suites:"
grep -cE "^(PASS|FAIL) " "$LOG_FILE" 2>/dev/null || echo "0"
