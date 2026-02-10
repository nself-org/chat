#!/usr/bin/env node

/**
 * Generate Missing Test Files
 * Finds source files without tests and generates test stubs
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Directories to scan
const SOURCE_DIRS = [
  'src/components',
  'src/hooks',
  'src/lib',
  'src/stores',
  'src/services',
  'src/contexts',
  'src/app/api',
]

// File patterns to test
const TEST_PATTERNS = {
  '.tsx': '.test.tsx',
  '.ts': '.test.ts',
  '.jsx': '.test.jsx',
  '.js': '.test.js',
}

// Files to exclude
const EXCLUDE_PATTERNS = [
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
  '.d.ts',
  '.stories.ts',
  '.stories.tsx',
  'index.ts',
  'index.tsx',
  'types.ts',
  'constants.ts',
  'instrumentation',
  'sentry',
  '/platforms/',
  '/.next/',
  '/node_modules/',
]

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern))
}

function findSourceFiles(dir) {
  const files = []

  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return

    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'node_modules' && entry.name !== '.next') {
          traverse(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (TEST_PATTERNS[ext] && !shouldExclude(fullPath)) {
          files.push(fullPath)
        }
      }
    }
  }

  traverse(dir)
  return files
}

function hasTestFile(sourceFile) {
  const ext = path.extname(sourceFile)
  const testExt = TEST_PATTERNS[ext]
  const dir = path.dirname(sourceFile)
  const basename = path.basename(sourceFile, ext)

  // Check in __tests__ directory
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, basename + testExt)

  // Also check for .spec files
  const specFile = path.join(testDir, basename + testExt.replace('.test', '.spec'))

  return fs.existsSync(testFile) || fs.existsSync(specFile)
}

function generateTestStub(sourceFile) {
  const ext = path.extname(sourceFile)
  const testExt = TEST_PATTERNS[ext]
  const dir = path.dirname(sourceFile)
  const basename = path.basename(sourceFile, ext)
  const testDir = path.join(dir, '__tests__')
  const testFile = path.join(testDir, basename + testExt)

  // Create __tests__ directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  // Read source file to extract exports
  const sourceContent = fs.readFileSync(sourceFile, 'utf8')

  // Detect if it's a React component
  const isReactComponent =
    sourceContent.includes('import React') ||
    sourceContent.includes("from 'react'") ||
    (sourceContent.includes('export function') && (ext === '.tsx' || ext === '.jsx'))

  // Extract exported functions/classes
  const exportMatches = sourceContent.matchAll(/export (?:const|function|class) (\w+)/g)
  const exports = Array.from(exportMatches).map((m) => m[1])

  // Generate test template
  let testContent = ''

  if (isReactComponent) {
    testContent = generateReactComponentTest(sourceFile, basename, exports)
  } else {
    testContent = generateUnitTest(sourceFile, basename, exports)
  }

  return { testFile, testContent }
}

function generateReactComponentTest(sourceFile, componentName, exports) {
  const importPath = path
    .relative(path.dirname(sourceFile), sourceFile)
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')

  return `/**
 * ${componentName} Component Tests
 *
 * TODO: Add comprehensive test coverage
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ${exports.join(', ')} } from '../${componentName}'

describe('${componentName}', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })

    it('should render with props', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })
  })

  describe('Interactions', () => {
    it('should handle user interactions', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle edge cases gracefully', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })
  })
})
`
}

function generateUnitTest(sourceFile, moduleName, exports) {
  const importPath = path
    .relative(path.dirname(sourceFile), sourceFile)
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')

  const exportTests = exports
    .map(
      (name) => `
  describe('${name}', () => {
    it('should exist', () => {
      expect(${name}).toBeDefined()
    })

    it('should work correctly', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })

    it('should handle edge cases', () => {
      // TODO: Implement test
      expect(true).toBe(true)
    })
  })`
    )
    .join('\n')

  return `/**
 * ${moduleName} Tests
 *
 * TODO: Add comprehensive test coverage
 */

import { ${exports.join(', ')} } from '../${moduleName}'

describe('${moduleName}', () => {
${
  exportTests ||
  `  it('should exist', () => {
    // TODO: Implement test
    expect(true).toBe(true)
  })`
}
})
`
}

// Main execution
console.log('\n🔍 Scanning for missing tests...\n')

const missingTests = []

for (const dir of SOURCE_DIRS) {
  const fullPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${dir} (not found)`)
    continue
  }

  const sourceFiles = findSourceFiles(fullPath)
  console.log(`📁 ${dir}: ${sourceFiles.length} source files`)

  for (const sourceFile of sourceFiles) {
    if (!hasTestFile(sourceFile)) {
      missingTests.push(sourceFile)
    }
  }
}

console.log(`\n❌ Found ${missingTests.length} files without tests\n`)

// Ask user if they want to generate stubs
const generateStubs = process.argv.includes('--generate')

if (generateStubs) {
  console.log('🔨 Generating test stubs...\n')

  let generated = 0
  for (const sourceFile of missingTests) {
    try {
      const { testFile, testContent } = generateTestStub(sourceFile)
      fs.writeFileSync(testFile, testContent)
      console.log(`✅ Generated: ${path.relative(process.cwd(), testFile)}`)
      generated++
    } catch (error) {
      console.error(`❌ Error generating test for ${sourceFile}:`, error.message)
    }
  }

  console.log(`\n✅ Generated ${generated} test stub files`)
} else {
  // Just list missing tests
  console.log('Files missing tests:\n')

  const byDirectory = {}
  missingTests.forEach((file) => {
    const dir = path.dirname(file).replace(process.cwd(), '')
    if (!byDirectory[dir]) byDirectory[dir] = []
    byDirectory[dir].push(path.basename(file))
  })

  Object.entries(byDirectory).forEach(([dir, files]) => {
    console.log(`  ${dir}/`)
    files.slice(0, 10).forEach((file) => console.log(`    - ${file}`))
    if (files.length > 10) {
      console.log(`    ... and ${files.length - 10} more`)
    }
  })

  console.log(`\n💡 Run with --generate to create test stub files\n`)
}

// Save list to file
fs.writeFileSync(
  path.join(process.cwd(), 'coverage/missing-tests.json'),
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalMissing: missingTests.length,
      files: missingTests.map((f) => path.relative(process.cwd(), f)),
    },
    null,
    2
  )
)

console.log('📄 List saved to coverage/missing-tests.json\n')
