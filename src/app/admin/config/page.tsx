'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Wrench } from 'lucide-react'

export default function ConfigPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          App Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your application settings, branding, and features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Under Construction
          </CardTitle>
          <CardDescription>
            The admin configuration interface is being rebuilt with improved functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              In the meantime, you can configure your application using:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Environment variables in <code className="bg-muted px-1 rounded">.env.local</code></li>
              <li>Platform templates via <code className="bg-muted px-1 rounded">NEXT_PUBLIC_PLATFORM_TEMPLATE</code></li>
              <li>Feature flags via <code className="bg-muted px-1 rounded">NEXT_PUBLIC_FEATURE_*</code> variables</li>
              <li>Theme customization via <code className="bg-muted px-1 rounded">NEXT_PUBLIC_THEME_*</code> variables</li>
            </ul>
            <p className="mt-4">
              See <code className="bg-muted px-1 rounded">.env.example</code> for a complete list of configuration options.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
