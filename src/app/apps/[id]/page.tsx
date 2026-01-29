'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppDetail } from '@/components/app-directory';
import { getAppBySlug, getAppById } from '@/lib/app-directory/app-registry';
import { Skeleton } from '@/components/ui/skeleton';
import type { App } from '@/lib/app-directory/app-types';

export default function AppDetailPage() {
  const params = useParams();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;

    // Try to find app by slug first, then by ID
    const foundApp = getAppBySlug(id) || getAppById(id);

    if (foundApp) {
      setApp(foundApp);
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="w-80 h-60 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">App Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The app you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <a
          href="/apps"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Browse Apps
        </a>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <AppDetail app={app} />
    </div>
  );
}
