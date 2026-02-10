# Offline Support & Sync Implementation Plan

**Version:** 0.9.1
**Date:** February 3, 2026
**Status:** Implementation Plan
**Tasks:** TODO.md Tasks 118-120 (Phase 17: Offline & Sync)

---

## Executive Summary

This document outlines the comprehensive implementation plan for completing offline support and synchronization capabilities in nself-chat. The project already has a **robust foundation** (v0.8.0) with ~8,000 lines of production code covering IndexedDB storage, network detection, conflict resolution, and React integration. This plan focuses on completing the remaining gaps to achieve **100% production readiness** per TODO.md requirements.

### Current State Assessment

| Component           | Status      | Completion |
| ------------------- | ----------- | ---------- |
| IndexedDB Storage   | Complete    | 100%       |
| Network Detection   | Complete    | 100%       |
| Message Queue       | Complete    | 100%       |
| Conflict Resolution | Partial     | 75%        |
| Settings Sync       | Partial     | 40%        |
| File Upload Queue   | Partial     | 30%        |
| Backend Integration | Not Started | 0%         |
| Service Worker      | Basic       | 60%        |

### Gaps Identified

1. **Backend Integration** - Sync methods have placeholder implementations
2. **File Upload Queue** - Basic structure exists, chunked/resumable uploads missing
3. **Settings Sync** - settingsStorage exists but no sync logic
4. **Conflict Resolution UI** - Components exist but not integrated
5. **Service Worker** - Basic caching, no Background Sync API integration
6. **E2E Testing** - Offline scenario tests not implemented

---

## Task 118: Offline Message Queueing

### Current Implementation

The existing implementation in `/src/lib/offline/` provides:

- `offline-queue.ts` - Message queuing with priority
- `sync-queue.ts` - Queue processing with retry logic
- `offline-storage.ts` - IndexedDB persistence
- `useOfflineQueue.ts` - React hook integration

### Remaining Work

#### 1.1 Complete Queue Processors

**File:** `/src/lib/sync/processors.ts` (NEW)

```typescript
/**
 * Production-ready queue processors for all action types
 */

import { getSyncQueue, type SyncQueueItem } from '@/lib/offline'
import { messageStorage, channelStorage } from '@/lib/offline/offline-storage'
import { getApolloClient } from '@/lib/apollo-client'
import {
  SEND_MESSAGE_MUTATION,
  EDIT_MESSAGE_MUTATION,
  DELETE_MESSAGE_MUTATION,
  ADD_REACTION_MUTATION,
  REMOVE_REACTION_MUTATION,
} from '@/graphql/mutations'

export interface ProcessorConfig {
  graphqlEndpoint: string
  authToken: () => string | null
  onError?: (error: Error, item: SyncQueueItem) => void
  onSuccess?: (item: SyncQueueItem, result: any) => void
}

export function registerAllProcessors(config: ProcessorConfig): void {
  const queue = getSyncQueue()
  const client = getApolloClient()

  // Message Send Processor
  queue.registerProcessor('message', async (item: SyncQueueItem) => {
    if (item.operation === 'create') {
      const { channelId, content, tempId, attachments, replyToId } = item.data

      const result = await client.mutate({
        mutation: SEND_MESSAGE_MUTATION,
        variables: { channelId, content, replyToId, attachments },
        context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
      })

      // Replace temp message with server message
      await messageStorage.remove(tempId)
      await messageStorage.save({
        ...result.data.insertMessage,
        isPending: false,
      })

      config.onSuccess?.(item, result.data.insertMessage)
      return result.data.insertMessage
    }

    if (item.operation === 'update') {
      const { messageId, content } = item.data

      const result = await client.mutate({
        mutation: EDIT_MESSAGE_MUTATION,
        variables: { messageId, content },
        context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
      })

      // Update local cache
      const existing = await messageStorage.get(messageId)
      if (existing) {
        await messageStorage.save({
          ...existing,
          content,
          updatedAt: new Date(),
        })
      }

      return result.data.updateMessage
    }

    if (item.operation === 'delete') {
      const { messageId } = item.data

      await client.mutate({
        mutation: DELETE_MESSAGE_MUTATION,
        variables: { messageId },
        context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
      })

      // Remove from local cache
      await messageStorage.remove(messageId)

      return { deleted: true, messageId }
    }
  })

  // Reaction Processor
  queue.registerProcessor('reaction', async (item: SyncQueueItem) => {
    const { messageId, emoji, userId } = item.data

    if (item.operation === 'create') {
      await client.mutate({
        mutation: ADD_REACTION_MUTATION,
        variables: { messageId, emoji },
        context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
      })
    }

    if (item.operation === 'delete') {
      await client.mutate({
        mutation: REMOVE_REACTION_MUTATION,
        variables: { messageId, emoji },
        context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
      })
    }

    return { success: true }
  })

  // Read Receipt Processor
  queue.registerProcessor('read_receipt', async (item: SyncQueueItem) => {
    const { channelId, messageId, timestamp } = item.data

    await client.mutate({
      mutation: MARK_READ_MUTATION,
      variables: { channelId, messageId, timestamp },
      context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
    })

    return { success: true }
  })

  // Typing Indicator Processor (low priority, no retry)
  queue.registerProcessor('typing', async (item: SyncQueueItem) => {
    const { channelId, isTyping } = item.data

    // Send via WebSocket instead of GraphQL for real-time
    const socket = getSocketConnection()
    socket.emit('typing', { channelId, isTyping })

    return { success: true }
  })

  // Presence Update Processor
  queue.registerProcessor('presence', async (item: SyncQueueItem) => {
    const { status, lastSeenAt } = item.data

    await client.mutate({
      mutation: UPDATE_PRESENCE_MUTATION,
      variables: { status, lastSeenAt },
      context: { headers: { Authorization: `Bearer ${config.authToken()}` } },
    })

    return { success: true }
  })
}
```

#### 1.2 Enhance Retry Logic

**File:** `/src/lib/offline/retry-strategies.ts` (NEW)

```typescript
/**
 * Advanced retry strategies for different failure scenarios
 */

export type FailureType =
  | 'network'
  | 'auth'
  | 'rate_limit'
  | 'server_error'
  | 'validation'
  | 'conflict'

export interface RetryDecision {
  shouldRetry: boolean
  delay: number
  maxRetries: number
  backoffFactor: number
}

export function getRetryStrategy(
  error: Error,
  statusCode?: number,
  attempt: number = 0
): RetryDecision {
  const failureType = classifyError(error, statusCode)

  switch (failureType) {
    case 'network':
      // Network errors - aggressive retry with exponential backoff
      return {
        shouldRetry: attempt < 10,
        delay: Math.min(1000 * Math.pow(2, attempt), 300000), // Max 5 min
        maxRetries: 10,
        backoffFactor: 2,
      }

    case 'rate_limit':
      // Rate limited - respect Retry-After header or use long delay
      const retryAfter = extractRetryAfter(error)
      return {
        shouldRetry: attempt < 5,
        delay: retryAfter || Math.min(60000 * (attempt + 1), 300000),
        maxRetries: 5,
        backoffFactor: 1,
      }

    case 'auth':
      // Auth errors - don't retry, need user action
      return {
        shouldRetry: false,
        delay: 0,
        maxRetries: 0,
        backoffFactor: 0,
      }

    case 'validation':
      // Validation errors - don't retry, data is bad
      return {
        shouldRetry: false,
        delay: 0,
        maxRetries: 0,
        backoffFactor: 0,
      }

    case 'server_error':
      // Server errors - retry with longer delays
      return {
        shouldRetry: attempt < 5,
        delay: Math.min(5000 * Math.pow(2, attempt), 120000),
        maxRetries: 5,
        backoffFactor: 2,
      }

    case 'conflict':
      // Conflicts - retry after resolution
      return {
        shouldRetry: true,
        delay: 1000,
        maxRetries: 3,
        backoffFactor: 1,
      }

    default:
      return {
        shouldRetry: attempt < 3,
        delay: 5000,
        maxRetries: 3,
        backoffFactor: 2,
      }
  }
}

function classifyError(error: Error, statusCode?: number): FailureType {
  if (!navigator.onLine || error.message.includes('fetch')) {
    return 'network'
  }

  switch (statusCode) {
    case 401:
    case 403:
      return 'auth'
    case 400:
    case 422:
      return 'validation'
    case 409:
      return 'conflict'
    case 429:
      return 'rate_limit'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'server_error'
    default:
      return 'network'
  }
}

function extractRetryAfter(error: Error): number | null {
  // Extract Retry-After header from error if available
  const match = error.message.match(/retry-after:\s*(\d+)/i)
  return match ? parseInt(match[1], 10) * 1000 : null
}
```

