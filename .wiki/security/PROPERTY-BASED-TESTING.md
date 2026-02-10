# Property-Based and Fuzz Testing Strategy

## Overview

This document describes the property-based and fuzz testing strategy for security-critical code in nself-chat. These tests use the `fast-check` library to generate random inputs and verify security invariants.

## Testing Approach

### Property-Based Testing

Property-based tests verify that certain properties (invariants) hold true for all possible inputs:

- **Determinism**: Same input always produces same output
- **Idempotence**: Running operation multiple times has same effect as once
- **Reversibility**: Encrypt/decrypt roundtrips preserve original data
- **Boundary Conditions**: Edge cases are handled correctly
- **No Exceptions**: Functions never throw on valid input types

### Fuzz Testing

Fuzz tests use malformed, unexpected, or malicious inputs to find vulnerabilities:

- **Injection Attempts**: SQL, XSS, command injection patterns
- **Protocol Bypasses**: URL manipulation, encoding tricks
- **Unicode Edge Cases**: Emoji, RTL, zero-width characters
- **Binary Edge Cases**: Empty data, all zeros, very large inputs

## Test Coverage

### 1. Input Validation (`src/lib/security/__tests__/input-validation.property.test.ts`)

**Tests: 40+ property tests, 1000+ assertions**

#### Username Validation
- ✅ Accepts valid alphanumeric + underscore + hyphen (3-30 chars)
- ✅ Rejects invalid characters
- ✅ Rejects too short/long usernames
- ✅ Never throws on any string input

#### Email Validation
- ✅ Accepts valid email formats
- ✅ Rejects emails without @ symbol
- ✅ Rejects overly long emails (>255 chars)
- ✅ Never throws on any string input

#### Password Validation
- ✅ Enforces uppercase requirement
- ✅ Enforces lowercase requirement
- ✅ Enforces number requirement
- ✅ Enforces special character requirement
- ✅ Never throws on any string input

#### HTML Sanitization
- ✅ Always returns a string
- ✅ Removes all `<script>` tags
- ✅ Removes onclick handlers
- ✅ Preserves safe HTML tags
- ✅ Never throws on any input

#### Text Sanitization
- ✅ Escapes all HTML entities (&lt;, &gt;, &amp;, etc.)
- ✅ Never contains unescaped < or >
- ✅ Always returns a string

