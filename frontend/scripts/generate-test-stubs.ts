#!/usr/bin/env tsx
/**
 * Generate Test File Stubs
 *
 * Creates test file stubs for files with low coverage.
 * Run with: pnpm tsx scripts/generate-test-stubs.ts
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname, basename } from 'path'
import { glob } from 'glob'

interface TestStubOptions {
  filePath: string
  isApiRoute: boolean
  isComponent: boolean
  isService: boolean
  isHook: boolean
  isUtil: boolean
}

/**
 * Generate test stub content based on file type
 */
function generateTestStub(options: TestStubOptions): string {
  const fileName = basename(options.filePath, '.ts').replace('.tsx', '')
  const relativePath = options.filePath.replace('/Users/admin/Sites/nself-chat/src/', '@/')

  if (options.isApiRoute) {
    return generateApiRouteTest(fileName, relativePath)
  } else if (options.isComponent) {
    return generateComponentTest(fileName, relativePath)
  } else if (options.isService) {
    return generateServiceTest(fileName, relativePath)
  } else if (options.isHook) {
    return generateHookTest(fileName, relativePath)
  } else if (options.isUtil) {
    return generateUtilTest(fileName, relativePath)
  }

  return generateGenericTest(fileName, relativePath)
}

function generateApiRouteTest(fileName: string, importPath: string): string {
  return `/**
 * API Route Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

import { NextRequest } from 'next/server'

describe('${fileName}', () => {
  describe('GET handler', () => {
    it('should handle GET requests', async () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })

    it('should require authentication', async () => {
      // TODO: Test authentication requirement
      expect(true).toBe(true)
    })

    it('should validate query parameters', async () => {
      // TODO: Test parameter validation
      expect(true).toBe(true)
    })
  })

  describe('POST handler', () => {
    it('should handle POST requests', async () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })

    it('should validate request body', async () => {
      // TODO: Test body validation
      expect(true).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      // TODO: Test error handling
      expect(true).toBe(true)
    })
  })
})
`
}

function generateComponentTest(fileName: string, importPath: string): string {
  return `/**
 * Component Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// TODO: Import component
// import { ${fileName} } from '${importPath}'

describe('${fileName}', () => {
  it('should render without crashing', () => {
    // TODO: Render component
    expect(true).toBe(true)
  })

  it('should display correct content', () => {
    // TODO: Test content rendering
    expect(true).toBe(true)
  })

  it('should handle user interactions', () => {
    // TODO: Test interactions
    expect(true).toBe(true)
  })

  it('should handle props correctly', () => {
    // TODO: Test props
    expect(true).toBe(true)
  })
})
`
}

function generateServiceTest(fileName: string, importPath: string): string {
  return `/**
 * Service Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

// TODO: Import service
// import { } from '${importPath}'

describe('${fileName}', () => {
  it('should initialize correctly', () => {
    // TODO: Test initialization
    expect(true).toBe(true)
  })

  it('should handle operations', () => {
    // TODO: Test main operations
    expect(true).toBe(true)
  })

  it('should handle errors', () => {
    // TODO: Test error handling
    expect(true).toBe(true)
  })

  it('should validate inputs', () => {
    // TODO: Test input validation
    expect(true).toBe(true)
  })
})
`
}

function generateHookTest(fileName: string, importPath: string): string {
  return `/**
 * Hook Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

import { renderHook } from '@testing-library/react'

// TODO: Import hook
// import { ${fileName} } from '${importPath}'

describe('${fileName}', () => {
  it('should initialize with default values', () => {
    // TODO: Test hook initialization
    expect(true).toBe(true)
  })

  it('should update values correctly', () => {
    // TODO: Test hook updates
    expect(true).toBe(true)
  })

  it('should handle side effects', () => {
    // TODO: Test side effects
    expect(true).toBe(true)
  })

  it('should cleanup on unmount', () => {
    // TODO: Test cleanup
    expect(true).toBe(true)
  })
})
`
}

