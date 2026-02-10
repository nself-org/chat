const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Workspace packages (v0.9.2 monorepo paths)
    '^@nself-chat/core$': '<rootDir>/../../packages/core/src',
    '^@nself-chat/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@nself-chat/api$': '<rootDir>/../../packages/api/src',
    '^@nself-chat/api/(.*)$': '<rootDir>/../../packages/api/src/$1',
    '^@nself-chat/state$': '<rootDir>/../../packages/state/src',
    '^@nself-chat/state/(.*)$': '<rootDir>/../../packages/state/src/$1',
    '^@nself-chat/ui$': '<rootDir>/../../packages/ui/src',
    '^@nself-chat/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@nself-chat/config$': '<rootDir>/../../packages/config/src',
    '^@nself-chat/config/(.*)$': '<rootDir>/../../packages/config/src/$1',
    '^@nself-chat/testing$': '<rootDir>/../../packages/testing/src',
    '^@nself-chat/testing/(.*)$': '<rootDir>/../../packages/testing/src/$1',

    // Web app internal paths
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/test-utils$': '<rootDir>/src/test-utils',
    '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',

    // Mock ESM packages to avoid compatibility issues with pnpm
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.ts',
    '^isomorphic-dompurify$': '<rootDir>/src/__tests__/mocks/isomorphic-dompurify.ts',
    '^marked$': '<rootDir>/src/__tests__/mocks/marked.ts',
    '^livekit-server-sdk$': '<rootDir>/src/__tests__/mocks/livekit-server-sdk.ts',
    '^bullmq$': '<rootDir>/src/__tests__/mocks/bullmq.ts',
    '^nanoid$': '<rootDir>/src/__tests__/mocks/nanoid.ts',
    '^yaml$': '<rootDir>/src/__tests__/mocks/yaml.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
    // Exclude test utilities from coverage
    '!src/test-utils/**',
    '!src/__tests__/**',
    // Exclude generated files
    '!src/types/generated/**',
    // Exclude platform-specific code (tested separately)
    '!src/**/electron/**',
    '!src/**/capacitor/**',
    '!src/**/tauri/**',
    // Exclude instrumentation files (Sentry setup)
    '!src/instrumentation*.ts',
    '!src/sentry*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical modules require 100% coverage
    'src/services/auth/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/stores/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/lib/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/.backend/',
    '<rootDir>/e2e/',
    '<rootDir>/platforms/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/test-utils/',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  modulePathIgnorePatterns: [
    '<rootDir>/.backend/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/.next/',
    '<rootDir>/platforms/',
  ],
  haste: {
    forceNodeFilesystemAPI: true,
  },
  // Handle pnpm's nested node_modules structure for ESM packages
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|uuid|@apollo|graphql|graphql-ws|@nhost|nhost|jose|livekit-server-sdk|bullmq)/)',
  ],
  // Performance optimizations
  maxWorkers: '50%',
  // Reporters for CI
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'nchat Test Report',
        outputPath: './coverage/test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
  ],
  // Snapshot configuration
  snapshotSerializers: [],
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks after each test
  restoreMocks: true,
  // Verbose output for debugging
  verbose: false,
  // Fail fast in CI
  bail: process.env.CI ? 1 : 0,
  // Test timeout
  testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
