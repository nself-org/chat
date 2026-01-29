'use client'

/**
 * AuditEventCard - Summary card for audit events
 */

import {
  User,
  MessageSquare,
  Hash,
  File,
  Shield,
  Lock,
  Puzzle,
  Info,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Check,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import type { AuditLogEntry, AuditCategory, AuditSeverity } from '@/lib/audit/audit-types'
import {
  formatTimestamp,
  getCategoryBadgeClass,
  getSeverityBadgeClass,
} from '@/lib/audit/audit-formatter'
import { getActionDisplayName } from '@/lib/audit/audit-events'

// ============================================================================
// Icons
// ============================================================================

const categoryIcons: Record<AuditCategory, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  channel: <Hash className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  security: <Lock className="h-4 w-4" />,
  integration: <Puzzle className="h-4 w-4" />,
}

const severityIcons: Record<AuditSeverity, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  critical: <AlertOctagon className="h-4 w-4" />,
}

// ============================================================================
// Types
// ============================================================================

interface AuditEventCardProps {
  entry: AuditLogEntry
  onClick?: () => void
  compact?: boolean
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function AuditEventCard({
  entry,
  onClick,
  compact = false,
  className,
}: AuditEventCardProps) {
  const actorName =
    entry.actor.displayName || entry.actor.username || entry.actor.email || entry.actor.id

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors',
          className
        )}
        onClick={onClick}
      >
        <div className={cn('p-1.5 rounded', getCategoryBadgeClass(entry.category))}>
          {categoryIcons[entry.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {getActionDisplayName(entry.action)}
            </span>
            {!entry.success && (
              <X className="h-3 w-3 text-red-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {actorName} - {formatTimestamp(entry.timestamp, 'relative')}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        !entry.success && 'border-red-200 dark:border-red-800',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className={cn(
              'p-2 rounded-lg flex-shrink-0',
              getCategoryBadgeClass(entry.category)
            )}
          >
            {categoryIcons[entry.category]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">
                  {getActionDisplayName(entry.action)}
                </span>
                <Badge
                  variant="outline"
                  className={cn('flex-shrink-0', getSeverityBadgeClass(entry.severity))}
                >
                  {severityIcons[entry.severity]}
                </Badge>
              </div>
              {entry.success ? (
                <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                  <Check className="h-3 w-3" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600 flex-shrink-0">
                  <X className="h-3 w-3" />
                  Failed
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {entry.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {actorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[150px]">{actorName}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatTimestamp(entry.timestamp, 'relative')}
              </div>
            </div>

            {/* Resource Info */}
            {entry.resource && (
              <div className="mt-2 pt-2 border-t text-xs">
                <span className="text-muted-foreground capitalize">
                  {entry.resource.type}:
                </span>{' '}
                <span className="font-mono">
                  {entry.resource.name || entry.resource.id}
                </span>
              </div>
            )}

            {/* Error Message */}
            {entry.errorMessage && (
              <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300 line-clamp-2">
                {entry.errorMessage}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Summary Card Component
// ============================================================================

interface AuditSummaryCardProps {
  title: string
  value: number | string
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function AuditSummaryCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: AuditSummaryCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}% from last period
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-muted">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
