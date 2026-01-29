'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { AppScreenshot } from '@/lib/app-directory/app-types';

interface AppScreenshotsProps {
  screenshots: AppScreenshot[];
  appName: string;
  className?: string;
}

export function AppScreenshots({
  screenshots,
  appName,
  className,
}: AppScreenshotsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sortedScreenshots = [...screenshots].sort((a, b) => a.order - b.order);

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : sortedScreenshots.length - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex < sortedScreenshots.length - 1 ? selectedIndex + 1 : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setSelectedIndex(null);
    }
  };

  if (sortedScreenshots.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="font-semibold">Screenshots</h3>

      {/* Thumbnail Gallery */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-3">
          {sortedScreenshots.map((screenshot, index) => (
            <button
              key={screenshot.id}
              className="relative flex-shrink-0 group overflow-hidden rounded-lg border bg-muted"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={screenshot.url}
                alt={screenshot.caption || `${appName} screenshot ${index + 1}`}
                className="h-40 w-auto object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Show placeholder on error
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23e5e7eb" width="200" height="150"/><text fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Screenshot</text></svg>';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent
          className="max-w-5xl p-0 bg-black/95 border-0"
          onKeyDown={handleKeyDown}
        >
          <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </DialogClose>

          {selectedIndex !== null && (
            <div className="relative flex items-center justify-center min-h-[60vh] p-8">
              {/* Previous Button */}
              {sortedScreenshots.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              {/* Image */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src={sortedScreenshots[selectedIndex].url}
                  alt={sortedScreenshots[selectedIndex].caption || `${appName} screenshot`}
                  className="max-h-[70vh] max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%23374151" width="600" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">Screenshot unavailable</text></svg>';
                  }}
                />
                {sortedScreenshots[selectedIndex].caption && (
                  <p className="text-white/80 text-center max-w-2xl">
                    {sortedScreenshots[selectedIndex].caption}
                  </p>
                )}
              </div>

              {/* Next Button */}
              {sortedScreenshots.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}

              {/* Pagination Dots */}
              {sortedScreenshots.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {sortedScreenshots.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === selectedIndex ? 'bg-white' : 'bg-white/40'
                      )}
                      onClick={() => setSelectedIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact screenshot preview for cards
interface ScreenshotPreviewProps {
  screenshots: AppScreenshot[];
  appName: string;
  className?: string;
}

export function ScreenshotPreview({
  screenshots,
  appName,
  className,
}: ScreenshotPreviewProps) {
  if (screenshots.length === 0) return null;

  const firstScreenshot = screenshots[0];

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-muted', className)}>
      <img
        src={firstScreenshot.url}
        alt={firstScreenshot.caption || `${appName} preview`}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      {screenshots.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          +{screenshots.length - 1} more
        </div>
      )}
    </div>
  );
}
