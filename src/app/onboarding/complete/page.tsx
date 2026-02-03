'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompletionStep } from '@/components/onboarding'
import { useOnboardingStore } from '@/stores/onboarding-store'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { onboarding, profileData, selectedChannels, teamInvitations, initialize, completeStep } =
    useOnboardingStore()

  useEffect(() => {
    // Initialize for demo user
    const userId = 'demo-user-id'
    initialize(userId)
  }, [initialize])

  const handleComplete = () => {
    // Mark completion step as done
    completeStep()
    // Navigate to chat
    router.push('/chat')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <CompletionStep
          onComplete={handleComplete}
          userName={profileData.displayName}
          appName="nchat"
          channelsJoined={selectedChannels.length}
          invitationsSent={teamInvitations.length}
        />
      </div>
    </div>
  )
}
