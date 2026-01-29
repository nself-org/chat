'use client'

/**
 * Bot Responses Component
 * Define what your bot says in response to triggers
 */

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { BotBuilderAction, BuilderActionType } from '@/lib/bots'

// ============================================================================
// TYPES
// ============================================================================

interface BotResponsesProps {
  actions: BotBuilderAction[]
  onAdd: (action: BotBuilderAction) => void
  onRemove: (actionId: string) => void
  error?: string
  className?: string
}

interface ResponseDraft {
  type: BuilderActionType
  message?: string
  reactions?: string
  webhookUrl?: string
  dataKey?: string
  dataValue?: string
}

// ============================================================================
// ACTION OPTIONS
// ============================================================================

const ACTION_OPTIONS: Array<{
  value: BuilderActionType
  label: string
  description: string
}> = [
  {
    value: 'send_message',
    label: 'Send Message',
    description: 'Send a text message to the channel',
  },
  {
    value: 'reply_message',
    label: 'Reply to Message',
    description: 'Reply to the triggering message',
  },
  {
    value: 'add_reaction',
    label: 'Add Reaction',
    description: 'Add emoji reactions to messages',
  },
  {
    value: 'store_data',
    label: 'Store Data',
    description: 'Save data for later use',
  },
  {
    value: 'call_webhook',
    label: 'Call Webhook',
    description: 'Make an HTTP request to an external URL',
  },
]

// ============================================================================
// TEMPLATE VARIABLES
// ============================================================================

const TEMPLATE_VARIABLES = [
  { variable: '{user}', description: 'Username of the person who triggered' },
  { variable: '{channel}', description: 'Name of the current channel' },
  { variable: '{message}', description: 'The triggering message content' },
  { variable: '{date}', description: 'Current date' },
  { variable: '{time}', description: 'Current time' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BotResponses({
  actions,
  onAdd,
  onRemove,
  error,
  className,
}: BotResponsesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState<ResponseDraft>({
    type: 'send_message',
    message: '',
  })
  const [validationError, setValidationError] = useState<string>()

  // Filter response actions (not commands)
  const responseActions = actions.filter(
    (a) => !a.config.isCommand
  )

  // Validate draft
  const validateDraft = (): boolean => {
    if (draft.type === 'send_message' || draft.type === 'reply_message') {
      if (!draft.message?.trim()) {
        setValidationError('Message is required')
        return false
      }
    }

    if (draft.type === 'add_reaction') {
      if (!draft.reactions?.trim()) {
        setValidationError('At least one reaction is required')
        return false
      }
    }

    if (draft.type === 'call_webhook') {
      if (!draft.webhookUrl?.trim()) {
        setValidationError('Webhook URL is required')
        return false
      }
      try {
        new URL(draft.webhookUrl)
      } catch {
        setValidationError('Invalid URL format')
        return false
      }
    }

    if (draft.type === 'store_data') {
      if (!draft.dataKey?.trim()) {
        setValidationError('Data key is required')
        return false
      }
    }

    setValidationError(undefined)
    return true
  }

  // Add action
  const handleAdd = () => {
    if (!validateDraft()) return

    const action: BotBuilderAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: draft.type,
      config: {},
      order: responseActions.length,
    }

    // Add type-specific config
    switch (draft.type) {
      case 'send_message':
      case 'reply_message':
        action.config.message = draft.message
        break
      case 'add_reaction':
        action.config.reactions = draft.reactions?.split(',').map((r) => r.trim())
        break
      case 'call_webhook':
        action.config.webhookUrl = draft.webhookUrl
        break
      case 'store_data':
        action.config.key = draft.dataKey
        action.config.value = draft.dataValue
        break
    }

    onAdd(action)

    // Reset
    setDraft({ type: 'send_message', message: '' })
    setIsAdding(false)
  }

  // Format action for display
  const formatAction = (action: BotBuilderAction): string => {
    const config = ACTION_OPTIONS.find((a) => a.value === action.type)
    let label = config?.label || action.type

    switch (action.type) {
      case 'send_message':
      case 'reply_message':
        const message = action.config.message as string
        if (message) {
          label += `: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`
        }
        break
      case 'add_reaction':
        const reactions = action.config.reactions as string[]
        if (reactions) {
          label += `: ${reactions.join(' ')}`
        }
        break
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

      {/* Existing Actions */}
      {responseActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Response Actions</h4>
          {responseActions.map((action, index) => (
            <Card key={action.id} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="font-medium">{formatAction(action)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(action.id)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Add Action Form */}
      {isAdding ? (
        <Card className="p-4 space-y-4">
          <h4 className="font-medium">New Response Action</h4>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Action Type
            </label>
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({ type: e.target.value as BuilderActionType })
              }
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Send/Reply Message */}
          {(draft.type === 'send_message' || draft.type === 'reply_message') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Message
              </label>
              <textarea
                value={draft.message || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Enter your message..."
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
              />
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Available variables:
                </p>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.variable}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          message: (prev.message || '') + v.variable,
                        }))
                      }
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                      title={v.description}
                    >
                      {v.variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Reaction */}
          {draft.type === 'add_reaction' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Reactions
              </label>
              <input
                type="text"
                value={draft.reactions || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, reactions: e.target.value }))
                }
                placeholder=":thumbsup:, :heart:, :fire:"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple reactions with commas
              </p>
            </div>
          )}

          {/* Call Webhook */}
          {draft.type === 'call_webhook' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={draft.webhookUrl || ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                placeholder="https://api.example.com/webhook"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>
          )}

          {/* Store Data */}
          {draft.type === 'store_data' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data Key
                </label>
                <input
                  type="text"
                  value={draft.dataKey || ''}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, dataKey: e.target.value }))
                  }
                  placeholder="my_data_key"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data Value
                </label>
                <input
                  type="text"
                  value={draft.dataValue || ''}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, dataValue: e.target.value }))
                  }
                  placeholder="Value to store"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </>
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
            <Button onClick={handleAdd}>Add Action</Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          + Add Response Action
        </Button>
      )}

      {/* Help */}
      <div className="text-sm text-muted-foreground">
        <p>
          Response actions define what your bot does when a trigger fires.
          Actions are executed in order from top to bottom.
        </p>
      </div>
    </div>
  )
}

export default BotResponses
