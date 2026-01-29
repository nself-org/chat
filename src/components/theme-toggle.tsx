'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="flex h-6 w-6 items-center justify-center rounded-lg shadow-md ring-1 shadow-black/5 ring-black/5 dark:bg-zinc-800 dark:ring-white/5 dark:ring-inset"
      >
        <Sun className="h-4 w-4 fill-zinc-400" />
      </button>
    )
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    console.log('Theme toggle clicked:', resolvedTheme, '->', newTheme)
    console.log('HTML classes before:', document.documentElement.classList.toString())
    setTheme(newTheme)
    // Check classes after a brief delay
    setTimeout(() => {
      console.log('HTML classes after:', document.documentElement.classList.toString())
    }, 100)
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-6 w-6 items-center justify-center rounded-lg shadow-md ring-1 shadow-black/5 ring-black/5 dark:bg-zinc-800 dark:ring-white/5 dark:ring-inset"
      aria-label="Theme"
    >
      <Sun className={`h-4 w-4 dark:hidden ${resolvedTheme === 'system' ? 'fill-zinc-400' : 'fill-[#00D4FF]'}`} />
      <Moon className={`hidden h-4 w-4 dark:block ${resolvedTheme === 'system' ? 'fill-zinc-400' : 'fill-[#00D4FF]'}`} />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}