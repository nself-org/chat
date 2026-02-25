/**
 * Secret Manager
 *
 * Centralized secret access with secure retrieval patterns.
 * Supports multiple secret stores and enforces secure defaults.
 *
 * @module lib/secrets/secret-manager
 */

import { createHash, randomBytes } from "crypto";

import { logger } from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Secret metadata for audit and tracking
 */
export interface SecretMetadata {
  /** When the secret was created */
  createdAt: Date;
  /** When the secret was last accessed */
  lastAccessedAt?: Date;
  /** When the secret expires (if applicable) */
  expiresAt?: Date;
  /** Version number for rotation tracking */
  version: number;
  /** Who/what created the secret */
  createdBy?: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Secret store interface for different backends
 */
export interface SecretStore {
  /** Get a secret by key */
  get(key: string): Promise<string | undefined>;
  /** Set a secret */
  set(
    key: string,
    value: string,
    metadata?: Partial<SecretMetadata>,
  ): Promise<void>;
  /** Delete a secret */
  delete(key: string): Promise<boolean>;
  /** Check if a secret exists */
  exists(key: string): Promise<boolean>;
  /** List all secret keys (not values) */
  list(): Promise<string[]>;
  /** Get secret metadata */
  getMetadata(key: string): Promise<SecretMetadata | undefined>;
}

/**
 * Secret access event for auditing
 */
export interface SecretAccessEvent {
  /** Secret key that was accessed */
  key: string;
  /** Type of access (read, write, delete) */
  action: "read" | "write" | "delete" | "list";
  /** When the access occurred */
  timestamp: Date;
  /** Who/what accessed the secret */
  accessor?: string;
  /** Whether the access was successful */
  success: boolean;
  /** Error message if access failed */
  error?: string;
  /** IP address if applicable */
  ipAddress?: string;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Secret configuration for the manager
 */
export interface SecretManagerConfig {
  /** Default store to use */
  defaultStore: "env" | "vault" | "aws" | "gcp" | "azure";
  /** Whether to cache secrets in memory */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
  /** Whether to log access events */
  enableAuditLog: boolean;
  /** Callback for audit events */
  onAuditEvent?: (event: SecretAccessEvent) => void;
  /** Whether to mask secrets in logs */
  maskSecretsInLogs: boolean;
  /** List of required secrets */
  requiredSecrets?: string[];
}

/**
 * Secret category for organization
 */
export type SecretCategory =
  | "database"
  | "api"
  | "oauth"
  | "encryption"
  | "storage"
  | "email"
  | "payment"
  | "monitoring"
  | "other";

/**
 * Secret definition for validation
 */
export interface SecretDefinition {
  /** Secret key name */
  key: string;
  /** Human-readable description */
  description: string;
  /** Category for organization */
  category: SecretCategory;
  /** Whether this secret is required */
  required: boolean;
  /** Minimum length for validation */
  minLength?: number;
  /** Regex pattern for validation */
  pattern?: RegExp;
  /** Whether secret should be rotated regularly */
  requiresRotation?: boolean;
  /** Rotation interval in days */
  rotationIntervalDays?: number;
  /** Environment variable name (if different from key) */
  envVar?: string;
}

// ============================================================================
// Secret Definitions
// ============================================================================

/**
 * All secrets used by the application
 */
export const SECRET_DEFINITIONS: SecretDefinition[] = [
  // Database
  {
    key: "DATABASE_URL",
    description: "PostgreSQL database connection string",
    category: "database",
    required: true,
    pattern: /^postgres(ql)?:\/\/.+/,
  },
  {
    key: "HASURA_ADMIN_SECRET",
    description: "Hasura GraphQL admin secret",
    category: "database",
    required: true,
    minLength: 32,
  },

  // Authentication
  {
    key: "JWT_SECRET",
    description: "JWT signing secret",
    category: "encryption",
    required: true,
    minLength: 32,
    requiresRotation: true,
    rotationIntervalDays: 90,
  },
  {
    key: "ENCRYPTION_KEY",
    description: "AES encryption key for sensitive data",
    category: "encryption",
    required: true,
    minLength: 32,
    requiresRotation: true,
    rotationIntervalDays: 90,
  },
  {
    key: "NEXTAUTH_SECRET",
    description: "NextAuth.js session secret",
    category: "encryption",
    required: true,
    minLength: 32,
  },

  // OAuth Providers
  {
    key: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret",
    category: "oauth",
    required: false,
    minLength: 24,
  },
  {
    key: "GITHUB_CLIENT_SECRET",
    description: "GitHub OAuth client secret",
    category: "oauth",
    required: false,
    minLength: 20,
  },
  {
    key: "DISCORD_CLIENT_SECRET",
    description: "Discord OAuth client secret",
    category: "oauth",
    required: false,
    minLength: 32,
  },
  {
    key: "SLACK_CLIENT_SECRET",
    description: "Slack OAuth client secret",
    category: "oauth",
    required: false,
    minLength: 32,
  },
  {
    key: "APPLE_CLIENT_SECRET",
    description: "Apple Sign-In client secret (JWT)",
    category: "oauth",
    required: false,
    pattern: /^eyJ.+/,
  },
  {
    key: "MICROSOFT_CLIENT_SECRET",
    description: "Microsoft OAuth client secret",
    category: "oauth",
    required: false,
    minLength: 32,
  },

  // Storage
  {
    key: "S3_SECRET_KEY",
    description: "S3/MinIO secret access key",
    category: "storage",
    required: false,
    minLength: 20,
  },
  {
    key: "MINIO_SECRET_KEY",
    description: "MinIO secret key",
    category: "storage",
    required: false,
    minLength: 20,
    envVar: "S3_SECRET_KEY",
  },

  // Email
  {
    key: "SMTP_PASSWORD",
    description: "SMTP server password",
    category: "email",
    required: false,
    minLength: 8,
  },
  {
    key: "RESEND_API_KEY",
    description: "Resend email service API key",
    category: "email",
    required: false,
    pattern: /^re_.+/,
  },
  {
    key: "SENDGRID_API_KEY",
    description: "SendGrid API key",
    category: "email",
    required: false,
    pattern: /^SG\..+/,
  },

  // Payments
  {
    key: "STRIPE_SECRET_KEY",
    description: "Stripe secret API key",
    category: "payment",
    required: false,
    pattern: /^sk_(live|test)_.+/,
    requiresRotation: true,
    rotationIntervalDays: 365,
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    description: "Stripe webhook signing secret",
    category: "payment",
    required: false,
    pattern: /^whsec_.+/,
  },

  // AI Services
  {
    key: "OPENAI_API_KEY",
    description: "OpenAI API key",
    category: "api",
    required: false,
    pattern: /^sk-.+/,
  },
  {
    key: "ANTHROPIC_API_KEY",
    description: "Anthropic API key",
    category: "api",
    required: false,
    pattern: /^sk-ant-.+/,
  },

  // Monitoring
  {
    key: "SENTRY_AUTH_TOKEN",
    description: "Sentry authentication token",
    category: "monitoring",
    required: false,
    pattern: /^sntrys_.+/,
  },

  // Search
  {
    key: "MEILISEARCH_MASTER_KEY",
    description: "MeiliSearch master key",
    category: "api",
    required: false,
    minLength: 16,
  },

  // Redis
  {
    key: "REDIS_PASSWORD",
    description: "Redis password",
    category: "database",
    required: false,
    minLength: 8,
  },

  // WebRTC
  {
    key: "LIVEKIT_API_SECRET",
    description: "LiveKit API secret",
    category: "api",
    required: false,
    minLength: 32,
  },
  {
    key: "TURN_SECRET",
    description: "TURN server secret",
    category: "api",
    required: false,
    minLength: 16,
  },
];

// ============================================================================
// Environment Variable Store
// ============================================================================

/**
 * Environment variable-based secret store
 */
export class EnvSecretStore implements SecretStore {
  private prefix: string;
  private metadata: Map<string, SecretMetadata> = new Map();

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  async get(key: string): Promise<string | undefined> {
    const envKey = this.prefix + key;
    return process.env[envKey];
  }

