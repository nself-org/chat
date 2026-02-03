#!/bin/bash

##
# Test Helper Script
# Provides utilities for managing test coverage
##

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Command: Run coverage
cmd_coverage() {
  print_header "Running Test Coverage"
  cd "$PROJECT_ROOT"

  pnpm test:coverage || true

  if [ -f "coverage/coverage-summary.json" ]; then
    print_success "Coverage report generated"

    # Run analysis if available
    if [ -f "$SCRIPT_DIR/analyze-coverage.js" ]; then
      node "$SCRIPT_DIR/analyze-coverage.js"
    fi
  else
    print_error "Coverage report not found"
  fi
}

# Command: Find missing tests
cmd_missing() {
  print_header "Finding Files Without Tests"
  cd "$PROJECT_ROOT"

  if [ -f "$SCRIPT_DIR/generate-missing-tests.js" ]; then
    node "$SCRIPT_DIR/generate-missing-tests.js" "$@"
  else
    print_error "generate-missing-tests.js not found"
    exit 1
  fi
}

# Command: Generate test stubs
cmd_generate() {
  print_header "Generating Test Stubs"
  cd "$PROJECT_ROOT"

  if [ -f "$SCRIPT_DIR/generate-missing-tests.js" ]; then
    node "$SCRIPT_DIR/generate-missing-tests.js" --generate "$@"
    print_success "Test stubs generated"
  else
    print_error "generate-missing-tests.js not found"
    exit 1
  fi
}

# Command: Run tests for a specific pattern
cmd_test() {
  print_header "Running Tests: $1"
  cd "$PROJECT_ROOT"

  pnpm test -- "$1" "${@:2}"
}

# Command: Watch tests
cmd_watch() {
  print_header "Watching Tests"
  cd "$PROJECT_ROOT"

  pnpm test:watch "$@"
}

# Command: Show coverage stats
cmd_stats() {
  print_header "Coverage Statistics"
  cd "$PROJECT_ROOT"

  if [ -f "coverage/coverage-summary.json" ]; then
    node "$SCRIPT_DIR/analyze-coverage.js"
  else
    print_warning "No coverage data found. Run: ./scripts/test-helper.sh coverage"
  fi
}

# Command: Quick test (no coverage)
cmd_quick() {
  print_header "Quick Test Run"
  cd "$PROJECT_ROOT"

  pnpm test -- --maxWorkers=50% --bail "$@"
}

# Command: Test single file
cmd_file() {
  if [ -z "$1" ]; then
    print_error "Usage: ./scripts/test-helper.sh file <path-to-test-file>"
    exit 1
  fi

  print_header "Testing File: $1"
  cd "$PROJECT_ROOT"

  pnpm test -- "$1" --no-coverage --verbose
}

# Command: Help
cmd_help() {
  cat << EOF

${BLUE}Test Helper Script${NC}

${YELLOW}Usage:${NC}
  ./scripts/test-helper.sh <command> [options]

${YELLOW}Commands:${NC}
  coverage              Run full test coverage and analysis
  missing               Find files without tests
  generate              Generate test stub files for uncovered code
  test <pattern>        Run tests matching pattern
  watch [pattern]       Watch tests
  stats                 Show coverage statistics
  quick [pattern]       Quick test run (no coverage)
  file <path>           Test a single file
  help                  Show this help message

${YELLOW}Examples:${NC}
  ${GREEN}./scripts/test-helper.sh coverage${NC}
      Run full coverage and analyze gaps

  ${GREEN}./scripts/test-helper.sh missing${NC}
      List all files without tests

  ${GREEN}./scripts/test-helper.sh generate${NC}
      Generate test stubs for all missing tests

  ${GREEN}./scripts/test-helper.sh test "components/ui"${NC}
      Run tests for UI components

  ${GREEN}./scripts/test-helper.sh file src/lib/utils.ts${NC}
      Test a specific file

  ${GREEN}./scripts/test-helper.sh watch "hooks"${NC}
      Watch hook tests

EOF
}

# Main command dispatcher
case "$1" in
  coverage)
    cmd_coverage "${@:2}"
    ;;
  missing)
    cmd_missing "${@:2}"
    ;;
  generate)
    cmd_generate "${@:2}"
    ;;
  test)
    cmd_test "${@:2}"
    ;;
  watch)
    cmd_watch "${@:2}"
    ;;
  stats)
    cmd_stats "${@:2}"
    ;;
  quick)
    cmd_quick "${@:2}"
    ;;
  file)
    cmd_file "${@:2}"
    ;;
  help|--help|-h|"")
    cmd_help
    ;;
  *)
    print_error "Unknown command: $1"
    cmd_help
    exit 1
    ;;
esac
