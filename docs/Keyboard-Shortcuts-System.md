# Keyboard Shortcuts System

Complete documentation for the nself-chat keyboard shortcuts system.

## Overview

The keyboard shortcuts system provides:

- **Comprehensive Shortcuts**: 40+ pre-defined shortcuts across 5 categories
- **Customization**: Users can customize any shortcut key binding
- **Conflict Detection**: Automatic detection and warning of shortcut conflicts
- **Scope Management**: Context-aware shortcuts (e.g., editor-only, message-selected)
- **Platform Support**: Cross-platform compatibility (Mac, Windows, Linux)
- **Persistence**: Custom shortcuts saved to localStorage
- **Import/Export**: Backup and restore custom configurations
- **Help Modal**: Searchable, categorized shortcuts reference (press `?`)

## Architecture

### Components

```
src/
├── lib/
│   ├── keyboard/              # Core keyboard infrastructure
│   │   ├── index.ts          # Main exports
│   │   ├── shortcuts.ts      # Shortcut definitions
│   │   ├── shortcut-store.ts # Zustand store for customization
│   │   ├── shortcut-utils.ts # Utility functions
│   │   └── use-shortcuts.ts  # React hooks
│   └── shortcuts/
│       └── shortcut-manager.ts # Central manager class
├── hooks/
│   ├── use-keyboard-shortcuts.ts # Basic shortcut hook
│   ├── use-hotkey.ts            # Simple hotkey hook
│   ├── use-global-shortcuts.ts  # App-level shortcuts
│   ├── use-editor-shortcuts.ts  # Editor formatting
│   └── use-message-shortcuts.ts # Message actions
├── components/
│   ├── modals/
│   │   └── ShortcutsModal.tsx   # Help modal (? key)
│   └── settings/
│       └── KeyboardShortcuts.tsx # Settings panel
└── stores/
    └── settings-store.ts        # Global settings
```

## Usage

### 1. Using Pre-defined Shortcuts

```tsx
import { useShortcut } from '@/lib/keyboard';

function MyComponent() {
  useShortcut('QUICK_SWITCHER', () => {
    openQuickSwitcher();
  });

  return <div>...</div>;
}
```

### 2. Using Custom Shortcuts

```tsx
import { useHotkey } from '@/hooks/use-hotkey';

function MyComponent() {
  // Simple usage
  useHotkey('mod+k', () => openSearch());

  // With options
  useHotkey('mod+s', handleSave, {
    preventDefault: true,
    enableOnInputs: true,
  });

  return <div>...</div>;
}
```

### 3. Editor Shortcuts

```tsx
import { useEditorShortcuts } from '@/hooks/use-editor-shortcuts';
import { useEditor } from '@tiptap/react';

function MessageEditor() {
  const editor = useEditor({...});

  useEditorShortcuts({
    editor,
    isFocused: true,
    onInsertLink: () => setLinkDialogOpen(true),
  });

  return <EditorContent editor={editor} />;
}
```

### 4. Scoped Shortcuts

```tsx
import { useScopedKeyboard } from '@/lib/keyboard';

function MessageList() {
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Activate 'message-selected' scope when a message is selected
  useScopedKeyboard('message-selected', !!selectedMessageId);

  // This shortcut only works when scope is active
  useShortcut('REPLY', () => {
    replyToMessage(selectedMessageId);
  }, { scopes: ['message-selected'] });

  return <div>...</div>;
}
```

### 5. Using the Shortcut Manager

```tsx
import { getShortcutManager } from '@/lib/shortcuts/shortcut-manager';

const manager = getShortcutManager();

// Register a shortcut
const unregister = manager.register({
  id: 'my-shortcut',
  key: 'mod+shift+x',
  handler: (event) => {
    console.log('Shortcut triggered!');
  },
  priority: 10,
  scopes: ['chat'],
});

// Add scope
manager.addScope('chat');

// Clean up
unregister();
```

## Shortcut Categories

### Navigation (9 shortcuts)

| Shortcut | Keys | Description |
|----------|------|-------------|
| Quick Switcher | `Cmd+K` | Open channel/DM quick switcher |
| Search | `Cmd+F` | Search messages and files |
| Next Channel | `Alt+↓` | Navigate to next channel |
| Previous Channel | `Alt+↑` | Navigate to previous channel |
| Next Unread | `Alt+Shift+↓` | Jump to next unread channel |
| Previous Unread | `Alt+Shift+↑` | Jump to previous unread channel |
| Go to DMs | `Cmd+Shift+K` | Open direct messages |
| Focus Message Input | `Cmd+/` | Focus the message input field |

### Messages (8 shortcuts)

| Shortcut | Keys | Description |
|----------|------|-------------|
| Edit Last | `↑` | Edit your last message (empty input) |
| Reply | `R` | Reply to selected message |
| React | `E` | Add emoji reaction |
| Delete | `Backspace` | Delete selected message |
| Copy | `Cmd+C` | Copy message text |
| Pin | `P` | Pin/unpin message |
| Mark Unread | `U` | Mark as unread |
| Thread | `T` | Open message thread |

### Formatting (10 shortcuts)

