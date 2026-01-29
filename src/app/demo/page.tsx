'use client'

// ===============================================================================
// Template Demo Page
// ===============================================================================
//
// Interactive demo page showcasing all available platform templates.
// Users can switch between templates and see live previews.
//
// ===============================================================================

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TemplateId } from '@/templates/types'
import {
  TemplateSwitcher,
  TemplatePreview,
  TemplateGallery,
  DemoModeProvider,
  useDemoMode,
} from '@/components/demo'

// Import template layouts for live preview
import { SlackLayout } from '@/templates/slack'
import { DiscordLayout } from '@/templates/discord'
import { TelegramLayout } from '@/templates/telegram'
import { WhatsAppLayout } from '@/templates/whatsapp'

// -------------------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------------------

export default function DemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('default')
  const [viewMode, setViewMode] = useState<'preview' | 'gallery'>('preview')
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  return (
    <DemoModeProvider defaultTemplate={selectedTemplate}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    nchat Templates
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    White-label chat platform
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      viewMode === 'gallery'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    Gallery
                  </button>
                </div>

                {/* GitHub Link */}
                <a
                  href="https://github.com/nself/nchat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {viewMode === 'gallery' ? (
            <GalleryView
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
            />
          ) : (
            <PreviewView
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              deviceType={deviceType}
              onDeviceChange={setDeviceType}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Built with nself CLI - Your self-hosted backend infrastructure
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="/docs"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="/setup"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Get Started
                </a>
                <a
                  href="https://nself.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  nself.org
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </DemoModeProvider>
  )
}

// -------------------------------------------------------------------------------
// Gallery View
// -------------------------------------------------------------------------------

function GalleryView({
  selectedTemplate,
  onTemplateSelect,
}: {
  selectedTemplate: TemplateId
  onTemplateSelect: (template: TemplateId) => void
}) {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Template
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          nchat comes with 5 beautiful templates inspired by popular messaging platforms.
          Each template is fully customizable to match your brand.
        </p>
      </div>

      {/* Gallery */}
      <TemplateGallery
        selectedTemplate={selectedTemplate}
        onTemplateSelect={onTemplateSelect}
        layout="grid"
        showFeatures
      />

      {/* Call to Action */}
      <div className="text-center pt-8">
        <a
          href="/setup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <span>Start Building</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Preview View
// -------------------------------------------------------------------------------

function PreviewView({
  selectedTemplate,
  onTemplateChange,
  deviceType,
  onDeviceChange,
}: {
  selectedTemplate: TemplateId
  onTemplateChange: (template: TemplateId) => void
  deviceType: 'desktop' | 'tablet' | 'mobile'
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void
}) {
  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
        {/* Template Switcher */}
        <TemplateSwitcher
          currentTemplate={selectedTemplate}
          onTemplateChange={onTemplateChange}
          variant="tabs"
        />

        {/* Device Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Device:</span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
              <button
                key={device}
                onClick={() => onDeviceChange(device)}
                className={cn(
                  'p-2 rounded-md transition-all',
                  deviceType === device
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
                title={device.charAt(0).toUpperCase() + device.slice(1)}
              >
                {device === 'desktop' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {device === 'tablet' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                {device === 'mobile' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex justify-center py-8">
        <TemplatePreview
          templateId={selectedTemplate}
          deviceType={deviceType}
          showDeviceFrame
          scale={deviceType === 'desktop' ? 0.6 : deviceType === 'tablet' ? 0.5 : 0.8}
        >
          <TemplateContent template={selectedTemplate} />
        </TemplatePreview>
      </div>

      {/* Template Info */}
      <TemplateInfo template={selectedTemplate} />
    </div>
  )
}

// -------------------------------------------------------------------------------
// Template Content
// -------------------------------------------------------------------------------

function TemplateContent({ template }: { template: TemplateId }) {
  // Render the appropriate template layout based on selection
  switch (template) {
    case 'slack':
      return <SlackLayout />
    case 'discord':
      return <DiscordLayout />
    case 'telegram':
      return <TelegramLayout />
    case 'whatsapp':
      return <WhatsAppLayout />
    default:
      return <DefaultTemplate />
  }
}

// -------------------------------------------------------------------------------
// Default Template (nself)
// -------------------------------------------------------------------------------

function DefaultTemplate() {
  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 flex flex-col">
        {/* Workspace Header */}
        <div className="h-14 px-4 flex items-center border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold">nchat Demo</span>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
              Channels
            </div>
            {['general', 'announcements', 'random', 'dev-team', 'design'].map((channel, i) => (
              <button
                key={channel}
                className={cn(
                  'w-full px-2 py-1.5 rounded-md text-left text-sm transition-colors',
                  i === 0
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                # {channel}
              </button>
            ))}
          </div>

          <div>
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
              Direct Messages
            </div>
            {['Alice Chen', 'Bob Smith', 'Charlie Davis'].map((user, i) => (
              <button
                key={user}
                className="w-full px-2 py-1.5 rounded-md text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xs text-white font-medium">
                  {user[0]}
                </div>
                {user}
              </button>
            ))}
          </div>
        </div>

        {/* User Panel */}
        <div className="h-14 px-3 flex items-center gap-2 border-t border-gray-800 bg-gray-900/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium text-sm">
            Y
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">You</div>
            <div className="text-xs text-green-400">Online</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold"># general</span>
            <span className="text-gray-500 text-sm">Team discussions</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[
            { user: 'Alice Chen', message: 'Hey everyone! Check out the new feature branch.', time: '10:30 AM' },
            { user: 'Bob Smith', message: 'Looks great! I will review it after lunch.', time: '10:32 AM' },
            { user: 'You', message: 'Thanks! Let me know if you have any questions.', time: '10:35 AM' },
          ].map((msg, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {msg.user[0]}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white">{msg.user}</span>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
                <p className="text-gray-300">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Message #general"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------
// Template Info
// -------------------------------------------------------------------------------

function TemplateInfo({ template }: { template: TemplateId }) {
  const info: Record<TemplateId, { name: string; description: string; features: string[] }> = {
    default: {
      name: 'nself Default',
      description: 'A modern, protocol-inspired design with glowing cyan accents and dark mode optimization.',
      features: ['Clean minimal interface', 'Flexible theming', 'Best of all platforms', 'Full customization'],
    },
    slack: {
      name: 'Slack Style',
      description: 'Classic aubergine sidebar with familiar channel-based organization.',
      features: ['Thread-first design', 'Workspace switching', 'Huddle support', 'Enterprise-ready'],
    },
    discord: {
      name: 'Discord Style',
      description: 'Server-based organization with blurple accents and rich presence.',
      features: ['Server/guild hierarchy', 'Voice channels', 'Role colors', 'Member list'],
    },
    telegram: {
      name: 'Telegram Style',
      description: 'Clean blue theme with bubble-style messages and folder organization.',
      features: ['Chat bubbles', 'Read receipts', 'Voice messages', 'Folder tabs'],
    },
    whatsapp: {
      name: 'WhatsApp Style',
      description: 'Familiar green theme with status stories and simple interface.',
      features: ['Status/Stories', 'Voice/Video calls', 'End-to-end encryption', 'Chat bubbles'],
    },
  }

  const current = info[template]

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {current.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl">
            {current.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {current.features.map((feature, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
