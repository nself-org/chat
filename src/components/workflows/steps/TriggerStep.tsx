'use client'

/**
 * TriggerStep - Trigger configuration component
 *
 * Configures workflow triggers (events that start the workflow)
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TriggerStep as TriggerStepType, TriggerType } from '@/lib/workflows/workflow-types'
import { triggerTemplates } from '@/lib/workflows/workflow-triggers'

interface TriggerStepPropertiesProps {
  step: TriggerStepType
  onUpdate: (config: Record<string, unknown>) => void
}

export function TriggerStepProperties({
  step,
  onUpdate,
}: TriggerStepPropertiesProps) {
  const config = step.config

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Trigger Type</Label>
        <Select
          value={config.triggerType}
          onValueChange={(value) => onUpdate({ triggerType: value as TriggerType })}
        >
          <SelectTrigger className="h-8 text-sm mt-1">
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(triggerTemplates).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">
          {triggerTemplates[config.triggerType]?.description}
        </p>
      </div>

      {/* Channel filter */}
      {['message_received', 'reaction_added', 'member_joined', 'member_left', 'keyword', 'mention'].includes(
        config.triggerType
      ) && (
        <div>
          <Label className="text-xs">Channel (optional)</Label>
          <Input
            value={config.channelId || ''}
            onChange={(e) => onUpdate({ channelId: e.target.value || null })}
            className="h-8 text-sm mt-1"
            placeholder="Any channel"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Leave empty to trigger in any channel
          </p>
        </div>
      )}

      {/* Keyword trigger */}
      {config.triggerType === 'keyword' && (
        <div>
          <Label className="text-xs">Keyword</Label>
          <Input
            value={config.keyword || ''}
            onChange={(e) => onUpdate({ keyword: e.target.value })}
            className="h-8 text-sm mt-1"
            placeholder="Enter keyword to watch for"
          />
        </div>
      )}

      {/* Mention type */}
      {config.triggerType === 'mention' && (
        <div>
          <Label className="text-xs">Mention Type</Label>
          <Select
            value={config.mentionType || 'user'}
            onValueChange={(value) => onUpdate({ mentionType: value })}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User mention (@user)</SelectItem>
              <SelectItem value="channel">Channel mention (#channel)</SelectItem>
              <SelectItem value="everyone">@everyone</SelectItem>
              <SelectItem value="here">@here</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Slash command */}
      {config.triggerType === 'slash_command' && (
        <div>
          <Label className="text-xs">Command</Label>
          <Input
            value={config.slashCommand || '/'}
            onChange={(e) => {
              let value = e.target.value
              if (!value.startsWith('/')) value = '/' + value
              onUpdate({ slashCommand: value })
            }}
            className="h-8 text-sm mt-1 font-mono"
            placeholder="/command"
          />
        </div>
      )}

      {/* Scheduled trigger */}
      {config.triggerType === 'scheduled' && (
        <ScheduleConfig
          schedule={config.schedule}
          onUpdate={(schedule) => onUpdate({ schedule })}
        />
      )}

      {/* Webhook trigger */}
      {config.triggerType === 'webhook' && (
        <div>
          <Label className="text-xs">Webhook Secret (optional)</Label>
          <Input
            value={config.webhookSecret || ''}
            onChange={(e) => onUpdate({ webhookSecret: e.target.value })}
            className="h-8 text-sm mt-1 font-mono"
            placeholder="Secret for signature verification"
            type="password"
          />
        </div>
      )}
    </div>
  )
}

// Schedule configuration sub-component
function ScheduleConfig({
  schedule,
  onUpdate,
}: {
  schedule?: {
    type?: 'once' | 'recurring'
    datetime?: string
    cron?: string
    timezone?: string
  }
  onUpdate: (schedule: Record<string, unknown>) => void
}) {
  const scheduleType = schedule?.type || 'recurring'

  return (
    <div className="space-y-3 pt-2 border-t">
      <div>
        <Label className="text-xs">Schedule Type</Label>
        <Select
          value={scheduleType}
          onValueChange={(value) => onUpdate({ ...schedule, type: value })}
        >
          <SelectTrigger className="h-8 text-sm mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">One-time</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scheduleType === 'once' && (
        <div>
          <Label className="text-xs">Date & Time</Label>
          <Input
            type="datetime-local"
            value={schedule?.datetime?.slice(0, 16) || ''}
            onChange={(e) =>
              onUpdate({ ...schedule, datetime: new Date(e.target.value).toISOString() })
            }
            className="h-8 text-sm mt-1"
          />
        </div>
      )}

      {scheduleType === 'recurring' && (
        <>
          <div>
            <Label className="text-xs">Cron Expression</Label>
            <Input
              value={schedule?.cron || '0 9 * * 1-5'}
              onChange={(e) => onUpdate({ ...schedule, cron: e.target.value })}
              className="h-8 text-sm mt-1 font-mono"
              placeholder="0 9 * * 1-5"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Format: minute hour day-of-month month day-of-week
            </p>
          </div>

          {/* Common presets */}
          <div>
            <Label className="text-xs">Quick Presets</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: 'Every hour', cron: '0 * * * *' },
                { label: 'Daily 9am', cron: '0 9 * * *' },
                { label: 'Weekdays 9am', cron: '0 9 * * 1-5' },
                { label: 'Monday 9am', cron: '0 9 * * 1' },
                { label: 'Monthly', cron: '0 9 1 * *' },
              ].map((preset) => (
                <button
                  key={preset.cron}
                  type="button"
                  onClick={() => onUpdate({ ...schedule, cron: preset.cron })}
                  className="px-2 py-0.5 text-[10px] rounded bg-muted hover:bg-muted/80"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <Label className="text-xs">Timezone</Label>
        <Select
          value={schedule?.timezone || 'UTC'}
          onValueChange={(value) => onUpdate({ ...schedule, timezone: value })}
        >
          <SelectTrigger className="h-8 text-sm mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            <SelectItem value="Europe/London">London</SelectItem>
            <SelectItem value="Europe/Paris">Paris</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default TriggerStepProperties