#### 1.3 Queue Persistence Guarantees

**File:** `/src/lib/offline/queue-persistence.ts` (NEW)

```typescript
/**
 * Enhanced queue persistence with integrity checks
 */

import { queueStorage } from './offline-storage'
import type { QueuedAction } from './offline-types'

export interface QueueSnapshot {
  version: number
  timestamp: Date
  items: QueuedAction[]
  checksum: string
}

export class QueuePersistence {
  private readonly SNAPSHOT_KEY = 'nchat-queue-snapshot'
  private readonly INTEGRITY_CHECK_INTERVAL = 60000 // 1 minute

  /**
   * Create a snapshot of the current queue for recovery
   */
  async createSnapshot(): Promise<QueueSnapshot> {
    const items = await queueStorage.getAll()
    const snapshot: QueueSnapshot = {
      version: 1,
      timestamp: new Date(),
      items,
      checksum: this.calculateChecksum(items),
    }

    // Store in localStorage as backup
    try {
      localStorage.setItem(this.SNAPSHOT_KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.warn('[QueuePersistence] LocalStorage backup failed:', e)
    }

    return snapshot
  }

  /**
   * Verify queue integrity and repair if needed
   */
  async verifyAndRepair(): Promise<{
    verified: boolean
    repaired: boolean
    itemsRecovered: number
  }> {
    const items = await queueStorage.getAll()
    const currentChecksum = this.calculateChecksum(items)

    // Try to load backup snapshot
    const snapshotJson = localStorage.getItem(this.SNAPSHOT_KEY)
    if (!snapshotJson) {
      return { verified: true, repaired: false, itemsRecovered: 0 }
    }

    const snapshot: QueueSnapshot = JSON.parse(snapshotJson)

    // Check if IndexedDB is missing items from snapshot
    const snapshotIds = new Set(snapshot.items.map((i) => i.id))
    const currentIds = new Set(items.map((i) => i.id))

    const missingItems = snapshot.items.filter(
      (item) => !currentIds.has(item.id) && item.status === 'pending'
    )

    if (missingItems.length > 0) {
      // Recover missing items
      for (const item of missingItems) {
        await queueStorage.add(item)
      }
      console.log(`[QueuePersistence] Recovered ${missingItems.length} items`)
      return {
        verified: false,
        repaired: true,
        itemsRecovered: missingItems.length,
      }
    }

    return { verified: true, repaired: false, itemsRecovered: 0 }
  }

  /**
   * Calculate checksum for integrity verification
   */
  private calculateChecksum(items: QueuedAction[]): string {
    const data = items
      .map((i) => `${i.id}:${i.status}:${i.retryCount}`)
      .sort()
      .join('|')

    // Simple hash for integrity check
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  /**
   * Start periodic integrity checks
   */
  startIntegrityMonitoring(): () => void {
    const interval = setInterval(async () => {
      await this.verifyAndRepair()
      await this.createSnapshot()
    }, this.INTEGRITY_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }
}

export const queuePersistence = new QueuePersistence()
```

#### 1.4 Sync Status Indicators

**File:** `/src/components/chat/message-status-indicator.tsx` (NEW)

```typescript
'use client';

import { Check, CheckCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type MessageStatus =
  | 'pending'      // Queued locally
  | 'sending'      // Currently sending
  | 'sent'         // Sent to server
  | 'delivered'    // Delivered to recipient(s)
  | 'read'         // Read by recipient(s)
  | 'failed';      // Failed to send

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  error?: string;
  retryCount?: number;
  className?: string;
  onRetry?: () => void;
}

export function MessageStatusIndicator({
  status,
  error,
  retryCount,
  className,
  onRetry,
}: MessageStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sending':
        return <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
  };

  const getTooltipContent = () => {
    switch (status) {
      case 'pending':
        return 'Waiting to send';
      case 'sending':
        return retryCount && retryCount > 0
          ? `Retrying (attempt ${retryCount + 1})...`
          : 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return error || 'Failed to send';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1',
            status === 'failed' && onRetry && 'cursor-pointer hover:opacity-80',
            className
          )}
          onClick={status === 'failed' && onRetry ? onRetry : undefined}
        >
          {getStatusIcon()}
          {status === 'failed' && onRetry && (
            <span className="text-xs text-destructive">Tap to retry</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## Task 119: Conflict Resolution for Offline Edits

### Current Implementation

The existing `/src/lib/offline/conflict-resolver.ts` provides:

- ConflictResolver class with multiple strategies
- Last-write-wins, local-wins, remote-wins, merge
- TombstoneStore for deletion tracking
- Message merge logic

### Remaining Work

#### 2.1 Version Vectors for CRDT-like Behavior

**File:** `/src/lib/offline/version-vector.ts` (NEW)

```typescript
/**
 * Version vectors for tracking distributed state
 * Enables accurate conflict detection in multi-device scenarios
 */

export interface VersionVector {
  [nodeId: string]: number
}

export interface VectorClock {
  vector: VersionVector
  nodeId: string
}

export class VersionVectorManager {
  private nodeId: string
  private vector: VersionVector = {}

  constructor(nodeId?: string) {
    this.nodeId = nodeId || this.generateNodeId()
    this.vector[this.nodeId] = 0
  }

  /**
   * Increment local version
   */
  increment(): VersionVector {
    this.vector[this.nodeId] = (this.vector[this.nodeId] || 0) + 1
    return { ...this.vector }
  }

  /**
   * Merge with another vector (max of each component)
   */
  merge(other: VersionVector): VersionVector {
    const merged = { ...this.vector }

    for (const [nodeId, version] of Object.entries(other)) {
      merged[nodeId] = Math.max(merged[nodeId] || 0, version)
    }

    this.vector = merged
    return merged
  }

  /**
   * Compare two vectors to determine causal relationship
   */
  compare(a: VersionVector, b: VersionVector): 'before' | 'after' | 'concurrent' | 'equal' {
    let aBeforeB = false
    let bBeforeA = false

    const allNodes = new Set([...Object.keys(a), ...Object.keys(b)])

    for (const nodeId of allNodes) {
      const aVersion = a[nodeId] || 0
      const bVersion = b[nodeId] || 0

      if (aVersion < bVersion) aBeforeB = true
      if (bVersion < aVersion) bBeforeA = true
    }

    if (aBeforeB && !bBeforeA) return 'before'
    if (bBeforeA && !aBeforeB) return 'after'
    if (!aBeforeB && !bBeforeA) return 'equal'
    return 'concurrent'
  }

  /**
   * Check if vector a happened before vector b
   */
  happenedBefore(a: VersionVector, b: VersionVector): boolean {
    return this.compare(a, b) === 'before'
  }

  /**
   * Detect if two vectors are concurrent (conflict)
   */
  isConcurrent(a: VersionVector, b: VersionVector): boolean {
    return this.compare(a, b) === 'concurrent'
  }

  /**
   * Get current vector
   */
  getVector(): VersionVector {
    return { ...this.vector }
  }

