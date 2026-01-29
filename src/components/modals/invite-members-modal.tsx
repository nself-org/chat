'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  UserPlus,
  X,
  Search,
  Loader2,
  Link2,
  Copy,
  Check,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InvitableUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role?: string
}

interface InviteMembersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (userIds: string[]) => Promise<void>
  availableUsers: InvitableUser[]
  targetName?: string // Channel or workspace name
  targetType?: 'channel' | 'workspace'
  inviteLink?: string
  isLoading?: boolean
}

export function InviteMembersModal({
  open,
  onOpenChange,
  onInvite,
  availableUsers,
  targetName = 'this channel',
  targetType = 'channel',
  inviteLink,
  isLoading = false,
}: InviteMembersModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([])
      setSearchQuery('')
      setLinkCopied(false)
    }
  }, [open])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers
    const query = searchQuery.toLowerCase()
    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [availableUsers, searchQuery])

  const selectedUserObjects = useMemo(() => {
    return availableUsers.filter((user) => selectedUsers.includes(user.id))
  }, [availableUsers, selectedUsers])

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId))
  }

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return

    setSubmitting(true)
    try {
      await onInvite(selectedUsers)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to invite members:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            Invite members
          </DialogTitle>
          <DialogDescription>
            Add people to {targetName}. They will be able to see all messages
            and files.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 -mx-6 px-6 space-y-4 overflow-hidden flex flex-col">
          {/* Selected users */}
          {selectedUserObjects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Selected ({selectedUserObjects.length})
              </Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-xl bg-muted/30">
                {selectedUserObjects.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      className="hover:bg-secondary-foreground/20 rounded p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={isLoading || submitting}
            />
          </div>

          {/* User list */}
          <ScrollArea className="flex-1 border rounded-xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No users found matching your search'
                    : 'No users available to invite'}
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserToggle(user.id)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left',
                      selectedUsers.includes(user.id) && 'bg-accent'
                    )}
                    disabled={isLoading || submitting}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {user.role && (
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                    {selectedUsers.includes(user.id) && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Invite link section */}
          {inviteLink && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Share invite link
                </Label>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join {targetName}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 text-xs bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0 || isLoading || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedUsers.length === 0
              ? 'Select members'
              : `Invite ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
