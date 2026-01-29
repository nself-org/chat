'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Check, Loader2, Type, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  POPULAR_FONTS,
  FONT_PAIRINGS,
  FONT_PREVIEW_SAMPLES,
  loadFonts,
  preconnectGoogleFonts,
  getFontsByCategory,
  searchFonts,
  type GoogleFont,
} from '@/lib/white-label/font-loader'

interface FontSelectorProps {
  value: string
  onChange: (font: string) => void
  label?: string
  category?: GoogleFont['category']
  showPreview?: boolean
  previewText?: string
  className?: string
}

export function FontSelector({
  value,
  onChange,
  label,
  category,
  showPreview = true,
  previewText = FONT_PREVIEW_SAMPLES.pangram,
  className,
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [loadingFont, setLoadingFont] = useState<string | null>(null)

  // Preconnect on mount
  useEffect(() => {
    preconnectGoogleFonts()
  }, [])

  // Load selected font
  useEffect(() => {
    if (value && !loadedFonts.has(value)) {
      loadFonts([{ family: value }])
        .then(() => setLoadedFonts((prev) => new Set([...prev, value])))
        .catch(console.error)
    }
  }, [value, loadedFonts])

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = category ? getFontsByCategory(category) : POPULAR_FONTS
    if (searchQuery) {
      fonts = searchFonts(searchQuery).filter(
        (f) => !category || f.category === category
      )
    }
    return fonts
  }, [category, searchQuery])

  const handleSelect = useCallback(async (font: GoogleFont) => {
    if (!loadedFonts.has(font.family)) {
      setLoadingFont(font.family)
      try {
        await loadFonts([{ family: font.family }])
        setLoadedFonts((prev) => new Set([...prev, font.family]))
      } catch (error) {
        console.error('Failed to load font:', error)
      } finally {
        setLoadingFont(null)
      }
    }
    onChange(font.family)
    setIsOpen(false)
  }, [loadedFonts, onChange])

  const selectedFont = POPULAR_FONTS.find((f) => f.family === value)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Selected font display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 text-left border rounded-lg transition-all',
          isOpen
            ? 'border-sky-500 ring-2 ring-sky-500/20'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
        )}
      >
        <div className="flex items-center gap-3">
          <Type className="h-4 w-4 text-zinc-400" />
          <span
            className="text-sm text-zinc-900 dark:text-zinc-100"
            style={{ fontFamily: loadedFonts.has(value) ? value : 'inherit' }}
          >
            {value || 'Select a font'}
          </span>
        </div>
        {selectedFont && (
          <span className="text-xs text-zinc-500 capitalize">
            {selectedFont.category}
          </span>
        )}
      </button>

      {/* Font preview */}
      {showPreview && value && loadedFonts.has(value) && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <p
            className="text-lg text-zinc-900 dark:text-zinc-100"
            style={{ fontFamily: value }}
          >
            {previewText}
          </p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
            </div>
          </div>

          {/* Font list */}
          <div className="overflow-y-auto max-h-72">
            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                No fonts found
              </div>
            ) : (
              <div className="py-1">
                {filteredFonts.map((font) => {
                  const isLoaded = loadedFonts.has(font.family)
                  const isLoading = loadingFont === font.family
                  const isSelected = value === font.family

                  return (
                    <button
                      key={font.family}
                      type="button"
                      onClick={() => handleSelect(font)}
                      onMouseEnter={() => {
                        if (!isLoaded && !isLoading) {
                          loadFonts([{ family: font.family }])
                            .then(() => setLoadedFonts((prev) => new Set([...prev, font.family])))
                            .catch(() => {})
                        }
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-900/30'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      )}
                    >
                      <div>
                        <span
                          className="block text-sm text-zinc-900 dark:text-zinc-100"
                          style={{ fontFamily: isLoaded ? font.family : 'inherit' }}
                        >
                          {font.family}
                        </span>
                        <span className="text-xs text-zinc-500 capitalize">
                          {font.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-sky-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Google Fonts link */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
            <a
              href="https://fonts.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-sky-500 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Browse more on Google Fonts
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Font pairing selector component
interface FontPairingSelectorProps {
  headingFont: string
  bodyFont: string
  onHeadingChange: (font: string) => void
  onBodyChange: (font: string) => void
  className?: string
}

export function FontPairingSelector({
  headingFont,
  bodyFont,
  onHeadingChange,
  onBodyChange,
  className,
}: FontPairingSelectorProps) {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())

  // Load fonts for pairings preview
  useEffect(() => {
    const fontsToLoad = FONT_PAIRINGS.flatMap((p) => [
      { family: p.heading },
      { family: p.body },
    ])
    loadFonts(fontsToLoad)
      .then(() => {
        const names = new Set(fontsToLoad.map((f) => f.family))
        setLoadedFonts(names)
      })
      .catch(console.error)
  }, [])

  const handleSelectPairing = useCallback((pairing: typeof FONT_PAIRINGS[0]) => {
    onHeadingChange(pairing.heading)
    onBodyChange(pairing.body)
  }, [onHeadingChange, onBodyChange])

  const isSelected = (pairing: typeof FONT_PAIRINGS[0]) =>
    headingFont === pairing.heading && bodyFont === pairing.body

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Recommended Pairings
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FONT_PAIRINGS.map((pairing) => {
          const loaded = loadedFonts.has(pairing.heading) && loadedFonts.has(pairing.body)
          const selected = isSelected(pairing)

          return (
            <button
              key={`${pairing.heading}-${pairing.body}`}
              type="button"
              onClick={() => handleSelectPairing(pairing)}
              className={cn(
                'p-4 text-left rounded-xl border-2 transition-all',
                selected
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              )}
            >
              <div className="space-y-2">
                <h4
                  className="text-lg font-semibold text-zinc-900 dark:text-white"
                  style={{ fontFamily: loaded ? pairing.heading : 'inherit' }}
                >
                  {pairing.heading}
                </h4>
                <p
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                  style={{ fontFamily: loaded ? pairing.body : 'inherit' }}
                >
                  {pairing.body}
                </p>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{pairing.description}</p>
              {selected && (
                <div className="mt-2 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                  <Check className="h-3 w-3" />
                  Selected
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