  /**
   * Generate unique node ID for this device
   */
  private generateNodeId(): string {
    // Try to get persistent device ID
    let deviceId = localStorage.getItem('nchat-device-id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem('nchat-device-id', deviceId)
    }
    return deviceId
  }

  /**
   * Serialize for storage/transmission
   */
  serialize(): string {
    return JSON.stringify({
      nodeId: this.nodeId,
      vector: this.vector,
    })
  }

  /**
   * Deserialize from storage/transmission
   */
  static deserialize(data: string): VersionVectorManager {
    const { nodeId, vector } = JSON.parse(data)
    const manager = new VersionVectorManager(nodeId)
    manager.vector = vector
    return manager
  }
}

// Singleton for the current device
let versionManager: VersionVectorManager | null = null

export function getVersionManager(): VersionVectorManager {
  if (!versionManager) {
    // Try to restore from storage
    const stored = localStorage.getItem('nchat-version-vector')
    if (stored) {
      versionManager = VersionVectorManager.deserialize(stored)
    } else {
      versionManager = new VersionVectorManager()
    }
  }
  return versionManager
}

export function persistVersionVector(): void {
  if (versionManager) {
    localStorage.setItem('nchat-version-vector', versionManager.serialize())
  }
}
```

#### 2.2 Enhanced Merge Strategies

**File:** `/src/lib/offline/merge-strategies.ts` (NEW)

```typescript
/**
 * Advanced merge strategies for different data types
 */

import type { CachedMessage, CachedChannel, CachedUser } from './offline-types'

export interface MergeResult<T> {
  success: boolean
  merged: T | null
  conflicts: string[]
}

/**
 * Three-way merge for messages
 */
export function mergeMessages(
  base: CachedMessage | null,
  local: CachedMessage,
  remote: CachedMessage
): MergeResult<CachedMessage> {
  const conflicts: string[] = []

  // If no base (new message), use timestamp
  if (!base) {
    const useLocal = new Date(local.createdAt) > new Date(remote.createdAt)
    return {
      success: true,
      merged: useLocal ? local : remote,
      conflicts: [],
    }
  }

  // Check content changes
  const localContentChanged = local.content !== base.content
  const remoteContentChanged = remote.content !== base.content

  let mergedContent: string

  if (!localContentChanged && !remoteContentChanged) {
    mergedContent = base.content
  } else if (localContentChanged && !remoteContentChanged) {
    mergedContent = local.content
  } else if (!localContentChanged && remoteContentChanged) {
    mergedContent = remote.content
  } else {
    // Both changed - try text merge
    const textMerge = mergeText(base.content, local.content, remote.content)
    if (textMerge.hasConflict) {
      conflicts.push('Content was edited on multiple devices')
      // Use most recent
      mergedContent =
        new Date(local.updatedAt || local.createdAt) >
        new Date(remote.updatedAt || remote.createdAt)
          ? local.content
          : remote.content
    } else {
      mergedContent = textMerge.result
    }
  }

  // Merge reactions (union)
  const mergedReactions = mergeReactions(base.reactions, local.reactions, remote.reactions)

  // Merge attachments (union)
  const mergedAttachments = mergeAttachments(
    base.attachments,
    local.attachments,
    remote.attachments
  )

  const merged: CachedMessage = {
    ...remote,
    content: mergedContent,
    reactions: mergedReactions,
    attachments: mergedAttachments,
    updatedAt: new Date(),
  }

  return {
    success: conflicts.length === 0,
    merged,
    conflicts,
  }
}

/**
 * Simple text merge (line-based)
 */
function mergeText(
  base: string,
  local: string,
  remote: string
): { result: string; hasConflict: boolean } {
  // If one side is unchanged, use the other
  if (base === local) return { result: remote, hasConflict: false }
  if (base === remote) return { result: local, hasConflict: false }

  // Simple heuristic: if both added text at different positions, concatenate
  const localAdded = local.replace(base, '').trim()
  const remoteAdded = remote.replace(base, '').trim()

  if (localAdded && remoteAdded && local.includes(base) && remote.includes(base)) {
    // Both are additions - append both
    return {
      result: `${base}\n${localAdded}\n${remoteAdded}`,
      hasConflict: false,
    }
  }

  // Can't auto-merge
  return { result: '', hasConflict: true }
}

/**
 * Merge reaction arrays (CRDT set union)
 */
function mergeReactions(
  base: CachedMessage['reactions'],
  local: CachedMessage['reactions'],
  remote: CachedMessage['reactions']
): CachedMessage['reactions'] {
  const merged = new Map<string, CachedMessage['reactions'][0]>()

  // Add all base reactions
  for (const r of base) {
    merged.set(r.emoji, { ...r })
  }

  // Merge local (additions/changes)
  for (const r of local) {
    const existing = merged.get(r.emoji)
    if (existing) {
      const userIds = new Set([...existing.userIds, ...r.userIds])
      merged.set(r.emoji, {
        ...r,
        userIds: Array.from(userIds),
        count: userIds.size,
      })
    } else {
      merged.set(r.emoji, r)
    }
  }

  // Merge remote (additions/changes)
  for (const r of remote) {
    const existing = merged.get(r.emoji)
    if (existing) {
      const userIds = new Set([...existing.userIds, ...r.userIds])
      merged.set(r.emoji, {
        ...r,
        userIds: Array.from(userIds),
        count: userIds.size,
      })
    } else {
      merged.set(r.emoji, r)
    }
  }

  // Handle removals (if user removed, don't include them)
  // This is simplified - full CRDT would track add/remove sets

  return Array.from(merged.values())
}

/**
 * Merge attachment arrays (union by ID)
 */
function mergeAttachments(
  base: CachedMessage['attachments'],
  local: CachedMessage['attachments'],
  remote: CachedMessage['attachments']
): CachedMessage['attachments'] {
  const merged = new Map<string, CachedMessage['attachments'][0]>()

  for (const a of [...base, ...local, ...remote]) {
    merged.set(a.id, a)
  }

  return Array.from(merged.values())
}

/**
 * Merge user settings
 */
export function mergeUserSettings<T extends Record<string, any>>(
  base: T | null,
  local: T,
  remote: T
): MergeResult<T> {
  if (!base) {
    // No base - use most recent by comparing timestamps if available
    return {
      success: true,
      merged: { ...local, ...remote },
      conflicts: [],
    }
  }

  const merged = { ...base } as T
  const conflicts: string[] = []

  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)])

  for (const key of allKeys) {
    const baseVal = base[key]
    const localVal = local[key]
    const remoteVal = remote[key]

    const localChanged = JSON.stringify(localVal) !== JSON.stringify(baseVal)
    const remoteChanged = JSON.stringify(remoteVal) !== JSON.stringify(baseVal)

    if (!localChanged && !remoteChanged) {
      merged[key as keyof T] = baseVal
    } else if (localChanged && !remoteChanged) {
      merged[key as keyof T] = localVal
    } else if (!localChanged && remoteChanged) {
      merged[key as keyof T] = remoteVal
    } else {
      // Both changed - last write wins for settings
      // Could be enhanced to check timestamps per field
      merged[key as keyof T] = remoteVal // Prefer server
      conflicts.push(`Setting "${key}" was changed on multiple devices`)
    }
  }

  return {
    success: conflicts.length === 0,
    merged,
    conflicts,
  }
}
```

#### 2.3 Conflict Resolution UI Component

**File:** `/src/components/sync/conflict-resolution-dialog.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Conflict, ResolutionStrategy } from '@/lib/offline';

interface ConflictResolutionDialogProps {
  conflict: Conflict;
  open: boolean;
  onResolve: (choice: 'local' | 'remote' | 'merge', mergedValue?: any) => void;
  onCancel: () => void;
}

