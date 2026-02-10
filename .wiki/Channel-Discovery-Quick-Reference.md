# Channel Discovery - Quick Reference Card

**Version**: 1.0.0 | **Date**: Feb 1, 2026 | **Status**: ✅ Production Ready

---

## 🚀 Quick Start

```tsx
// 1. Import the hook
import { useChannelDiscovery } from '@/hooks/use-channel-discovery'

// 2. Use in your component
const { channels, isLoading, search } = useChannelDiscovery()

// 3. Render the browser
import { ChannelBrowser } from '@/components/channels/ChannelBrowser'
;<ChannelBrowser channels={channels} isLoading={isLoading} />
```

---

## 📦 Components

### ChannelBrowser

**Full-featured browsing interface**

```tsx
<ChannelBrowser
  channels={channels}
  joinedChannelIds={new Set(['id1', 'id2'])}
  isLoading={false}
  showSearch={true}
  showFilters={true}
  showCategories={true}
  onJoin={(id) => joinChannel(id)}
  onLeave={(id) => leaveChannel(id)}
/>
```

**Props**:

- `channels: Channel[]` - Channel list
- `joinedChannelIds?: Set<string>` - User's channels
- `isLoading?: boolean` - Loading state
- `showCreateButton?: boolean` - Show create button
- `showSearch?: boolean` - Show search
- `showFilters?: boolean` - Show filters
- `showCategories?: boolean` - Show categories
- `showFeatured?: boolean` - Show featured section
- `showPopular?: boolean` - Show popular section
- `showTrending?: boolean` - Show trending section
- `onJoin?: (channelId: string) => void` - Join handler
- `onLeave?: (channelId: string) => void` - Leave handler
- `onRefresh?: () => void` - Refresh handler

---

### ChannelDirectory

**Tree/grid/list directory view**

```tsx
<ChannelDirectory
  channels={channels}
  layout="tree" // 'tree' | 'grid' | 'list'
  showSearch={true}
  showSort={true}
  defaultExpanded={true}
/>
```

**Layouts**:

- `tree` - Collapsible tree with categories
- `grid` - Grid layout grouped by category
- `list` - Flat list of all channels

---

### ChannelCard

**Reusable channel card**

```tsx
<ChannelCard
  channel={channel}
  variant="default" // 'default' | 'compact' | 'featured'
  isJoined={false}
  isTrending={true}
  isNew={false}
  showStats={true}
  onJoin={(id) => {}}
/>
```

**Variants**:

- `default` - Full card with stats
- `compact` - Horizontal condensed
- `featured` - With gradient background

---

### ChannelInvite

**Invitation dialog**

```tsx
<ChannelInvite
  channel={channel}
  open={isOpen}
  onOpenChange={setIsOpen}
  onInvite={(userIds) => inviteUsers(userIds)}
/>
```

**Features**:

- User selection
- Invite link generation
- Email invitations

---

## 🪝 Hooks

### useChannelDiscovery

**Main discovery hook**

```tsx
const {
  // State
  channels, // All channels
  filteredChannels, // Filtered results
  results, // Discovery results with scores
  stats, // Statistics
  filters, // Current filters
  isLoading, // Loading state
  error, // Error state
  hasMore, // More results available
  total, // Total count

  // Actions
  setFilters, // Set filters
  resetFilters, // Reset all filters
  applyQuickFilter, // Apply quick filter
  search, // Search channels
  clearSearch, // Clear search
  fetchChannels, // Fetch channels
  fetchMore, // Load more
  refresh, // Refresh data

  // Recommendations
  getFeatured, // Get featured channels
  getPopular, // Get popular channels
  getTrending, // Get trending channels
  getNew, // Get new channels
  getSuggested, // Get suggested channels
} = useChannelDiscovery({
  autoFetch: true,
  enableRealtime: false,
  limit: 50,
  offset: 0,
  includeJoined: true,
  initialFilters: {
    type: 'public',
    sortBy: 'activity',
  },
})
```

---

## 🔍 Filtering & Sorting

### Filter Options

```typescript
setFilters({
  query: 'engineering', // Search text
  type: 'public', // 'public' | 'private' | 'all'
  categoryId: 'teams', // Category filter
  sortBy: 'activity', // Sort field
  sortDirection: 'desc', // 'asc' | 'desc'
  hasActivity: true, // Only active
  memberCountMin: 10, // Min members
  memberCountMax: 100, // Max members
  excludeJoined: false, // Exclude joined
  excludePrivate: false, // Exclude private
})
```

### Sort Options

- `name` - Alphabetical
- `memberCount` - By members
- `activity` - By last message
- `created` - By creation date
- `trending` - By recent activity
- `relevance` - By search relevance

### Quick Filters

```typescript
applyQuickFilter('all') // All channels
applyQuickFilter('public') // Public only
applyQuickFilter('private') // Private only
applyQuickFilter('active') // Recently active
applyQuickFilter('new') // Recently created
applyQuickFilter('popular') // Most members
applyQuickFilter('trending') // Trending now
```

---

## 🏷️ Categories

### Predefined Categories

```typescript
const categories = [
  { id: 'general', name: 'General', color: '#6366f1' },
  { id: 'announcements', name: 'Announcements', color: '#f59e0b' },
  { id: 'teams', name: 'Teams', color: '#10b981' },
  { id: 'projects', name: 'Projects', color: '#8b5cf6' },
  { id: 'support', name: 'Support', color: '#ef4444' },
  { id: 'social', name: 'Social', color: '#ec4899' },
  { id: 'resources', name: 'Resources', color: '#06b6d4' },
  { id: 'archived', name: 'Archived', color: '#64748b' },
]
```

### Filter by Category

