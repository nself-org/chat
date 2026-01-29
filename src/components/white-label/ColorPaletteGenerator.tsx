'use client'

import { useState, useEffect, useCallback } from 'react'
import { Palette, RefreshCw, Copy, Check, Sun, Moon, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  generatePalette,
  generateDualPalette,
  getComplementary,
  getAnalogous,
  getTriadic,
  getContrastRatio,
  meetsWcagAA,
  type ColorPalette,
} from '@/lib/white-label/color-generator'
import { ColorPicker } from './ColorPicker'

interface ColorPaletteGeneratorProps {
  primaryColor: string
  onPrimaryChange: (color: string) => void
  onPaletteGenerated: (palette: ColorPalette, mode: 'light' | 'dark') => void
  className?: string
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'custom'

export function ColorPaletteGenerator({
  primaryColor,
  onPrimaryChange,
  onPaletteGenerated,
  className,
}: ColorPaletteGeneratorProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('custom')
  const [palette, setPalette] = useState<ColorPalette>(() => generatePalette(primaryColor, 'light'))
  const [copied, setCopied] = useState<string | null>(null)

  // Regenerate palette when primary color or mode changes
  useEffect(() => {
    const newPalette = generatePalette(primaryColor, mode)
    setPalette(newPalette)
    onPaletteGenerated(newPalette, mode)
  }, [primaryColor, mode, onPaletteGenerated])

  const handleHarmonyChange = useCallback((type: HarmonyType) => {
    setHarmonyType(type)
    if (type === 'complementary') {
      const comp = getComplementary(primaryColor)
      onPrimaryChange(comp)
    } else if (type === 'analogous') {
      const [analog1] = getAnalogous(primaryColor)
      onPrimaryChange(analog1)
    } else if (type === 'triadic') {
      const [triad1] = getTriadic(primaryColor)
      onPrimaryChange(triad1)
    }
  }, [primaryColor, onPrimaryChange])

  const handleRandomPrimary = useCallback(() => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    onPrimaryChange(randomHex)
    setHarmonyType('custom')
  }, [onPrimaryChange])

  const handleCopyPalette = useCallback(async () => {
    const paletteText = Object.entries(palette)
      .map(([key, value]) => `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join('\n')
    await navigator.clipboard.writeText(paletteText)
    setCopied('palette')
    setTimeout(() => setCopied(null), 1500)
  }, [palette])

  const handleCopyColor = useCallback(async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  // Key colors to display prominently
  const keyColors = [
    { key: 'primary', label: 'Primary', value: palette.primary, fg: palette.primaryForeground },
    { key: 'secondary', label: 'Secondary', value: palette.secondary, fg: palette.secondaryForeground },
    { key: 'accent', label: 'Accent', value: palette.accent, fg: palette.accentForeground },
    { key: 'background', label: 'Background', value: palette.background, fg: palette.foreground },
  ]

  // Semantic colors
  const semanticColors = [
    { key: 'success', label: 'Success', value: palette.success },
    { key: 'warning', label: 'Warning', value: palette.warning },
    { key: 'error', label: 'Error', value: palette.error },
    { key: 'info', label: 'Info', value: palette.info },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <h3 className="font-medium text-zinc-900 dark:text-white">Color Palette</h3>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode('light')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              mode === 'light'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            )}
          >
            <Sun className="h-3 w-3" />
            Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              mode === 'dark'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            )}
          >
            <Moon className="h-3 w-3" />
            Dark
          </button>
        </div>
      </div>

      {/* Primary color picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Primary Color
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRandomPrimary}
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Random
          </Button>
        </div>
        <ColorPicker
          value={primaryColor}
          onChange={onPrimaryChange}
          showContrast
          contrastWith={mode === 'light' ? '#FFFFFF' : '#18181B'}
        />
      </div>

      {/* Harmony suggestions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Color Harmony
        </label>
        <div className="flex flex-wrap gap-2">
          {(['custom', 'complementary', 'analogous', 'triadic'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleHarmonyChange(type)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors capitalize',
                harmonyType === type
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Key colors preview */}
      <div className="grid grid-cols-2 gap-3">
        {keyColors.map(({ key, label, value, fg }) => (
          <button
            key={key}
            onClick={() => handleCopyColor(key, value)}
            className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all hover:shadow-md"
          >
            <div
              className="h-16 flex items-center justify-center"
              style={{ backgroundColor: value }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: fg }}
              >
                {label}
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-800 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500">{value}</span>
              {copied === key ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Semantic colors */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Semantic Colors
        </label>
        <div className="flex gap-2">
          {semanticColors.map(({ key, label, value }) => (
            <button
              key={key}
              onClick={() => handleCopyColor(key, value)}
              className="group flex-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all hover:shadow-md"
              title={`${label}: ${value}`}
            >
              <div
                className="h-8"
                style={{ backgroundColor: value }}
              />
              <div className="bg-white dark:bg-zinc-800 px-2 py-1 text-center">
                <span className="text-[10px] text-zinc-500">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Preview
        </label>
        <div
          className="rounded-xl p-4 transition-colors"
          style={{ backgroundColor: palette.background, color: palette.foreground }}
        >
          <div
            className="rounded-lg p-4 mb-3"
            style={{ backgroundColor: palette.card, color: palette.cardForeground }}
          >
            <h4 className="font-semibold mb-2" style={{ color: palette.foreground }}>
              Sample Card
            </h4>
            <p className="text-sm mb-3" style={{ color: palette.mutedForeground }}>
              This is how your content will look with the generated palette.
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: palette.primary,
                  color: palette.primaryForeground,
                }}
              >
                Primary
              </button>
              <button
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: palette.secondary,
                  color: palette.secondaryForeground,
                }}
              >
                Secondary
              </button>
            </div>
          </div>
          <div
            className="rounded-lg p-3 border"
            style={{ borderColor: palette.border, backgroundColor: palette.muted }}
          >
            <p className="text-xs" style={{ color: palette.mutedForeground }}>
              Muted area with border
            </p>
          </div>
        </div>
      </div>

      {/* Export button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleCopyPalette}
        className="w-full"
      >
        {copied === 'palette' ? (
          <Check className="h-4 w-4 mr-2 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        {copied === 'palette' ? 'Copied!' : 'Copy CSS Variables'}
      </Button>
    </div>
  )
}
