'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useAppConfig } from '@/contexts/app-config-context'
import {
  Hash,
  Plus,
  Search,
  Clock,
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface QuickActionProps {
  icon: React.ReactNode
  title: string
  description: string
  href?: string
  onClick?: () => void
}

interface RecentChannelProps {
  name: string
  slug: string
  lastMessage?: string
  lastMessageTime?: string
}

// ============================================================================
// Quick Action Card Component
// ============================================================================

function QuickAction({ icon, title, description, href, onClick }: QuickActionProps) {
  const content = (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        'bg-card hover:bg-accent/50'
      )}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium flex items-center gap-2">
            {title}
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return (
    <button onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}

// ============================================================================
// Recent Channel Item Component
// ============================================================================

function RecentChannelItem({
  name,
  slug,
  lastMessage,
  lastMessageTime,
}: RecentChannelProps) {
  return (
    <Link
      href={`/chat/channel/${slug}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'hover:bg-accent transition-colors'
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Hash className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{name}</span>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground shrink-0">
              {lastMessageTime}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
        )}
      </div>
    </Link>
  )
}

// ============================================================================
// Main Chat Page Component
// ============================================================================

export default function ChatPage() {
  const { user } = useAuth()
  const { config } = useAppConfig()

  // Mock recent activity data
  const recentChannels: RecentChannelProps[] = [
    {
      name: 'general',
      slug: 'general',
      lastMessage: 'Welcome to the team! Feel free to introduce yourself.',
      lastMessageTime: '2m ago',
    },
    {
      name: 'announcements',
      slug: 'announcements',
      lastMessage: 'New features have been deployed to production.',
      lastMessageTime: '1h ago',
    },
    {
      name: 'random',
      slug: 'random',
      lastMessage: 'Anyone up for lunch?',
      lastMessageTime: '3h ago',
    },
  ]

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {user?.displayName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome to {config?.branding?.appName || 'nchat'}. What would you like to do today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickAction
              icon={<Compass className="h-5 w-5" />}
              title="Browse Channels"
              description="Discover and join channels that interest you"
              href="/chat/channel/general"
            />
            <QuickAction
              icon={<Plus className="h-5 w-5" />}
              title="Create Channel"
              description="Start a new channel for your team"
              onClick={() => {
                // TODO: Open create channel modal
                console.log('Create channel')
              }}
            />
            <QuickAction
              icon={<MessageSquare className="h-5 w-5" />}
              title="Start a Conversation"
              description="Send a direct message to a teammate"
              onClick={() => {
                // TODO: Open DM modal
                console.log('Start DM')
              }}
            />
            <QuickAction
              icon={<Search className="h-5 w-5" />}
              title="Search Messages"
              description="Find messages, files, or conversations"
              onClick={() => {
                // TODO: Open search
                console.log('Open search')
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-2">
              {recentChannels.length > 0 ? (
                <div className="divide-y">
                  {recentChannels.map((channel) => (
                    <RecentChannelItem key={channel.slug} {...channel} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity yet. Start by joining a channel!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Stats (Placeholder) */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Team Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Members</CardDescription>
                <CardTitle className="text-2xl">8</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Channels</CardDescription>
                <CardTitle className="text-2xl">12</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Messages Today</CardDescription>
                <CardTitle className="text-2xl">47</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Getting Started Guide (for new users) */}
        {user?.role === 'owner' && !config?.setup?.completed && (
          <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Complete Your Setup
                </h3>
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t finished setting up your workspace. Complete the
                  setup wizard to customize your chat experience.
                </p>
                <Button asChild>
                  <Link href="/setup">Continue Setup</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
