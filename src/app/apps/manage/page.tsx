'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppIcon } from '@/components/app-directory';
import { getAllApps } from '@/lib/app-directory/app-registry';
import type { App } from '@/lib/app-directory/app-types';

export default function ManageAppsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const allApps = getAllApps();

  // Filter apps
  const filteredApps = allApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: allApps.length,
    active: allApps.filter((a) => a.status === 'active').length,
    pending: allApps.filter((a) => a.status === 'pending').length,
    deprecated: allApps.filter((a) => a.status === 'deprecated').length,
    totalInstalls: allApps.reduce((sum, a) => sum + a.stats.installs, 0),
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/apps"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App Directory
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Apps</h1>
            <p className="text-muted-foreground mt-2">
              Admin controls for the app marketplace
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add App
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deprecated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.deprecated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Installs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{formatNumber(stats.totalInstalls)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">All Apps</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apps Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Installs</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map((app) => (
                  <AppTableRow key={app.id} app={app} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No apps pending review</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Apps</CardTitle>
              <CardDescription>
                Select apps to feature in the App Directory homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allApps
                  .filter((a) => a.featured)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <AppIcon icon={app.icon} name={app.name} size="md" />
                      <div className="flex-1">
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(app.stats.activeInstalls)} active installs
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require App Review</p>
                    <p className="text-sm text-muted-foreground">
                      All new apps must be reviewed before publishing
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Third-Party Apps</p>
                    <p className="text-sm text-muted-foreground">
                      Enable users to install non-verified apps
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <CardTitle>Permission Defaults</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-approve Low-Risk Permissions</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically grant basic permissions
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Admin Approval for Admin Access</p>
                    <p className="text-sm text-muted-foreground">
                      Apps requesting admin permissions need approval
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppTableRow({ app }: { app: App }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    deprecated: 'bg-red-100 text-red-700',
    disabled: 'bg-gray-100 text-gray-700',
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <AppIcon icon={app.icon} name={app.name} size="sm" />
          <div>
            <Link
              href={`/apps/${app.slug}`}
              className="font-medium hover:underline"
            >
              {app.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              by {app.developer.name}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {app.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn('capitalize', statusColors[app.status])}>
          {app.status}
        </Badge>
      </TableCell>
      <TableCell>{formatNumber(app.stats.activeInstalls)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          {app.stats.rating.toFixed(1)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/apps/${app.slug}`}>
            <Settings className="w-4 h-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
