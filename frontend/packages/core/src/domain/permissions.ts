/**
 * Permission checking domain logic
 */

import { ROLE_PERMISSIONS, type Permission, type Role } from '../constants/roles'

export interface PermissionContext {
  userId: string
  role: Role
  channelId?: string
  resourceOwnerId?: string
}

/**
 * Check if user has a specific permission
 */
export function checkPermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  // Check role-based permissions
  if (!ROLE_PERMISSIONS[context.role]?.includes(permission)) {
    return false
  }

  // Additional context-based checks
  if (permission.includes(':own') && context.resourceOwnerId) {
    return context.userId === context.resourceOwnerId
  }

  return true
}

/**
 * Check multiple permissions (all must pass)
 */
export function checkPermissions(
  context: PermissionContext,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => checkPermission(context, permission))
}

/**
 * Check if any of the given permissions pass
 */
export function checkAnyPermission(
  context: PermissionContext,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => checkPermission(context, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}
