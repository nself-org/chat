#!/usr/bin/env bash
#
# Generate changelog from commits using conventional commits
# Supports semantic versioning and categorization
# Usage: ./scripts/generate-changelog.sh <version>
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo ""
    echo "Example: $0 0.8.0"
    exit 1
fi

VERSION="$1"
DATE=$(date +%Y-%m-%d)

cd "$PROJECT_ROOT"

# Get previous tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
    log_info "Generating changelog from $LAST_TAG to HEAD"
    COMMITS=$(git log "${LAST_TAG}..HEAD" --pretty=format:"%s|%h|%an" --no-merges)
else
    log_warning "No previous tag found, using last 50 commits"
    COMMITS=$(git log --pretty=format:"%s|%h|%an" --no-merges -50)
fi

# Initialize arrays for categorized commits
declare -a BREAKING_CHANGES
declare -a FEATURES
declare -a FIXES
declare -a IMPROVEMENTS
declare -a PERFORMANCE
declare -a SECURITY
declare -a DOCS
declare -a TESTS
declare -a CHORES
declare -a REFACTORS
declare -a STYLES
declare -a BUILD
declare -a CI
declare -a DEPRECATIONS
declare -a REMOVALS

# Parse commits
while IFS='|' read -r message hash author; do
    # Extract breaking change marker
    if [[ "$message" =~ BREAKING[[:space:]]CHANGE ]]; then
        BREAKING_CHANGES+=("$message ($hash by $author)")
        continue
    fi

    # Categorize by conventional commit type
    case "$message" in
        feat:*|feat\(*|feature:*|feature\(*)
            FEATURES+=("${message#*: } ($hash)")
            ;;
        fix:*|fix\(*|bugfix:*|bugfix\(*)
            FIXES+=("${message#*: } ($hash)")
            ;;
        perf:*|perf\(*|performance:*|performance\(*)
            PERFORMANCE+=("${message#*: } ($hash)")
            ;;
        security:*|security\(*|sec:*|sec\(*)
            SECURITY+=("${message#*: } ($hash)")
            ;;
        docs:*|docs\(*|doc:*|doc\(*)
            DOCS+=("${message#*: } ($hash)")
            ;;
        test:*|test\(*|tests:*|tests\(*)
            TESTS+=("${message#*: } ($hash)")
            ;;
        refactor:*|refactor\(*)
            REFACTORS+=("${message#*: } ($hash)")
            ;;
        style:*|style\(*)
            STYLES+=("${message#*: } ($hash)")
            ;;
        build:*|build\(*)
            BUILD+=("${message#*: } ($hash)")
            ;;
        ci:*|ci\(*)
            CI+=("${message#*: } ($hash)")
            ;;
        chore:*|chore\(*)
            CHORES+=("${message#*: } ($hash)")
            ;;
        improve:*|improve\(*|improvement:*|improvement\(*)
            IMPROVEMENTS+=("${message#*: } ($hash)")
            ;;
        deprecate:*|deprecate\(*)
            DEPRECATIONS+=("${message#*: } ($hash)")
            ;;
        remove:*|remove\(*)
            REMOVALS+=("${message#*: } ($hash)")
            ;;
    esac
done <<< "$COMMITS"

# Generate changelog entry
CHANGELOG_ENTRY=$(cat <<EOF
## [${VERSION}] - ${DATE}

EOF
)

# Add breaking changes section (highest priority)
if [ ${#BREAKING_CHANGES[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### ⚠️ BREAKING CHANGES

EOF
)
    for item in "${BREAKING_CHANGES[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add features section
if [ ${#FEATURES[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### ✨ Features

EOF
)
    for item in "${FEATURES[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add improvements section
if [ ${#IMPROVEMENTS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🚀 Improvements

EOF
)
    for item in "${IMPROVEMENTS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add bug fixes section
if [ ${#FIXES[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🐛 Bug Fixes

EOF
)
    for item in "${FIXES[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add performance section
if [ ${#PERFORMANCE[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### ⚡ Performance

EOF
)
    for item in "${PERFORMANCE[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add security section
if [ ${#SECURITY[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🔒 Security

EOF
)
    for item in "${SECURITY[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add deprecations section
if [ ${#DEPRECATIONS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 📛 Deprecated

EOF
)
    for item in "${DEPRECATIONS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add removals section
if [ ${#REMOVALS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🗑️ Removed

EOF
)
    for item in "${REMOVALS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add documentation section
if [ ${#DOCS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 📚 Documentation

EOF
)
    for item in "${DOCS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add refactors section
if [ ${#REFACTORS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### ♻️ Refactoring

EOF
)
    for item in "${REFACTORS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add tests section
if [ ${#TESTS[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🧪 Tests

EOF
)
    for item in "${TESTS[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add build section
if [ ${#BUILD[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 🔨 Build

EOF
)
    for item in "${BUILD[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Add CI section
if [ ${#CI[@]} -gt 0 ]; then
    CHANGELOG_ENTRY+=$(cat <<EOF
### 👷 CI/CD

EOF
)
    for item in "${CI[@]}"; do
        CHANGELOG_ENTRY+=$(echo -e "- $item\n")
    done
    CHANGELOG_ENTRY+=$(echo -e "\n")
fi

# Create or update CHANGELOG.md
if [ -f "CHANGELOG.md" ]; then
    # Read existing content, skipping the header
    EXISTING_CONTENT=$(tail -n +4 CHANGELOG.md 2>/dev/null || cat CHANGELOG.md)

    cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to nself-chat (nchat) are documented in this file.

${CHANGELOG_ENTRY}
${EXISTING_CONTENT}
EOF
else
    cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to nself-chat (nchat) are documented in this file.

${CHANGELOG_ENTRY}
EOF
fi

log_success "CHANGELOG.md updated for v${VERSION}"
log_info "Changelog entry:"
echo ""
echo "$CHANGELOG_ENTRY"
