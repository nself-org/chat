/**
 * Header - Generic screen header component
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'

interface HeaderProps {
  title: string
  subtitle?: string
  onBackPress?: () => void
  rightIcon?: string
  onRightPress?: () => void
  transparent?: boolean
  large?: boolean
}

export function Header({
  title,
  subtitle,
  onBackPress,
  rightIcon,
  onRightPress,
  transparent = false,
  large = false,
}: HeaderProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : theme.colors.background,
          paddingTop: insets.top,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <View style={[styles.content, large && styles.contentLarge]}>
        {/* Left Section */}
        <View style={styles.left}>
          {onBackPress && (
            <Pressable style={styles.backButton} onPress={onBackPress}>
              <Text style={[styles.backIcon, { color: theme.colors.primary }]}>
                chevron-left
              </Text>
            </Pressable>
          )}
        </View>

        {/* Center Section */}
        <View style={styles.center}>
          <Text
            style={[
              large ? styles.titleLarge : styles.title,
              { color: theme.colors.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.right}>
          {rightIcon && onRightPress && (
            <Pressable style={styles.rightButton} onPress={onRightPress}>
              <Text style={{ color: theme.colors.primary }}>{rightIcon}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
  },
  contentLarge: {
    height: 64,
  },
  left: {
    width: 60,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 60,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default Header
