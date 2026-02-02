# Quick Start: Keyboard Shortcuts

Get the keyboard shortcuts system up and running in 5 minutes.

## Step 1: Add Shortcuts Modal to App Root

```tsx
// src/app/layout.tsx or src/app/chat/layout.tsx
'use client';

import { useState } from 'react';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';

export default function RootLayout({ children }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Register global shortcuts
  useGlobalShortcuts({
    onShowShortcuts: () => setShortcutsOpen(true),
  });

  return (
    <html>
      <body>
        {children}

        {/* Shortcuts Modal - opens with ? or Cmd+/ */}
        <ShortcutsModal
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </body>
    </html>
  );
}
```

## Step 2: Add Settings Page

```tsx
// src/app/settings/keyboard/page.tsx
import { KeyboardShortcuts } from '@/components/settings/KeyboardShortcuts';

export default function KeyboardSettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Keyboard Settings</h1>
      <KeyboardShortcuts />
    </div>
  );
}
```

## Step 3: Use Shortcuts in Components

### Example: Quick Switcher

```tsx
// src/components/QuickSwitcher.tsx
import { useHotkey } from '@/hooks/use-hotkey';
import { useState } from 'react';

export function QuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  // Open with Cmd+K
  useHotkey('mod+k', () => setIsOpen(true), {
    preventDefault: true,
  });

  // Close with Escape
  useHotkey('escape', () => setIsOpen(false), {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="quick-switcher">
      <input placeholder="Search channels..." autoFocus />
      {/* Your switcher UI */}
    </div>
  );
}
```

### Example: Message Actions

```tsx
// src/components/MessageList.tsx
import { useShortcut, useScopedKeyboard } from '@/lib/keyboard';
import { useState } from 'react';

export function MessageList({ messages }) {
  const [selectedId, setSelectedId] = useState(null);

  // Activate scope when message is selected
  useScopedKeyboard('message-selected', !!selectedId);

  // Reply with 'R'
  useShortcut('REPLY', () => {
    if (selectedId) {
      handleReply(selectedId);
    }
  });

  // Delete with 'Backspace'
  useShortcut('DELETE_MESSAGE', () => {
    if (selectedId) {
      handleDelete(selectedId);
    }
  });

  return (
    <div>
      {messages.map(msg => (
        <div
          key={msg.id}
          onClick={() => setSelectedId(msg.id)}
          className={selectedId === msg.id ? 'selected' : ''}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}
```

### Example: Editor Shortcuts

```tsx
// src/components/MessageEditor.tsx
import { useEditorShortcuts } from '@/hooks/use-editor-shortcuts';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

export function MessageEditor() {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  // Formatting shortcuts (Cmd+B, Cmd+I, etc.)
  useEditorShortcuts({
    editor,
    isFocused,
  });

  return (
    <EditorContent
      editor={editor}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
}
```

## Step 4: Test It Out

1. **Press `?`** - Opens shortcuts modal
2. **Press `Cmd+K`** - Quick switcher
3. **Press `Cmd+/`** - Focus message input
4. **Press `Escape`** - Close modal
5. **Go to Settings → Keyboard** - Customize shortcuts

## Available Shortcuts

### Quick Reference

| Action | Shortcut | Category |
|--------|----------|----------|
| Quick Switcher | `Cmd+K` | Navigation |
| Search | `Cmd+F` | Navigation |
| Next Channel | `Alt+↓` | Navigation |
| Previous Channel | `Alt+↑` | Navigation |
| Reply | `R` | Messages |
| React | `E` | Messages |
| Bold | `Cmd+B` | Formatting |
| Italic | `Cmd+I` | Formatting |
| Show Shortcuts | `?` | UI |
| Close Modal | `Esc` | UI |

See full list in shortcuts modal (`?`)

## Customization

Users can customize shortcuts in Settings:

1. Navigate to **Settings → Keyboard**
2. Click the **keyboard icon** next to any shortcut
3. Press desired key combination
4. Click **Save**

## Advanced Usage

### Custom Shortcuts

```tsx
import { useHotkey } from '@/hooks/use-hotkey';

// Simple custom shortcut
useHotkey('mod+shift+x', () => {
  console.log('Custom action!');
}, {
  preventDefault: true,
});
```

### Shortcut Manager

```tsx
import { getShortcutManager } from '@/lib/shortcuts/shortcut-manager';

const manager = getShortcutManager();

// Register multiple shortcuts
manager.registerMultiple([
  {
    id: 'action-1',
    key: 'mod+1',
    handler: () => console.log('Action 1'),
    priority: 100,
  },
  {
    id: 'action-2',
    key: 'mod+2',
    handler: () => console.log('Action 2'),
    priority: 90,
  },
]);
```

### Check Conflicts

```tsx
import { useShortcutStore } from '@/lib/keyboard/shortcut-store';

function MyComponent() {
  const conflicts = useShortcutStore(state => state.conflicts);

  if (conflicts.length > 0) {
    console.warn('Conflicts detected:', conflicts);
  }
}
```

## Troubleshooting

### Shortcuts Not Working

1. Check if shortcuts are enabled:
   ```tsx
   const enabled = useShortcutStore(state => state.shortcutsEnabled);
   ```

2. Check for conflicts in Settings → Keyboard

3. Verify scope is active:
   ```tsx
   useScopedKeyboard('my-scope', isActive);
   ```

### Recording Not Working

1. Make sure no input field is focused
2. Try clicking outside modal first
3. Check browser console for errors

## Next Steps

- **Full Documentation**: See `/docs/Keyboard-Shortcuts-System.md`
- **Examples**: See `/docs/examples/keyboard-shortcuts-integration.tsx`
- **API Reference**: Check JSDoc comments in source files

## Summary

You now have:
- ✅ Shortcuts modal (press `?`)
- ✅ Global shortcuts registered
- ✅ Settings page for customization
- ✅ Ready to use in components

**That's it!** Start using keyboard shortcuts in your app. 🎉
