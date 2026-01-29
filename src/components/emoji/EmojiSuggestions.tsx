'use client';

/**
 * EmojiSuggestions - Display emoji suggestions in a horizontal or vertical list
 *
 * Used for showing quick emoji suggestions based on context or search
 */

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { AutocompleteSuggestion } from '@/lib/emoji/emoji-types';

// ============================================================================
// Types
// ============================================================================

export interface EmojiSuggestionsProps {
  /** List of suggestions to display */
  suggestions: AutocompleteSuggestion[];
  /** Called when an emoji is selected */
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Show shortcode labels */
  showLabels?: boolean;
  /** Size of emoji display */
  size?: 'sm' | 'md' | 'lg';
  /** Maximum items to show (horizontal only) */
  maxItems?: number;
  /** Additional class name */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfig = {
  sm: {
    emoji: 'text-lg',
    button: 'w-8 h-8',
    gap: 'gap-1',
  },
  md: {
    emoji: 'text-xl',
    button: 'w-10 h-10',
    gap: 'gap-1.5',
  },
  lg: {
    emoji: 'text-2xl',
    button: 'w-12 h-12',
    gap: 'gap-2',
  },
};

// ============================================================================
// Component
// ============================================================================

export const EmojiSuggestions = memo(function EmojiSuggestions({
  suggestions,
  onSelect,
  direction = 'horizontal',
  showLabels = false,
  size = 'md',
  maxItems,
  className,
  emptyMessage = 'No suggestions',
}: EmojiSuggestionsProps) {
  const config = sizeConfig[size];

  const handleSelect = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      onSelect(suggestion);
    },
    [onSelect]
  );

  // Apply max items limit
  const displaySuggestions = maxItems
    ? suggestions.slice(0, maxItems)
    : suggestions;

  if (displaySuggestions.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-4 text-sm text-muted-foreground',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  if (direction === 'horizontal') {
    return (
      <ScrollArea className={cn('w-full', className)}>
        <div className={cn('flex items-center', config.gap, 'p-1')}>
          {displaySuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                'flex-shrink-0 flex items-center justify-center rounded-md',
                'hover:bg-accent transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                config.button
              )}
              title={`${suggestion.displayName} ${suggestion.shortcode}`}
            >
              {suggestion.isCustom ? (
                <img
                  src={suggestion.emoji}
                  alt={suggestion.displayName}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <span className={config.emoji}>{suggestion.emoji}</span>
              )}
            </button>
          ))}

          {maxItems && suggestions.length > maxItems && (
            <span className="text-xs text-muted-foreground px-2">
              +{suggestions.length - maxItems}
            </span>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  // Vertical layout
  return (
    <div className={cn('flex flex-col', config.gap, className)}>
      {displaySuggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => handleSelect(suggestion)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md w-full',
            'hover:bg-accent transition-colors text-left',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
          )}
        >
          <span className={cn(config.emoji, 'flex-shrink-0')}>
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

          {showLabels && (
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {suggestion.displayName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {suggestion.shortcode}
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
});

// ============================================================================
// Inline Variant
// ============================================================================

export interface InlineEmojiSuggestionsProps {
  suggestions: AutocompleteSuggestion[];
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  className?: string;
}

export const InlineEmojiSuggestions = memo(function InlineEmojiSuggestions({
  suggestions,
  onSelect,
  className,
}: InlineEmojiSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {suggestions.slice(0, 5).map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="p-1 hover:bg-accent rounded transition-colors"
          title={suggestion.displayName}
        >
          {suggestion.isCustom ? (
            <img
              src={suggestion.emoji}
              alt={suggestion.displayName}
              className="w-4 h-4"
            />
          ) : (
            <span className="text-base">{suggestion.emoji}</span>
          )}
        </button>
      ))}
    </div>
  );
});

export default EmojiSuggestions;
