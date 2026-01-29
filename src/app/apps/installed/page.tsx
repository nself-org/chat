'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InstalledApps } from '@/components/app-directory';

export default function InstalledAppsPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/apps"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App Directory
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Installed Apps</h1>
        <p className="text-muted-foreground mt-2">
          Manage the apps installed in your workspace
        </p>
      </div>

      {/* Installed Apps List */}
      <InstalledApps />
    </div>
  );
}
