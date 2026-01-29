'use client';

import { useState, useCallback } from 'react';
import { X, ExternalLink, Sparkles, Zap, Bug, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WhatsNewItem } from '@/lib/onboarding/onboarding-types';
import { whatsNewItems, getUnseenWhatsNewItems } from '@/lib/onboarding/feature-discovery';
import { useOnboardingStore } from '@/stores/onboarding-store';

interface WhatsNewModalProps {
  items?: WhatsNewItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onDismiss?: (days?: number) => void;
}

export function WhatsNewModal({
  items: externalItems,
  open: externalOpen,
  onOpenChange,
  onClose,
  onDismiss,
}: WhatsNewModalProps) {
  const {
    whatsNew,
    whatsNewModalOpen,
    seeWhatsNewItem,
    seeAllWhatsNew,
    dismissWhatsNewModal,
    closeWhatsNewModal,
  } = useOnboardingStore();

  const open = externalOpen ?? whatsNewModalOpen;
  const items = externalItems ?? getUnseenWhatsNewItems(whatsNew);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen);
      } else if (!newOpen) {
        closeWhatsNewModal();
        onClose?.();
      }
    },
    [onOpenChange, closeWhatsNewModal, onClose]
  );

  const handleGotIt = useCallback(() => {
    seeAllWhatsNew();
    handleOpenChange(false);
    onClose?.();
  }, [seeAllWhatsNew, handleOpenChange, onClose]);

  const handleDismiss = useCallback(
    (days?: number) => {
      dismissWhatsNewModal(days);
      onDismiss?.(days);
    },
    [dismissWhatsNewModal, onDismiss]
  );

  const handleItemClick = useCallback(
    (item: WhatsNewItem) => {
      seeWhatsNewItem(item.id);
      if (item.learnMoreUrl) {
        window.open(item.learnMoreUrl, '_blank');
      }
    },
    [seeWhatsNewItem]
  );

  const getCategoryIcon = (category: WhatsNewItem['category']) => {
    switch (category) {
      case 'feature':
        return <Sparkles className="w-4 h-4" />;
      case 'improvement':
        return <Zap className="w-4 h-4" />;
      case 'fix':
        return <Bug className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: WhatsNewItem['category']) => {
    switch (category) {
      case 'feature':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'improvement':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'fix':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's New
          </DialogTitle>
        </DialogHeader>

        {/* Items List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-lg border border-zinc-200 dark:border-zinc-700',
                'hover:border-primary/50 transition-colors',
                item.learnMoreUrl && 'cursor-pointer'
              )}
              onClick={() => handleItemClick(item)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn('capitalize', getCategoryColor(item.category))}
                  >
                    {getCategoryIcon(item.category)}
                    <span className="ml-1">{item.category}</span>
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {formatDate(item.releaseDate)}
                  </span>
                </div>

                {item.learnMoreUrl && (
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>

              {item.learnMoreUrl && (
                <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary font-medium">
                  Learn more
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => handleDismiss(7)}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Remind me later
          </button>

          <Button onClick={handleGotIt}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
