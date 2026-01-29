'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Image, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'
import { FaviconPreview } from './FaviconPreview'
import { LogoUploader } from './LogoUploader'
import type { GeneratedFavicon } from '@/lib/white-label/favicon-generator'

interface Step3FaviconGeneratorProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

export function Step3FaviconGenerator({ onValidChange, className }: Step3FaviconGeneratorProps) {
  const {
    config,
    updateFavicon,
    setGeneratedFavicons,
    setPreviewFavicon,
    markStepComplete,
  } = useWhiteLabelStore()

  const [faviconSource, setFaviconSource] = useState<string | undefined>(
    config.favicon.original || config.logo.original
  )
  const [useCustomSource, setUseCustomSource] = useState(false)

  // Auto-select logo as source if available
  useEffect(() => {
    if (!useCustomSource && config.logo.original && !config.favicon.original) {
      setFaviconSource(config.logo.original)
    }
  }, [config.logo.original, config.favicon.original, useCustomSource])

  const handleFaviconsGenerated = useCallback((favicons: GeneratedFavicon[]) => {
    setGeneratedFavicons(favicons)

    // Store favicon sizes
    const sizes: Record<string, string> = {}
    for (const favicon of favicons) {
      const sizeKey = `${favicon.size}x${favicon.size}` as keyof typeof config.favicon.sizes
      sizes[sizeKey] = favicon.dataUrl
    }

    updateFavicon({
      original: faviconSource,
      sizes: sizes as typeof config.favicon.sizes,
    })

    // Update preview favicon
    const favicon32 = favicons.find((f) => f.size === 32)
    if (favicon32) {
      setPreviewFavicon(favicon32.dataUrl)
    }

    markStepComplete('favicon')
    onValidChange?.(true)
  }, [faviconSource, updateFavicon, setGeneratedFavicons, setPreviewFavicon, markStepComplete, onValidChange])

  const handleCustomSourceUpload = useCallback((dataUrl: string | null) => {
    if (dataUrl) {
      setFaviconSource(dataUrl)
      updateFavicon({ original: dataUrl })
      setUseCustomSource(true)
    } else {
      setFaviconSource(config.logo.original)
      setUseCustomSource(false)
    }
  }, [config.logo.original, updateFavicon])

  const handleUseLogo = useCallback(() => {
    if (config.logo.original) {
      setFaviconSource(config.logo.original)
      setUseCustomSource(false)
    }
  }, [config.logo.original])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mb-4 shadow-lg">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Favicon Generator
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Generate favicons for all platforms from your logo or upload a custom icon.
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Source selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Favicon Source
          </label>

          {config.logo.original ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleUseLogo}
                className={cn(
                  'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                  !useCustomSource
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                )}
              >
                <img
                  src={config.logo.original}
                  alt="Logo"
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Use Logo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUseCustomSource(true)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                  useCustomSource
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                  <Image className="w-6 h-6 text-zinc-400" />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Custom Icon
                </span>
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    No logo uploaded
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Upload a custom icon below, or go back and add a logo first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom upload area */}
          {(useCustomSource || !config.logo.original) && (
            <LogoUploader
              value={useCustomSource ? faviconSource : undefined}
              onChange={handleCustomSourceUpload}
              placeholder="Upload a square icon (recommended: 512x512px)"
              minWidth={48}
              minHeight={48}
              aspectRatio={1}
            />
          )}
        </div>

        {/* Favicon preview and generation */}
        {faviconSource && (
          <FaviconPreview
            source={faviconSource}
            appName={config.appInfo.appName}
            themeColor={config.colors.primary}
            backgroundColor={config.colors.background}
            onFaviconsGenerated={handleFaviconsGenerated}
          />
        )}

        {/* Info box */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            What's included
          </h4>
          <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
            <li>Favicons for browser tabs (16x16, 32x32)</li>
            <li>Apple Touch Icon (180x180)</li>
            <li>Android Chrome icons (192x192, 512x512)</li>
            <li>Web manifest for PWA support</li>
            <li>Browser config for Windows tiles</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
