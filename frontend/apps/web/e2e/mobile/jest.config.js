/**
 * Jest Configuration for Detox E2E Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/e2e/mobile/**/*.spec.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './e2e/mobile/reports',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'nChat Mobile E2E Test Report',
        outputPath: './e2e/mobile/reports/index.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        sort: 'status',
        executionTimeWarningThreshold: 5,
      },
    ],
  ],
  verbose: true,
}
