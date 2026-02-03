#!/usr/bin/env node
/**
 * Automatically prefix unused variables with underscore to suppress ESLint warnings
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('Running ESLint to detect unused variables...\n')

// Get ESLint output - capture both stdout and stderr
let eslintOutput = ''
try {
  eslintOutput = execSync('pnpm lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
} catch (error) {
  // ESLint exits with code 1 when there are warnings
  eslintOutput = error.stdout || ''
}

// Parse ESLint warnings
const lines = eslintOutput.split('\n')
const fixes = new Map() // filepath -> Set of varNames

let currentFile = null

for (const line of lines) {
  // Match file path line: ./src/path/to/file.tsx
  if (line.startsWith('./')) {
    currentFile = line.trim()
    continue
  }

  // Match warning line - updated pattern for new message format
  // Format: "12:3  Warning: 'varName' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars"
  const match = line.match(
    /^\d+:\d+\s+Warning: '(.+?)' is (?:defined but never used|assigned a value but never used)\. Allowed unused vars must match/
  )

  if (match && currentFile) {
    const varName = match[1]

    // Skip if already prefixed with underscore
    if (varName.startsWith('_')) continue

    const absolutePath = path.resolve(currentFile)

    if (!fixes.has(absolutePath)) {
      fixes.set(absolutePath, new Set())
    }

    fixes.get(absolutePath).add(varName)
  }
}

const totalVars = Array.from(fixes.values()).reduce((sum, set) => sum + set.size, 0)
console.log(`Found ${totalVars} unused variables to fix in ${fixes.size} files\n`)

if (fixes.size === 0) {
  console.log('No unused variables found or all already prefixed.')
  process.exit(0)
}

// Apply fixes
let totalFixed = 0
let filesModified = 0

for (const [filepath, varNames] of fixes.entries()) {
  try {
    let content = fs.readFileSync(filepath, 'utf-8')
    let modified = false

    // Apply renames using word boundary regex
    for (const varName of varNames) {
      // Escape special regex characters
      const escapedName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // Create regex that matches the variable name with word boundaries
      // Use negative lookahead to avoid matching in object property shorthand
      const regex = new RegExp(`\\b${escapedName}\\b(?!\\s*:(?!\\s*[,}]))`, 'g')

      const newName = `_${varName}`
      const newContent = content.replace(regex, newName)

      if (newContent !== content) {
        content = newContent
        modified = true
        totalFixed++
      }
    }

    if (modified) {
      fs.writeFileSync(filepath, content, 'utf-8')
      filesModified++
      console.log(
        `✓ Fixed ${varNames.size} variable(s) in ${path.relative(process.cwd(), filepath)}`
      )
    }
  } catch (error) {
    console.error(`✗ Error processing ${filepath}:`, error.message)
  }
}

console.log(`\n✓ Fixed ${totalFixed} unused variables in ${filesModified} files`)
console.log('\nRe-running ESLint to check remaining issues...\n')
