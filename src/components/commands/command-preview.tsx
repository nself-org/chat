'use client';

/**
 * CommandPreview Component
 *
 * Shows a preview of the command result before execution.
 * Allows the user to confirm or cancel the action.
 *
 * @example
 * ```tsx
 * <CommandPreview
 *   command={command}
 *   result={previewResult}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   isLoading={isExecuting}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SlashCommand } from '@/lib/commands';
import type { CommandResult, CommandResultData } from '@/lib/commands';

// ============================================================================
// Types
// ============================================================================

export interface CommandPreviewProps {
  /** The command being previewed */
  command: SlashCommand;
  /** The preview result */
  result: CommandResult;
  /** Callback when user confirms execution */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether the command is currently executing */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

export interface PreviewContentProps {
  /** Preview data from command result */
  data: CommandResultData;
  /** Type of preview */
  type: string;
}

// ============================================================================
// Preview Content Components
// ============================================================================

/**
 * Generic confirmation preview
 */
function ConfirmationPreview({ data }: PreviewContentProps) {
  const preview = data.preview;
  if (!preview) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{preview.title}</h3>
      <div className="text-sm text-muted-foreground">
        {typeof preview.content === 'string' ? (
          <p className="whitespace-pre-wrap">{preview.content}</p>
        ) : (
          preview.content
        )}
      </div>
    </div>
  );
}

/**
 * Poll creation preview
 */
function PollPreview({ data }: PreviewContentProps) {
  const poll = data.poll;
  if (!poll) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Create Poll</h3>
        <p className="text-sm text-muted-foreground">
          Preview how your poll will look
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-3">
        <p className="font-medium">{poll.question}</p>
        <div className="space-y-2">
          {poll.options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 bg-background rounded-md"
            >
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm">{option}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {poll.options.length} options
        </p>
      </div>
    </div>
  );
}

/**
 * GIF search preview
 */
function GiphyPreview({ data }: PreviewContentProps) {
  const searchQuery = data.searchQuery as string;
  const gif = data.gif;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Send GIF</h3>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Searching for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {gif ? (
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gif.url}
            alt={gif.title || 'GIF preview'}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading GIFs...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reminder preview
 */
function ReminderPreview({ data }: PreviewContentProps) {
  const reminder = data.reminder;
  if (!reminder) return null;

  const triggerDate = new Date(reminder.triggerAt);
  const formattedDate = triggerDate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Set Reminder</h3>
        <p className="text-sm text-muted-foreground">
          You&apos;ll be reminded at the specified time
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-3">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <p className="text-sm pl-8">{reminder.message}</p>
      </div>
    </div>
  );
}

/**
 * Status change preview
 */
function StatusPreview({ data }: PreviewContentProps) {
  const status = data.status;
  if (!status) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Update Status</h3>
        <p className="text-sm text-muted-foreground">
          Your status will be visible to others
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          {status.emoji && <span className="text-2xl">{status.emoji}</span>}
          <span className="font-medium">{status.text || 'No status text'}</span>
        </div>
        {status.expiration && (
          <p className="text-xs text-muted-foreground mt-2">
            Expires in {formatDuration(status.expiration - Date.now())}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Channel members preview
 */
function MembersPreview({ data }: PreviewContentProps) {
  const members = data.members;
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Channel Members</h3>
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{member.name}</p>
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Message preview (for /me, /shrug, etc.)
 */
function MessagePreview({ data }: PreviewContentProps) {
  const content = data.messageContent;
  const type = data.messageType;

  if (!content) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Send Message</h3>
        <p className="text-sm text-muted-foreground">
          Preview of your message
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p
          className={cn(
            'text-sm',
            type === 'action' && 'italic text-muted-foreground'
          )}
        >
          {type === 'action' ? `* ${content}` : content}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

// ============================================================================
// Main Component
// ============================================================================

export function CommandPreview({
  command,
  result,
  onConfirm,
  onCancel,
  isLoading = false,
  className,
}: CommandPreviewProps) {
  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  // Render appropriate preview content
  const renderPreviewContent = () => {
    if (!result.data) {
      return (
        <ConfirmationPreview
          data={{
            preview: {
              title: `Execute /${command.name}`,
              content: 'Are you sure you want to execute this command?',
              confirmLabel: 'Execute',
              cancelLabel: 'Cancel',
            },
          }}
          type="confirmation"
        />
      );
    }

    const data = result.data;

    // Poll preview
    if (data.poll) {
      return <PollPreview data={data} type="poll" />;
    }

    // GIF preview
    if (data.searchType === 'giphy' || data.gif) {
      return <GiphyPreview data={data} type="giphy" />;
    }

    // Reminder preview
    if (data.reminder) {
      return <ReminderPreview data={data} type="reminder" />;
    }

    // Status preview
    if (data.status) {
      return <StatusPreview data={data} type="status" />;
    }

    // Members list preview
    if (data.members) {
      return <MembersPreview data={data} type="members" />;
    }

    // Message preview
    if (data.messageContent) {
      return <MessagePreview data={data} type="message" />;
    }

    // Default confirmation
    if (data.preview) {
      return <ConfirmationPreview data={data} type="confirmation" />;
    }

    return null;
  };

  // Get button labels from preview data or use defaults
  const confirmLabel = result.data?.preview?.confirmLabel || 'Confirm';
  const cancelLabel = result.data?.preview?.cancelLabel || 'Cancel';

  // Check if this is a destructive action
  const isDestructive = ['archive', 'kick', 'ban', 'leave'].includes(command.name);

  return (
    <div
      className={cn(
        'bg-popover border rounded-lg shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Preview Content */}
      <div className="p-4">{renderPreviewContent()}</div>

      {/* Warning for destructive actions */}
      {isDestructive && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              This action cannot be undone
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-muted/50 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
          <kbd className="ml-2 text-xs text-muted-foreground">Esc</kbd>
        </Button>
        <Button
          variant={isDestructive ? 'destructive' : 'default'}
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Executing...
            </>
          ) : (
            <>
              {confirmLabel}
              <kbd className="ml-2 text-xs opacity-70">Enter</kbd>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Preview (for inline display)
// ============================================================================

export interface CompactPreviewProps {
  /** Preview message */
  message: string;
  /** Whether the preview is for a destructive action */
  isDestructive?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

export function CompactPreview({
  message,
  isDestructive = false,
  onClick,
  className,
}: CompactPreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
        'transition-colors',
        isDestructive
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
        className
      )}
    >
      {isDestructive && <AlertTriangleIcon className="w-4 h-4" />}
      <span>{message}</span>
      <span className="text-xs opacity-70">Click to preview</span>
    </button>
  );
}

export default CommandPreview;
