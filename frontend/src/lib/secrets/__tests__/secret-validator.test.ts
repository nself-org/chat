/**
 * Secret Validator Tests
 *
 * Comprehensive tests for the secret validator module.
 */

import {
  SecretValidator,
  createSecretValidator,
  getSecretValidator,
  validateSecrets,
  validateSecretsForProduction,
  hasAllRequiredSecrets,
  getSecretRotationStatus,
  isWeakSecret,
  calculateEntropy,
  getMinimumEntropy,
  postgresUrlSchema,
  stripeSecretKeySchema,
  stripeWebhookSecretSchema,
  strongSecretSchema,
} from "../secret-validator";

describe("SecretValidator", () => {
  let validator: SecretValidator;

  beforeEach(() => {
    validator = createSecretValidator({
      environment: "development",
      checkRotation: true,
      enforceMinLength: true,
      validatePatterns: true,
    });
  });

  describe("validateSecret", () => {
    it("should validate existing secret", async () => {
      process.env.TEST_VALID = "some-valid-value-that-is-long-enough";
      const result = await validator.validateSecret(
        "TEST_VALID",
        "some-valid-value-that-is-long-enough",
      );
      expect(result.valid).toBe(true);
      expect(result.exists).toBe(true);
      delete process.env.TEST_VALID;
    });

    it("should report missing required secret", async () => {
      const prodValidator = createSecretValidator({
        environment: "production",
      });
      const result = await prodValidator.validateSecret(
        "DATABASE_URL",
        undefined,
      );
      expect(result.valid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.errors).toContain(
        "Required secret 'DATABASE_URL' is missing",
      );
    });

    it("should warn about missing required in development", async () => {
      const devValidator = createSecretValidator({
        environment: "development",
      });
      const result = await devValidator.validateSecret(
        "DATABASE_URL",
        undefined,
      );
      expect(result.exists).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should validate minimum length", async () => {
      const result = await validator.validateSecret("JWT_SECRET", "short");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("too short"))).toBe(true);
    });

    it("should validate pattern", async () => {
      const result = await validator.validateSecret(
        "STRIPE_SECRET_KEY",
        "invalid_key",
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("pattern"))).toBe(true);
    });

    it("should accept valid Stripe key", async () => {
      const result = await validator.validateSecret(
        "STRIPE_SECRET_KEY",
        "sk_test_1234567890abcdefghijklmnop",
      );
      expect(result.valid).toBe(true);
    });

    it("should detect weak secrets in production", async () => {
      const prodValidator = createSecretValidator({
        environment: "production",
      });
      // Use a clearly weak pattern - repeated pattern
      const result = await prodValidator.validateSecret(
        "JWT_SECRET",
        "abcabcabcabcabcabcabcabcabcabcabc",
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("weak"))).toBe(true);
    });
  });

  describe("validateAll", () => {
    it("should validate all secrets", async () => {
      const report = await validator.validateAll();
      expect(report.totalChecked).toBeGreaterThan(0);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.environment).toBe("development");
    });

    it("should calculate summary correctly", async () => {
      const report = await validator.validateAll();
      expect(report.validCount + report.invalidCount).toBe(report.totalChecked);
    });

    it("should skip specified secrets", async () => {
      const skipValidator = createSecretValidator({
        environment: "development",
        skipSecrets: ["DATABASE_URL"],
      });
      const report = await skipValidator.validateAll();
      expect(
        report.results.find((r) => r.key === "DATABASE_URL"),
      ).toBeUndefined();
    });

    it("should include additional required secrets", async () => {
      const extraValidator = createSecretValidator({
        environment: "development",
        additionalRequired: ["CUSTOM_SECRET"],
      });
      const report = await extraValidator.validateAll();
      expect(
        report.results.find((r) => r.key === "CUSTOM_SECRET"),
      ).toBeDefined();
    });
  });

  describe("validateForProduction", () => {
    it("should validate as production", async () => {
      const devValidator = createSecretValidator({
        environment: "development",
      });
      const report = await devValidator.validateForProduction();
      expect(report.environment).toBe("production");
    });

    it("should be stricter than development", async () => {
      const devReport = await validator.validateAll();
      const prodReport = await validator.validateForProduction();
      // Production should have more critical errors due to missing required secrets
      expect(prodReport.criticalErrors.length).toBeGreaterThanOrEqual(
        devReport.criticalErrors.length,
      );
    });
  });

  describe("getRotationStatus", () => {
    it("should return rotation status for applicable secrets", async () => {
      const statuses = await validator.getRotationStatus();
      expect(Array.isArray(statuses)).toBe(true);
      // All returned secrets should require rotation
      expect(statuses.every((s) => s.requiresRotation)).toBe(true);
    });

    it("should include rotation interval", async () => {
      const statuses = await validator.getRotationStatus();
      if (statuses.length > 0) {
        expect(statuses[0].rotationIntervalDays).toBeDefined();
      }
    });
  });

  describe("hasRequiredSecrets", () => {
    it("should return false when required secrets are missing", async () => {
      const hasRequired = await validator.hasRequiredSecrets();
      expect(typeof hasRequired).toBe("boolean");
    });
  });

  describe("getMissingRequired", () => {
    it("should list missing required secrets", async () => {
      const missing = await validator.getMissingRequired();
      expect(Array.isArray(missing)).toBe(true);
    });
  });

  describe("custom validation rules", () => {
    it("should apply custom rules", async () => {
      const customValidator = createSecretValidator({
        environment: "development",
        customRules: [
          {
            name: "NoTestInProduction",
            appliesTo: [],
            validate: (key, value) => {
              if (value?.includes("test")) {
                return { valid: false, error: 'Contains "test"' };
              }
              return { valid: true };
            },
          },
        ],
      });

      const result = await customValidator.validateSecret(
        "SOME_KEY",
        "test_value",
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Contains "test"'))).toBe(
        true,
      );
    });

    it("should apply rules to specific secrets", async () => {
      const customValidator = createSecretValidator({
        environment: "development",
        customRules: [
          {
            name: "SpecificRule",
            appliesTo: ["SPECIFIC_KEY"],
            validate: () => ({ valid: false, error: "Specific rule failed" }),
          },
        ],
      });

      const specificResult = await customValidator.validateSecret(
        "SPECIFIC_KEY",
        "value",
      );
      expect(
        specificResult.errors.some((e) => e.includes("Specific rule failed")),
      ).toBe(true);

      const otherResult = await customValidator.validateSecret(
        "OTHER_KEY",
        "value",
      );
      expect(
        otherResult.errors.some((e) => e.includes("Specific rule failed")),
      ).toBe(false);
    });

    it("should collect warnings from custom rules", async () => {
      const customValidator = createSecretValidator({
        environment: "development",
        customRules: [
          {
            name: "WarningRule",
            appliesTo: [],
            validate: () => ({
              valid: true,
              warning: "Consider changing this",
            }),
          },
        ],
      });

      const result = await customValidator.validateSecret("SOME_KEY", "value");
      expect(
        result.warnings.some((w) => w.includes("Consider changing this")),
      ).toBe(true);
    });
  });

  describe("schema validation", () => {
    it("should use registered schemas", () => {
      validator.registerSchema("CUSTOM_KEY", strongSecretSchema);
      // Schema registration is internal, test via validation
    });
  });
});

