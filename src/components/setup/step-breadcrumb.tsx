'use client'

import { setupSteps } from '@/config/app-config'
import { ChevronRight } from 'lucide-react'

interface StepBreadcrumbProps {
  currentStep: number
}

export function StepBreadcrumb({ currentStep }: StepBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <span className="text-zinc-500 dark:text-zinc-400">Setup</span>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
      <span className="text-zinc-500 dark:text-zinc-400">
        Step {currentStep + 1}
      </span>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
      <span className="font-medium text-zinc-900 dark:text-white">
        {setupSteps[currentStep]}
      </span>
    </nav>
  )
}