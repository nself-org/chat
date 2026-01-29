#!/usr/bin/env node
/**
 * Fix unused function arguments and catch errors by prefixing with underscore
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running ESLint to detect unused args and catch errors...\n');

let eslintOutput = '';
try {
  eslintOutput = execSync('pnpm lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (error) {
  eslintOutput = error.stdout || '';
}

const lines = eslintOutput.split('\n');
const fixes = new Map(); // filepath -> array of {line, col, oldName, type}

let currentFile = null;

for (const line of lines) {
  if (line.startsWith('./')) {
    currentFile = line.trim();
    continue;
  }

  // Match unused args: "13:36  Warning: 'secret' is defined but never used. Allowed unused args must match /^_/u."
  const argsMatch = line.match(/^(\d+):(\d+)\s+Warning: '(.+?)' is defined but never used\. Allowed unused args must match/);

  // Match unused catch errors: "120:16  Warning: 'error' is defined but never used. Allowed unused caught errors must match /^_/u."
  const catchMatch = line.match(/^(\d+):(\d+)\s+Warning: '(.+?)' is defined but never used\. Allowed unused caught errors must match/);

  const match = argsMatch || catchMatch;

  if (match && currentFile) {
    const lineNum = parseInt(match[1]);
    const col = parseInt(match[2]);
    const varName = match[3];

    if (varName.startsWith('_')) continue;

    const absolutePath = path.resolve(currentFile);

    if (!fixes.has(absolutePath)) {
      fixes.set(absolutePath, []);
    }

    fixes.get(absolutePath).push({
      line: lineNum,
      col: col,
      oldName: varName,
      type: catchMatch ? 'catch' : 'arg'
    });
  }
}

const totalVars = Array.from(fixes.values()).reduce((sum, arr) => sum + arr.length, 0);
console.log(`Found ${totalVars} unused args/catches to fix in ${fixes.size} files\n`);

if (fixes.size === 0) {
  console.log('No unused args/catches found or all already prefixed.');
  process.exit(0);
}

let totalFixed = 0;
let filesModified = 0;

for (const [filepath, fileFixes] of fixes.entries()) {
  try {
    let content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Process each fix
    for (const fix of fileFixes) {
      const lineIndex = fix.line - 1;
      if (lineIndex < 0 || lineIndex >= lines.length) continue;

      const originalLine = lines[lineIndex];

      // For catch errors: replace "catch (error)" with "catch (_error)"
      // For args: replace the parameter name
      const escapedName = fix.oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create a regex that matches the variable as a parameter or catch variable
      // Matches: (varName), (varName,), (varName:), (varName )
      const paramRegex = new RegExp(`\\(([^)]*\\b)${escapedName}(\\b[^)]*\\))`, 'g');

      const newLine = originalLine.replace(paramRegex, (match, before, after) => {
        return `(${before}_${fix.oldName}${after}`;
      });

      if (newLine !== originalLine) {
        lines[lineIndex] = newLine;
        modified = true;
        totalFixed++;
      }
    }

    if (modified) {
      fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');
      filesModified++;
      console.log(`✓ Fixed ${fileFixes.length} arg(s)/catch(es) in ${path.relative(process.cwd(), filepath)}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filepath}:`, error.message);
  }
}

console.log(`\n✓ Fixed ${totalFixed} unused args/catches in ${filesModified} files`);
