# Smart Search UI - v0.7.0

Complete implementation of the Smart Search UI system for nself-chat.

## Overview

The v0.7.0 Smart Search UI provides a comprehensive search experience with advanced filtering, query building, analytics, and intelligent suggestions.

## Components

### 1. SearchResultCard

**Location**: `/src/components/search/SearchResultCard.tsx`

Enhanced search result card with:
- Message preview with highlighted search terms
- Author, channel, timestamp metadata
- Quick actions (open, share, bookmark)
- Thread preview indicator
- Attachment indicators
- Context preview (messages before/after)
- Relevance score display
- Reaction badges

**Usage**:
```tsx
import { SearchResultCard } from '@/components/search';

<SearchResultCard
  result={messageResult}
  query="project update"
  showContext={true}
  contextSize={1}
  isBookmarked={false}
  onClick={(result) => console.log('Clicked:', result)}
  onJumpToMessage={(result) => jumpToMessage(result)}
  onShare={(result) => shareMessage(result)}
  onToggleBookmark={(result) => toggleBookmark(result)}
/>
```

**Variants**:
- `SearchResultCard` - Full card with all features
- `CompactSearchResultCard` - Minimal version for lists

### 2. SearchHistory

**Location**: `/src/components/search/SearchHistory.tsx`

Search history management with:
- Recent searches list with timestamps
- Clear all history
- Remove individual searches
- Re-run previous search
- Filter count badges
- Export history to JSON
- Compact view option

**Usage**:
```tsx
import { SearchHistory } from '@/components/search';

<SearchHistory
  maxItems={50}
  onSelect={(search) => runSearch(search)}
  onExport={(searches) => exportToFile(searches)}
/>
```

**Variants**:
- `SearchHistory` - Full history manager
- `CompactSearchHistory` - Minimal list for dropdowns

### 3. SavedSearches

**Location**: `/src/components/search/SavedSearches.tsx`

Saved searches management with:
- Save search with custom name
- Edit saved search (enhanced version)
- Delete saved search
- Run saved search
- Organize into folders/categories
- Export/import saved searches
- Usage tracking

**Usage**:
```tsx
import { SavedSearches } from '@/components/search';

<SavedSearches
  onSelect={(search) => loadSearch(search)}
  onExport={(searches) => exportSearches(searches)}
  onImport={(searches) => importSearches(searches)}
/>
```

**Features**:
- Category organization (Work, Personal, etc.)
- Search statistics (usage count, last used)
- Drag and drop reordering (future enhancement)

### 4. AdvancedSearchBuilder

**Location**: `/src/components/search/AdvancedSearchBuilder.tsx`

Visual query builder with:
- Visual query builder UI
- Boolean operators (AND, OR, NOT)
- Field-specific search (from:user, in:channel, has:link, is:pinned)
- Real-time query preview
- Exact phrase matching
- Export/import queries
- Code view with syntax highlighting

**Usage**:
```tsx
import { AdvancedSearchBuilder } from '@/components/search';

<AdvancedSearchBuilder
  initialParts={[]}
  onChange={(query, parts) => console.log('Query:', query)}
  onSearch={(query) => performSearch(query)}
/>
```

**Query Syntax**:
```
from:alice             # Messages from user alice
in:general             # Messages in #general channel
has:link               # Messages containing links
is:pinned              # Pinned messages only
"exact phrase"         # Exact phrase match
term1 AND term2        # Both terms must appear
term1 OR term2         # Either term can appear
NOT term               # Exclude term
```

### 5. SearchAnalytics

**Location**: `/src/components/admin/search/SearchAnalytics.tsx`

Admin analytics dashboard with:
- Total searches and unique users
- Average search time
- Search success rate (clicks / searches)
- Top searches with success rates
- Zero-result searches tracking
- Search trends over time
- User behavior metrics
- Most used filters
- Export analytics data

