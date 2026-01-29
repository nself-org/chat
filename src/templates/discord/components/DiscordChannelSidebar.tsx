'use client'

// ===============================================================================
// Discord Channel Sidebar Component
// ===============================================================================
//
// The channel sidebar with server name, categories, text/voice channels,
// and user panel at the bottom.
//
// ===============================================================================

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { discordColors, discordLayout } from '../config'
import {
  ChevronDown,
  ChevronRight,
  Hash,
  Volume2,
  Plus,
  Settings,
  Mic,
  MicOff,
  Headphones,
  HeadphonesOff,
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface DiscordChannelSidebarProps {
  serverName?: string
  categories?: DiscordCategoryData[]
  activeChannelId?: string
  onChannelSelect?: (channelId: string) => void
  currentUser?: DiscordCurrentUser
  onMuteToggle?: () => void
  onDeafenToggle?: () => void
  onSettingsClick?: () => void
  className?: string
}

export interface DiscordCategoryData {
  id: string
  name: string
  channels: DiscordChannelData[]
  isCollapsed?: boolean
}

export interface DiscordChannelData {
  id: string
  name: string
  type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
  unreadCount?: number
  mentionCount?: number
  isPrivate?: boolean
  connectedUsers?: number
}

export interface DiscordCurrentUser {
  id: string
  name: string
  discriminator?: string
  avatar?: string
  status: 'online' | 'idle' | 'dnd' | 'offline'
  isMuted?: boolean
  isDeafened?: boolean
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function DiscordChannelSidebar({
  serverName = 'Server',
  categories = [],
  activeChannelId,
  onChannelSelect,
  currentUser,
  onMuteToggle,
  onDeafenToggle,
  onSettingsClick,
  className,
}: DiscordChannelSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  )

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      style={{ backgroundColor: discordColors.gray750 }}
    >
      {/* Server Header */}
      <button
        className="flex items-center justify-between px-4 h-12 border-b shadow-sm hover:bg-[#35373C] transition-colors"
        style={{ borderColor: discordColors.gray850 }}
      >
        <span className="font-semibold text-white truncate">{serverName}</span>
        <ChevronDown className="w-4 h-4 text-white flex-shrink-0" />
      </button>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto pt-4 px-2">
        {categories.map((category) => (
          <Category
            key={category.id}
            category={category}
            isCollapsed={collapsedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            activeChannelId={activeChannelId}
            onChannelSelect={onChannelSelect}
          />
        ))}
      </div>

      {/* User Panel */}
      {currentUser && (
        <UserPanel
          user={currentUser}
          onMuteToggle={onMuteToggle}
          onDeafenToggle={onDeafenToggle}
          onSettingsClick={onSettingsClick}
        />
      )}
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function Category({
  category,
  isCollapsed,
  onToggle,
  activeChannelId,
  onChannelSelect,
}: {
  category: DiscordCategoryData
  isCollapsed: boolean
  onToggle: () => void
  activeChannelId?: string
  onChannelSelect?: (channelId: string) => void
}) {
  return (
    <div className="mb-4">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 w-full px-1 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        <span>{category.name}</span>
        <button className="ml-auto p-1 rounded hover:bg-white/10">
          <Plus className="w-3 h-3" />
        </button>
      </button>

      {/* Channels */}
      {!isCollapsed && (
        <div className="space-y-0.5">
          {category.channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onChannelSelect?.(channel.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: DiscordChannelData
  isActive: boolean
  onClick: () => void
}) {
  const hasUnread = (channel.unreadCount ?? 0) > 0
  const hasMention = (channel.mentionCount ?? 0) > 0
  const isVoice = channel.type === 'voice'

  const Icon = isVoice ? Volume2 : Hash

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 w-full px-2 py-1.5 rounded',
        'transition-colors text-sm',
        isActive
          ? 'bg-[#404249] text-white'
          : hasUnread
          ? 'text-white hover:bg-[#35373C]'
          : 'text-gray-400 hover:bg-[#35373C] hover:text-gray-200'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 opacity-60" />
      <span className={cn('truncate flex-1 text-left', hasUnread && 'font-medium')}>
        {channel.name}
      </span>

      {/* Voice Channel Users */}
      {isVoice && (channel.connectedUsers ?? 0) > 0 && (
        <span className="text-xs text-gray-400">{channel.connectedUsers}</span>
      )}

      {/* Mention Badge */}
      {hasMention && (
        <span
          className="min-w-[16px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: discordColors.red }}
        >
          {channel.mentionCount}
        </span>
      )}
    </button>
  )
}

function UserPanel({
  user,
  onMuteToggle,
  onDeafenToggle,
  onSettingsClick,
}: {
  user: DiscordCurrentUser
  onMuteToggle?: () => void
  onDeafenToggle?: () => void
  onSettingsClick?: () => void
}) {
  const statusColors = {
    online: discordColors.statusOnline,
    idle: discordColors.statusIdle,
    dnd: discordColors.statusDnd,
    offline: discordColors.statusOffline,
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-2"
      style={{ backgroundColor: discordColors.gray800 }}
    >
      {/* Avatar with Status */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: discordColors.blurple }}
            >
              {user.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
          style={{
            backgroundColor: statusColors[user.status],
            borderColor: discordColors.gray800,
          }}
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{user.name}</div>
        <div className="text-xs text-gray-400 truncate">
          {user.discriminator ? `#${user.discriminator}` : 'Online'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center">
        <button
          onClick={onMuteToggle}
          className={cn(
            'p-1.5 rounded hover:bg-[#35373C]',
            user.isMuted ? 'text-red-400' : 'text-gray-400'
          )}
        >
          {user.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={onDeafenToggle}
          className={cn(
            'p-1.5 rounded hover:bg-[#35373C]',
            user.isDeafened ? 'text-red-400' : 'text-gray-400'
          )}
        >
          {user.isDeafened ? (
            <HeadphonesOff className="w-5 h-5" />
          ) : (
            <Headphones className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onSettingsClick}
          className="p-1.5 rounded hover:bg-[#35373C] text-gray-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default DiscordChannelSidebar