export function ConflictResolutionDialog({
  conflict,
  open,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  const [choice, setChoice] = useState<'local' | 'remote' | 'merge'>('remote');
  const [mergedContent, setMergedContent] = useState('');

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const getConflictDescription = () => {
    switch (conflict.type) {
      case 'concurrent_edit':
        return 'This item was edited on multiple devices at the same time.';
      case 'delete_edit':
        return 'This item was deleted on one device but edited on another.';
      case 'version_mismatch':
        return 'The version on the server is different from your local version.';
      default:
        return 'A conflict was detected during sync.';
    }
  };

  const handleResolve = () => {
    if (choice === 'merge') {
      // For messages, allow editing merged content
      const merged = conflict.itemType === 'message'
        ? { ...conflict.remote, content: mergedContent }
        : conflict.remote;
      onResolve('merge', merged);
    } else {
      onResolve(choice);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resolve Conflict</DialogTitle>
          <DialogDescription>{getConflictDescription()}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compare" className="w-full">
          <TabsList>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            {conflict.itemType === 'message' && (
              <TabsTrigger value="merge">Merge</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="compare">
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Local Version */}
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  choice === 'local' && 'border-primary ring-2 ring-primary'
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Your Version</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(conflict.localTimestamp)}
                  </span>
                </div>
                <ScrollArea className="h-40">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(conflict.local, null, 2)}
                  </pre>
                </ScrollArea>
                <Button
                  variant={choice === 'local' ? 'default' : 'outline'}
                  className="w-full mt-2"
                  onClick={() => setChoice('local')}
                >
                  Use This Version
                </Button>
              </div>

              {/* Remote Version */}
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  choice === 'remote' && 'border-primary ring-2 ring-primary'
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Server Version</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(conflict.remoteTimestamp)}
                  </span>
                </div>
                <ScrollArea className="h-40">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(conflict.remote, null, 2)}
                  </pre>
                </ScrollArea>
                <Button
                  variant={choice === 'remote' ? 'default' : 'outline'}
                  className="w-full mt-2"
                  onClick={() => setChoice('remote')}
                >
                  Use This Version
                </Button>
              </div>
            </div>
          </TabsContent>

          {conflict.itemType === 'message' && (
            <TabsContent value="merge">
              <div className="mt-4">
                <Label>Edit merged content:</Label>
                <textarea
                  className="w-full h-40 mt-2 p-2 border rounded-md font-mono text-sm"
                  value={mergedContent || (conflict.local as any)?.content || ''}
                  onChange={(e) => {
                    setMergedContent(e.target.value);
                    setChoice('merge');
                  }}
                  placeholder="Edit the merged content..."
                />
                <Button
                  variant={choice === 'merge' ? 'default' : 'outline'}
                  className="w-full mt-2"
                  onClick={() => setChoice('merge')}
                >
                  Use Merged Version
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>
            Apply Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Task 120: Settings Sync

### Current Implementation

- `settingsStorage` in `/src/lib/offline/offline-storage.ts` - basic key-value storage
- `AppConfigContext` uses localStorage + API sync

### Remaining Work

#### 3.1 User Preferences Sync Service

**File:** `/src/lib/sync/settings-sync.ts` (NEW)

```typescript
/**
 * Settings synchronization service
 * Handles sync of user preferences across devices
 */

import { settingsStorage } from '@/lib/offline/offline-storage'
import { getSyncQueue } from '@/lib/offline/sync-queue'
import { getConflictResolver } from '@/lib/offline/conflict-resolver'
import { mergeUserSettings } from '@/lib/offline/merge-strategies'

// =============================================================================
// Types
// =============================================================================

export interface UserPreferences {
  // Notification settings
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    mentions: boolean
    directMessages: boolean
    channelMessages: boolean
    quietHoursEnabled: boolean
    quietHoursStart: string // "22:00"
    quietHoursEnd: string // "08:00"
  }

  // Theme settings
  theme: {
    colorScheme: 'light' | 'dark' | 'system'
    preset: string
    customColors?: Record<string, string>
    fontSize: 'small' | 'medium' | 'large'
    compactMode: boolean
  }

  // Chat settings
  chat: {
    enterToSend: boolean
    showTimestamps: boolean
    timestampFormat: '12h' | '24h'
    showReadReceipts: boolean
    showTypingIndicators: boolean
    messagePreview: boolean
    linkPreviews: boolean
    emojiSuggestions: boolean
    spellCheck: boolean
  }

  // Privacy settings
  privacy: {
    showOnlineStatus: boolean
    showLastSeen: boolean
    showReadReceipts: boolean
    allowDirectMessages: 'everyone' | 'contacts' | 'none'
  }

  // Accessibility settings
  accessibility: {
    reduceMotion: boolean
    highContrast: boolean
    screenReaderMode: boolean
    keyboardShortcuts: boolean
  }

  // Device-specific (not synced)
  device?: {
    pushToken?: string
    deviceId?: string
    lastActiveAt?: Date
  }

  // Metadata
  _version: number
  _updatedAt: Date
  _deviceId: string
}

export interface SettingsSyncResult {
  success: boolean
  hadConflicts: boolean
  resolvedPreferences: UserPreferences
  syncedAt: Date
}

// =============================================================================
// Default Preferences
// =============================================================================

export const defaultPreferences: Omit<UserPreferences, '_version' | '_updatedAt' | '_deviceId'> = {
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    mentions: true,
    directMessages: true,
    channelMessages: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },
  theme: {
    colorScheme: 'system',
    preset: 'nself',
    fontSize: 'medium',
    compactMode: false,
  },
  chat: {
    enterToSend: true,
    showTimestamps: true,
    timestampFormat: '12h',
    showReadReceipts: true,
    showTypingIndicators: true,
    messagePreview: true,
    linkPreviews: true,
    emojiSuggestions: true,
    spellCheck: true,
  },
  privacy: {
    showOnlineStatus: true,
    showLastSeen: true,
    showReadReceipts: true,
    allowDirectMessages: 'everyone',
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReaderMode: false,
    keyboardShortcuts: true,
  },
}

// =============================================================================
// Settings Sync Service
// =============================================================================

export class SettingsSyncService {
  private static readonly SETTINGS_KEY = 'user-preferences'
  private static readonly SYNC_DEBOUNCE = 2000 // 2 seconds
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private pendingChanges: Partial<UserPreferences> = {}

  /**
   * Get current preferences (local)
   */
  async getPreferences(): Promise<UserPreferences> {
    const stored = await settingsStorage.get<UserPreferences>(SettingsSyncService.SETTINGS_KEY)

    if (stored) {
      return stored
    }

    // Initialize with defaults
    const deviceId = this.getDeviceId()
    const initial: UserPreferences = {
      ...defaultPreferences,
      _version: 1,
      _updatedAt: new Date(),
      _deviceId: deviceId,
    }

    await settingsStorage.set(SettingsSyncService.SETTINGS_KEY, initial)
    return initial
  }

  /**
   * Update preferences (debounced sync)
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences()

    // Deep merge updates
    const updated: UserPreferences = {
      ...current,
      notifications: { ...current.notifications, ...updates.notifications },
      theme: { ...current.theme, ...updates.theme },
      chat: { ...current.chat, ...updates.chat },
      privacy: { ...current.privacy, ...updates.privacy },
      accessibility: { ...current.accessibility, ...updates.accessibility },
      _version: current._version + 1,
      _updatedAt: new Date(),
      _deviceId: this.getDeviceId(),
    }

    // Save locally immediately
    await settingsStorage.set(SettingsSyncService.SETTINGS_KEY, updated)

    // Queue for sync (debounced)
    this.queueSync(updated)

    return updated
  }

  /**
   * Queue sync with debouncing
   */
  private queueSync(preferences: UserPreferences): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.syncTimer = setTimeout(async () => {
      await this.syncToServer(preferences)
    }, SettingsSyncService.SYNC_DEBOUNCE)
  }

  /**
   * Sync to server
   */
  async syncToServer(preferences: UserPreferences): Promise<void> {
    const queue = getSyncQueue()

    await queue.add(
      'settings',
      'update',
      {
        preferences: this.stripDeviceSpecific(preferences),
      },
      {
        priority: 5, // Medium priority
        deduplicate: true,
        dedupeKey: 'settings-sync',
      }
    )
  }

  /**
   * Fetch and merge from server
   */
  async syncFromServer(): Promise<SettingsSyncResult> {
    const local = await this.getPreferences()

    try {
      const response = await fetch('/api/user/preferences')
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const remote: UserPreferences = await response.json()

      // Check for conflicts
      if (this.hasConflict(local, remote)) {
        const resolver = getConflictResolver()
        const basePrefs = await this.getBasePreferences()

        const mergeResult = mergeUserSettings(basePrefs, local, remote)

        if (!mergeResult.success) {
          // Has unresolved conflicts - use conflict resolver
          const conflict = {
            id: 'user-preferences',
            type: 'concurrent_edit' as const,
            itemType: 'settings',
            local,
            remote,
            localTimestamp: new Date(local._updatedAt),
            remoteTimestamp: new Date(remote._updatedAt),
          }

          const resolution = await resolver.autoResolve(conflict)

          if (resolution.resolved) {
            await settingsStorage.set(SettingsSyncService.SETTINGS_KEY, resolution.result)

            return {
              success: true,
              hadConflicts: true,
              resolvedPreferences: resolution.result,
              syncedAt: new Date(),
            }
          }
        }

        // Use merged result
        const resolved = {
          ...mergeResult.merged!,
          _version: Math.max(local._version, remote._version) + 1,
          _updatedAt: new Date(),
          _deviceId: this.getDeviceId(),
        }

        await settingsStorage.set(SettingsSyncService.SETTINGS_KEY, resolved)
        await this.setBasePreferences(resolved)

        return {
          success: true,
          hadConflicts: mergeResult.conflicts.length > 0,
          resolvedPreferences: resolved,
          syncedAt: new Date(),
        }
      }

      // No conflict - use server version if newer
      if (new Date(remote._updatedAt) > new Date(local._updatedAt)) {
        const updated = {
          ...remote,
          device: local.device, // Keep device-specific settings
          _deviceId: this.getDeviceId(),
        }

        await settingsStorage.set(SettingsSyncService.SETTINGS_KEY, updated)
        await this.setBasePreferences(updated)

        return {
          success: true,
          hadConflicts: false,
          resolvedPreferences: updated,
          syncedAt: new Date(),
        }
      }

      // Local is newer - sync to server
      await this.syncToServer(local)

      return {
        success: true,
        hadConflicts: false,
        resolvedPreferences: local,
        syncedAt: new Date(),
      }
    } catch (error) {
      console.error('[SettingsSync] Sync failed:', error)
      return {
        success: false,
        hadConflicts: false,
        resolvedPreferences: local,
        syncedAt: new Date(),
      }
    }
  }

  /**
   * Check if there's a conflict between local and remote
   */
  private hasConflict(local: UserPreferences, remote: UserPreferences): boolean {
    // Different devices edited since last sync
    return (
      local._deviceId !== remote._deviceId &&
      Math.abs(new Date(local._updatedAt).getTime() - new Date(remote._updatedAt).getTime()) < 60000 // Within 1 minute
    )
  }

  /**
   * Strip device-specific fields for sync
   */
  private stripDeviceSpecific(prefs: UserPreferences): Omit<UserPreferences, 'device'> {
    const { device, ...syncable } = prefs
    return syncable
  }

  /**
   * Get/set base preferences for three-way merge
   */
  private async getBasePreferences(): Promise<UserPreferences | null> {
    return settingsStorage.get<UserPreferences>('user-preferences-base')
  }

  private async setBasePreferences(prefs: UserPreferences): Promise<void> {
    await settingsStorage.set('user-preferences-base', prefs)
  }

  /**
   * Get unique device ID
   */
  private getDeviceId(): string {
    let id = localStorage.getItem('nchat-device-id')
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem('nchat-device-id', id)
    }
    return id
  }
}

// Singleton instance
let settingsSyncInstance: SettingsSyncService | null = null

export function getSettingsSyncService(): SettingsSyncService {
  if (!settingsSyncInstance) {
    settingsSyncInstance = new SettingsSyncService()
  }
  return settingsSyncInstance
}
```

#### 3.2 useUserPreferences Hook

**File:** `/src/hooks/use-user-preferences.ts` (NEW)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getSettingsSyncService,
  type UserPreferences,
  defaultPreferences,
} from '@/lib/sync/settings-sync'
import { useOfflineStatus } from './use-offline'

export interface UseUserPreferencesReturn {
  preferences: UserPreferences
  isLoading: boolean
  isSyncing: boolean
  error: string | null

  // Setters for each section
  updateNotifications: (updates: Partial<UserPreferences['notifications']>) => Promise<void>
  updateTheme: (updates: Partial<UserPreferences['theme']>) => Promise<void>
  updateChat: (updates: Partial<UserPreferences['chat']>) => Promise<void>
  updatePrivacy: (updates: Partial<UserPreferences['privacy']>) => Promise<void>
  updateAccessibility: (updates: Partial<UserPreferences['accessibility']>) => Promise<void>

  // Sync controls
  syncNow: () => Promise<void>
  resetToDefaults: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...defaultPreferences,
    _version: 0,
    _updatedAt: new Date(),
    _deviceId: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOnline = useOfflineStatus()

  const service = getSettingsSyncService()

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [])

  // Sync when coming online
  useEffect(() => {
    if (isOnline && !isLoading) {
      syncNow()
    }
  }, [isOnline, isLoading])

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const prefs = await service.getPreferences()
      setPreferences(prefs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updated = await service.updatePreferences(updates)
      setPreferences(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      throw err
    }
  }

  const updateNotifications = useCallback(
    async (updates: Partial<UserPreferences['notifications']>) => {
      await updatePreferences({ notifications: updates } as any)
    },
    []
  )

  const updateTheme = useCallback(async (updates: Partial<UserPreferences['theme']>) => {
    await updatePreferences({ theme: updates } as any)
  }, [])

  const updateChat = useCallback(async (updates: Partial<UserPreferences['chat']>) => {
    await updatePreferences({ chat: updates } as any)
  }, [])

  const updatePrivacy = useCallback(async (updates: Partial<UserPreferences['privacy']>) => {
    await updatePreferences({ privacy: updates } as any)
  }, [])

  const updateAccessibility = useCallback(
    async (updates: Partial<UserPreferences['accessibility']>) => {
      await updatePreferences({ accessibility: updates } as any)
    },
    []
  )

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      console.log('[useUserPreferences] Skipping sync - offline')
      return
    }

    try {
      setIsSyncing(true)
      setError(null)
      const result = await service.syncFromServer()
      if (result.success) {
        setPreferences(result.resolvedPreferences)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, service])

  const resetToDefaults = useCallback(async () => {
    const reset = {
      ...defaultPreferences,
      _version: preferences._version + 1,
      _updatedAt: new Date(),
      _deviceId: preferences._deviceId,
    }
    await updatePreferences(reset)
  }, [preferences])

  return {
    preferences,
    isLoading,
    isSyncing,
    error,
    updateNotifications,
    updateTheme,
    updateChat,
    updatePrivacy,
    updateAccessibility,
    syncNow,
    resetToDefaults,
  }
}
```

---

## Offline File Uploads

### Implementation Plan

#### 4.1 Chunked Upload Manager

**File:** `/src/lib/offline/chunked-upload.ts` (NEW)

```typescript
/**
 * Chunked file upload with resume support
 */

