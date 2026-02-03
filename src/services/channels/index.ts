/**
 * Channel Services Index
 *
 * Central export for all channel-related services.
 */

// Channel Service
export {
  ChannelService,
  getChannelService,
  createChannelService,
  type Channel,
  type CreateChannelInput,
  type UpdateChannelInput,
  type ChannelListOptions,
  type SearchChannelsOptions,
  type ChannelListResult,
} from './channel.service'

// Membership Service
export {
  MembershipService,
  getMembershipService,
  createMembershipService,
  type ChannelMember,
  type MembershipDetails,
  type UserChannelInfo,
  type MemberListResult,
} from './membership.service'

// Permissions Service
export {
  PermissionsService,
  getPermissionsService,
  createPermissionsService,
  type ChannelPermission,
  type ChannelPermissionContext,
} from './permissions.service'

// Category Service
export {
  CategoryService,
  getCategoryService,
  createCategoryService,
  type Category,
  type CategoryListOptions,
  type CategoryListResult,
  type MoveChannelOptions,
} from './category.service'
