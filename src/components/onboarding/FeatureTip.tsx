'use client';

import { useState, useCallback } from 'react';
import { X, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTipProps {
  title: string;
  description: string;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function FeatureTip({
  title,
  description,
  onDismiss,
  onAction,
  actionLabel = 'Learn more',
  variant = 'default',
  className,
}: FeatureTipProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 200);
  }, [onDismiss]);

  if (!isVisible) return null;

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20',
          'transition-all duration-200',
          className
        )}
      >
        <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{title}:</span> {description}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="w-3 h-3 text-zinc-500" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
          'transition-all duration-200',
          className
        )}
      >
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          {title}
        </span>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
          >
            <X className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-zinc-900 dark:text-white">
              {title}
            </h4>
            {onDismiss && (
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {description}
          </p>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              {actionLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
