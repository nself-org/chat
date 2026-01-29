'use client';

/**
 * EmojiAutocomplete - Autocomplete dropdown for emoji :shortcode: input
 *
 * Shows emoji suggestions as user types :shortcode: patterns
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AutocompleteSuggestion } from '@/lib/emoji/emoji-types';

// ============================================================================
// Types
// ============================================================================

export interface EmojiAutocompleteProps {
  /** Whether autocomplete is visible */
  isOpen: boolean;
  /** List of suggestions */
  suggestions: AutocompleteSuggestion[];
  /** Currently selected index */
  selectedIndex: number;
  /** Position for the dropdown */
  position?: { top: number; left: number };
  /** Called when a suggestion is selected */
  onSelect: (suggestion: AutocompleteSuggestion, index: number) => void;
  /** Called when autocomplete should close */
  onClose: () => void;
  /** Additional class name */
  className?: string;
  /** Max height of dropdown */
  maxHeight?: number;
}

// ============================================================================
// Component
// ============================================================================

export const EmojiAutocomplete = memo(function EmojiAutocomplete({
  isOpen,
  suggestions,
  selectedIndex,
  position,
  onSelect,
  onClose,
  className,
  maxHeight = 240,
}: EmojiAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle item click
  const handleItemClick = useCallback(
    (suggestion: AutocompleteSuggestion, index: number) => {
      onSelect(suggestion, index);
    },
    [onSelect]
  );

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn(
          'absolute z-50 overflow-hidden',
          'bg-popover border border-border rounded-lg shadow-lg',
          'min-w-[200px] max-w-[320px]',
          className
        )}
        style={
          position
            ? { top: position.top, left: position.left }
            : undefined
        }
      >
        <ScrollArea style={{ maxHeight }}>
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                ref={index === selectedIndex ? selectedRef : undefined}
                type="button"
                onClick={() => handleItemClick(suggestion, index)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 rounded-md',
                  'text-sm transition-colors',
                  'hover:bg-accent focus:bg-accent focus:outline-none',
                  index === selectedIndex && 'bg-accent'
                )}
              >
                {/* Emoji or Custom Emoji Image */}
                <span className="text-xl flex-shrink-0 w-6 text-center">
                  {suggestion.isCustom ? (
                    <img
                      src={suggestion.emoji}
                      alt={suggestion.displayName}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    suggestion.emoji
                  )}
                </span>

                {/* Shortcode */}
                <span className="flex-1 text-left truncate">
                  <span className="text-muted-foreground">
                    {suggestion.shortcode}
                  </span>
                </span>

                {/* Display name (optional) */}
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {suggestion.displayName}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Tab</kbd>
            <span>or</span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
            <span>to select</span>
          </span>
          <span className="mx-1 text-border">|</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default EmojiAutocomplete;
