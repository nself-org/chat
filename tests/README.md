# Testing Suite

**Project**: nself-chat (nchat)
**Version**: 0.9.1

---

## Overview

Comprehensive testing suite for nself-chat including unit tests, integration tests, E2E tests, load tests, stress tests, and chaos engineering.

---

## Test Categories

### 1. Unit Tests (Jest)
**Location**: `src/**/__tests__/*.test.ts(x)`
**Count**: 10,400+ tests
**Coverage**: 98%+

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Specific test
pnpm test src/hooks/__tests__/use-messages.test.ts
```

### 2. Integration Tests (Jest)
**Location**: `src/__tests__/integration/*.test.ts`
**Count**: 50+ test suites

```bash
# Run integration tests
pnpm test src/__tests__/integration

# Specific integration test
pnpm test src/__tests__/integration/auth-system-complete.integration.test.ts
```

### 3. E2E Tests (Playwright)
**Location**: `e2e/**/*.spec.ts`
**Count**: 30+ test files

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Mobile E2E (Detox)
pnpm test:e2e:mobile
```

### 4. Load Tests (k6)
**Location**: `tests/load/*.js`
**Purpose**: Performance validation under normal/peak load

```bash
# Run all load tests
pnpm test:load

# Individual tests
pnpm test:load:websocket
pnpm test:load:messages
pnpm test:load:api
pnpm test:load:files
pnpm test:load:search
```

**Scenarios**:
- WebSocket Connections: 10,000 concurrent
- Message Throughput: 1,000 msg/s
- API Endpoints: 100 concurrent users
- File Uploads: 100 concurrent uploads
- Search Queries: 100 concurrent searches

### 5. Stress Tests (k6)
**Location**: `tests/stress/*.js`
**Purpose**: Find breaking points and resource limits

```bash
# Run stress test suite
cd tests/stress
./stress-test-runner.sh
```

**Scenarios**:
- Peak Load: 5,000 concurrent users
- Sustained Load: 4-8 hour soak test
- Burst Traffic: Traffic spike patterns
- Connection Pool: Database exhaustion
- Memory Stress: Large payloads
- Endurance: 8+ hour stability test

### 6. Chaos Tests (Custom)
**Location**: `tests/chaos/*.js`
**Purpose**: Validate resilience under failure conditions

```bash
# Run chaos test suite
cd tests/chaos
./chaos-test-runner.sh
```

**Scenarios**:
- Database failures
- Network partitions
- Service crashes
- Resource exhaustion
- Cascading failures

---

## Quick Start

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install test tools
brew install k6

# Start backend services
pnpm backend:start
```

### Run All Tests
```bash
# Unit + Integration
pnpm test

# E2E
pnpm test:e2e

# Performance
pnpm test:load
```

---

## Test Results

### Current Status
- **Unit Tests**: ✅ 10,400+ passing (98% coverage)
- **Integration Tests**: ✅ 50+ passing
- **E2E Tests**: ⚠️ Skipped (requires backend)
- **Load Tests**: ✅ Validated (see reports)
- **Stress Tests**: ✅ Documented limits
- **Chaos Tests**: ✅ Resilience validated

### Test Reports
- Unit/Integration: `coverage/` directory
- E2E: `playwright-report/` directory
- Load: `tests/load/test-results/`
- Stress: `tests/stress/stress-results/`
- Chaos: `tests/chaos/chaos-results/`

---

## Performance Targets

### Response Times (p95)
- API GET: < 500ms
- API POST: < 1000ms
- WebSocket: < 200ms
- Search: < 500ms
- File Upload: < 5s (10MB)

### Throughput
- Messages: 1,000/second
- API Requests: 10,000/second
- Concurrent Users: 10,000
- WebSocket Connections: 10,000

### Resource Limits
- Memory: < 4GB per instance
- CPU: < 80% sustained
- Database Connections: < 80 (100 pool)

---

## Documentation

- [Load Testing Guide](../docs/LOAD-TESTING.md)
- [System Capacity](../docs/SYSTEM-CAPACITY.md)
- [Test Policy](../docs/TEST-POLICY.md)

---

## CI/CD

Tests run automatically on:
- Every commit (unit + integration)
- Pull requests (unit + integration + E2E)
- Daily (full test suite + load tests)
- Weekly (stress tests)
- Monthly (chaos tests)

See `.github/workflows/ci.yml` for configuration.

---

## Troubleshooting

### Common Issues

**Tests timing out**
```bash
# Increase timeout
NODE_OPTIONS='--max-old-space-size=8192' pnpm test --testTimeout=30000
```

**Backend not available**
```bash
# Check backend status
pnpm backend:status

# Restart backend
pnpm backend:stop && pnpm backend:start
```

**Load tests failing**
```bash
# Check system resources
docker stats

# Reduce load
VUS=100 pnpm test:load
```

---

## Contributing

When adding new tests:
1. Follow existing patterns
2. Add to appropriate category
3. Update this README
4. Ensure tests pass in CI
5. Document expected behavior

---

*Last updated: February 2026*
