'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Download, Upload, AlertCircle, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'
import { BrandingExport } from './BrandingExport'
import { BrandingImport } from './BrandingImport'
import type { BrandingConfig } from '@/lib/white-label/branding-schema'

interface Step9ReviewProps {
  onComplete?: () => void
  className?: string
}

export function Step9Review({ onComplete, className }: Step9ReviewProps) {
  const {
    config,
    steps,
    generatedFavicons,
    setConfig,
    saveToLocalStorage,
    markStepComplete,
  } = useWhiteLabelStore()

  const [activeTab, setActiveTab] = useState<'review' | 'export' | 'import'>('review')
  const [isSaving, setIsSaving] = useState(false)

  // Mark step as complete
  useEffect(() => {
    markStepComplete('review')
  }, [markStepComplete])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      saveToLocalStorage()
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulated delay
      onComplete?.()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [saveToLocalStorage, onComplete])

  const handleImport = useCallback((importedConfig: BrandingConfig) => {
    setConfig(importedConfig)
    setActiveTab('review')
  }, [setConfig])

  // Review sections
  const reviewSections = [
    {
      title: 'App Information',
      stepId: 'app-info',
      items: [
        { label: 'App Name', value: config.appInfo.appName },
        { label: 'Tagline', value: config.appInfo.tagline || 'Not set' },
      ],
    },
    {
      title: 'Logo & Favicon',
      stepId: 'logo',
      items: [
        { label: 'Logo', value: config.logo.original ? 'Uploaded' : 'Not set' },
        { label: 'Favicon', value: Object.keys(config.favicon.sizes || {}).length > 0 ? `${Object.keys(config.favicon.sizes).length} sizes generated` : 'Not set' },
      ],
      preview: config.logo.original ? (
        <img src={config.logo.original} alt="Logo" className="h-8 object-contain" />
      ) : null,
    },
    {
      title: 'Colors',
      stepId: 'colors',
      items: [
        { label: 'Primary', value: config.colors.primary },
        { label: 'Secondary', value: config.colors.secondary },
        { label: 'Accent', value: config.colors.accent },
      ],
      preview: (
        <div className="flex gap-1">
          {[config.colors.primary, config.colors.secondary, config.colors.accent].map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ),
    },
    {
      title: 'Typography',
      stepId: 'typography',
      items: [
        { label: 'Heading Font', value: config.typography.headingFont },
        { label: 'Body Font', value: config.typography.bodyFont },
        { label: 'Base Size', value: `${config.typography.baseFontSize}px` },
      ],
    },
    {
      title: 'Landing Page',
      stepId: 'landing',
      items: [
        { label: 'Enabled', value: config.landingPage.enabled ? 'Yes' : 'No' },
        { label: 'Features', value: `${config.landingPage.features.length} items` },
      ],
    },
    {
      title: 'Custom Domain',
      stepId: 'domain',
      items: [
        { label: 'Domain', value: config.customDomain.domain || 'Not configured' },
        { label: 'Status', value: config.customDomain.status },
      ],
    },
  ]

  const completedSteps = steps.filter((s) => s.completed).length
  const totalSteps = steps.length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl mb-4 shadow-lg">
          <Check className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Review & Export
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Review your branding configuration and export it for use in your app.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Progress summary */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-zinc-900 dark:text-white">
              Configuration Progress
            </span>
            <span className="text-sm text-zinc-500">
              {completedSteps}/{totalSteps} steps completed
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'review' as const, label: 'Review', icon: CheckCircle },
            { id: 'export' as const, label: 'Export', icon: Download },
            { id: 'import' as const, label: 'Import', icon: Upload },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Review tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {reviewSections.map((section) => {
              const step = steps.find((s) => s.id === section.stepId)
              const isComplete = step?.completed

              return (
                <div
                  key={section.stepId}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {section.title}
                      </span>
                    </div>
                    {section.preview}
                  </div>
                  <div className="p-4">
                    <dl className="space-y-2">
                      {section.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <dt className="text-sm text-zinc-500">{item.label}</dt>
                          <dd className="text-sm font-medium text-zinc-900 dark:text-white">
                            {item.label === 'Primary' || item.label === 'Secondary' || item.label === 'Accent' ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border border-zinc-200 dark:border-zinc-700"
                                  style={{ backgroundColor: item.value }}
                                />
                                <span className="font-mono text-xs">{item.value}</span>
                              </div>
                            ) : (
                              item.value
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )
            })}

            {/* Save button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Export tab */}
        {activeTab === 'export' && (
          <BrandingExport config={config} favicons={generatedFavicons} />
        )}

        {/* Import tab */}
        {activeTab === 'import' && (
          <BrandingImport
            onImport={handleImport}
            onCancel={() => setActiveTab('review')}
          />
        )}
      </div>
    </div>
  )
}
