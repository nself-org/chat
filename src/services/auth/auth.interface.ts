/**
 * Authentication Interface for nself-chat
 *
 * Defines the contract for all authentication services.
 */

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest'

export interface AuthUser {
  id: string
  email: string
  username?: string
  displayName?: string
  avatarUrl?: string | null
  role: UserRole
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthResponse>
  signUp(email: string, password: string, username: string): Promise<AuthResponse>
  signOut(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
  refreshToken(): Promise<string | null>
  updateProfile(data: Partial<AuthUser>): Promise<AuthResponse>
}
