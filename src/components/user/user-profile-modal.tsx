'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type UserProfile, type UserRole } from '@/stores/user-store'
import { useUIStore } from '@/stores/ui-store'
import { UserAvatar } from './user-avatar'
import { UserStatus } from './user-status'
import { RoleBadge } from './role-badge'
import { UserPresenceDot } from './user-presence-dot'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Phone,
  Video,
  MoreHorizontal,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Hash,
  FileText,
  Shield,
  Ban,
  UserMinus,
  Crown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface SharedChannel {
  id: string
  name: string
  isPrivate: boolean
}

export interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
}

export interface UserProfileModalProps {
  user: UserProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessage?: () => void
  onCall?: () => void
  onVideoCall?: () => void
  sharedChannels?: SharedChannel[]
  sharedFiles?: SharedFile[]
  // Admin actions
  currentUserRole?: UserRole
  onBanUser?: () => void
  onKickUser?: () => void
  onChangeRole?: (role: UserRole) => void
  onRemoveFromChannel?: () => void
}

// ============================================================================
// Component
// ============================================================================

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  open,
  onOpenChange,
  onMessage,
  onCall,
  onVideoCall,
  sharedChannels = [],
  sharedFiles = [],
  currentUserRole,
  onBanUser,
  onKickUser,
  onChangeRole,
  onRemoveFromChannel,
}) => {
  if (!user) return null

  const canModerate =
    currentUserRole &&
    ['owner', 'admin', 'moderator'].includes(currentUserRole) &&
    // Can't moderate users with same or higher role
    !['owner'].includes(user.role) &&
    (currentUserRole === 'owner' ||
      (currentUserRole === 'admin' && !['admin'].includes(user.role)) ||
      (currentUserRole === 'moderator' &&
        !['admin', 'moderator'].includes(user.role)))

  const canManageRoles =
    currentUserRole && ['owner', 'admin'].includes(currentUserRole)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Cover image */}
        <div
          className="h-24 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10"
          style={{
            backgroundImage: user.coverUrl
              ? `url(${user.coverUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Profile header */}
        <div className="px-6 -mt-12">
          <div className="flex items-end gap-4 mb-4">
            <UserAvatar
              user={user}
              size="3xl"
              presence={user.presence}
              className="ring-4 ring-background"
            />
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogHeader className="p-0">
                  <DialogTitle className="text-xl">
                    {user.displayName}
                  </DialogTitle>
                </DialogHeader>
                <RoleBadge role={user.role} size="sm" showTooltip />
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {/* Custom status */}
          {user.customStatus && (
            <div className="mb-4">
              <UserStatus status={user.customStatus} variant="full" />
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-4">
            {onMessage && (
              <Button onClick={onMessage} className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            )}
            {onCall && (
              <Button variant="outline" onClick={onCall}>
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {onVideoCall && (
              <Button variant="outline" onClick={onVideoCall}>
                <Video className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Copy User ID</DropdownMenuItem>
                <DropdownMenuItem>Copy Username</DropdownMenuItem>
                {canModerate && (
                  <>
                    <DropdownMenuSeparator />
                    {canManageRoles && (
                      <DropdownMenuItem onClick={() => onChangeRole?.('admin')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {onRemoveFromChannel && (
                      <DropdownMenuItem onClick={onRemoveFromChannel}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove from Channel
                      </DropdownMenuItem>
                    )}
                    {onKickUser && (
                      <DropdownMenuItem
                        onClick={onKickUser}
                        className="text-yellow-600"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Kick User
                      </DropdownMenuItem>
                    )}
                    {onBanUser && (
                      <DropdownMenuItem
                        onClick={onBanUser}
                        className="text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />

        {/* Tabs content */}
        <Tabs defaultValue="about" className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="about" className="flex-1">
                About
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex-1">
                Channels ({sharedChannels.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1">
                Files ({sharedFiles.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-64">
            <TabsContent value="about" className="px-6 py-4 m-0">
              {/* Bio */}
              {user.bio && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              )}

              {/* Presence */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <UserPresenceDot
                    status={user.presence}
                    size="md"
                    position="inline"
                  />
                  <span className="text-sm capitalize">{user.presence}</span>
                  {user.lastSeenAt && user.presence === 'offline' && (
                    <span className="text-xs text-muted-foreground">
                      Last seen{' '}
                      {formatDistanceToNow(new Date(user.lastSeenAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Additional info */}
              <div className="space-y-2">
                {user.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {user.pronouns && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Pronouns:</span>
                    <span>{user.pronouns}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="channels" className="px-6 py-4 m-0">
              {sharedChannels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shared channels</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{channel.name}</span>
                      {channel.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="px-6 py-4 m-0">
              {sharedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shared files</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} -{' '}
                          {formatDistanceToNow(new Date(file.uploadedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Helper function
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default UserProfileModal
