'use client'

import { useState, useEffect } from 'react'
import { type AppConfig, authPermissionDescriptions } from '@/config/app-config'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Users, Shield, CheckCircle } from 'lucide-react'

interface AccessPermissionsStepProps {
  config: AppConfig
  onUpdate: (updates: Partial<AppConfig>) => void
  onValidate: (isValid: boolean) => void
}

export function AccessPermissionsStep({ config, onUpdate, onValidate }: AccessPermissionsStepProps) {
  const [permissions, setPermissions] = useState(config.authPermissions)

  useEffect(() => {
    onValidate(true) // Always valid
  }, [onValidate])

  const handlePermissionChange = (updates: Partial<typeof permissions>) => {
    const updated = { ...permissions, ...updates }
    setPermissions(updated)
    onUpdate({ authPermissions: updated })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] rounded-xl mb-4 shadow-glow">
          <Users className="h-6 w-6 text-zinc-900" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Access Permissions
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Control who can join your platform and how
        </p>
      </div>
        
      <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white">Access Control Mode</Label>
            <RadioGroup 
              value={permissions.mode} 
              onValueChange={(value) => handlePermissionChange({ mode: value as typeof permissions.mode })}
            >
              {Object.entries(authPermissionDescriptions).map(([key, description]) => (
                <div key={key} className="flex items-start gap-3 p-3 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/30 transition-all duration-300">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={key} className="font-medium cursor-pointer capitalize text-zinc-900 dark:text-white">
                      {key.replace(/-/g, ' ')}
                    </Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white">Additional Settings</Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/30 transition-all duration-300">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">Require Email Verification</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Users must verify their email before accessing</div>
                </div>
                <Switch
                  checked={permissions.requireEmailVerification}
                  onCheckedChange={(checked) => handlePermissionChange({ requireEmailVerification: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/30 transition-all duration-300">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">Require Manual Approval</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Admin must approve each new user</div>
                </div>
                <Switch
                  checked={permissions.requireApproval}
                  onCheckedChange={(checked) => handlePermissionChange({ requireApproval: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-zinc-900/10 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 hover:border-[#00D4FF]/30 dark:hover:border-[#00D4FF]/30 transition-all duration-300">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">Welcome New Members</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Send welcome messages to new users</div>
                </div>
                <Switch
                  checked={permissions.welcomeNewMembers}
                  onCheckedChange={(checked) => handlePermissionChange({ welcomeNewMembers: checked })}
                />
              </div>
            </div>

            {permissions.mode === 'domain-restricted' && (
              <div className="space-y-2">
                <Label htmlFor="domains" className="text-zinc-900 dark:text-white">Allowed Email Domains</Label>
                <Input
                  id="domains"
                  placeholder="example.com, company.org"
                  value={permissions.allowedDomains?.join(', ') || ''}
                  onChange={(e) => {
                    const domains = e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                    handlePermissionChange({ allowedDomains: domains })
                  }}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Separate multiple domains with commas</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#0EA5E9]/10 dark:from-[#00D4FF]/20 dark:to-[#0EA5E9]/20 p-4 rounded-xl border border-[#0EA5E9]/20 dark:border-[#00D4FF]/30">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                <p className="font-medium mb-1 text-zinc-900 dark:text-white">Security Recommendations</p>
                <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Enable email verification for better security</li>
                  <li>• Use domain restrictions for corporate deployments</li>
                  <li>• Enable manual approval for sensitive communities</li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}