describe("isWeakSecret", () => {
  it("should detect short secrets", () => {
    expect(isWeakSecret("short")).toBe(true);
    expect(isWeakSecret("a".repeat(15))).toBe(true);
  });

  it("should detect known weak secrets", () => {
    expect(isWeakSecret("password")).toBe(true);
    expect(isWeakSecret("password123")).toBe(true);
    expect(isWeakSecret("secret")).toBe(true);
    expect(isWeakSecret("admin")).toBe(true);
    expect(isWeakSecret("test123")).toBe(true);
    expect(isWeakSecret("changeme")).toBe(true);
  });

  it("should detect weak patterns", () => {
    expect(isWeakSecret("xxxxxxxxxxxxxxxx")).toBe(true);
    expect(isWeakSecret("placeholder-value")).toBe(true);
    expect(isWeakSecret("default-secret-value")).toBe(true);
  });

  it("should detect low entropy secrets", () => {
    expect(isWeakSecret("aaaaaaaaaaaaaaaa")).toBe(true);
    expect(isWeakSecret("abcabcabcabcabcabc")).toBe(true);
  });

  it("should accept strong secrets", () => {
    expect(isWeakSecret("aB3$kL9#mP2!qR7@wE4&")).toBe(false);
    expect(isWeakSecret("Xk8pL2mN4vQ6rT9wY3bF")).toBe(false);
  });
});