export interface ChunkInfo {
  index: number
  start: number
  end: number
  size: number
  uploaded: boolean
  checksum?: string
}

export interface UploadProgress {
  fileId: string
  fileName: string
  totalSize: number
  uploadedSize: number
  percent: number
  chunksTotal: number
  chunksUploaded: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed'
  error?: string
}

export interface ChunkedUploadConfig {
  chunkSize: number // Default: 1MB
  maxConcurrent: number // Default: 3
  retryAttempts: number // Default: 3
  retryDelay: number // Default: 1000ms
}

const DEFAULT_CONFIG: ChunkedUploadConfig = {
  chunkSize: 1024 * 1024, // 1MB
  maxConcurrent: 3,
  retryAttempts: 3,
  retryDelay: 1000,
}

export class ChunkedUploadManager {
  private config: ChunkedUploadConfig
  private uploads: Map<string, UploadState> = new Map()
  private listeners: Set<(progress: UploadProgress) => void> = new Set()

  constructor(config: Partial<ChunkedUploadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start or resume a file upload
   */
  async upload(
    file: File,
    options: {
      fileId?: string
      channelId?: string
      messageId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    const fileId = options.fileId || this.generateFileId()

    // Check for existing upload
    let state = this.uploads.get(fileId)

    if (!state) {
      // Initialize new upload
      state = {
        fileId,
        file,
        chunks: this.createChunks(file),
        uploadedChunks: new Set(),
        status: 'pending',
        startedAt: new Date(),
        ...options,
      }
      this.uploads.set(fileId, state)

      // Persist state for resume
      await this.persistState(state)
    }

    // Start upload
    await this.processUpload(state)

    return fileId
  }

  /**
   * Create chunk definitions for a file
   */
  private createChunks(file: File): ChunkInfo[] {
    const chunks: ChunkInfo[] = []
    const totalChunks = Math.ceil(file.size / this.config.chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.config.chunkSize
      const end = Math.min(start + this.config.chunkSize, file.size)

      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        uploaded: false,
      })
    }

    return chunks
  }

