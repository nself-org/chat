'use client'

import { useEffect } from 'react'
import { type AppConfig, landingThemeTemplates } from '@/config/app-config'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, User, Palette, Layout, Shield, Settings, Sparkles } from 'lucide-react'

interface ReviewStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function ReviewStep({ config, onUpdate, onValidate }: ReviewStepProps) {
  useEffect(() => {
    onValidate(true) // Review step is always valid
  }, [onValidate])

  const enabledAuthProviders = Object.entries(config.authProviders)
    .filter(([key, value]) => {
      if (key === 'idme') {
        return typeof value === 'object' && value.enabled
      }
      return value === true
    })
    .map(([key]) => key)

  const enabledFeatures = Object.entries(config.features)
    .filter(([_, value]) => value)
    .map(([key]) => key)

  const selectedTheme = landingThemeTemplates[config.landingTheme]
  
  // Group features by category for better display
  const featureCategories = {
    'Messaging': ['publicChannels', 'privateChannels', 'directMessages', 'groupMessages', 'threads', 'messageEditing', 'messageDeleting', 'pinnedMessages'],
    'Media': ['fileUploads', 'imagePreview', 'reactions', 'customEmojis', 'codeBlocks', 'markdownSupport', 'linkPreviews', 'socialEmbeds', 'urlUnfurling'],
    'Organization': ['search', 'mentions', 'notifications', 'unreadIndicators', 'savedMessages', 'userStatus', 'typing'],
    'Users': ['userProfiles', 'userDirectory', 'roles', 'permissions', 'inviteLinks', 'guestAccess'],
    'Integration': ['webhooks', 'slashCommands', 'bots', 'apiAccess'],
    'Admin': ['moderation', 'userBanning', 'exportData', 'analytics', 'auditLog']
  }
  
  const getEnabledFeaturesByCategory = () => {
    const result: Record<string, string[]> = {}
    Object.entries(featureCategories).forEach(([category, features]) => {
      const enabled = features.filter(f => enabledFeatures.includes(f))
      if (enabled.length > 0) {
        result[category] = enabled
      }
    })
    return result
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] rounded-xl mb-4 shadow-glow">
          <Sparkles className="h-6 w-6 text-zinc-900" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Review & Launch
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review your configuration and launch your platform
        </p>
      </div>
        
      <div className="space-y-6">
          {/* Owner & Branding */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Platform Identity
            </Label>
            <div className="p-4 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">App Name:</span>
                  <p className="font-medium text-zinc-900 dark:text-white">{config.branding.appName || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Owner:</span>
                  <p className="font-medium text-zinc-900 dark:text-white">{config.owner.name}</p>
                </div>
                {config.branding.tagline && (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Tagline:</span>
                    <p className="font-medium text-zinc-900 dark:text-white">{config.branding.tagline}</p>
                  </div>
                )}
                {config.branding.companyName && (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Company:</span>
                    <p className="font-medium text-zinc-900 dark:text-white">{config.branding.companyName}</p>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Email:</span>
                  <p className="font-medium text-zinc-900 dark:text-white">{config.owner.email}</p>
                </div>
                {config.branding.websiteUrl && (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Website:</span>
                    <p className="font-medium text-zinc-900 dark:text-white">{config.branding.websiteUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual Theme
            </Label>
            <div className="p-4 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Theme Preset:</span>
                  <p className="font-medium text-zinc-900 dark:text-white capitalize">{config.theme.preset || 'Custom'}</p>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Font Family:</span>
                  <p className="font-medium text-zinc-900 dark:text-white">{config.theme.fontFamily.split(',')[0]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Primary Color:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border border-zinc-300 dark:border-zinc-600"
                        style={{ backgroundColor: config.theme.primaryColor }}
                      />
                      <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{config.theme.primaryColor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Accent Color:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border border-zinc-300 dark:border-zinc-600"
                        style={{ backgroundColor: config.theme.accentColor }}
                      />
                      <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{config.theme.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Landing Theme */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Landing Page
            </Label>
            <div className="p-4 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
              <div className="space-y-3">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Theme:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700">{selectedTheme?.name}</Badge>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{selectedTheme?.description}</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Homepage Mode:</span>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {config.homepage.mode}
                    {config.homepage.redirectTo && (
                      <span className="text-zinc-600 dark:text-zinc-400"> → {config.homepage.redirectTo}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authentication & Access
            </Label>
            <div className="p-4 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
              <div className="space-y-3">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Access Mode:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="border-[#0EA5E9]/30 bg-[#00D4FF]/10 text-zinc-900 dark:text-white">
                      {config.authPermissions.mode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">Authentication Methods ({enabledAuthProviders.length}):</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {enabledAuthProviders.map((provider) => (
                      <Badge key={provider} variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700">
                        {provider === 'emailPassword' ? 'Email/Password' : 
                         provider === 'magicLinks' ? 'Magic Links' :
                         provider === 'facebook' ? 'Facebook' :
                         provider === 'idme' ? 'ID.me' :
                         provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {config.authPermissions.requireEmailVerification && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    ✓ Email verification required
                  </div>
                )}
                {config.authPermissions.requireApproval && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    ✓ Manual approval required
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Features & Capabilities ({enabledFeatures.length} enabled)
            </Label>
            <div className="p-4 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
              <div className="space-y-3">
                {Object.entries(getEnabledFeaturesByCategory()).map(([category, features]) => (
                  <div key={category}>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">{category}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ready to Launch */}
          <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#0EA5E9]/10 dark:from-[#00D4FF]/20 dark:to-[#0EA5E9]/20 p-4 rounded-xl border border-[#0EA5E9]/20 dark:border-[#00D4FF]/30">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                <p className="font-medium mb-1 text-zinc-900 dark:text-white">Ready to Launch! 🚀</p>
                <p className="mb-2 text-zinc-600 dark:text-zinc-400">Your platform is configured and ready. Here's what happens next:</p>
                <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Configuration will be saved and activated</li>
                  <li>• Your workspace "{config.branding.appName}" will be created</li>
                  <li>• You'll be set as the platform admin</li>
                  <li>• Users can join using {enabledAuthProviders.length} authentication method{enabledAuthProviders.length !== 1 ? 's' : ''}</li>
                  <li>• All {enabledFeatures.length} selected features will be enabled</li>
                </ul>
                <p className="mt-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  💡 You can modify these settings anytime through the admin panel.
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}