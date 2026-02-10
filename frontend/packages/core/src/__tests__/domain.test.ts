/**
 * @nself-chat/core/domain tests
 */

import {
  canEditMessage,
  canDeleteMessage,
  extractMentions,
  extractHashtags,
  hasMention,
  calculateReadingTime,
} from '../domain/messages'

import {
  isValidChannelName,
  formatChannelName,
  canAccessChannel,
  generateChannelSlug,
  isDirectMessage,
  getChannelIcon,
} from '../domain/channels'

import {
  isValidUsername,
  isValidEmail,
  getUserInitials,
  isUserOnline,
  getUserPresenceStatus,
  getRoleColor,
  getRoleBadge,
} from '../domain/users'

import {
  checkPermission,
  checkPermissions,
  checkAnyPermission,
  getRolePermissions,
} from '../domain/permissions'

import { PERMISSIONS } from '../constants/roles'

describe('Message domain logic', () => {
  describe('canEditMessage', () => {
    it('allows editing within 15 minutes', () => {
      const now = new Date()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
      expect(canEditMessage(tenMinutesAgo)).toBe(true)
    })

    it('disallows editing after 15 minutes', () => {
      const now = new Date()
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000)
      expect(canEditMessage(twentyMinutesAgo)).toBe(false)
    })
  })

  describe('canDeleteMessage', () => {
    it('allows deleting within 1 hour', () => {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      expect(canDeleteMessage(thirtyMinutesAgo)).toBe(true)
    })

    it('disallows deleting after 1 hour', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(canDeleteMessage(twoHoursAgo)).toBe(false)
    })
  })

  describe('extractMentions', () => {
    it('extracts mentions from content', () => {
      expect(extractMentions('Hello @john and @jane')).toEqual(['john', 'jane'])
    })

    it('removes duplicate mentions', () => {
      expect(extractMentions('@john @jane @john')).toEqual(['john', 'jane'])
    })

    it('returns empty array when no mentions', () => {
      expect(extractMentions('Hello world')).toEqual([])
    })
  })

  describe('extractHashtags', () => {
    it('extracts hashtags from content', () => {
      expect(extractHashtags('#hello #world')).toEqual(['hello', 'world'])
    })

    it('removes duplicate hashtags', () => {
      expect(extractHashtags('#hello #world #hello')).toEqual(['hello', 'world'])
    })
  })

  describe('hasMention', () => {
    it('detects mention in content', () => {
      expect(hasMention('Hello @john', 'john')).toBe(true)
    })

    it('returns false when mention not found', () => {
      expect(hasMention('Hello @jane', 'john')).toBe(false)
    })
  })

  describe('calculateReadingTime', () => {
    it('calculates reading time in seconds', () => {
      const content = 'word '.repeat(200) // 200 words = 1 minute = 60 seconds
      expect(calculateReadingTime(content)).toBe(60)
    })

    it('rounds up to nearest second', () => {
      const content = 'word '.repeat(100) // 100 words = 0.5 minutes = 30 seconds
      expect(calculateReadingTime(content)).toBe(30)
    })
  })
})

describe('Channel domain logic', () => {
  describe('isValidChannelName', () => {
    it('accepts valid channel names', () => {
      expect(isValidChannelName('general')).toBe(true)
      expect(isValidChannelName('team-chat')).toBe(true)
      expect(isValidChannelName('dev_ops')).toBe(true)
    })

    it('rejects invalid channel names', () => {
      expect(isValidChannelName('')).toBe(false)
      expect(isValidChannelName('a'.repeat(101))).toBe(false)
      expect(isValidChannelName('invalid@name')).toBe(false)
    })
  })

  describe('formatChannelName', () => {
    it('formats public channels with #', () => {
      expect(formatChannelName('general', 'public')).toBe('# general')
    })

    it('formats private channels with lock', () => {
      expect(formatChannelName('private', 'private')).toBe('🔒 private')
    })

    it('formats direct channels without prefix', () => {
      expect(formatChannelName('john', 'direct')).toBe('john')
    })
  })

  describe('canAccessChannel', () => {
    it('allows access to public channels', () => {
      expect(canAccessChannel('public', false)).toBe(true)
    })

    it('requires membership for private channels', () => {
      expect(canAccessChannel('private', false)).toBe(false)
      expect(canAccessChannel('private', true)).toBe(true)
    })
  })

  describe('generateChannelSlug', () => {
    it('generates URL-safe slugs', () => {
      expect(generateChannelSlug('Team Chat')).toBe('team-chat')
    })

    it('removes special characters', () => {
      expect(generateChannelSlug('Team @ Chat!')).toBe('team-chat')
    })
  })

  describe('isDirectMessage', () => {
    it('identifies direct messages', () => {
      expect(isDirectMessage('direct')).toBe(true)
      expect(isDirectMessage('public')).toBe(false)
    })
  })

  describe('getChannelIcon', () => {
    it('returns correct icon for channel type', () => {
      expect(getChannelIcon('public')).toBe('#')
      expect(getChannelIcon('private')).toBe('🔒')
      expect(getChannelIcon('direct')).toBe('💬')
    })
  })
})

