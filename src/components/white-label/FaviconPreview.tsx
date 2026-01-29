'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone, Tablet, Globe, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  generateFavicons,
  downloadFaviconsAsZip,
  FAVICON_SIZES,
  type GeneratedFavicon,
} from '@/lib/white-label/favicon-generator'

interface FaviconPreviewProps {
  source?: string
  appName?: string
  themeColor?: string
  backgroundColor?: string
  onFaviconsGenerated?: (favicons: GeneratedFavicon[]) => void
  className?: string
}

type PreviewDevice = 'browser' | 'mobile' | 'tablet'

export function FaviconPreview({
  source,
  appName = 'My App',
  themeColor = '#3B82F6',
  backgroundColor = '#FFFFFF',
  onFaviconsGenerated,
  className,
}: FaviconPreviewProps) {
  const [favicons, setFavicons] = useState<GeneratedFavicon[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeDevice, setActiveDevice] = useState<PreviewDevice>('browser')
  const [error, setError] = useState<string | null>(null)

  // Generate favicons when source changes
  useEffect(() => {
    if (!source) {
      setFavicons([])
      return
    }

    const generate = async () => {
      setIsGenerating(true)
      setError(null)
      try {
        const generated = await generateFavicons(source, {
          padding: 10,
          borderRadius: 20,
        })
        setFavicons(generated)
        onFaviconsGenerated?.(generated)
      } catch (err) {
        setError('Failed to generate favicons')
        console.error(err)
      } finally {
        setIsGenerating(false)
      }
    }

    generate()
  }, [source, onFaviconsGenerated])

  const handleDownload = async () => {
    if (favicons.length === 0) return

    setIsDownloading(true)
    try {
      await downloadFaviconsAsZip(favicons, appName, themeColor, backgroundColor)
    } catch (err) {
      console.error('Failed to download favicons:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const getFavicon = (size: number): string | undefined => {
    return favicons.find((f) => f.size === size)?.dataUrl
  }

  const devices = [
    { id: 'browser' as const, label: 'Browser', icon: Globe },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone },
    { id: 'tablet' as const, label: 'Tablet', icon: Tablet },
  ]

  if (!source) {
    return (
      <div className={cn('rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center', className)}>
        <Monitor className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a logo to generate favicon previews
        </p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className={cn('rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center', className)}>
        <Loader2 className="h-12 w-12 mx-auto text-sky-500 animate-spin" />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Generating favicons...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-xl border border-red-200 dark:border-red-800 p-8 text-center bg-red-50 dark:bg-red-900/20', className)}>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Device tabs */}
      <div className="flex gap-2">
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => setActiveDevice(device.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
              activeDevice === device.id
                ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <device.icon className="h-4 w-4" />
            {device.label}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-6">
        {activeDevice === 'browser' && (
          <div className="space-y-4">
            {/* Browser tab mockup */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                {/* Tab */}
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1 rounded-t-lg ml-2">
                  {getFavicon(16) && (
                    <img src={getFavicon(16)} alt="Favicon" className="w-4 h-4" />
                  )}
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">
                    {appName}
                  </span>
                </div>
              </div>
              {/* Address bar */}
              <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-700">
                <div className="bg-white dark:bg-zinc-900 rounded px-2 py-0.5 text-xs text-zinc-500">
                  https://example.com
                </div>
              </div>
              {/* Content area */}
              <div className="h-24 bg-white dark:bg-zinc-900" />
            </div>

            {/* Bookmark bar mockup */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Bookmarks bar:</span>
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded shadow-sm">
                {getFavicon(16) && (
                  <img src={getFavicon(16)} alt="Favicon" className="w-4 h-4" />
                )}
                <span className="text-zinc-700 dark:text-zinc-300">{appName}</span>
              </div>
            </div>
          </div>
        )}

        {activeDevice === 'mobile' && (
          <div className="flex justify-center">
            {/* iPhone mockup */}
            <div className="w-[200px] bg-black rounded-[2rem] p-2 shadow-xl">
              <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] overflow-hidden">
                {/* Status bar */}
                <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-2 bg-zinc-400 rounded-sm" />
                  </div>
                </div>
                {/* Home screen with icon */}
                <div className="p-6 h-48 flex items-center justify-center">
                  <div className="text-center">
                    {getFavicon(180) && (
                      <img
                        src={getFavicon(180)}
                        alt="App icon"
                        className="w-16 h-16 rounded-2xl shadow-lg mx-auto"
                      />
                    )}
                    <span className="block mt-2 text-xs text-zinc-700 dark:text-zinc-300 truncate">
                      {appName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDevice === 'tablet' && (
          <div className="flex justify-center">
            {/* iPad mockup */}
            <div className="w-[300px] bg-black rounded-xl p-2 shadow-xl">
              <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
                {/* PWA splash simulation */}
                <div
                  className="h-48 flex items-center justify-center"
                  style={{ backgroundColor: backgroundColor }}
                >
                  {getFavicon(512) && (
                    <img
                      src={getFavicon(512)}
                      alt="PWA icon"
                      className="w-24 h-24"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated sizes */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Generated Sizes
        </div>
        <div className="flex flex-wrap gap-2">
          {FAVICON_SIZES.slice(0, 6).map((sizeInfo) => {
            const favicon = getFavicon(sizeInfo.size)
            return (
              <div
                key={sizeInfo.size}
                className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1"
                title={sizeInfo.purpose}
              >
                {favicon && (
                  <img
                    src={favicon}
                    alt={sizeInfo.name}
                    className="w-4 h-4"
                  />
                )}
                <span className="text-xs text-zinc-500">{sizeInfo.size}px</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={favicons.length === 0 || isDownloading}
        className="w-full"
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isDownloading ? 'Preparing download...' : 'Download All Favicons (ZIP)'}
      </Button>
    </div>
  )
}
