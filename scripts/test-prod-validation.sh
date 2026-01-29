#!/bin/bash
# Test script to verify production environment validation

set -e

echo "========================================="
echo "Testing Production Environment Validation"
echo "========================================="
echo ""

# Test 1: Missing required variables
echo "Test 1: Missing required variables (should fail)"
echo "-------------------------------------------------"
NODE_ENV=production NEXT_PUBLIC_ENV=production tsx scripts/validate-env.ts --production 2>&1 && {
  echo "❌ FAILED: Should have failed with missing variables"
  exit 1
} || {
  echo "✓ PASSED: Correctly failed with missing variables"
}
echo ""

# Test 2: Localhost URLs in production
echo "Test 2: Localhost URLs in production (should fail)"
echo "---------------------------------------------------"
NODE_ENV=production \
NEXT_PUBLIC_ENV=production \
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/v1/graphql \
NEXT_PUBLIC_AUTH_URL=http://localhost:4000/v1/auth \
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000/v1/storage \
HASURA_ADMIN_SECRET=test-secret-min-32-chars-long-12345 \
JWT_SECRET=test-jwt-secret-min-32-chars-long \
tsx scripts/validate-env.ts --production 2>&1 && {
  echo "❌ FAILED: Should have failed with localhost URLs"
  exit 1
} || {
  echo "✓ PASSED: Correctly failed with localhost URLs"
}
echo ""

# Test 3: Short JWT secret
echo "Test 3: Short JWT secret (should fail)"
echo "---------------------------------------"
NODE_ENV=production \
NEXT_PUBLIC_ENV=production \
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.example.com/v1/graphql \
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth \
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage \
HASURA_ADMIN_SECRET=test-secret-min-32-chars-long-12345 \
JWT_SECRET=short \
tsx scripts/validate-env.ts --production 2>&1 && {
  echo "❌ FAILED: Should have failed with short JWT secret"
  exit 1
} || {
  echo "✓ PASSED: Correctly failed with short JWT secret"
}
echo ""

# Test 4: Dev auth enabled in production
echo "Test 4: Dev auth enabled in production (should fail)"
echo "-----------------------------------------------------"
NODE_ENV=production \
NEXT_PUBLIC_ENV=production \
NEXT_PUBLIC_USE_DEV_AUTH=true \
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.example.com/v1/graphql \
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth \
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage \
HASURA_ADMIN_SECRET=test-secret-min-32-chars-long-12345 \
JWT_SECRET=test-jwt-secret-min-32-chars-long \
tsx scripts/validate-env.ts --production 2>&1 && {
  echo "❌ FAILED: Should have failed with dev auth enabled"
  exit 1
} || {
  echo "✓ PASSED: Correctly failed with dev auth enabled"
}
echo ""

# Test 5: Valid production configuration
echo "Test 5: Valid production configuration (should pass)"
echo "-----------------------------------------------------"
NODE_ENV=production \
NEXT_PUBLIC_ENV=production \
NEXT_PUBLIC_USE_DEV_AUTH=false \
NEXT_PUBLIC_GRAPHQL_URL=https://graphql.example.com/v1/graphql \
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth \
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage \
HASURA_ADMIN_SECRET=test-secret-min-32-chars-long-12345 \
JWT_SECRET=test-jwt-secret-min-32-chars-long \
tsx scripts/validate-env.ts --production 2>&1 && {
  echo "✓ PASSED: Valid configuration accepted"
} || {
  echo "❌ FAILED: Valid configuration was rejected"
  exit 1
}
echo ""

echo "========================================="
echo "All validation tests passed! ✓"
echo "========================================="
