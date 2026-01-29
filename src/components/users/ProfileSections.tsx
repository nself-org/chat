'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  User,
  Briefcase,
  Mail,
  Link,
  Award,
  Activity,
  Hash,
  FileText,
  GripVertical,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface ProfileSectionsSettings {
  showBio: boolean
  showWorkInfo: boolean
  showContactInfo: boolean
  showSocialLinks: boolean
  showBadges: boolean
  showActivity: boolean
  showSharedChannels: boolean
  showSharedFiles: boolean
}

export interface ProfileSectionsProps extends React.HTMLAttributes<HTMLDivElement> {
  sections: ProfileSectionsSettings
  onSectionChange: (key: keyof ProfileSectionsSettings, value: boolean) => void
  disabled?: boolean
  allowReorder?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const SECTION_DEFINITIONS: {
  key: keyof ProfileSectionsSettings
  label: string
  description: string
  icon: typeof User
}[] = [
  {
    key: 'showBio',
    label: 'About / Bio',
    description: 'Your personal bio and about section',
    icon: User,
  },
  {
    key: 'showWorkInfo',
    label: 'Work Information',
    description: 'Job title, department, and team',
    icon: Briefcase,
  },
  {
    key: 'showContactInfo',
    label: 'Contact Information',
    description: 'Email, phone, and other contact details',
    icon: Mail,
  },
  {
    key: 'showSocialLinks',
    label: 'Social Links',
    description: 'Links to your social profiles',
    icon: Link,
  },
  {
    key: 'showBadges',
    label: 'Badges',
    description: 'Achievement badges and recognition',
    icon: Award,
  },
  {
    key: 'showActivity',
    label: 'Recent Activity',
    description: 'Your recent messages and interactions',
    icon: Activity,
  },
  {
    key: 'showSharedChannels',
    label: 'Shared Channels',
    description: 'Channels you share with the viewer',
    icon: Hash,
  },
  {
    key: 'showSharedFiles',
    label: 'Shared Files',
    description: 'Files shared between you and the viewer',
    icon: FileText,
  },
]

// ============================================================================
// Component
// ============================================================================

const ProfileSections = React.forwardRef<HTMLDivElement, ProfileSectionsProps>(
  (
    {
      className,
      sections,
      onSectionChange,
      disabled = false,
      allowReorder = false,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-1', className)} {...props}>
        {SECTION_DEFINITIONS.map((section) => {
          const Icon = section.icon
          const isEnabled = sections[section.key]

          return (
            <div
              key={section.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                'hover:bg-muted/50',
                !isEnabled && 'opacity-60'
              )}
            >
              {allowReorder && (
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              )}
              <div
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0',
                  isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`section-${section.key}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {section.label}
                </Label>
                <p className="text-xs text-muted-foreground truncate">
                  {section.description}
                </p>
              </div>
              <Switch
                id={`section-${section.key}`}
                checked={isEnabled}
                onCheckedChange={(checked) => onSectionChange(section.key, checked)}
                disabled={disabled}
              />
            </div>
          )
        })}

        {/* Info note */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p>
            Disabled sections will not appear on your public profile. Some sections
            may still be visible to workspace admins.
          </p>
        </div>
      </div>
    )
  }
)
ProfileSections.displayName = 'ProfileSections'

export { ProfileSections }
