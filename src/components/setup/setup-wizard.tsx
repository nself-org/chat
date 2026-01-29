'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setupSteps, landingThemeTemplates, authProviderDescriptions, authPermissionDescriptions, type AppConfig } from '@/config/app-config'
import { Button } from '@/components/ui/button'
import { ProgressStepper } from './progress-stepper'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Step components
import { WelcomeStep } from './steps/welcome-step'
import { OwnerInfoStep } from './steps/owner-info-step'
import { BrandingStep } from './steps/branding-step'
import { ThemeStep } from './steps/theme-step'
import { LandingPageStep } from './steps/landing-page-step'
import { AuthMethodsStep } from './steps/auth-methods-step'
import { AccessPermissionsStep } from './steps/access-permissions-step'
import { FeaturesStep } from './steps/features-step'
import { ReviewStep } from './steps/review-step'

interface SetupWizardProps {
  initialConfig: AppConfig
  onComplete: (config: AppConfig) => void
  initialStep?: number
  visitedSteps?: Set<number>
  setVisitedSteps?: (visitedSteps: Set<number>) => void
  onConfigUpdate?: (updates: Partial<AppConfig>) => void
}

export function SetupWizard({ initialConfig, onComplete, initialStep, visitedSteps: externalVisitedSteps, setVisitedSteps: setExternalVisitedSteps, onConfigUpdate }: SetupWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep ?? initialConfig.setup.currentStep ?? 0)
  const [config, setConfig] = useState<AppConfig>(initialConfig)
  const [isValid, setIsValid] = useState(true)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    externalVisitedSteps || new Set(initialConfig.setup.visitedSteps || [0])
  )

  const totalSteps = setupSteps.length
  const progress = (currentStep / totalSteps) * 100

  // Sync step with URL
  useEffect(() => {
    if (initialStep !== undefined && initialStep !== currentStep) {
      setCurrentStep(initialStep)
    }
  }, [initialStep])

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
      setup: {
        ...config.setup,
        currentStep: currentStep,
        visitedSteps: Array.from(visitedSteps)
      }
    }
    setConfig(newConfig)
    
    // Also update the global config
    if (onConfigUpdate) {
      onConfigUpdate(newConfig)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      const nextStepNum = currentStep + 1
      setCurrentStep(nextStepNum)
      const newVisitedSteps = new Set([...visitedSteps, nextStepNum])
      setVisitedSteps(newVisitedSteps)
      if (setExternalVisitedSteps) {
        setExternalVisitedSteps(newVisitedSteps)
      }
      router.push(`/setup/${nextStepNum + 1}`, { scroll: false })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepNum = currentStep - 1
      setCurrentStep(prevStepNum)
      router.push(`/setup/${prevStepNum + 1}`, { scroll: false })
    }
  }

  const handleStepClick = (step: number) => {
    // Allow navigation to any previously visited step or earlier steps
    if (visitedSteps.has(step) || step < currentStep) {
      setCurrentStep(step)
      router.push(`/setup/${step + 1}`, { scroll: false })
    }
  }

  const handleComplete = () => {
    onComplete(config)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 1:
        return <OwnerInfoStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 2:
        return <BrandingStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 3:
        return <ThemeStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 4:
        return <LandingPageStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 5:
        return <AuthMethodsStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 6:
        return <AccessPermissionsStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 7:
        return <FeaturesStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      case 8:
        return <ReviewStep config={config} onUpdate={updateConfig} onValidate={setIsValid} />
      default:
        return null
    }
  }

  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-900">
      {/* Step Content */}
      <div className="px-6 py-8 min-h-[500px] bg-white dark:bg-zinc-900">
        {renderStep()}
      </div>

      {/* Navigation Footer - Protocol style */}
      <div className="px-6 py-4 border-t border-zinc-900/10 dark:border-white/10 rounded-b-xl flex justify-between bg-zinc-100 dark:bg-zinc-800/40">
        {!isFirstStep ? (
          <button 
            onClick={prevStep}
            className="inline-flex items-center gap-1.5 justify-center overflow-hidden text-sm font-medium transition rounded-full bg-zinc-100 py-2 px-4 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <span className="text-sm leading-none flex items-center">‹</span>
            Back
          </button>
        ) : (
          <div /> // Empty div to maintain flex layout
        )}

        {isLastStep ? (
          <button 
            onClick={handleComplete}
            disabled={!isValid}
            className="inline-flex items-center gap-1.5 justify-center overflow-hidden text-sm font-medium transition rounded-full bg-zinc-900 py-2 px-4 text-white hover:bg-zinc-700 dark:bg-[#00D4FF]/10 dark:text-[#00D4FF] dark:ring-1 dark:ring-inset dark:ring-[#00D4FF]/20 dark:hover:bg-[#00D4FF]/10 dark:hover:text-[#0EA5E9] dark:hover:ring-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Setup
            <span className="text-base leading-none">✓</span>
          </button>
        ) : (
          <button 
            onClick={nextStep}
            disabled={!isValid}
            className="inline-flex items-center gap-1.5 justify-center overflow-hidden text-sm font-medium transition rounded-full bg-zinc-900 py-2 px-4 text-white hover:bg-zinc-700 dark:bg-[#00D4FF]/10 dark:text-[#00D4FF] dark:ring-1 dark:ring-inset dark:ring-[#00D4FF]/20 dark:hover:bg-[#00D4FF]/10 dark:hover:text-[#0EA5E9] dark:hover:ring-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <span className="text-sm leading-none flex items-center">›</span>
          </button>
        )}
      </div>
    </div>
  )
}