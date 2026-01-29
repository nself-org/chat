'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CachedConversation {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  lastMessage?: string;
  timestamp?: number;
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedConversations, setCachedConversations] = useState<CachedConversation[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to home when back online
      window.location.href = '/';
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached conversations from localStorage/cache
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        // Try to get cached conversations from localStorage
        const cachedData = localStorage.getItem('nchat-cached-conversations');
        if (cachedData) {
          const conversations = JSON.parse(cachedData) as CachedConversation[];
          setCachedConversations(conversations.slice(0, 5)); // Show up to 5
        }
      } catch {
        // Ignore errors
      }
    };

    loadCachedData();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok) {
        window.location.href = '/';
        return;
      }
    } catch {
      // Still offline
    }

    // Also check navigator.onLine
    if (navigator.onLine) {
      window.location.href = '/';
      return;
    }

    setIsRetrying(false);
  };

  // If online, redirect
  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Reconnecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">nChat</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm">
            <WifiOff className="h-4 w-4" />
            Offline
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Offline illustration */}
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Cloud with X */}
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                <WifiOff className="h-16 w-16 text-zinc-400 dark:text-zinc-500" />
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-300 dark:bg-zinc-600 rounded-full opacity-60" />
              <div className="absolute -bottom-1 -left-3 w-6 h-6 bg-zinc-300 dark:bg-zinc-600 rounded-full opacity-40" />
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              You&apos;re offline
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              It looks like you&apos;ve lost your internet connection.
              Don&apos;t worry - your messages will be synced when you&apos;re back online.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Checking...' : 'Try again'}
              </Button>

              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to home
                </Button>
              </Link>
            </div>

            {retryCount >= 3 && (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Still having trouble? Try checking your Wi-Fi or mobile data connection.
              </p>
            )}
          </div>

          {/* Cached conversations */}
          {cachedConversations.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  Cached conversations
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  These conversations are available offline
                </p>
              </div>

              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {cachedConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={
                        conversation.type === 'channel'
                          ? `/chat/channels/${conversation.id}`
                          : `/chat/dm/${conversation.id}`
                      }
                      className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          conversation.type === 'channel'
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {conversation.type === 'channel' ? '#' : conversation.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                          {conversation.type === 'channel' ? `#${conversation.name}` : conversation.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                            {conversation.lastMessage}
                          </p>
                        )}
                      </div>

                      {conversation.timestamp && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatTimestamp(conversation.timestamp)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Tips while offline
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>- You can still read cached messages</li>
              <li>- New messages will be queued and sent when online</li>
              <li>- Some features may be limited</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>nChat works best with an internet connection</p>
        </div>
      </footer>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
