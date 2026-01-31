# Smart Search UI v0.7.0 - Quick Reference

## Component Imports

### Search Result Cards
```tsx
import { 
  SearchResultCard, 
  CompactSearchResultCard 
} from '@/components/search';
```

### Search History
```tsx
import { 
  SearchHistory, 
  CompactSearchHistory 
} from '@/components/search';
```

### Saved Searches
```tsx
import { SavedSearches } from '@/components/search';
```

### Advanced Search Builder
```tsx
import { AdvancedSearchBuilder } from '@/components/search';
```

### Date Range Picker
```tsx
import { DateRangePicker } from '@/components/ui/date-range-picker';
```

### Search Analytics (Admin)
```tsx
import { SearchAnalytics } from '@/components/admin/search';
```

## Quick Usage Examples

### 1. Search Result Card
```tsx
<SearchResultCard
  result={messageResult}
  query="search terms"
  showContext={true}
  onClick={(result) => openMessage(result)}
  onJumpToMessage={(result) => jumpTo(result)}
/>
```

### 2. Search History
```tsx
<SearchHistory
  maxItems={50}
  onSelect={(search) => runSearch(search)}
  onExport={(data) => download(data)}
/>
```

### 3. Saved Searches
```tsx
<SavedSearches
  onSelect={(search) => loadSearch(search)}
  onExport={(data) => download(data)}
  onImport={(data) => import(data)}
/>
```

### 4. Advanced Search Builder
```tsx
<AdvancedSearchBuilder
  onChange={(query, parts) => updateQuery(query)}
  onSearch={(query) => executeSearch(query)}
/>
```

### 5. Date Range Picker
```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  showPresets={true}
/>
```

### 6. Search Analytics
```tsx
<SearchAnalytics
  timeRange="week"
  onExport={(data) => download(data)}
/>
```

## Query Syntax Reference

```
from:alice              # From user alice
in:general              # In #general channel
has:link                # Has link attachment
has:file                # Has file attachment
has:image               # Has image attachment
has:code                # Has code snippet
has:mention             # Has @mention
has:reaction            # Has reactions
is:pinned               # Pinned messages
is:starred              # Starred messages
is:thread               # In a thread
is:unread               # Unread messages
before:2026-01-31       # Before date
after:2026-01-01        # After date
on:2026-01-15           # On specific date
"exact phrase"          # Exact phrase match
term1 AND term2         # Both terms required
term1 OR term2          # Either term
NOT term                # Exclude term
```

## Keyboard Shortcuts

```
Cmd/Ctrl + K            # Open search modal
Cmd/Ctrl + Shift + K    # Open with filters
Escape                  # Close search
↑/↓                     # Navigate results
Enter                   # Select result
Tab                     # Switch tabs
```

## File Locations

```
/src/components/search/
├── SearchResultCard.tsx          ✨ NEW
├── SearchHistory.tsx              ✨ NEW
├── SavedSearches.tsx              ✨ ENHANCED
├── AdvancedSearchBuilder.tsx     ✨ NEW
└── index.ts                       ✨ UPDATED

/src/components/ui/
└── date-range-picker.tsx          ✨ NEW

/src/components/admin/search/
└── SearchAnalytics.tsx            ✨ NEW

/src/app/search-demo/
└── page.tsx                       ✨ NEW (Demo)

/docs/
└── Search-UI-v0.7.0.md            ✨ NEW (Full docs)
```

## Demo Page

Visit `/search-demo` to see all components in action with interactive examples.

## Documentation

Full documentation: `/docs/Search-UI-v0.7.0.md`

Implementation summary: `/SEARCH_IMPLEMENTATION_SUMMARY.md`

---

**Version**: 0.7.0  
**Status**: ✅ Complete  
**Date**: January 31, 2026
