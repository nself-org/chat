/**
 * Contexts Index
 *
 * React Context providers for state management.
 * These wrap Zustand stores with React Context for backward compatibility
 * and provide hooks for components that need reactive state.
 *
 * @packageDocumentation
 * @module @nself-chat/state/contexts
 */

// NOTE: Contexts have dependencies on auth services and other app-specific
// implementations. They are provided here for reference but may need
// to be adapted when integrated into specific applications.

// Re-export context providers and hooks
export {
  AuthProvider,
  useAuth,
  type User,
  type SignInOptions,
  type SignUpOptions,
  type OAuthOptions,
} from './auth-context'

export { AppConfigProvider, useAppConfig } from './app-config-context'

export { ThemeProvider, useTheme } from './theme-context'
