# Code Snippets & Syntax Highlighting Guide

Complete guide to using code snippets and syntax highlighting in nself-chat.

## Overview

The code highlighting system provides:

- **Inline Code**: Backtick syntax for inline code snippets
- **Code Blocks**: Triple backtick syntax with 100+ language support
- **Syntax Highlighting**: Using lowlight (highlight.js) for accurate highlighting
- **Interactive Features**: Copy, download, expand/collapse, line numbers
- **Code Snippet Modal**: Create and share formatted code snippets
- **Theme Support**: Automatic light/dark mode switching

## Components

### 1. InlineCode Component

**Location**: `/src/components/chat/InlineCode.tsx`

Renders inline code with monospace font and background highlighting.

```tsx
import { InlineCode } from '@/components/chat/InlineCode'
;<InlineCode>const greeting = "Hello"</InlineCode>
```

**Features**:

- Monospace font
- Background highlight
- Click to copy
- Theme-aware colors

### 2. CodeBlock Component

**Location**: `/src/components/chat/CodeBlock.tsx`

Full-featured code block with syntax highlighting.

```tsx
import { CodeBlock } from '@/components/chat/CodeBlock'
;<CodeBlock
  code={sourceCode}
  language="typescript"
  filename="example.ts"
  showLineNumbers={true}
  maxHeight={500}
/>
```

**Props**:

| Prop              | Type       | Default     | Description                |
| ----------------- | ---------- | ----------- | -------------------------- |
| `code`            | `string`   | required    | Source code to highlight   |
| `language`        | `string`   | auto-detect | Programming language       |
| `filename`        | `string`   | undefined   | Display filename in header |
| `showLineNumbers` | `boolean`  | `true`      | Show line numbers          |
| `maxHeight`       | `number`   | `500`       | Max height in pixels       |
| `onExpand`        | `function` | undefined   | Callback for expand button |

**Features**:

- Syntax highlighting for 100+ languages
- Line numbers with hover effects
- Copy button with success feedback
- Download button (saves as file)
- Expand/collapse for long code (>20 lines)
- Language badge
- Auto-detect language from filename or content

### 3. CodeSnippetModal Component

**Location**: `/src/components/chat/CodeSnippetModal.tsx`

Modal for creating and sharing code snippets.

```tsx
import { CodeSnippetModal } from '@/components/chat/CodeSnippetModal'

const [open, setOpen] = useState(false)

const handleShare = async (snippet: CodeSnippet) => {
  // Send snippet to backend
  await sendMessage({
    type: 'code',
    ...snippet,
  })
}

;<CodeSnippetModal
  open={open}
  onOpenChange={setOpen}
  onShare={handleShare}
  defaultLanguage="javascript"
/>
```

**Features**:

- Title and description fields
- Language selector (100+ languages, grouped by category)
- TipTap code editor with syntax highlighting
- Live preview tab
- Keyboard shortcuts (Cmd/Ctrl+Enter to share)

## Supported Languages

The system supports 100+ languages including:

### Web Technologies

- JavaScript (js, jsx)
- TypeScript (ts, tsx)
- HTML/XML
- CSS, SCSS, LESS
- Vue, Svelte

### Backend Languages

- Python (py)
- Java
- Go (golang)
- Rust (rs)
- Ruby (rb)
- PHP
- C/C++
- C# (cs)

### Shell & Config

- Bash (sh, shell, zsh)
- PowerShell (ps1)
- JSON
- YAML (yml)
- TOML
- XML

### Databases

- SQL
- PostgreSQL (pgsql)
- MongoDB

### Other

- Markdown (md)
- Diff/Patch
- Dockerfile
- GraphQL (gql)
- Makefile
- Assembly (asm, nasm)

**Full list**: See `getSupportedLanguages()` in `/src/lib/markdown/syntax-highlighter.ts`

## Syntax Highlighter Library

**Location**: `/src/lib/markdown/syntax-highlighter.ts`

Core utility functions for syntax highlighting.

### Key Functions

#### `highlightCode(code, language?)`

Highlight code with syntax highlighting.

```typescript
import { highlightCode } from '@/lib/markdown/syntax-highlighter'

const { html, language } = highlightCode('const x = 42', 'javascript')
// html: highlighted HTML string
// language: detected or provided language
```

#### `detectLanguage(filename?, content?)`

Auto-detect language from filename or content.

```typescript
import { detectLanguage } from '@/lib/markdown/syntax-highlighter'

const lang = detectLanguage('example.py')
// Returns: 'python'

const lang2 = detectLanguage(undefined, '<?php echo "Hello"; ?>')
// Returns: 'php'
```

#### `getSupportedLanguages()`

Get list of all supported languages.

```typescript
import { getSupportedLanguages } from '@/lib/markdown/syntax-highlighter'

const languages = getSupportedLanguages()
// Returns: Array of LanguageInfo objects
```

#### `getLanguageDisplayName(language)`

Get human-readable language name.

```typescript
import { getLanguageDisplayName } from '@/lib/markdown/syntax-highlighter'

const display = getLanguageDisplayName('js')
// Returns: 'JavaScript'
```

## Usage in Messages

### Markdown Syntax

Users can write code in messages using markdown syntax:

**Inline code**:

```
Use `const x = 42` for constants.
```

**Code blocks**:

````
```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```
````

**With filename**:

````
```typescript:src/utils/helper.ts
export function helper() {
  // implementation
}
```
````

