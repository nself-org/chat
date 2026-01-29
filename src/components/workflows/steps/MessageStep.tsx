'use client'

/**
 * MessageStep - Message configuration component
 *
 * Configures sending messages to channels or users
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MessageStep as MessageStepType, MessageTarget } from '@/lib/workflows/workflow-types'

interface MessageStepPropertiesProps {
  step: MessageStepType
  onUpdate: (config: Record<string, unknown>) => void
}

export function MessageStepProperties({
  step,
  onUpdate,
}: MessageStepPropertiesProps) {
  const config = step.config

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Send To</Label>
        <Select
          value={config.target}
          onValueChange={(value) => onUpdate({ target: value as MessageTarget })}
        >
          <SelectTrigger className="h-8 text-sm mt-1">
            <SelectValue placeholder="Select target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trigger_source">Trigger Source</SelectItem>
            <SelectItem value="channel">Specific Channel</SelectItem>
            <SelectItem value="user">Specific User</SelectItem>
            <SelectItem value="thread">Reply in Thread</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">
          {config.target === 'trigger_source' && 'Sends to where the workflow was triggered'}
          {config.target === 'channel' && 'Sends to a specific channel'}
          {config.target === 'user' && 'Sends a direct message to a specific user'}
          {config.target === 'thread' && 'Replies in the message thread'}
        </p>
      </div>

      {/* Channel ID input */}
      {config.target === 'channel' && (
        <div>
          <Label className="text-xs">Channel ID or Name</Label>
          <Input
            value={config.channelId || ''}
            onChange={(e) => onUpdate({ channelId: e.target.value })}
            className="h-8 text-sm mt-1"
            placeholder="general or channel ID"
          />
        </div>
      )}

      {/* User ID input */}
      {config.target === 'user' && (
        <div>
          <Label className="text-xs">User ID</Label>
          <Input
            value={config.userId || ''}
            onChange={(e) => onUpdate({ userId: e.target.value })}
            className="h-8 text-sm mt-1"
            placeholder="User ID or {{variable}}"
          />
        </div>
      )}

      {/* Message content */}
      <div>
        <Label className="text-xs">Message Content</Label>
        <Textarea
          value={config.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="text-sm mt-1 min-h-[100px] font-mono"
          placeholder="Enter your message..."
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Use {'{{variableName}}'} to insert variables. Supports markdown formatting.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Parse Variables</Label>
            <p className="text-[10px] text-muted-foreground">
              Replace {'{{variables}}'} with values
            </p>
          </div>
          <Switch
            checked={config.parseVariables !== false}
            onCheckedChange={(checked) => onUpdate({ parseVariables: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Ephemeral</Label>
            <p className="text-[10px] text-muted-foreground">
              Only visible to recipient
            </p>
          </div>
          <Switch
            checked={config.isEphemeral === true}
            onCheckedChange={(checked) => onUpdate({ isEphemeral: checked })}
          />
        </div>
      </div>

      {/* Variable suggestions */}
      <div className="pt-2 border-t">
        <Label className="text-xs">Available Variables</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            'trigger.data.userName',
            'trigger.data.channelName',
            'trigger.data.content',
            'user.name',
            'channel.name',
          ].map((varName) => (
            <button
              key={varName}
              type="button"
              onClick={() => {
                const newContent = (config.content || '') + `{{${varName}}}`
                onUpdate({ content: newContent })
              }}
              className="px-2 py-0.5 text-[10px] rounded bg-muted hover:bg-muted/80 font-mono"
            >
              {`{{${varName}}}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MessageStepProperties
