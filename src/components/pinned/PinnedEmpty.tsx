'use client';

import * as React from 'react';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PinnedEmptyProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Additional className */
  className?: string;
}

/**
 * Empty state for when there are no pinned messages.
 */
export function PinnedEmpty({
  title = 'No pinned messages',
  description = 'Pin important messages to keep them easily accessible. Pinned messages are visible to everyone in this channel.',
  className,
}: PinnedEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Pin className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
