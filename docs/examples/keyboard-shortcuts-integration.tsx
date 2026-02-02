/**
 * Keyboard Shortcuts Integration Examples
 *
 * Demonstrates how to integrate the keyboard shortcuts system
 * in various parts of the application.
 */

import React, { useState, useCallback } from 'react';
import { useShortcut, useScopedKeyboard } from '@/lib/keyboard';
import { useHotkey, useModKey, useEscapeKey } from '@/hooks/use-hotkey';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { useEditorShortcuts } from '@/hooks/use-editor-shortcuts';
import { useShortcutStore } from '@/lib/keyboard/shortcut-store';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { KeyboardShortcuts } from '@/components/settings/KeyboardShortcuts';

// ============================================================================
// Example 1: App Root - Global Shortcuts
// ============================================================================

/**
 * App root component with global shortcuts
 */
export function AppWithShortcuts() {
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Register all global shortcuts
  useGlobalShortcuts({
    onQuickSwitcher: () => setQuickSwitcherOpen(true),
    onSearch: () => setSearchOpen(true),
    onShowShortcuts: () => setShortcutsModalOpen(true),
  });

  return (
    <>
      <div className="app">
        {/* Your app content */}
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal
        open={shortcutsModalOpen}
        onOpenChange={setShortcutsModalOpen}
      />
    </>
  );
}