function generateUtilTest(fileName: string, importPath: string): string {
  return `/**
 * Utility Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

// TODO: Import utilities
// import { } from '${importPath}'

describe('${fileName}', () => {
  describe('main functions', () => {
    it('should work with valid inputs', () => {
      // TODO: Test with valid inputs
      expect(true).toBe(true)
    })

    it('should handle edge cases', () => {
      // TODO: Test edge cases
      expect(true).toBe(true)
    })

    it('should handle invalid inputs', () => {
      // TODO: Test error cases
      expect(true).toBe(true)
    })
  })
})
`
}

function generateGenericTest(fileName: string, importPath: string): string {
  return `/**
 * Tests: ${fileName}
 *
 * Generated test stub - add specific test cases
 */

describe('${fileName}', () => {
  it('should be tested', () => {
    // TODO: Implement tests for ${fileName}
    expect(true).toBe(true)
  })
})
`
}

/**
 * Determine file type
 */
function analyzeFile(filePath: string): TestStubOptions {
  return {
    filePath,
    isApiRoute: filePath.includes('/app/api/'),
    isComponent: filePath.includes('/components/') && filePath.endsWith('.tsx'),
    isService:
      filePath.includes('/services/') ||
      (filePath.includes('/lib/') && filePath.includes('service')),
    isHook: filePath.includes('/hooks/') || basename(filePath).startsWith('use-'),
    isUtil: filePath.includes('/lib/') || filePath.includes('/utils/'),
  }
}

/**
 * Get test file path for source file
 */
function getTestFilePath(srcFilePath: string): string {
  const ext = srcFilePath.endsWith('.tsx') ? '.tsx' : '.ts'

  // For API routes, place in __tests__/api/
  if (srcFilePath.includes('/app/api/')) {
    const routeName = srcFilePath.split('/app/api/')[1].replace('/route.ts', '').replace(/\//g, '-')

    return join(process.cwd(), 'src', '__tests__', 'api', `${routeName}.test.ts`)
  }

  // For other files, place in __tests__ directory matching structure
  const testPath = srcFilePath.replace('/src/', '/src/__tests__/').replace(ext, `.test${ext}`)

  return testPath
}

/**
 * Main generation function
 */
async function generateStubs(): Promise<void> {
  console.log('🔨 Generating test file stubs...\n')

  // Find all TypeScript files in src/ that don't have tests
  const srcFiles = await glob('src/**/*.{ts,tsx}', {
    ignore: [
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/instrumentation*.ts',
      '**/middleware.ts',
      '**/layout.tsx',
      '**/page.tsx', // Skip Next.js pages for now
    ],
  })

  let generated = 0
  let skipped = 0

  for (const srcFile of srcFiles) {
    const fullPath = join(process.cwd(), srcFile)
    const testPath = getTestFilePath(fullPath)

    // Skip if test already exists
    if (existsSync(testPath)) {
      skipped++
      continue
    }

    // Generate test stub
    const options = analyzeFile(fullPath)
    const testContent = generateTestStub(options)

    // Create directory if needed
    mkdirSync(dirname(testPath), { recursive: true })

    // Write test file
    writeFileSync(testPath, testContent, 'utf-8')

    console.log(`✅ Generated: ${testPath.replace(process.cwd() + '/', '')}`)
    generated++

    // Limit to prevent overwhelming output
    if (generated >= 50) {
      console.log(`\n⚠️  Stopped after generating 50 test stubs to prevent overwhelming output.`)
      break
    }
  }

  console.log(`\n✨ Done! Generated ${generated} test stubs, skipped ${skipped} (already exist).\n`)
  console.log(`📝 Next steps:`)
  console.log(`  1. Review generated test files in src/__tests__/`)
  console.log(`  2. Replace TODO comments with actual test implementation`)
  console.log(`  3. Run: pnpm test to verify tests pass`)
  console.log(`  4. Run: pnpm test:coverage to check coverage improvement\n`)
}

// Run generation
generateStubs().catch((error) => {
  console.error('Fatal error generating test stubs:', error)
  process.exit(1)
})
