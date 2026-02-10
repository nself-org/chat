# nChat Test Scripts

Utility scripts for test coverage analysis and test file generation.

---

## Scripts Overview

### 1. analyze-test-coverage.js

Analyzes test coverage and identifies gaps

### 2. generate-test-template.js

Generates test file templates for services, hooks, components, and API routes

### 3. test-helper.sh

Helper script for running tests with common configurations

---

## Quick Start

```bash
# Analyze coverage gaps
node scripts/analyze-test-coverage.js

# Generate a service test
node scripts/generate-test-template.js service src/services/example/example.service.ts

# Run tests with coverage
pnpm test:coverage
```

---

For full documentation, see `/Users/admin/Sites/nself-chat/docs/TEST-COVERAGE-REPORT.md`
