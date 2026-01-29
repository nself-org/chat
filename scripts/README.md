# Scripts Directory

This directory contains utility scripts for development, testing, and deployment.

## Environment Validation

### validate-env.ts

Validates environment configuration and provides helpful feedback. Run this before deploying or when debugging configuration issues.

**Usage:**

```bash
# Validate current environment
pnpm validate:env

# Validate for production deployment
pnpm validate:env:prod
```

**What it checks:**

1. **Public Environment Variables**
   - All required NEXT_PUBLIC_* variables are properly formatted
   - URLs are valid and properly configured

2. **Production Requirements** (with `--production` flag)
   - NODE_ENV === 'production' check
   - Required variables are set:
     - NEXT_PUBLIC_GRAPHQL_URL
     - NEXT_PUBLIC_AUTH_URL
     - NEXT_PUBLIC_STORAGE_URL
     - HASURA_ADMIN_SECRET
     - JWT_SECRET (minimum 32 characters)
   - URLs do NOT use localhost patterns:
     - localhost
     - 127.0.0.1
     - 0.0.0.0
     - .local
     - host.docker.internal
   - NEXT_PUBLIC_USE_DEV_AUTH is disabled
   - JWT_SECRET meets minimum security requirements

3. **Health Check**
   - Overall environment configuration status
   - Service availability checks
   - Security warnings

**Exit Codes:**

- `0`: All checks passed
- `1`: Validation failed (in production mode or critical errors)

**Example Output:**

```
================================================================================
  ɳChat Environment Validation
================================================================================

1. Public Environment Variables
-------------------------------
✓ Public environment variables are valid

  Environment: production
  App Name: ɳChat
  Dev Auth: Disabled

2. Environment Information
--------------------------

  GraphQL API:      ✓ Configured
  Authentication:   ✓ Configured
  Storage:          ✓ Configured
  Real-time:        ✗ Not configured
  Analytics:        ✗ Disabled
  Error Tracking:   ✗ Disabled

3. Health Check
---------------

✓ Environment is healthy - no issues detected

4. Production Readiness
-----------------------
✓ Environment is ready for production

================================================================================
  Summary
================================================================================

✓ All checks passed!
```

**CI/CD Integration:**

The validation script is automatically run in the CI build job to prevent deploying with misconfigured environment variables. See `.github/workflows/ci.yml` for implementation details.

### test-prod-validation.sh

Automated test suite for the production environment validation script. Runs multiple test cases to ensure validation works correctly.

**Usage:**

```bash
./scripts/test-prod-validation.sh
```

**Test Cases:**

1. Missing required variables (should fail)
2. Localhost URLs in production (should fail)
3. Short JWT secret (should fail)
4. Dev auth enabled in production (should fail)
5. Valid production configuration (should pass)

## Other Scripts

Additional utility scripts for building, testing, and deployment are located in this directory. Refer to individual script files for documentation.
