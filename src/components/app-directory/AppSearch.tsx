'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDirectoryStore } from '@/stores/app-directory-store';
import { quickSearch, getSearchSuggestions } from '@/lib/app-directory/app-search';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import type { AppType } from '@/lib/app-directory/app-types';

interface AppSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function AppSearch({
  className,
  placeholder = 'Search apps and integrations...',
  autoFocus = false,
}: AppSearchProps) {
  const { searchQuery, setSearchQuery, isLoading } = useAppDirectoryStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string; icon: string; type: AppType }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(localQuery, 300);

  // Update store when debounced query changes
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (localQuery.length >= 2) {
      const results = quickSearch(localQuery, 5);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [localQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = suggestions[selectedIndex];
          window.location.href = `/apps/${selected.id}`;
        }
        setShowSuggestions(false);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const getTypeLabel = (type: AppType): string => {
    const labels: Record<AppType, string> = {
      bot: 'Bot',
      integration: 'Integration',
      plugin: 'Plugin',
      workflow: 'Workflow',
      theme: 'Theme',
    };
    return labels[type] || type;
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => localQuery.length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 py-2 bg-popover border rounded-md shadow-lg z-50"
        >
          {suggestions.map((suggestion, index) => (
            <Link
              key={suggestion.id}
              href={`/apps/${suggestion.id}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors',
                selectedIndex === index && 'bg-accent'
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => setShowSuggestions(false)}
            >
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                {suggestion.icon.startsWith('/') || suggestion.icon.startsWith('http') ? (
                  <img
                    src={suggestion.icon}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {suggestion.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{suggestion.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getTypeLabel(suggestion.type)}
                </p>
              </div>
            </Link>
          ))}

          {/* View all results */}
          <div className="px-3 pt-2 border-t mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-muted-foreground"
              onClick={() => {
                setShowSuggestions(false);
                setSearchQuery(localQuery);
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              View all results for &quot;{localQuery}&quot;
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {showSuggestions && localQuery.length >= 2 && suggestions.length === 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 p-4 bg-popover border rounded-md shadow-lg z-50 text-center text-muted-foreground"
        >
          No apps found for &quot;{localQuery}&quot;
        </div>
      )}
    </div>
  );
}