  async set(
    key: string,
    value: string,
    metadata?: Partial<SecretMetadata>,
  ): Promise<void> {
    const envKey = this.prefix + key;
    process.env[envKey] = value;
    this.metadata.set(key, {
      createdAt: new Date(),
      version: 1,
      ...metadata,
    });
  }

  async delete(key: string): Promise<boolean> {
    const envKey = this.prefix + key;
    if (process.env[envKey] !== undefined) {
      delete process.env[envKey];
      this.metadata.delete(key);
      return true;
    }
    return false;
  }

  async exists(key: string): Promise<boolean> {
    const envKey = this.prefix + key;
    return process.env[envKey] !== undefined;
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (const key of Object.keys(process.env)) {
      if (this.prefix === "" || key.startsWith(this.prefix)) {
        keys.push(this.prefix ? key.substring(this.prefix.length) : key);
      }
    }
    return keys;
  }

  async getMetadata(key: string): Promise<SecretMetadata | undefined> {
    return this.metadata.get(key);
  }
}

// ============================================================================
// In-Memory Secret Store (for testing)
// ============================================================================

/**
 * In-memory secret store for testing purposes
 */
export class InMemorySecretStore implements SecretStore {
  private secrets: Map<string, string> = new Map();
  private metadata: Map<string, SecretMetadata> = new Map();

  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async set(
    key: string,
    value: string,
    metadata?: Partial<SecretMetadata>,
  ): Promise<void> {
    this.secrets.set(key, value);
    this.metadata.set(key, {
      createdAt: new Date(),
      version: (this.metadata.get(key)?.version ?? 0) + 1,
      ...metadata,
    });
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.secrets.has(key);
    this.secrets.delete(key);
    this.metadata.delete(key);
    return existed;
  }

