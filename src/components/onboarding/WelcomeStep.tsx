'use client';

import { Sparkles, MessageSquare, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '@/lib/onboarding/onboarding-types';

interface WelcomeStepProps extends OnboardingStepProps {
  appName?: string;
  userName?: string;
}

export function WelcomeStep({
  onNext,
  appName = 'nchat',
  userName,
}: WelcomeStepProps) {
  const features = [
    {
      icon: MessageSquare,
      title: 'Team Messaging',
      description: 'Communicate with your team in real-time',
    },
    {
      icon: Users,
      title: 'Channels & Groups',
      description: 'Organize conversations by topic or team',
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Built for speed and always available',
    },
  ];

  return (
    <div className="flex flex-col items-center text-center px-4 py-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      {/* Welcome Text */}
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Welcome{userName ? `, ${userName}` : ''}!
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
        {`Let's get you set up with ${appName}. This will only take a few minutes.`}
      </p>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
          >
            <feature.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Time Estimate */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Estimated time: 2-3 minutes
      </p>

      {/* CTA Button */}
      <Button
        size="lg"
        onClick={onNext}
        className="min-w-[200px]"
      >
        Get Started
      </Button>
    </div>
  );
}