### Integration with MessageContent

The `MessageContent` component automatically parses and renders code:

```tsx
import { MessageContent } from '@/components/chat/message-content'
;<MessageContent content={message.content} type="text" />
```

Code blocks in the content will be automatically:

1. Detected (triple backticks)
2. Language identified
3. Syntax highlighted
4. Rendered with full features

## Styling & Themes

### CSS Styles

**Location**: `/src/styles/syntax-highlighting.css`

The system includes comprehensive syntax highlighting styles:

- Light mode colors (GitHub Light theme)
- Dark mode colors (GitHub Dark theme)
- Smooth transitions
- Hover effects
- Scrollbar styling
- Print-friendly styles

### Theme Support

The highlighting automatically adapts to:

- System theme preference
- App theme setting
- Dark/light mode toggle

### Customization

To customize colors, edit `/src/styles/syntax-highlighting.css`:

```css
/* Example: Custom keyword color in dark mode */
.dark .hljs-keyword {
  color: #your-color !important;
}
```

## Examples

See `/src/components/chat/code-snippets-example.tsx` for comprehensive examples:

1. **Inline code examples**
2. **Code blocks with various languages**
3. **Code snippet modal usage**
4. **Message with embedded code**

### Run Examples

```bash
# Add to your app
import { CodeSnippetsExample } from '@/components/chat/code-snippets-example'

<CodeSnippetsExample />
```

## Best Practices

### For Users

1. **Always specify language** for better highlighting:

   ````
   ```typescript
   // Good - language specified
   ```
   ````

2. **Use descriptive filenames** when sharing snippets

3. **Keep code blocks focused** - break large files into logical sections

4. **Add comments** to explain complex logic

### For Developers

1. **Lazy load languages** - Only register languages as needed

2. **Sanitize code** - Always sanitize before rendering HTML

3. **Limit code length** - Show collapse UI for long snippets

4. **Provide fallbacks** - Handle unsupported languages gracefully

5. **Test accessibility** - Ensure keyboard navigation works

## Performance

### Optimization Tips

1. **Memoize highlighted code**:

   ```tsx
   const highlightedCode = useMemo(() => highlightCode(code, language), [code, language])
   ```

2. **Virtual scrolling** for long code blocks:

   ```tsx
   import { useVirtualizer } from '@tanstack/react-virtual'
   ```

3. **Code splitting**:
   ```tsx
   const CodeBlock = lazy(() => import('./CodeBlock'))
   ```

## Accessibility

The code highlighting system is fully accessible:

- **Keyboard navigation**: All buttons are keyboard accessible
- **Screen readers**: Proper ARIA labels and semantic HTML
- **Focus indicators**: Visible focus rings on all interactive elements
- **Color contrast**: WCAG AA compliant colors
- **Reduced motion**: Respects `prefers-reduced-motion`

## API Reference

### CodeBlock Props

```typescript
interface CodeBlockProps {
  code: string // Source code (required)
  language?: string // Language identifier
  filename?: string // Display filename
  showLineNumbers?: boolean // Show line numbers (default: true)
  maxHeight?: number // Max height in pixels (default: 500)
  className?: string // Additional CSS classes
  onExpand?: () => void // Callback for expand button
}
```

### CodeSnippet Type

```typescript
interface CodeSnippet {
  title: string // Snippet title
  language: string // Programming language
  code: string // Source code
  description?: string // Optional description
}
```

### LanguageInfo Type

```typescript
interface LanguageInfo {
  name: string // Canonical name (e.g., 'javascript')
  aliases: string[] // Alternative names (e.g., ['js', 'jsx'])
  displayName: string // Display name (e.g., 'JavaScript')
  extension: string // File extension (e.g., '.js')
  category: string // Category (e.g., 'Web', 'Backend')
}
```

## Troubleshooting

### Language not highlighting correctly

**Solution**: Check if language is supported:

```typescript
import { isLanguageSupported } from '@/lib/markdown/syntax-highlighter'

if (!isLanguageSupported('mylang')) {
  console.log('Language not supported')
}
```

### Colors look wrong in dark mode

**Solution**: Clear browser cache and ensure CSS is loaded:

```bash
# Rebuild CSS
pnpm build
```

### Copy button not working

**Solution**: Check clipboard permissions:

```typescript
// Modern browsers require HTTPS or localhost
navigator.clipboard.writeText(code)
```

### Performance issues with large files

**Solution**: Use maxHeight and collapse features:

```tsx
<CodeBlock
  code={largeCode}
  maxHeight={300}
  // Will auto-collapse if >20 lines
/>
```

## Future Enhancements

Planned features:

- [ ] Monaco editor integration for full IDE experience
- [ ] AI-powered code suggestions
- [ ] Diff view for code changes
- [ ] Code execution in sandbox
- [ ] Collaborative code editing
- [ ] Code snippet search
- [ ] Syntax error detection
- [ ] Auto-formatting on paste

## Resources

- [lowlight](https://github.com/wooorm/lowlight) - Syntax highlighter
- [highlight.js](https://highlightjs.org/) - Language definitions
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Radix UI](https://www.radix-ui.com/) - UI primitives

## Support

For issues or questions:

1. Check this guide
2. Review `/src/components/chat/code-snippets-example.tsx`
3. Open an issue on GitHub
4. Contact the development team

---

**Version**: 1.0.0
**Last Updated**: February 1, 2026
**Maintainer**: nself-chat team
