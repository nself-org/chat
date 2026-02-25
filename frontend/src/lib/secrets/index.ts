/**
 * Secrets Management Module
 *
 * Comprehensive secrets management for nself-chat including:
 * - Centralized secret access
 * - Secret validation and policies
 * - Hardcoded secret detection
 * - Secret rotation support
 * - Audit logging
 *
 * @module lib/secrets
 */

// ============================================================================
// Secret Manager
// ============================================================================

export {
  // Classes
  SecretManager,
  InMemorySecretStore,
  EnvSecretStore,
  // Functions
  getSecretManager,
  createSecretManager,
  getSecret,
  getRequiredSecret,
  secretExists,
  generateSecureSecret,
  // Constants
  SECRET_DEFINITIONS,
  // Types
  type SecretMetadata,
  type SecretStore,
  type SecretAccessEvent,
  type SecretManagerConfig,
  type SecretCategory,
  type SecretDefinition,
} from "./secret-manager";

// ============================================================================
// Secret Validator
// ============================================================================

export {
  // Classes
  SecretValidator,
  // Functions
  createSecretValidator,
  getSecretValidator,
  validateSecrets,
  validateSecretsForProduction,
  hasAllRequiredSecrets,
  getSecretRotationStatus,
  runBuildTimeValidation,
  // Utility functions
  isWeakSecret,
  calculateEntropy,
  getMinimumEntropy,
  // Zod schemas
  postgresUrlSchema,
  stripeSecretKeySchema,
  stripeWebhookSecretSchema,
  strongSecretSchema,
  awsAccessKeySchema,
  githubTokenSchema,
  // Types
  type SecretValidationResult,
  type SecretValidationReport,
  type SecretValidatorConfig,
  type CustomValidationRule,
  type ValidationRuleResult,
  type SecretRotationStatus,
} from "./secret-validator";

// ============================================================================
// Secret Scanner
// ============================================================================

export {
  // Classes
  SecretScanner,
  // Functions
  createSecretScanner,
  getSecretScanner,
  scanForSecrets,
  hasHighRiskSecrets,
  // Formatting functions
  redactSecret,
  formatFinding,
  formatScanResult,
  formatScanResultJson,
  toSarif,
  // Constants
  SECRET_PATTERNS,
  // Types
  type SecretSeverity,
  type SecretType,
  type SecretPattern,
  type SecretFinding,
  type ScanResult,
  type ScannerConfig,
  type AllowlistEntry,
} from "./secret-scanner";
