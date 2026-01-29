'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/alert-dialog'
import { CreateRoleInput, EffectivePermissions } from '@/lib/admin/roles/role-types'
import { RoleEditor } from './RoleEditor'

interface CreateRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editorPermissions?: EffectivePermissions | null
  onCreateRole: (input: CreateRoleInput) => Promise<{ success: boolean; errors: string[] }>
  copyFrom?: {
    name: string
    description?: string
    color: string
    icon?: string
    permissions: string[]
  }
}

/**
 * CreateRoleModal - Modal dialog for creating a new role
 */
export function CreateRoleModal({
  open,
  onOpenChange,
  editorPermissions,
  onCreateRole,
  copyFrom,
}: CreateRoleModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])

  const handleSave = async (data: CreateRoleInput) => {
    setIsSubmitting(true)
    setErrors([])

    try {
      const result = await onCreateRole(data)

      if (result.success) {
        onOpenChange(false)
      } else {
        setErrors(result.errors)
      }
    } catch (error) {
      setErrors(['An unexpected error occurred'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const initialData = copyFrom
    ? {
        name: `${copyFrom.name} (Copy)`,
        description: copyFrom.description,
        color: copyFrom.color,
        icon: copyFrom.icon,
        permissions: copyFrom.permissions,
      }
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {copyFrom ? 'Duplicate Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {copyFrom
              ? `Creating a copy of "${copyFrom.name}"`
              : 'Create a new role with custom permissions'}
          </DialogDescription>
        </DialogHeader>

        <RoleEditor
          role={initialData}
          isNew
          editorPermissions={editorPermissions}
          isSubmitting={isSubmitting}
          onSave={(data) => handleSave(data as CreateRoleInput)}
          onCancel={() => onOpenChange(false)}
        />

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <ul className="list-inside list-disc text-sm text-destructive">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateRoleModal
