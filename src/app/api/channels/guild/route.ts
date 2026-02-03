/**
 * Guild/Server Management API (Discord-style)
 * GET /api/channels/guild - List guilds
 * POST /api/channels/guild - Create guild
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema validation
const createGuildSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  vanityUrl: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  isDiscoverable: z.boolean().default(false),
  verificationLevel: z.number().int().min(0).max(4).default(0),
  explicitContentFilter: z.number().int().min(0).max(2).default(0),
  maxMembers: z.number().int().min(10).max(500000).default(5000),
  maxChannels: z.number().int().min(10).max(500).default(100),
  maxFileSizeMb: z.number().int().min(8).max(1024).default(25),
})

const guildFiltersSchema = z.object({
  organizationId: z.string().uuid().optional(),
  isDiscoverable: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

/**
 * GET /api/channels/guild
 * List guilds/servers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = guildFiltersSchema.parse({
      organizationId: searchParams.get('organizationId') || undefined,
      isDiscoverable: searchParams.get('isDiscoverable') === 'true',
      limit: Number(searchParams.get('limit')) || 20,
      offset: Number(searchParams.get('offset')) || 0,
    })

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Fetch guilds from database
    // If organizationId provided, filter by org
    // If isDiscoverable=true, only show public guilds
    // Otherwise show guilds user is a member of

    // Mock response
    const guilds = [
      {
        id: 'guild-1',
        organizationId: filters.organizationId || 'org-1',
        name: 'General Server',
        slug: 'general-server',
        description: 'Main community server',
        iconUrl: null,
        bannerUrl: null,
        vanityUrl: 'general',
        isDiscoverable: true,
        verificationLevel: 1,
        explicitContentFilter: 1,
        systemChannelId: 'channel-1',
        rulesChannelId: 'channel-2',
        memberCount: 1250,
        boostTier: 2,
        boostCount: 15,
        maxMembers: 5000,
        maxChannels: 100,
        maxFileSizeMb: 25,
        ownerId: userId,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      guilds,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: guilds.length,
      },
    })
  } catch (error) {
    console.error('Error fetching guilds:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/channels/guild
 * Create a new guild/server with default channels and categories
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = createGuildSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'
    const organizationId = request.headers.get('x-organization-id') || 'org-1'

    // Generate slug if not provided
    const slug =
      data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // TODO: Check if slug is unique
    // const existingGuild = await getGuildBySlug(slug, organizationId)
    // if (existingGuild) {
    //   return NextResponse.json({ error: 'Guild slug already exists' }, { status: 409 })
    // }

    // TODO: Check if vanity URL is unique (if provided)
    if (data.vanityUrl) {
      // const existingVanity = await getGuildByVanityUrl(data.vanityUrl)
      // if (existingVanity) {
      //   return NextResponse.json({ error: 'Vanity URL already taken' }, { status: 409 })
      // }
    }

    // Create guild with default structure
    const guildId = `guild-${Date.now()}`
    const now = new Date().toISOString()

    const guild = {
      id: guildId,
      organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      iconUrl: data.iconUrl || null,
      bannerUrl: data.bannerUrl || null,
      vanityUrl: data.vanityUrl || null,
      isDiscoverable: data.isDiscoverable,
      verificationLevel: data.verificationLevel,
      explicitContentFilter: data.explicitContentFilter,
      systemChannelId: null, // Will be set after creating default channels
      rulesChannelId: null,
      memberCount: 1, // Creator
      boostTier: 0,
      boostCount: 0,
      maxMembers: data.maxMembers,
      maxChannels: data.maxChannels,
      maxFileSizeMb: data.maxFileSizeMb,
      ownerId: userId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      settings: {},
      features: {},
    }

    // TODO: Create default categories and channels
    const defaultCategories = [
      { name: 'TEXT CHANNELS', position: 0 },
      { name: 'VOICE CHANNELS', position: 1 },
    ]

    const defaultChannels = [
      {
        name: 'general',
        type: 'public',
        categoryName: 'TEXT CHANNELS',
        position: 0,
        isDefault: true,
      },
      {
        name: 'announcements',
        type: 'public',
        categoryName: 'TEXT CHANNELS',
        position: 1,
        isReadonly: true, // Only admins can post
      },
      {
        name: 'General Voice',
        type: 'voice',
        categoryName: 'VOICE CHANNELS',
        position: 0,
      },
    ]

    // TODO: Database transaction to create:
    // 1. Guild
    // 2. Categories
    // 3. Channels
    // 4. Add creator as owner member
    // 5. Set systemChannelId and rulesChannelId

    // Mock created structure
    const createdGuild = {
      ...guild,
      systemChannelId: 'channel-general',
      categories: defaultCategories.map((cat, idx) => ({
        id: `cat-${idx}`,
        workspaceId: guildId,
        name: cat.name,
        position: cat.position,
        createdAt: now,
      })),
      channels: defaultChannels.map((ch, idx) => ({
        id: `channel-${idx}`,
        workspaceId: guildId,
        name: ch.name,
        type: ch.type,
        position: ch.position,
        isDefault: ch.isDefault || false,
        isReadonly: ch.isReadonly || false,
        createdAt: now,
      })),
    }

    // TODO: Broadcast guild creation event
    // await broadcastGuildCreated(createdGuild)

    return NextResponse.json(
      {
        success: true,
        guild: createdGuild,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating guild:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
