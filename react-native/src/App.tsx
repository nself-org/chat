/**
 * nChat React Native App
 */

import React, { useEffect } from 'react'
import { StatusBar, useColorScheme, LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'

import { RootNavigator } from '@navigation/RootNavigator'
import { ThemeProvider, useTheme } from '@theme/ThemeContext'
import { AuthProvider } from '@stores/auth-store'
import { AppConfigProvider } from '@stores/app-config-store'
import { ApolloProvider as GraphQLProvider } from '@api/graphql-client'

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
])

function AppContent() {
  const { theme, colorScheme } = useTheme()
  const systemColorScheme = useColorScheme()
  const isDark = colorScheme === 'system' ? systemColorScheme === 'dark' : colorScheme === 'dark'

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent
      />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
          fonts: {
            regular: {
              fontFamily: theme.fonts.regular,
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: theme.fonts.medium,
              fontWeight: '500',
            },
            bold: {
              fontFamily: theme.fonts.bold,
              fontWeight: 'bold',
            },
            heavy: {
              fontFamily: theme.fonts.bold,
              fontWeight: '900',
            },
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GraphQLProvider>
          <AppConfigProvider>
            <AuthProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </AuthProvider>
          </AppConfigProvider>
        </GraphQLProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
