'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { TourStop } from '@/lib/onboarding/onboarding-types';
import {
  getElementPosition,
  calculateTooltipPosition,
  scrollToElement,
  type TooltipPosition,
} from '@/lib/onboarding/tour-manager';
import { TourStepIndicator } from './TourStepIndicator';
import { TourNavigation } from './TourNavigation';

interface TourTooltipProps {
  stop: TourStop;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  totalStops: number;
}

export function TourTooltip({
  stop,
  onNext,
  onPrev,
  onSkip,
  hasNext,
  hasPrev,
  currentIndex,
  totalStops,
}: TourTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll element into view
    if (stop.placement !== 'center') {
      scrollToElement(stop.targetSelector);
    }

    // Calculate position after a short delay for scroll
    const timer = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [stop]);

  const updatePosition = () => {
    if (stop.placement === 'center') {
      // Center in viewport
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 160,
        arrowPosition: 'top',
      });
      return;
    }

    const targetPosition = getElementPosition(stop.targetSelector);
    if (!targetPosition) {
      // Fallback to center if target not found
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 160,
        arrowPosition: 'top',
      });
      return;
    }

    const pos = calculateTooltipPosition(
      targetPosition,
      stop.placement,
      320,
      200,
      16 + (stop.spotlightPadding ?? 0)
    );
    setPosition(pos);
  };

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [stop]);

  if (!position) return null;

  const arrowClasses = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-zinc-800',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-zinc-800',
    left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-white dark:border-r-zinc-800',
    right: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-white dark:border-l-zinc-800',
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[10001] w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-0 h-0 border-[8px]',
          arrowClasses[position.arrowPosition]
        )}
      />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {stop.title}
          </h3>
          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
            {currentIndex + 1}/{totalStops}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          {stop.description}
        </p>

        {/* Media */}
        {stop.media && (
          <div className="mb-4 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700">
            {stop.media.type === 'image' && (
              <img
                src={stop.media.url}
                alt={stop.media.alt || stop.title}
                className="w-full h-auto"
              />
            )}
            {stop.media.type === 'gif' && (
              <img
                src={stop.media.url}
                alt={stop.media.alt || stop.title}
                className="w-full h-auto"
              />
            )}
            {stop.media.type === 'video' && (
              <video
                src={stop.media.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            )}
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-4">
          <TourStepIndicator
            currentStep={currentIndex}
            totalSteps={totalStops}
          />
        </div>

        {/* Navigation */}
        <TourNavigation
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          hasNext={hasNext}
          hasPrev={hasPrev}
          isLastStep={!hasNext}
        />
      </div>
    </div>
  );
}