| Shortcut | Keys | Description |
|----------|------|-------------|
| Bold | `Cmd+B` | Make text bold |
| Italic | `Cmd+I` | Make text italic |
| Underline | `Cmd+U` | Underline text |
| Strikethrough | `Cmd+Shift+X` | Strikethrough text |
| Code | `Cmd+Shift+C` | Inline code |
| Code Block | `Cmd+Shift+Enter` | Code block |
| Link | `Cmd+Shift+U` | Insert link |
| Quote | `Cmd+Shift+.` | Quote text |
| Bullet List | `Cmd+Shift+8` | Bullet list |
| Numbered List | `Cmd+Shift+7` | Numbered list |

### UI (7 shortcuts)

| Shortcut | Keys | Description |
|----------|------|-------------|
| Toggle Sidebar | `Cmd+Shift+D` | Show/hide sidebar |
| Toggle Thread | `Cmd+Shift+T` | Show/hide thread panel |
| Toggle Members | `Cmd+Shift+M` | Show/hide members panel |
| Show Shortcuts | `?` | Open shortcuts modal |
| Close Modal | `Esc` | Close any modal/overlay |
| Toggle Fullscreen | `Cmd+Shift+F` | Enter/exit fullscreen |
| Toggle Compact | `Cmd+Shift+J` | Toggle compact mode |
| Emoji Picker | `Cmd+Shift+E` | Open emoji picker |

### Actions (6 shortcuts)

| Shortcut | Keys | Description |
|----------|------|-------------|
| New Channel | `Cmd+Shift+N` | Create new channel |
| New DM | `Cmd+N` | Start new direct message |
| Upload File | `Cmd+Shift+U` | Upload a file |
| Invite Members | `Cmd+Shift+I` | Invite members |
| Settings | `Cmd+,` | Open settings |
| Profile | `Cmd+Shift+P` | Open profile |

## Customization

### User Customization Flow

1. **Open Settings** → Keyboard Shortcuts
2. **Search/Filter** shortcuts by name or category
3. **Click Keyboard Icon** to record new key combo
4. **Press Desired Keys** in the recording dialog
5. **Save** or cancel

### Conflict Detection

The system automatically detects conflicts:

```tsx
// Example: Two shortcuts with same key in overlapping scopes
{
  key: 'mod+s',
  id: 'save-message',
  scopes: ['chat']
}

{
  key: 'mod+s',
  id: 'save-draft',
  scopes: ['chat'] // ❌ CONFLICT!
}
```

Conflicts are displayed in the settings UI with a warning icon.

### Export/Import

```tsx
// Export customizations
const json = useShortcutStore.getState().exportCustomizations();
// Download as JSON file

// Import customizations
const success = useShortcutStore.getState().importCustomizations(json);
```

## Scopes

Shortcuts can be scoped to specific contexts:

| Scope | Description |
|-------|-------------|
| `global` | Always active (no scope specified) |
| `editor` | Active when message editor is focused |
| `message-selected` | Active when a message is selected |
| `message-input-empty` | Active when input is empty |
| `chat` | Active in chat view |
| `modal-open` | Active when modal is open |

### Adding Scopes

```tsx
import { useScopedKeyboard } from '@/lib/keyboard';

function MyComponent() {
  const [isActive, setIsActive] = useState(false);

  // Scope is active when isActive is true
  useScopedKeyboard('my-scope', isActive);

  useShortcut('MY_SHORTCUT', handleAction, {
    scopes: ['my-scope']
  });
}
```

## Store API

### State

```tsx
interface ShortcutStoreState {
  customShortcuts: Record<string, CustomShortcut>;
  disabledShortcuts: Set<string>;
  shortcutsEnabled: boolean;
  showKeyboardHints: boolean;
  recordingShortcut: ShortcutKey | null;
  conflicts: ShortcutConflict[];
}
```

### Actions

```tsx
// Customization
setCustomKey(id: ShortcutKey, key: string): void
resetToDefault(id: ShortcutKey): void
resetAllToDefaults(): void

// Enable/Disable
disableShortcut(id: ShortcutKey): void
enableShortcut(id: ShortcutKey): void
toggleShortcut(id: ShortcutKey): void
setShortcutsEnabled(enabled: boolean): void

// Recording
startRecording(id: ShortcutKey): void
stopRecording(): void
recordKey(key: string): boolean

// Preferences
setShowKeyboardHints(show: boolean): void

// Getters
getEffectiveKey(id: ShortcutKey): string
isShortcutEnabled(id: ShortcutKey): boolean
getConflicts(): ShortcutConflict[]

// Export/Import
exportCustomizations(): string
importCustomizations(json: string): boolean
```

## Utilities

### Format Shortcut for Display

```tsx
import { formatShortcut } from '@/lib/keyboard/shortcut-utils';

// Platform-aware formatting
const display = formatShortcut('mod+shift+k', { useMacSymbols: true });
// Mac: "⌘⇧K"
// Windows: "Ctrl+Shift+K"
```

### Check Shortcut Conflicts

