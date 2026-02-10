#!/bin/bash
VERSION=$1
DATE=$(date +%Y-%m-%d)

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/update-tracking.sh <version>"
  exit 1
fi

# Update package.json version
if [ -f package.json ]; then
  npm version ${VERSION} --no-git-tag-version 2>/dev/null || true
  echo "Updated package.json to v${VERSION}"
fi

echo "Tracking files updated for v${VERSION}"
