'use client'

/**
 * WorkflowCard - Individual workflow card
 *
 * Displays workflow information with actions
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Archive,
  Zap,
  Clock,
  Hash,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { Workflow, WorkflowStatus } from '@/lib/workflows/workflow-types'

interface WorkflowCardProps {
  workflow: Workflow
  variant?: 'card' | 'list'
  onEdit?: (workflow: Workflow) => void
  onDuplicate?: (workflow: Workflow) => void
  onDelete?: (workflow: Workflow) => void
  onToggleStatus?: (workflow: Workflow) => void
  className?: string
}

export function WorkflowCard({
  workflow,
  variant = 'card',
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  className,
}: WorkflowCardProps) {
  const statusConfig: Record<
    WorkflowStatus,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
    draft: { label: 'Draft', color: 'bg-gray-500', icon: Edit },
    paused: { label: 'Paused', color: 'bg-yellow-500', icon: Pause },
    archived: { label: 'Archived', color: 'bg-gray-400', icon: Archive },
  }

  const status = statusConfig[workflow.status]
  const StatusIcon = status.icon

  // Get trigger info
  const triggerStep = workflow.steps.find((s) => s.type === 'trigger')
  const triggerType = (triggerStep?.config as { triggerType?: string })?.triggerType || 'manual'

  // Format dates
  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
  }

  const handleEdit = () => onEdit?.(workflow)
  const handleDuplicate = () => onDuplicate?.(workflow)
  const handleDelete = () => onDelete?.(workflow)
  const handleToggleStatus = () => onToggleStatus?.(workflow)

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
          className
        )}
      >
        {/* Status indicator */}
        <div
          className={cn('w-2 h-2 rounded-full', status.color)}
          title={status.label}
        />

        {/* Workflow info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-medium truncate cursor-pointer hover:underline"
              onClick={handleEdit}
            >
              {workflow.name}
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {status.label}
            </Badge>
          </div>
          {workflow.description && (
            <p className="text-sm text-muted-foreground truncate">
              {workflow.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="capitalize">{triggerType.replace('_', ' ')}</span>
              </TooltipTrigger>
              <TooltipContent>Trigger type</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {workflow.steps.length}
              </TooltipTrigger>
              <TooltipContent>{workflow.steps.length} steps</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(workflow.updatedAt)}
              </TooltipTrigger>
              <TooltipContent>Last updated</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <WorkflowMenu
            workflow={workflow}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>
    )
  }

  // Card variant
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-base truncate cursor-pointer hover:underline"
              onClick={handleEdit}
            >
              {workflow.name}
            </CardTitle>
            {workflow.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {workflow.description}
              </CardDescription>
            )}
          </div>
          <WorkflowMenu
            workflow={workflow}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Status and trigger */}
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              workflow.status === 'active' && 'border-green-500 text-green-600',
              workflow.status === 'paused' && 'border-yellow-500 text-yellow-600'
            )}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {triggerType.replace('_', ' ')}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{workflow.steps.length} steps</span>
          <span>v{workflow.version}</span>
        </div>

        {/* Tags */}
        {workflow.settings.tags && workflow.settings.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {workflow.settings.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] rounded bg-muted"
              >
                {tag}
              </span>
            ))}
            {workflow.settings.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted">
                +{workflow.settings.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>Updated {formatDate(workflow.updatedAt)}</span>
          <Button variant="ghost" size="sm" className="h-7" onClick={handleEdit}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Workflow actions menu
function WorkflowMenu({
  workflow,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
}: {
  workflow: Workflow
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onToggleStatus?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
        )}
        {onToggleStatus && (
          <>
            <DropdownMenuSeparator />
            {workflow.status === 'active' ? (
              <DropdownMenuItem onClick={onToggleStatus}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </DropdownMenuItem>
            ) : workflow.status === 'paused' || workflow.status === 'draft' ? (
              <DropdownMenuItem onClick={onToggleStatus}>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            ) : null}
            {workflow.status !== 'archived' && (
              <DropdownMenuItem onClick={onToggleStatus}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WorkflowCard
