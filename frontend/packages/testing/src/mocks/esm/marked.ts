/**
 * Marked Mock for Jest Tests
 *
 * Mocks the marked package to avoid ESM compatibility issues.
 * Provides basic markdown conversion for testing purposes.
 *
 * @module @nself-chat/testing/mocks/esm/marked
 */

/**
 * Simple markdown to HTML conversion for tests
 */
const convertMarkdown = (src: string): string => {
  if (!src) return ''

  return src
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>')
}

/**
 * Main marked function - converts markdown to HTML
 */
export const marked = jest.fn((src: string, _options?: unknown) => convertMarkdown(src))

/**
 * Synchronous parse function
 */
export const parse = jest.fn((src: string, _options?: unknown) => convertMarkdown(src))

// Add parse as a method on marked
;(marked as any).parse = parse

/**
 * Parse inline markdown (no block elements)
 */
marked.parseInline = jest.fn((src: string, _options?: unknown) => {
  if (!src) return ''
  return src
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
})

/**
 * Set marked options
 */
marked.options = jest.fn((_options: unknown) => marked)
marked.setOptions = jest.fn((_options: unknown) => marked)

/**
 * Get default options
 */
marked.getDefaults = jest.fn(() => ({}))

/**
 * Use extensions/plugins
 */
marked.use = jest.fn((..._extensions: unknown[]) => marked)

/**
 * Walk through tokens
 */
marked.walkTokens = jest.fn((_tokens: unknown[], _callback: unknown) => {})

// Export additional functions
export const defaults = {}
export const getDefaults = () => ({})
export const options = marked.options
export const setOptions = marked.setOptions
export const use = marked.use
export const walkTokens = marked.walkTokens
export const parseInline = marked.parseInline

/**
 * Lexer mock - tokenizes markdown
 */
export class Lexer {
  static lex = jest.fn((src: string) => [{ type: 'paragraph', text: src }])
  lex = Lexer.lex
}

/**
 * Parser mock - converts tokens to HTML
 */
export class Parser {
  static parse = jest.fn((_tokens: unknown[]) => '<p>parsed</p>')
  parse = Parser.parse
}

/**
 * Renderer mock - renders HTML elements
 */
export class Renderer {
  code = jest.fn((code: string) => `<pre><code>${code}</code></pre>`)
  blockquote = jest.fn((quote: string) => `<blockquote>${quote}</blockquote>`)
  heading = jest.fn((text: string, level: number) => `<h${level}>${text}</h${level}>`)
  paragraph = jest.fn((text: string) => `<p>${text}</p>`)
  link = jest.fn((href: string, _title: string | null, text: string) =>
    `<a href="${href}">${text}</a>`
  )
  image = jest.fn((href: string, _title: string | null, text: string) =>
    `<img src="${href}" alt="${text}">`
  )
  text = jest.fn((text: string) => text)
}

/**
 * TextRenderer mock - renders plain text
 */
export class TextRenderer extends Renderer {}

/**
 * Tokenizer mock - creates tokens from markdown
 */
export class Tokenizer {}

/**
 * Hooks mock - lifecycle hooks
 */
export class Hooks {}

/**
 * Marked class - main API
 */
export class Marked {
  parse = marked
  parseInline = marked.parseInline
  use = marked.use
  setOptions = marked.setOptions
  defaults = {}
}

export const lexer = Lexer.lex
export const parser = Parser.parse

export default marked