**Usage**:
```tsx
import { SearchAnalytics } from '@/components/admin/search';

<SearchAnalytics
  timeRange="week"
  onExport={(data) => exportAnalytics(data)}
/>
```

**Metrics Tracked**:
- Overview: Total searches, unique users, avg time, success rate
- Top Searches: Query, count, success rate, avg click position
- Zero Results: Queries with no results (improvement opportunities)
- Trends: Search volume and success over time
- User Behavior: Avg queries per user, filter usage patterns

### 6. DateRangePicker

**Location**: `/src/components/ui/date-range-picker.tsx`

Comprehensive date range picker with:
- Calendar date picker
- Quick presets (today, yesterday, last week, last month, etc.)
- Custom date range selection
- Visual range highlighting
- Clear functionality
- Keyboard navigation ready

**Usage**:
```tsx
import { DateRangePicker } from '@/components/ui/date-range-picker';

<DateRangePicker
  value={{ from: new Date(), to: null }}
  onChange={(range) => setDateRange(range)}
  placeholder="Select date range"
  showPresets={true}
/>
```

**Presets**:
- Today
- Yesterday
- Last 7 days
- Last 14 days
- Last 30 days
- This week
- This month
- Last month

### 7. Enhanced SmartSearch Features

**Location**: `/src/components/search/SmartSearch.tsx` (existing, enhanced documentation)

The existing SmartSearch component provides AI-powered semantic search. It complements the v0.7.0 components with:
- Natural language queries
- Semantic search with embeddings
- Contextual result highlighting
- Intelligent ranking

## Integration Guide

### 1. Basic Search Implementation

```tsx
import {
  SearchModal,
  SearchResultCard,
  SearchHistory
} from '@/components/search';

function MySearchPage() {
  const [results, setResults] = useState([]);

  return (
    <div>
      <SearchModal
        onSearch={(query) => performSearch(query)}
        onMessageClick={(result) => openMessage(result)}
      />

      <div className="results">
        {results.map(result => (
          <SearchResultCard
            key={result.id}
            result={result}
            onClick={openMessage}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Advanced Search with Query Builder

```tsx
import {
  AdvancedSearchBuilder,
  SearchFilters
} from '@/components/search';

function AdvancedSearchPage() {
  return (
    <div>
      <AdvancedSearchBuilder
        onChange={(query, parts) => {
          console.log('Built query:', query);
          console.log('Query parts:', parts);
        }}
        onSearch={performSearch}
      />
    </div>
  );
}
```

### 3. Admin Analytics Dashboard

```tsx
import { SearchAnalytics } from '@/components/admin/search';

function AdminDashboard() {
  return (
    <SearchAnalytics
      timeRange="month"
      onExport={(data) => {
        // Export as CSV or JSON
        downloadFile(data, 'analytics.json');
      }}
    />
  );
}
```

## Keyboard Shortcuts

All search components support keyboard navigation:

- `Cmd/Ctrl + K` - Open search modal
- `Cmd/Ctrl + Shift + K` - Open search with filters
- `Escape` - Close search modal
- `↑/↓` - Navigate results
- `Enter` - Select result
- `Tab` - Switch between tabs

## Mobile Optimization

All components are mobile-responsive:

- Touch-friendly targets (minimum 44px)
- Swipe gestures for navigation
- Simplified layouts on small screens
- Progressive disclosure of advanced features

## Search Export Functionality

All components support data export:

1. **Search History**: Export as JSON
2. **Saved Searches**: Export/import with categories
3. **Search Analytics**: Export as JSON or CSV
4. **Query Builder**: Export/import query definitions

**Export Format**:
```json
{
  "version": "0.7.0",
  "exportedAt": "2026-01-31T...",
  "data": {
    "searches": [...],
    "analytics": {...}
  }
}
```

## Performance Considerations

### Optimization Techniques

1. **Virtual Scrolling**: Implemented in SearchResults for large result sets
2. **Debounced Search**: 300ms debounce on query input
3. **Lazy Loading**: Results load on scroll
4. **Memoization**: React.memo on result cards
5. **Code Splitting**: Lazy load advanced components

### Bundle Size

- SearchResultCard: ~8KB (gzipped)
- SearchHistory: ~5KB (gzipped)
- AdvancedSearchBuilder: ~12KB (gzipped)
- SearchAnalytics: ~15KB (gzipped)
- DateRangePicker: ~6KB (gzipped)

Total addition: ~46KB (gzipped)

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultCard } from '@/components/search';

describe('SearchResultCard', () => {
  it('highlights search terms', () => {
    render(
      <SearchResultCard
        result={mockResult}
        query="test query"
      />
    );

    expect(screen.getByText(/test/)).toHaveClass('bg-yellow-200');
  });

  it('calls onClick when card is clicked', () => {
    const onClick = jest.fn();
    render(
      <SearchResultCard
        result={mockResult}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(mockResult);
  });
});
```

