'use client'

// ===============================================================================
// Demo Mode Component
// ===============================================================================
//
// A wrapper component that enables demo mode with sample data,
// template switching, and interactive preview.
//
// ===============================================================================

import { useState, createContext, useContext, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { TemplateId } from '@/templates/types'
import { templates } from '@/templates'
import { demoUsers, demoChannels, demoMessages, getDemoUser, getChannelMessages } from '@/lib/demo/sample-data'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface DemoModeProps {
  children: ReactNode
  defaultTemplate?: TemplateId
  showControls?: boolean
  className?: string
}

export interface DemoContextValue {
  // Template
  currentTemplate: TemplateId
  setTemplate: (template: TemplateId) => void
  templateConfig: typeof templates['default']

  // Demo Data
  users: typeof demoUsers
  channels: typeof demoChannels
  messages: typeof demoMessages

  // Current State
  activeChannelId: string | null
  setActiveChannelId: (id: string | null) => void
  currentUserId: string

  // Helpers
  getUser: typeof getDemoUser
  getMessages: typeof getChannelMessages

  // Mode
  isDemoMode: boolean
}

// -------------------------------------------------------------------------------
// Context
// -------------------------------------------------------------------------------

const DemoContext = createContext<DemoContextValue | null>(null)

export function useDemoMode() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

export function useDemoModeOptional() {
  return useContext(DemoContext)
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function DemoMode({
  children,
  defaultTemplate = 'default',
  showControls = false,
  className,
}: DemoModeProps) {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateId>(defaultTemplate)
  const [activeChannelId, setActiveChannelId] = useState<string | null>('channel-1')
  const currentUserId = 'user-7' // Demo user

  const templateConfig = templates[currentTemplate]

  const contextValue: DemoContextValue = {
    currentTemplate,
    setTemplate: setCurrentTemplate,
    templateConfig,
    users: demoUsers,
    channels: demoChannels,
    messages: demoMessages,
    activeChannelId,
    setActiveChannelId,
    currentUserId,
    getUser: getDemoUser,
    getMessages: getChannelMessages,
    isDemoMode: true,
  }

  return (
    <DemoContext.Provider value={contextValue}>
      <div className={cn('demo-mode', className)}>
        {showControls && <DemoControls />}
        {children}
      </div>
    </DemoContext.Provider>
  )
}

// -------------------------------------------------------------------------------
// Demo Controls
// -------------------------------------------------------------------------------

function DemoControls() {
  const { currentTemplate, setTemplate, activeChannelId, setActiveChannelId, channels } = useDemoMode()

  const templateOptions: { id: TemplateId; name: string; color: string }[] = [
    { id: 'default', name: 'nself', color: '#00D4FF' },
    { id: 'slack', name: 'Slack', color: '#4A154B' },
    { id: 'discord', name: 'Discord', color: '#5865F2' },
    { id: 'telegram', name: 'Telegram', color: '#2AABEE' },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366' },
  ]

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-xl',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm',
        'border border-gray-200 dark:border-gray-700 shadow-lg'
      )}
    >
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Demo Controls
      </div>

      {/* Template Selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Template
        </label>
        <div className="flex gap-1">
          {templateOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTemplate(option.id)}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-transform',
                currentTemplate === option.id && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
              )}
              style={{ backgroundColor: option.color }}
              title={option.name}
            >
              {option.name[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Channel
        </label>
        <select
          value={activeChannelId || ''}
          onChange={(e) => setActiveChannelId(e.target.value || null)}
          className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              #{channel.name}
            </option>
          ))}
        </select>
      </div>

      {/* Demo Mode Badge */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Demo Mode Active
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Demo Mode Provider for external use
// -------------------------------------------------------------------------------

export function DemoModeProvider({
  children,
  defaultTemplate = 'default',
}: {
  children: ReactNode
  defaultTemplate?: TemplateId
}) {
  return (
    <DemoMode defaultTemplate={defaultTemplate} showControls={false}>
      {children}
    </DemoMode>
  )
}

export default DemoMode
