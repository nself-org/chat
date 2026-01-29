'use client';

/**
 * DraftPreview - Preview of draft content
 *
 * Shows truncated draft content with metadata
 */

import * as React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Paperclip, Reply, Hash, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Draft, DraftContextType } from '@/lib/drafts/draft-types';
import { getDraftPreview } from '@/lib/drafts';

// ============================================================================
// Types
// ============================================================================

export interface DraftPreviewProps {
  /** The draft to preview */
  draft: Draft;
  /** Maximum content length (default: 100) */
  maxLength?: number;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Show context info */
  showContext?: boolean;
  /** Show attachment count */
  showAttachments?: boolean;
  /** Show reply indicator */
  showReplyIndicator?: boolean;
  /** Timestamp format */
  timestampFormat?: 'relative' | 'absolute' | 'both';
  /** Context name resolver */
  contextNameResolver?: (type: DraftContextType, id: string) => string;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getContextIcon(type: DraftContextType) {
  switch (type) {
    case 'channel':
      return Hash;
    case 'thread':
      return MessageSquare;
    case 'dm':
      return User;
    default:
      return Hash;
  }
}

function getDefaultContextName(type: DraftContextType, id: string): string {
  switch (type) {
    case 'channel':
      return `#${id}`;
    case 'thread':
      return `Thread`;
    case 'dm':
      return `Direct message`;
    default:
      return id;
  }
}

// ============================================================================
// Component
// ============================================================================

export function DraftPreview({
  draft,
  maxLength = 100,
  showTimestamp = true,
  showContext = true,
  showAttachments = true,
  showReplyIndicator = true,
  timestampFormat = 'relative',
  contextNameResolver,
  className,
}: DraftPreviewProps) {
  const preview = getDraftPreview(draft, maxLength);
  const attachmentCount = draft.attachmentIds.length || draft.attachments?.length || 0;
  const isReply = draft.replyToMessageId !== null;
  const ContextIcon = getContextIcon(draft.contextType);
  const contextName = contextNameResolver
    ? contextNameResolver(draft.contextType, draft.contextId)
    : getDefaultContextName(draft.contextType, draft.contextId);

  // Format timestamp
  const formatTimestamp = () => {
    const date = new Date(draft.lastModified);

    switch (timestampFormat) {
      case 'absolute':
        return format(date, 'MMM d, h:mm a');
      case 'both':
        return `${format(date, 'MMM d')} (${formatDistanceToNow(date, { addSuffix: true })})`;
      case 'relative':
      default:
        return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Context and metadata row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {showContext && (
          <span className="flex items-center gap-1">
            <ContextIcon className="h-3 w-3" />
            <span className="font-medium">{contextName}</span>
          </span>
        )}

        {showReplyIndicator && isReply && (
          <span className="flex items-center gap-0.5">
            <Reply className="h-3 w-3" />
            <span>Reply</span>
          </span>
        )}

        {showAttachments && attachmentCount > 0 && (
          <span className="flex items-center gap-0.5">
            <Paperclip className="h-3 w-3" />
            <span>{attachmentCount}</span>
          </span>
        )}

        {showTimestamp && (
          <span className="ml-auto">{formatTimestamp()}</span>
        )}
      </div>

      {/* Content preview */}
      <p className="text-sm text-foreground line-clamp-2">
        {preview || (
          <span className="text-muted-foreground italic">
            {attachmentCount > 0
              ? `${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`
              : 'Empty draft'}
          </span>
        )}
      </p>

      {/* Reply preview */}
      {showReplyIndicator && isReply && draft.replyToPreview && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground border-l-2 border-muted pl-2 mt-1">
          <span className="font-medium">{draft.replyToPreview.userName}:</span>
          <span className="truncate">{draft.replyToPreview.content}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Preview
// ============================================================================

export interface DraftPreviewCompactProps {
  draft: Draft;
  maxLength?: number;
  className?: string;
}

/**
 * Compact single-line preview
 */
export function DraftPreviewCompact({
  draft,
  maxLength = 50,
  className,
}: DraftPreviewCompactProps) {
  const preview = getDraftPreview(draft, maxLength);
  const attachmentCount = draft.attachmentIds.length || draft.attachments?.length || 0;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="text-amber-500 font-medium">Draft:</span>
      <span className="text-muted-foreground truncate">
        {preview || (
          attachmentCount > 0
            ? `${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`
            : 'Empty'
        )}
      </span>
    </div>
  );
}

export default DraftPreview;
