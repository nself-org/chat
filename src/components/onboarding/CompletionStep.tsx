'use client';

import { CheckCircle, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface CompletionStepProps {
  onComplete: () => void;
  userName?: string;
  appName?: string;
  channelsJoined?: number;
  invitationsSent?: number;
}

export function CompletionStep({
  onComplete,
  userName,
  appName = 'nchat',
  channelsJoined = 0,
  invitationsSent = 0,
}: CompletionStepProps) {
  // Fire confetti on mount
  useEffect(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire confetti from both sides
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ['#38BDF8', '#0EA5E9', '#0284C7', '#7C3AED', '#EC4899'],
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#38BDF8', '#0EA5E9', '#0284C7', '#7C3AED', '#EC4899'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const achievements = [
    channelsJoined > 0 && {
      icon: '📢',
      text: `Joined ${channelsJoined} channel${channelsJoined !== 1 ? 's' : ''}`,
    },
    invitationsSent > 0 && {
      icon: '✉️',
      text: `Invited ${invitationsSent} teammate${invitationsSent !== 1 ? 's' : ''}`,
    },
    { icon: '✅', text: 'Profile set up' },
    { icon: '🔔', text: 'Notifications configured' },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div className="flex flex-col items-center text-center px-4 py-8">
      {/* Success Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-900" />
        </div>
      </div>

      {/* Congratulations */}
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        You're All Set{userName ? `, ${userName}` : ''}!
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
        Welcome to {appName}. Your team communication hub is ready to go.
      </p>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="w-full max-w-sm mb-8">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            What you've done
          </h3>
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
              >
                <span className="text-xl">{achievement.icon}</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {achievement.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="w-full max-w-sm mb-8">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          Quick tips to get started
        </h3>
        <div className="space-y-2 text-left">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Say hello in #general
              </p>
              <p className="text-xs text-zinc-500">
                Introduce yourself to the team
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <span className="text-lg flex-shrink-0">⌨️</span>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Press ? for shortcuts
              </p>
              <p className="text-xs text-zinc-500">
                Learn keyboard shortcuts to work faster
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <span className="text-lg flex-shrink-0">🔍</span>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Use Cmd/Ctrl+K to search
              </p>
              <p className="text-xs text-zinc-500">
                Find channels, people, and messages instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button size="lg" onClick={onComplete} className="min-w-[200px]">
        Go to {appName}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <p className="text-xs text-zinc-500 mt-4">
        You can always access settings to customize your experience
      </p>
    </div>
  );
}
