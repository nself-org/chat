/**
 * YAML Mock for Jest Tests
 *
 * Mocks the yaml package for testing purposes.
 *
 * @module @nself-chat/testing/mocks/esm/yaml
 */

/**
 * Parse YAML string to JavaScript object
 */
export const parse = jest.fn((str: string): any => {
  if (!str || str.trim() === '') return null

  try {
    // Very basic YAML parser for testing
    // Real implementation would use full YAML spec
    const lines = str.split('\n')
    const result: any = {}

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return

      const colonIndex = trimmed.indexOf(':')
      if (colonIndex === -1) return

      const key = trimmed.substring(0, colonIndex).trim()
      let value = trimmed.substring(colonIndex + 1).trim()

      // Handle quoted strings
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1)
      }

      // Handle booleans and numbers
      if (value === 'true') {
        result[key] = true
      } else if (value === 'false') {
        result[key] = false
      } else if (!isNaN(Number(value)) && value !== '') {
        result[key] = Number(value)
      } else {
        result[key] = value
      }
    })

    return result
  } catch (error) {
    throw new Error(`YAML parse error: ${error}`)
  }
})

/**
 * Stringify JavaScript object to YAML
 */
export const stringify = jest.fn((obj: any): string => {
  if (obj === null || obj === undefined) return ''

  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Quote strings with special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        lines.push(`${key}: "${value}"`)
      } else {
        lines.push(`${key}: ${value}`)
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`)
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${key}:`)
      // Simple indentation for nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        lines.push(`  ${nestedKey}: ${nestedValue}`)
      }
    }
  }

  return lines.join('\n')
})

/**
 * Parse all YAML documents in a string
 */
export const parseAllDocuments = jest.fn((str: string): any[] => {
  // Split by document separator
  const docs = str.split(/^---$/m)
  return docs.filter((doc) => doc.trim()).map((doc) => parse(doc))
})

/**
 * Document class for YAML parsing
 */
export class Document {
  contents: any

  constructor(value?: any) {
    this.contents = value
  }

  toString() {
    return stringify(this.contents)
  }

  toJS() {
    return this.contents
  }
}

/**
 * Create a new YAML document
 */
export const parseDocument = jest.fn((str: string) => {
  return new Document(parse(str))
})

export default {
  parse,
  stringify,
  parseAllDocuments,
  parseDocument,
  Document,
}
