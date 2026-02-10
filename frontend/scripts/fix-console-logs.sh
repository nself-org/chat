#!/bin/bash
# =============================================================================
# Fix Console.log Statements
# =============================================================================
#
# This script helps identify console.log statements in the codebase
# and provides guidance for replacing them with the logger utility.
#
# Usage:
#   ./scripts/fix-console-logs.sh          # List all files with console.log
#   ./scripts/fix-console-logs.sh --count  # Count console.log statements
#   ./scripts/fix-console-logs.sh --help   # Show help
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# =============================================================================
# Functions
# =============================================================================

show_help() {
  cat <<EOF
${BLUE}Fix Console.log Statements${NC}

This script helps identify and replace console.log statements with the logger utility.

${YELLOW}Usage:${NC}
  $0 [OPTION]

${YELLOW}Options:${NC}
  --count         Count console.log statements by file
  --list          List all files with console.log (default)
  --help          Show this help message

${YELLOW}Examples:${NC}
  # List all files with console.log
  $0

  # Count console.log statements
  $0 --count

${YELLOW}Migration Guide:${NC}
  The logger utility is already available at: src/lib/logger/index.ts

  Replace console.log statements like this:

  ${RED}Before:${NC}
    console.log('User logged in', { userId: user.id });

  ${GREEN}After:${NC}
    import { logger } from '@/lib/logger';
    logger.info('User logged in', { userId: user.id });

  ${YELLOW}Log Levels:${NC}
    - logger.debug() - Detailed diagnostic info (only in dev)
    - logger.info()  - General informational messages
    - logger.warn()  - Potentially problematic situations
    - logger.error() - Error messages (auto-sent to Sentry in prod)

  ${YELLOW}Scoped Logger:${NC}
    import { createLogger } from '@/lib/logger';
    const log = createLogger({ component: 'AuthService' });
    log.info('Processing login');

EOF
}

count_console_logs() {
  echo -e "${BLUE}Counting console.log statements...${NC}\n"

  # Find all TypeScript files
  find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" | \
  while read -r file; do
    count=$(grep -c "console\.log" "$file" 2>/dev/null || echo 0)
    if [ "$count" -gt 0 ]; then
      relative_path=$(echo "$file" | sed "s|$PROJECT_ROOT/||")
      echo -e "${YELLOW}$count${NC} - $relative_path"
    fi
  done | sort -rn

  # Total count
  total=$(find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -exec grep -l "console\.log" {} \; 2>/dev/null | wc -l | tr -d ' ')

  echo -e "\n${BLUE}Total files with console.log:${NC} ${YELLOW}$total${NC}"
}

list_console_logs() {
  echo -e "${BLUE}Files with console.log statements:${NC}\n"

  # Find all files with console.log
  find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -exec grep -l "console\.log" {} \; 2>/dev/null | \
  while read -r file; do
    relative_path=$(echo "$file" | sed "s|$PROJECT_ROOT/||")
    echo "  - $relative_path"
  done

  echo -e "\n${YELLOW}Tip:${NC} Run with --count to see how many console.log per file"
  echo -e "${YELLOW}Tip:${NC} Run with --help to see migration guide"
}

# =============================================================================
# Main
# =============================================================================

case "${1:-}" in
  --help|-h)
    show_help
    exit 0
    ;;
  --count|-c)
    count_console_logs
    ;;
  --list|-l|"")
    list_console_logs
    ;;
  *)
    echo -e "${RED}Error: Unknown option '$1'${NC}"
    echo "Run '$0 --help' for usage information"
    exit 1
    ;;
esac