describe('User domain logic', () => {
  describe('isValidUsername', () => {
    it('accepts valid usernames', () => {
      expect(isValidUsername('john_doe')).toBe(true)
      expect(isValidUsername('user123')).toBe(true)
    })

    it('rejects invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false) // too short
      expect(isValidUsername('invalid@user')).toBe(false) // invalid chars
    })
  })

  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
    })
  })

  describe('getUserInitials', () => {
    it('extracts initials from name', () => {
      expect(getUserInitials('John Doe')).toBe('JD')
    })

    it('handles single name', () => {
      expect(getUserInitials('John')).toBe('JO')
    })
  })

  describe('isUserOnline', () => {
    it('returns true for recent activity', () => {
      const now = new Date()
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
      expect(isUserOnline(twoMinutesAgo)).toBe(true)
    })

    it('returns false for old activity', () => {
      const now = new Date()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
      expect(isUserOnline(tenMinutesAgo)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isUserOnline(null)).toBe(false)
    })
  })

  describe('getUserPresenceStatus', () => {
    it('returns online for recent activity', () => {
      const now = new Date()
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
      expect(getUserPresenceStatus(twoMinutesAgo)).toBe('online')
    })

    it('returns away for moderate inactivity', () => {
      const now = new Date()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
      expect(getUserPresenceStatus(tenMinutesAgo)).toBe('away')
    })

    it('returns offline for long inactivity', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      expect(getUserPresenceStatus(oneHourAgo)).toBe('offline')
    })

    it('returns offline for null', () => {
      expect(getUserPresenceStatus(null)).toBe('offline')
    })
  })

  describe('getRoleColor', () => {
    it('returns color for each role', () => {
      expect(getRoleColor('owner')).toBe('#FF0000')
      expect(getRoleColor('admin')).toBe('#FFA500')
      expect(getRoleColor('moderator')).toBe('#FFD700')
      expect(getRoleColor('member')).toBe('#808080')
      expect(getRoleColor('guest')).toBe('#C0C0C0')
    })
  })

  describe('getRoleBadge', () => {
    it('returns badge for each role', () => {
      expect(getRoleBadge('owner')).toBe('👑')
      expect(getRoleBadge('admin')).toBe('⭐')
      expect(getRoleBadge('moderator')).toBe('🛡️')
      expect(getRoleBadge('member')).toBe('')
      expect(getRoleBadge('guest')).toBe('👤')
    })
  })
})

describe('Permission domain logic', () => {
  describe('checkPermission', () => {
    it('checks role-based permissions', () => {
      const context = {
        userId: 'user-1',
        role: 'admin' as const,
      }
      expect(checkPermission(context, PERMISSIONS.CHANNEL_CREATE)).toBe(true)
      expect(checkPermission(context, PERMISSIONS.ADMIN_BILLING)).toBe(false) // owner only
    })

    it('checks ownership for :own permissions', () => {
      const context = {
        userId: 'user-1',
        role: 'member' as const,
        resourceOwnerId: 'user-1',
      }
      expect(checkPermission(context, PERMISSIONS.MESSAGE_EDIT_OWN)).toBe(true)
    })

    it('denies :own permissions for non-owners', () => {
      const context = {
        userId: 'user-1',
        role: 'member' as const,
        resourceOwnerId: 'user-2',
      }
      expect(checkPermission(context, PERMISSIONS.MESSAGE_EDIT_OWN)).toBe(false)
    })
  })

  describe('checkPermissions', () => {
    it('requires all permissions to pass', () => {
      const context = {
        userId: 'user-1',
        role: 'admin' as const,
      }
      expect(
        checkPermissions(context, [
          PERMISSIONS.CHANNEL_CREATE,
          PERMISSIONS.CHANNEL_EDIT,
        ])
      ).toBe(true)
      expect(
        checkPermissions(context, [
          PERMISSIONS.CHANNEL_CREATE,
          PERMISSIONS.ADMIN_BILLING,
        ])
      ).toBe(false)
    })
  })

  describe('checkAnyPermission', () => {
    it('passes if any permission is granted', () => {
      const context = {
        userId: 'user-1',
        role: 'member' as const,
      }
      expect(
        checkAnyPermission(context, [
          PERMISSIONS.MESSAGE_SEND,
          PERMISSIONS.CHANNEL_CREATE,
        ])
      ).toBe(true)
    })
  })

  describe('getRolePermissions', () => {
    it('returns all permissions for a role', () => {
      const permissions = getRolePermissions('owner')
      expect(permissions).toContain(PERMISSIONS.ADMIN_BILLING)
      expect(permissions.length).toBeGreaterThan(0)
    })
  })
})
