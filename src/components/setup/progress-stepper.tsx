'use client'

import { Info, User, Palette, Layout, Shield, Users, Settings, CheckCircle, Brush } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStepperProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (step: number) => void
  visitedSteps?: Set<number>
}

const stepLabels = [
  'Intro',
  'Owner', 
  'Brand',
  'Theme',
  'Landing',
  'Auth',
  'Access',
  'Features',
  'Review'
]

const stepIcons = [
  Info,
  User,
  Palette,
  Brush,
  Layout,
  Shield,
  Users,
  Settings,
  CheckCircle
]

export function ProgressStepper({ currentStep, totalSteps, onStepClick, visitedSteps = new Set() }: ProgressStepperProps) {
  return (
    <div className="w-full px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Background line - positioned at step circle height */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-zinc-900/10 dark:bg-white/10" />
          
          {/* Active progress line - nself glowing blues */}
          <div 
            className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          />
          
          {/* Steps */}
          {stepLabels.map((label, index) => {
            const Icon = stepIcons[index]
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isVisited = visitedSteps.has(index)
            const isUnvisited = index > currentStep && !visitedSteps.has(index)
            const isClickable = visitedSteps.has(index) || index <= currentStep
            
            const handleClick = () => {
              if (isClickable && onStepClick) {
                onStepClick(index)
              }
            }
            
            return (
              <div 
                key={index} 
                className={cn(
                  "flex flex-col items-center relative z-10 transition-all duration-300",
                  isClickable && "cursor-pointer hover:scale-105"
                )}
                onClick={handleClick}
              >
                {/* Step circle - centered on the progress line */}
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative",
                  // Current active step: nself cyan glow
                  isCurrent && "bg-[#00D4FF] border-[#00D4FF] text-zinc-900 shadow-glow",
                  // All visited steps: solid dark blue background with blue text
                  (isCompleted || (isVisited && index > currentStep)) && "bg-blue-50 dark:bg-blue-950 border-[#0EA5E9] dark:border-[#0EA5E9] text-[#0EA5E9] dark:text-[#0EA5E9]",
                  // Unvisited steps: white/dark background to block line
                  isUnvisited && "bg-white dark:bg-zinc-900 border-zinc-900/10 dark:border-white/10 text-zinc-400 dark:text-zinc-500"
                )}>
                  <Icon className={cn(
                    "h-4 w-4 transition-all duration-300",
                    // Current active: zinc-900 icon (Protocol style)
                    isCurrent && "text-zinc-900",
                    // All visited steps: nself blue icons  
                    (isCompleted || (isVisited && index > currentStep)) && "text-[#0EA5E9] dark:text-[#0EA5E9]",
                    // Unvisited: zinc gray icon
                    isUnvisited && "text-zinc-400 dark:text-zinc-500"
                  )} />
                  
                  {/* Small numbered circle */}
                  <div className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold transition-all duration-300",
                    // Current active: glowing nself blue
                    isCurrent && "bg-[#0EA5E9] text-white shadow-glow",
                    // All visited steps: nself blue variations
                    (isCompleted || (isVisited && index > currentStep)) && "bg-[#00D4FF] dark:bg-[#0EA5E9] text-zinc-900 dark:text-white",
                    // Unvisited: Protocol zinc colors
                    isUnvisited && "bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-400"
                  )}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Step label */}
                <div className={cn(
                  "mt-2 text-sm font-medium transition-all duration-300 text-center",
                  // Current active: zinc text (Protocol style)
                  isCurrent && "text-zinc-900 dark:text-white font-semibold",
                  // All visited steps: nself blue text
                  (isCompleted || (isVisited && index > currentStep)) && "text-[#0EA5E9] dark:text-[#00D4FF]",
                  // Unvisited: zinc gray text
                  isUnvisited && "text-zinc-600 dark:text-zinc-400 transition hover:text-zinc-900 dark:hover:text-white"
                )}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}