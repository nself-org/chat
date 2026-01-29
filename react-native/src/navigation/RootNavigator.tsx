/**
 * RootNavigator - Main navigation container
 */

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { TabNavigator } from './TabNavigator'
import { AuthNavigator } from './AuthNavigator'
import {
  ChatScreen,
  ChannelScreen,
  ProfileScreen,
  SearchScreen,
  NotificationsScreen,
} from '@screens'
import { useAuth } from '@stores/auth-store'
import { useTheme } from '@theme'

import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme } = useTheme()

  // Could show a loading screen while checking auth state
  if (isLoading) {
    return null
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {isAuthenticated ? (
        // Authenticated screens
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Channel"
            component={ChannelScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
        </>
      ) : (
        // Auth screens
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  )
}

export default RootNavigator
