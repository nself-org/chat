import { nhost } from '@/lib/nhost'
import { AuthService, AuthResponse } from './auth.interface'

export class NhostAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { session, error } = await nhost.auth.signIn({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!session) {
        throw new Error('Failed to create session')
      }

      // Get user details including role from the database
      const user = await this.getUserWithRole(session.user.id)

      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          username: user.username || email.split('@')[0],
          displayName: user.display_name || session.user.displayName || email.split('@')[0],
          avatarUrl: user.avatar_url || session.user.avatarUrl,
          role: user.role || 'guest',
        },
        token: session.accessToken,
      }
    } catch (error) {
      console.error('NhostAuthService signIn error:', error)
      throw error
    }
  }

  async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    try {
      const { session, error } = await nhost.auth.signUp({
        email,
        password,
        options: {
          displayName: username,
          metadata: {
            username,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!session) {
        throw new Error('Failed to create session')
      }

      // Determine if this is the first user (owner)
      const isFirstUser = await this.checkIfFirstUser()
      const role = isFirstUser ? 'owner' : 'member'

      // Create nchat user record
      await this.createNchatUser(session.user.id, username, role)

      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          username,
          displayName: session.user.displayName || username,
          avatarUrl: session.user.avatarUrl,
          role,
        },
        token: session.accessToken,
      }
    } catch (error) {
      console.error('NhostAuthService signUp error:', error)
      throw error
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await nhost.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('NhostAuthService signOut error:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    try {
      const session = nhost.auth.getSession()

      if (!session || !session.user) {
        return null
      }

      // Get user details including role from the database
      const user = await this.getUserWithRole(session.user.id)

      return {
        id: session.user.id,
        email: session.user.email!,
        username: user.username || session.user.email!.split('@')[0],
        displayName: user.display_name || session.user.displayName || session.user.email!.split('@')[0],
        avatarUrl: user.avatar_url || session.user.avatarUrl,
        role: user.role || 'guest',
      }
    } catch (error) {
      console.error('NhostAuthService getCurrentUser error:', error)
      return null
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const { session, error } = await nhost.auth.refreshSession()

      if (error) {
        console.error('Token refresh error:', error)
        return null
      }

      return session?.accessToken || null
    } catch (error) {
      console.error('NhostAuthService refreshToken error:', error)
      return null
    }
  }

  private async getUserWithRole(userId: string) {
    const query = `
      query GetUserWithRole($userId: uuid!) {
        nchat_users(where: {auth_user_id: {_eq: $userId}}) {
          username
          display_name
          avatar_url
          role
        }
      }
    `

    const { data, error } = await nhost.graphql.request(query, { userId })

    if (error) {
      console.error('Error fetching user role:', error)
      return { role: 'guest' }
    }

    const nchatUser = data?.nchat_users?.[0]
    if (!nchatUser) {
      return { role: 'guest' }
    }

    return {
      username: nchatUser.username,
      display_name: nchatUser.display_name,
      avatar_url: nchatUser.avatar_url,
      role: nchatUser.role || 'guest'
    }
  }

  private async checkIfFirstUser(): Promise<boolean> {
    const query = `
      query CheckFirstUser {
        nchat_users_aggregate {
          aggregate {
            count
          }
        }
      }
    `

    const { data } = await nhost.graphql.request(query)
    return data?.nchat_users_aggregate?.aggregate?.count === 0
  }

  private async createNchatUser(userId: string, username: string, role: string) {
    const mutation = `
      mutation CreateNchatUser($userId: uuid!, $username: String!, $email: String!, $role: String!) {
        insert_nchat_users_one(object: {
          auth_user_id: $userId,
          username: $username,
          display_name: $username,
          email: $email,
          role: $role
        }) {
          id
        }
      }
    `

    // Get email from auth user
    const user = nhost.auth.getUser()
    const email = user?.email || `${username}@nself.org`

    await nhost.graphql.request(mutation, {
      userId,
      username,
      email,
      role
    })
  }
}