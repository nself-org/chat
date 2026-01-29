'use client'

/**
 * WebhookStep - Webhook configuration component
 *
 * Configures HTTP API calls
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type {
  WebhookStep as WebhookStepType,
  HttpMethod,
  WebhookHeader,
} from '@/lib/workflows/workflow-types'

interface WebhookStepPropertiesProps {
  step: WebhookStepType
  onUpdate: (config: Record<string, unknown>) => void
}

export function WebhookStepProperties({
  step,
  onUpdate,
}: WebhookStepPropertiesProps) {
  const config = step.config

  const handleAddHeader = () => {
    const newHeaders: WebhookHeader[] = [
      ...(config.headers || []),
      { key: '', value: '', isSecret: false },
    ]
    onUpdate({ headers: newHeaders })
  }

  const handleUpdateHeader = (index: number, updates: Partial<WebhookHeader>) => {
    const newHeaders = [...(config.headers || [])]
    newHeaders[index] = { ...newHeaders[index], ...updates }
    onUpdate({ headers: newHeaders })
  }

  const handleDeleteHeader = (index: number) => {
    const newHeaders = config.headers?.filter((_, i) => i !== index) || []
    onUpdate({ headers: newHeaders })
  }

  return (
    <div className="space-y-3">
      {/* URL */}
      <div>
        <Label className="text-xs">URL</Label>
        <Input
          value={config.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          className="h-8 text-sm mt-1 font-mono"
          placeholder="https://api.example.com/endpoint"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Use {'{{variable}}'} to insert dynamic values
        </p>
      </div>

      {/* Method */}
      <div>
        <Label className="text-xs">Method</Label>
        <Select
          value={config.method}
          onValueChange={(value) => onUpdate({ method: value as HttpMethod })}
        >
          <SelectTrigger className="h-8 text-sm mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Headers */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Headers</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6"
            onClick={handleAddHeader}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {config.headers && config.headers.length > 0 && (
          <div className="space-y-2">
            {config.headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={header.key}
                  onChange={(e) => handleUpdateHeader(index, { key: e.target.value })}
                  className="h-6 text-xs flex-1"
                  placeholder="Header name"
                />
                <Input
                  value={header.value}
                  onChange={(e) => handleUpdateHeader(index, { value: e.target.value })}
                  className="h-6 text-xs flex-1"
                  placeholder="Value"
                  type={header.isSecret ? 'password' : 'text'}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDeleteHeader(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body (for POST, PUT, PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(config.method) && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Request Body</Label>
            <Select
              value={config.bodyType || 'json'}
              onValueChange={(value) => onUpdate({ bodyType: value })}
            >
              <SelectTrigger className="h-6 text-xs w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={config.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            className="text-xs font-mono min-h-[80px] mt-1"
            placeholder={
              config.bodyType === 'json'
                ? '{\n  "key": "{{variable}}"\n}'
                : 'Request body...'
            }
          />
        </div>
      )}

      {/* Response handling */}
      <div className="pt-2 border-t">
        <Label className="text-xs">Response Handling</Label>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs">Parse Response as JSON</p>
            <p className="text-[10px] text-muted-foreground">
              Store response in a variable
            </p>
          </div>
          <Switch
            checked={config.parseResponse !== false}
            onCheckedChange={(checked) => onUpdate({ parseResponse: checked })}
          />
        </div>

        {config.parseResponse !== false && (
          <div className="mt-2">
            <Label className="text-[10px]">Store response in variable</Label>
            <Input
              value={config.responseVariableName || ''}
              onChange={(e) => onUpdate({ responseVariableName: e.target.value })}
              className="h-6 text-xs font-mono mt-1"
              placeholder="webhookResponse"
            />
          </div>
        )}
      </div>

      {/* Advanced options */}
      <div className="pt-2 border-t">
        <Label className="text-xs">Advanced</Label>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <Label className="text-[10px]">Timeout (seconds)</Label>
            <Input
              type="number"
              value={config.timeoutSeconds || 30}
              onChange={(e) => onUpdate({ timeoutSeconds: parseInt(e.target.value) })}
              className="h-6 text-xs"
              min={1}
              max={300}
            />
          </div>
          <div>
            <Label className="text-[10px]">Retries</Label>
            <Input
              type="number"
              value={config.retryCount || 0}
              onChange={(e) => onUpdate({ retryCount: parseInt(e.target.value) })}
              className="h-6 text-xs"
              min={0}
              max={10}
            />
          </div>
        </div>

        <div className="mt-2">
          <Label className="text-[10px]">Expected Status Codes</Label>
          <Input
            value={config.expectedStatusCodes?.join(', ') || ''}
            onChange={(e) => {
              const codes = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim()))
                .filter((n) => !isNaN(n))
              onUpdate({ expectedStatusCodes: codes.length > 0 ? codes : undefined })
            }}
            className="h-6 text-xs mt-1"
            placeholder="200, 201 (empty for any 2xx)"
          />
        </div>
      </div>
    </div>
  )
}

export default WebhookStepProperties
