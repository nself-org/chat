'use client'

// ===============================================================================
// Discord Member List Component
// ===============================================================================
//
// The right sidebar showing online members grouped by role with
// presence indicators and activity status.
//
// ===============================================================================

import { cn } from '@/lib/utils'
import { discordColors } from '../config'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface DiscordMemberListProps {
  roles?: DiscordRoleGroup[]
  onMemberClick?: (memberId: string) => void
  className?: string
}

export interface DiscordRoleGroup {
  id: string
  name: string
  color?: string
  members: DiscordMemberData[]
}

export interface DiscordMemberData {
  id: string
  name: string
  nickname?: string
  avatar?: string
  roleColor?: string
  status: 'online' | 'idle' | 'dnd' | 'offline'
  activity?: string
  isBot?: boolean
  isBoosting?: boolean
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function DiscordMemberList({
  roles = [],
  onMemberClick,
  className,
}: DiscordMemberListProps) {
  return (
    <div
      className={cn('flex flex-col h-full overflow-y-auto px-2 py-4', className)}
      style={{ backgroundColor: discordColors.gray750 }}
    >
      {roles.map((role) => (
        <RoleGroup
          key={role.id}
          role={role}
          onMemberClick={onMemberClick}
        />
      ))}
    </div>
  )
}

// -------------------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------------------

function RoleGroup({
  role,
  onMemberClick,
}: {
  role: DiscordRoleGroup
  onMemberClick?: (memberId: string) => void
}) {
  if (role.members.length === 0) return null

  return (
    <div className="mb-4">
      {/* Role Header */}
      <div className="px-2 mb-1">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: role.color || discordColors.gray300 }}
        >
          {role.name} - {role.members.length}
        </span>
      </div>

      {/* Members */}
      <div className="space-y-0.5">
        {role.members.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
            onClick={() => onMemberClick?.(member.id)}
          />
        ))}
      </div>
    </div>
  )
}

function MemberItem({
  member,
  onClick,
}: {
  member: DiscordMemberData
  onClick?: () => void
}) {
  const statusColors = {
    online: discordColors.statusOnline,
    idle: discordColors.statusIdle,
    dnd: discordColors.statusDnd,
    offline: discordColors.statusOffline,
  }

  const displayName = member.nickname || member.name

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-2 py-1.5 rounded',
        'hover:bg-[#35373C] transition-colors group',
        member.status === 'offline' && 'opacity-40'
      )}
    >
      {/* Avatar with Status */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-medium text-sm"
              style={{ backgroundColor: member.roleColor || discordColors.blurple }}
            >
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: statusColors[member.status],
            borderColor: discordColors.gray750,
          }}
        />
      </div>

      {/* Name & Activity */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <span
            className="text-sm font-medium truncate"
            style={{ color: member.roleColor || discordColors.gray100 }}
          >
            {displayName}
          </span>
          {member.isBot && (
            <span
              className="px-1 py-0.5 rounded text-[10px] font-semibold uppercase"
              style={{ backgroundColor: discordColors.blurple, color: 'white' }}
            >
              BOT
            </span>
          )}
          {member.isBoosting && (
            <BoostIcon className="w-4 h-4" />
          )}
        </div>
        {member.activity && (
          <div className="text-xs text-gray-400 truncate">{member.activity}</div>
        )}
      </div>
    </button>
  )
}

function BoostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('text-pink-400', className)}>
      <path d="M10.1 8.1V16.9C10.1 18.05 9.15 19 8 19C6.85 19 5.9 18.05 5.9 16.9V8.1C5.9 6.95 6.85 6 8 6C9.15 6 10.1 6.95 10.1 8.1ZM18.1 8.1V16.9C18.1 18.05 17.15 19 16 19C14.85 19 13.9 18.05 13.9 16.9V8.1C13.9 6.95 14.85 6 16 6C17.15 6 18.1 6.95 18.1 8.1Z" />
    </svg>
  )
}

export default DiscordMemberList
