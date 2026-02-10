/**
 * User Factory
 *
 * Factory functions for creating user test data with sensible defaults.
 * All IDs and timestamps are deterministic for reliable testing.
 *
 * @module @nself-chat/testing/factories/user
 */

export interface TestUser {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl?: string | null
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
  status?: 'online' | 'offline' | 'away' | 'busy'
  bio?: string | null
  createdAt?: Date
  updatedAt?: Date
}

// Counter for deterministic ID generation
let userIdCounter = 1000

/**
 * Generate a deterministic user ID
 */
function generateUserId(): string {
  return `user-${String(userIdCounter++).padStart(6, '0')}`
}

/**
 * Reset the user ID counter for deterministic tests
 */
export function resetUserIdCounter() {
  userIdCounter = 1000
}

export interface UserFactoryOptions extends Partial<TestUser> {}

/**
 * Create a test user with default values
 *
 * @example
 * ```ts
 * const user = createUser({ role: 'admin' })
 * ```
 */
export function createUser(options: UserFactoryOptions = {}): TestUser {
  const id = options.id || generateUserId()
  const username = options.username || `user${userIdCounter - 1000}`

  return {
    id,
    username,
    displayName: options.displayName || username.charAt(0).toUpperCase() + username.slice(1),
    email: options.email || `${username}@test.example.com`,
    avatarUrl: options.avatarUrl !== undefined ? options.avatarUrl : `https://example.com/avatars/${username}.png`,
    role: options.role || 'member',
    status: options.status || 'online',
    bio: options.bio || null,
    createdAt: options.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: options.updatedAt || new Date('2024-01-01T00:00:00Z'),
  }
}

/**
 * Create multiple test users
 *
 * @example
 * ```ts
 * const users = createUsers(5, { role: 'member' })
 * ```
 */
export function createUsers(count: number, options: UserFactoryOptions = {}): TestUser[] {
  return Array.from({ length: count }, (_, i) =>
    createUser({
      ...options,
      username: options.username ? `${options.username}${i + 1}` : undefined,
    })
  )
}

/**
 * Create an owner user
 */
export function createOwner(options: Omit<UserFactoryOptions, 'role'> = {}): TestUser {
  return createUser({
    username: 'owner',
    displayName: 'System Owner',
    email: 'owner@example.com',
    ...options,
    role: 'owner',
  })
}

/**
 * Create an admin user
 */
export function createAdmin(options: Omit<UserFactoryOptions, 'role'> = {}): TestUser {
  return createUser({
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@example.com',
    ...options,
    role: 'admin',
  })
}

/**
 * Create a moderator user
 */
export function createModerator(options: Omit<UserFactoryOptions, 'role'> = {}): TestUser {
  return createUser({
    username: 'moderator',
    displayName: 'Moderator User',
    email: 'moderator@example.com',
    ...options,
    role: 'moderator',
  })
}

/**
 * Create a member user
 */
export function createMember(options: Omit<UserFactoryOptions, 'role'> = {}): TestUser {
  return createUser({
    ...options,
    role: 'member',
  })
}

/**
 * Create a guest user
 */
export function createGuest(options: Omit<UserFactoryOptions, 'role'> = {}): TestUser {
  return createUser({
    username: 'guest',
    displayName: 'Guest User',
    email: 'guest@example.com',
    ...options,
    role: 'guest',
  })
}

/**
 * Create a user with specific status
 */
export function createUserWithStatus(
  status: 'online' | 'offline' | 'away' | 'busy',
  options: Omit<UserFactoryOptions, 'status'> = {}
): TestUser {
  return createUser({
    ...options,
    status,
  })
}

/**
 * Create an offline user
 */
export function createOfflineUser(options: Omit<UserFactoryOptions, 'status'> = {}): TestUser {
  return createUserWithStatus('offline', options)
}

/**
 * Create an away user
 */
export function createAwayUser(options: Omit<UserFactoryOptions, 'status'> = {}): TestUser {
  return createUserWithStatus('away', options)
}

/**
 * Create a busy user
 */
export function createBusyUser(options: Omit<UserFactoryOptions, 'status'> = {}): TestUser {
  return createUserWithStatus('busy', options)
}

/**
 * Pre-defined users for consistent testing
 */
export const predefinedUsers = {
  alice: createUser({
    id: 'user-alice',
    username: 'alice',
    displayName: 'Alice Smith',
    email: 'alice@example.com',
  }),
  bob: createUser({
    id: 'user-bob',
    username: 'bob',
    displayName: 'Bob Jones',
    email: 'bob@example.com',
    status: 'away',
  }),
  charlie: createUser({
    id: 'user-charlie',
    username: 'charlie',
    displayName: 'Charlie Brown',
    email: 'charlie@example.com',
    status: 'offline',
  }),
  owner: createOwner({
    id: 'user-owner',
  }),
  admin: createAdmin({
    id: 'user-admin',
  }),
  moderator: createModerator({
    id: 'user-moderator',
  }),
  guest: createGuest({
    id: 'user-guest',
  }),
}
