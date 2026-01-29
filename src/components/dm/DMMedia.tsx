'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  Play,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { DirectMessage, DMMediaItem } from '@/lib/dm/dm-types';
import { useDMStore, selectMediaItems } from '@/stores/dm-store';

// ============================================================================
// Types
// ============================================================================

interface DMMediaProps {
  dm: DirectMessage;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DMMedia({ dm, className }: DMMediaProps) {
  const mediaItems = useDMStore(selectMediaItems(dm.id));
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const selectedItem = selectedIndex !== null ? mediaItems[selectedIndex] : null;

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < mediaItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDownload = (item: DMMediaItem) => {
    window.open(item.url, '_blank');
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-3 gap-1', className)}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-sm">No media</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Photos and videos shared in this conversation will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          Media ({mediaItems.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-3 gap-1">
          {mediaItems.map((item, index) => (
            <MediaThumbnail
              key={item.id}
              item={item}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Lightbox */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
      >
        <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-white text-sm">
                {selectedIndex !== null && (
                  <span>
                    {selectedIndex + 1} of {mediaItems.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedItem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleDownload(selectedItem)}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedIndex(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
              {selectedItem && (
                <>
                  {selectedItem.type === 'video' ? (
                    <video
                      src={selectedItem.url}
                      controls
                      autoPlay
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <img
                      src={selectedItem.url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </>
              )}
            </div>

            {/* Navigation */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-white bg-black/50 hover:bg-black/70"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {selectedIndex !== null && selectedIndex < mediaItems.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-white bg-black/50 hover:bg-black/70"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Footer with info */}
            {selectedItem && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="text-white text-sm">
                  <p className="font-medium">{selectedItem.user.displayName}</p>
                  <p className="text-white/70 text-xs">
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Media Thumbnail Component
// ============================================================================

interface MediaThumbnailProps {
  item: DMMediaItem;
  onClick: () => void;
}

function MediaThumbnail({ item, onClick }: MediaThumbnailProps) {
  const isVideo = item.type === 'video';

  return (
    <button
      className="relative aspect-square w-full overflow-hidden rounded-sm group"
      onClick={onClick}
    >
      <img
        src={item.thumbnailUrl || item.url}
        alt=""
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      {/* Video indicator */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
      {/* Duration badge for videos */}
      {isVideo && item.duration && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
          {formatDuration(item.duration)}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
    </button>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

DMMedia.displayName = 'DMMedia';
