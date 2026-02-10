/**
 * Admin Moderation Page (v0.7.0)
 * AI-Powered Content Moderation Dashboard
 */

'use client'

import { useState } from 'react'
import { Shield, BarChart3, Settings, ListChecks } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModerationDashboard } from '@/components/admin/moderation/ModerationDashboard'
import { ModerationQueue } from '@/components/admin/moderation/ModerationQueue'
import { ModerationSettings } from '@/components/admin/moderation/ModerationSettings'
import { useAdminAccess } from '@/lib/admin/use-admin'

export default function ModerationPage() {
  const { canModerate } = useAdminAccess()

  if (!canModerate) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access the moderation tools.
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Content Moderation</h1>
              <p className="text-muted-foreground">
                AI-powered moderation system with advanced detection and analytics
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:inline-grid lg:w-auto">
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="queue">
              <ListChecks className="mr-2 h-4 w-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ModerationDashboard />
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <ModerationQueue />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ModerationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