```typescript
setFilters({ categoryId: 'teams' })
```

---

## 🌐 API

### REST Endpoint

```bash
GET /api/channels/discover
```

**Query Params**:

```bash
?q=engineering          # Search
&category=teams         # Category
&type=public           # Type
&sort=activity         # Sort
&order=desc            # Order
&limit=50              # Limit
&offset=0              # Offset
&excludeJoined=false   # Exclude joined
&includeStats=true     # Include stats
&includeRecommendations=true  # Include recommendations
```

**Response**:

```json
{
  "channels": [...],
  "total": 42,
  "hasMore": false,
  "stats": {...},
  "recommendations": {...}
}
```

---

## 📊 GraphQL Queries

### Get Public Channels

```graphql
query GetPublicChannels($limit: Int, $offset: Int) {
  nchat_channels(where: { is_private: { _eq: false } }, limit: $limit, offset: $offset) {
    id
    name
    slug
    description
    members_aggregate {
      aggregate {
        count
      }
    }
  }
}
```

### Search Channels

```graphql
query SearchChannels($query: String!, $limit: Int) {
  nchat_channels(
    where: { _or: [{ name: { _ilike: $query } }, { description: { _ilike: $query } }] }
    limit: $limit
  ) {
    id
    name
    slug
    description
  }
}
```

### Get Trending

```graphql
query GetTrendingChannels($limit: Int, $since: timestamptz!) {
  nchat_channels(
    where: { last_message_at: { _gte: $since } }
    order_by: { messages_aggregate: { count: desc } }
    limit: $limit
  ) {
    id
    name
    slug
  }
}
```

---

## 📈 Recommendations

### Get Featured Channels

```typescript
const featured = getFeatured(6)
// Returns default/featured channels
```

### Get Popular Channels

```typescript
const popular = getPopular(10)
// Returns channels sorted by member count
```

### Get Trending Channels

```typescript
const trending = getTrending(10)
// Returns recently active channels
```

### Get New Channels

```typescript
const newChannels = getNew(10)
// Returns recently created channels
```

### Get Suggested Channels

```typescript
const suggested = getSuggested(10)
// Returns personalized recommendations
```

---

## 🎯 Common Patterns

### Search

```typescript
const { search, clearSearch } = useChannelDiscovery()

<input
  onChange={(e) => search(e.target.value)}
  placeholder="Search channels..."
/>
```

### Filter by Category

```typescript
const { setFilters } = useChannelDiscovery()

<select onChange={(e) => setFilters({ categoryId: e.target.value })}>
  <option value="">All Categories</option>
  <option value="teams">Teams</option>
  <option value="projects">Projects</option>
</select>
```

### Sort Channels

```typescript
const { setFilters } = useChannelDiscovery()

<select onChange={(e) => setFilters({ sortBy: e.target.value })}>
  <option value="name">Name</option>
  <option value="memberCount">Members</option>
  <option value="activity">Activity</option>
</select>
```

### Pagination

```typescript
const { fetchMore, hasMore } = useChannelDiscovery()

{hasMore && <button onClick={fetchMore}>Load More</button>}
```

### Refresh

```typescript
const { refresh } = useChannelDiscovery()

<button onClick={refresh}>Refresh</button>
```

---

## 🎨 Styling

### Activity Levels

```typescript
const levels = {
  'very-active': 'text-green-600 border-green-500',
  active: 'text-emerald-600 border-emerald-500',
  moderate: 'text-yellow-600 border-yellow-500',
  quiet: 'text-orange-600 border-orange-500',
  inactive: 'text-gray-500 border-gray-400',
}
```

### Category Colors

```typescript
const colors = {
  general: '#6366f1', // Indigo
  announcements: '#f59e0b', // Amber
  teams: '#10b981', // Emerald
  projects: '#8b5cf6', // Violet
  support: '#ef4444', // Red
  social: '#ec4899', // Pink
  resources: '#06b6d4', // Cyan
}
```

---

## 🔧 TypeScript

### Channel Type

```typescript
interface Channel {
  id: string
  name: string
  slug: string
  description: string | null
  type: 'public' | 'private' | 'direct' | 'group'
  categoryId: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  topic: string | null
  icon: string | null
  color: string | null
  isArchived: boolean
  isDefault: boolean
  memberCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
}
```

### Discovery Filters

```typescript
interface DiscoveryFilters {
  query?: string
  type?: 'public' | 'private' | 'all'
  categoryId?: string
  sortBy?: 'name' | 'memberCount' | 'activity' | 'created' | 'trending'
  sortDirection?: 'asc' | 'desc'
  hasActivity?: boolean
  memberCountMin?: number
  memberCountMax?: number
  excludeJoined?: boolean
  excludePrivate?: boolean
}
```

---

## 🐛 Common Issues

### No channels showing

```typescript
// Check if data is loading
if (isLoading) return <Loading />

// Check for errors
if (error) return <Error message={error.message} />

// Check if channels array is populated
console.log('Channels:', channels.length)
```

### Filters not working

```typescript
// Reset filters
resetFilters()

// Check current filters
console.log('Current filters:', filters)

// Apply filters explicitly
setFilters({ type: 'public' })
```

### Search not working

```typescript
// Clear search first
clearSearch()

// Then search again
search('engineering')
```

---

## 📚 Resources

- **Full Docs**: `docs/Channel-Discovery-System.md`
- **Implementation**: `CHANNEL-DISCOVERY-IMPLEMENTATION.md`
- **Example**: `src/app/channels/browse/page.tsx`
- **Hook**: `src/hooks/use-channel-discovery.ts`
- **API**: `src/app/api/channels/discover/route.ts`

---

**Last Updated**: February 1, 2026
**Version**: 1.0.0
