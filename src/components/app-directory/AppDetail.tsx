'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Download,
  ExternalLink,
  Shield,
  Calendar,
  Globe,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppDirectoryStore, selectAppById } from '@/stores/app-directory-store';
import { AppIcon } from './AppCard';
import { AppInstallButton } from './AppInstallButton';
import { AppPermissions } from './AppPermissions';
import { AppScreenshots } from './AppScreenshots';
import { AppRatings } from './AppRatings';
import { getRelatedApps } from '@/lib/app-directory/app-search';
import { AppCard } from './AppCard';
import type { App } from '@/lib/app-directory/app-types';

interface AppDetailProps {
  app: App;
  className?: string;
}

export function AppDetail({ app, className }: AppDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const relatedApps = getRelatedApps(app.id, 4);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {/* Back Navigation */}
      <Link
        href="/apps"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to App Directory
      </Link>

      {/* App Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* App Info */}
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <AppIcon icon={app.icon} name={app.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{app.name}</h1>
                {app.verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
                {app.builtIn && (
                  <Badge variant="outline" className="text-xs">
                    Built-in
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">
                by{' '}
                {app.developer.website ? (
                  <a
                    href={app.developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {app.developer.name}
                  </a>
                ) : (
                  app.developer.name
                )}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {app.categories.map((category) => (
                  <Link key={category.id} href={`/apps?category=${category.id}`}>
                    <Badge variant="secondary">{category.name}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-4">
            {app.shortDescription}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{app.stats.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({formatNumber(app.stats.ratingCount)} ratings)
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-5 h-5" />
              <span>{formatNumber(app.stats.activeInstalls)} active installs</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>Updated {formatDate(app.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Install Card */}
        <Card className="lg:w-80 flex-shrink-0">
          <CardContent className="p-6">
            <AppInstallButton app={app} className="w-full mb-4" />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{app.currentVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pricing</span>
                <span className="capitalize">{app.pricing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{app.type}</span>
              </div>
            </div>

            {/* Links */}
            {(app.links.website || app.links.documentation || app.links.support) && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-col gap-2">
                  {app.links.website && (
                    <a
                      href={app.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                  {app.links.documentation && (
                    <a
                      href={app.links.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <FileText className="w-4 h-4" />
                      Documentation
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                  {app.links.support && (
                    <a
                      href={app.links.support}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Support
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Screenshots */}
      {app.screenshots.length > 0 && (
        <AppScreenshots screenshots={app.screenshots} appName={app.name} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="w-4 h-4 mr-1" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({formatNumber(app.stats.reviewCount)})
          </TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-4">About this app</h2>
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {app.longDescription}
                </div>
              </div>

              {/* Features */}
              {app.features.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Features</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {app.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>

              {/* Developer Info */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Developer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {app.developer.avatarUrl ? (
                      <img
                        src={app.developer.avatarUrl}
                        alt={app.developer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {app.developer.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{app.developer.name}</p>
                    {app.developer.verified && (
                      <p className="text-xs text-muted-foreground">Verified Developer</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <AppPermissions permissions={app.permissions} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <AppRatings appId={app.id} stats={app.stats} />
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Version History</h2>
            {app.versions.map((version, index) => (
              <Card key={version.version}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Version {version.version}
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(version.releaseDate)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{version.changelog}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Apps */}
      {relatedApps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Related Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedApps.map((relatedApp) => (
              <AppCard key={relatedApp.id} app={relatedApp} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
