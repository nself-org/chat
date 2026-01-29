/**
 * TabNavigator - Bottom tab navigation
 */

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { HomeScreen, CallsScreen, StatusScreen, SettingsScreen } from '@screens'
import { TabBar } from '@components/TabBar'
import { useTheme } from '@theme'

import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function TabNavigator() {
  const { theme } = useTheme()

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Chats',
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          tabBarLabel: 'Calls',
        }}
      />
      <Tab.Screen
        name="Status"
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  )
}

export default TabNavigator
