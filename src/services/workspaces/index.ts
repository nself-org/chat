/**
 * Workspace Services Index
 *
 * Central export for all workspace-related services.
 */

// Workspace Service
export {
  WorkspaceService,
  getWorkspaceService,
  createWorkspaceService,
  type Workspace,
  type WorkspaceSettings,
  type WorkspaceMember,
  type WorkspaceInvite,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type WorkspaceListOptions,
  type MemberListOptions,
  type CreateInviteOptions,
  type WorkspaceListResult,
  type MemberListResult,
  type InviteListResult,
  type WorkspaceStats,
} from './workspace.service'
