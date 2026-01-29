'use client';

/**
 * GIF Search Input Component
 *
 * Search input with icon, clear button, and debounced search functionality.
 *
 * @example
 * ```tsx
 * <GifSearch
 *   value={query}
 *   onChange={setQuery}
 *   onSearch={handleSearch}
 *   placeholder="Search GIFs..."
 * />
 * ```
 */

import { useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GifSearchProps } from '@/types/gif';

export function GifSearch({
  value,
  onChange,
  onSearch,
  placeholder = 'Search GIFs...',
  loading = false,
  className,
}: GifSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Handle key down (Enter to search)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch && value.trim()) {
        e.preventDefault();
        onSearch(value);
      }
      if (e.key === 'Escape') {
        handleClear();
      }
    },
    [value, onSearch, handleClear]
  );

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'w-full h-10 pl-9 pr-9 rounded-lg',
          'bg-muted/50 border border-border',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'transition-colors duration-200'
        )}
        aria-label="Search GIFs"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'p-1 rounded-full',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-accent',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Search Suggestions Component
// ============================================================================

export interface GifSearchSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function GifSearchSuggestions({
  suggestions,
  onSelect,
  className,
}: GifSearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 z-50 mt-1',
        'bg-popover border border-border rounded-lg shadow-lg',
        'max-h-48 overflow-y-auto',
        className
      )}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={cn(
            'w-full px-3 py-2 text-left text-sm',
            'hover:bg-accent',
            'focus:outline-none focus:bg-accent',
            'transition-colors duration-150',
            index === 0 && 'rounded-t-lg',
            index === suggestions.length - 1 && 'rounded-b-lg'
          )}
        >
          <span className="flex items-center gap-2">
            <Search className="h-3 w-3 text-muted-foreground" />
            {suggestion}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Search History Component
// ============================================================================

export interface GifSearchHistoryProps {
  history: Array<{ query: string; searchedAt: number }>;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
  className?: string;
}

export function GifSearchHistory({
  history,
  onSelect,
  onRemove,
  onClear,
  className,
}: GifSearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className={cn('p-2', className)}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {history.slice(0, 8).map((item, index) => (
          <div
            key={`${item.query}-${index}`}
            className={cn(
              'group flex items-center gap-1',
              'px-2 py-1 rounded-full',
              'bg-muted/50 hover:bg-muted',
              'transition-colors duration-150'
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(item.query)}
              className="text-xs text-foreground"
            >
              {item.query}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.query);
              }}
              className={cn(
                'p-0.5 rounded-full',
                'opacity-0 group-hover:opacity-100',
                'text-muted-foreground hover:text-foreground',
                'transition-opacity duration-150'
              )}
              aria-label={`Remove "${item.query}" from history`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GifSearch;
