'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { AppSettings } from '@/components/app-directory';
import { getAppBySlug, getAppById } from '@/lib/app-directory/app-registry';
import { useAppDirectoryStore } from '@/stores/app-directory-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { App, AppInstallation } from '@/lib/app-directory/app-types';

export default function AppSettingsPage() {
  const params = useParams();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  const { isAppInstalled, getInstallation } = useAppDirectoryStore();

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
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="container max-w-5xl mx-auto py-16 px-4 text-center">
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

  // Check if the app is installed
  const installed = isAppInstalled(app.id);
  const installation = getInstallation(app.id);

  if (!installed || !installation) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Link
          href="/apps/installed"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Installed Apps
        </Link>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">App Not Installed</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            You need to install {app.name} before you can configure its settings.
          </p>
          <Button asChild>
            <Link href={`/apps/${app.slug}`}>View App Details</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <AppSettings app={app} installation={installation} />
    </div>
  );
}