  async exists(key: string): Promise<boolean> {
    return this.secrets.has(key);
  }

  async list(): Promise<string[]> {
    return Array.from(this.secrets.keys());
  }

  async getMetadata(key: string): Promise<SecretMetadata | undefined> {
    return this.metadata.get(key);
  }

  clear(): void {
    this.secrets.clear();
    this.metadata.clear();
  }
}

// ============================================================================
// Secret Cache
// ============================================================================

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class SecretCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = 60000) {
    this.ttlMs = ttlMs;
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: string): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Secret Manager
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SecretManagerConfig = {
  defaultStore: "env",
  enableCache: true,
  cacheTtlMs: 60000, // 1 minute
  enableAuditLog: true,
  maskSecretsInLogs: true,
};

/**
 * Centralized secret manager
 */
export class SecretManager {
  private stores: Map<string, SecretStore> = new Map();
  private cache: SecretCache;
  private config: SecretManagerConfig;
  private auditLog: SecretAccessEvent[] = [];
  private accessCounts: Map<string, number> = new Map();

  constructor(config: Partial<SecretManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new SecretCache(this.config.cacheTtlMs);

    // Initialize default stores
    this.stores.set("env", new EnvSecretStore());
    this.stores.set("memory", new InMemorySecretStore());
  }

  /**
   * Register a custom secret store
   */
  registerStore(name: string, store: SecretStore): void {
    this.stores.set(name, store);
  }

  /**
   * Get the default store
   */
  private getDefaultStore(): SecretStore {
    const store = this.stores.get(this.config.defaultStore);
    if (!store) {
      throw new Error(`Default store '${this.config.defaultStore}' not found`);
    }
    return store;
  }

