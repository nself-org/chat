'use client'

import { useState, useEffect } from 'react'
import { type AppConfig } from '@/config/app-config'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { User, Mail, UserCheck } from 'lucide-react'
import { isDevelopment, getHostname } from '@/lib/environment'

interface OwnerInfoStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function OwnerInfoStep({ config, onUpdate, onValidate }: OwnerInfoStepProps) {
  // Detect development environment using hostname-based detection
  const isDev = isDevelopment()

  // In development, ALWAYS use prefilled values regardless of config
  const getInitialValues = () => {
    if (isDev) {
      // In dev, always prefill these values
      return {
        email: 'owner@nself.org',
        name: 'Admin User',
        role: 'Platform Owner'
      }
    }

    // In production, use config values
    return {
      email: config.owner?.email || '',
      name: config.owner?.name || '',
      role: config.owner?.role || ''
    }
  }

  const initialValues = getInitialValues()

  console.log('🚀 OwnerInfoStep:', {
    isDev,
    hostname: getHostname(),
    initialValues,
    configOwner: config.owner
  })

  const [formData, setFormData] = useState(initialValues)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const validateForm = (showErrors = false) => {
    const newErrors: Record<string, string> = {}
    
    // Only show errors if field has been touched (blurred) and showErrors is true
    if (showErrors && touchedFields.has('name') && formData.name.trim() === '') {
      newErrors.name = 'Name is required'
    }
    
    if (showErrors && touchedFields.has('email')) {
      if (formData.email.trim() === '') {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    // Check validity regardless of showing errors
    const isValid = formData.name.trim() !== '' && formData.email.trim() !== '' && 
                   (!formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    onValidate(isValid)
    return isValid
  }

  useEffect(() => {
    // Validate without showing errors initially
    validateForm(touchedFields.size > 0)
  }, [formData])

  useEffect(() => {
    // On mount in dev mode, immediately update parent with prefilled values
    if (isDev) {
      console.log('📝 Dev mode: Updating parent config with prefilled values:', initialValues)
      onUpdate({
        owner: initialValues
      })
    }

    // Run initial validation
    validateForm(false)
  }, [])

  const handleChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    
    onUpdate({
      owner: updated
    })
  }

  const handleBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))
    // Force validation with errors after blur
    setTimeout(() => validateForm(true), 0)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] rounded-xl mb-4 shadow-glow">
          <User className="h-6 w-6 text-zinc-900" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Owner Information
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Set up your admin account. You'll automatically become the platform owner when you sign in with this email.
        </p>
        {isDev && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-xs font-medium rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Development Mode - Auto-prefill Active
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid gap-6">
          <EnhancedInput
            id="name"
            label="Full Name *"
            icon={<User className="h-4 w-4" />}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name}
          />

          <div>
            <EnhancedInput
              id="email"
              type="email"
              label="Email Address *"
              icon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
            />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              This will be your admin login email and primary contact
            </p>
          </div>

          <div className="relative">
            <EnhancedInput
              id="role"
              label="Your Role"
              icon={<UserCheck className="h-4 w-4" />}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder="e.g., CEO, Administrator, Team Lead"
            />
            <span className="absolute right-3 top-3 text-xs text-zinc-400 dark:text-zinc-500">
              Optional
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/30 dark:to-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 ring-1 ring-zinc-900/5 dark:ring-white/5">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#00D4FF] rounded-xl flex items-center justify-center shadow-glow">
              <UserCheck className="h-4 w-4 text-zinc-900" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Automatic Owner Assignment</h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                When you first sign in to your platform with this email address (via any authentication method), 
                you'll automatically be granted owner privileges with full administrative access.
              </p>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <p className="font-medium mb-1">✓ Works with any login method:</p>
                <p>Email/Password • Google • GitHub • Magic Links • Other providers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-zinc-600 dark:text-zinc-400 text-sm">🔒</span>
              </div>
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-medium mb-1">Privacy & Security</p>
              <p>Your information is stored locally and used only for platform configuration. We never share your data with third parties.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}