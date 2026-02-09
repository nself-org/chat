#!/usr/bin/env ts-node
/**
 * Rollback Generator
 * Generates rollback SQL scripts for all migrations
 *
 * Task 139: Data migration and rollback rehearsals
 */

import fs from 'fs'
import path from 'path'

interface MigrationAnalysis {
  file: string
  tables: string[]
  alterations: Array<{ type: string; table: string; column?: string; constraint?: string }>
  indexes: string[]
  functions: string[]
  triggers: string[]
  views: string[]
  hasRollback: boolean
  rollbackPath?: string
  complexity: 'low' | 'medium' | 'high'
}

class RollbackGenerator {
  private migrationsDir: string
  private outputDir: string
  private analyses: MigrationAnalysis[] = []

  constructor(migrationsDir: string, outputDir: string) {
    this.migrationsDir = migrationsDir
    this.outputDir = outputDir

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  }

  /**
   * Analyze all migrations
   */
  analyzeMigrations(): void {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.endsWith('.rollback.sql'))
      .sort()

    for (const file of files) {
      const analysis = this.analyzeMigration(file)
      this.analyses.push(analysis)
    }

    console.log(`Analyzed ${this.analyses.length} migrations`)
  }

  /**
   * Analyze a single migration
   */
  private analyzeMigration(fileName: string): MigrationAnalysis {
    const filePath = path.join(this.migrationsDir, fileName)
    const sql = fs.readFileSync(filePath, 'utf-8')

    const analysis: MigrationAnalysis = {
      file: fileName,
      tables: [],
      alterations: [],
      indexes: [],
      functions: [],
      triggers: [],
      views: [],
      hasRollback: false,
      complexity: 'low',
    }

    // Check for existing rollback
    const rollbackPath = filePath.replace('.sql', '.rollback.sql')
    if (fs.existsSync(rollbackPath)) {
      analysis.hasRollback = true
      analysis.rollbackPath = rollbackPath
    }

    // Parse SQL statements
    const lines = sql.split('\n')

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase()

      // CREATE TABLE
      if (trimmed.startsWith('CREATE TABLE')) {
        const match = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:([a-z_]+)\.)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const table = match[2]
          analysis.tables.push(`${schema}.${table}`)
        }
      }

      // ALTER TABLE ADD COLUMN
      if (trimmed.includes('ALTER TABLE') && trimmed.includes('ADD COLUMN')) {
        const match = line.match(/ALTER TABLE\s+(?:([a-z_]+)\.)?([a-z_]+)\s+ADD COLUMN\s+(?:IF NOT EXISTS\s+)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const table = match[2]
          const column = match[3]
          analysis.alterations.push({
            type: 'ADD_COLUMN',
            table: `${schema}.${table}`,
            column,
          })
        }
      }

      // ALTER TABLE DROP COLUMN
      if (trimmed.includes('ALTER TABLE') && trimmed.includes('DROP COLUMN')) {
        const match = line.match(/ALTER TABLE\s+(?:([a-z_]+)\.)?([a-z_]+)\s+DROP COLUMN\s+(?:IF EXISTS\s+)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const table = match[2]
          const column = match[3]
          analysis.alterations.push({
            type: 'DROP_COLUMN',
            table: `${schema}.${table}`,
            column,
          })
          analysis.complexity = 'high' // Dropping columns is risky
        }
      }

      // ALTER TABLE ADD CONSTRAINT
      if (trimmed.includes('ALTER TABLE') && trimmed.includes('ADD CONSTRAINT')) {
        const match = line.match(/ALTER TABLE\s+(?:([a-z_]+)\.)?([a-z_]+)\s+ADD CONSTRAINT\s+([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const table = match[2]
          const constraint = match[3]
          analysis.alterations.push({
            type: 'ADD_CONSTRAINT',
            table: `${schema}.${table}`,
            constraint,
          })
        }
      }

      // CREATE INDEX
      if (trimmed.startsWith('CREATE') && trimmed.includes('INDEX')) {
        const match = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(?:([a-z_]+)\.)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const index = match[2]
          analysis.indexes.push(`${schema}.${index}`)
        }
      }

      // CREATE FUNCTION
      if (trimmed.startsWith('CREATE') && (trimmed.includes('FUNCTION') || trimmed.includes('PROCEDURE'))) {
        const match = line.match(/CREATE\s+(?:OR REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+(?:([a-z_]+)\.)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const func = match[2]
          analysis.functions.push(`${schema}.${func}`)
        }
      }

      // CREATE TRIGGER
      if (trimmed.startsWith('CREATE TRIGGER')) {
        const match = line.match(/CREATE TRIGGER\s+([a-z_]+)/i)
        if (match) {
          analysis.triggers.push(match[1])
        }
      }

      // CREATE VIEW
      if (trimmed.startsWith('CREATE') && trimmed.includes('VIEW')) {
        const match = line.match(/CREATE\s+(?:OR REPLACE\s+)?VIEW\s+(?:([a-z_]+)\.)?([a-z_]+)/i)
        if (match) {
          const schema = match[1] || 'public'
          const view = match[2]
          analysis.views.push(`${schema}.${view}`)
        }
      }
    }

    // Determine complexity
    if (analysis.alterations.length > 5 || analysis.alterations.some(a => a.type === 'DROP_COLUMN')) {
      analysis.complexity = 'high'
    } else if (analysis.alterations.length > 2 || analysis.functions.length > 0) {
      analysis.complexity = 'medium'
    }

    return analysis
  }

  /**
   * Generate rollback SQL
   */
  generateRollback(analysis: MigrationAnalysis): string {
    const statements: string[] = []

    statements.push(`-- Rollback for ${analysis.file}`)
    statements.push(`-- Generated: ${new Date().toISOString()}`)
    statements.push(`-- Complexity: ${analysis.complexity.toUpperCase()}`)
    statements.push('')
    statements.push('-- ============================================================================')
    statements.push('-- WARNING: Test this rollback script thoroughly before use!')
    statements.push('-- This is an auto-generated script and may need manual adjustments.')
    statements.push('-- ============================================================================')
    statements.push('')
    statements.push('BEGIN;')
    statements.push('')

    // Drop triggers (do first to avoid constraint violations)
    if (analysis.triggers.length > 0) {
      statements.push('-- Drop triggers')
      for (const trigger of analysis.triggers) {
        // Need to determine table name - this is a limitation
        statements.push(`-- DROP TRIGGER IF EXISTS ${trigger} ON <table_name> CASCADE;`)
      }
      statements.push('')
    }

    // Drop views
    if (analysis.views.length > 0) {
      statements.push('-- Drop views')
      for (const view of analysis.views) {
        statements.push(`DROP VIEW IF EXISTS ${view} CASCADE;`)
      }
      statements.push('')
    }

    // Revert alterations (in reverse order)
    if (analysis.alterations.length > 0) {
      statements.push('-- Revert table alterations')
      for (const alt of analysis.alterations.reverse()) {
        switch (alt.type) {
          case 'ADD_COLUMN':
            statements.push(`ALTER TABLE ${alt.table} DROP COLUMN IF EXISTS ${alt.column} CASCADE;`)
            break
          case 'DROP_COLUMN':
            statements.push(`-- WARNING: Cannot restore dropped column ${alt.column} from ${alt.table}`)
            statements.push(`-- You must restore from backup or recreate manually`)
            break
          case 'ADD_CONSTRAINT':
            statements.push(`ALTER TABLE ${alt.table} DROP CONSTRAINT IF EXISTS ${alt.constraint} CASCADE;`)
            break
        }
      }
      statements.push('')
    }

    // Drop indexes
    if (analysis.indexes.length > 0) {
      statements.push('-- Drop indexes')
      for (const index of analysis.indexes) {
        statements.push(`DROP INDEX IF EXISTS ${index} CASCADE;`)
      }
      statements.push('')
    }

    // Drop functions
    if (analysis.functions.length > 0) {
      statements.push('-- Drop functions')
      for (const func of analysis.functions) {
        statements.push(`DROP FUNCTION IF EXISTS ${func} CASCADE;`)
      }
      statements.push('')
    }

    // Drop tables (do last)
    if (analysis.tables.length > 0) {
      statements.push('-- Drop tables (WARNING: This will delete all data!)')
      for (const table of analysis.tables) {
        statements.push(`DROP TABLE IF EXISTS ${table} CASCADE;`)
      }
      statements.push('')
    }

    statements.push('COMMIT;')
    statements.push('')
    statements.push('-- Rollback complete')

    return statements.join('\n')
  }

  /**
   * Generate all rollback scripts
   */
  generateAll(): void {
    let generated = 0
    let skipped = 0

    for (const analysis of this.analyses) {
      if (analysis.hasRollback) {
        console.log(`⊘ Skipping ${analysis.file} (rollback exists)`)
        skipped++
        continue
      }

      const rollbackSQL = this.generateRollback(analysis)
      const outputPath = path.join(
        this.outputDir,
        analysis.file.replace('.sql', '.rollback.sql')
      )

      fs.writeFileSync(outputPath, rollbackSQL)
      console.log(`✓ Generated rollback for ${analysis.file}`)
      generated++
    }

    console.log('')
    console.log(`Generated: ${generated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Total: ${this.analyses.length}`)
  }

  /**
   * Generate analysis report
   */
  generateReport(): string {
    const report: string[] = []

    report.push('# Migration Analysis Report')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push('')
    report.push(`Total Migrations: ${this.analyses.length}`)
    report.push('')

    // Complexity breakdown
    const lowComplexity = this.analyses.filter(a => a.complexity === 'low').length
    const medComplexity = this.analyses.filter(a => a.complexity === 'medium').length
    const highComplexity = this.analyses.filter(a => a.complexity === 'high').length

    report.push('## Complexity Breakdown')
    report.push(`- Low: ${lowComplexity}`)
    report.push(`- Medium: ${medComplexity}`)
    report.push(`- High: ${highComplexity}`)
    report.push('')

    // Rollback coverage
    const withRollback = this.analyses.filter(a => a.hasRollback).length
    const withoutRollback = this.analyses.length - withRollback

    report.push('## Rollback Coverage')
    report.push(`- With Rollback: ${withRollback}`)
    report.push(`- Without Rollback: ${withoutRollback}`)
    report.push(`- Coverage: ${((withRollback / this.analyses.length) * 100).toFixed(1)}%`)
    report.push('')

    // High-risk migrations
    const highRisk = this.analyses.filter(a =>
      a.complexity === 'high' ||
      a.alterations.some(alt => alt.type === 'DROP_COLUMN')
    )

    if (highRisk.length > 0) {
      report.push('## High-Risk Migrations')
      report.push('')

      for (const analysis of highRisk) {
        report.push(`### ${analysis.file}`)
        report.push(`- Complexity: ${analysis.complexity}`)
        report.push(`- Has Rollback: ${analysis.hasRollback ? 'Yes' : 'No'}`)

        if (analysis.alterations.length > 0) {
          report.push('- Alterations:')
          for (const alt of analysis.alterations) {
            report.push(`  - ${alt.type}: ${alt.table}${alt.column ? `.${alt.column}` : ''}`)
          }
        }

        report.push('')
      }
    }

    // Migration details
    report.push('## All Migrations')
    report.push('')

    for (const analysis of this.analyses) {
      report.push(`### ${analysis.file}`)
      report.push(`- Complexity: ${analysis.complexity}`)
      report.push(`- Has Rollback: ${analysis.hasRollback ? 'Yes' : 'No'}`)
      report.push(`- Tables: ${analysis.tables.length}`)
      report.push(`- Alterations: ${analysis.alterations.length}`)
      report.push(`- Indexes: ${analysis.indexes.length}`)
      report.push(`- Functions: ${analysis.functions.length}`)
      report.push('')
    }

    return report.join('\n')
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)
  const migrationsDir = args[0] || path.join(__dirname, '../.backend/migrations')
  const outputDir = args[1] || path.join(__dirname, '../migrations/rollbacks')

  console.log('='.repeat(80))
  console.log('Rollback Generator')
  console.log('='.repeat(80))
  console.log(`Migrations Directory: ${migrationsDir}`)
  console.log(`Output Directory: ${outputDir}`)
  console.log('')

  const generator = new RollbackGenerator(migrationsDir, outputDir)

  // Analyze all migrations
  generator.analyzeMigrations()

  // Generate rollback scripts
  console.log('\nGenerating rollback scripts...\n')
  generator.generateAll()

  // Generate report
  const report = generator.generateReport()
  const reportPath = path.join(__dirname, '../docs/migration-analysis-report.md')
  fs.writeFileSync(reportPath, report)
  console.log(`\n✓ Analysis report saved to: ${reportPath}`)
}

if (require.main === module) {
  main()
}

export { RollbackGenerator, MigrationAnalysis }
