export const authConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  useDevAuth: process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true', // Only use dev auth if explicitly enabled

  // Backend auth service URLs
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000',
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql',

  // Dev mode settings
  devAuth: {
    autoLogin: true,
    defaultUser: {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'owner@nself.org',
      username: 'owner',
      displayName: 'System Owner',
      role: 'owner' as const,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
      createdAt: new Date().toISOString(),
    },
    availableUsers: [
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'owner@nself.org',
        username: 'owner',
        displayName: 'System Owner',
        role: 'owner' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        email: 'admin@nself.org',
        username: 'admin',
        displayName: 'Admin User',
        role: 'admin' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        email: 'moderator@nself.org',
        username: 'moderator',
        displayName: 'Moderator User',
        role: 'moderator' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        email: 'member@nself.org',
        username: 'member',
        displayName: 'Member User',
        role: 'member' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        email: 'guest@nself.org',
        username: 'guest',
        displayName: 'Guest User',
        role: 'guest' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
        email: 'alice@nself.org',
        username: 'alice',
        displayName: 'Alice Anderson',
        role: 'member' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
        email: 'bob@nself.org',
        username: 'bob',
        displayName: 'Bob Builder',
        role: 'member' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
        email: 'charlie@nself.org',
        username: 'charlie',
        displayName: 'Charlie Chen',
        role: 'member' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      },
    ]
  },

  // Session settings
  session: {
    cookieName: 'nchat-session',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  }
}