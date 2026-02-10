#!/usr/bin/env bash
#
# Create a new release
# Usage: ./scripts/release.sh [--major|--minor|--patch] [--dry-run]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

BUMP_TYPE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        --patch)
            BUMP_TYPE="patch"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--major|--minor|--patch] [--dry-run]"
            echo ""
            echo "Options:"
            echo "  --major    Bump major version (x.0.0)"
            echo "  --minor    Bump minor version (0.x.0)"
            echo "  --patch    Bump patch version (0.0.x)"
            echo "  --dry-run  Preview changes without making them"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [ -z "$BUMP_TYPE" ]; then
    log_error "Please specify version bump type: --major, --minor, or --patch"
    exit 1
fi

cd "$PROJECT_ROOT"

# Check for clean working directory
if [ -n "$(git status --porcelain)" ]; then
    log_error "Working directory is not clean. Commit or stash changes first."
    exit 1
fi

# Check we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    log_warn "Not on main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

case $BUMP_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log_info "New version: $NEW_VERSION"

if $DRY_RUN; then
    log_warn "Dry run mode - no changes will be made"
    echo ""
    echo "Would perform the following actions:"
    echo "  1. Update package.json version to $NEW_VERSION"
    echo "  2. Update CHANGELOG.md"
    echo "  3. Create git commit: 'chore(release): v$NEW_VERSION'"
    echo "  4. Create git tag: v$NEW_VERSION"
    echo "  5. Push to origin"
    exit 0
fi

# Run tests
log_info "Running tests..."
pnpm test --ci || {
    log_error "Tests failed. Aborting release."
    exit 1
}

# Build
log_info "Building..."
pnpm build || {
    log_error "Build failed. Aborting release."
    exit 1
}

# Bump version
log_info "Bumping version..."
"$SCRIPT_DIR/version-bump.sh" "$NEW_VERSION"

# Update CHANGELOG
log_info "Updating CHANGELOG..."
if [ -f "CHANGELOG.md" ]; then
    # Generate changelog entry
    CHANGELOG_ENTRY="## [$NEW_VERSION] - $(date +%Y-%m-%d)\n\n"

    # Get commits since last tag
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [ -n "$LAST_TAG" ]; then
        COMMITS=$(git log --pretty=format:"- %s" "$LAST_TAG"..HEAD)
    else
        COMMITS=$(git log --pretty=format:"- %s" HEAD~10..HEAD)
    fi

    CHANGELOG_ENTRY="$CHANGELOG_ENTRY$COMMITS\n\n"

    # Prepend to CHANGELOG
    {
        head -n 1 CHANGELOG.md
        echo ""
        echo -e "$CHANGELOG_ENTRY"
        tail -n +3 CHANGELOG.md
    } > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
fi

# Commit changes
log_info "Committing changes..."
git add package.json CHANGELOG.md
git commit -m "chore(release): v$NEW_VERSION"

# Create tag
log_info "Creating tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push
log_info "Pushing to origin..."
git push origin "$CURRENT_BRANCH"
git push origin "v$NEW_VERSION"

log_success "Release v$NEW_VERSION created successfully!"
echo ""
echo "Next steps:"
echo "  1. GitHub Actions will automatically create the release"
echo "  2. Review the release at: https://github.com/nself/nself-chat/releases/tag/v$NEW_VERSION"
