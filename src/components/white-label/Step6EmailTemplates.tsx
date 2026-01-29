'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Eye, Code, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhiteLabelStore } from '@/stores/white-label-store'
import { ColorPicker } from './ColorPicker'
import { generateEmailTemplate } from '@/lib/white-label/branding-export'

interface Step6EmailTemplatesProps {
  onValidChange?: (isValid: boolean) => void
  className?: string
}

type EmailType = 'welcome' | 'passwordReset' | 'emailVerification' | 'invitation' | 'notification'
type ViewMode = 'preview' | 'code'

const EMAIL_TYPES: { id: EmailType; label: string; description: string }[] = [
  { id: 'welcome', label: 'Welcome', description: 'Sent when a user signs up' },
  { id: 'passwordReset', label: 'Password Reset', description: 'Sent for password recovery' },
  { id: 'emailVerification', label: 'Email Verification', description: 'Sent to verify email address' },
  { id: 'invitation', label: 'Invitation', description: 'Sent when inviting users' },
  { id: 'notification', label: 'Notification', description: 'General notifications' },
]

export function Step6EmailTemplates({ onValidChange, className }: Step6EmailTemplatesProps) {
  const { config, updateEmailTemplates, markStepComplete } = useWhiteLabelStore()
  const [selectedType, setSelectedType] = useState<EmailType>('welcome')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [previewHtml, setPreviewHtml] = useState('')

  // Generate preview when config or selected type changes
  useEffect(() => {
    const html = generateEmailTemplate(config, selectedType)
    setPreviewHtml(html)
  }, [config, selectedType])

  // Mark step as complete
  useEffect(() => {
    markStepComplete('email')
    onValidChange?.(true)
  }, [markStepComplete, onValidChange])

  const handleColorChange = useCallback((field: string, color: string) => {
    updateEmailTemplates({ [field]: color })
  }, [updateEmailTemplates])

  const handleFooterTextChange = useCallback((text: string) => {
    updateEmailTemplates({ footerText: text })
  }, [updateEmailTemplates])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        updateEmailTemplates({ headerLogo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }, [updateEmailTemplates])

  const useAppLogo = useCallback(() => {
    if (config.logo.original) {
      updateEmailTemplates({ headerLogo: config.logo.original })
    }
  }, [config.logo.original, updateEmailTemplates])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl mb-4 shadow-lg">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Email Templates
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Customize how your emails look. These will be used for all transactional emails.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Settings panel */}
          <div className="space-y-6">
            {/* Email type selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email Type
              </label>
              <div className="space-y-1">
                {EMAIL_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors',
                      selectedType === type.id
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    )}
                  >
                    <span className="block text-sm font-medium">{type.label}</span>
                    <span className="block text-xs text-zinc-500">{type.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Header Logo
              </label>
              {config.emailTemplates.headerLogo ? (
                <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-800">
                  <img
                    src={config.emailTemplates.headerLogo}
                    alt="Email logo"
                    className="max-h-12 mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => updateEmailTemplates({ headerLogo: undefined })}
                    className="absolute top-1 right-1 text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {config.logo.original && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useAppLogo}
                      className="w-full"
                      size="sm"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Use App Logo
                    </Button>
                  )}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="w-full text-center py-2 px-3 text-sm border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-sky-400 transition-colors">
                      Upload custom logo
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Colors
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Button</span>
                  <ColorPicker
                    value={config.emailTemplates.primaryButtonColor || config.colors.primary}
                    onChange={(color) => handleColorChange('primaryButtonColor', color)}
                    showInput={false}
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Background</span>
                  <ColorPicker
                    value={config.emailTemplates.backgroundColor || config.colors.muted}
                    onChange={(color) => handleColorChange('backgroundColor', color)}
                    showInput={false}
                  />
                </div>
              </div>
            </div>

            {/* Footer text */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Footer Text
              </label>
              <input
                type="text"
                value={config.emailTemplates.footerText || ''}
                onChange={(e) => handleFooterTextChange(e.target.value)}
                placeholder={`© ${new Date().getFullYear()} ${config.appInfo.appName}`}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          {/* Preview panel */}
          <div className="space-y-3">
            {/* View toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  viewMode === 'preview'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  viewMode === 'code'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}
              >
                <Code className="h-4 w-4" />
                HTML
              </button>
            </div>

            {/* Preview iframe */}
            {viewMode === 'preview' ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white">
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full h-[500px]"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <pre className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-900 text-zinc-100 p-4 overflow-x-auto text-xs h-[500px] overflow-y-auto">
                <code>{previewHtml}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
