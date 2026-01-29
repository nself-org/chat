/**
 * ChannelHeader - Header for chat/channel screens
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { UserAvatar } from './UserAvatar'

import type { ChannelType } from '@shared/types'

interface ChannelHeaderProps {
  title: string
  subtitle?: string | null
  channelType?: ChannelType
  onBackPress?: () => void
  onTitlePress?: () => void
  showCallButton?: boolean
  onCallPress?: () => void
  showVideoButton?: boolean
  onVideoPress?: () => void
}

export function ChannelHeader({
  title,
  subtitle,
  channelType,
  onBackPress,
  onTitlePress,
  showCallButton = false,
  onCallPress,
  showVideoButton = false,
  onVideoPress,
}: ChannelHeaderProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const isChannel = channelType === 'public' || channelType === 'private'

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Back Button */}
        {onBackPress && (
          <Pressable style={styles.backButton} onPress={onBackPress}>
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>
              chevron-left
            </Text>
          </Pressable>
        )}

        {/* Title Area */}
        <Pressable
          style={styles.titleContainer}
          onPress={onTitlePress}
          disabled={!onTitlePress}
        >
          {/* Avatar or Channel Icon */}
          {isChannel ? (
            <View
              style={[
                styles.channelIcon,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '600' }}>
                {channelType === 'private' ? 'lock' : '#'}
              </Text>
            </View>
          ) : (
            <UserAvatar size={36} showStatus />
          )}

          {/* Title and Subtitle */}
          <View style={styles.titleText}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {isChannel ? title : title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: theme.colors.muted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {showCallButton && (
            <Pressable style={styles.actionButton} onPress={onCallPress}>
              <Text style={{ color: theme.colors.primary }}>phone</Text>
            </Pressable>
          )}
          {showVideoButton && (
            <Pressable style={styles.actionButton} onPress={onVideoPress}>
              <Text style={{ color: theme.colors.primary }}>video</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionButton}>
            <Text style={{ color: theme.colors.muted }}>more</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
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
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ChannelHeader
