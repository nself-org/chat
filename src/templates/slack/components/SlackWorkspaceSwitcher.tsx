'use client'

// ===============================================================================
// Slack Workspace Switcher Component
// ===============================================================================
//
// A compact sidebar for switching between Slack workspaces with
// workspace icons, unread indicators, and add workspace button.
//
// ===============================================================================

import { cn } from '@/lib/utils'
import { slackColors } from '../config'
import { Plus, Home } from 'lucide-react'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface SlackWorkspaceSwitcherProps {
  workspaces?: SlackWorkspaceData[]
  activeWorkspaceId?: string
  onWorkspaceSelect?: (workspaceId: string) => void
  onAddWorkspace?: () => void
  onHomeClick?: () => void
  className?: string
}

export interface SlackWorkspaceData {
  id: string
  name: string
  icon?: string
  unreadCount?: number
  mentionCount?: number
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function SlackWorkspaceSwitcher({
  workspaces = [],
  activeWorkspaceId,
  onWorkspaceSelect,
  onAddWorkspace,
  onHomeClick,
  className,
}: SlackWorkspaceSwitcherProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center py-2 gap-2',
        'bg-[#350D36]',
        className
      )}
      style={{ width: 68 }}
    >
      {/* Home Button */}
      <button
        onClick={onHomeClick}
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          'text-white/80 hover:text-white',
          'hover:bg-white/10 transition-colors'
        )}
      >
        <Home className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-white/20 my-1" />

      {/* Workspace List */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {workspaces.map((workspace) => (
          <WorkspaceButton
            key={workspace.id}
            workspace={workspace}
            isActive={workspace.id === activeWorkspaceId}
            onClick={() => onWorkspaceSelect?.(workspace.id)}
          />
        ))}
      </div>

      {/* Add Workspace Button */}
      <button
        onClick={onAddWorkspace}
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          'border-2 border-dashed border-white/30',
          'text-white/50 hover:text-white hover:border-white/50',
          'transition-colors'
        )}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Workspace Button Sub-component
// -------------------------------------------------------------------------------

function WorkspaceButton({
  workspace,
  isActive,
  onClick,
}: {
  workspace: SlackWorkspaceData
  isActive: boolean
  onClick: () => void
}) {
  const hasNotification = (workspace.unreadCount ?? 0) > 0 || (workspace.mentionCount ?? 0) > 0
  const hasMention = (workspace.mentionCount ?? 0) > 0

  return (
    <div className="relative group">
      {/* Active Indicator */}
      <div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r',
          'transition-all duration-200',
          isActive
            ? 'h-9 bg-white'
            : hasNotification
            ? 'h-2 bg-white group-hover:h-5'
            : 'h-0 group-hover:h-5 group-hover:bg-white/50'
        )}
        style={{ left: -6 }}
      />

      {/* Workspace Icon */}
      <button
        onClick={onClick}
        className={cn(
          'relative w-9 h-9 rounded-lg overflow-hidden',
          'transition-all duration-200',
          isActive
            ? 'rounded-lg'
            : 'rounded-2xl hover:rounded-lg'
        )}
      >
        {workspace.icon ? (
          <img
            src={workspace.icon}
            alt={workspace.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: slackColors.aubergineLight }}
          >
            {workspace.name[0]?.toUpperCase()}
          </div>
        )}

        {/* Notification Badge */}
        {hasMention && (
          <span
            className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center text-white border-2"
            style={{
              backgroundColor: slackColors.red,
              borderColor: '#350D36',
            }}
          >
            {workspace.mentionCount}
          </span>
        )}

        {/* Unread Dot (when no mentions) */}
        {hasNotification && !hasMention && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: 'white',
              borderColor: '#350D36',
            }}
          />
        )}
      </button>
    </div>
  )
}

export default SlackWorkspaceSwitcher
