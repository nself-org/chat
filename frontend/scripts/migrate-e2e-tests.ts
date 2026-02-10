#!/usr/bin/env tsx
/**
 * E2E Test Migration Script
 *
 * Automatically migrates E2E tests from non-deterministic patterns
 * to deterministic patterns.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-e2e-tests.ts [--dry-run]
 */

import { readFile, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { basename } from 'path'

interface MigrationStats {
  filesProcessed: number
  filesModified: number
  dateNowReplaced: number
  timeoutsMarked: number
  mathRandomReplaced: number
}

const stats: MigrationStats = {
  filesProcessed: 0,
  filesModified: 0,
  dateNowReplaced: 0,
  timeoutsMarked: 0,
  mathRandomReplaced: 0,
}

const dryRun = process.argv.includes('--dry-run')

function extractIdPrefix(text: string): string {
  // Extract meaningful prefix from template string
  // "Test message " -> "message"
  // "Channel " -> "channel"
  // "Send test " -> "send-test"

  const words = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)

  // Take last 1-2 meaningful words
  if (words.length === 0) return 'test'
  if (words.length === 1) return words[0]
  return words.slice(-2).join('-')
}

function addImportIfMissing(content: string, importName: string): string {
  const importPath = content.includes('e2e/mobile/')
    ? '../fixtures/test-helpers'
    : './fixtures/test-helpers'

  if (content.includes(`from '${importPath}'`)) {
    // Import exists, check if it has our function
    const importMatch = content.match(
      new RegExp(`import\\s+{([^}]+)}\\s+from\\s+'${importPath.replace(/\//g, '\\/')}'`)
    )
    if (importMatch) {
      const imports = importMatch[1].split(',').map((s) => s.trim())
      if (!imports.includes(importName)) {
        // Add to existing import
        const newImports = [...imports, importName].join(', ')
        return content.replace(importMatch[0], `import { ${newImports} } from '${importPath}'`)
      }
    }
    return content
  }

  // Add new import after first import statement
  const firstImportMatch = content.match(/^import\s+.+$/m)
  if (firstImportMatch) {
    const insertPos = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
    return (
      content.substring(0, insertPos) +
      `\nimport { ${importName} } from '${importPath}'` +
      content.substring(insertPos)
    )
  }

  // No imports yet, add at top after any comments
  const firstNonComment = content.search(/^[^/\n*]/m)
  if (firstNonComment > 0) {
    return (
      content.substring(0, firstNonComment) +
      `import { ${importName} } from '${importPath}'\n\n` +
      content.substring(firstNonComment)
    )
  }

  // Add at very top
  return `import { ${importName} } from '${importPath}'\n\n${content}`
}

function migrateDateNow(content: string): string {
  let modified = content
  let count = 0

  // Pattern: `text ${Date.now()} more text`
  const pattern = /`([^`]*)\$\{Date\.now\(\)\}([^`]*)`/g
  const matches = [...content.matchAll(pattern)]

  for (const match of matches) {
    const prefix = match[1]
    const suffix = match[2]

    const idPrefix = extractIdPrefix(prefix)
    const replacement = `\`${prefix}\${generateTestId('${idPrefix}')}\${suffix}\``

    modified = modified.replace(match[0], replacement)
    count++
  }

  if (count > 0) {
    modified = addImportIfMissing(modified, 'generateTestId')
    stats.dateNowReplaced += count
  }

  return modified
}

function markWaitForTimeout(content: string): string {
  let modified = content
  let count = 0

  // Pattern: await page.waitForTimeout(1000)
  // Pattern: await element.waitForTimeout(1000)
  const pattern = /await\s+(page|element|device)\.waitForTimeout\((\d+)\)/g
  const matches = [...content.matchAll(pattern)]

  for (const match of matches) {
    // Don't modify if already has TODO
    const lineStart = content.lastIndexOf('\n', match.index || 0)
    const lineContent = content.substring(lineStart, (match.index || 0) + match[0].length)

    if (!lineContent.includes('TODO')) {
      const replacement = `// TODO: Replace with proper wait condition (was ${match[2]}ms timeout)\n      ${match[0]}`
      modified = modified.replace(match[0], replacement)
      count++
    }
  }

  stats.timeoutsMarked += count
  return modified
}

function migrateMathRandom(content: string): string {
  let modified = content
  let count = 0

  // Pattern: Math.random()
  const pattern = /Math\.random\(\)/g
  const matches = [...content.matchAll(pattern)]

  if (matches.length > 0) {
    // Add SeededRandom import
    modified = addImportIfMissing(modified, 'SeededRandom')

    // Add TODO comment
    for (const match of matches) {
      const replacement = `/* TODO: Use SeededRandom */ Math.random()`
      modified = modified.replace(match[0], replacement)
      count++
    }

    stats.mathRandomReplaced += count
  }

  return modified
}

async function migrateFile(filePath: string): Promise<boolean> {
  stats.filesProcessed++

  const originalContent = await readFile(filePath, 'utf-8')
  let content = originalContent

  // Skip if already migrated (has test-helpers import and no Date.now)
  if (
    content.includes('from \'./fixtures/test-helpers\'') &&
    !content.includes('Date.now()') &&
    !content.includes('Math.random()')
  ) {
    return false
  }

  // Apply migrations
  content = migrateDateNow(content)
  content = markWaitForTimeout(content)
  content = migrateMathRandom(content)

  // Check if modified
  if (content === originalContent) {
    return false
  }

  // Write back
  if (!dryRun) {
    await writeFile(filePath, content, 'utf-8')
  }

  stats.filesModified++
  return true
}

async function main() {
  console.log('🔄 E2E Test Migration Script\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  // Find all test files
  const testFiles = await glob('e2e/**/*.spec.ts', {
    ignore: ['**/node_modules/**', '**/fixtures/**'],
  })

  console.log(`Found ${testFiles.length} test files\n`)

  // Process each file
  for (const file of testFiles) {
    const modified = await migrateFile(file)

    if (modified) {
      console.log(`✅ Modified: ${basename(file)}`)
    } else {
      console.log(`⏭️  Skipped: ${basename(file)}`)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Files Processed:      ${stats.filesProcessed}`)
  console.log(`Files Modified:       ${stats.filesModified}`)
  console.log(`Date.now() Replaced:  ${stats.dateNowReplaced}`)
  console.log(`Timeouts Marked:      ${stats.timeoutsMarked}`)
  console.log(`Math.random() Marked: ${stats.mathRandomReplaced}`)
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No files were modified')
    console.log('Run without --dry-run to apply changes')
  } else {
    console.log('\n✅ Migration complete!')
  }

  // Print next steps
  if (stats.filesModified > 0 && !dryRun) {
    console.log('\nNEXT STEPS:')
    console.log('1. Review the changes: git diff')
    console.log('2. Search for "TODO" comments in test files')
    console.log('3. Replace waitForTimeout with proper wait conditions')
    console.log('4. Replace Math.random() with SeededRandom')
    console.log('5. Run tests to verify: pnpm test:e2e')
    console.log('6. See docs/E2E-DETERMINISTIC-MIGRATION.md for details')
  }
}

main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