### E2E Tests

```typescript
// e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test('advanced search builder', async ({ page }) => {
  await page.goto('/search');

  // Add search condition
  await page.click('button:has-text("Add condition")');

  // Select field
  await page.selectOption('select[name="field"]', 'from');

  // Enter value
  await page.fill('input[placeholder*="Username"]', 'alice');

  // Verify query preview
  const preview = await page.textContent('.query-preview');
  expect(preview).toContain('from:alice');
});
```

## API Integration

### Search API Endpoints

```typescript
// GraphQL Query
const SEARCH_MESSAGES = gql`
  query SearchMessages(
    $query: String!
    $filters: SearchFilters
    $limit: Int
    $offset: Int
  ) {
    searchMessages(
      query: $query
      filters: $filters
      limit: $limit
      offset: $offset
    ) {
      totalCount
      hasMore
      results {
        id
        content
        authorId
        authorName
        channelId
        channelName
        timestamp
        score
        highlights
        hasAttachments
        reactions {
          emoji
          count
        }
      }
    }
  }
`;
```

### Analytics API

```typescript
// GraphQL Query
const SEARCH_ANALYTICS = gql`
  query SearchAnalytics($timeRange: TimeRange!) {
    searchAnalytics(timeRange: $timeRange) {
      overview {
        totalSearches
        uniqueUsers
        avgSearchTime
        successRate
      }
      topSearches {
        query
        count
        successRate
        avgClickPosition
      }
      zeroResultSearches {
        query
        count
        lastSearched
      }
    }
  }
`;
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast ratios (minimum 4.5:1)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- iOS Safari: Latest 2 versions
- Android Chrome: Latest 2 versions

## Migration Guide

### From v0.6.0 to v0.7.0

1. **Update imports**:
```tsx
// Old
import { SearchResult } from '@/components/search/search-results';

// New
import { SearchResultCard } from '@/components/search';
```

2. **Update component usage**:
```tsx
// Old
<SearchResult result={result} />

// New
<SearchResultCard
  result={result}
  query={searchQuery}
  onJumpToMessage={handleJump}
/>
```

3. **Add date range picker**:
```tsx
import { DateRangePicker } from '@/components/ui/date-range-picker';

// In your filters
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

## Future Enhancements

Planned for v0.8.0:

- [ ] Voice search improvements (speech-to-text refinements)
- [ ] Search suggestions based on ML
- [ ] Collaborative search (share searches with team)
- [ ] Search templates library
- [ ] Advanced analytics visualizations
- [ ] Search performance profiling
- [ ] Multi-language support
- [ ] Fuzzy search tolerance settings

## Support

For issues or questions:
- GitHub Issues: https://github.com/nself-chat/nself-chat/issues
- Documentation: https://docs.nself.chat/search
- Discord: https://discord.gg/nself-chat

---

**Version**: 0.7.0
**Last Updated**: January 31, 2026
**Author**: Claude Sonnet 4.5 + Development Team
