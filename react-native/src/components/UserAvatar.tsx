/**
 * UserAvatar - User avatar component with status indicator
 */

import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Image, Pressable } from 'react-native'

import { useTheme } from '@theme'
import { getInitials, stringToColor } from '@shared/utils'

import type { User, UserStatus } from '@shared/types'

interface UserAvatarProps {
  user?: User | null
  size?: number
  showStatus?: boolean
  status?: UserStatus
  onPress?: () => void
}

export function UserAvatar({
  user,
  size = 40,
  showStatus = false,
  status,
  onPress,
}: UserAvatarProps) {
  const { theme } = useTheme()

  const initials = useMemo(() => {
    return getInitials(user?.displayName || user?.email || '?')
  }, [user?.displayName, user?.email])

  const backgroundColor = useMemo(() => {
    return stringToColor(user?.id || user?.email || 'default')
  }, [user?.id, user?.email])

  const currentStatus = status || user?.status

  const statusColor = useMemo(() => {
    switch (currentStatus) {
      case 'online':
        return theme.colors.success
      case 'away':
        return theme.colors.warning
      case 'dnd':
        return theme.colors.error
      default:
        return theme.colors.muted
    }
  }, [currentStatus, theme.colors])

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  const textSize = size * 0.4
  const statusSize = size * 0.3
  const statusBorderWidth = size * 0.05

  const content = (
    <View style={[styles.container, containerStyle]}>
      {user?.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={[styles.image, containerStyle]}
        />
      ) : (
        <View style={[styles.placeholder, containerStyle, { backgroundColor }]}>
          <Text style={[styles.initials, { fontSize: textSize }]}>{initials}</Text>
        </View>
      )}

      {showStatus && currentStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              borderWidth: statusBorderWidth,
              borderColor: theme.colors.background,
              backgroundColor: statusColor,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pressable: {
    // Pressable wrapper
  },
  image: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
  },
})

export default UserAvatar
