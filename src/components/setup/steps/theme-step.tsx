'use client'

import { useState, useEffect, useRef } from 'react'
import { type AppConfig } from '@/config/app-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Palette, Type, Monitor, Download, Upload, Copy, Check, Sun, Moon, Laptop, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { themePresets, type ThemeColors } from '@/lib/theme-presets'

interface ThemeStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function ThemeStep({ config, onUpdate, onValidate }: ThemeStepProps) {
  const [theme, setTheme] = useState(config.theme)
  const [selectedPreset, setSelectedPreset] = useState(config.theme.preset || 'nself')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('dark')
  
  // Initialize preview theme with dark mode colors from the preset
  const initPreviewTheme = () => {
    const preset = themePresets[config.theme.preset || 'nself']
    if (preset) {
      return { ...config.theme, ...preset.dark }
    }
    return config.theme
  }
  
  const [previewTheme, setPreviewTheme] = useState(initPreviewTheme()) // Separate state for preview
  const [importTheme, setImportTheme] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTailwindColors, setShowTailwindColors] = useState(false)
  
  // Color input refs for native color picker
  const primaryColorRef = useRef<HTMLInputElement>(null)
  const secondaryColorRef = useRef<HTMLInputElement>(null)
  const accentColorRef = useRef<HTMLInputElement>(null)
  const bgColorRef = useRef<HTMLInputElement>(null)
  const surfaceColorRef = useRef<HTMLInputElement>(null)
  const textColorRef = useRef<HTMLInputElement>(null)
  const mutedColorRef = useRef<HTMLInputElement>(null)
  const borderColorRef = useRef<HTMLInputElement>(null)
  const buttonPrimaryBgRef = useRef<HTMLInputElement>(null)
  const buttonPrimaryTextRef = useRef<HTMLInputElement>(null)
  const buttonSecondaryBgRef = useRef<HTMLInputElement>(null)
  const buttonSecondaryTextRef = useRef<HTMLInputElement>(null)
  const successColorRef = useRef<HTMLInputElement>(null)
  const warningColorRef = useRef<HTMLInputElement>(null)
  const errorColorRef = useRef<HTMLInputElement>(null)
  const infoColorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onUpdate({ theme })
    onValidate(true)
  }, [theme])

  const handleColorChange = (field: keyof typeof theme, value: string) => {
    setTheme(prev => ({ ...prev, [field]: value }))
    // Also update preview theme if it's a custom theme
    if (selectedPreset === 'custom' || !selectedPreset) {
      setPreviewTheme(prev => ({ ...prev, [field]: value }))
    }
  }

  const applyPreset = (presetKey: string) => {
    const preset = themePresets[presetKey]
    if (preset) {
      // Always use dark variant by default for main theme
      const colors = preset.dark
      const newTheme = {
        ...theme,
        preset: presetKey,
        ...colors,
        colorScheme: 'dark'
      }
      setTheme(newTheme)
      setSelectedPreset(presetKey)
      
      // Update preview theme based on current preview mode
      const previewColors = previewMode === 'dark' ? preset.dark : preset.light
      setPreviewTheme({
        ...newTheme,
        ...previewColors
      })
    }
  }


  const handlePreviewModeChange = (mode: 'light' | 'dark') => {
    setPreviewMode(mode)
    
    // Only update preview theme, not the main theme
    if (selectedPreset && selectedPreset !== 'custom') {
      const preset = themePresets[selectedPreset]
      if (preset) {
        const colors = mode === 'dark' ? preset.dark : preset.light
        setPreviewTheme(prev => ({
          ...prev,
          ...colors
        }))
      }
    } else {
      // For custom themes, just toggle the background colors
      setPreviewTheme(prev => ({
        ...prev,
        backgroundColor: mode === 'dark' ? theme.backgroundColor : '#FFFFFF',
        surfaceColor: mode === 'dark' ? theme.surfaceColor : '#F8FAFC',
        textColor: mode === 'dark' ? theme.textColor : '#0F172A',
        mutedColor: mode === 'dark' ? theme.mutedColor : '#64748B'
      }))
    }
  }

  const handleImportTheme = () => {
    try {
      const importedTheme = JSON.parse(importTheme)
      setTheme(prev => ({
        ...prev,
        ...importedTheme,
        preset: 'custom'
      }))
      setSelectedPreset('custom')
      setImportTheme('')
    } catch (error) {
      console.error('Invalid theme JSON')
    }
  }

  const exportTheme = () => {
    const themeToExport = { ...theme }
    delete themeToExport.customThemeJSON
    const json = JSON.stringify(themeToExport, null, 2)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ColorInput = ({ label, value, onChange, inputRef }: any) => {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-10 h-10 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
          />
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="hidden"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 h-10 font-mono text-xs"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-4">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Theme Customization
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Customize every aspect of your app's appearance with full control over colors, buttons, and UI elements.
        </p>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">Theme Presets</TabsTrigger>
          <TabsTrigger value="customize">Customize Colors</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4 mt-6">
          {/* Main Theme Presets */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Featured Themes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(themePresets)
                .filter(([key]) => ['nself', 'slack', 'discord', 'ocean', 'sunset', 'midnight'].includes(key))
                .map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedPreset === key
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-sky-300'
                }`}
              >
                <div className="flex flex-col gap-2 mb-2">
                  {/* Light mode colors */}
                  <div className="flex items-center gap-2">
                    <Sun className="h-3 w-3 text-zinc-400" />
                    <div className="flex -space-x-1">
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.light.primaryColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.light.secondaryColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.light.accentColor }}
                      />
                    </div>
                  </div>
                  {/* Dark mode colors */}
                  <div className="flex items-center gap-2">
                    <Moon className="h-3 w-3 text-zinc-400" />
                    <div className="flex -space-x-1">
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.dark.primaryColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.dark.secondaryColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                        style={{ backgroundColor: preset.dark.accentColor }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white">
                    {preset.name}
                  </p>
                  {selectedPreset === key && (
                    <Check className="h-4 w-4 text-sky-500" />
                  )}
                </div>
              </button>
            ))}
            </div>
          </div>
          
          {/* Tailwind Colors - Collapsible */}
          <div>
            <button
              onClick={() => setShowTailwindColors(!showTailwindColors)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <span>Tailwind Color Palettes</span>
              {showTailwindColors ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <Badge variant="secondary" className="ml-2">18 colors</Badge>
            </button>
            
            {showTailwindColors && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(themePresets)
                  .filter(([key]) => !['nself', 'slack', 'discord', 'ocean', 'sunset', 'midnight'].includes(key))
                  .map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedPreset === key
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex flex-col gap-2 mb-2">
                      {/* Light mode colors */}
                      <div className="flex items-center gap-2">
                        <Sun className="h-3 w-3 text-zinc-400" />
                        <div className="flex -space-x-1">
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.light.primaryColor }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.light.secondaryColor }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.light.accentColor }}
                          />
                        </div>
                      </div>
                      {/* Dark mode colors */}
                      <div className="flex items-center gap-2">
                        <Moon className="h-3 w-3 text-zinc-400" />
                        <div className="flex -space-x-1">
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.dark.primaryColor }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.dark.secondaryColor }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-white dark:border-zinc-800"
                            style={{ backgroundColor: preset.dark.accentColor }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <p className="font-medium text-sm text-zinc-900 dark:text-white">
                        {preset.name}
                      </p>
                      {selectedPreset === key && (
                        <Check className="h-4 w-4 text-sky-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="customize" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Colors</CardTitle>
              <CardDescription>Core colors that define your app's identity</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorInput
                label="Primary"
                value={theme.primaryColor}
                onChange={(v: string) => handleColorChange('primaryColor', v)}
                inputRef={primaryColorRef}
              />
              <ColorInput
                label="Secondary"
                value={theme.secondaryColor}
                onChange={(v: string) => handleColorChange('secondaryColor', v)}
                inputRef={secondaryColorRef}
              />
              <ColorInput
                label="Accent"
                value={theme.accentColor}
                onChange={(v: string) => handleColorChange('accentColor', v)}
                inputRef={accentColorRef}
              />
              <ColorInput
                label="Background"
                value={theme.backgroundColor}
                onChange={(v: string) => handleColorChange('backgroundColor', v)}
                inputRef={bgColorRef}
              />
              <ColorInput
                label="Surface"
                value={theme.surfaceColor}
                onChange={(v: string) => handleColorChange('surfaceColor', v)}
                inputRef={surfaceColorRef}
              />
              <ColorInput
                label="Text"
                value={theme.textColor}
                onChange={(v: string) => handleColorChange('textColor', v)}
                inputRef={textColorRef}
              />
              <ColorInput
                label="Muted Text"
                value={theme.mutedColor}
                onChange={(v: string) => handleColorChange('mutedColor', v)}
                inputRef={mutedColorRef}
              />
              <ColorInput
                label="Border"
                value={theme.borderColor}
                onChange={(v: string) => handleColorChange('borderColor', v)}
                inputRef={borderColorRef}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Button Colors</CardTitle>
              <CardDescription>Customize button appearance</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorInput
                label="Primary BG"
                value={theme.buttonPrimaryBg}
                onChange={(v: string) => handleColorChange('buttonPrimaryBg', v)}
                inputRef={buttonPrimaryBgRef}
              />
              <ColorInput
                label="Primary Text"
                value={theme.buttonPrimaryText}
                onChange={(v: string) => handleColorChange('buttonPrimaryText', v)}
                inputRef={buttonPrimaryTextRef}
              />
              <ColorInput
                label="Secondary BG"
                value={theme.buttonSecondaryBg}
                onChange={(v: string) => handleColorChange('buttonSecondaryBg', v)}
                inputRef={buttonSecondaryBgRef}
              />
              <ColorInput
                label="Secondary Text"
                value={theme.buttonSecondaryText}
                onChange={(v: string) => handleColorChange('buttonSecondaryText', v)}
                inputRef={buttonSecondaryTextRef}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Colors</CardTitle>
              <CardDescription>Colors for different status states</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorInput
                label="Success"
                value={theme.successColor}
                onChange={(v: string) => handleColorChange('successColor', v)}
                inputRef={successColorRef}
              />
              <ColorInput
                label="Warning"
                value={theme.warningColor}
                onChange={(v: string) => handleColorChange('warningColor', v)}
                inputRef={warningColorRef}
              />
              <ColorInput
                label="Error"
                value={theme.errorColor}
                onChange={(v: string) => handleColorChange('errorColor', v)}
                inputRef={errorColorRef}
              />
              <ColorInput
                label="Info"
                value={theme.infoColor}
                onChange={(v: string) => handleColorChange('infoColor', v)}
                inputRef={infoColorRef}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UI Settings</CardTitle>
              <CardDescription>Additional customization options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Border Radius</Label>
                  <Select
                    value={theme.borderRadius}
                    onValueChange={(value) => handleColorChange('borderRadius', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None (Square)</SelectItem>
                      <SelectItem value="4px">Small</SelectItem>
                      <SelectItem value="8px">Medium</SelectItem>
                      <SelectItem value="12px">Large</SelectItem>
                      <SelectItem value="16px">Extra Large</SelectItem>
                      <SelectItem value="24px">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={theme.fontFamily}
                    onValueChange={(value) => handleColorChange('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                      <SelectItem value="system-ui, sans-serif">System</SelectItem>
                      <SelectItem value="'SF Pro Display', system-ui, sans-serif">SF Pro</SelectItem>
                      <SelectItem value="'Segoe UI', system-ui, sans-serif">Segoe UI</SelectItem>
                      <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                      <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Theme</CardTitle>
              <CardDescription>Paste a theme JSON to import custom settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your theme JSON here..."
                value={importTheme}
                onChange={(e) => setImportTheme(e.target.value)}
                className="font-mono text-xs h-32"
              />
              <Button onClick={handleImportTheme} disabled={!importTheme}>
                <Upload className="h-4 w-4 mr-2" />
                Import Theme
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Theme</CardTitle>
              <CardDescription>Copy your current theme configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportTheme}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Theme JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comprehensive App Preview */}
      <Card className="mt-8 overflow-hidden" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
        <CardHeader style={{ backgroundColor: '#18181b' }}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Live Preview</CardTitle>
              <CardDescription className="text-zinc-400">See how your theme looks in the actual app</CardDescription>
            </div>
            <div className="flex gap-1 p-1 bg-zinc-800 rounded-xl">
              <button
                onClick={() => handlePreviewModeChange('light')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  previewMode === 'light' 
                    ? 'bg-zinc-700 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <Sun className="h-3.5 w-3.5 inline mr-1" />
                Light
              </button>
              <button
                onClick={() => handlePreviewModeChange('dark')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  previewMode === 'dark' 
                    ? 'bg-zinc-700 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <Moon className="h-3.5 w-3.5 inline mr-1" />
                Dark
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ backgroundColor: '#18181b' }}>
          <div 
            className="rounded-xl overflow-hidden border-2"
            style={{ 
              backgroundColor: previewTheme.backgroundColor,
              borderColor: previewTheme.borderColor 
            }}
          >
            {/* App Header */}
            <div 
              className="p-4 border-b"
              style={{ 
                backgroundColor: previewTheme.surfaceColor,
                borderColor: previewTheme.borderColor 
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-xl"
                    style={{ backgroundColor: previewTheme.primaryColor }}
                  />
                  <span style={{ color: previewTheme.textColor }} className="font-semibold">
                    Your App
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      backgroundColor: previewTheme.buttonPrimaryBg,
                      color: previewTheme.buttonPrimaryText,
                      borderRadius: previewTheme.borderRadius
                    }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      backgroundColor: previewTheme.buttonSecondaryBg,
                      color: previewTheme.buttonSecondaryText,
                      borderRadius: previewTheme.borderRadius
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-64">
              {/* Sidebar */}
              <div 
                className="w-48 p-4 border-r"
                style={{ 
                  backgroundColor: theme.surfaceColor,
                  borderColor: theme.borderColor 
                }}
              >
                <div className="space-y-2">
                  <div 
                    className="p-2 rounded"
                    style={{ 
                      backgroundColor: previewTheme.primaryColor + '20',
                      borderRadius: previewTheme.borderRadius 
                    }}
                  >
                    <span style={{ color: previewTheme.primaryColor }} className="text-sm font-medium">
                      Active Item
                    </span>
                  </div>
                  <div className="p-2">
                    <span style={{ color: previewTheme.mutedColor }} className="text-sm">
                      Menu Item
                    </span>
                  </div>
                  <div className="p-2">
                    <span style={{ color: previewTheme.mutedColor }} className="text-sm">
                      Menu Item
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <h3 style={{ color: previewTheme.textColor }} className="text-lg font-semibold mb-4">
                  Content Area
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span 
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: previewTheme.successColor || '#10B981', color: '#FFFFFF' }}
                    >
                      Success
                    </span>
                    <span 
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: previewTheme.warningColor || '#F59E0B', color: '#FFFFFF' }}
                    >
                      Warning
                    </span>
                    <span 
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: previewTheme.errorColor || '#EF4444', color: '#FFFFFF' }}
                    >
                      Error
                    </span>
                    <span 
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: previewTheme.infoColor || '#3B82F6', color: '#FFFFFF' }}
                    >
                      Info
                    </span>
                  </div>
                  <div 
                    className="p-4 rounded"
                    style={{ 
                      backgroundColor: previewTheme.surfaceColor,
                      borderRadius: previewTheme.borderRadius,
                      border: `1px solid ${previewTheme.borderColor}`
                    }}
                  >
                    <p style={{ color: previewTheme.textColor }} className="text-sm">
                      This is how your content cards will look.
                    </p>
                    <p style={{ color: previewTheme.mutedColor }} className="text-xs mt-2">
                      Muted text appears like this.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}