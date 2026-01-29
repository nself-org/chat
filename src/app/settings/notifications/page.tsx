'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SettingsLayout,
  SettingsSection,
  SettingsRow,
  NotificationToggle,
  SimpleNotificationToggle,
  NotificationToggleGroup,
} from '@/components/settings'
import {
  Bell,
  Volume2,
  Mail,
  Moon,
  MessageSquare,
  AtSign,
  Hash,
  Users,
  Zap,
} from 'lucide-react'

interface NotificationSettings {
  // Desktop Notifications
  desktopEnabled: boolean
  desktopSound: boolean
  desktopPreview: boolean

  // Email Notifications
  emailEnabled: boolean
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never'
  emailDigest: boolean

  // Do Not Disturb
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
  dndWeekends: boolean

  // Per-category settings
  directMessages: boolean
  mentions: boolean
  channelMessages: boolean
  threadReplies: boolean
  reactions: boolean
}

const defaultSettings: NotificationSettings = {
  desktopEnabled: true,
  desktopSound: true,
  desktopPreview: true,
  emailEnabled: true,
  emailFrequency: 'daily',
  emailDigest: true,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '08:00',
  dndWeekends: true,
  directMessages: true,
  mentions: true,
  channelMessages: false,
  threadReplies: true,
  reactions: false,
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Save to backend
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        updateSetting('desktopEnabled', true)
      }
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Configure how and when you receive notifications
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Desktop Notifications */}
          <SettingsSection
            title="Desktop Notifications"
            description="Get notified about new messages on your desktop"
          >
            <NotificationToggle
              id="desktop-enabled"
              label="Enable desktop notifications"
              description="Show notifications when you receive new messages"
              icon={Bell}
              checked={settings.desktopEnabled}
              onCheckedChange={(checked) => updateSetting('desktopEnabled', checked)}
            />

            {settings.desktopEnabled && (
              <>
                <div className="ml-11 space-y-2">
                  <SimpleNotificationToggle
                    id="desktop-sound"
                    label="Notification sound"
                    description="Play a sound when notifications arrive"
                    checked={settings.desktopSound}
                    onCheckedChange={(checked) =>
                      updateSetting('desktopSound', checked)
                    }
                  />
                  <SimpleNotificationToggle
                    id="desktop-preview"
                    label="Message preview"
                    description="Show message content in notifications"
                    checked={settings.desktopPreview}
                    onCheckedChange={(checked) =>
                      updateSetting('desktopPreview', checked)
                    }
                  />
                </div>

                {mounted &&
                  notificationPermission !== null &&
                  notificationPermission !== 'granted' && (
                    <div className="ml-11 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Browser permission required for desktop notifications.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={requestPermission}
                      >
                        Enable Browser Notifications
                      </Button>
                    </div>
                  )}
              </>
            )}
          </SettingsSection>

          {/* Sound Settings */}
          <SettingsSection
            title="Sound"
            description="Configure notification sounds"
          >
            <NotificationToggle
              id="sound-enabled"
              label="Enable sounds"
              description="Play sounds for notifications and events"
              icon={Volume2}
              checked={settings.desktopSound}
              onCheckedChange={(checked) => updateSetting('desktopSound', checked)}
            />
          </SettingsSection>

          {/* Email Notifications */}
          <SettingsSection
            title="Email Notifications"
            description="Receive notifications via email"
          >
            <NotificationToggle
              id="email-enabled"
              label="Enable email notifications"
              description="Get notified about important activity via email"
              icon={Mail}
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
            />

            {settings.emailEnabled && (
              <div className="ml-11 space-y-4">
                <SettingsRow
                  label="Email frequency"
                  description="How often to send notification emails"
                  htmlFor="email-frequency"
                  vertical
                >
                  <Select
                    value={settings.emailFrequency}
                    onValueChange={(value) =>
                      updateSetting(
                        'emailFrequency',
                        value as NotificationSettings['emailFrequency']
                      )
                    }
                  >
                    <SelectTrigger id="email-frequency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>

                <SimpleNotificationToggle
                  id="email-digest"
                  label="Include activity summary"
                  description="Add a summary of channel activity to digest emails"
                  checked={settings.emailDigest}
                  onCheckedChange={(checked) =>
                    updateSetting('emailDigest', checked)
                  }
                />
              </div>
            )}
          </SettingsSection>

          {/* Do Not Disturb */}
          <SettingsSection
            title="Do Not Disturb"
            description="Pause notifications during specific hours"
          >
            <NotificationToggle
              id="dnd-enabled"
              label="Enable Do Not Disturb"
              description="Automatically pause notifications during set hours"
              icon={Moon}
              checked={settings.dndEnabled}
              onCheckedChange={(checked) => updateSetting('dndEnabled', checked)}
            />

            {settings.dndEnabled && (
              <div className="ml-11 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="dnd-start" className="text-sm">
                      Start time
                    </Label>
                    <Input
                      id="dnd-start"
                      type="time"
                      value={settings.dndStart}
                      onChange={(e) => updateSetting('dndStart', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="dnd-end" className="text-sm">
                      End time
                    </Label>
                    <Input
                      id="dnd-end"
                      type="time"
                      value={settings.dndEnd}
                      onChange={(e) => updateSetting('dndEnd', e.target.value)}
                    />
                  </div>
                </div>

                <SimpleNotificationToggle
                  id="dnd-weekends"
                  label="Enable on weekends"
                  description="Also pause notifications on Saturday and Sunday"
                  checked={settings.dndWeekends}
                  onCheckedChange={(checked) =>
                    updateSetting('dndWeekends', checked)
                  }
                />
              </div>
            )}
          </SettingsSection>

          {/* Per-category Settings */}
          <SettingsSection
            title="Notification Categories"
            description="Choose which types of activity trigger notifications"
          >
            <NotificationToggleGroup>
              <NotificationToggle
                id="notify-dm"
                label="Direct messages"
                description="Get notified when someone sends you a direct message"
                icon={MessageSquare}
                checked={settings.directMessages}
                onCheckedChange={(checked) =>
                  updateSetting('directMessages', checked)
                }
              />

              <NotificationToggle
                id="notify-mentions"
                label="Mentions"
                description="Get notified when someone mentions you with @"
                icon={AtSign}
                checked={settings.mentions}
                onCheckedChange={(checked) => updateSetting('mentions', checked)}
              />

              <NotificationToggle
                id="notify-channels"
                label="Channel messages"
                description="Get notified for all messages in channels you're in"
                icon={Hash}
                checked={settings.channelMessages}
                onCheckedChange={(checked) =>
                  updateSetting('channelMessages', checked)
                }
              />

              <NotificationToggle
                id="notify-threads"
                label="Thread replies"
                description="Get notified when someone replies to a thread you're in"
                icon={Users}
                checked={settings.threadReplies}
                onCheckedChange={(checked) =>
                  updateSetting('threadReplies', checked)
                }
              />

              <NotificationToggle
                id="notify-reactions"
                label="Reactions"
                description="Get notified when someone reacts to your message"
                icon={Zap}
                checked={settings.reactions}
                onCheckedChange={(checked) => updateSetting('reactions', checked)}
              />
            </NotificationToggleGroup>
          </SettingsSection>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            {saved && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Changes saved successfully!
              </p>
            )}
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
