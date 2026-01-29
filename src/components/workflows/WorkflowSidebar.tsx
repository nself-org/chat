'use client'

/**
 * WorkflowSidebar - Side panel with step library and settings
 *
 * Contains draggable step types and workflow configuration
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowBuilderStore } from '@/stores/workflow-builder-store'
import { stepCategories, stepTemplates } from '@/lib/workflows/workflow-steps'
import { triggerTemplates } from '@/lib/workflows/workflow-triggers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { StepType, TriggerType } from '@/lib/workflows/workflow-types'
import {
  Search,
  Zap,
  MessageSquare,
  ClipboardList,
  GitBranch,
  Clock,
  Globe,
  CheckCircle,
  Play,
  Repeat,
  GitFork,
  Square,
  Settings,
  Variable,
  Plus,
  Trash2,
} from 'lucide-react'

interface WorkflowSidebarProps {
  className?: string
}

// Icon mapping for step types
const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  message: MessageSquare,
  form: ClipboardList,
  condition: GitBranch,
  delay: Clock,
  webhook: Globe,
  approval: CheckCircle,
  action: Play,
  loop: Repeat,
  parallel: GitFork,
  end: Square,
}

export function WorkflowSidebar({ className }: WorkflowSidebarProps) {
  const { workflow, sidebarTab, setSidebarTab, updateVariable, addVariable, deleteVariable } =
    useWorkflowBuilderStore()
  const [searchQuery, setSearchQuery] = React.useState('')

  return (
    <div className={cn('flex flex-col bg-card', className)}>
      <Tabs
        value={sidebarTab}
        onValueChange={(v) =>
          setSidebarTab(v as 'steps' | 'variables' | 'settings')
        }
        className="flex flex-col h-full"
      >
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-10">
          <TabsTrigger value="steps" className="text-xs">
            Steps
          </TabsTrigger>
          <TabsTrigger value="variables" className="text-xs">
            Variables
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="flex-1 mt-0 overflow-hidden">
          <StepsPanel searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </TabsContent>

        <TabsContent value="variables" className="flex-1 mt-0 overflow-hidden">
          <VariablesPanel />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Steps panel with draggable step types
function StepsPanel({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  const { startDrag, endDrag } = useWorkflowBuilderStore()

  const handleDragStart = (
    e: React.DragEvent,
    type: StepType
  ) => {
    e.dataTransfer.effectAllowed = 'copy'
    startDrag(type)
  }

  const handleDragEnd = () => {
    endDrag()
  }

  // Filter steps by search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return stepCategories

    const query = searchQuery.toLowerCase()
    return stepCategories
      .map((category) => ({
        ...category,
        steps: category.steps.filter((stepType) => {
          const template = stepTemplates[stepType as StepType]
          return (
            template.name.toLowerCase().includes(query) ||
            template.description.toLowerCase().includes(query) ||
            category.name.toLowerCase().includes(query)
          )
        }),
      }))
      .filter((category) => category.steps.length > 0)
  }, [searchQuery])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Step categories */}
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          defaultValue={stepCategories.map((c) => c.id)}
          className="px-2"
        >
          {/* Triggers category */}
          <AccordionItem value="triggers">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Triggers
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pb-2">
                {Object.entries(triggerTemplates).map(([key, template]) => {
                  const query = searchQuery.toLowerCase()
                  if (
                    searchQuery &&
                    !template.name.toLowerCase().includes(query) &&
                    !template.description.toLowerCase().includes(query)
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'trigger')}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md cursor-grab',
                        'border border-transparent',
                        'hover:bg-accent hover:border-border',
                        'active:cursor-grabbing'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: template.color + '20' }}
                      >
                        <Zap
                          className="h-3.5 w-3.5"
                          style={{ color: template.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {template.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Other step categories */}
          {filteredCategories
            .filter((c) => c.id !== 'triggers')
            .map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      stepIcons[category.steps[0] as StepType] || Play,
                      { className: 'h-4 w-4' }
                    )}
                    {category.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pb-2">
                    {category.steps.map((stepType) => {
                      const template = stepTemplates[stepType as StepType]
                      const Icon = stepIcons[stepType as StepType] || Play

                      return (
                        <div
                          key={stepType}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, stepType as StepType)
                          }
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-md cursor-grab',
                            'border border-transparent',
                            'hover:bg-accent hover:border-border',
                            'active:cursor-grabbing'
                          )}
                        >
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: template.color + '20' }}
                          >
                            <Icon
                              className="h-3.5 w-3.5"
                              style={{ color: template.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {template.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}

// Variables panel
function VariablesPanel() {
  const { workflow, addVariable, updateVariable, deleteVariable } =
    useWorkflowBuilderStore()

  const handleAddVariable = () => {
    addVariable({
      name: `variable_${(workflow?.variables.length || 0) + 1}`,
      type: 'string',
      description: '',
    })
  }

  if (!workflow) return null

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium">Workflow Variables</span>
        <Button variant="ghost" size="sm" onClick={handleAddVariable}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {workflow.variables.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No variables defined.
              <br />
              Click "Add" to create one.
            </p>
          ) : (
            workflow.variables.map((variable) => (
              <div
                key={variable.id}
                className="p-2 rounded-md border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={variable.name}
                      onChange={(e) =>
                        updateVariable(variable.id, { name: e.target.value })
                      }
                      className="h-6 text-xs font-mono w-32"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => deleteVariable(variable.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Type</Label>
                    <select
                      value={variable.type}
                      onChange={(e) =>
                        updateVariable(variable.id, {
                          type: e.target.value as 'string' | 'number' | 'boolean' | 'array' | 'object',
                        })
                      }
                      className="w-full h-6 text-xs rounded border bg-background"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Default</Label>
                    <Input
                      value={String(variable.defaultValue || '')}
                      onChange={(e) =>
                        updateVariable(variable.id, {
                          defaultValue: e.target.value,
                        })
                      }
                      className="h-6 text-xs"
                      placeholder="Default value"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Settings panel
function SettingsPanel() {
  const { workflow } = useWorkflowBuilderStore()

  if (!workflow) return null

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-4">
        <div>
          <Label className="text-xs">Workflow Name</Label>
          <Input
            value={workflow.name}
            className="h-8 text-sm mt-1"
            readOnly
          />
        </div>

        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            value={workflow.description || ''}
            className="text-sm mt-1 min-h-[60px]"
            readOnly
          />
        </div>

        <div>
          <Label className="text-xs">Status</Label>
          <div className="mt-1">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                workflow.status === 'active' &&
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                workflow.status === 'draft' &&
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                workflow.status === 'paused' &&
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              )}
            >
              {workflow.status}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Runtime Settings
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Duration</span>
              <span>
                {workflow.settings.maxDuration
                  ? `${workflow.settings.maxDuration / 1000 / 60} min`
                  : 'Unlimited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retry on Failure</span>
              <span>{workflow.settings.retryOnFailure ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Retries</span>
              <span>{workflow.settings.maxRetries || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Log Level</span>
              <span>{workflow.settings.logLevel || 'all'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <h4 className="text-xs font-medium mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {workflow.settings.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted"
              >
                {tag}
              </span>
            )) || (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span>{workflow.version}</span>
          </div>
          <div className="flex justify-between">
            <span>Created</span>
            <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default WorkflowSidebar
