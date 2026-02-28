# Thread System - Usage Examples

## Table of Contents

1. [Basic Thread Operations](#basic-thread-operations)
2. [Thread List Management](#thread-list-management)
3. [Real-time Updates](#real-time-updates)
4. [UI Integration](#ui-integration)
5. [Advanced Features](#advanced-features)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)

---

## Basic Thread Operations

### 1. Creating a Thread

```typescript
import { useThreads } from '@/hooks/use-threads'
import { Button } from '@/components/ui/button'

function StartThreadButton({ message, channelId }: {
  message: Message
  channelId: string
}) {
  const { createThread, loading } = useThreads({ channelId })

  const handleStartThread = async () => {
    const thread = await createThread(
      message.id,  // parentMessageId
      "Starting a discussion about this..."
    )

    if (thread) {
      console.log('Thread created:', thread.id)
      // Thread panel will open automatically via store
    }
  }

  return (
    <Button
      onClick={handleStartThread}
      disabled={loading}
      variant="ghost"
      size="sm"
    >
      Reply in Thread
    </Button>
  )
}
```

### 2. Replying to a Thread

```typescript
import { useThread } from '@/hooks/use-thread'
import { MessageInput } from '@/components/chat/message-input'

function ThreadReplySection({ threadId }: { threadId: string }) {
  const { sendReply, loadingMessages } = useThread({
    threadId,
    autoSubscribe: true
  })

  const handleSendReply = async (content: string) => {
    try {
      await sendReply(content)
      // Optimistic update happens automatically
      // UI updates immediately
    } catch (error) {
      console.error('Failed to send reply:', error)
      // Error handling UI
    }
  }

  return (
    <MessageInput
      onSendMessage={handleSendReply}
      placeholder="Reply to thread..."
      disabled={loadingMessages}
      compact
    />
  )
}
```

### 3. Following/Unfollowing a Thread

```typescript
import { useThread } from '@/hooks/use-thread'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'

function ThreadFollowButton({ threadId }: { threadId: string }) {
  const {
    isParticipant,
    joinThread,
    leaveThread
  } = useThread({ threadId })

  const handleToggleFollow = async () => {
    if (isParticipant) {
      await leaveThread()
    } else {
      await joinThread()
    }
  }

  return (
    <Button
      onClick={handleToggleFollow}
      variant={isParticipant ? 'default' : 'outline'}
      size="sm"
    >
      {isParticipant ? (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  )
}
```

### 4. Marking Thread as Read

```typescript
import { useThread } from '@/hooks/use-thread'
import { useEffect } from 'react'

function ThreadAutoMarkRead({ threadId }: { threadId: string }) {
  const { markAsRead, hasUnread } = useThread({ threadId })

  // Auto-mark as read when thread is viewed
  useEffect(() => {
    if (hasUnread) {
      const timer = setTimeout(() => {
        markAsRead()
      }, 1000) // Wait 1 second before marking as read

      return () => clearTimeout(timer)
    }
  }, [hasUnread, markAsRead])

  return null
}

// Manual mark as read
function MarkAsReadButton({ threadId }: { threadId: string }) {
  const { markAsRead, hasUnread } = useThread({ threadId })

  return (
    <Button
      onClick={markAsRead}
      disabled={!hasUnread}
      variant="ghost"
      size="sm"
    >
      Mark as read
    </Button>
  )
}
```

---

## Thread List Management

### 1. Displaying User's Threads

```typescript
import { useThreads } from '@/hooks/use-threads'
import { ThreadItem } from '@/components/thread/thread-item'
import { Loader2 } from 'lucide-react'

function MyThreadsList() {
  const {
    threads,
    unreadCount,
    loading,
    error,
    refreshThreads
  } = useThreads({
    userId: user?.id,  // Get threads user participates in
    limit: 20
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error loading threads</p>
        <Button onClick={refreshThreads}>Retry</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <h2 className="font-semibold">My Threads</h2>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} new</Badge>
        )}
      </div>

      <div className="space-y-2">
        {threads.map(thread => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            onClick={() => openThread(thread.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

### 2. Channel Threads List

```typescript
import { useThreads } from '@/hooks/use-threads'

function ChannelThreadsList({ channelId }: { channelId: string }) {
  const {
    threads,
    loading,
    loadMore,
    hasMore
  } = useThreads({
    channelId,
    limit: 10
  })

  return (
    <div>
      <h3>Active Threads in this Channel</h3>

      {threads.map(thread => (
        <div key={thread.id} className="p-2 border-b">
          <p className="font-medium">{thread.replyCount} replies</p>
          <p className="text-sm text-muted-foreground">
            Last reply: {formatDistanceToNow(thread.lastReplyAt)}
          </p>
        </div>
      ))}

      {hasMore && (
        <Button
          onClick={loadMore}
          disabled={loading}
          variant="ghost"
          className="w-full"
        >
          Load More
        </Button>
      )}
    </div>
  )
}
```

### 3. Thread Search

```typescript
import { useThreads } from '@/hooks/use-threads'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

function ThreadSearch({ channelId }: { channelId: string }) {
  const [query, setQuery] = useState('')
  const { threads, searchThreads, loading } = useThreads({ channelId })

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim()) {
      await searchThreads(value)
    }
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search threads..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <p>Searching...</p>}

      <div className="mt-4 space-y-2">
        {threads.map(thread => (
          <ThreadSearchResult key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  )
}
```

### 4. Thread Activity Feed

```typescript
import { useThreadActivity } from '@/hooks/use-threads'
import { formatDistanceToNow } from 'date-fns'

function ThreadActivityFeed() {
  const {
    activityItems,
    loading,
    loadMore,
    hasMore
  } = useThreadActivity({ limit: 50 })

  return (
    <div className="space-y-4">
      <h2>Thread Activity</h2>

      {activityItems.map(item => (
        <div
          key={item.id}
          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Badge variant={item.type === 'mentioned' ? 'default' : 'secondary'}>
              {item.type === 'mentioned' ? '@ Mentioned' :
               item.type === 'new_reply' ? 'New Reply' :
               'Thread Created'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm font-medium">#{item.channel.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.message.content}
          </p>

          {!item.isRead && (
            <Badge variant="destructive" className="mt-2">New</Badge>
          )}
        </div>
      ))}

      {hasMore && (
        <Button onClick={loadMore} disabled={loading} variant="outline" className="w-full">
          Load More Activity
        </Button>
      )}
    </div>
  )
}
```

---

## Real-time Updates

### 1. Subscribing to Thread Updates

```typescript
import { useThread } from '@/hooks/use-thread'
import { useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

function ThreadWithNotifications({ threadId }: { threadId: string }) {
  const {
    thread,
    messages,
    isParticipant
  } = useThread({
    threadId,
    autoSubscribe: true  // Enable real-time subscriptions
  })

  // Show toast when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      const isOwnMessage = latestMessage.user_id === user?.id

      if (!isOwnMessage && isParticipant) {
        toast({
          title: 'New reply in thread',
          description: `${latestMessage.user.display_name}: ${latestMessage.content.slice(0, 50)}...`,
        })
      }
    }
  }, [messages.length])

  return <ThreadView threadId={threadId} />
}
```

### 2. Live Unread Count

```typescript
import { useThreadStore, selectTotalUnreadThreadCount } from '@/stores/thread-store'
import { Badge } from '@/components/ui/badge'

function ThreadUnreadBadge() {
  const unreadCount = useThreadStore(selectTotalUnreadThreadCount)

  if (unreadCount === 0) return null

  return (
    <Badge variant="destructive" className="ml-2">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  )
}
```

### 3. Participant Presence

```typescript
import { useThread } from '@/hooks/use-thread'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function ThreadParticipantsLive({ threadId }: { threadId: string }) {
  const { participants } = useThread({
    threadId,
    autoSubscribe: true  // Gets real-time participant updates
  })

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {participants.length} participants
      </span>

      <div className="flex -space-x-2">
        {participants.slice(0, 5).map(participant => (
          <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={participant.user.avatar_url} />
            <AvatarFallback className="text-xs">
              {participant.user.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
        {participants.length > 5 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
            +{participants.length - 5}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## UI Integration

### 1. Thread Button on Message

```typescript
import { MessageThreadPreview } from '@/components/chat/message-thread-preview'
import { useThreadStore } from '@/stores/thread-store'

function MessageWithThread({ message }: { message: Message }) {
  const { openThread } = useThreadStore()

  return (
    <div className="message">
      {/* Message content */}
      <MessageContent content={message.content} />

      {/* Thread preview if exists */}
      {message.threadInfo && (
        <MessageThreadPreview
          threadInfo={message.threadInfo}
          onClick={() => openThread(message.id)}
        />
      )}

      {/* Start thread button if no thread */}
      {!message.threadInfo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStartThread(message)}
        >
          Reply in thread
        </Button>
      )}
    </div>
  )
}
```

### 2. Integrated Chat + Thread Layout

```typescript
import { ChatWithThreads } from '@/components/chat/chat-with-threads'
import { useThreadStore } from '@/stores/thread-store'

function ChannelView({ channel }: { channel: Channel }) {
  const { activeThreadId, closeThread } = useThreadStore()

  return (
    <ChatWithThreads
      channel={channel}
      messages={messages}
      onSendMessage={handleSendMessage}
      onOpenThread={(messageId) => openThread(messageId)}
      // Thread panel opens automatically when activeThreadId is set
    />
  )
}
```

### 3. Thread Sidebar Toggle

```typescript
import { ThreadSidebarTrigger } from '@/components/thread/thread-sidebar'
import { useThreadStore } from '@/stores/thread-store'

function ChannelHeader() {
  const { toggleThreadList, totalUnreadCount } = useThreadStore()

  return (
    <header className="flex items-center justify-between p-4">
      <h1>Channel Name</h1>

      <ThreadSidebarTrigger
        onClick={toggleThreadList}
        unreadCount={totalUnreadCount}
      />
    </header>
  )
}
```

### 4. Full Thread Sidebar

```typescript
import { ThreadSidebar } from '@/components/thread/thread-sidebar'
import { useThreadStore } from '@/stores/thread-store'
import { Sheet, SheetContent } from '@/components/ui/sheet'

function ThreadSidebarPanel() {
  const {
    threadListOpen,
    setThreadListOpen,
    activeThreadId,
    openThread
  } = useThreadStore()

  return (
    <Sheet open={threadListOpen} onOpenChange={setThreadListOpen}>
      <SheetContent side="right" className="w-80 p-0">
        <ThreadSidebar
          onSelectThread={(threadId) => {
            openThread(threadId)
            setThreadListOpen(false)
          }}
          selectedThreadId={activeThreadId}
          onClose={() => setThreadListOpen(false)}
          showHeader
        />
      </SheetContent>
    </Sheet>
  )
}
```

---

## Advanced Features

### 1. Thread AI Summary

```typescript
import { ThreadSummaryPanel } from '@/components/chat/ThreadSummaryPanel'
import { useThread } from '@/hooks/use-thread'

function ThreadWithSummary({ threadId }: { threadId: string }) {
  const { messages } = useThread({ threadId })

  // Convert thread messages to summary format
  const summaryMessages = messages.map(msg => ({
    id: msg.id,
    userId: msg.user_id,
    userName: msg.user.display_name,
    content: msg.content,
    timestamp: msg.created_at,
  }))

  return (
    <div>
      <ThreadSummaryPanel
        messages={summaryMessages}
        threadId={threadId}
        autoGenerate={false}
        onActionItemClick={(itemId) => {
          console.log('Action item clicked:', itemId)
        }}
      />
    </div>
  )
}
```

### 2. Thread Moderation

```typescript
import { useMutation } from '@apollo/client'
import { LOCK_THREAD, DELETE_THREAD } from '@/graphql/mutations/threads'

function ThreadModerationActions({ threadId }: { threadId: string }) {
  const [lockThread] = useMutation(LOCK_THREAD)
  const [deleteThread] = useMutation(DELETE_THREAD)

  const handleLockThread = async () => {
    await lockThread({ variables: { threadId } })
  }

  const handleDeleteThread = async () => {
    if (confirm('Are you sure you want to delete this thread?')) {
      await deleteThread({ variables: { threadId } })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleLockThread}>
          <Lock className="h-4 w-4 mr-2" />
          Lock Thread
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDeleteThread}
          className="text-destructive"
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Thread
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 3. Thread Archiving

```typescript
import { useMutation } from '@apollo/client'
import { ARCHIVE_THREAD, UNARCHIVE_THREAD } from '@/graphql/mutations/threads'

function ThreadArchiveButton({ threadId, isArchived }: {
  threadId: string
  isArchived: boolean
}) {
  const [archiveThread] = useMutation(ARCHIVE_THREAD)
  const [unarchiveThread] = useMutation(UNARCHIVE_THREAD)

  const handleToggleArchive = async () => {
    if (isArchived) {
      await unarchiveThread({ variables: { threadId } })
    } else {
      await archiveThread({ variables: { threadId } })
    }
  }

  return (
    <Button onClick={handleToggleArchive} variant="ghost" size="sm">
      <Archive className="h-4 w-4 mr-2" />
      {isArchived ? 'Unarchive' : 'Archive'}
    </Button>
  )
}
```

### 4. Bulk Thread Operations

```typescript
import { useThreads } from '@/hooks/use-threads'

function BulkThreadActions() {
  const { markAllAsRead } = useThreads()

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    toast({
      title: 'All threads marked as read',
      description: 'Your thread list has been cleared.',
    })
  }

  return (
    <Button onClick={handleMarkAllAsRead} variant="outline">
      <CheckCheck className="h-4 w-4 mr-2" />
      Mark All as Read
    </Button>
  )
}
```

---

## Error Handling

### 1. Graceful Error Display

```typescript
import { useThread } from '@/hooks/use-thread'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function ThreadWithErrorHandling({ threadId }: { threadId: string }) {
  const { thread, error, loading } = useThread({ threadId })

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load thread. Please try again later.
        </AlertDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </Alert>
    )
  }

  if (loading) {
    return <ThreadSkeleton />
  }

  return <ThreadView threadId={threadId} />
}
```

### 2. Failed Message Retry

```typescript
import { useThread } from '@/hooks/use-thread'
import { FailedMessageRetry } from '@/components/chat/failed-message-retry'

function ThreadMessagesWithRetry({ threadId }: { threadId: string }) {
  const { messages, sendReply } = useThread({ threadId })

  return (
    <div>
      {messages.map(message => {
        const isFailed = message.isPending && message.isFailed

        return (
          <div key={message.id}>
            <MessageItem message={message} />

            {isFailed && (
              <FailedMessageRetry
                messageId={message.id}
                content={message.content}
                onRetry={async () => {
                  await sendReply(message.content)
                }}
                onDelete={() => {
                  // Remove from local state
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

---

## Performance Optimization

### 1. Memoized Thread List

```typescript
import { useMemo } from 'react'
import { useThreads } from '@/hooks/use-threads'

function OptimizedThreadList() {
  const { threads } = useThreads()

  // Memoize expensive operations
  const sortedThreads = useMemo(() => {
    return threads
      .filter(t => !t.isArchived)
      .sort((a, b) =>
        new Date(b.lastReplyAt).getTime() -
        new Date(a.lastReplyAt).getTime()
      )
  }, [threads])

  const unreadThreads = useMemo(() => {
    return sortedThreads.filter(t => t.unreadCount > 0)
  }, [sortedThreads])

  return (
    <div>
      <h3>Unread ({unreadThreads.length})</h3>
      {unreadThreads.map(thread => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  )
}
```

### 2. Virtual Scrolling for Large Threads

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { useThread } from '@/hooks/use-thread'

function VirtualizedThreadMessages({ threadId }: { threadId: string }) {
  const { messages } = useThread({ threadId })
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageItem message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Debounced Search

```typescript
import { useDebouncedCallback } from 'use-debounce'
import { useThreads } from '@/hooks/use-threads'
import { useState } from 'react'

function DebouncedThreadSearch({ channelId }: { channelId: string }) {
  const [query, setQuery] = useState('')
  const { searchThreads, loading } = useThreads({ channelId })

  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      if (value.trim()) {
        searchThreads(value)
      }
    },
    500  // Wait 500ms after user stops typing
  )

  return (
    <Input
      type="search"
      placeholder="Search threads..."
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        debouncedSearch(e.target.value)
      }}
    />
  )
}
```

---

## Complete Integration Example

Here's a complete example showing how all pieces work together:

```typescript
'use client'

import { useState } from 'react'
import { ChatWithThreads } from '@/components/chat/chat-with-threads'
import { ThreadSidebar } from '@/components/thread/thread-sidebar'
import { ThreadSidebarTrigger } from '@/components/thread/thread-sidebar'
import { useThreadStore } from '@/stores/thread-store'
import { useThreads } from '@/hooks/use-threads'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Channel, Message } from '@/types'

export function ChannelWithThreads({ channel }: { channel: Channel }) {
  const [messages, setMessages] = useState<Message[]>([])

  const {
    activeThreadId,
    threadListOpen,
    openThread,
    closeThread,
    setThreadListOpen,
    totalUnreadCount,
  } = useThreadStore()

  const { createThread } = useThreads({
    channelId: channel.id
  })

  const handleOpenThread = async (messageId: string) => {
    openThread(messageId)
  }

  const handleSendMessage = async (content: string) => {
    // Send message logic
  }

  return (
    <div className="flex h-full">
      {/* Main chat + thread panel */}
      <div className="flex-1">
        <div className="border-b p-4 flex items-center justify-between">
          <h1 className="font-semibold"># {channel.name}</h1>

          <ThreadSidebarTrigger
            onClick={() => setThreadListOpen(true)}
            unreadCount={totalUnreadCount}
          />
        </div>

        <ChatWithThreads
          channel={channel}
          messages={messages}
          onSendMessage={handleSendMessage}
          onOpenThread={handleOpenThread}
        />
      </div>

      {/* Thread list sidebar */}
      <Sheet open={threadListOpen} onOpenChange={setThreadListOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <ThreadSidebar
            onSelectThread={(threadId) => {
              openThread(threadId)
              setThreadListOpen(false)
            }}
            selectedThreadId={activeThreadId}
            onClose={() => setThreadListOpen(false)}
            showHeader
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

This implementation provides a complete, production-ready thread system with all features working together seamlessly!
