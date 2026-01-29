/**
 * TabBar - Custom bottom tab bar component
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

interface TabItem {
  name: string
  label: string
  icon: string
  badge?: number
}

const tabs: TabItem[] = [
  { name: 'Chats', label: 'Chats', icon: 'message' },
  { name: 'Calls', label: 'Calls', icon: 'phone' },
  { name: 'Status', label: 'Status', icon: 'circle' },
  { name: 'Settings', label: 'Settings', icon: 'cog' },
]

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.tabBarBackground,
          paddingBottom: insets.bottom,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        const tab = tabs.find((t) => t.name === route.name) || tabs[0]

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          })
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={styles.iconContainer}>
              <Text
                style={[
                  styles.icon,
                  {
                    color: isFocused
                      ? theme.colors.tabBarActive
                      : theme.colors.tabBarInactive,
                  },
                ]}
              >
                {tab.icon}
              </Text>
              {tab.badge && tab.badge > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: theme.colors.buttonPrimaryText }]}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isFocused
                    ? theme.colors.tabBarActive
                    : theme.colors.tabBarInactive,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
})

export default TabBar
