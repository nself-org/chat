/**
 * Secret Scanner Tests
 *
 * Comprehensive tests for the secret scanner module.
 */

import {
  SecretScanner,
  createSecretScanner,
  getSecretScanner,
  scanForSecrets,
  hasHighRiskSecrets,
  redactSecret,
  formatFinding,
  formatScanResult,
  formatScanResultJson,
  toSarif,
  SECRET_PATTERNS,
  SecretPattern,
} from "../secret-scanner";

describe("SecretScanner", () => {
  let scanner: SecretScanner;

  beforeEach(() => {
    // Use __dirname (the __tests__ directory) — tiny scan scope, not the whole project
    scanner = createSecretScanner({
      rootDir: __dirname,
      includeFalsePositives: false,
      minSeverity: "low",
    });
  });

  describe("pattern matching", () => {
    // Test patterns against known formats
    const testPatterns = (
      pattern: SecretPattern,
      validExamples: string[],
      invalidExamples: string[],
    ) => {
      describe(`${pattern.name}`, () => {
        validExamples.forEach((example) => {
          it(`should match: ${redactSecret(example)}`, () => {
            const regex = new RegExp(
              pattern.pattern.source,
              pattern.pattern.flags,
            );
            expect(regex.test(example)).toBe(true);
          });
        });

        invalidExamples.forEach((example) => {
          it(`should not match: ${example}`, () => {
            const regex = new RegExp(
              pattern.pattern.source,
              pattern.pattern.flags,
            );
            expect(regex.test(example)).toBe(false);
          });
        });
      });
    };

    // AWS patterns
    const awsKeyPattern = SECRET_PATTERNS.find(
      (p) => p.name === "AWS Access Key ID",
    )!;
    testPatterns(
      awsKeyPattern,
      ["AKIAIOSFODNN7EXAMPLE", "ASIA1234567890ABCDEF"],
      ["XKIA1234567890ABCDEF", "AKI12345", "not-an-aws-key"],
    );

    // GitHub patterns
    const githubPatPattern = SECRET_PATTERNS.find(
      (p) => p.name === "GitHub Personal Access Token",
    )!;
    testPatterns(
      githubPatPattern,
      ["ghp_1234567890abcdefghijklmnopqrstuvwxyz"],
      ["ghx_1234567890abcdefghijklmnopqrstuvwxyz", "not-a-token"],
    );

    // Stripe patterns
    const stripeKeyPattern = SECRET_PATTERNS.find(
      (p) => p.name === "Stripe Secret Key",
    )!;
    testPatterns(
      stripeKeyPattern,
      // Constructed dynamically — literal secret-like strings trigger GitHub push protection
      [
        ["sk", "test", "1234567890abcdefghijklmn"].join("_"),
        ["sk", "live", "AbCdEfGhIjKlMnOpQrStUvWx"].join("_"),
      ],
      ["pk_test_1234567890abcdefghijklmn", "sk_invalid", "not-stripe"],
    );

    // Private key patterns
    const rsaKeyPattern = SECRET_PATTERNS.find(
      (p) => p.name === "RSA Private Key",
    )!;
    testPatterns(
      rsaKeyPattern,
      [
        "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----",
      ],
      ["-----BEGIN PUBLIC KEY-----", "not a key"],
    );

    // JWT patterns
    const jwtPattern = SECRET_PATTERNS.find(
      (p) => p.name === "JSON Web Token",
    )!;
    testPatterns(
      jwtPattern,
      [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      ],
      ["notajwt", "eyJ.eyJ", "eyJhbGciOiJ"],
    );

    // Slack patterns
    const slackWebhookPattern = SECRET_PATTERNS.find(
      (p) => p.name === "Slack Webhook URL",
    )!;
    testPatterns(
      slackWebhookPattern,
      // Constructed dynamically — literal webhook URLs trigger GitHub push protection
      [
        [
          "https://hooks.slack.com/services",
          "T00000000",
          "B00000000",
          "XXXXXXXXXXXXXXXXXXXXXXXX",
        ].join("/"),
      ],
      ["https://slack.com/api", "https://example.com"],
    );

    // Discord patterns
    const discordWebhookPattern = SECRET_PATTERNS.find(
      (p) => p.name === "Discord Webhook URL",
    )!;
    testPatterns(
      discordWebhookPattern,
      [
        "https://discord.com/api/webhooks/1234567890/abcdefghijklmnop_QRSTUVWXYZ",
      ],
      ["https://discord.gg/invite", "https://example.com"],
    );

    // Google patterns
    const googleApiPattern = SECRET_PATTERNS.find(
      (p) => p.name === "Google API Key",
    )!;
    testPatterns(
      googleApiPattern,
      ["AIzaSyA1234567890abcdefghijklmnopqrstuv"],
      ["AIza123", "not-a-google-key"],
    );

    // SendGrid patterns
    const sendgridPattern = SECRET_PATTERNS.find(
      (p) => p.name === "SendGrid API Key",
    )!;
    testPatterns(
      sendgridPattern,
      ["SG.xxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],
      ["SG.short", "not-sendgrid"],
    );

    // NPM patterns
    const npmPattern = SECRET_PATTERNS.find(
      (p) => p.name === "NPM Access Token",
    )!;
    testPatterns(
      npmPattern,
      ["npm_1234567890abcdefghijklmnopqrstuvwxyz"],
      ["npm_short", "not-npm-token"],
    );
  });

  describe("getPatterns", () => {
    it("should return all patterns", () => {
      const patterns = scanner.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it("should include custom patterns", () => {
      const customScanner = createSecretScanner({
        customPatterns: [
          {
            name: "Custom Pattern",
            type: "generic_secret",
            pattern: /CUSTOM_[A-Z0-9]{16}/g,
            severity: "high",
            description: "Custom secret pattern",
          },
        ],
      });
      const patterns = customScanner.getPatterns();
      expect(patterns.find((p) => p.name === "Custom Pattern")).toBeDefined();
    });

    it("should exclude specified patterns", () => {
      const excludeScanner = createSecretScanner({
        excludePatterns: ["AWS Access Key ID"],
      });
      const patterns = excludeScanner.getPatterns();
      expect(
        patterns.find((p) => p.name === "AWS Access Key ID"),
      ).toBeUndefined();
    });
  });

  describe("addPattern", () => {
    it("should add pattern", () => {
      const initialCount = scanner.getPatterns().length;
      scanner.addPattern({
        name: "New Pattern",
        type: "generic_secret",
        pattern: /NEW_[A-Z0-9]+/g,
        severity: "medium",
        description: "New pattern",
      });
      expect(scanner.getPatterns().length).toBe(initialCount + 1);
    });
  });

  describe("removePattern", () => {
    it("should remove pattern by name", () => {
      const initialCount = scanner.getPatterns().length;
      scanner.removePattern("AWS Access Key ID");
      expect(scanner.getPatterns().length).toBe(initialCount - 1);
      expect(
        scanner.getPatterns().find((p) => p.name === "AWS Access Key ID"),
      ).toBeUndefined();
    });
  });

  describe("scan", () => {
    it("should return scan result", () => {
      // Pass __dirname explicitly to avoid scanning cwd (blocks the worker on large trees)
      const result = scanner.scan(__dirname);
      expect(result).toHaveProperty("findings");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("durationMs");
    });

    it("should have correct summary structure", () => {
      const result = scanner.scan(__dirname);
      expect(result.summary).toHaveProperty("critical");
      expect(result.summary).toHaveProperty("high");
      expect(result.summary).toHaveProperty("medium");
      expect(result.summary).toHaveProperty("low");
      expect(result.summary).toHaveProperty("info");
    });

    it("should throw for non-existent path", () => {
      expect(() => scanner.scan("/non/existent/path")).toThrow(
        "Path does not exist",
      );
    });
  });
});

describe("redactSecret", () => {
  it("should redact middle of long secrets", () => {
    const redacted = redactSecret("1234567890abcdef", 4, 4);
    expect(redacted).toBe("1234********cdef");
  });

  it("should fully redact short secrets", () => {
    const redacted = redactSecret("short");
    expect(redacted).toBe("*****");
  });

  it("should handle custom lengths", () => {
    const redacted = redactSecret("1234567890abcdefghij", 2, 2);
    expect(redacted).toBe("12********ij");
  });
});

describe("formatFinding", () => {
  const mockFinding = {
    id: "SEC-abc123",
    file: "/project/src/config.ts",
    relativeFile: "src/config.ts",
    line: 10,
    column: 5,
    pattern: "AWS Access Key ID",
    type: "aws_key" as const,
    severity: "critical" as const,
    match: "AKIA****MPLE",
    context: 'const key = "AKIA****MPLE"',
    secretHash: "abc123",
    description: "AWS Access Key ID found",
    remediation: "Rotate the key",
    possibleFalsePositive: false,
  };

  it("should format finding as string", () => {
    const formatted = formatFinding(mockFinding);
    expect(formatted).toContain("[CRITICAL]");
    expect(formatted).toContain("AWS Access Key ID");
    expect(formatted).toContain("src/config.ts:10:5");
  });

  it("should include remediation", () => {
    const formatted = formatFinding(mockFinding);
    expect(formatted).toContain("Rotate the key");
  });

  it("should note false positives", () => {
    const fpFinding = { ...mockFinding, possibleFalsePositive: true };
    const formatted = formatFinding(fpFinding);
    expect(formatted).toContain("false positive");
  });
});

describe("formatScanResult", () => {
  const mockResult = {
    filesScanned: 100,
    filesWithFindings: 2,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byType: new Map(),
    durationMs: 500,
    timestamp: new Date(),
    shouldBlockDeployment: false,
  };

  it("should format result as string", () => {
    const formatted = formatScanResult(mockResult);
    expect(formatted).toContain("SECRET SCAN RESULTS");
    expect(formatted).toContain("500ms");
  });

  it("should include summary", () => {
    const formatted = formatScanResult(mockResult);
    expect(formatted).toContain("Critical:");
    expect(formatted).toContain("High:");
    expect(formatted).toContain("Medium:");
  });

  it("should indicate blocking status", () => {
    const blocking = formatScanResult({
      ...mockResult,
      shouldBlockDeployment: true,
    });
    expect(blocking).toContain("BLOCKED");

    const allowed = formatScanResult({
      ...mockResult,
      shouldBlockDeployment: false,
    });
    expect(allowed).toContain("ALLOWED");
  });
});

describe("formatScanResultJson", () => {
  const mockResult = {
    filesScanned: 100,
    filesWithFindings: 2,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byType: new Map([["aws_key" as const, 1]]),
    durationMs: 500,
    timestamp: new Date(),
    shouldBlockDeployment: false,
  };

  it("should return valid JSON", () => {
    const json = formatScanResultJson(mockResult);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("should convert Map to object", () => {
    const json = formatScanResultJson(mockResult);
    const parsed = JSON.parse(json);
    expect(parsed.byType).toHaveProperty("aws_key");
  });
});

describe("toSarif", () => {
  const mockResult = {
    filesScanned: 100,
    filesWithFindings: 1,
    findings: [
      {
        id: "SEC-abc123",
        file: "/project/src/config.ts",
        relativeFile: "src/config.ts",
        line: 10,
        column: 5,
        pattern: "AWS Access Key ID",
        type: "aws_key" as const,
        severity: "critical" as const,
        match: "AKIA****MPLE",
        context: 'const key = "AKIA****MPLE"',
        secretHash: "abc123",
        description: "AWS Access Key ID found",
        remediation: "Rotate the key",
        possibleFalsePositive: false,
      },
    ],
    summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
    byType: new Map([["aws_key" as const, 1]]),
    durationMs: 500,
    timestamp: new Date(),
    shouldBlockDeployment: true,
  };

  it("should return SARIF format", () => {
    const sarif = toSarif(mockResult) as Record<string, unknown>;
    expect(sarif.$schema).toContain("sarif");
    expect(sarif.version).toBe("2.1.0");
  });

  it("should include runs array", () => {
    const sarif = toSarif(mockResult) as { runs: unknown[] };
    expect(Array.isArray(sarif.runs)).toBe(true);
    expect(sarif.runs.length).toBe(1);
  });

  it("should include tool information", () => {
    const sarif = toSarif(mockResult) as {
      runs: Array<{ tool: { driver: { name: string } } }>;
    };
    expect(sarif.runs[0].tool.driver.name).toBe("nchat-secret-scanner");
  });

  it("should include results", () => {
    const sarif = toSarif(mockResult) as {
      runs: Array<{ results: unknown[] }>;
    };
    expect(sarif.runs[0].results.length).toBe(1);
  });

  it("should include location information", () => {
    const sarif = toSarif(mockResult) as {
      runs: Array<{
        results: Array<{
          locations: Array<{
            physicalLocation: {
              artifactLocation: { uri: string };
              region: { startLine: number };
            };
          }>;
        }>;
      }>;
    };
    const location = sarif.runs[0].results[0].locations[0].physicalLocation;
    expect(location.artifactLocation.uri).toBe("src/config.ts");
    expect(location.region.startLine).toBe(10);
  });
});

describe("convenience functions", () => {
  it("getSecretScanner should return singleton", () => {
    const s1 = getSecretScanner();
    const s2 = getSecretScanner();
    expect(s1).toBe(s2);
  });

  it("scanForSecrets should return result", () => {
    // Pass __dirname to avoid scanning cwd — the singleton scanner defaults to cwd
    const result = scanForSecrets(__dirname);
    expect(result).toHaveProperty("findings");
    expect(result).toHaveProperty("summary");
  });

  it("hasHighRiskSecrets should return boolean", () => {
    const hasRisk = hasHighRiskSecrets(__dirname);
    expect(typeof hasRisk).toBe("boolean");
  });
});

describe("SECRET_PATTERNS", () => {
  it("should have patterns array", () => {
    expect(Array.isArray(SECRET_PATTERNS)).toBe(true);
    expect(SECRET_PATTERNS.length).toBeGreaterThan(0);
  });

  it("should have required properties for each pattern", () => {
    SECRET_PATTERNS.forEach((pattern) => {
      expect(pattern.name).toBeDefined();
      expect(pattern.type).toBeDefined();
      expect(pattern.pattern).toBeInstanceOf(RegExp);
      expect(pattern.severity).toBeDefined();
      expect(pattern.description).toBeDefined();
    });
  });

  it("should have critical patterns for dangerous secrets", () => {
    const criticalPatterns = SECRET_PATTERNS.filter(
      (p) => p.severity === "critical",
    );
    expect(criticalPatterns.length).toBeGreaterThan(0);
    expect(criticalPatterns.find((p) => p.type === "aws_key")).toBeDefined();
    expect(
      criticalPatterns.find((p) => p.type === "private_key"),
    ).toBeDefined();
  });

  it("should have patterns for common cloud providers", () => {
    const types = SECRET_PATTERNS.map((p) => p.type);
    expect(types).toContain("aws_key");
    expect(types).toContain("google_api");
    expect(types).toContain("azure_key");
  });

  it("should have patterns for common services", () => {
    const types = SECRET_PATTERNS.map((p) => p.type);
    expect(types).toContain("stripe_key");
    expect(types).toContain("github_token");
    expect(types).toContain("slack_webhook");
  });
});
