/**
 * Role-based access control (RBAC) constants
 */

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  GUEST: 'guest',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 100,
  admin: 80,
  moderator: 60,
  member: 40,
  guest: 20,
}

export const PERMISSIONS = {
  // Channel permissions
  CHANNEL_CREATE: 'channel:create',
  CHANNEL_DELETE: 'channel:delete',
  CHANNEL_EDIT: 'channel:edit',
  CHANNEL_ARCHIVE: 'channel:archive',
  CHANNEL_MANAGE_MEMBERS: 'channel:manage_members',

  // Message permissions
  MESSAGE_SEND: 'message:send',
  MESSAGE_EDIT_OWN: 'message:edit_own',
  MESSAGE_EDIT_ANY: 'message:edit_any',
  MESSAGE_DELETE_OWN: 'message:delete_own',
  MESSAGE_DELETE_ANY: 'message:delete_any',
  MESSAGE_PIN: 'message:pin',

  // User permissions
  USER_BAN: 'user:ban',
  USER_KICK: 'user:kick',
  USER_MANAGE_ROLES: 'user:manage_roles',
  USER_VIEW_PROFILES: 'user:view_profiles',

  // Admin permissions
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_AUDIT_LOG: 'admin:audit_log',
  ADMIN_BILLING: 'admin:billing',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.CHANNEL_CREATE,
    PERMISSIONS.CHANNEL_DELETE,
    PERMISSIONS.CHANNEL_EDIT,
    PERMISSIONS.CHANNEL_ARCHIVE,
    PERMISSIONS.CHANNEL_MANAGE_MEMBERS,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_EDIT_OWN,
    PERMISSIONS.MESSAGE_EDIT_ANY,
    PERMISSIONS.MESSAGE_DELETE_OWN,
    PERMISSIONS.MESSAGE_DELETE_ANY,
    PERMISSIONS.MESSAGE_PIN,
    PERMISSIONS.USER_BAN,
    PERMISSIONS.USER_KICK,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.USER_VIEW_PROFILES,
    PERMISSIONS.ADMIN_SETTINGS,
    PERMISSIONS.ADMIN_ANALYTICS,
    PERMISSIONS.ADMIN_AUDIT_LOG,
  ],
  moderator: [
    PERMISSIONS.CHANNEL_CREATE,
    PERMISSIONS.CHANNEL_EDIT,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_EDIT_OWN,
    PERMISSIONS.MESSAGE_EDIT_ANY,
    PERMISSIONS.MESSAGE_DELETE_OWN,
    PERMISSIONS.MESSAGE_DELETE_ANY,
    PERMISSIONS.MESSAGE_PIN,
    PERMISSIONS.USER_KICK,
    PERMISSIONS.USER_VIEW_PROFILES,
  ],
  member: [
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_EDIT_OWN,
    PERMISSIONS.MESSAGE_DELETE_OWN,
    PERMISSIONS.USER_VIEW_PROFILES,
  ],
  guest: [PERMISSIONS.USER_VIEW_PROFILES],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if role A has higher authority than role B
 */
export function hasHigherRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB]
}

/**
 * Check if role A has equal or higher authority than role B
 */
export function hasEqualOrHigherRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB]
}
