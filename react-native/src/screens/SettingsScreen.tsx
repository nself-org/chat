/**
 * SettingsScreen - App settings and preferences
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@theme'
import { Header } from '@components/Header'
import { UserAvatar } from '@components/UserAvatar'
import { useAuth } from '@stores/auth-store'
import { APP_VERSION } from '@shared/constants'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface SettingItem {
  icon: string
  label: string
  value?: string | boolean
  onPress?: () => void
  type?: 'navigation' | 'toggle' | 'info'
  destructive?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { theme, colorScheme, setColorScheme, toggleColorScheme } = useTheme()
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [soundsEnabled, setSoundsEnabled] = React.useState(true)
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true)

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    )
  }, [signOut])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete account logic
          },
        },
      ]
    )
  }, [])

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'user',
          label: 'Edit Profile',
          onPress: () => navigation.navigate('Profile', { userId: user?.id || '' }),
        },
        {
          icon: 'key',
          label: 'Change Password',
          onPress: () => {},
        },
        {
          icon: 'shield',
          label: 'Privacy & Security',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          label: 'Push Notifications',
          type: 'toggle',
          value: notificationsEnabled,
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
        },
        {
          icon: 'volume',
          label: 'Sounds',
          type: 'toggle',
          value: soundsEnabled,
          onPress: () => setSoundsEnabled(!soundsEnabled),
        },
        {
          icon: 'vibrate',
          label: 'Haptic Feedback',
          type: 'toggle',
          value: hapticsEnabled,
          onPress: () => setHapticsEnabled(!hapticsEnabled),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          type: 'toggle',
          value: colorScheme === 'dark' || (colorScheme === 'system' && theme.isDark),
          onPress: toggleColorScheme,
        },
        {
          icon: 'palette',
          label: 'Theme',
          value: colorScheme === 'system' ? 'System' : colorScheme === 'dark' ? 'Dark' : 'Light',
          onPress: () => {
            Alert.alert(
              'Theme',
              'Choose your preferred theme',
              [
                { text: 'System', onPress: () => setColorScheme('system') },
                { text: 'Light', onPress: () => setColorScheme('light') },
                { text: 'Dark', onPress: () => setColorScheme('dark') },
              ]
            )
          },
        },
      ],
    },
    {
      title: 'Storage & Data',
      items: [
        {
          icon: 'database',
          label: 'Storage Usage',
          onPress: () => {},
        },
        {
          icon: 'download',
          label: 'Auto-Download Media',
          onPress: () => {},
        },
        {
          icon: 'trash',
          label: 'Clear Cache',
          onPress: () => {
            Alert.alert('Clear Cache', 'This will clear all cached data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => {} },
            ])
          },
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'info',
          label: 'Version',
          type: 'info',
          value: APP_VERSION,
        },
        {
          icon: 'document',
          label: 'Terms of Service',
          onPress: () => {},
        },
        {
          icon: 'lock',
          label: 'Privacy Policy',
          onPress: () => {},
        },
        {
          icon: 'help',
          label: 'Help & Support',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          icon: 'logout',
          label: 'Sign Out',
          onPress: handleSignOut,
          destructive: true,
        },
        {
          icon: 'trash',
          label: 'Delete Account',
          onPress: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ]

  const renderItem = (item: SettingItem, index: number, sectionLength: number) => {
    const isLast = index === sectionLength - 1

    return (
      <Pressable
        key={item.label}
        style={[
          styles.settingItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        ]}
        onPress={item.onPress}
        disabled={item.type === 'info'}
      >
        <View style={styles.settingLeft}>
          <Text
            style={[
              styles.settingLabel,
              { color: item.destructive ? theme.colors.error : theme.colors.text },
            ]}
          >
            {item.label}
          </Text>
        </View>
        <View style={styles.settingRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value as boolean}
              onValueChange={item.onPress}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          ) : item.type === 'info' ? (
            <Text style={[styles.settingValue, { color: theme.colors.muted }]}>
              {item.value as string}
            </Text>
          ) : item.value ? (
            <Text style={[styles.settingValue, { color: theme.colors.muted }]}>
              {item.value as string}
            </Text>
          ) : null}
        </View>
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Settings" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Profile Card */}
        <Pressable
          style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Profile', { userId: user?.id || '' })}
        >
          <UserAvatar user={user} size={60} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.colors.muted }]}>
              {user?.email}
            </Text>
          </View>
        </Pressable>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
              {section.items.map((item, index) =>
                renderItem(item, index, section.items.length)
              )}
            </View>
          </View>
        ))}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 15,
  },
})

export default SettingsScreen
