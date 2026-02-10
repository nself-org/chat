/**
 * Conflict Resolution Tests
 */

import {
  resolveServerWins,
  resolveClientWins,
  resolveLastWriteWins,
  resolveConflict,
  mergeWithConflictDetection,
  detectConflicts,
  threeWayMerge,
} from '../sync/conflict-resolution'
import type { SyncConflict } from '../types/sync'

describe('Conflict Resolution', () => {
  const baseConflict: SyncConflict<string> = {
    id: 'conflict-1',
    entityType: 'message',
    entityId: 'msg-123',
    clientVersion: 'client data',
    serverVersion: 'server data',
    clientTimestamp: new Date('2024-01-01T10:00:00Z'),
    serverTimestamp: new Date('2024-01-01T10:05:00Z'),
    strategy: 'server-wins',
    resolved: false,
  }

  describe('resolveServerWins', () => {
    it('should return server version', () => {
      const result = resolveServerWins(baseConflict)
      expect(result).toBe('server data')
    })
  })

  describe('resolveClientWins', () => {
    it('should return client version', () => {
      const result = resolveClientWins(baseConflict)
      expect(result).toBe('client data')
    })
  })

  describe('resolveLastWriteWins', () => {
    it('should return server version when server is newer', () => {
      const result = resolveLastWriteWins(baseConflict)
      expect(result).toBe('server data')
    })

    it('should return client version when client is newer', () => {
      const conflict: SyncConflict<string> = {
        ...baseConflict,
        clientTimestamp: new Date('2024-01-01T10:10:00Z'),
        serverTimestamp: new Date('2024-01-01T10:05:00Z'),
      }
      const result = resolveLastWriteWins(conflict)
      expect(result).toBe('client data')
    })
  })

  describe('resolveConflict', () => {
    it('should resolve using server-wins strategy', () => {
      const result = resolveConflict(baseConflict, 'server-wins')
      expect(result).toBe('server data')
    })

    it('should resolve using client-wins strategy', () => {
      const result = resolveConflict(baseConflict, 'client-wins')
      expect(result).toBe('client data')
    })

    it('should resolve using last-write-wins strategy', () => {
      const result = resolveConflict(baseConflict, 'last-write-wins')
      expect(result).toBe('server data')
    })

    it('should throw for manual strategy', () => {
      expect(() => resolveConflict(baseConflict, 'manual')).toThrow(
        'Manual conflict resolution requires user intervention'
      )
    })
  })

  describe('mergeWithConflictDetection', () => {
    it('should merge without conflicts when data is identical', () => {
      const clientData = { name: 'Test', value: 123 }
      const serverData = { name: 'Test', value: 123 }

      const { merged, conflicts } = mergeWithConflictDetection(
        clientData,
        serverData,
        'entity',
        'id-1'
      )

      expect(merged).toEqual(serverData)
      expect(conflicts).toHaveLength(0)
    })

    it('should detect and resolve conflicts', () => {
      const clientData = { name: 'Client Name', value: 123 }
      const serverData = { name: 'Server Name', value: 123 }

      const { merged, conflicts } = mergeWithConflictDetection(
        clientData,
        serverData,
        'entity',
        'id-1',
        'client-wins'
      )

      expect(merged.name).toBe('Client Name')
      expect(conflicts).toHaveLength(0) // Resolved automatically
    })

    it('should create unresolved conflicts for manual strategy', () => {
      const clientData = { name: 'Client Name' }
      const serverData = { name: 'Server Name' }

      const { conflicts } = mergeWithConflictDetection(
        clientData,
        serverData,
        'entity',
        'id-1',
        'manual'
      )

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].resolved).toBe(false)
    })

    it('should handle multiple conflicting properties', () => {
      const clientData = {
        field1: 'client1',
        field2: 'client2',
        field3: 'same',
      }
      const serverData = {
        field1: 'server1',
        field2: 'server2',
        field3: 'same',
      }

      const { merged, conflicts } = mergeWithConflictDetection(
        clientData,
        serverData,
        'entity',
        'id-1',
        'server-wins'
      )

      expect(merged.field1).toBe('server1')
      expect(merged.field2).toBe('server2')
      expect(merged.field3).toBe('same')
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('detectConflicts', () => {
    it('should detect no conflicts for identical data', () => {
      const clientData = { name: 'Test', value: 123 }
      const serverData = { name: 'Test', value: 123 }

      const conflicts = detectConflicts(clientData, serverData, 'entity', 'id-1')
      expect(conflicts).toHaveLength(0)
    })

    it('should detect conflicts for different data', () => {
      const clientData = { name: 'Client' }
      const serverData = { name: 'Server' }

      const conflicts = detectConflicts(clientData, serverData, 'entity', 'id-1')
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].clientVersion).toBe('Client')
      expect(conflicts[0].serverVersion).toBe('Server')
    })

    it('should detect conflicts for added/removed properties', () => {
      const clientData = { name: 'Test', newField: 'client' }
      const serverData = { name: 'Test', otherField: 'server' }

      const conflicts = detectConflicts(clientData, serverData, 'entity', 'id-1')
      expect(conflicts.length).toBeGreaterThan(0)
    })
  })

  describe('threeWayMerge', () => {
    it('should merge when only client changed', () => {
      const base = { field1: 'original', field2: 'original' }
      const client = { field1: 'client-modified', field2: 'original' }
      const server = { field1: 'original', field2: 'original' }

      const merged = threeWayMerge(base, client, server)
      expect(merged.field1).toBe('client-modified')
      expect(merged.field2).toBe('original')
    })

    it('should merge when only server changed', () => {
      const base = { field1: 'original', field2: 'original' }
      const client = { field1: 'original', field2: 'original' }
      const server = { field1: 'original', field2: 'server-modified' }

      const merged = threeWayMerge(base, client, server)
      expect(merged.field1).toBe('original')
      expect(merged.field2).toBe('server-modified')
    })

    it('should prefer server when both changed differently', () => {
      const base = { field1: 'original' }
      const client = { field1: 'client-modified' }
      const server = { field1: 'server-modified' }

      const merged = threeWayMerge(base, client, server)
      expect(merged.field1).toBe('server-modified')
    })

    it('should handle new fields from both sides', () => {
      const base = { existing: 'value' }
      const client = { existing: 'value', clientField: 'client' }
      const server = { existing: 'value', serverField: 'server' }

      const merged = threeWayMerge(base, client, server)
      expect(merged.existing).toBe('value')
      expect(merged.clientField).toBe('client')
      expect(merged.serverField).toBe('server')
    })

    it('should keep base value when both unchanged', () => {
      const base = { field: 'original' }
      const client = { field: 'original' }
      const server = { field: 'original' }

      const merged = threeWayMerge(base, client, server)
      expect(merged.field).toBe('original')
    })
  })
})
