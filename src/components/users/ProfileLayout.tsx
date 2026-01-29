'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LayoutTemplate, LayoutList, LayoutGrid, Check } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type ProfileLayoutOption = 'standard' | 'compact' | 'expanded'

export interface ProfileLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedLayout: ProfileLayoutOption
  onLayoutChange: (layout: ProfileLayoutOption) => void
  disabled?: boolean
}

// ============================================================================
// Layout definitions
// ============================================================================

const LAYOUTS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    description: 'Balanced layout with cover photo and sections',
    icon: LayoutTemplate,
  },
  {
    id: 'compact' as const,
    name: 'Compact',
    description: 'Minimal layout focusing on essential info',
    icon: LayoutList,
  },
  {
    id: 'expanded' as const,
    name: 'Expanded',
    description: 'Full layout with all sections visible',
    icon: LayoutGrid,
  },
]

// ============================================================================
// Component
// ============================================================================

const ProfileLayout = React.forwardRef<HTMLDivElement, ProfileLayoutProps>(
  (
    {
      className,
      selectedLayout,
      onLayoutChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        <div>
          <Label className="text-sm font-medium">Profile Layout</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Choose how your profile information is displayed
          </p>
        </div>

        <RadioGroup
          value={selectedLayout}
          onValueChange={(value) => onLayoutChange(value as ProfileLayoutOption)}
          disabled={disabled}
          className="grid gap-3"
        >
          {LAYOUTS.map((layout) => {
            const Icon = layout.icon
            const isSelected = selectedLayout === layout.id

            return (
              <div key={layout.id}>
                <RadioGroupItem
                  value={layout.id}
                  id={`layout-${layout.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`layout-${layout.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer',
                    'transition-all hover:border-muted-foreground/50',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center h-10 w-10 rounded-lg',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{layout.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {layout.description}
                    </p>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {/* Layout preview */}
        <div className="p-4 rounded-lg border">
          <p className="text-xs font-medium mb-3">Preview</p>
          <LayoutPreview layout={selectedLayout} />
        </div>
      </div>
    )
  }
)
ProfileLayout.displayName = 'ProfileLayout'

// ============================================================================
// Layout Preview Component
// ============================================================================

function LayoutPreview({ layout }: { layout: ProfileLayoutOption }) {
  if (layout === 'compact') {
    return (
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 w-24 bg-muted rounded" />
            <div className="h-2 w-16 bg-muted/70 rounded" />
          </div>
        </div>
        <div className="h-2 w-full bg-muted/50 rounded" />
        <div className="h-2 w-3/4 bg-muted/50 rounded" />
      </div>
    )
  }

  if (layout === 'expanded') {
    return (
      <div className="bg-muted/50 rounded-lg overflow-hidden">
        {/* Cover */}
        <div className="h-12 bg-gradient-to-r from-primary/30 to-primary/10" />
        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-end gap-3 -mt-6">
            <div className="h-12 w-12 rounded-full bg-muted border-2 border-background" />
            <div className="flex-1 pb-1 space-y-1">
              <div className="h-2.5 w-20 bg-muted rounded" />
              <div className="h-2 w-14 bg-muted/70 rounded" />
            </div>
          </div>
          {/* Sections */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-muted/50 rounded" />
            <div className="h-8 bg-muted/50 rounded" />
            <div className="h-8 bg-muted/50 rounded" />
            <div className="h-8 bg-muted/50 rounded" />
          </div>
          {/* Bio */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-muted/50 rounded" />
            <div className="h-2 w-full bg-muted/50 rounded" />
            <div className="h-2 w-2/3 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Standard layout
  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      {/* Cover */}
      <div className="h-8 bg-gradient-to-r from-primary/30 to-primary/10" />
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-end gap-3 -mt-5">
          <div className="h-10 w-10 rounded-full bg-muted border-2 border-background" />
          <div className="flex-1 pb-1 space-y-1">
            <div className="h-2.5 w-20 bg-muted rounded" />
            <div className="h-2 w-14 bg-muted/70 rounded" />
          </div>
        </div>
        {/* Info */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-muted/50 rounded" />
          <div className="h-2 w-2/3 bg-muted/50 rounded" />
        </div>
      </div>
    </div>
  )
}

export { ProfileLayout }
