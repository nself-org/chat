/**
 * Enhanced Bot Management Page (v0.7.0)
 *
 * Comprehensive bot administration with editor, analytics, logs,
 * templates, testing, and configuration.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Code,
  BarChart3,
  FileText,
  Sparkles,
  Bug,
  Settings,
  List,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BotManager,
  BotEditor,
  BotAnalytics,
  BotLogsViewer,
  BotTemplates,
  BotTestSandbox,
  BotConfig,
} from '@/components/admin/bots'
import { useBots } from '@/lib/bots/use-bots'
import { useFeature } from '@/lib/features/hooks/use-feature'
import { FEATURES } from '@/lib/features/feature-flags'
import type { Bot } from '@/types/bot'

type ViewMode =
  | 'list'
  | 'editor'
  | 'analytics'
  | 'logs'
  | 'templates'
  | 'test'
  | 'config'

// Mock channels
const mockChannels = [
  { id: 'ch-1', name: 'general' },
  { id: 'ch-2', name: 'random' },
  { id: 'ch-3', name: 'engineering' },
  { id: 'ch-4', name: 'design' },
  { id: 'ch-5', name: 'product' },
]

export default function BotManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { enabled: botsEnabled } = useFeature(FEATURES.BOTS)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [editingBot, setEditingBot] = useState<Bot | null>(null)

  // Use bots hook
  const {
    installedBots,
    isLoading,
    error,
    refreshBots,
  } = useBots({
    autoFetch: true,
    useMockData: process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true',
  })

  // Convert bot installations to bot list
  const bots: Bot[] = installedBots.map((installation) => ({
    id: installation.botId,
    username: installation.bot?.name || 'unknown',
    displayName: installation.bot?.name || 'Unknown Bot',
    description: installation.bot?.description || '',
    avatarUrl: installation.bot?.avatarUrl,
    category: (installation.bot as any)?.category || 'utility',
    visibility: 'public' as const,
    status: installation.bot?.status || 'offline',
    permissions: {
      scopes: installation.permissions || [],
    },
    commands: [],
    ownerId: installation.installedBy,
    isVerified: false,
    isFeatured: false,
    installCount: 0,
    createdAt: new Date(installation.installedAt),
    updatedAt: new Date(installation.installedAt),
  }))

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || !['owner', 'admin'].includes(user.role))) {
      router.push('/chat')
    }
  }, [user, authLoading, router])

  // Handlers
  const handleCreateBot = () => {
    setEditingBot(null)
    setViewMode('editor')
  }

  const handleEditBot = (bot: Bot) => {
    setEditingBot(bot)
    setViewMode('editor')
  }

  const handleDeleteBot = async (bot: Bot) => {
    if (confirm(`Are you sure you want to delete ${bot.displayName}?`)) {
      // Implement delete logic
      await refreshBots()
    }
  }

  const handleToggleStatus = async (bot: Bot) => {
    // Implement toggle status logic
    console.log('Toggle status:', bot)
  }

  const handleViewAnalytics = (bot: Bot) => {
    setSelectedBot(bot)
    setViewMode('analytics')
  }

  const handleViewLogs = (bot: Bot) => {
    setSelectedBot(bot)
    setViewMode('logs')
  }

  const handleSaveBot = async (botData: Partial<Bot>) => {
    console.log('Saving bot:', botData)
    // Implement save logic
    setViewMode('list')
    await refreshBots()
  }

  const handleInstallTemplate = (template: any) => {
    console.log('Installing template:', template)
    // Pre-populate editor with template
    setEditingBot({
      ...template,
      id: `bot-${Date.now()}`,
    } as Bot)
    setViewMode('editor')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedBot(null)
    setEditingBot(null)
  }

  // Loading state
  if (authLoading || !user || !['owner', 'admin'].includes(user.role)) {
    return null
  }

  // Feature disabled
  if (!botsEnabled) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Code className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Bots feature is disabled</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Enable the bots feature in settings to access bot management.
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {viewMode !== 'list' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h1 className="text-3xl font-bold">Bot Management</h1>
            </div>
            <p className="text-muted-foreground">
              {viewMode === 'list' &&
                'Manage and monitor your workspace bots'}
              {viewMode === 'editor' &&
                (editingBot ? 'Edit bot' : 'Create new bot')}
              {viewMode === 'analytics' &&
                `Analytics for ${selectedBot?.displayName}`}
              {viewMode === 'logs' &&
                `Logs for ${selectedBot?.displayName}`}
              {viewMode === 'templates' && 'Browse bot templates'}
              {viewMode === 'test' &&
                `Test ${selectedBot?.displayName || 'bot'}`}
              {viewMode === 'config' &&
                `Configure ${selectedBot?.displayName}`}
            </p>
          </div>

          {viewMode === 'list' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewMode('templates')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button onClick={handleCreateBot}>
                <Plus className="mr-2 h-4 w-4" />
                Create Bot
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {viewMode === 'list' && (
            <Tabs defaultValue="manager" className="space-y-4">
              <TabsList>
                <TabsTrigger value="manager">
                  <List className="mr-2 h-4 w-4" />
                  Bot Manager
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manager">
                <BotManager
                  bots={bots}
                  loading={isLoading}
                  onEdit={handleEditBot}
                  onDelete={handleDeleteBot}
                  onToggleStatus={handleToggleStatus}
                  onViewLogs={handleViewLogs}
                  onViewAnalytics={handleViewAnalytics}
                  onRefresh={refreshBots}
                />
              </TabsContent>

              <TabsContent value="templates">
                <BotTemplates
                  onInstall={handleInstallTemplate}
                  onPreview={(template) => console.log('Preview:', template)}
                />
              </TabsContent>
            </Tabs>
          )}

          {viewMode === 'editor' && (
            <Tabs defaultValue="code" className="space-y-4">
              <TabsList>
                <TabsTrigger value="code">
                  <Code className="mr-2 h-4 w-4" />
                  Code Editor
                </TabsTrigger>
                {editingBot && (
                  <>
                    <TabsTrigger value="config">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuration
                    </TabsTrigger>
                    <TabsTrigger value="test">
                      <Bug className="mr-2 h-4 w-4" />
                      Test
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="code">
                <BotEditor
                  bot={editingBot || undefined}
                  onSave={handleSaveBot}
                  onTest={async (code) => {
                    console.log('Testing code:', code)
                  }}
                  onDeploy={async (code) => {
                    console.log('Deploying code:', code)
                    await handleSaveBot({ webhookUrl: code })
                  }}
                />
              </TabsContent>

              {editingBot && (
                <>
                  <TabsContent value="config">
                    <BotConfig
                      bot={editingBot}
                      channels={mockChannels}
                      onSave={async (config) => {
                        console.log('Saving config:', config)
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="test">
                    <BotTestSandbox
                      botId={editingBot.id}
                      botName={editingBot.displayName}
                      botCode={editingBot.webhookUrl}
                      onTest={async (event) => {
                        console.log('Testing event:', event)
                        return {
                          success: true,
                          response: {
                            type: 'message',
                            content: 'Test response',
                          },
                          executionTime: 145,
                          logs: ['[INFO] Test executed successfully'],
                        }
                      }}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          )}

          {viewMode === 'analytics' && selectedBot && (
            <BotAnalytics
              botId={selectedBot.id}
              botName={selectedBot.displayName}
              period="week"
              onPeriodChange={(period) => console.log('Period changed:', period)}
            />
          )}

          {viewMode === 'logs' && selectedBot && (
            <BotLogsViewer
              botId={selectedBot.id}
              botName={selectedBot.displayName}
              streaming={false}
              onToggleStreaming={() => console.log('Toggle streaming')}
              onClearLogs={() => console.log('Clear logs')}
              onDownloadLogs={() => console.log('Download logs')}
              onRefresh={() => console.log('Refresh logs')}
            />
          )}

          {viewMode === 'templates' && (
            <BotTemplates
              onInstall={handleInstallTemplate}
              onPreview={(template) => console.log('Preview:', template)}
            />
          )}

          {viewMode === 'test' && selectedBot && (
            <BotTestSandbox
              botId={selectedBot.id}
              botName={selectedBot.displayName}
              botCode={selectedBot.webhookUrl}
              onTest={async (event) => {
                console.log('Testing event:', event)
                return {
                  success: true,
                  response: {
                    type: 'message',
                    content: 'Test response',
                  },
                  executionTime: 145,
                  logs: ['[INFO] Test executed successfully'],
                }
              }}
            />
          )}

          {viewMode === 'config' && selectedBot && (
            <BotConfig
              bot={selectedBot}
              channels={mockChannels}
              onSave={async (config) => {
                console.log('Saving config:', config)
              }}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
