'use client'

import { isDevelopment, getHostname, isLocalDomain } from '@/lib/environment'
import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [clientInfo, setClientInfo] = useState<any>(null)

  useEffect(() => {
    const info = {
      isDevelopment: isDevelopment(),
      hostname: getHostname(),
      isLocalDomain: isLocalDomain(),
      windowLocation: {
        hostname: window.location.hostname,
        port: window.location.port,
        href: window.location.href,
        protocol: window.location.protocol
      },
      processEnv: {
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        NODE_ENV: process.env.NODE_ENV
      }
    }
    setClientInfo(info)
    console.log('Environment Test:', info)
  }, [])

  if (!clientInfo) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Detection Test</h1>

      <div className="space-y-4">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Detection Results:</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>isDevelopment(): <span className={clientInfo.isDevelopment ? 'text-green-600' : 'text-red-600'}>{String(clientInfo.isDevelopment)}</span></div>
            <div>hostname: {clientInfo.hostname}</div>
            <div>isLocalDomain(): {String(clientInfo.isLocalDomain)}</div>
          </div>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Window Location:</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>hostname: {clientInfo.windowLocation.hostname}</div>
            <div>port: {clientInfo.windowLocation.port || '(none)'}</div>
            <div>protocol: {clientInfo.windowLocation.protocol}</div>
            <div>href: {clientInfo.windowLocation.href}</div>
          </div>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>NEXT_PUBLIC_ENV: {clientInfo.processEnv.NEXT_PUBLIC_ENV || '(undefined)'}</div>
            <div>NODE_ENV: {clientInfo.processEnv.NODE_ENV || '(undefined)'}</div>
          </div>
        </div>

        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Expected Auto-Prefill Values (if dev):</h2>
          {clientInfo.isDevelopment ? (
            <div className="space-y-2 text-sm">
              <div>✓ Email: owner@nself.org</div>
              <div>✓ Name: Admin User</div>
              <div>✓ Role: Platform Owner</div>
            </div>
          ) : (
            <div className="text-sm text-zinc-600">
              Auto-prefill is disabled in production mode
            </div>
          )}
        </div>
      </div>
    </div>
  )
}