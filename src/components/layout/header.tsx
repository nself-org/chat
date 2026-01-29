'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  
  // Extract channel name from pathname
  const channelName = pathname.includes('/channel/') 
    ? pathname.split('/channel/')[1] 
    : 'general'

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">
          <span className="text-muted-foreground">#</span> {channelName}
        </h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </Button>
        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </Button>
      </div>
    </header>
  )
}