  /**
   * Log an audit event
   */
  private logAuditEvent(event: SecretAccessEvent): void {
    if (!this.config.enableAuditLog) return;

    this.auditLog.push(event);

    // Keep only last 1000 events
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Call callback if provided
    if (this.config.onAuditEvent) {
      this.config.onAuditEvent(event);
    }

    // Log based on action
    const maskedKey = this.config.maskSecretsInLogs
      ? this.maskSecretKey(event.key)
      : event.key;

    if (!event.success) {
      logger.warn(`[SecretManager] Failed ${event.action} for ${maskedKey}`, {
        error: event.error,
      });
    }
  }

  /**
   * Mask a secret key for logging
   */
  private maskSecretKey(key: string): string {
    if (key.length <= 8) return "****";
    return key.substring(0, 4) + "****" + key.substring(key.length - 4);
  }

  /**
   * Get a secret value
   */
  async get(key: string, storeName?: string): Promise<string | undefined> {
    const startTime = Date.now();
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      this.logAuditEvent({
        key,
        action: "read",
        timestamp: new Date(),
        success: false,
        error: `Store '${storeName}' not found`,
      });
      throw new Error(`Store '${storeName}' not found`);
    }

    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        this.accessCounts.set(key, (this.accessCounts.get(key) ?? 0) + 1);
        this.logAuditEvent({
          key,
          action: "read",
          timestamp: new Date(),
          success: true,
        });
        return cached;
      }
    }

    try {
      const value = await store.get(key);
      this.accessCounts.set(key, (this.accessCounts.get(key) ?? 0) + 1);

      // Cache the result
      if (this.config.enableCache && value !== undefined) {
        this.cache.set(key, value);
      }

      this.logAuditEvent({
        key,
        action: "read",
        timestamp: new Date(),
        success: true,
      });

      return value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logAuditEvent({
        key,
        action: "read",
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Get a secret or throw if not found
   */
  async getRequired(key: string, storeName?: string): Promise<string> {
    const value = await this.get(key, storeName);
    if (value === undefined) {
      throw new Error(`Required secret '${key}' not found`);
    }
    return value;
  }

  /**
   * Get a secret with a default value
   */
  async getWithDefault(
    key: string,
    defaultValue: string,
    storeName?: string,
  ): Promise<string> {
    const value = await this.get(key, storeName);
    return value ?? defaultValue;
  }

  /**
   * Set a secret value
   */
  async set(
    key: string,
    value: string,
    storeName?: string,
    metadata?: Partial<SecretMetadata>,
  ): Promise<void> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      this.logAuditEvent({
        key,
        action: "write",
        timestamp: new Date(),
        success: false,
        error: `Store '${storeName}' not found`,
      });
      throw new Error(`Store '${storeName}' not found`);
    }

    try {
      await store.set(key, value, metadata);

      // Invalidate cache
      if (this.config.enableCache) {
        this.cache.delete(key);
      }

      this.logAuditEvent({
        key,
        action: "write",
        timestamp: new Date(),
        success: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logAuditEvent({
        key,
        action: "write",
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  async delete(key: string, storeName?: string): Promise<boolean> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      this.logAuditEvent({
        key,
        action: "delete",
        timestamp: new Date(),
        success: false,
        error: `Store '${storeName}' not found`,
      });
      throw new Error(`Store '${storeName}' not found`);
    }

    try {
      const result = await store.delete(key);

      // Invalidate cache
      if (this.config.enableCache) {
        this.cache.delete(key);
      }

      this.logAuditEvent({
        key,
        action: "delete",
        timestamp: new Date(),
        success: true,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logAuditEvent({
        key,
        action: "delete",
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Check if a secret exists
   */
  async exists(key: string, storeName?: string): Promise<boolean> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      throw new Error(`Store '${storeName}' not found`);
    }

    return store.exists(key);
  }

  /**
   * List all secret keys
   */
  async list(storeName?: string): Promise<string[]> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      this.logAuditEvent({
        key: "*",
        action: "list",
        timestamp: new Date(),
        success: false,
        error: `Store '${storeName}' not found`,
      });
      throw new Error(`Store '${storeName}' not found`);
    }

    const keys = await store.list();

    this.logAuditEvent({
      key: "*",
      action: "list",
      timestamp: new Date(),
      success: true,
    });

    return keys;
  }

  /**
   * Get secret metadata
   */
  async getMetadata(
    key: string,
    storeName?: string,
  ): Promise<SecretMetadata | undefined> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      throw new Error(`Store '${storeName}' not found`);
    }

    return store.getMetadata(key);
  }

  /**
   * Rotate a secret by generating a new value
   */
  async rotate(
    key: string,
    newValue: string,
    storeName?: string,
  ): Promise<{ oldVersion: number; newVersion: number }> {
    const store = storeName
      ? this.stores.get(storeName)
      : this.getDefaultStore();

    if (!store) {
      throw new Error(`Store '${storeName}' not found`);
    }

    const existingMetadata = await store.getMetadata(key);
    const oldVersion = existingMetadata?.version ?? 0;

    await this.set(key, newValue, storeName, {
      version: oldVersion + 1,
      createdBy: "rotation",
    });

    return {
      oldVersion,
      newVersion: oldVersion + 1,
    };
  }

  /**
   * Generate a cryptographically secure secret
   */
  generateSecret(
    length: number = 32,
    encoding: BufferEncoding = "hex",
  ): string {
    const bytes = randomBytes(Math.ceil(length / 2));
    return bytes.toString(encoding).slice(0, length);
  }

  /**
   * Hash a secret for comparison (without storing it)
   */
  hashSecret(secret: string): string {
    return createHash("sha256").update(secret).digest("hex");
  }

  /**
   * Get audit log
   */
  getAuditLog(): SecretAccessEvent[] {
    return [...this.auditLog];
  }

  /**
   * Get access statistics
   */
  getAccessStats(): Map<string, number> {
    return new Map(this.accessCounts);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get all defined secrets
   */
  getSecretDefinitions(): SecretDefinition[] {
    return [...SECRET_DEFINITIONS];
  }

  /**
   * Get secret definition by key
   */
  getSecretDefinition(key: string): SecretDefinition | undefined {
    return SECRET_DEFINITIONS.find((d) => d.key === key || d.envVar === key);
  }

  /**
   * Get secrets by category
   */
  getSecretsByCategory(category: SecretCategory): SecretDefinition[] {
    return SECRET_DEFINITIONS.filter((d) => d.category === category);
  }

  /**
   * Get required secrets
   */
  getRequiredSecrets(): SecretDefinition[] {
    return SECRET_DEFINITIONS.filter((d) => d.required);
  }

  /**
   * Get secrets that require rotation
   */
  getSecretsRequiringRotation(): SecretDefinition[] {
    return SECRET_DEFINITIONS.filter((d) => d.requiresRotation);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultManager: SecretManager | null = null;

/**
 * Get the default secret manager instance
 */
export function getSecretManager(): SecretManager {
  if (!defaultManager) {
    defaultManager = new SecretManager();
  }
  return defaultManager;
}

/**
 * Create a new secret manager with custom configuration
 */
export function createSecretManager(
  config: Partial<SecretManagerConfig> = {},
): SecretManager {
  return new SecretManager(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get a secret from the default manager
 */
export async function getSecret(key: string): Promise<string | undefined> {
  return getSecretManager().get(key);
}

/**
 * Get a required secret from the default manager
 */
export async function getRequiredSecret(key: string): Promise<string> {
  return getSecretManager().getRequired(key);
}

/**
 * Check if a secret exists in the default manager
 */
export async function secretExists(key: string): Promise<boolean> {
  return getSecretManager().exists(key);
}

/**
 * Generate a new secure secret
 */
export function generateSecureSecret(length: number = 32): string {
  return getSecretManager().generateSecret(length);
}
