'use client'

import { useEffect } from 'react'
import { type AppConfig } from '@/config/app-config'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Users, Shield, Palette, Settings, Zap } from 'lucide-react'

interface WelcomeStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function WelcomeStep({ config, onUpdate, onValidate }: WelcomeStepProps) {
  useEffect(() => {
    onValidate(true) // Welcome step is always valid
  }, [onValidate])

  const features = [
    {
      icon: MessageSquare,
      title: 'Team Communication',
      description: 'Real-time messaging with channels and direct messages'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Flexible authentication and permission systems'
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Enterprise-grade security with role-based access'
    },
    {
      icon: Palette,
      title: 'Full Customization',
      description: 'Brand your platform with custom themes and styling'
    },
    {
      icon: Settings,
      title: 'Easy Configuration',
      description: 'No-code setup for all features and integrations'
    },
    {
      icon: Zap,
      title: 'Multiple Deployments',
      description: 'Corporate, community, SaaS, or white-label ready'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
          Welcome to nChat Setup
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Transform nChat into your perfect communication platform. Whether you're building 
          an internal corporate tool, a community forum, or a customer-facing SaaS platform, 
          we'll help you configure everything in just a few minutes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="group relative bg-white dark:bg-zinc-900 border border-zinc-900/10 dark:border-white/10 rounded-xl p-5 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/40 hover:shadow-lg hover:shadow-zinc-900/5 dark:hover:shadow-none transition-all ring-1 ring-zinc-900/5 dark:ring-white/5">
            <feature.icon className="h-7 w-7 text-[#00D4FF] dark:text-[#00D4FF] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 text-sm">{feature.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 ring-1 ring-zinc-900/5 dark:ring-white/5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-[#00D4FF] rounded-xl flex items-center justify-center shadow-glow ring-1 ring-zinc-900/5">
            <Settings className="h-5 w-5 text-zinc-900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">What we'll configure together:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                App branding and identity
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                Authentication methods
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                Landing page themes
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                Access permissions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                Visual customization
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] dark:bg-[#00D4FF] rounded-full"></div>
                Features & integrations
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ready to get started? Click "Next" to begin configuring your platform.
        </p>
      </div>
    </div>
  )
}