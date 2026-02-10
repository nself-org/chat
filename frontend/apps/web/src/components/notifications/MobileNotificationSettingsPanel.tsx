'use client'

/**
 * MobileNotificationSettingsPanel - Mobile-specific notification settings
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MobileNotificationSettingsPanelProps {
  className?: string
}

export function MobileNotificationSettingsPanel({
  className,
}: MobileNotificationSettingsPanelProps) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <h3 className="text-lg font-medium">Mobile Notifications</h3>
      <p className="text-sm text-muted-foreground">
        Configure how notifications appear on your mobile device.
      </p>
      {/* Placeholder content */}
      <div className="rounded-lg border p-4">
        <p className="text-sm">Mobile notification settings coming soon.</p>
      </div>
    </div>
  )
}

export default MobileNotificationSettingsPanel
