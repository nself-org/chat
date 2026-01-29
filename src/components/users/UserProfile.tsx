'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type ExtendedUserProfile } from './UserCard'
import { UserProfileHeader } from './UserProfileHeader'
import { UserProfileAbout } from './UserProfileAbout'
import { UserProfileActivity } from './UserProfileActivity'
import { UserProfileChannels } from './UserProfileChannels'
import { UserProfileFiles } from './UserProfileFiles'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Activity, Hash, FileText } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface Channel {
  id: string
  name: string
  description?: string
  isPrivate?: boolean
  memberCount?: number
}

export interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
  url: string
}

export interface ActivityItem {
  id: string
  type: 'message' | 'reaction' | 'file' | 'channel_join' | 'status_change'
  description: string
  timestamp: Date
  channelName?: string
  channelId?: string
}

export interface UserProfileProps extends React.HTMLAttributes<HTMLDivElement> {
  user: ExtendedUserProfile | null
  isLoading?: boolean
  isOwnProfile?: boolean
  sharedChannels?: Channel[]
  sharedFiles?: SharedFile[]
  recentActivity?: ActivityItem[]
  onMessage?: () => void
  onCall?: () => void
  onBlock?: () => void
  onReport?: () => void
  onEditProfile?: () => void
  onChannelClick?: (channel: Channel) => void
  onFileClick?: (file: SharedFile) => void
}

// ============================================================================
// Component
// ============================================================================

const UserProfile = React.forwardRef<HTMLDivElement, UserProfileProps>(
  (
    {
      className,
      user,
      isLoading = false,
      isOwnProfile = false,
      sharedChannels = [],
      sharedFiles = [],
      recentActivity = [],
      onMessage,
      onCall,
      onBlock,
      onReport,
      onEditProfile,
      onChannelClick,
      onFileClick,
      ...props
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState('about')

    if (isLoading) {
      return (
        <div ref={ref} className={cn('flex flex-col h-full', className)} {...props}>
          {/* Header skeleton */}
          <div className="relative">
            <Skeleton className="h-32 w-full" />
            <div className="px-6 pb-4 -mt-12">
              <div className="flex items-end gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 pb-2">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
          {/* Content skeleton */}
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )
    }

    if (!user) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex flex-col items-center justify-center h-full text-center p-6',
            className
          )}
          {...props}
        >
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">User not found</h3>
          <p className="text-sm text-muted-foreground">
            The user you are looking for does not exist or has been removed.
          </p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)} {...props}>
        {/* Profile header */}
        <UserProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          onMessage={onMessage}
          onCall={onCall}
          onBlock={onBlock}
          onReport={onReport}
          onEditProfile={onEditProfile}
        />

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-6">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger
                value="about"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <User className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              {!isOwnProfile && sharedChannels.length > 0 && (
                <TabsTrigger
                  value="channels"
                  className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Channels ({sharedChannels.length})
                </TabsTrigger>
              )}
              {!isOwnProfile && sharedFiles.length > 0 && (
                <TabsTrigger
                  value="files"
                  className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Files ({sharedFiles.length})
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="about" className="m-0">
              <UserProfileAbout user={user} />
            </TabsContent>

            <TabsContent value="activity" className="m-0">
              <UserProfileActivity
                activities={recentActivity}
                onChannelClick={onChannelClick}
              />
            </TabsContent>

            {!isOwnProfile && (
              <TabsContent value="channels" className="m-0">
                <UserProfileChannels
                  channels={sharedChannels}
                  onChannelClick={onChannelClick}
                />
              </TabsContent>
            )}

            {!isOwnProfile && (
              <TabsContent value="files" className="m-0">
                <UserProfileFiles files={sharedFiles} onFileClick={onFileClick} />
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </div>
    )
  }
)
UserProfile.displayName = 'UserProfile'

export { UserProfile }
