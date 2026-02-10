#!/usr/bin/env tsx
/**
 * Translation Generation Script
 *
 * This script copies translation files from English to target languages
 * as templates for human/AI translation. In production, these would be
 * professionally translated, but for now we create the structure.
 *
 * Usage:
 *   pnpm tsx scripts/generate-translations.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const SOURCE_LOCALE = 'en'

// Priority languages with detailed metadata
const TARGET_LANGUAGES = [
  // Top 10 languages (professional translation recommended)
  { code: 'es', name: 'Spanish', rtl: false, priority: 'HIGH' },
  { code: 'fr', name: 'French', rtl: false, priority: 'HIGH' },
  { code: 'ar', name: 'Arabic', rtl: true, priority: 'HIGH' },
  { code: 'zh', name: 'Chinese (Simplified)', rtl: false, priority: 'HIGH' },
  { code: 'pt', name: 'Portuguese', rtl: false, priority: 'HIGH' },
  { code: 'ru', name: 'Russian', rtl: false, priority: 'HIGH' },
  { code: 'it', name: 'Italian', rtl: false, priority: 'HIGH' },
  { code: 'ko', name: 'Korean', rtl: false, priority: 'HIGH' },
  { code: 'he', name: 'Hebrew', rtl: true, priority: 'HIGH' },
  { code: 'hi', name: 'Hindi', rtl: false, priority: 'HIGH' },

  // Additional 40+ languages (machine translation acceptable)
  { code: 'nl', name: 'Dutch', rtl: false, priority: 'MEDIUM' },
  { code: 'pl', name: 'Polish', rtl: false, priority: 'MEDIUM' },
  { code: 'tr', name: 'Turkish', rtl: false, priority: 'MEDIUM' },
  { code: 'sv', name: 'Swedish', rtl: false, priority: 'MEDIUM' },
  { code: 'da', name: 'Danish', rtl: false, priority: 'MEDIUM' },
  { code: 'no', name: 'Norwegian', rtl: false, priority: 'MEDIUM' },
  { code: 'fi', name: 'Finnish', rtl: false, priority: 'MEDIUM' },
  { code: 'cs', name: 'Czech', rtl: false, priority: 'MEDIUM' },
  { code: 'hu', name: 'Hungarian', rtl: false, priority: 'MEDIUM' },
  { code: 'ro', name: 'Romanian', rtl: false, priority: 'MEDIUM' },
  { code: 'uk', name: 'Ukrainian', rtl: false, priority: 'MEDIUM' },
  { code: 'el', name: 'Greek', rtl: false, priority: 'MEDIUM' },
  { code: 'bg', name: 'Bulgarian', rtl: false, priority: 'MEDIUM' },
  { code: 'sr', name: 'Serbian', rtl: false, priority: 'MEDIUM' },
  { code: 'hr', name: 'Croatian', rtl: false, priority: 'MEDIUM' },
  { code: 'sk', name: 'Slovak', rtl: false, priority: 'MEDIUM' },
  { code: 'sl', name: 'Slovenian', rtl: false, priority: 'MEDIUM' },
  { code: 'et', name: 'Estonian', rtl: false, priority: 'MEDIUM' },
  { code: 'lv', name: 'Latvian', rtl: false, priority: 'MEDIUM' },
  { code: 'lt', name: 'Lithuanian', rtl: false, priority: 'MEDIUM' },
  { code: 'th', name: 'Thai', rtl: false, priority: 'MEDIUM' },
  { code: 'vi', name: 'Vietnamese', rtl: false, priority: 'MEDIUM' },
  { code: 'id', name: 'Indonesian', rtl: false, priority: 'MEDIUM' },
  { code: 'ms', name: 'Malay', rtl: false, priority: 'MEDIUM' },
  { code: 'fa', name: 'Persian', rtl: true, priority: 'MEDIUM' },
  { code: 'ur', name: 'Urdu', rtl: true, priority: 'MEDIUM' },
  { code: 'bn', name: 'Bengali', rtl: false, priority: 'MEDIUM' },
  { code: 'ta', name: 'Tamil', rtl: false, priority: 'MEDIUM' },
  { code: 'te', name: 'Telugu', rtl: false, priority: 'MEDIUM' },
  { code: 'mr', name: 'Marathi', rtl: false, priority: 'MEDIUM' },
  { code: 'sw', name: 'Swahili', rtl: false, priority: 'MEDIUM' },
  { code: 'af', name: 'Afrikaans', rtl: false, priority: 'MEDIUM' },
  { code: 'am', name: 'Amharic', rtl: false, priority: 'MEDIUM' },
  { code: 'az', name: 'Azerbaijani', rtl: false, priority: 'MEDIUM' },
  { code: 'ka', name: 'Georgian', rtl: false, priority: 'MEDIUM' },
  { code: 'kk', name: 'Kazakh', rtl: false, priority: 'MEDIUM' },
  { code: 'km', name: 'Khmer', rtl: false, priority: 'MEDIUM' },
  { code: 'lo', name: 'Lao', rtl: false, priority: 'MEDIUM' },
  { code: 'my', name: 'Burmese', rtl: false, priority: 'MEDIUM' },
  { code: 'ne', name: 'Nepali', rtl: false, priority: 'MEDIUM' },
  { code: 'si', name: 'Sinhala', rtl: false, priority: 'MEDIUM' },
  { code: 'tl', name: 'Tagalog', rtl: false, priority: 'LOW' },
]

// Translation namespaces (all 6 must exist)
const NAMESPACES = ['common', 'chat', 'settings', 'admin', 'auth', 'errors']

interface TranslationStats {
  created: number
  skipped: number
  errors: string[]
}

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
}

function copyTranslationFile(
  sourceFile: string,
  targetFile: string,
  langCode: string,
  langName: string,
  namespace: string
): boolean {
  try {
    if (fs.existsSync(targetFile)) {
      console.log(`   ⏭️  Skipped ${namespace}.json (already exists)`)
      return false
    }

    const content = fs.readFileSync(sourceFile, 'utf8')
    const json = JSON.parse(content)

    // Add metadata comment at the top
    const metadata = {
      _meta: {
        language: langName,
        code: langCode,
        namespace: namespace,
        version: '1.0.0',
        status: 'needs_translation',
        note: 'This file contains English text as placeholders. Professional translation required.',
        lastUpdated: new Date().toISOString(),
      },
      ...json,
    }

    fs.writeFileSync(targetFile, JSON.stringify(metadata, null, 2) + '\n', 'utf8')
    console.log(`   ✅ Created ${namespace}.json`)
    return true
  } catch (error) {
    console.error(`   ❌ Error creating ${namespace}.json:`, error)
    return false
  }
}

function generateTranslationsForLanguage(
  langCode: string,
  langName: string,
  priority: string
): TranslationStats {
  const stats: TranslationStats = {
    created: 0,
    skipped: 0,
    errors: [],
  }

  console.log(`\n🌍 ${langName} (${langCode}) [${priority}]`)

  const targetDir = path.join(LOCALES_DIR, langCode)
  ensureDirectoryExists(targetDir)

  for (const namespace of NAMESPACES) {
    const sourceFile = path.join(LOCALES_DIR, SOURCE_LOCALE, `${namespace}.json`)
    const targetFile = path.join(targetDir, `${namespace}.json`)

    if (!fs.existsSync(sourceFile)) {
      const error = `Source file not found: ${sourceFile}`
      stats.errors.push(error)
      console.error(`   ❌ ${error}`)
      continue
    }

    const created = copyTranslationFile(sourceFile, targetFile, langCode, langName, namespace)
    if (created) {
      stats.created++
    } else {
      stats.skipped++
    }
  }

  // Create README for the language
  const readmePath = path.join(targetDir, 'README.md')
  if (!fs.existsSync(readmePath)) {
    const readme = `# ${langName} (${langCode}) Translations

## Status
- **Priority**: ${priority}
- **Completion**: ${stats.skipped}/${NAMESPACES.length} files (${Math.round((stats.skipped / NAMESPACES.length) * 100)}%)
- **Last Updated**: ${new Date().toISOString()}

## Translation Guidelines

### For Professional Translators
1. Maintain the JSON structure exactly as provided
2. Translate only the **values**, never the **keys**
3. Preserve placeholders like \`{{name}}\`, \`{{count}}\`, etc.
4. Respect pluralization patterns (\`_zero\`, \`_one\`, \`_other\`)
5. Keep formatting tags like \`<strong>\`, \`<em>\` in place
6. Adapt idioms and expressions to be culturally appropriate
7. Maintain consistent terminology across all files

### Context
- **common.json**: General UI elements, buttons, navigation
- **chat.json**: Messaging features, channels, threads
- **settings.json**: User preferences, profile settings
- **admin.json**: Administrative dashboard, moderation
- **auth.json**: Authentication flows, sign in/up
- **errors.json**: Error messages, validations

### Pluralization
For languages with complex plural rules, ensure all plural forms are provided:
- English: \`_one\`, \`_other\`
- Arabic: \`_zero\`, \`_one\`, \`_two\`, \`_few\`, \`_many\`, \`_other\`
- Russian/Polish: \`_one\`, \`_few\`, \`_many\`, \`_other\`

### Quality Standards
- ✅ Native speaker translation preferred
- ✅ Contextually accurate
- ✅ Natural language flow
- ✅ Professional tone
- ✅ Tested with RTL layouts (if applicable)

## Files
${NAMESPACES.map((ns) => `- [ ] ${ns}.json`).join('\n')}

## How to Contribute
1. Fork the repository
2. Translate one or more namespace files
3. Remove the \`_meta.status: "needs_translation"\` field when complete
4. Test your translations in the app
5. Submit a pull request
6. Request review from a native speaker

## Contact
For translation questions or to coordinate efforts, open an issue on GitHub.
`
    fs.writeFileSync(readmePath, readme, 'utf8')
    console.log(`   📄 Created README.md`)
  }

  return stats
}

function generateReport(allStats: Array<{ lang: string; stats: TranslationStats }>): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 TRANSLATION GENERATION REPORT')
  console.log('='.repeat(80))

  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const { lang, stats } of allStats) {
    totalCreated += stats.created
    totalSkipped += stats.skipped
    totalErrors += stats.errors.length

    if (stats.created > 0 || stats.errors.length > 0) {
      console.log(`\n${lang}:`)
      console.log(`  ✅ Created: ${stats.created}`)
      console.log(`  ⏭️  Skipped: ${stats.skipped}`)
      if (stats.errors.length > 0) {
        console.log(`  ❌ Errors: ${stats.errors.length}`)
        stats.errors.forEach((err) => console.log(`     - ${err}`))
      }
    }
  }

  console.log('\n' + '-'.repeat(80))
  console.log(`TOTALS:`)
  console.log(`  Languages: ${allStats.length}`)
  console.log(`  Files Created: ${totalCreated}`)
  console.log(`  Files Skipped: ${totalSkipped}`)
  console.log(`  Errors: ${totalErrors}`)
  console.log(`  Total Files: ${totalCreated + totalSkipped}`)
  console.log('-'.repeat(80))

  // Calculate coverage
  const totalLanguages = allStats.length
  const totalFiles = totalLanguages * NAMESPACES.length
  const existingFiles = totalSkipped + totalCreated
  const coveragePercent = ((existingFiles / totalFiles) * 100).toFixed(1)

  console.log(`\n📈 Translation Coverage: ${existingFiles}/${totalFiles} (${coveragePercent}%)`)

  // List languages that need professional translation
  console.log(`\n⚠️  HIGH PRIORITY (Professional Translation Needed):`)
  const highPriority = TARGET_LANGUAGES.filter((l) => l.priority === 'HIGH')
  highPriority.forEach((lang) => {
    const stat = allStats.find((s) => s.lang === lang.name)
    if (stat) {
      const completion = ((stat.stats.skipped / NAMESPACES.length) * 100).toFixed(0)
      console.log(`  - ${lang.name} (${lang.code}): ${completion}% complete`)
    }
  })

  console.log(`\n✅ Next Steps:`)
  console.log(`  1. Review generated translation templates`)
  console.log(`  2. Send high-priority languages to professional translators`)
  console.log(`  3. Use machine translation for medium-priority languages`)
  console.log(`  4. Test RTL layouts for Arabic, Hebrew, Persian, Urdu`)
  console.log(`  5. Run: pnpm tsx scripts/validate-translations.ts`)
  console.log('')
}

// Main execution
function main() {
  console.log('🌐 Translation File Generation Script')
  console.log('=====================================\n')
  console.log(`Source locale: ${SOURCE_LOCALE}`)
  console.log(`Target languages: ${TARGET_LANGUAGES.length}`)
  console.log(`Namespaces: ${NAMESPACES.join(', ')}\n`)

  const allStats: Array<{ lang: string; stats: TranslationStats }> = []

  for (const lang of TARGET_LANGUAGES) {
    const stats = generateTranslationsForLanguage(lang.code, lang.name, lang.priority)
    allStats.push({ lang: lang.name, stats })
  }

  generateReport(allStats)
}

main()
