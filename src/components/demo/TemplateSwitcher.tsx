'use client'

// ===============================================================================
// Template Switcher Component
// ===============================================================================
//
// A UI component for switching between different platform templates
// with visual preview indicators.
//
// ===============================================================================

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TemplateId } from '@/templates/types'
import { templates } from '@/templates'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TemplateSwitcherProps {
  currentTemplate: TemplateId
  onTemplateChange: (templateId: TemplateId) => void
  variant?: 'tabs' | 'dropdown' | 'cards'
  showDescription?: boolean
  className?: string
}

interface TemplateOption {
  id: TemplateId
  name: string
  icon: string
  color: string
  description: string
}

// -------------------------------------------------------------------------------
// Template Options
// -------------------------------------------------------------------------------

const templateOptions: TemplateOption[] = [
  {
    id: 'default',
    name: 'nself',
    icon: 'N',
    color: '#00D4FF',
    description: 'Modern team communication',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'S',
    color: '#4A154B',
    description: 'Where work happens',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'D',
    color: '#5865F2',
    description: 'Your place to talk',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'T',
    color: '#2AABEE',
    description: 'Fast & secure messaging',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'W',
    color: '#25D366',
    description: 'Simple, secure messaging',
  },
]

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TemplateSwitcher({
  currentTemplate,
  onTemplateChange,
  variant = 'tabs',
  showDescription = false,
  className,
}: TemplateSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'dropdown') {
    return (
      <DropdownSwitcher
        currentTemplate={currentTemplate}
        onTemplateChange={onTemplateChange}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        className={className}
      />
    )
  }

  if (variant === 'cards') {
    return (
      <CardsSwitcher
        currentTemplate={currentTemplate}
        onTemplateChange={onTemplateChange}
        showDescription={showDescription}
        className={className}
      />
    )
  }

  return (
    <TabsSwitcher
      currentTemplate={currentTemplate}
      onTemplateChange={onTemplateChange}
      className={className}
    />
  )
}

// -------------------------------------------------------------------------------
// Tabs Variant
// -------------------------------------------------------------------------------

function TabsSwitcher({
  currentTemplate,
  onTemplateChange,
  className,
}: {
  currentTemplate: TemplateId
  onTemplateChange: (templateId: TemplateId) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800',
        className
      )}
    >
      {templateOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onTemplateChange(option.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
            currentTemplate === option.id
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          )}
        >
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: option.color }}
          >
            {option.icon}
          </span>
          <span className="hidden sm:inline">{option.name}</span>
        </button>
      ))}
    </div>
  )
}

// -------------------------------------------------------------------------------
// Dropdown Variant
// -------------------------------------------------------------------------------

function DropdownSwitcher({
  currentTemplate,
  onTemplateChange,
  isOpen,
  setIsOpen,
  className,
}: {
  currentTemplate: TemplateId
  onTemplateChange: (templateId: TemplateId) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  className?: string
}) {
  const current = templateOptions.find((t) => t.id === currentTemplate) || templateOptions[0]

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
        )}
      >
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: current.color }}
        >
          {current.icon}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">
          {current.name}
        </span>
        <svg
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-56 py-1 rounded-lg',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'shadow-lg z-50'
          )}
        >
          {templateOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onTemplateChange(option.id)
                setIsOpen(false)
              }}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 text-left',
                'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                currentTemplate === option.id && 'bg-gray-50 dark:bg-gray-700/50'
              )}
            >
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: option.color }}
              >
                {option.icon}
              </span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
              {currentTemplate === option.id && (
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------------------
// Cards Variant
// -------------------------------------------------------------------------------

function CardsSwitcher({
  currentTemplate,
  onTemplateChange,
  showDescription,
  className,
}: {
  currentTemplate: TemplateId
  onTemplateChange: (templateId: TemplateId) => void
  showDescription: boolean
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-5 gap-3', className)}>
      {templateOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onTemplateChange(option.id)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
            currentTemplate === option.id
              ? 'border-current shadow-lg scale-105'
              : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
          style={{
            borderColor: currentTemplate === option.id ? option.color : undefined,
          }}
        >
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-md"
            style={{ backgroundColor: option.color }}
          >
            {option.icon}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {option.name}
          </span>
          {showDescription && (
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {option.description}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default TemplateSwitcher