  /**
   * Process upload with concurrent chunk uploads
   */
  private async processUpload(state: UploadState): Promise<void> {
    state.status = 'uploading'
    this.notifyProgress(state)

    // Get pending chunks
    const pendingChunks = state.chunks.filter((c) => !state.uploadedChunks.has(c.index))

    // Upload in batches
    while (pendingChunks.length > 0) {
      const batch = pendingChunks.splice(0, this.config.maxConcurrent)

      const results = await Promise.allSettled(batch.map((chunk) => this.uploadChunk(state, chunk)))

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const chunk = batch[i]

        if (result.status === 'fulfilled') {
          state.uploadedChunks.add(chunk.index)
          chunk.uploaded = true
        } else {
          console.error(`[ChunkedUpload] Chunk ${chunk.index} failed:`, result.reason)
          // Will retry on next loop or fail
        }
      }

      // Persist progress
      await this.persistState(state)
      this.notifyProgress(state)

      // Check if paused or cancelled
      if (state.status === 'paused') {
        return
      }
    }

    // All chunks uploaded - finalize
    await this.finalizeUpload(state)
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(state: UploadState, chunk: ChunkInfo): Promise<void> {
    const blob = state.file.slice(chunk.start, chunk.end)
    const formData = new FormData()

    formData.append('file', blob)
    formData.append('fileId', state.fileId)
    formData.append('chunkIndex', String(chunk.index))
    formData.append('totalChunks', String(state.chunks.length))
    formData.append('fileName', state.file.name)
    formData.append('fileSize', String(state.file.size))
    formData.append('mimeType', state.file.type)

    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.config.retryAttempts) {
      try {
        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`)
        }

        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempts++

        if (attempts < this.config.retryAttempts) {
          await this.sleep(this.config.retryDelay * attempts)
        }
      }
    }

    throw lastError || new Error('Upload failed after retries')
  }

  /**
   * Finalize upload after all chunks are uploaded
   */
  private async finalizeUpload(state: UploadState): Promise<void> {
    const response = await fetch('/api/upload/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: state.fileId,
        fileName: state.file.name,
        fileSize: state.file.size,
        mimeType: state.file.type,
        totalChunks: state.chunks.length,
        channelId: state.channelId,
        messageId: state.messageId,
        metadata: state.metadata,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to finalize upload')
    }

    state.status = 'completed'
    this.notifyProgress(state)

    // Clean up persisted state
    await this.clearPersistedState(state.fileId)
  }

  /**
   * Pause an upload
   */
  pause(fileId: string): void {
    const state = this.uploads.get(fileId)
    if (state) {
      state.status = 'paused'
      this.notifyProgress(state)
    }
  }

  /**
   * Resume a paused upload
   */
  async resume(fileId: string): Promise<void> {
    const state = this.uploads.get(fileId)
    if (state && state.status === 'paused') {
      await this.processUpload(state)
    }
  }

  /**
   * Cancel an upload
   */
  async cancel(fileId: string): Promise<void> {
    const state = this.uploads.get(fileId)
    if (state) {
      state.status = 'failed'
      this.notifyProgress(state)

      // Request server cleanup
      await fetch(`/api/upload/cancel/${fileId}`, { method: 'DELETE' })

      this.uploads.delete(fileId)
      await this.clearPersistedState(fileId)
    }
  }

  /**
   * Get upload progress
   */
  getProgress(fileId: string): UploadProgress | null {
    const state = this.uploads.get(fileId)
    if (!state) return null

    return this.createProgressObject(state)
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(listener: (progress: UploadProgress) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Restore interrupted uploads
   */
  async restoreUploads(): Promise<string[]> {
    const restored: string[] = []

    // Load persisted states from IndexedDB
    const states = await this.loadPersistedStates()

    for (const state of states) {
      // Verify file is still available (will fail for web uploads)
      if (state.file) {
        this.uploads.set(state.fileId, state)
        restored.push(state.fileId)
      } else {
        // Clean up orphaned state
        await this.clearPersistedState(state.fileId)
      }
    }

    return restored
  }

  // Helper methods
  private generateFileId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private createProgressObject(state: UploadState): UploadProgress {
    const uploadedSize = Array.from(state.uploadedChunks).reduce(
      (sum, idx) => sum + state.chunks[idx].size,
      0
    )

    return {
      fileId: state.fileId,
      fileName: state.file.name,
      totalSize: state.file.size,
      uploadedSize,
      percent: Math.round((uploadedSize / state.file.size) * 100),
      chunksTotal: state.chunks.length,
      chunksUploaded: state.uploadedChunks.size,
      status: state.status,
      error: state.error,
    }
  }

  private notifyProgress(state: UploadState): void {
    const progress = this.createProgressObject(state)
    this.listeners.forEach((listener) => listener(progress))
  }

  // Persistence methods (implementation depends on IndexedDB)
  private async persistState(state: UploadState): Promise<void> {
    // Store in IndexedDB for resume across sessions
    // Implementation uses offline-storage.ts
  }

  private async loadPersistedStates(): Promise<UploadState[]> {
    // Load from IndexedDB
    return []
  }

  private async clearPersistedState(fileId: string): Promise<void> {
    // Remove from IndexedDB
  }
}

interface UploadState {
  fileId: string
  file: File
  chunks: ChunkInfo[]
  uploadedChunks: Set<number>
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed'
  startedAt: Date
  channelId?: string
  messageId?: string
  metadata?: Record<string, any>
  error?: string
}

// Singleton instance
let uploadManager: ChunkedUploadManager | null = null

export function getUploadManager(): ChunkedUploadManager {
  if (!uploadManager) {
    uploadManager = new ChunkedUploadManager()
  }
  return uploadManager
}
```

---

## Service Worker Enhancements

### 5.1 Background Sync API Integration

**File:** `/public/sw.js` (UPDATE)

```javascript
/**
 * Enhanced Service Worker with Background Sync API
 */

const CACHE_VERSION = 'v1.1.0'
const CACHE_NAMES = {
  STATIC: `nchat-static-${CACHE_VERSION}`,
  DYNAMIC: `nchat-dynamic-${CACHE_VERSION}`,
  IMAGES: `nchat-images-${CACHE_VERSION}`,
  API: `nchat-api-${CACHE_VERSION}`,
  OFFLINE: `nchat-offline-${CACHE_VERSION}`,
}

// Background sync tags
const SYNC_TAGS = {
  MESSAGES: 'sync-messages',
  SETTINGS: 'sync-settings',
  UPLOADS: 'sync-uploads',
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v1.1.0...')
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('nchat-') && !Object.values(CACHE_NAMES).includes(key))
          .map((key) => caches.delete(key))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (!url.protocol.startsWith('http')) return

  event.respondWith(handleFetch(event.request))
})

// Background Sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === SYNC_TAGS.MESSAGES) {
    event.waitUntil(syncMessages())
  } else if (event.tag === SYNC_TAGS.SETTINGS) {
    event.waitUntil(syncSettings())
  } else if (event.tag === SYNC_TAGS.UPLOADS) {
    event.waitUntil(syncUploads())
  }
})

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-all') {
    event.waitUntil(performFullSync())
  }
})

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'nchat-notification',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data
  let targetUrl = '/'

  if (data?.channelId) {
    targetUrl = `/chat/${data.channelId}`
    if (data.messageId) {
      targetUrl += `?message=${data.messageId}`
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Fetch handlers
async function handleFetch(request) {
  const url = new URL(request.url)

  // Images - cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    return cacheFirst(request, CACHE_NAMES.IMAGES)
  }

  // API - network first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    return networkFirstWithOfflineFallback(request, CACHE_NAMES.API)
  }

  // Navigation - network first with offline page
  if (request.mode === 'navigate') {
    return networkFirstWithOfflinePage(request)
  }

  // Default - stale while revalidate
  return staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC)
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (e) {
    if (cached) return cached
    throw e
  }
}

async function networkFirstWithOfflineFallback(request, cacheName) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (e) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) return cached

    // Return offline response for API calls
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function networkFirstWithOfflinePage(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (e) {
    const cache = await caches.open(CACHE_NAMES.STATIC)
    return cache.match('/offline.html')
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })

  return cached || fetchPromise
}

// Sync functions
async function syncMessages() {
  console.log('[SW] Syncing messages...')

  try {
    // Get all clients to communicate with
    const clients = await self.clients.matchAll()

    // Notify clients to process queue
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_MESSAGES',
        timestamp: Date.now(),
      })
    }

    return true
  } catch (error) {
    console.error('[SW] Message sync failed:', error)
    throw error // Will retry
  }
}

async function syncSettings() {
  console.log('[SW] Syncing settings...')

  try {
    const clients = await self.clients.matchAll()

    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_SETTINGS',
        timestamp: Date.now(),
      })
    }

    return true
  } catch (error) {
    console.error('[SW] Settings sync failed:', error)
    throw error
  }
}

async function syncUploads() {
  console.log('[SW] Syncing uploads...')

  try {
    const clients = await self.clients.matchAll()

    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_UPLOADS',
        timestamp: Date.now(),
      })
    }

    return true
  } catch (error) {
    console.error('[SW] Upload sync failed:', error)
    throw error
  }
}

async function performFullSync() {
  await Promise.all([syncMessages(), syncSettings(), syncUploads()])
}

console.log('[SW] Service worker loaded v1.1.0')
```

---

## Testing Strategy

### 6.1 Offline Simulation Tests

**File:** `/e2e/offline/offline-messaging.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Offline Messaging', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login and navigate to chat
    await page.goto('/chat')
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible()
  })

  test('should queue messages when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Verify offline indicator appears
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Send a message
    await page.fill('[data-testid="message-input"]', 'Test offline message')
    await page.click('[data-testid="send-button"]')

    // Verify message appears with pending indicator
    const message = page.locator('[data-testid="message"]').last()
    await expect(message).toContainText('Test offline message')
    await expect(message.locator('[data-testid="status-pending"]')).toBeVisible()

    // Verify queue count
    await expect(page.locator('[data-testid="pending-count"]')).toContainText('1')
  })

  test('should sync messages when back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Send multiple messages
    for (let i = 1; i <= 3; i++) {
      await page.fill('[data-testid="message-input"]', `Offline message ${i}`)
      await page.click('[data-testid="send-button"]')
    }

    // Verify all are queued
    await expect(page.locator('[data-testid="pending-count"]')).toContainText('3')

    // Go back online
    await context.setOffline(false)

    // Wait for sync
    await page.waitForSelector('[data-testid="sync-progress"]')
    await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 10000 })

    // Verify all messages synced
    await expect(page.locator('[data-testid="pending-count"]')).toContainText('0')
    await expect(page.locator('[data-testid="status-sent"]')).toHaveCount(3)
  })

  test('should handle sync conflicts', async ({ page, context, browser }) => {
    // Open second browser context (another device)
    const secondContext = await browser.newContext()
    const secondPage = await secondContext.newPage()
    await secondPage.goto('/chat')

    // Edit same message on both devices
    const messageId = 'test-message-id'

    // Go offline on first device
    await context.setOffline(true)

    // Edit on first device
    await page.click(`[data-message-id="${messageId}"] [data-testid="edit-button"]`)
    await page.fill('[data-testid="edit-input"]', 'Edit from device 1')
    await page.click('[data-testid="save-edit"]')

    // Edit on second device (online)
    await secondPage.click(`[data-message-id="${messageId}"] [data-testid="edit-button"]`)
    await secondPage.fill('[data-testid="edit-input"]', 'Edit from device 2')
    await secondPage.click('[data-testid="save-edit"]')

    // Go back online on first device
    await context.setOffline(false)

    // Should trigger conflict resolution
    await expect(page.locator('[data-testid="conflict-dialog"]')).toBeVisible()

    // Resolve conflict
    await page.click('[data-testid="use-local-version"]')
    await page.click('[data-testid="resolve-conflict"]')

    // Cleanup
    await secondContext.close()
  })

  test('should persist queue across page reload', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Send a message
    await page.fill('[data-testid="message-input"]', 'Persistent message')
    await page.click('[data-testid="send-button"]')

    // Reload page (still offline)
    await page.reload()

    // Verify message is still in queue
    await expect(page.locator('[data-testid="pending-count"]')).toContainText('1')
    await expect(page.locator('[data-testid="message"]').last()).toContainText('Persistent message')
  })
})
```

### 6.2 Unit Tests for Sync Logic

**File:** `/src/lib/offline/__tests__/conflict-resolver.test.ts` (UPDATE)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConflictResolver, TombstoneStore, getConflictResolver } from '../conflict-resolver'
import { mergeMessages } from '../merge-strategies'
import type { CachedMessage } from '../offline-types'

describe('ConflictResolver', () => {
  let resolver: ConflictResolver

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  describe('last-write-wins', () => {
    it('should choose local when local is newer', async () => {
      const conflict = {
        id: 'msg-1',
        type: 'concurrent_edit' as const,
        itemType: 'message',
        local: { content: 'local content' },
        remote: { content: 'remote content' },
        localTimestamp: new Date('2026-02-03T12:00:00'),
        remoteTimestamp: new Date('2026-02-03T11:00:00'),
      }

      const result = await resolver.resolve(conflict, 'last_write_wins')

      expect(result.resolved).toBe(true)
      expect(result.result).toEqual({ content: 'local content' })
    })

    it('should choose remote when remote is newer', async () => {
      const conflict = {
        id: 'msg-1',
        type: 'concurrent_edit' as const,
        itemType: 'message',
        local: { content: 'local content' },
        remote: { content: 'remote content' },
        localTimestamp: new Date('2026-02-03T11:00:00'),
        remoteTimestamp: new Date('2026-02-03T12:00:00'),
      }

      const result = await resolver.resolve(conflict, 'last_write_wins')

      expect(result.resolved).toBe(true)
      expect(result.result).toEqual({ content: 'remote content' })
    })
  })

  describe('merge strategy', () => {
    it('should merge reactions from both versions', () => {
      const base: CachedMessage = {
        id: 'msg-1',
        channelId: 'ch-1',
        content: 'Hello',
        senderId: 'user-1',
        senderName: 'User 1',
        createdAt: new Date(),
        reactions: [{ emoji: '👍', count: 1, userIds: ['user-1'], hasReacted: false }],
        attachments: [],
      }

      const local: CachedMessage = {
        ...base,
        reactions: [
          { emoji: '👍', count: 1, userIds: ['user-1'], hasReacted: false },
          { emoji: '❤️', count: 1, userIds: ['user-2'], hasReacted: true },
        ],
      }

      const remote: CachedMessage = {
        ...base,
        reactions: [
          { emoji: '👍', count: 2, userIds: ['user-1', 'user-3'], hasReacted: false },
          { emoji: '😂', count: 1, userIds: ['user-4'], hasReacted: false },
        ],
      }

      const result = mergeMessages(base, local, remote)

      expect(result.success).toBe(true)
      expect(result.merged?.reactions).toHaveLength(3)

      const thumbsUp = result.merged?.reactions.find((r) => r.emoji === '👍')
      expect(thumbsUp?.userIds).toContain('user-1')
      expect(thumbsUp?.userIds).toContain('user-2')
      expect(thumbsUp?.userIds).toContain('user-3')
    })

    it('should report conflict when content differs', () => {
      const base: CachedMessage = {
        id: 'msg-1',
        channelId: 'ch-1',
        content: 'Original',
        senderId: 'user-1',
        senderName: 'User 1',
        createdAt: new Date(),
        reactions: [],
        attachments: [],
      }

      const local = { ...base, content: 'Local edit' }
      const remote = { ...base, content: 'Remote edit' }

      const result = mergeMessages(base, local, remote)

      expect(result.conflicts).toContain('Content was edited on multiple devices')
    })
  })

  describe('user prompt', () => {
    it('should call user callback when strategy is user_prompt', async () => {
      const userChoice = vi.fn().mockResolvedValue({ content: 'user chosen' })
      resolver.setUserChoiceCallback(userChoice)

      const conflict = {
        id: 'msg-1',
        type: 'concurrent_edit' as const,
        itemType: 'message',
        local: { content: 'local' },
        remote: { content: 'remote' },
        localTimestamp: new Date(),
        remoteTimestamp: new Date(),
      }

      const result = await resolver.resolve(conflict, 'user_prompt')

      expect(userChoice).toHaveBeenCalledWith(conflict)
      expect(result.resolved).toBe(true)
      expect(result.result).toEqual({ content: 'user chosen' })
    })
  })
})

describe('TombstoneStore', () => {
  let store: TombstoneStore

  beforeEach(() => {
    store = new TombstoneStore()
  })

  it('should track deleted items', () => {
    store.add({
      id: 'msg-1',
      itemType: 'message',
      deletedAt: new Date(),
      deletedBy: 'user-1',
    })

    expect(store.isDeleted('msg-1')).toBe(true)
    expect(store.isDeleted('msg-2')).toBe(false)
  })

  it('should cleanup old tombstones', () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days ago
    const newDate = new Date()

    store.add({ id: 'old-msg', itemType: 'message', deletedAt: oldDate, deletedBy: 'user-1' })
    store.add({ id: 'new-msg', itemType: 'message', deletedAt: newDate, deletedBy: 'user-1' })

    const removed = store.cleanup(30 * 24 * 60 * 60 * 1000) // 30 day retention

    expect(removed).toBe(1)
    expect(store.isDeleted('old-msg')).toBe(false)
    expect(store.isDeleted('new-msg')).toBe(true)
  })
})
```

---

## Implementation Timeline

### Phase 1: Backend Integration (Week 1-2)

| Task                      | Priority | Effort | Dependencies      |
| ------------------------- | -------- | ------ | ----------------- |
| Complete queue processors | High     | 3d     | GraphQL mutations |
| Implement sync methods    | High     | 2d     | Backend API       |
| Wire up real-time events  | Medium   | 2d     | WebSocket setup   |
| Add retry strategies      | Medium   | 1d     | -                 |

### Phase 2: Conflict Resolution (Week 2-3)

| Task                | Priority | Effort | Dependencies      |
| ------------------- | -------- | ------ | ----------------- |
| Version vectors     | Medium   | 2d     | -                 |
| Enhanced merge      | Medium   | 2d     | -                 |
| Conflict UI         | High     | 3d     | Dialog components |
| Integration testing | High     | 2d     | -                 |

### Phase 3: Settings Sync (Week 3)

| Task                   | Priority | Effort | Dependencies |
| ---------------------- | -------- | ------ | ------------ |
| Settings sync service  | High     | 2d     | -            |
| User preferences hook  | High     | 1d     | -            |
| Settings API endpoints | Medium   | 1d     | Backend API  |
| Cross-device testing   | Medium   | 1d     | -            |

### Phase 4: File Uploads (Week 4)

| Task                     | Priority | Effort | Dependencies |
| ------------------------ | -------- | ------ | ------------ |
| Chunked upload manager   | High     | 3d     | -            |
| Resume support           | High     | 2d     | IndexedDB    |
| Upload queue integration | Medium   | 1d     | -            |
| Progress UI              | Medium   | 1d     | -            |

### Phase 5: Service Worker & Testing (Week 4-5)

| Task                | Priority | Effort | Dependencies        |
| ------------------- | -------- | ------ | ------------------- |
| Enhanced SW         | Medium   | 2d     | -                   |
| Background Sync     | Medium   | 1d     | -                   |
| E2E tests           | High     | 3d     | Test infrastructure |
| Performance testing | Medium   | 1d     | -                   |

---

## Success Metrics

### Functional Requirements

- [ ] 100% of queued messages sync successfully when online
- [ ] 0% data loss during offline-to-online transitions
- [ ] Conflicts detected and resolved within 5 seconds
- [ ] Settings sync across all user devices within 30 seconds

### Performance Requirements

- [ ] Queue operations < 10ms
- [ ] IndexedDB reads < 5ms
- [ ] Full sync < 5 seconds for 1000 messages
- [ ] Memory usage < 50MB for cached data

### Reliability Requirements

- [ ] 99.9% sync success rate
- [ ] 0 orphaned queue items after 24 hours
- [ ] Automatic recovery from all error states
- [ ] Graceful degradation when storage quota exceeded

---

## Appendix: File Inventory

### New Files to Create

```
/src/lib/sync/
  processors.ts                    # Queue processors
  settings-sync.ts                 # Settings sync service

/src/lib/offline/
  retry-strategies.ts              # Enhanced retry logic
  queue-persistence.ts             # Queue persistence guarantees
  version-vector.ts                # CRDT version vectors
  merge-strategies.ts              # Advanced merge logic
  chunked-upload.ts                # Chunked file uploads

/src/hooks/
  use-user-preferences.ts          # Preferences hook

/src/components/sync/
  conflict-resolution-dialog.tsx   # Conflict UI

/src/components/chat/
  message-status-indicator.tsx     # Message status

/e2e/offline/
  offline-messaging.spec.ts        # E2E tests
```

### Files to Update

```
/public/sw.js                      # Enhanced service worker
/src/lib/offline/conflict-resolver.ts  # Additional tests
/src/lib/offline/sync-manager.ts   # Backend integration
/src/app/settings/page.tsx         # Settings sync UI
```

---

## References

- Existing Implementation: `/src/lib/offline/`
- Current Documentation: `/docs/OFFLINE-SYNC-IMPLEMENTATION.md`
- Integration Guide: `/docs/OFFLINE-INTEGRATION-GUIDE.md`
- TODO.md Tasks: 118-120 (Phase 17)
- CLAUDE.md: Project architecture and patterns

---

**Document Status:** Complete Implementation Plan
**Next Steps:** Begin Phase 1 implementation with queue processors
