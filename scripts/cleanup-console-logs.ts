#!/usr/bin/env ts-node
/**
 * Console Log Cleanup Script
 *
 * Systematically removes or replaces console.log statements across the codebase
 * for production readiness.
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface CleanupStats {
  filesProcessed: number
  consoleStatementsRemoved: number
  consoleStatementsReplaced: number
  filesSkipped: number
  errors: string[]
}

const stats: CleanupStats = {
  filesProcessed: 0,
  consoleStatementsRemoved: 0,
  consoleStatementsReplaced: 0,
  filesSkipped: 0,
  errors: [],
}

// Patterns to remove (debug/development logs)
const REMOVE_PATTERNS = [
  /^\s*console\.log\([^)]*\);?\s*$/gm,
  /^\s*console\.debug\([^)]*\);?\s*$/gm,
  /^\s*\/\/ console\.(log|debug|info)\([^)]*\);?\s*$/gm, // Already commented
]

// Patterns to keep but replace with logger (errors, warnings)
const REPLACE_PATTERNS = [
  {
    pattern: /console\.error\((['"`])(\[.*?\]\s*)?([^'"`]*)\1,\s*(.*?)\)/g,
    replacement: "log.error('$3', $4)",
  },
  {
    pattern: /console\.warn\((['"`])(\[.*?\]\s*)?([^'"`]*)\1,\s*(.*?)\)/g,
    replacement: "log.warn('$3', { context: $4 })",
  },
  {
    pattern: /console\.error\((['"`])(\[.*?\]\s*)?([^'"`]*)\1\)/g,
    replacement: "log.error('$3')",
  },
  {
    pattern: /console\.warn\((['"`])(\[.*?\]\s*)?([^'"`]*)\1\)/g,
    replacement: "log.warn('$3')",
  },
]

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.backend/,
  /dist/,
  /build/,
  /__tests__/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /examples?\//,
]

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath))
}

function getModuleName(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath)
  const parts = relativePath.split(path.sep)

  // Extract meaningful scope name
  if (parts.includes('lib')) {
    const libIndex = parts.indexOf('lib')
    if (parts[libIndex + 1]) {
      return parts[libIndex + 1]
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    }
  }

  if (parts.includes('services')) {
    const svcIndex = parts.indexOf('services')
    if (parts[svcIndex + 1]) {
      return parts[svcIndex + 1]
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    }
  }

  // Default to file name
  return path
    .basename(filePath, path.extname(filePath))
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function hasLoggerImport(content: string): boolean {
  return /import.*logger/.test(content)
}

function addLoggerImport(content: string, moduleName: string): string {
  // Check if already has logger
  if (hasLoggerImport(content)) {
    return content
  }

  // Find the last import statement
  const lines = content.split('\n')
  let lastImportIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) {
      lastImportIndex = i
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(
      lastImportIndex + 1,
      0,
      `import { createLogger } from '@/lib/logger'`,
      ``,
      `const log = createLogger('${moduleName}')`
    )
    return lines.join('\n')
  }

  // No imports found, add at top after any comments
  let insertIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (!/^\/\/|^\/\*|^\s*$/.test(lines[i])) {
      insertIndex = i
      break
    }
  }

  lines.splice(
    insertIndex,
    0,
    `import { createLogger } from '@/lib/logger'`,
    ``,
    `const log = createLogger('${moduleName}')`,
    ``
  )

  return lines.join('\n')
}

function cleanupFile(filePath: string): boolean {
  try {
    if (shouldSkipFile(filePath)) {
      stats.filesSkipped++
      return false
    }

    let content = fs.readFileSync(filePath, 'utf-8')
    const originalContent = content
    let modified = false

    // Count console statements before cleanup
    const consoleBefore = (content.match(/console\.(log|debug|info|warn|error)/g) || []).length

    // Remove debug console statements
    for (const pattern of REMOVE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        content = content.replace(pattern, '')
        stats.consoleStatementsRemoved += matches.length
        modified = true
      }
    }

    // Check if file still has console.error or console.warn
    const hasImportantConsole = /console\.(error|warn)/.test(content)

    if (hasImportantConsole) {
      // Add logger import
      const moduleName = getModuleName(filePath)
      content = addLoggerImport(content, moduleName)

      // Replace console.error and console.warn with logger
      for (const { pattern, replacement } of REPLACE_PATTERNS) {
        const matches = content.match(pattern)
        if (matches) {
          content = content.replace(pattern, replacement)
          stats.consoleStatementsReplaced += matches.length
          modified = true
        }
      }
    }

    // Clean up multiple empty lines
    content = content.replace(/\n{3,}/g, '\n\n')

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8')
      stats.filesProcessed++

      const consoleAfter = (content.match(/console\.(log|debug|info|warn|error)/g) || []).length
      const reduction = consoleBefore - consoleAfter

      console.log(
        `✓ ${path.relative(process.cwd(), filePath)} (removed ${reduction} console statements)`
      )
      return true
    }

    return false
  } catch (error) {
    stats.errors.push(`Error processing ${filePath}: ${error}`)
    return false
  }
}

async function main() {
  console.log('Starting console log cleanup...\n')

  // Find all TypeScript files in src
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/examples/**', '**/__tests__/**'],
    absolute: true,
  })

  console.log(`Found ${files.length} files to process\n`)

  // Process files
  for (const file of files) {
    cleanupFile(file)
  }

  // Print stats
  console.log('\n' + '='.repeat(80))
  console.log('Cleanup Summary:')
  console.log('='.repeat(80))
  console.log(`Files processed: ${stats.filesProcessed}`)
  console.log(`Files skipped: ${stats.filesSkipped}`)
  console.log(`Console statements removed: ${stats.consoleStatementsRemoved}`)
  console.log(`Console statements replaced with logger: ${stats.consoleStatementsReplaced}`)

  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`)
    stats.errors.forEach((error) => console.log(`  - ${error}`))
  }

  console.log('\n✅ Cleanup complete!')
}

main().catch(console.error)
