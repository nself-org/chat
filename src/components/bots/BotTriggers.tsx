'use client'

/**
 * Bot Triggers Component
 * Define when your bot should respond
 */

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { BotBuilderTrigger, TriggerEvent } from '@/lib/bots'
import { EVENT_TYPES } from '@/lib/bots'

// ============================================================================
// TYPES
// ============================================================================

interface BotTriggersProps {
  triggers: BotBuilderTrigger[]
  onAdd: (trigger: BotBuilderTrigger) => void
  onRemove: (triggerId: string) => void
  error?: string
  className?: string
}

interface TriggerDraft {
  type: TriggerEvent
  keywords?: string
  patterns?: string
  schedule?: string
}

// ============================================================================
// TRIGGER OPTIONS
// ============================================================================

const TRIGGER_OPTIONS: Array<{
  value: TriggerEvent
  label: string
  description: string
  hasConfig: boolean
}> = [
  {
    value: 'message_created',
    label: 'Any Message',
    description: 'Triggers on every message',
    hasConfig: false,
  },
  {
    value: 'keyword',
    label: 'Keyword',
    description: 'Triggers when specific words are mentioned',
    hasConfig: true,
  },
  {
    value: 'mention',
    label: 'Bot Mention',
    description: 'Triggers when the bot is mentioned',
    hasConfig: false,
  },
  {
    value: 'user_joined',
    label: 'User Joins',
    description: 'Triggers when a user joins a channel',
    hasConfig: false,
  },
  {
    value: 'user_left',
    label: 'User Leaves',
    description: 'Triggers when a user leaves a channel',
    hasConfig: false,
  },
  {
    value: 'reaction_added',
    label: 'Reaction Added',
    description: 'Triggers when a reaction is added to a message',
    hasConfig: false,
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    description: 'Triggers on a schedule (cron expression)',
    hasConfig: true,
  },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BotTriggers({
  triggers,
  onAdd,
  onRemove,
  error,
  className,
}: BotTriggersProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState<TriggerDraft>({
    type: 'message_created',
  })
  const [validationError, setValidationError] = useState<string>()

  // Get trigger config
  const getSelectedTriggerConfig = () => {
    return TRIGGER_OPTIONS.find((t) => t.value === draft.type)
  }

  // Validate draft
  const validateDraft = (): boolean => {
    const config = getSelectedTriggerConfig()

    if (draft.type === 'keyword' && !draft.keywords?.trim()) {
      setValidationError('At least one keyword is required')
      return false
    }

    if (draft.type === 'scheduled' && !draft.schedule?.trim()) {
      setValidationError('Schedule expression is required')
      return false
    }

    setValidationError(undefined)
    return true
  }

  // Add a trigger
  const handleAdd = () => {
    if (!validateDraft()) return

    const trigger: BotBuilderTrigger = {
      id: `trigger_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: draft.type,
      config: {},
    }

    // Add type-specific config
    if (draft.type === 'keyword' && draft.keywords) {
      trigger.config.keywords = draft.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
    }

    if (draft.type === 'scheduled' && draft.schedule) {
      trigger.config.schedule = draft.schedule
    }

    onAdd(trigger)

    // Reset
    setDraft({ type: 'message_created' })
    setIsAdding(false)
  }

  // Format trigger for display
  const formatTrigger = (trigger: BotBuilderTrigger): string => {
    const config = TRIGGER_OPTIONS.find((t) => t.value === trigger.type)
    let label = config?.label || trigger.type

    if (trigger.type === 'keyword' && trigger.config.keywords) {
      const keywords = trigger.config.keywords as string[]
      label += `: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`
    }

    if (trigger.type === 'scheduled' && trigger.config.schedule) {
      label += `: ${trigger.config.schedule}`
    }

    return label
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error message */}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Existing Triggers */}
      {triggers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Triggers</h4>
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="p-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{formatTrigger(trigger)}</span>
                <p className="text-xs text-muted-foreground">
                  {TRIGGER_OPTIONS.find((t) => t.value === trigger.type)?.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(trigger.id)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Add Trigger Form */}
      {isAdding ? (
        <Card className="p-4 space-y-4">
          <h4 className="font-medium">New Trigger</h4>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Trigger Type
            </label>
            <div className="grid gap-2">
              {TRIGGER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                    draft.type === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  )}
                >
                  <input
                    type="radio"
                    name="trigger-type"
                    value={option.value}
                    checked={draft.type === option.value}
                    onChange={(e) =>
                      setDraft({
                        type: e.target.value as TriggerEvent,
                      })
                    }
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Keyword Config */}
          {draft.type === 'keyword' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Keywords
              </label>
              <input
                type="text"
                value={draft.keywords || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, keywords: e.target.value }))
                }
                placeholder="hello, hi, hey"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple keywords with commas
              </p>
            </div>
          )}

          {/* Schedule Config */}
          {draft.type === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Schedule (Cron Expression)
              </label>
              <input
                type="text"
                value={draft.schedule || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, schedule: e.target.value }))
                }
                placeholder="0 9 * * 1-5"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: "0 9 * * 1-5" = 9am on weekdays
              </p>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setValidationError(undefined)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Trigger</Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          + Add Trigger
        </Button>
      )}

      {/* Help */}
      <div className="text-sm text-muted-foreground">
        <p>
          Triggers define when your bot responds. You can add multiple triggers
          to respond to different events.
        </p>
      </div>
    </div>
  )
}

export default BotTriggers
