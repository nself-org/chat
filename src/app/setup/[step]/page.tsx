'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAppConfig } from '@/contexts/app-config-context'
import { setupSteps } from '@/config/app-config'
import { SetupWizard } from '@/components/setup/setup-wizard'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProgressStepper } from '@/components/setup/progress-stepper'

export default function SetupStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = use(params)
  const router = useRouter()
  const { config, updateConfig } = useAppConfig()
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize visited steps from config, ensuring current step is included
  const initVisitedSteps = () => {
    const steps = config.setup.visitedSteps || [0]
    return new Set(steps)
  }
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(initVisitedSteps())
  
  // Parse step number from URL
  const stepNumber = step ? parseInt(step) - 1 : 0
  
  // Sync visited steps from config
  useEffect(() => {
    if (config.setup.visitedSteps) {
      setVisitedSteps(new Set(config.setup.visitedSteps))
    }
  }, [config.setup.visitedSteps])
  
  useEffect(() => {
    // If setup is already completed, redirect to home
    if (config.setup.isCompleted) {
      router.push('/')
      return
    }
    
    // Validate step number and redirect if invalid
    if (stepNumber < 0 || stepNumber >= setupSteps.length) {
      router.push('/setup/1')
      return
    }
    
    // Add current step to visited steps
    const newVisitedSteps = new Set([...visitedSteps, stepNumber])
    setVisitedSteps(newVisitedSteps)
    
    // Update global config with visited steps
    updateConfig({ 
      setup: { 
        ...config.setup, 
        currentStep: stepNumber,
        visitedSteps: Array.from(newVisitedSteps)
      }
    })
    
    setIsLoading(false)
  }, [config.setup.isCompleted, router, stepNumber])

  const handleSetupComplete = async (finalConfig: any) => {
    try {
      const completedConfig = {
        ...finalConfig,
        setup: {
          isCompleted: true,
          currentStep: setupSteps.length - 1,
          completedAt: new Date()
        }
      }
      
      await updateConfig(completedConfig)
      
      // Redirect based on homepage mode
      if (completedConfig.homepage.mode === 'redirect') {
        router.push(completedConfig.homepage.redirectTo || '/auth/signin')
      } else if (completedConfig.homepage.mode === 'chat') {
        router.push('/chat')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Setup completion failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 antialiased">
      {/* Background decoration - Protocol style with nself glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        {/* Header - Protocol style with nself branding */}
        <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-12 px-4 transition sm:px-6 lg:px-8 backdrop-blur-xs lg:backdrop-blur-sm bg-white/(--bg-opacity-light) dark:bg-zinc-900/(--bg-opacity-dark)"
             style={{
               '--bg-opacity-light': '90%',
               '--bg-opacity-dark': '80%'
             } as React.CSSProperties}>
          <div className="container max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {config.branding.logo ? (
                  // If logo exists, show it (logo should contain the brand name)
                  <img 
                    src={config.branding.logo} 
                    alt={config.branding.appName} 
                    className="w-auto object-contain"
                    style={{ height: `${32 * (config.branding.logoScale || 1.0)}px` }}
                  />
                ) : (
                  // If no logo, show icon + text
                  <>
                    {config.branding.favicon ? (
                      <img 
                        src={config.branding.favicon} 
                        alt={config.branding.appName} 
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] rounded-lg flex items-center justify-center shadow-glow">
                        <span className="text-zinc-900 font-bold text-sm">
                          ɳ
                        </span>
                      </div>
                    )}
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {config.branding.appName || 'nChat'}
                    </h1>
                  </>
                )}
                <span className="text-zinc-600 dark:text-zinc-400 ml-2 text-sm transition hover:text-zinc-900 dark:hover:text-white">Setup</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 transition hover:text-zinc-900 dark:hover:text-white">Step-by-step configuration</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
          {/* Protocol border separator */}
          <div className="absolute inset-x-0 top-full h-px bg-zinc-900/7.5 dark:bg-white/7.5" />
        </div>

        {/* Progress Stepper - Protocol spacing */}
        <div className="pt-14">
          <ProgressStepper 
            currentStep={stepNumber} 
            totalSteps={setupSteps.length}
            onStepClick={(step) => {
              // Allow clicking on any visited step or earlier steps
              if (visitedSteps.has(step) || step <= stepNumber) {
                router.push(`/setup/${step + 1}`)
              }
            }}
            visitedSteps={visitedSteps}
          />
        </div>

        {/* Main content - Protocol card styling */}
        <div className="relative flex flex-col px-4 pt-8 pb-8 sm:px-6 lg:px-8">
          <div className="container max-w-4xl mx-auto">
            <div className="rounded-xl bg-white border border-zinc-900/10 shadow-glow dark:bg-zinc-900 dark:border-white/10 overflow-hidden">
              <SetupWizard 
                initialConfig={config}
                onComplete={handleSetupComplete}
                initialStep={stepNumber}
                visitedSteps={visitedSteps}
                setVisitedSteps={setVisitedSteps}
                onConfigUpdate={updateConfig}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}