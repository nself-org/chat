'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeatureTip, FeatureId } from '@/lib/onboarding/onboarding-types';
import { getElementPosition, type ElementPosition } from '@/lib/onboarding/tour-manager';

interface FeatureSpotlightProps {
  tip: FeatureTip;
  onDismiss: () => void;
  onLearnMore?: () => void;
}

export function FeatureSpotlight({
  tip,
  onDismiss,
  onLearnMore,
}: FeatureSpotlightProps) {
  const [position, setPosition] = useState<ElementPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (tip.targetSelector) {
      const pos = getElementPosition(tip.targetSelector);
      setPosition(pos);
    }

    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [tip.targetSelector]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  // Calculate spotlight position
  const spotlightStyle = position
    ? {
        top: position.top - 8,
        left: position.left - 8,
        width: position.width + 16,
        height: position.height + 16,
      }
    : {};

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!position) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const padding = 16;

    switch (tip.placement) {
      case 'top':
        return {
          bottom: window.innerHeight - position.top + padding,
          left: position.left + position.width / 2 - tooltipWidth / 2,
        };
      case 'bottom':
        return {
          top: position.top + position.height + padding,
          left: position.left + position.width / 2 - tooltipWidth / 2,
        };
      case 'left':
        return {
          top: position.top + position.height / 2 - tooltipHeight / 2,
          right: window.innerWidth - position.left + padding,
        };
      case 'right':
      default:
        return {
          top: position.top + position.height / 2 - tooltipHeight / 2,
          left: position.left + position.width + padding,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleDismiss}
      />

      {/* Spotlight cutout */}
      {position && (
        <div
          className={cn(
            'absolute rounded-lg transition-all duration-300',
            'ring-4 ring-primary/50 ring-offset-4 ring-offset-transparent',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
          style={{
            ...spotlightStyle,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          'fixed w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700',
          'transition-all duration-300 ease-out',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        <div className="p-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {tip.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {tip.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Got it
            </Button>

            {onLearnMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onLearnMore();
                  handleDismiss();
                }}
              >
                Learn more
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
