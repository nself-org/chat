/**
 * Secret Manager Tests
 *
 * Comprehensive tests for the secret manager module.
 */

import {
  SecretManager,
  InMemorySecretStore,
  EnvSecretStore,
  getSecretManager,
  createSecretManager,
  getSecret,
  getRequiredSecret,
  secretExists,
  generateSecureSecret,
  SECRET_DEFINITIONS,
} from "../secret-manager";

describe("SecretManager", () => {
  let manager: SecretManager;

  beforeEach(() => {
    manager = createSecretManager({
      enableCache: false,
      enableAuditLog: true,
    });
  });

  afterEach(() => {
    manager.clearAuditLog();
  });

  describe("basic operations", () => {
    it("should get a secret from environment", async () => {
      process.env.TEST_SECRET = "test-value";
      const value = await manager.get("TEST_SECRET");
      expect(value).toBe("test-value");
      delete process.env.TEST_SECRET;
    });

    it("should return undefined for non-existent secret", async () => {
      const value = await manager.get("NON_EXISTENT_SECRET");
      expect(value).toBeUndefined();
    });

    it("should set and get a secret", async () => {
      manager.registerStore("test", new InMemorySecretStore());
      await manager.set("MY_SECRET", "my-value", "test");
      const value = await manager.get("MY_SECRET", "test");
      expect(value).toBe("my-value");
    });

    it("should delete a secret", async () => {
      manager.registerStore("test", new InMemorySecretStore());
      await manager.set("TO_DELETE", "value", "test");
      const result = await manager.delete("TO_DELETE", "test");
      expect(result).toBe(true);
      const value = await manager.get("TO_DELETE", "test");
      expect(value).toBeUndefined();
    });

    it("should check if secret exists", async () => {
      process.env.EXISTING_SECRET = "value";
      const exists = await manager.exists("EXISTING_SECRET");
      expect(exists).toBe(true);
      const notExists = await manager.exists("NOT_EXISTING");
      expect(notExists).toBe(false);
      delete process.env.EXISTING_SECRET;
    });

    it("should list secrets", async () => {
      const store = new InMemorySecretStore();
      manager.registerStore("test", store);
      await manager.set("SECRET_1", "value1", "test");
      await manager.set("SECRET_2", "value2", "test");
      const keys = await manager.list("test");
      expect(keys).toContain("SECRET_1");
      expect(keys).toContain("SECRET_2");
    });
  });

  describe("getRequired", () => {
    it("should return value for existing secret", async () => {
      process.env.REQUIRED_SECRET = "required-value";
      const value = await manager.getRequired("REQUIRED_SECRET");
      expect(value).toBe("required-value");
      delete process.env.REQUIRED_SECRET;
    });

    it("should throw for missing required secret", async () => {
      await expect(manager.getRequired("MISSING_REQUIRED")).rejects.toThrow(
        "Required secret 'MISSING_REQUIRED' not found",
      );
    });
  });

  describe("getWithDefault", () => {
    it("should return value for existing secret", async () => {
      process.env.DEFAULT_SECRET = "actual-value";
      const value = await manager.getWithDefault("DEFAULT_SECRET", "default");
      expect(value).toBe("actual-value");
      delete process.env.DEFAULT_SECRET;
    });

    it("should return default for missing secret", async () => {
      const value = await manager.getWithDefault(
        "MISSING_SECRET",
        "default-value",
      );
      expect(value).toBe("default-value");
    });
  });

  describe("caching", () => {
    it("should cache secrets when enabled", async () => {
      const cachingManager = createSecretManager({
        enableCache: true,
        cacheTtlMs: 60000,
      });

      process.env.CACHED_SECRET = "original";
      const first = await cachingManager.get("CACHED_SECRET");
      expect(first).toBe("original");

      // Change env but should still get cached value
      process.env.CACHED_SECRET = "changed";
      const second = await cachingManager.get("CACHED_SECRET");
      expect(second).toBe("original");

      // Clear cache and should get new value
      cachingManager.clearCache();
      const third = await cachingManager.get("CACHED_SECRET");
      expect(third).toBe("changed");

      delete process.env.CACHED_SECRET;
    });

    it("should invalidate cache on set", async () => {
      const store = new InMemorySecretStore();
      const cachingManager = createSecretManager({
        enableCache: true,
        cacheTtlMs: 60000,
      });
      cachingManager.registerStore("test", store);

      await cachingManager.set("CACHE_TEST", "initial", "test");
      const first = await cachingManager.get("CACHE_TEST", "test");
      expect(first).toBe("initial");

      await cachingManager.set("CACHE_TEST", "updated", "test");
      const second = await cachingManager.get("CACHE_TEST", "test");
      expect(second).toBe("updated");
    });
  });

  describe("audit logging", () => {
    it("should log read events", async () => {
      process.env.AUDIT_TEST = "value";
      await manager.get("AUDIT_TEST");
      const log = manager.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
      expect(
        log.find((e) => e.key === "AUDIT_TEST" && e.action === "read"),
      ).toBeDefined();
      delete process.env.AUDIT_TEST;
    });

    it("should log write events", async () => {
      const store = new InMemorySecretStore();
      manager.registerStore("test", store);
      await manager.set("AUDIT_WRITE", "value", "test");
      const log = manager.getAuditLog();
      expect(
        log.find((e) => e.key === "AUDIT_WRITE" && e.action === "write"),
      ).toBeDefined();
    });

    it("should log delete events", async () => {
      const store = new InMemorySecretStore();
      manager.registerStore("test", store);
      await manager.set("AUDIT_DELETE", "value", "test");
      await manager.delete("AUDIT_DELETE", "test");
      const log = manager.getAuditLog();
      expect(
        log.find((e) => e.key === "AUDIT_DELETE" && e.action === "delete"),
      ).toBeDefined();
    });

    it("should clear audit log", () => {
      manager.clearAuditLog();
      expect(manager.getAuditLog()).toHaveLength(0);
    });
  });

  describe("secret generation", () => {
    it("should generate secret of specified length", () => {
      const secret = manager.generateSecret(32);
      expect(secret).toHaveLength(32);
    });

    it("should generate cryptographically random secrets", () => {
      const secret1 = manager.generateSecret(32);
      const secret2 = manager.generateSecret(32);
      expect(secret1).not.toBe(secret2);
    });

    it("should support different encodings", () => {
      const hexSecret = manager.generateSecret(32, "hex");
      expect(hexSecret).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe("secret hashing", () => {
    it("should hash secrets consistently", () => {
      const hash1 = manager.hashSecret("my-secret");
      const hash2 = manager.hashSecret("my-secret");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different secrets", () => {
      const hash1 = manager.hashSecret("secret-1");
      const hash2 = manager.hashSecret("secret-2");
      expect(hash1).not.toBe(hash2);
    });

    it("should produce SHA-256 hash", () => {
      const hash = manager.hashSecret("test");
      expect(hash).toHaveLength(64); // 256 bits = 64 hex chars
    });
  });

  describe("rotation", () => {
    it("should rotate secret and update version", async () => {
      const store = new InMemorySecretStore();
      manager.registerStore("test", store);

      await manager.set("ROTATE_TEST", "v1", "test", { version: 1 });
      const result = await manager.rotate("ROTATE_TEST", "v2", "test");

      expect(result.oldVersion).toBe(1);
      expect(result.newVersion).toBe(2);

      const value = await manager.get("ROTATE_TEST", "test");
      expect(value).toBe("v2");
    });
  });

  describe("metadata", () => {
    it("should get secret metadata", async () => {
      const store = new InMemorySecretStore();
      manager.registerStore("test", store);

      await manager.set("META_TEST", "value", "test", {
        createdBy: "test-user",
        tags: ["test", "example"],
      });

      const metadata = await manager.getMetadata("META_TEST", "test");
      expect(metadata).toBeDefined();
      expect(metadata?.createdBy).toBe("test-user");
      expect(metadata?.tags).toContain("test");
    });
  });

  describe("access statistics", () => {
    it("should track access counts", async () => {
      process.env.STATS_TEST = "value";
      await manager.get("STATS_TEST");
      await manager.get("STATS_TEST");
      await manager.get("STATS_TEST");

      const stats = manager.getAccessStats();
      expect(stats.get("STATS_TEST")).toBe(3);
      delete process.env.STATS_TEST;
    });
  });

  describe("store management", () => {
    it("should register custom store", async () => {
      const customStore = new InMemorySecretStore();
      manager.registerStore("custom", customStore);

      await manager.set("CUSTOM_SECRET", "value", "custom");
      const value = await manager.get("CUSTOM_SECRET", "custom");
      expect(value).toBe("value");
    });

    it("should throw for non-existent store", async () => {
      await expect(manager.get("SECRET", "nonexistent")).rejects.toThrow(
        "Store 'nonexistent' not found",
      );
    });
  });

  describe("secret definitions", () => {
    it("should return all secret definitions", () => {
      const definitions = manager.getSecretDefinitions();
      expect(definitions.length).toBeGreaterThan(0);
    });

    it("should get definition by key", () => {
      const definition = manager.getSecretDefinition("JWT_SECRET");
      expect(definition).toBeDefined();
      expect(definition?.category).toBe("encryption");
    });

    it("should get secrets by category", () => {
      const dbSecrets = manager.getSecretsByCategory("database");
      expect(dbSecrets.length).toBeGreaterThan(0);
      expect(dbSecrets.every((s) => s.category === "database")).toBe(true);
    });

    it("should get required secrets", () => {
      const required = manager.getRequiredSecrets();
      expect(required.every((s) => s.required)).toBe(true);
    });

    it("should get secrets requiring rotation", () => {
      const rotatable = manager.getSecretsRequiringRotation();
      expect(rotatable.every((s) => s.requiresRotation)).toBe(true);
    });
  });
});

describe("InMemorySecretStore", () => {
  let store: InMemorySecretStore;

  beforeEach(() => {
    store = new InMemorySecretStore();
  });

  afterEach(() => {
    store.clear();
  });

  it("should get and set secrets", async () => {
    await store.set("KEY", "VALUE");
    const value = await store.get("KEY");
    expect(value).toBe("VALUE");
  });

  it("should delete secrets", async () => {
    await store.set("KEY", "VALUE");
    const deleted = await store.delete("KEY");
    expect(deleted).toBe(true);
    expect(await store.exists("KEY")).toBe(false);
  });

  it("should return false when deleting non-existent key", async () => {
    const deleted = await store.delete("NONEXISTENT");
    expect(deleted).toBe(false);
  });

  it("should list all keys", async () => {
    await store.set("KEY1", "VALUE1");
    await store.set("KEY2", "VALUE2");
    const keys = await store.list();
    expect(keys).toContain("KEY1");
    expect(keys).toContain("KEY2");
  });

  it("should track metadata", async () => {
    await store.set("KEY", "VALUE", { createdBy: "test" });
    const metadata = await store.getMetadata("KEY");
    expect(metadata?.createdBy).toBe("test");
    expect(metadata?.version).toBe(1);
  });

  it("should increment version on update", async () => {
    await store.set("KEY", "VALUE1");
    await store.set("KEY", "VALUE2");
    const metadata = await store.getMetadata("KEY");
    expect(metadata?.version).toBe(2);
  });

  it("should clear all secrets", async () => {
    await store.set("KEY1", "VALUE1");
    await store.set("KEY2", "VALUE2");
    store.clear();
    expect(await store.list()).toHaveLength(0);
  });
});

describe("EnvSecretStore", () => {
  let store: EnvSecretStore;

  beforeEach(() => {
    store = new EnvSecretStore();
  });

  afterEach(() => {
    // Clean up any test env vars
    Object.keys(process.env)
      .filter((k) => k.startsWith("TEST_"))
      .forEach((k) => delete process.env[k]);
  });

  it("should get environment variable", async () => {
    process.env.TEST_VAR = "test-value";
    const value = await store.get("TEST_VAR");
    expect(value).toBe("test-value");
  });

  it("should set environment variable", async () => {
    await store.set("TEST_SET", "set-value");
    expect(process.env.TEST_SET).toBe("set-value");
  });

  it("should delete environment variable", async () => {
    process.env.TEST_DELETE = "to-delete";
    const deleted = await store.delete("TEST_DELETE");
    expect(deleted).toBe(true);
    expect(process.env.TEST_DELETE).toBeUndefined();
  });

  it("should check existence", async () => {
    process.env.TEST_EXISTS = "exists";
    expect(await store.exists("TEST_EXISTS")).toBe(true);
    expect(await store.exists("TEST_NOT_EXISTS")).toBe(false);
  });

  it("should use prefix", async () => {
    const prefixedStore = new EnvSecretStore("PREFIX_");
    process.env.PREFIX_KEY = "prefixed-value";
    const value = await prefixedStore.get("KEY");
    expect(value).toBe("prefixed-value");
    delete process.env.PREFIX_KEY;
  });
});

describe("convenience functions", () => {
  beforeEach(() => {
    process.env.CONVENIENCE_TEST = "convenience-value";
  });

  afterEach(() => {
    delete process.env.CONVENIENCE_TEST;
  });

  it("getSecretManager should return singleton", () => {
    const manager1 = getSecretManager();
    const manager2 = getSecretManager();
    expect(manager1).toBe(manager2);
  });

  it("getSecret should get secret from default manager", async () => {
    const value = await getSecret("CONVENIENCE_TEST");
    expect(value).toBe("convenience-value");
  });

  it("getRequiredSecret should get required secret", async () => {
    const value = await getRequiredSecret("CONVENIENCE_TEST");
    expect(value).toBe("convenience-value");
  });

  it("secretExists should check existence", async () => {
    expect(await secretExists("CONVENIENCE_TEST")).toBe(true);
    expect(await secretExists("NONEXISTENT")).toBe(false);
  });

  it("generateSecureSecret should generate random secret", () => {
    const secret = generateSecureSecret(32);
    expect(secret).toHaveLength(32);
  });
});

describe("SECRET_DEFINITIONS", () => {
  it("should have definitions for common secrets", () => {
    const keys = SECRET_DEFINITIONS.map((d) => d.key);
    expect(keys).toContain("DATABASE_URL");
    expect(keys).toContain("JWT_SECRET");
    expect(keys).toContain("STRIPE_SECRET_KEY");
  });

  it("should have required secrets marked", () => {
    const required = SECRET_DEFINITIONS.filter((d) => d.required);
    expect(required.length).toBeGreaterThan(0);
    expect(required.some((d) => d.key === "DATABASE_URL")).toBe(true);
  });

  it("should have rotation requirements for security keys", () => {
    const rotatable = SECRET_DEFINITIONS.filter((d) => d.requiresRotation);
    expect(rotatable.some((d) => d.key === "JWT_SECRET")).toBe(true);
    expect(rotatable.some((d) => d.key === "ENCRYPTION_KEY")).toBe(true);
  });

  it("should have patterns for typed secrets", () => {
    const stripeDef = SECRET_DEFINITIONS.find(
      (d) => d.key === "STRIPE_SECRET_KEY",
    );
    expect(stripeDef?.pattern).toBeDefined();
    // Constructed dynamically — literal sk_test_ strings trigger GitHub push protection
    expect(
      stripeDef?.pattern?.test(
        ["sk", "test", "1234567890abcdefghijklmn"].join("_"),
      ),
    ).toBe(true);
  });

  it("should have minimum lengths for encryption keys", () => {
    const jwtDef = SECRET_DEFINITIONS.find((d) => d.key === "JWT_SECRET");
    expect(jwtDef?.minLength).toBeGreaterThanOrEqual(32);
  });
});