```tsx
import { shortcutsConflict } from '@/lib/keyboard/shortcut-utils';

const hasConflict = shortcutsConflict('mod+k', 'mod+k'); // true
const hasConflict = shortcutsConflict('mod+k', 'mod+shift+k'); // false
```

### Parse Shortcut String

```tsx
import { parseShortcut } from '@/lib/keyboard/shortcut-utils';

const parsed = parseShortcut('mod+shift+k');
// {
//   modifiers: ['mod', 'shift'],
//   key: 'k',
//   originalString: 'mod+shift+k'
// }
```

## Best Practices

### 1. Use Platform-Agnostic Keys

```tsx
// ✅ Good - works on all platforms
useHotkey('mod+k', handleAction);

// ❌ Bad - Mac only
useHotkey('meta+k', handleAction);
```

### 2. Prevent Default for System Shortcuts

```tsx
// ✅ Prevent browser's print dialog
useHotkey('mod+p', handlePrint, { preventDefault: true });
```

### 3. Use Appropriate Scopes

```tsx
// ✅ Editor shortcuts only active when editing
useShortcut('BOLD', handleBold, { scopes: ['editor'] });

// ❌ Would interfere with global actions
useShortcut('BOLD', handleBold); // No scope
```

### 4. Set Proper Priorities

```tsx
// Higher priority executes first
manager.register({
  id: 'high-priority',
  key: 'mod+k',
  handler: handleAction,
  priority: 100, // Executes before lower priorities
});
```

### 5. Clean Up on Unmount

```tsx
useEffect(() => {
  const unregister = manager.register({...});

  return () => {
    unregister(); // ✅ Clean up
  };
}, []);
```

## Accessibility

### Keyboard Hints

When `showKeyboardHints` is enabled, shortcuts are displayed in tooltips:

```tsx
import { useShortcutStore } from '@/lib/keyboard/shortcut-store';

function MyButton() {
  const showHints = useShortcutStore(selectShowKeyboardHints);
  const shortcut = useShortcutStore(selectEffectiveKey('QUICK_SWITCHER'));

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button>Quick Switcher</Button>
      </TooltipTrigger>
      {showHints && (
        <TooltipContent>
          <p>{formatShortcut(shortcut)}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
```

### Screen Readers

Shortcuts are announced via `aria-keyshortcuts`:

```tsx
<button aria-keyshortcuts="Control+K">
  Open Quick Switcher
</button>
```

## Testing

### Unit Tests

```tsx
import { matchesShortcut } from '@/lib/keyboard/shortcut-utils';

test('matches shortcut correctly', () => {
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: true,
  });

  expect(matchesShortcut(event, 'mod+k')).toBe(true);
});
```

### Integration Tests

```tsx
import { renderHook } from '@testing-library/react';
import { useShortcut } from '@/lib/keyboard';

test('shortcut triggers callback', () => {
  const handleAction = jest.fn();

  renderHook(() => useShortcut('QUICK_SWITCHER', handleAction));

  // Simulate Cmd+K
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: true,
  });

  window.dispatchEvent(event);

  expect(handleAction).toHaveBeenCalled();
});
```

## Performance

### Optimization Tips

1. **Debounce Heavy Handlers**: Use `useMemo` or `useCallback`
2. **Lazy Registration**: Only register shortcuts when needed
3. **Unregister on Unmount**: Prevent memory leaks
4. **Use Scopes**: Reduce active shortcut count
5. **Priority System**: Most important shortcuts first

### Metrics

- **Registration Time**: < 1ms per shortcut
- **Event Processing**: < 5ms average
- **Memory Usage**: ~50KB for 40 shortcuts
- **Conflict Detection**: O(n²) but cached

## Troubleshooting

### Shortcut Not Working

1. Check if shortcuts are globally enabled
2. Verify scope is active
3. Check for conflicts in settings
4. Ensure shortcut is not disabled
5. Check if input field has focus (and shouldn't)

### Conflicts Not Detected

1. Check if shortcuts have different scopes
2. Verify conflict detection is running
3. Check store state in DevTools

### Custom Keys Not Persisting

1. Check localStorage permissions
2. Verify store persistence config
3. Check browser console for errors

## Migration Guide

### From Old System

```tsx
// Old
useKeyboardShortcuts({
  'Cmd+K': handleAction
});

// New
useShortcut('QUICK_SWITCHER', handleAction);
// or
useHotkey('mod+k', handleAction);
```

## Future Enhancements

- [ ] Chord shortcuts (e.g., `g` then `h`)
- [ ] Shortcut recording UI improvements
- [ ] Cloud sync for custom shortcuts
- [ ] Shortcut analytics
- [ ] Voice-controlled shortcuts
- [ ] Gesture shortcuts (mobile)
- [ ] Macro recording
- [ ] Shortcut themes/presets

## References

- [React Hotkeys Hook](https://github.com/JohannesKlauss/react-hotkeys-hook)
- [Zustand](https://github.com/pmndrs/zustand)
- [TipTap Editor](https://tiptap.dev/)
- [Radix UI](https://www.radix-ui.com/)

## Support

For issues or questions:
- File an issue on GitHub
- Check the troubleshooting section
- Review the examples in `/examples`
- Join our Discord community
