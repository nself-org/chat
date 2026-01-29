'use client'

import { useState, useEffect } from 'react'
import { type AppConfig, landingThemeTemplates } from '@/config/app-config'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Layout, ArrowRight, Home, Users, Building, Globe, CheckCircle } from 'lucide-react'

interface LandingPageStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function LandingPageStep({ config, onUpdate, onValidate }: LandingPageStepProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(config.landingTheme || 'simple-landing')

  useEffect(() => {
    onValidate(true) // Landing page step is always valid
  }, [onValidate])

  const handleThemeSelect = (themeKey: string) => {
    setSelectedTheme(themeKey)
    const template = landingThemeTemplates[themeKey as keyof typeof landingThemeTemplates]
    
    onUpdate({
      landingTheme: themeKey as AppConfig['landingTheme'],
      homepage: template.homepage as AppConfig['homepage']
    })
  }

  const getThemeIcon = (themeKey: string) => {
    switch (themeKey) {
      case 'login-only':
        return ArrowRight
      case 'simple-landing':
        return Home
      case 'full-homepage':
        return Layout
      case 'corporate':
        return Building
      case 'community':
        return Users
      default:
        return Globe
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] rounded-xl mb-4 shadow-glow">
          <Layout className="h-6 w-6 text-zinc-900" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Landing Page Theme
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Choose how users will first experience your platform
        </p>
      </div>
        
      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-medium text-zinc-900 dark:text-white">Select Theme</Label>
          <RadioGroup value={selectedTheme} onValueChange={handleThemeSelect}>
            {Object.entries(landingThemeTemplates).map(([key, template]) => {
              const Icon = getThemeIcon(key)
              return (
                <div key={key} className="flex items-start gap-3 p-3 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/30 transition-all duration-300">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={key} className="font-medium cursor-pointer text-zinc-900 dark:text-white">
                      {template.name}
                    </Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#0EA5E9]/10 dark:from-[#00D4FF]/20 dark:to-[#0EA5E9]/20 p-4 rounded-xl border border-[#0EA5E9]/20 dark:border-[#00D4FF]/30">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-medium mb-1 text-zinc-900 dark:text-white">Theme Selection Guide</p>
              <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>• Login Only: Users see login form immediately</li>
                <li>• Simple Landing: Basic homepage with hero section</li>
                <li>• Full Homepage: Complete website with all sections</li>
                <li>• Corporate: Professional business-focused layout</li>
                <li>• Community: Open, documentation-friendly design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}