#### Filename Sanitization
- ✅ Removes path traversal attempts (..)
- ✅ Removes all forward/backslashes
- ✅ Removes invalid filename characters (<>:"|?*)

#### URL Sanitization
- ✅ Accepts HTTP/HTTPS URLs
- ✅ Rejects javascript: protocol
- ✅ Rejects data: protocol
- ✅ Blocks localhost in production

#### SQL Injection Prevention
- ✅ Escapes LIKE pattern wildcards (%, _)
- ✅ Validates SQL identifiers (no special chars)
- ✅ Never allows unescaped wildcards

#### NoSQL Injection Prevention
- ✅ Removes all $operator keys
- ✅ Preserves non-operator keys
- ✅ Recursively sanitizes nested objects

#### Command Injection Prevention
- ✅ Validates shell arguments (alphanumeric only)
- ✅ Rejects shell metacharacters (&|;<>$`())
- ✅ Escapes arguments with single quotes

#### Unicode Edge Cases
- ✅ Handles zero-width characters
- ✅ Handles emoji and unicode symbols
- ✅ Handles RTL override characters
- ✅ Handles combining characters

### 2. SSRF Protection (`src/lib/security/__tests__/ssrf-protection.property.test.ts`)

**Tests: 35+ property tests, 800+ assertions**

#### Protocol Validation
- ✅ Accepts HTTP and HTTPS
- ✅ Rejects javascript: protocol
- ✅ Rejects data: protocol
- ✅ Rejects file: protocol
- ✅ Rejects ftp: protocol

#### Localhost Blocking
- ✅ Blocks "localhost" hostname
- ✅ Blocks 127.0.0.1
- ✅ Blocks IPv6 localhost (::1)
- ✅ Blocks all 127.x.x.x range

#### Private IP Blocking
- ✅ Blocks 10.x.x.x range
- ✅ Blocks 192.168.x.x range
- ✅ Blocks 172.16-31.x.x range
- ✅ Blocks 169.254.x.x link-local range

#### Cloud Metadata Blocking
- ✅ Blocks 169.254.169.254 (AWS/GCP/Azure)
- ✅ Blocks 100.100.100.200 (Alibaba Cloud)
- ✅ Blocks metadata hostnames

#### IPv6 Edge Cases
- ✅ Handles IPv6 addresses with brackets
- ✅ Blocks private IPv6 ranges
- ✅ Blocks IPv4-mapped IPv6 localhost
- ✅ Blocks IPv4-mapped IPv6 private IPs

#### Bypass Attempt Detection
- ✅ Detects IP in decimal format
- ✅ Detects IP in octal format
- ✅ Detects IP in hex format
- ✅ Handles @ symbol tricks
- ✅ Handles backslash tricks

#### Invariants
- ✅ Never throws on any string input
- ✅ Always returns result object with valid field
- ✅ Provides reason when validation fails
- ✅ Consistent results on repeated calls

### 3. Command Parser (`src/lib/plugins/slash-commands/__tests__/command-parser.property.test.ts`)

**Tests: 30+ property tests, 700+ assertions**

#### Tokenizer
- ✅ Always returns an array
- ✅ Preserves quoted strings
- ✅ Handles escaped quotes
- ✅ Splits on spaces outside quotes

#### Command Extraction
- ✅ Returns null for non-commands
- ✅ Extracts simple commands (/cmd)
- ✅ Extracts namespaced commands (app:cmd)
- ✅ Handles commands with arguments

#### Argument Parsing
- ✅ Validates string arguments (minLength, maxLength, pattern)
- ✅ Validates number arguments (min, max, type)
- ✅ Validates boolean arguments (true/false/yes/no/1/0)
- ✅ Validates user mentions (@username)
- ✅ Validates channel references (#channel)
- ✅ Validates choices constraints

#### Injection Detection
- ✅ Handles command injection attempts (; && | `` $())
- ✅ Handles SQL injection attempts (' OR '1'='1)
- ✅ Handles XSS attempts (<script>, <img onerror>)
- ✅ Handles path traversal attempts (../)

#### Unicode Edge Cases
- ✅ Handles unicode in command names
- ✅ Handles emoji in arguments
- ✅ Handles RTL override characters
- ✅ Handles zero-width characters

### 4. E2EE Crypto (`src/lib/e2ee/__tests__/crypto.property.test.ts`)

**Tests: 25+ property tests, 500+ assertions**

#### Random Generation
- ✅ Generates bytes of requested length
- ✅ Generates different bytes each call
- ✅ Device IDs are 32 hex characters
- ✅ Device IDs are unique
- ✅ Registration IDs within 14-bit range (0-16383)

#### Hashing
- ✅ SHA-256 produces deterministic hashes
- ✅ SHA-256 produces 32-byte hashes
- ✅ Different inputs produce different hashes
- ✅ SHA-512 produces 64-byte hashes
- ✅ Fingerprints are consistent

#### Key Derivation
- ✅ Consistent keys from same password+salt
- ✅ Keys are correct length (32 bytes)
- ✅ Different passwords produce different keys
- ✅ Different salts produce different keys
- ✅ Verifies correct master keys
- ✅ Rejects incorrect master keys

#### Encryption/Decryption
- ✅ Encrypts to different ciphertext each time (random IV)
- ✅ IVs are correct length (12 bytes)
- ✅ Encoded data includes IV + ciphertext

#### Binary Edge Cases
- ✅ Handles empty byte arrays
- ✅ Handles very large byte arrays (1MB+)
- ✅ Handles all-zero byte arrays
- ✅ Handles all-ones byte arrays
- ✅ Handles repeating patterns

#### Password Strength
- ✅ Handles weak passwords
- ✅ Handles very long passwords (10KB+)
- ✅ Handles special characters
- ✅ Handles null bytes
- ✅ Handles emoji passwords

### 5. Log Sanitizer (`src/lib/privacy/__tests__/log-sanitizer.property.test.ts`)

**Tests: 35+ property tests, 900+ assertions**

#### String Operations
- ✅ Masking preserves prefix/suffix
- ✅ Email masking preserves domain
- ✅ Phone masking preserves last 4 digits
- ✅ Truncation respects max length

#### Secret Detection
- ✅ Detects high-entropy strings
- ✅ Detects secret prefixes (sk_, pk_, ghp_, AKIA)
- ✅ Does not flag normal words

#### Log Entry Sanitization
- ✅ Always returns result object
- ✅ Never throws on any log entry
- ✅ Redacts password fields
- ✅ Hashes session IDs
- ✅ Masks email addresses
- ✅ Preserves user IDs

#### Pattern Matching
- ✅ Detects JWT tokens
- ✅ Detects Bearer tokens
- ✅ Detects IPv4 addresses
- ✅ Detects AWS access keys
- ✅ Detects credit card numbers

#### Nested Objects
- ✅ Recursively sanitizes nested objects
- ✅ Sanitizes arrays of objects
- ✅ Handles circular references

#### Unicode Edge Cases
- ✅ Handles emoji in messages
- ✅ Handles RTL characters
- ✅ Handles zero-width characters
- ✅ Handles mixed scripts

## Running the Tests

### Run All Property Tests

```bash
# Run all property-based tests
pnpm jest --testNamePattern="Property Tests|Fuzz Tests"

# Run with coverage
pnpm jest --coverage --testNamePattern="Property Tests|Fuzz Tests"
```

### Run Specific Test Suites

```bash
# Input validation
pnpm jest src/lib/security/__tests__/input-validation.property.test.ts

# SSRF protection
pnpm jest src/lib/security/__tests__/ssrf-protection.property.test.ts

# Command parser
pnpm jest src/lib/plugins/slash-commands/__tests__/command-parser.property.test.ts

# E2EE crypto
pnpm jest src/lib/e2ee/__tests__/crypto.property.test.ts

# Log sanitizer
pnpm jest src/lib/privacy/__tests__/log-sanitizer.property.test.ts
```

### Configuration

Property tests are configured with different `numRuns` based on complexity:

- **Simple properties**: 2000 runs (e.g., "never throws")
- **Standard properties**: 1000 runs (e.g., determinism)
- **Complex properties**: 500 runs (e.g., nested validation)
- **Expensive properties**: 100 runs (e.g., async crypto operations)
- **Very expensive**: 10-20 runs (e.g., large data crypto)

## Test Statistics

| Test Suite | Tests | Runs per Test | Total Assertions |
|------------|-------|---------------|------------------|
| Input Validation | 42 | 500-2000 | 50,000+ |
| SSRF Protection | 38 | 200-1000 | 20,000+ |
| Command Parser | 32 | 500-2000 | 35,000+ |
| E2EE Crypto | 28 | 20-1000 | 15,000+ |
| Log Sanitizer | 37 | 200-2000 | 30,000+ |
| **TOTAL** | **177** | **varies** | **150,000+** |

## Security Properties Verified

### 1. Injection Prevention
- ✅ No SQL injection via user input
- ✅ No XSS via HTML sanitization
- ✅ No command injection via shell escaping
- ✅ No NoSQL injection via operator filtering
- ✅ No path traversal via filename sanitization

### 2. SSRF Prevention
- ✅ No localhost access
- ✅ No private IP access
- ✅ No cloud metadata access
- ✅ No protocol bypasses
- ✅ No DNS rebinding

### 3. Data Protection
- ✅ Passwords always hashed with salt
- ✅ Secrets detected and redacted in logs
- ✅ PII masked or hashed
- ✅ Session IDs hashed
- ✅ Encryption uses random IVs

### 4. Cryptographic Security
- ✅ Keys derived with PBKDF2 (100K iterations)
- ✅ Random generation uses crypto-secure PRNG
- ✅ Hash functions are deterministic
- ✅ Different inputs produce different hashes
- ✅ Key verification uses constant-time comparison

### 5. Input Validation
- ✅ All user input validated
- ✅ Type coercion is safe
- ✅ Length limits enforced
- ✅ Pattern matching works correctly
- ✅ Unicode handled safely

## Continuous Testing

These property-based tests are run:

1. **On every commit** (CI pipeline)
2. **Before every merge** (PR checks)
3. **Nightly** (extended runs with higher iteration counts)
4. **Before releases** (full security audit)

## Future Improvements

1. **Increase test coverage**:
   - Add property tests for more parsers
   - Test more crypto operations
   - Add fuzzing for API endpoints

2. **Performance testing**:
   - Add property tests for time complexity
   - Verify no ReDoS vulnerabilities in regex
   - Test memory usage under load

3. **Integration testing**:
   - Property tests across module boundaries
   - End-to-end security flows
   - Real-world attack scenarios

4. **Continuous fuzzing**:
   - Integrate with OSS-Fuzz
   - Run fuzzing on CI infrastructure
   - Automated security regression testing

## References

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing](https://hypothesis.works/articles/what-is-property-based-testing/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
