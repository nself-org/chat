'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  File,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Download,
  ExternalLink,
  MoreVertical,
  Folder,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DirectMessage, DMSharedFile } from '@/lib/dm/dm-types';
import { useDMStore, selectSharedFiles } from '@/stores/dm-store';

// ============================================================================
// Types
// ============================================================================

interface DMSharedFilesProps {
  dm: DirectMessage;
  onFileClick?: (file: DMSharedFile) => void;
  className?: string;
}

// ============================================================================
// File Type Helpers
// ============================================================================

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf') || fileType.includes('document')) {
    return FileText;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
    return FileSpreadsheet;
  }
  if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('json')) {
    return FileCode;
  }
  if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('compressed')) {
    return FileArchive;
  }
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Component
// ============================================================================

export function DMSharedFiles({
  dm,
  onFileClick,
  className,
}: DMSharedFilesProps) {
  const sharedFiles = useDMStore(selectSharedFiles(dm.id));
  const [isLoading, setIsLoading] = React.useState(false);

  // Group files by date
  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, DMSharedFile[]> = {};

    sharedFiles.forEach((file) => {
      const date = new Date(file.sharedAt);
      const key = date.toDateString();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });

    return Object.entries(groups)
      .map(([date, files]) => ({
        date,
        label: formatDate(files[0].sharedAt),
        files,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sharedFiles]);

  const handleDownload = (file: DMSharedFile) => {
    // Open file URL in new tab to trigger download
    window.open(file.attachment.fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (sharedFiles.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-sm">No shared files</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Files shared in this conversation will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <File className="h-4 w-4" />
          Shared Files ({sharedFiles.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {groupedFiles.map((group) => (
            <div key={group.date} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground px-1">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onClick={() => onFileClick?.(file)}
                    onDownload={() => handleDownload(file)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// File Item Component
// ============================================================================

interface FileItemProps {
  file: DMSharedFile;
  onClick?: () => void;
  onDownload: () => void;
}

function FileItem({ file, onClick, onDownload }: FileItemProps) {
  const { attachment, user } = file;
  const FileIcon = getFileIcon(attachment.fileType);

  return (
    <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
      {/* File Icon */}
      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-muted flex items-center justify-center">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p className="font-medium text-sm truncate">{attachment.fileName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(attachment.fileSize)}</span>
          <span>-</span>
          <span>by {user.displayName}</span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClick}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

DMSharedFiles.displayName = 'DMSharedFiles';
