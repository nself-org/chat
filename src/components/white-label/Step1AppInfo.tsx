'use client'

import { useState, useEffect } from 'react'
import { Type, MessageSquare, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'

interface Step1AppInfoProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

export function Step1AppInfo({ onValidChange, className }: Step1AppInfoProps) {
  const { config, updateAppInfo, markStepComplete, markStepIncomplete } = useWhiteLabelStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!config.appInfo.appName.trim()) {
      newErrors.appName = 'App name is required'
    } else if (config.appInfo.appName.trim().length < 2) {
      newErrors.appName = 'App name must be at least 2 characters'
    } else if (config.appInfo.appName.length > 50) {
      newErrors.appName = 'App name must be 50 characters or less'
    }

    if (config.appInfo.tagline.length > 100) {
      newErrors.tagline = 'Tagline must be 100 characters or less'
    }

    if (config.appInfo.description && config.appInfo.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (isValid) {
      markStepComplete('app-info')
    } else {
      markStepIncomplete('app-info')
    }

    onValidChange?.(isValid)
    return isValid
  }

  useEffect(() => {
    validate()
  }, [config.appInfo])

  const handleChange = (field: keyof typeof config.appInfo, value: string) => {
    updateAppInfo({ [field]: value })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl mb-4 shadow-lg">
          <Type className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          App Information
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Give your app a name and tagline that will appear across your platform.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-5">
        {/* App Name */}
        <div>
          <label
            htmlFor="appName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            App Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              id="appName"
              type="text"
              value={config.appInfo.appName}
              onChange={(e) => handleChange('appName', e.target.value)}
              placeholder="My App"
              className={cn(
                'w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors',
                errors.appName
                  ? 'border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700'
              )}
            />
          </div>
          {errors.appName && (
            <p className="mt-1 text-sm text-red-500">{errors.appName}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {config.appInfo.appName.length}/50 characters
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Tagline
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <input
              id="tagline"
              type="text"
              value={config.appInfo.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="Your catchy tagline here"
              className={cn(
                'w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors',
                errors.tagline
                  ? 'border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700'
              )}
            />
          </div>
          {errors.tagline && (
            <p className="mt-1 text-sm text-red-500">{errors.tagline}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {config.appInfo.tagline.length}/100 characters
          </p>
        </div>

        {/* Description (optional) */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Description <span className="text-zinc-400">(optional)</span>
          </label>
          <div className="relative">
            <Info className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <textarea
              id="description"
              value={config.appInfo.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="A brief description of your app..."
              rows={3}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors resize-none',
                errors.description
                  ? 'border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700'
              )}
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {(config.appInfo.description || '').length}/500 characters
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/30 dark:to-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-sky-900 dark:text-sky-100 mb-3">
            Preview
          </h3>
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm">
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
              {config.appInfo.appName || 'Your App Name'}
            </h4>
            {config.appInfo.tagline && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {config.appInfo.tagline}
              </p>
            )}
            {config.appInfo.description && (
              <p className="text-xs text-zinc-500 mt-3 line-clamp-2">
                {config.appInfo.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
