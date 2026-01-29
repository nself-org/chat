'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Users,
  X,
  Search,
  Link as LinkIcon,
  Copy,
  Check,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useChannelStore, selectActiveChannel } from '@/stores/channel-store'

// ============================================================================
// Types
// ============================================================================

interface ChannelInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId?: string
}

interface UserOption {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  email?: string
}

// ============================================================================
// Mock Users (for development)
// ============================================================================

const mockUsers: UserOption[] = [
  { id: '1', username: 'alice', displayName: 'Alice Johnson', email: 'alice@example.com' },
  { id: '2', username: 'bob', displayName: 'Bob Smith', email: 'bob@example.com' },
  { id: '3', username: 'charlie', displayName: 'Charlie Brown', email: 'charlie@example.com' },
  { id: '4', username: 'diana', displayName: 'Diana Prince', email: 'diana@example.com' },
  { id: '5', username: 'eve', displayName: 'Eve Wilson', email: 'eve@example.com' },
  { id: '6', username: 'frank', displayName: 'Frank Castle', email: 'frank@example.com' },
  { id: '7', username: 'grace', displayName: 'Grace Hopper', email: 'grace@example.com' },
]

// ============================================================================
// Component
// ============================================================================

export function ChannelInviteModal({
  open,
  onOpenChange,
  channelId,
}: ChannelInviteModalProps) {
  const channel = useChannelStore(selectActiveChannel)
  const { addChannelMember } = useChannelStore()

  // State
  const [activeTab, setActiveTab] = useState<'members' | 'link' | 'email'>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [emailInvites, setEmailInvites] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkExpiry, setLinkExpiry] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setSelectedUsers([])
      setEmailInvites('')
      setLinkCopied(false)
      setActiveTab('members')
    }
  }, [open])

  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return mockUsers.filter((u) => !selectedUsers.some((s) => s.id === u.id))
    return mockUsers.filter(
      (u) =>
        !selectedUsers.some((s) => s.id === u.id) &&
        (u.displayName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query))
    )
  }, [searchQuery, selectedUsers])

  const handleSelectUser = (user: UserOption) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearchQuery('')
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleCopyLink = async () => {
    if (!channel) return
    const inviteUrl = `${window.location.origin}/invite/${channel.slug}?token=xxx`
    await navigator.clipboard.writeText(inviteUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleInviteMembers = async () => {
    if (!channel || selectedUsers.length === 0) return

    setIsLoading(true)
    try {
      // In production, this would call an API
      for (const user of selectedUsers) {
        addChannelMember(channel.id, {
          userId: user.id,
          role: 'member',
          joinedAt: new Date().toISOString(),
          lastReadAt: null,
          lastReadMessageId: null,
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to invite members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailInvites = async () => {
    if (!emailInvites.trim()) return

    setIsLoading(true)
    try {
      // In production, this would call an API to send email invites
      const emails = emailInvites
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@'))

      console.log('Sending invites to:', emails)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to send email invites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!channel) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Invite to #{channel.name}
          </DialogTitle>
          <DialogDescription>
            Add people to this channel so they can participate in conversations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="link">Invite Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, or email"
                className="pl-9"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="pl-1 pr-0.5 py-0.5 gap-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-[8px]">
                        {user.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.displayName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      className="p-0.5 rounded hover:bg-muted transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* User List */}
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No users found' : 'Start typing to search'}
                  </div>
                )}
              </div>
            </ScrollArea>

            <Button
              className="w-full"
              onClick={handleInviteMembers}
              disabled={selectedUsers.length === 0 || isLoading}
            >
              {isLoading
                ? 'Adding...'
                : `Add ${selectedUsers.length} member${selectedUsers.length !== 1 ? 's' : ''}`}
            </Button>
          </TabsContent>

          {/* Invite Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Invite link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/invite/${channel.slug}?token=xxx`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can join the channel
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="font-medium">Link expires</Label>
                <p className="text-xs text-muted-foreground">
                  Link will expire in 7 days
                </p>
              </div>
              <Switch checked={linkExpiry} onCheckedChange={setLinkExpiry} />
            </div>

            <Button variant="outline" className="w-full" onClick={handleCopyLink}>
              <LinkIcon className="mr-2 h-4 w-4" />
              {linkCopied ? 'Copied!' : 'Copy invite link'}
            </Button>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email addresses</Label>
              <textarea
                id="emails"
                value={emailInvites}
                onChange={(e) => setEmailInvites(e.target.value)}
                placeholder="Enter email addresses, separated by commas or new lines"
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Invitations will be sent via email. Recipients will need to create an account if they don&apos;t have one.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSendEmailInvites}
              disabled={!emailInvites.trim() || isLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send invitations'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

ChannelInviteModal.displayName = 'ChannelInviteModal'
