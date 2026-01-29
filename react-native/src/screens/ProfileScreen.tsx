/**
 * ProfileScreen - User profile view
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { UserAvatar } from '@components/UserAvatar'
import { useUser } from '@hooks/useUser'
import { useAuth } from '@stores/auth-store'

import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'

type ProfileRouteProp = RouteProp<RootStackParamList, 'Profile'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface ProfileAction {
  icon: string
  label: string
  onPress: () => void
  destructive?: boolean
}

export function ProfileScreen() {
  const route = useRoute<ProfileRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { user: currentUser } = useAuth()

  const { userId } = route.params
  const { user, isLoading } = useUser(userId)
  const isOwnProfile = userId === currentUser?.id

  const handleMessage = useCallback(() => {
    navigation.navigate('Chat', {
      channelId: userId,
      title: user?.displayName || 'Chat',
    })
  }, [navigation, userId, user])

  const handleCall = useCallback(() => {
    // Initiate audio call
  }, [])

  const handleVideoCall = useCallback(() => {
    // Initiate video call
  }, [])

  const handleBlock = useCallback(() => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user?.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // Block user
          },
        },
      ]
    )
  }, [user])

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => {} },
        { text: 'Harassment', onPress: () => {} },
        { text: 'Other', onPress: () => {} },
      ]
    )
  }, [])

  const actions: ProfileAction[] = isOwnProfile
    ? []
    : [
        { icon: 'message', label: 'Message', onPress: handleMessage },
        { icon: 'phone', label: 'Call', onPress: handleCall },
        { icon: 'video', label: 'Video', onPress: handleVideoCall },
      ]

  const menuItems = isOwnProfile
    ? []
    : [
        { icon: 'bell', label: 'Notifications', onPress: () => {} },
        { icon: 'image', label: 'Shared Media', onPress: () => {} },
        { icon: 'star', label: 'Starred Messages', onPress: () => {} },
        { icon: 'search', label: 'Search in Conversation', onPress: () => {} },
        { icon: 'block', label: 'Block', onPress: handleBlock, destructive: true },
        { icon: 'flag', label: 'Report', onPress: handleReport, destructive: true },
      ]

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title=""
        transparent
        onBackPress={() => navigation.goBack()}
        rightIcon={isOwnProfile ? 'edit' : 'more'}
        onRightPress={() => {
          if (isOwnProfile) {
            navigation.navigate('Settings')
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <UserAvatar
            user={user}
            size={120}
            showStatus
          />
          <Text style={[styles.displayName, { color: theme.colors.text }]}>
            {user?.displayName || 'Loading...'}
          </Text>
          <Text style={[styles.email, { color: theme.colors.muted }]}>
            {user?.email}
          </Text>
          {user?.status && (
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface }]}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      user.status === 'online'
                        ? theme.colors.success
                        : user.status === 'away'
                          ? theme.colors.warning
                          : user.status === 'dnd'
                            ? theme.colors.error
                            : theme.colors.muted,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                {user.status === 'dnd' ? 'Do not disturb' : user.status}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <Text style={{ color: theme.colors.primary }}>{action.icon}</Text>
                </View>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* About Section */}
        {user?.role && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
              About
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>Role</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            {user.createdAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>
                  Member since
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Menu Items */}
        {menuItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
                onPress={item.onPress}
              >
                <Text
                  style={[
                    styles.menuLabel,
                    { color: item.destructive ? theme.colors.error : theme.colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginVertical: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 16,
  },
})

export default ProfileScreen
