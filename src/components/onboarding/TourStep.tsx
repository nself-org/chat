'use client';

import { Map, Play, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '@/lib/onboarding/onboarding-types';
import { tourStops } from '@/lib/onboarding/tour-manager';

interface TourStepProps extends OnboardingStepProps {
  onStartTour?: () => void;
}

export function TourStep({
  onNext,
  onPrev,
  onSkip,
  isFirst,
  canSkip,
  onStartTour,
}: TourStepProps) {
  const handleStartTour = () => {
    onStartTour?.();
    onNext();
  };

  const handleSkipTour = () => {
    onSkip?.();
  };

  return (
    <div className="flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
          <Map className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Take a Quick Tour
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Learn how to get the most out of nchat with an interactive walkthrough.
        </p>
      </div>

      {/* Tour Preview */}
      <div className="max-w-lg mx-auto w-full mb-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              About 2 minutes
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tourStops.slice(0, 4).map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-zinc-800/50"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {index + 1}
                </div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                  {stop.title}
                </span>
              </div>
            ))}
          </div>

          {tourStops.length > 4 && (
            <p className="text-center text-sm text-zinc-500 mt-3">
              +{tourStops.length - 4} more stops
            </p>
          )}
        </div>

        {/* What you'll learn */}
        <div className="space-y-3">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            What you'll learn:
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Navigate between channels and direct messages
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Send messages, reactions, and start threads
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Search for messages and files
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Use keyboard shortcuts like a pro
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto w-full text-center">
        <Button size="lg" onClick={handleStartTour} className="min-w-[200px]">
          <Play className="w-4 h-4 mr-2" />
          Start Tour
        </Button>
        <p className="text-xs text-zinc-500 mt-3">
          You can always restart the tour from Settings
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
        <div>
          {!isFirst && (
            <Button variant="ghost" onClick={onPrev}>
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canSkip && (
            <Button variant="ghost" onClick={handleSkipTour}>
              Skip Tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
