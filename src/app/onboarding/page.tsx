'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding'
import { TourOverlay } from '@/components/onboarding'
import { useOnboardingStore } from '@/stores/onboarding-store'

export default function OnboardingPage() {
  const router = useRouter()
  const { onboarding, tourActive, initialize, startOnboarding } = useOnboardingStore()

  // Initialize onboarding for demo user
  useEffect(() => {
    // In production, get userId from auth context
    const userId = 'demo-user-id'
    initialize(userId)

    // Start onboarding if not already started
    if (!onboarding || onboarding.status === 'not_started') {
      startOnboarding()
    }
  }, [])

  const handleComplete = () => {
    router.push('/chat')
  }

  const handleSkip = () => {
    router.push('/chat')
  }

  // If onboarding is already completed, redirect
  useEffect(() => {
    if (onboarding?.status === 'completed' || onboarding?.status === 'skipped') {
      router.push('/chat')
    }
  }, [onboarding?.status, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-950">
      <OnboardingWizard
        appName="nchat"
        onComplete={handleComplete}
        onSkip={handleSkip}
        showCloseButton={true}
      />

      {/* Tour Overlay */}
      <TourOverlay isActive={tourActive} onComplete={handleComplete} onDismiss={handleComplete} />
    </div>
  )
}
