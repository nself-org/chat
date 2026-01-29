'use client'

import { useState, useCallback } from 'react'
import { Image, Upload, Sparkles, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'
import { LogoUploader } from './LogoUploader'
import { LogoEditor } from './LogoEditor'
import { LogoPresets } from './LogoPresets'
import { createLogoVariants, type ProcessedLogo } from '@/lib/white-label/logo-processor'

interface Step2LogoBuilderProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

type Tab = 'upload' | 'generate' | 'edit'

export function Step2LogoBuilder({ onValidChange, className }: Step2LogoBuilderProps) {
  const { config, updateLogo, setPreviewLogo, markStepComplete } = useWhiteLabelStore()
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [tempLogo, setTempLogo] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleLogoUpload = useCallback(async (dataUrl: string | null) => {
    if (!dataUrl) {
      updateLogo({ original: undefined, light: undefined, dark: undefined })
      setPreviewLogo(null)
      return
    }

    setIsProcessing(true)
    try {
      const variants = await createLogoVariants(dataUrl)
      updateLogo({
        original: variants.original.dataUrl,
        light: variants.light.dataUrl,
        dark: variants.dark.dataUrl,
        width: variants.original.width,
        height: variants.original.height,
        format: variants.original.format as 'png' | 'svg' | 'jpg' | 'webp',
      })
      setPreviewLogo(variants.original.dataUrl)
      markStepComplete('logo')
      onValidChange?.(true)
    } catch (error) {
      console.error('Failed to process logo:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [updateLogo, setPreviewLogo, markStepComplete, onValidChange])

  const handlePresetSelect = useCallback(async (_preset: unknown, dataUrl: string) => {
    setIsProcessing(true)
    try {
      const variants = await createLogoVariants(dataUrl)
      updateLogo({
        original: variants.original.dataUrl,
        light: variants.light.dataUrl,
        dark: variants.dark.dataUrl,
        width: variants.original.width,
        height: variants.original.height,
        format: 'png',
      })
      setPreviewLogo(variants.original.dataUrl)
      markStepComplete('logo')
      onValidChange?.(true)
    } catch (error) {
      console.error('Failed to process preset logo:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [updateLogo, setPreviewLogo, markStepComplete, onValidChange])

  const handleEditClick = useCallback(() => {
    if (config.logo.original) {
      setTempLogo(config.logo.original)
      setActiveTab('edit')
    }
  }, [config.logo.original])

  const handleEditSave = useCallback(async (result: ProcessedLogo) => {
    setIsProcessing(true)
    try {
      const variants = await createLogoVariants(result.dataUrl)
      updateLogo({
        original: variants.original.dataUrl,
        light: variants.light.dataUrl,
        dark: variants.dark.dataUrl,
        width: variants.original.width,
        height: variants.original.height,
        format: 'png',
      })
      setPreviewLogo(variants.original.dataUrl)
      setTempLogo(null)
      setActiveTab('upload')
    } catch (error) {
      console.error('Failed to save edited logo:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [updateLogo, setPreviewLogo])

  const handleEditCancel = useCallback(() => {
    setTempLogo(null)
    setActiveTab('upload')
  }, [])

  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'generate' as const, label: 'Generate', icon: Sparkles },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-4 shadow-lg">
          <Image className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Logo Builder
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Upload your logo or generate one from a template. We'll create light and dark variants automatically.
        </p>
      </div>

      {/* Tab content */}
      <div className="max-w-lg mx-auto">
        {activeTab === 'edit' && tempLogo ? (
          <LogoEditor
            src={tempLogo}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        ) : (
          <>
            {/* Tab buttons */}
            <div className="flex gap-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
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

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {config.logo.original ? (
                  <div className="space-y-4">
                    {/* Current logo preview */}
                    <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
                      <img
                        src={config.logo.original}
                        alt="Current logo"
                        className="max-h-32 mx-auto object-contain"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleEditClick}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Logo variants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white">
                        <p className="text-xs text-zinc-500 mb-2 text-center">Light Mode</p>
                        {config.logo.light && (
                          <img
                            src={config.logo.light}
                            alt="Light variant"
                            className="max-h-16 mx-auto object-contain"
                          />
                        )}
                      </div>
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-900">
                        <p className="text-xs text-zinc-400 mb-2 text-center">Dark Mode</p>
                        {config.logo.dark && (
                          <img
                            src={config.logo.dark}
                            alt="Dark variant"
                            className="max-h-16 mx-auto object-contain"
                          />
                        )}
                      </div>
                    </div>

                    {/* Replace button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleLogoUpload(null)}
                      className="w-full"
                    >
                      Replace Logo
                    </Button>
                  </div>
                ) : (
                  <LogoUploader
                    value={undefined}
                    onChange={handleLogoUpload}
                    placeholder="Drop your logo here or click to upload"
                    showPreview={false}
                  />
                )}

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      Processing logo variants...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate tab */}
            {activeTab === 'generate' && (
              <div className="space-y-4">
                <LogoPresets
                  appName={config.appInfo.appName}
                  onSelect={handlePresetSelect}
                />

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      Generating logo...
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tips */}
      <div className="max-w-lg mx-auto">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tips for best results
          </h4>
          <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
            <li>Use a PNG or SVG file with transparent background</li>
            <li>Minimum recommended size: 512x512 pixels</li>
            <li>Simple, recognizable shapes work best</li>
            <li>We'll generate light and dark variants automatically</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
