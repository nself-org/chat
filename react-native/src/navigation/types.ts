/**
 * Navigation type definitions
 */

import type { NavigatorScreenParams } from '@react-navigation/native'

// Root Stack (contains all navigators)
export type RootStackParamList = {
  // Auth flow
  Auth: NavigatorScreenParams<AuthStackParamList>

  // Main app (when authenticated)
  Main: NavigatorScreenParams<MainTabParamList>

  // Standalone screens (modals, etc.)
  Chat: { channelId: string; title: string }
  Channel: { channelId: string; title: string }
  Profile: { userId: string }
  Search: undefined
  Notifications: undefined
}

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined
  SignIn: undefined
  SignUp: undefined
  ForgotPassword: undefined
  VerifyEmail: { email: string }
}

// Main Tab Navigator
export type MainTabParamList = {
  Chats: NavigatorScreenParams<ChatsStackParamList>
  Calls: undefined
  Status: undefined
  Settings: undefined
}

// Chats Stack (inside Chats tab)
export type ChatsStackParamList = {
  ChatList: undefined
  NewChat: undefined
  NewChannel: undefined
}

// Declare global types for useNavigation and useRoute
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
