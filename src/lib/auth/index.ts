/**
 * Auth Library Index
 *
 * Exports all authentication and authorization utilities.
 */

// Role definitions and utilities
export {
  type UserRole,
  ROLE_LEVELS,
  ROLE_METADATA,
  ALL_ROLES,
  ADMIN_ROLES,
  MODERATOR_ROLES,
  CHAT_ROLES,
  getRoleLevel,
  hasRoleOrHigher,
  hasHigherRole,
  compareRoles,
  getRolesAtOrBelow,
  getRolesAtOrAbove,
  isRoleAllowed,
  isAdmin,
  isModerator,
  isOwner,
  isGuest,
  getRoleMetadata,
  getNextHigherRole,
  getNextLowerRole,
  getAssignableRoles,
  canModifyUserRole,
} from './roles'

// Permission definitions and utilities
export {
  type Permission,
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,
  getPermissionsForRole,
  roleHasPermission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getMinimumRoleForPermission,
  getPermissionDescription,
} from './permissions'
