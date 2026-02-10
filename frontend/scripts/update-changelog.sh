#!/bin/bash
VERSION=$1
DATE=$(date +%Y-%m-%d)

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/update-changelog.sh <version>"
  exit 1
fi

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
  COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%s" --no-merges)
else
  COMMITS=$(git log --pretty=format:"%s" --no-merges -30)
fi

# Categorize commits
FEATURES=""
FIXES=""
CHANGES=""
SECURITY=""
DOCS=""

while IFS= read -r commit; do
  case "$commit" in
    feat:*|feat\(*|add:*|add\(*)
      FEATURES="${FEATURES}\n- ${commit#*: }"
      ;;
    fix:*|fix\(*|bug:*|bug\(*)
      FIXES="${FIXES}\n- ${commit#*: }"
      ;;
    security:*|security\(*)
      SECURITY="${SECURITY}\n- ${commit#*: }"
      ;;
    docs:*|docs\(*)
      DOCS="${DOCS}\n- ${commit#*: }"
      ;;
    refactor:*|change:*|update:*|chore:*)
      CHANGES="${CHANGES}\n- ${commit#*: }"
      ;;
  esac
done <<< "$COMMITS"

# Generate changelog entry
cat > .changelog-entry.tmp << EOF
## [${VERSION}] - ${DATE}

EOF

if [ -n "$FEATURES" ]; then
  echo -e "### Added${FEATURES}\n" >> .changelog-entry.tmp
fi

if [ -n "$FIXES" ]; then
  echo -e "### Fixed${FIXES}\n" >> .changelog-entry.tmp
fi

if [ -n "$CHANGES" ]; then
  echo -e "### Changed${CHANGES}\n" >> .changelog-entry.tmp
fi

if [ -n "$SECURITY" ]; then
  echo -e "### Security${SECURITY}\n" >> .changelog-entry.tmp
fi

if [ -n "$DOCS" ]; then
  echo -e "### Documentation${DOCS}\n" >> .changelog-entry.tmp
fi

# Prepend to CHANGELOG.md
if [ -f CHANGELOG.md ]; then
  # Read existing content, skipping the header
  EXISTING=$(tail -n +4 CHANGELOG.md 2>/dev/null || cat CHANGELOG.md)
  cat > CHANGELOG.md << EOF
# Changelog

All notable changes to nchat are documented in this file.

$(cat .changelog-entry.tmp)
${EXISTING}
EOF
else
  cat > CHANGELOG.md << EOF
# Changelog

All notable changes to nchat are documented in this file.

$(cat .changelog-entry.tmp)
EOF
fi

rm -f .changelog-entry.tmp
echo "CHANGELOG.md updated for v${VERSION}"
