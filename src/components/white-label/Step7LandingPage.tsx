'use client'

import { useState, useEffect, useCallback } from 'react'
import { Layout, Plus, Trash2, GripVertical, Eye, EyeOff, Zap, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'

interface Step7LandingPageProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

const ICON_OPTIONS = [
  { id: 'Zap', icon: Zap, label: 'Lightning' },
  { id: 'Shield', icon: Shield, label: 'Shield' },
  { id: 'Users', icon: Users, label: 'Users' },
]

export function Step7LandingPage({ onValidChange, className }: Step7LandingPageProps) {
  const { config, updateLandingPage, markStepComplete } = useWhiteLabelStore()
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'cta'>('hero')

  // Mark step as complete
  useEffect(() => {
    markStepComplete('landing')
    onValidChange?.(true)
  }, [markStepComplete, onValidChange])

  const handleToggleEnabled = useCallback(() => {
    updateLandingPage({ enabled: !config.landingPage.enabled })
  }, [config.landingPage.enabled, updateLandingPage])

  const handleHeroChange = useCallback((field: string, value: string) => {
    updateLandingPage({
      hero: { ...config.landingPage.hero, [field]: value },
    })
  }, [config.landingPage.hero, updateLandingPage])

  const handleFeatureChange = useCallback((index: number, field: string, value: string) => {
    const features = [...config.landingPage.features]
    features[index] = { ...features[index], [field]: value }
    updateLandingPage({ features })
  }, [config.landingPage.features, updateLandingPage])

  const handleAddFeature = useCallback(() => {
    const features = [
      ...config.landingPage.features,
      { icon: 'Zap', title: 'New Feature', description: 'Describe this feature' },
    ]
    updateLandingPage({ features })
  }, [config.landingPage.features, updateLandingPage])

  const handleRemoveFeature = useCallback((index: number) => {
    const features = config.landingPage.features.filter((_, i) => i !== index)
    updateLandingPage({ features })
  }, [config.landingPage.features, updateLandingPage])

  const handleCtaChange = useCallback((field: string, value: string) => {
    updateLandingPage({
      cta: { ...config.landingPage.cta, [field]: value },
    })
  }, [config.landingPage.cta, updateLandingPage])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl mb-4 shadow-lg">
          <Layout className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Landing Page
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Configure your landing page content. Preview changes in real-time.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-6">
          <div>
            <span className="font-medium text-zinc-900 dark:text-white">Landing Page</span>
            <p className="text-sm text-zinc-500">Show a landing page before login</p>
          </div>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              config.landingPage.enabled ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                config.landingPage.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {config.landingPage.enabled && (
          <div className="grid md:grid-cols-[200px,1fr] gap-6">
            {/* Section tabs */}
            <div className="space-y-2">
              {(['hero', 'features', 'cta'] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg transition-colors capitalize',
                    activeSection === section
                      ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  )}
                >
                  {section === 'cta' ? 'Call to Action' : section}
                </button>
              ))}
            </div>

            {/* Section editor */}
            <div className="space-y-6">
              {/* Hero section */}
              {activeSection === 'hero' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-900 dark:text-white">Hero Section</h3>

                  <div>
                    <label className="text-sm text-zinc-500 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={config.landingPage.hero.headline}
                      onChange={(e) => handleHeroChange('headline', e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-500 block mb-1">Subheadline</label>
                    <textarea
                      value={config.landingPage.hero.subheadline}
                      onChange={(e) => handleHeroChange('subheadline', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-500 block mb-1">Button Text</label>
                      <input
                        type="text"
                        value={config.landingPage.hero.ctaText}
                        onChange={(e) => handleHeroChange('ctaText', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-500 block mb-1">Button Link</label>
                      <input
                        type="text"
                        value={config.landingPage.hero.ctaLink}
                        onChange={(e) => handleHeroChange('ctaLink', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Features section */}
              {activeSection === 'features' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-zinc-900 dark:text-white">Features</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFeature}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {config.landingPage.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800"
                      >
                        <div className="flex-shrink-0 pt-1">
                          <GripVertical className="h-4 w-4 text-zinc-400 cursor-grab" />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-[80px,1fr] gap-3">
                            <div>
                              <label className="text-xs text-zinc-500 block mb-1">Icon</label>
                              <select
                                value={feature.icon}
                                onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                              >
                                {ICON_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500 block mb-1">Title</label>
                              <input
                                type="text"
                                value={feature.title}
                                onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 block mb-1">Description</label>
                            <input
                              type="text"
                              value={feature.description}
                              onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="flex-shrink-0 p-1 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA section */}
              {activeSection === 'cta' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-900 dark:text-white">Call to Action</h3>

                  <div>
                    <label className="text-sm text-zinc-500 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={config.landingPage.cta.headline}
                      onChange={(e) => handleCtaChange('headline', e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-500 block mb-1">Description</label>
                    <textarea
                      value={config.landingPage.cta.description}
                      onChange={(e) => handleCtaChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-500 block mb-1">Button Text</label>
                      <input
                        type="text"
                        value={config.landingPage.cta.buttonText}
                        onChange={(e) => handleCtaChange('buttonText', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-500 block mb-1">Button Link</label>
                      <input
                        type="text"
                        value={config.landingPage.cta.buttonLink}
                        onChange={(e) => handleCtaChange('buttonLink', e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Preview
                </h4>
                <div
                  className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700"
                  style={{ backgroundColor: config.colors.background }}
                >
                  {/* Mini hero preview */}
                  <div className="p-6 text-center">
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: config.colors.foreground }}
                    >
                      {config.landingPage.hero.headline}
                    </h2>
                    <p
                      className="text-sm mb-4"
                      style={{ color: config.colors.mutedForeground }}
                    >
                      {config.landingPage.hero.subheadline}
                    </p>
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-lg"
                      style={{
                        backgroundColor: config.colors.primary,
                        color: config.colors.primaryForeground,
                      }}
                    >
                      {config.landingPage.hero.ctaText}
                    </button>
                  </div>

                  {/* Features preview */}
                  <div
                    className="grid grid-cols-3 gap-4 p-6"
                    style={{ backgroundColor: config.colors.muted }}
                  >
                    {config.landingPage.features.slice(0, 3).map((feature, i) => {
                      const IconComponent = ICON_OPTIONS.find(o => o.id === feature.icon)?.icon || Zap
                      return (
                        <div key={i} className="text-center">
                          <IconComponent
                            className="h-6 w-6 mx-auto mb-2"
                            style={{ color: config.colors.primary }}
                          />
                          <h4
                            className="text-sm font-medium"
                            style={{ color: config.colors.foreground }}
                          >
                            {feature.title}
                          </h4>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
