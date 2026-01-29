# Contributing to nself-chat

Thank you for your interest in contributing to nself-chat! This guide will help you get started.

---

## Code of Conduct

Be respectful, inclusive, and constructive. We welcome contributors of all experience levels.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for backend)
- Git

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/nself-chat.git
cd nself-chat

# Install dependencies
pnpm install

# Start development
pnpm dev
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

### 2. Make Changes

Follow our coding standards (see below).

### 3. Test Your Changes

```bash
# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new poll feature"
git commit -m "fix: resolve message rendering bug"
git commit -m "docs: update API documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types for all function parameters and returns
- Avoid `any` - use `unknown` if type is unclear
- Use interfaces over types for objects

```typescript
// Good
interface UserProfile {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<UserProfile> {
  // ...
}

// Avoid
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Extract reusable logic into hooks

```tsx
// Good
function MessageList({ messages }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

### Styling

- Use Tailwind CSS classes
- Avoid inline styles
- Use CSS variables for theming
- Follow mobile-first responsive design

### File Organization

```
src/
├── components/
│   └── feature-name/
│       ├── feature-component.tsx
│       ├── feature-component.test.tsx
│       └── index.ts
├── hooks/
│   └── use-feature.ts
├── lib/
│   └── feature/
│       ├── feature-store.ts
│       └── feature-utils.ts
```

---

## Pull Request Guidelines

### PR Title

Use conventional commit format:
- `feat: add voice message support`
- `fix: resolve thread loading issue`
- `docs: update installation guide`

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (for UI changes)

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Responsive on mobile

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/components/chat/message-list.test.tsx

# Run with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

### Writing Tests

```tsx
import { render, screen } from '@testing-library/react'
import { MessageList } from './message-list'

describe('MessageList', () => {
  it('renders messages', () => {
    const messages = [
      { id: '1', content: 'Hello', author: { name: 'Alice' } }
    ]

    render(<MessageList messages={messages} />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} />)

    expect(screen.getByText('No messages yet')).toBeInTheDocument()
  })
})
```

---

## Documentation

### Adding Documentation

1. Create markdown file in `docs/`
2. Add to `docs/_Sidebar.md`
3. Use consistent formatting

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Link to related documentation

---

## Issue Guidelines

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/videos
- Environment (OS, browser, Node version)

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

---

## Release Process

Releases are automated via GitHub Actions:

1. Merge PR to `main`
2. CI runs tests and builds
3. Semantic release creates version
4. Changelog is updated
5. Release is published

---

## Getting Help

- [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- [Documentation](https://github.com/acamarata/nself-chat/wiki)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing!
