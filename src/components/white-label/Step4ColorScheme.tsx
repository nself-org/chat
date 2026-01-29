'use client'

import { useState, useCallback, useEffect } from 'react'
import { Palette, Sun, Moon, Pipette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'
import { ColorPicker } from './ColorPicker'
import { ColorPaletteGenerator } from './ColorPaletteGenerator'
import { getDominantColor } from '@/lib/white-label/logo-processor'
import type { ColorPalette } from '@/lib/white-label/color-generator'

interface Step4ColorSchemeProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

type ColorMode = 'light' | 'dark'

export function Step4ColorScheme({ onValidChange, className }: Step4ColorSchemeProps) {
  const { config, updateColors, markStepComplete } = useWhiteLabelStore()
  const [mode, setMode] = useState<ColorMode>('light')
  const [isExtractingColor, setIsExtractingColor] = useState(false)

  // Mark step as complete when we have valid colors
  useEffect(() => {
    if (config.colors.primary) {
      markStepComplete('colors')
      onValidChange?.(true)
    }
  }, [config.colors.primary, markStepComplete, onValidChange])

  const handlePrimaryChange = useCallback((color: string) => {
    updateColors({ primary: color })
  }, [updateColors])

  const handlePaletteGenerated = useCallback((palette: ColorPalette, paletteMode: ColorMode) => {
    // Only update if the mode matches
    if (paletteMode === mode) {
      updateColors(palette)
    }
  }, [mode, updateColors])

  const handleExtractFromLogo = useCallback(async () => {
    if (!config.logo.original) return

    setIsExtractingColor(true)
    try {
      const dominantColor = await getDominantColor(config.logo.original)
      handlePrimaryChange(dominantColor)
    } catch (error) {
      console.error('Failed to extract color:', error)
    } finally {
      setIsExtractingColor(false)
    }
  }, [config.logo.original, handlePrimaryChange])

  const handleColorChange = useCallback((key: keyof typeof config.colors, value: string) => {
    updateColors({ [key]: value })
  }, [updateColors])

  // Color categories for manual editing
  const colorCategories = [
    {
      title: 'Brand Colors',
      colors: [
        { key: 'primary' as const, label: 'Primary' },
        { key: 'secondary' as const, label: 'Secondary' },
        { key: 'accent' as const, label: 'Accent' },
      ],
    },
    {
      title: 'Background & Surface',
      colors: [
        { key: 'background' as const, label: 'Background' },
        { key: 'foreground' as const, label: 'Foreground' },
        { key: 'muted' as const, label: 'Muted' },
        { key: 'mutedForeground' as const, label: 'Muted Text' },
      ],
    },
    {
      title: 'Semantic',
      colors: [
        { key: 'success' as const, label: 'Success' },
        { key: 'warning' as const, label: 'Warning' },
        { key: 'error' as const, label: 'Error' },
        { key: 'info' as const, label: 'Info' },
      ],
    },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl mb-4 shadow-lg">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Color Scheme
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Choose your brand colors and we'll generate a complete palette.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Mode toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('light')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all',
                mode === 'light'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <Sun className="h-4 w-4" />
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all',
                mode === 'dark'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              <Moon className="h-4 w-4" />
              Dark Mode
            </button>
          </div>
        </div>

        {/* Extract from logo */}
        {config.logo.original && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleExtractFromLogo}
              disabled={isExtractingColor}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <Pipette className="h-4 w-4" />
              {isExtractingColor ? 'Extracting...' : 'Extract from Logo'}
            </button>
          </div>
        )}

        {/* Palette generator */}
        <ColorPaletteGenerator
          primaryColor={config.colors.primary}
          onPrimaryChange={handlePrimaryChange}
          onPaletteGenerated={handlePaletteGenerated}
        />

        {/* Advanced color editing */}
        <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fine-tune Colors
          </h3>

          {colorCategories.map((category) => (
            <div key={category.title} className="space-y-3">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                {category.title}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {category.colors.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-zinc-500">{label}</label>
                    <ColorPicker
                      value={config.colors[key]}
                      onChange={(color) => handleColorChange(key, color)}
                      showInput={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
