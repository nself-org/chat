/**
 * Jest Configuration for @nself-chat/mobile
 */

/** @type {import('jest').Config} */
module.exports = {
  displayName: '@nself-chat/mobile',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@nself-chat/core$': '<rootDir>/../../packages/core/src',
    '^@nself-chat/api$': '<rootDir>/../../packages/api/src',
    '^@nself-chat/state$': '<rootDir>/../../packages/state/src',
    '^@nself-chat/ui$': '<rootDir>/../../packages/ui/src',
    '^@nself-chat/config$': '<rootDir>/../../packages/config/src',
    '^@nself-chat/testing$': '<rootDir>/../../packages/testing/src',
    '\\.css$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/config/jest-setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
}