// ============================================================================
// Example 2: Message Editor with Formatting Shortcuts
// ============================================================================

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function MessageEditor() {
  const [isFocused, setIsFocused] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  // Register editor shortcuts (Bold, Italic, etc.)
  const { formatActions } = useEditorShortcuts({
    editor,
    isFocused,
    onInsertLink: () => setLinkDialogOpen(true),
  });

  // Send message with Cmd+Enter
  useHotkey(
    'mod+enter',
    () => {
      if (editor && isFocused) {
        handleSendMessage(editor.getHTML());
      }
    },
    { enabled: isFocused }
  );

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
    editor?.commands.clearContent();
  };

  return (
    <div className="editor-container">
      <EditorContent
        editor={editor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Formatting toolbar */}
      <div className="toolbar">
        <button onClick={formatActions.bold}>Bold</button>
        <button onClick={formatActions.italic}>Italic</button>
        <button onClick={formatActions.code}>Code</button>
      </div>

      {/* Link dialog */}
      {linkDialogOpen && (
        <LinkDialog onClose={() => setLinkDialogOpen(false)} />
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Message List with Selection Shortcuts
// ============================================================================

interface Message {
  id: string;
  content: string;
  author: string;
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Activate 'message-selected' scope when a message is selected
  useScopedKeyboard('message-selected', !!selectedMessageId);

  // Navigate with arrow keys
  useHotkey(
    'arrowup',
    () => {
      const currentIndex = messages.findIndex((m) => m.id === selectedMessageId);
      if (currentIndex > 0) {
        setSelectedMessageId(messages[currentIndex - 1].id);
      }
    },
    { enabled: !!selectedMessageId, preventDefault: true }
  );

  useHotkey(
    'arrowdown',
    () => {
      const currentIndex = messages.findIndex((m) => m.id === selectedMessageId);
      if (currentIndex < messages.length - 1) {
        setSelectedMessageId(messages[currentIndex + 1].id);
      }
    },
    { enabled: !!selectedMessageId, preventDefault: true }
  );

  // Message actions (only when message is selected)
  useShortcut(
    'REPLY',
    () => {
      if (selectedMessageId) {
        handleReply(selectedMessageId);
      }
    },
    { scopes: ['message-selected'] }
  );

  useShortcut(
    'REACT',
    () => {
      if (selectedMessageId) {
        handleReact(selectedMessageId);
      }
    },
    { scopes: ['message-selected'] }
  );

  useShortcut(
    'DELETE_MESSAGE',
    () => {
      if (selectedMessageId) {
        handleDelete(selectedMessageId);
      }
    },
    { scopes: ['message-selected'] }
  );

  const handleReply = (messageId: string) => {
    console.log('Reply to:', messageId);
  };

  const handleReact = (messageId: string) => {
    console.log('React to:', messageId);
  };

  const handleDelete = (messageId: string) => {
    setMessages(messages.filter((m) => m.id !== messageId));
    setSelectedMessageId(null);
  };

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={selectedMessageId === message.id ? 'selected' : ''}
          onClick={() => setSelectedMessageId(message.id)}
        >
          <strong>{message.author}</strong>: {message.content}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 4: Modal with Escape to Close
// ============================================================================

export function CustomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Close modal with Escape key
  useEscapeKey(onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Modal Title</h2>
        <p>Press Escape to close</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Settings Page with Keyboard Shortcuts Panel
// ============================================================================

export function SettingsPage() {
  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-sections">
        {/* Other settings sections */}

        {/* Keyboard Shortcuts Section */}
        <KeyboardShortcuts />
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Channel Switcher with Quick Access
// ============================================================================

export function ChannelSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const channels = ['general', 'random', 'help', 'dev'];

  // Open with Cmd+K
  useModKey('k', () => setIsOpen(true), { preventDefault: true });

  // Navigate within switcher
  useHotkey(
    'arrowdown',
    () => {
      setSelectedIndex((prev) => Math.min(prev + 1, channels.length - 1));
    },
    { enabled: isOpen, preventDefault: true }
  );

  useHotkey(
    'arrowup',
    () => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    },
    { enabled: isOpen, preventDefault: true }
  );

  // Select with Enter
  useHotkey(
    'enter',
    () => {
      if (isOpen) {
        handleSelectChannel(channels[selectedIndex]);
        setIsOpen(false);
      }
    },
    { enabled: isOpen }
  );

  // Close with Escape
  useEscapeKey(() => setIsOpen(false), { enabled: isOpen });

  const handleSelectChannel = (channel: string) => {
    console.log('Selected channel:', channel);
  };

  if (!isOpen) return null;

  return (
    <div className="channel-switcher">
      <input placeholder="Search channels..." autoFocus />
      <ul>
        {channels.map((channel, index) => (
          <li
            key={channel}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => handleSelectChannel(channel)}
          >
            #{channel}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Example 7: Custom Shortcut Manager Integration
// ============================================================================

import { getShortcutManager } from '@/lib/shortcuts/shortcut-manager';

export function AdvancedComponent() {
  React.useEffect(() => {
    const manager = getShortcutManager();

    // Register multiple shortcuts
    const unregister = manager.registerMultiple([
      {
        id: 'custom-action-1',
        key: 'mod+shift+1',
        handler: () => console.log('Action 1'),
        priority: 100,
        scopes: ['chat'],
      },
      {
        id: 'custom-action-2',
        key: 'mod+shift+2',
        handler: () => console.log('Action 2'),
        priority: 90,
        scopes: ['chat'],
      },
    ]);

    // Add scope
    manager.addScope('chat');

    // Check for conflicts
    const conflicts = manager.detectConflicts();
    if (conflicts.length > 0) {
      console.warn('Shortcut conflicts detected:', conflicts);
    }

    // Clean up
    return () => {
      unregister();
      manager.removeScope('chat');
    };
  }, []);

  return <div>Advanced Component with Custom Shortcuts</div>;
}

// ============================================================================
// Example 8: Context-Aware Shortcuts
// ============================================================================

export function ContextAwareComponent() {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Activate edit scope
  useScopedKeyboard('editor', mode === 'edit');

  // Shortcut only works in view mode
  useHotkey(
    'e',
    () => {
      setMode('edit');
    },
    { enabled: mode === 'view' }
  );

  // Shortcut only works in edit mode
  useEscapeKey(
    () => {
      setMode('view');
    },
    { enabled: mode === 'edit' }
  );

  return (
    <div>
      <p>Mode: {mode}</p>
      <p>Press 'e' to edit, 'Escape' to cancel</p>
    </div>
  );
}

// ============================================================================
// Example 9: Shortcut Store Integration
// ============================================================================

export function ShortcutStoreExample() {
  const shortcutsEnabled = useShortcutStore((state) => state.shortcutsEnabled);
  const showKeyboardHints = useShortcutStore((state) => state.showKeyboardHints);
  const { setShortcutsEnabled, setShowKeyboardHints } = useShortcutStore();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={shortcutsEnabled}
          onChange={(e) => setShortcutsEnabled(e.target.checked)}
        />
        Enable Keyboard Shortcuts
      </label>

      <label>
        <input
          type="checkbox"
          checked={showKeyboardHints}
          onChange={(e) => setShowKeyboardHints(e.target.checked)}
        />
        Show Keyboard Hints
      </label>
    </div>
  );
}

// ============================================================================
// Example 10: Testing Shortcuts
// ============================================================================

import { renderHook, act } from '@testing-library/react';

export function testShortcuts() {
  describe('Keyboard Shortcuts', () => {
    it('should trigger callback on shortcut', () => {
      const handleAction = jest.fn();

      renderHook(() => useHotkey('mod+k', handleAction));

      // Simulate Cmd+K
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        });
        window.dispatchEvent(event);
      });

      expect(handleAction).toHaveBeenCalled();
    });

    it('should respect scope', () => {
      const handleAction = jest.fn();

      const { rerender } = renderHook(
        ({ enabled }) => {
          useScopedKeyboard('test-scope', enabled);
          useShortcut('MY_SHORTCUT', handleAction, { scopes: ['test-scope'] });
        },
        { initialProps: { enabled: false } }
      );

      // Trigger shortcut when scope is disabled
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        });
        window.dispatchEvent(event);
      });

      expect(handleAction).not.toHaveBeenCalled();

      // Enable scope
      rerender({ enabled: true });

      // Trigger shortcut when scope is enabled
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        });
        window.dispatchEvent(event);
      });

      expect(handleAction).toHaveBeenCalled();
    });
  });
}

// ============================================================================
// Helper Components
// ============================================================================

function LinkDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="link-dialog">
      <input placeholder="Enter URL" />
      <button onClick={onClose}>Insert</button>
    </div>
  );
}
