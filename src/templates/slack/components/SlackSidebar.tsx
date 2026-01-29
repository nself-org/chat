'use client'

// ===============================================================================
// Slack Sidebar Component
// ===============================================================================
//
// The classic Slack aubergine sidebar with workspace name, navigation,
// channels, and direct messages sections.
//
// ===============================================================================

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { slackColors } from '../config'
import {
  Hash,
  Lock,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Home,
  Bell,
  Bookmark,
  MoreHorizontal,
  Search,
  Edit
} from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface SlackSidebarProps {
  workspaceName?: string
  workspaceIcon?: ReactNode
  channels?: SlackChannelItem[]
  directMessages?: SlackDMItem[]
  activeChannelId?: string
  onChannelSelect?: (channelId: string) => void
  onDMSelect?: (dmId: string) => void
  className?: string
}

export interface SlackChannelItem {
  id: string
  name: string
  isPrivate?: boolean
  unreadCount?: number
  mentionCount?: number
  isMuted?: boolean
}

export interface SlackDMItem {
  id: string
  name: string
  avatarUrl?: string
  status?: 'online' | 'away' | 'dnd' | 'offline'
  unreadCount?: number
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function SidebarSection({
  title,
  children,
  defaultOpen = true,
  onAdd,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  onAdd?: () => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full px-4 py-1 text-sm font-medium',
          'text-white/70 hover:text-white transition-colors'
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1" />
        )}
        <span>{title}</span>
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="ml-auto p-1 rounded hover:bg-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </button>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  )
}

function PresenceIndicator({ status }: { status: SlackDMItem['status'] }) {
  const colors = {
    online: slackColors.sidebarPresence,
    away: 'transparent',
    dnd: slackColors.red,
    offline: 'transparent',
  }

  const borderColors = {
    online: slackColors.sidebarPresence,
    away: slackColors.sidebarPresence,
    dnd: slackColors.red,
    offline: slackColors.sidebarTextMuted,
  }

  return (
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{
        backgroundColor: colors[status || 'offline'],
        border: `2px solid ${borderColors[status || 'offline']}`,
      }}
    />
  )
}

// -------------------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------------------

export function SlackSidebar({
  workspaceName = 'Workspace',
  workspaceIcon,
  channels = [],
  directMessages = [],
  activeChannelId,
  onChannelSelect,
  onDMSelect,
  className,
}: SlackSidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full text-white',
        className
      )}
      style={{ backgroundColor: slackColors.aubergine }}
    >
      {/* Workspace Header */}
      <div
        className="flex items-center justify-between px-4 border-b"
        style={{
          height: 49,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <button className="flex items-center gap-2 hover:bg-white/10 rounded p-1 -ml-1">
          {workspaceIcon || (
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: slackColors.aubergineLight }}
            >
              {workspaceName[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-bold text-lg truncate max-w-[160px]">
            {workspaceName}
          </span>
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10">
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <div className="px-2 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <NavItem icon={<MessageSquare className="w-4 h-4" />} label="Threads" />
        <NavItem icon={<Home className="w-4 h-4" />} label="All DMs" />
        <NavItem icon={<Bell className="w-4 h-4" />} label="Activity" badge={3} />
        <NavItem icon={<Bookmark className="w-4 h-4" />} label="Later" />
        <NavItem icon={<MoreHorizontal className="w-4 h-4" />} label="More" />
      </div>

      {/* Channels & DMs */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* Channels Section */}
        <SidebarSection title="Channels" onAdd={() => {}}>
          {channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={activeChannelId === channel.id}
              onClick={() => onChannelSelect?.(channel.id)}
            />
          ))}
        </SidebarSection>

        {/* Direct Messages Section */}
        <SidebarSection title="Direct messages" onAdd={() => {}}>
          {directMessages.map((dm) => (
            <DMItem
              key={dm.id}
              dm={dm}
              isActive={activeChannelId === dm.id}
              onClick={() => onDMSelect?.(dm.id)}
            />
          ))}
        </SidebarSection>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  badge,
}: {
  icon: ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1 rounded',
        'text-white/90 hover:bg-white/10 transition-colors'
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {badge && badge > 0 && (
        <span
          className="ml-auto text-xs font-bold px-1.5 rounded"
          style={{ backgroundColor: slackColors.red }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: SlackChannelItem
  isActive: boolean
  onClick: () => void
}) {
  const hasUnread = (channel.unreadCount ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1 rounded text-sm',
        'transition-colors',
        isActive
          ? 'bg-[#1264A3] text-white'
          : hasUnread
          ? 'text-white font-medium hover:bg-white/10'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      {channel.isPrivate ? (
        <Lock className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Hash className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>
      {(channel.mentionCount ?? 0) > 0 && (
        <span
          className="ml-auto text-xs font-bold px-1.5 rounded"
          style={{ backgroundColor: slackColors.red }}
        >
          {channel.mentionCount}
        </span>
      )}
    </button>
  )
}

function DMItem({
  dm,
  isActive,
  onClick,
}: {
  dm: SlackDMItem
  isActive: boolean
  onClick: () => void
}) {
  const hasUnread = (dm.unreadCount ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1 rounded text-sm',
        'transition-colors',
        isActive
          ? 'bg-[#1264A3] text-white'
          : hasUnread
          ? 'text-white font-medium hover:bg-white/10'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <PresenceIndicator status={dm.status} />
      <span className="truncate">{dm.name}</span>
      {hasUnread && (
        <span className="ml-auto w-2 h-2 rounded-full bg-white" />
      )}
    </button>
  )
}

export default SlackSidebar
