/**
 * AuthNavigator - Authentication flow navigation
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { useAuth } from '@stores/auth-store'

import type { AuthStackParamList } from './types'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator<AuthStackParamList>()

// Placeholder screens - these would be fully implemented
function WelcomeScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Welcome'>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>nc</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to nChat</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Team communication, simplified
        </Text>
      </View>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.buttonPrimaryText }]}>
            Create Account
          </Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function SignInScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignIn'>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { signIn } = useAuth()

  const handleSignIn = () => {
    // Mock sign in
    signIn('test@example.com', 'password')
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: theme.colors.primary }}>Back</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Welcome back
        </Text>
        {/* Form fields would go here */}
      </View>
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSignIn}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.buttonPrimaryText }]}>
            Sign In
          </Text>
        </Pressable>
        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={{ color: theme.colors.primary }}>Forgot Password?</Text>
        </Pressable>
      </View>
    </View>
  )
}

function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: theme.colors.primary }}>Back</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Join nChat today
        </Text>
        {/* Form fields would go here */}
      </View>
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('VerifyEmail', { email: 'test@example.com' })}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.buttonPrimaryText }]}>
            Create Account
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: theme.colors.primary }}>Back</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Enter your email to reset your password
        </Text>
      </View>
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.buttonPrimaryText }]}>
            Send Reset Link
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function VerifyEmailScreen({ route, navigation }: NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { email } = route.params

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Verify Email</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          We sent a code to {email}
        </Text>
      </View>
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {}}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.buttonPrimaryText }]}>
            Verify
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export function AuthNavigator() {
  const { theme } = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttons: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 12,
  },
})

export default AuthNavigator
