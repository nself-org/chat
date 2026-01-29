'use client'

// ===============================================================================
// Template Preview Component
// ===============================================================================
//
// A visual preview of a template showing its layout and styling
// in a device-like frame.
//
// ===============================================================================

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { TemplateId } from '@/templates/types'

// -------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------

export interface TemplatePreviewProps {
  templateId: TemplateId
  children?: ReactNode
  deviceType?: 'desktop' | 'tablet' | 'mobile'
  showDeviceFrame?: boolean
  scale?: number
  className?: string
}

// -------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------

export function TemplatePreview({
  templateId,
  children,
  deviceType = 'desktop',
  showDeviceFrame = true,
  scale = 1,
  className,
}: TemplatePreviewProps) {
  const dimensions = {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  }

  const { width, height } = dimensions[deviceType]

  return (
    <div className={cn('relative', className)}>
      {showDeviceFrame ? (
        <DeviceFrame type={deviceType}>
          <div
            className="origin-top-left"
            style={{
              width,
              height,
              transform: `scale(${scale})`,
            }}
          >
            {children}
          </div>
        </DeviceFrame>
      ) : (
        <div
          className={cn(
            'rounded-lg overflow-hidden shadow-2xl',
            'border border-gray-200 dark:border-gray-700'
          )}
          style={{
            width: width * scale,
            height: height * scale,
          }}
        >
          <div
            className="origin-top-left"
            style={{
              width,
              height,
              transform: `scale(${scale})`,
            }}
          >
            {children}
          </div>
        </div>
      )}

      {/* Template Badge */}
      <div
        className={cn(
          'absolute -bottom-3 left-1/2 -translate-x-1/2',
          'px-3 py-1 rounded-full text-sm font-medium',
          'bg-gray-900 text-white shadow-lg'
        )}
      >
        {getTemplateName(templateId)}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Device Frame
// -------------------------------------------------------------------------------

function DeviceFrame({
  type,
  children,
}: {
  type: 'desktop' | 'tablet' | 'mobile'
  children: ReactNode
}) {
  if (type === 'mobile') {
    return (
      <div className="relative">
        {/* Phone frame */}
        <div
          className={cn(
            'relative rounded-[40px] p-2',
            'bg-gray-900 shadow-2xl'
          )}
        >
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />

          {/* Screen */}
          <div className="rounded-[32px] overflow-hidden bg-black">
            {children}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    )
  }

  if (type === 'tablet') {
    return (
      <div className="relative">
        {/* Tablet frame */}
        <div
          className={cn(
            'relative rounded-[20px] p-3',
            'bg-gray-800 shadow-2xl'
          )}
        >
          {/* Camera */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-900" />

          {/* Screen */}
          <div className="rounded-lg overflow-hidden bg-black">
            {children}
          </div>

          {/* Home button */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-gray-600" />
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div className="relative">
      {/* Monitor frame */}
      <div className="rounded-lg overflow-hidden shadow-2xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {/* URL bar */}
          <div className="flex-1 mx-4">
            <div className="h-6 rounded-md bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-400">localhost:3000</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-black">{children}</div>
      </div>

      {/* Monitor stand */}
      <div className="flex justify-center">
        <div className="w-24 h-4 bg-gray-700 rounded-b-lg" />
      </div>
      <div className="flex justify-center">
        <div className="w-40 h-2 bg-gray-600 rounded-b-lg" />
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------

function getTemplateName(templateId: TemplateId): string {
  const names: Record<TemplateId, string> = {
    default: 'nself',
    slack: 'Slack',
    discord: 'Discord',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
  }
  return names[templateId] || templateId
}

export default TemplatePreview