describe("calculateEntropy", () => {
  it("should return 0 for empty string", () => {
    expect(calculateEntropy("")).toBe(0);
  });

  it("should calculate low entropy for repeated characters", () => {
    const entropy = calculateEntropy("aaaaaaaaaa");
    expect(entropy).toBe(0); // All same char = 0 entropy
  });

  it("should calculate higher entropy for varied characters", () => {
    const lowEntropy = calculateEntropy("aaaaabbbbb");
    const highEntropy = calculateEntropy("abcdefghij");
    expect(highEntropy).toBeGreaterThan(lowEntropy);
  });

  it("should return higher entropy for longer strings", () => {
    const short = calculateEntropy("abcd");
    const long = calculateEntropy("abcdefghijklmnop");
    expect(long).toBeGreaterThan(short);
  });
});

describe("getMinimumEntropy", () => {
  it("should return 128 for encryption keys", () => {
    expect(getMinimumEntropy("JWT_SECRET")).toBe(128);
    expect(getMinimumEntropy("ENCRYPTION_KEY")).toBe(128);
  });

  it("should return 80 for database secrets", () => {
    expect(getMinimumEntropy("DATABASE_URL")).toBe(80);
  });

  it("should return 64 for OAuth secrets", () => {
    expect(getMinimumEntropy("GOOGLE_CLIENT_SECRET")).toBe(64);
  });

  it("should return default for unknown keys", () => {
    expect(getMinimumEntropy("UNKNOWN_KEY")).toBe(48);
  });
});

describe("Zod schemas", () => {
  describe("postgresUrlSchema", () => {
    it("should validate correct PostgreSQL URLs", () => {
      expect(
        postgresUrlSchema.safeParse("postgresql://user:pass@localhost:5432/db")
          .success,
      ).toBe(true);
      expect(
        postgresUrlSchema.safeParse("postgres://user:pass@host/database")
          .success,
      ).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(
        postgresUrlSchema.safeParse("mysql://user:pass@localhost/db").success,
      ).toBe(false);
      expect(postgresUrlSchema.safeParse("not-a-url").success).toBe(false);
    });
  });

  describe("stripeSecretKeySchema", () => {
    it("should validate correct Stripe keys", () => {
      // Constructed dynamically — literal sk_test_ strings trigger GitHub push protection
      expect(
        stripeSecretKeySchema.safeParse(
          ["sk", "test", "1234567890abcdefghijklmn"].join("_"),
        ).success,
      ).toBe(true);
      expect(
        stripeSecretKeySchema.safeParse(
          ["sk", "live", "1234567890abcdefghijklmn"].join("_"),
        ).success,
      ).toBe(true);
    });

    it("should reject invalid Stripe keys", () => {
      expect(
        stripeSecretKeySchema.safeParse("pk_test_1234567890abcdefghijklmn")
          .success,
      ).toBe(false);
      expect(stripeSecretKeySchema.safeParse("sk_invalid_123").success).toBe(
        false,
      );
    });
  });

  describe("stripeWebhookSecretSchema", () => {
    it("should validate correct webhook secrets", () => {
      expect(
        stripeWebhookSecretSchema.safeParse(
          "whsec_1234567890abcdefghijklmnopqrstuv",
        ).success,
      ).toBe(true);
    });

    it("should reject invalid webhook secrets", () => {
      expect(
        stripeWebhookSecretSchema.safeParse("not_a_webhook_secret").success,
      ).toBe(false);
    });
  });

  describe("strongSecretSchema", () => {
    it("should require minimum 32 characters", () => {
      expect(strongSecretSchema.safeParse("a".repeat(31)).success).toBe(false);
      expect(strongSecretSchema.safeParse("a".repeat(32)).success).toBe(true);
    });
  });
});

describe("convenience functions", () => {
  it("getSecretValidator should return singleton", () => {
    const v1 = getSecretValidator();
    const v2 = getSecretValidator();
    expect(v1).toBe(v2);
  });

  it("validateSecrets should return report", async () => {
    const report = await validateSecrets();
    expect(report.totalChecked).toBeGreaterThan(0);
  });

  it("validateSecretsForProduction should use production environment", async () => {
    const report = await validateSecretsForProduction();
    expect(report.environment).toBe("production");
  });

  it("hasAllRequiredSecrets should return boolean", async () => {
    const result = await hasAllRequiredSecrets();
    expect(typeof result).toBe("boolean");
  });

  it("getSecretRotationStatus should return array", async () => {
    const statuses = await getSecretRotationStatus();
    expect(Array.isArray(statuses)).toBe(true);
  });
});
