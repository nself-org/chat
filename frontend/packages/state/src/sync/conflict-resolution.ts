/**
 * Conflict Resolution
 *
 * Strategies for resolving sync conflicts between client and server state.
 *
 * @packageDocumentation
 * @module @nself-chat/state/sync/conflict-resolution
 */

import type { SyncConflict, ConflictStrategy } from '../types/sync'

/**
 * Resolve conflict using server-wins strategy
 */
export function resolveServerWins<TData>(conflict: SyncConflict<TData>): TData {
  return conflict.serverVersion
}

/**
 * Resolve conflict using client-wins strategy
 */
export function resolveClientWins<TData>(conflict: SyncConflict<TData>): TData {
  return conflict.clientVersion
}

/**
 * Resolve conflict using last-write-wins strategy
 */
export function resolveLastWriteWins<TData>(conflict: SyncConflict<TData>): TData {
  return conflict.clientTimestamp > conflict.serverTimestamp
    ? conflict.clientVersion
    : conflict.serverVersion
}

/**
 * Resolve conflict using specified strategy
 */
export function resolveConflict<TData>(
  conflict: SyncConflict<TData>,
  strategy: ConflictStrategy
): TData {
  switch (strategy) {
    case 'server-wins':
      return resolveServerWins(conflict)
    case 'client-wins':
      return resolveClientWins(conflict)
    case 'last-write-wins':
      return resolveLastWriteWins(conflict)
    case 'manual':
      throw new Error('Manual conflict resolution requires user intervention')
    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
  }
}

/**
 * Merge two objects with conflict detection
 */
export function mergeWithConflictDetection<TData extends Record<string, unknown>>(
  clientData: TData,
  serverData: TData,
  entityType: string,
  entityId: string,
  strategy: ConflictStrategy = 'last-write-wins'
): {
  merged: TData
  conflicts: Array<SyncConflict<unknown>>
} {
  const merged = { ...serverData }
  const conflicts: Array<SyncConflict<unknown>> = []

  // Check each property for conflicts
  for (const key in clientData) {
    const clientValue = clientData[key]
    const serverValue = serverData[key]

    // If values differ, we have a conflict
    if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
      const conflict: SyncConflict<unknown> = {
        id: `${entityId}-${key}`,
        entityType,
        entityId,
        clientVersion: clientValue,
        serverVersion: serverValue,
        clientTimestamp: new Date(), // Would ideally come from data
        serverTimestamp: new Date(), // Would ideally come from data
        strategy,
        resolved: false,
      }

      try {
        conflict.resolution = resolveConflict(conflict, strategy)
        conflict.resolved = true
        merged[key] = conflict.resolution as TData[Extract<keyof TData, string>]
      } catch {
        // Manual resolution required
        conflicts.push(conflict)
      }
    }
  }

  return { merged, conflicts }
}

/**
 * Detect conflicts between two versions of data
 */
export function detectConflicts<TData extends Record<string, unknown>>(
  clientData: TData,
  serverData: TData,
  entityType: string,
  entityId: string
): Array<SyncConflict<unknown>> {
  const conflicts: Array<SyncConflict<unknown>> = []

  const allKeys = new Set([...Object.keys(clientData), ...Object.keys(serverData)])

  for (const key of allKeys) {
    const clientValue = clientData[key]
    const serverValue = serverData[key]

    if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
      conflicts.push({
        id: `${entityId}-${key}`,
        entityType,
        entityId,
        clientVersion: clientValue,
        serverVersion: serverValue,
        clientTimestamp: new Date(),
        serverTimestamp: new Date(),
        strategy: 'manual',
        resolved: false,
      })
    }
  }

  return conflicts
}

/**
 * Three-way merge using common ancestor
 */
export function threeWayMerge<TData extends Record<string, unknown>>(
  base: TData,
  client: TData,
  server: TData
): TData {
  const merged: Record<string, unknown> = { ...base }

  const allKeys = new Set([...Object.keys(base), ...Object.keys(client), ...Object.keys(server)])

  for (const key of allKeys) {
    const baseValue = base[key]
    const clientValue = client[key]
    const serverValue = server[key]

    // If both changed differently, server wins (can be customized)
    if (
      JSON.stringify(clientValue) !== JSON.stringify(baseValue) &&
      JSON.stringify(serverValue) !== JSON.stringify(baseValue) &&
      JSON.stringify(clientValue) !== JSON.stringify(serverValue)
    ) {
      merged[key] = serverValue
    }
    // If only client changed
    else if (JSON.stringify(clientValue) !== JSON.stringify(baseValue)) {
      merged[key] = clientValue
    }
    // If only server changed
    else if (JSON.stringify(serverValue) !== JSON.stringify(baseValue)) {
      merged[key] = serverValue
    }
    // Otherwise keep base value
  }

  return merged as TData
}
