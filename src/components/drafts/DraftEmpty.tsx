'use client';

/**
 * DraftEmpty - Empty state for no drafts
 *
 * Shown when there are no drafts
 */

import * as React from 'react';
import { FileText, Pencil, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface DraftEmptyProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Show tips */
  showTips?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Tips
// ============================================================================

const tips = [
  {
    icon: Pencil,
    text: 'Start typing a message in any channel to create a draft',
  },
  {
    icon: Clock,
    text: 'Drafts are automatically saved as you type',
  },
  {
    icon: Hash,
    text: 'Each channel and DM has its own draft',
  },
];

// ============================================================================
// Size Classes
// ============================================================================

const sizeClasses = {
  icon: {
    sm: 'h-8 w-8',
    default: 'h-12 w-12',
    lg: 'h-16 w-16',
  },
  iconContainer: {
    sm: 'h-12 w-12',
    default: 'h-16 w-16',
    lg: 'h-20 w-20',
  },
  title: {
    sm: 'text-base',
    default: 'text-lg',
    lg: 'text-xl',
  },
  description: {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  },
};

// ============================================================================
// Component
// ============================================================================

export function DraftEmpty({
  title = 'No drafts',
  description = "You don't have any saved drafts. Start typing in a channel to create one.",
  showIcon = true,
  icon,
  action,
  showTips = true,
  size = 'default',
  className,
}: DraftEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      {/* Icon */}
      {showIcon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted mb-4',
            sizeClasses.iconContainer[size]
          )}
        >
          {icon || (
            <FileText
              className={cn(
                'text-muted-foreground',
                sizeClasses.icon[size]
              )}
            />
          )}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-foreground mb-2',
          sizeClasses.title[size]
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          'text-muted-foreground max-w-sm',
          sizeClasses.description[size]
        )}
      >
        {description}
      </p>

      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}

      {/* Tips */}
      {showTips && size !== 'sm' && (
        <div className="mt-8 pt-6 border-t w-full max-w-md">
          <p className="text-xs font-medium text-muted-foreground mb-4">
            Tips
          </p>
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-left"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted flex-shrink-0">
                  <tip.icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Empty State
// ============================================================================

export interface DraftEmptyCompactProps {
  message?: string;
  className?: string;
}

/**
 * Compact empty state for inline use
 */
export function DraftEmptyCompact({
  message = 'No drafts',
  className,
}: DraftEmptyCompactProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground',
        className
      )}
    >
      <FileText className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

// ============================================================================
// Search Empty State
// ============================================================================

export interface DraftSearchEmptyProps {
  searchTerm: string;
  onClear?: () => void;
  className?: string;
}

/**
 * Empty state for no search results
 */
export function DraftSearchEmpty({
  searchTerm,
  onClear,
  className,
}: DraftSearchEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="font-semibold text-foreground mb-2">No drafts found</h3>

      <p className="text-sm text-muted-foreground max-w-sm">
        No drafts match "{searchTerm}"
      </p>

      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear search
        </Button>
      )}
    </div>
  );
}

export default DraftEmpty;
