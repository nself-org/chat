/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/$1',
    '^@nself-chat/core$': '<rootDir>/../../packages/core/src',
    '^@nself-chat/api$': '<rootDir>/../../packages/api/src',
    '^@nself-chat/state$': '<rootDir>/../../packages/state/src',
    '^@nself-chat/ui$': '<rootDir>/../../packages/ui/src',
    '^@nself-chat/config$': '<rootDir>/../../packages/config/src',
    '^@nself-chat/testing$': '<rootDir>/../../packages/testing/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
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
