/**
 * Token Gate Service
 *
 * Manages token-gated channel access using NFT and token ownership verification.
 * Supports ERC-20, ERC-721, and ERC-1155 tokens across multiple chains.
 */

import { getTokenManager } from '@/lib/wallet/token-manager'
import { getWalletConnector } from '@/lib/wallet/wallet-connector'
import type { ChainId } from '@/lib/wallet/wallet-connector'

import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export type TokenGateType = 'erc20' | 'erc721' | 'erc1155'

export interface TokenGateConfig {
  id: string
  channelId: string
  gateType: TokenGateType
  contractAddress: string
  chainId: ChainId
  networkName: string
  tokenName?: string
  tokenSymbol?: string
  minimumBalance?: string // For ERC-20
  requiredTokenIds?: string[] // For specific NFTs
  isActive: boolean
  bypassRoles: string[] // Roles that bypass the gate
  cacheTTL: number // Cache verification for N seconds
}

export interface TokenGateVerification {
  channelId: string
  userId: string
  walletAddress: string
  chainId: ChainId
  isVerified: boolean
  balance?: string
  tokenIds?: string[]
  verificationMethod: 'on_chain' | 'cached' | 'api'
  accessGranted: boolean
  denialReason?: string
  verifiedAt: Date
  expiresAt: Date
}

export interface AccessCheckResult {
  hasAccess: boolean
  reason?: string
  verification?: TokenGateVerification
  requiresVerification: boolean
  bypassedByRole: boolean
}

// ============================================================================
// Token Gate Service
// ============================================================================

export class TokenGateService {
  private verificationCache = new Map<
    string,
    {
      verification: TokenGateVerification
      expiresAt: number
    }
  >()

  /**
   * Check if user has access to token-gated channel
   */
  async checkAccess(
    channelId: string,
    userId: string,
    userRole: string,
    walletAddress?: string
  ): Promise<AccessCheckResult> {
    // Get token gate config for channel
    const gateConfig = await this.getTokenGate(channelId)

    if (!gateConfig) {
      return {
        hasAccess: true,
        requiresVerification: false,
        bypassedByRole: false,
      }
    }

    if (!gateConfig.isActive) {
      return {
        hasAccess: true,
        requiresVerification: false,
        bypassedByRole: false,
      }
    }

    // Check if user role bypasses gate
    if (gateConfig.bypassRoles.includes(userRole)) {
      return {
        hasAccess: true,
        requiresVerification: false,
        bypassedByRole: true,
        reason: `Access granted by ${userRole} role`,
      }
    }

    // Wallet address required for verification
    if (!walletAddress) {
      return {
        hasAccess: false,
        requiresVerification: true,
        bypassedByRole: false,
        reason: 'Wallet connection required to verify token ownership',
      }
    }

    // Check cache first
    const cached = this.getCachedVerification(channelId, walletAddress)
    if (cached && cached.accessGranted) {
      return {
        hasAccess: true,
        requiresVerification: false,
        bypassedByRole: false,
        verification: cached,
      }
    }

    // Perform verification
    const verification = await this.verifyTokenOwnership(gateConfig, userId, walletAddress)

    // Cache result
    this.cacheVerification(channelId, walletAddress, verification, gateConfig.cacheTTL)

    // Store verification in database
    await this.saveVerification(verification)

    return {
      hasAccess: verification.accessGranted,
      requiresVerification: false,
      bypassedByRole: false,
      verification,
      reason: verification.denialReason,
    }
  }

  /**
   * Verify token ownership for a wallet address
   */
  async verifyTokenOwnership(
    config: TokenGateConfig,
    userId: string,
    walletAddress: string
  ): Promise<TokenGateVerification> {
    const tokenManager = getTokenManager()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + config.cacheTTL * 1000)

    try {
      switch (config.gateType) {
        case 'erc20':
          return await this.verifyERC20(config, userId, walletAddress, tokenManager, now, expiresAt)

        case 'erc721':
          return await this.verifyERC721(
            config,
            userId,
            walletAddress,
            tokenManager,
            now,
            expiresAt
          )

        case 'erc1155':
          return await this.verifyERC1155(config, userId, walletAddress, now, expiresAt)

        default:
          throw new Error(`Unsupported gate type: ${config.gateType}`)
      }
    } catch (error) {
      logger.error('Token ownership verification failed:', error)

      return {
        channelId: config.channelId,
        userId,
        walletAddress,
        chainId: config.chainId,
        isVerified: false,
        verificationMethod: 'on_chain',
        accessGranted: false,
        denialReason: 'Verification failed',
        verifiedAt: now,
        expiresAt,
      }
    }
  }

  /**
   * Verify ERC-20 token balance
   */
  private async verifyERC20(
    config: TokenGateConfig,
    userId: string,
    walletAddress: string,
    tokenManager: any,
    now: Date,
    expiresAt: Date
  ): Promise<TokenGateVerification> {
    const balanceResult = await tokenManager.getTokenBalance(
      config.contractAddress,
      walletAddress,
      config.chainId
    )

    if (!balanceResult.success || !balanceResult.data) {
      return {
        channelId: config.channelId,
        userId,
        walletAddress,
        chainId: config.chainId,
        isVerified: false,
        verificationMethod: 'on_chain',
        accessGranted: false,
        denialReason: 'Failed to check token balance',
        verifiedAt: now,
        expiresAt,
      }
    }

    const balance = BigInt(balanceResult.data.balance)
    const required = BigInt(config.minimumBalance || '1')

    const hasEnough = balance >= required

    return {
      channelId: config.channelId,
      userId,
      walletAddress,
      chainId: config.chainId,
      isVerified: true,
      balance: balance.toString(),
      verificationMethod: 'on_chain',
      accessGranted: hasEnough,
      denialReason: hasEnough
        ? undefined
        : `Insufficient token balance. Required: ${required.toString()}, Current: ${balance.toString()}`,
      verifiedAt: now,
      expiresAt,
    }
  }

  /**
   * Verify ERC-721 NFT ownership
   */
  private async verifyERC721(
    config: TokenGateConfig,
    userId: string,
    walletAddress: string,
    tokenManager: any,
    now: Date,
    expiresAt: Date
  ): Promise<TokenGateVerification> {
    // If specific token IDs are required
    if (config.requiredTokenIds && config.requiredTokenIds.length > 0) {
      // Check if user owns any of the required token IDs
      const ownedTokenIds: string[] = []

      for (const tokenId of config.requiredTokenIds) {
        const ownerResult = await tokenManager.isNFTOwner(
          config.contractAddress,
          tokenId,
          walletAddress
        )

        if (ownerResult.success && ownerResult.data) {
          ownedTokenIds.push(tokenId)
        }
      }

      const hasAccess = ownedTokenIds.length > 0

      return {
        channelId: config.channelId,
        userId,
        walletAddress,
        chainId: config.chainId,
        isVerified: true,
        tokenIds: ownedTokenIds,
        verificationMethod: 'on_chain',
        accessGranted: hasAccess,
        denialReason: hasAccess ? undefined : 'You do not own any of the required NFTs',
        verifiedAt: now,
        expiresAt,
      }
    }

    // Otherwise check if user owns any NFT from the collection
    const balanceResult = await tokenManager.getNFTBalance(config.contractAddress, walletAddress)

    if (!balanceResult.success) {
      return {
        channelId: config.channelId,
        userId,
        walletAddress,
        chainId: config.chainId,
        isVerified: false,
        verificationMethod: 'on_chain',
        accessGranted: false,
        denialReason: 'Failed to check NFT balance',
        verifiedAt: now,
        expiresAt,
      }
    }

    const hasNFT = (balanceResult.data || 0) > 0

    return {
      channelId: config.channelId,
      userId,
      walletAddress,
      chainId: config.chainId,
      isVerified: true,
      balance: (balanceResult.data || 0).toString(),
      verificationMethod: 'on_chain',
      accessGranted: hasNFT,
      denialReason: hasNFT ? undefined : 'You do not own any NFTs from this collection',
      verifiedAt: now,
      expiresAt,
    }
  }

  /**
   * Verify ERC-1155 token ownership
   */
  private async verifyERC1155(
    config: TokenGateConfig,
    userId: string,
    walletAddress: string,
    now: Date,
    expiresAt: Date
  ): Promise<TokenGateVerification> {
    // ERC-1155 verification would require additional implementation
    // For now, return not supported
    return {
      channelId: config.channelId,
      userId,
      walletAddress,
      chainId: config.chainId,
      isVerified: false,
      verificationMethod: 'on_chain',
      accessGranted: false,
      denialReason: 'ERC-1155 verification not yet implemented',
      verifiedAt: now,
      expiresAt,
    }
  }

  /**
   * Create a token gate for a channel
   */
  async createTokenGate(
    channelId: string,
    config: Omit<TokenGateConfig, 'id' | 'channelId'>
  ): Promise<TokenGateConfig> {
    // In production, this would save to database
    // For now, return mock implementation
    const tokenGate: TokenGateConfig = {
      id: Math.random().toString(36).substring(7),
      channelId,
      ...config,
    }

    // await db.tokenGates.create(tokenGate)

    return tokenGate
  }

  /**
   * Update a token gate
   */
  async updateTokenGate(
    gateId: string,
    updates: Partial<Omit<TokenGateConfig, 'id' | 'channelId'>>
  ): Promise<TokenGateConfig | null> {
    // return await db.tokenGates.update(gateId, updates)
    return null
  }

  /**
   * Delete a token gate
   */
  async deleteTokenGate(gateId: string): Promise<boolean> {
    // await db.tokenGates.delete(gateId)

    // Clear cache for this gate
    for (const [key] of this.verificationCache) {
      if (key.startsWith(`${gateId}:`)) {
        this.verificationCache.delete(key)
      }
    }

    return true
  }

  /**
   * Get token gate for a channel
   */
  private async getTokenGate(channelId: string): Promise<TokenGateConfig | null> {
    // return await db.tokenGates.findOne({ channelId })
    return null
  }

  /**
   * Get cached verification
   */
  private getCachedVerification(
    channelId: string,
    walletAddress: string
  ): TokenGateVerification | null {
    const cacheKey = `${channelId}:${walletAddress}`
    const cached = this.verificationCache.get(cacheKey)

    if (!cached) return null
    if (Date.now() > cached.expiresAt) {
      this.verificationCache.delete(cacheKey)
      return null
    }

    return cached.verification
  }

  /**
   * Cache verification result
   */
  private cacheVerification(
    channelId: string,
    walletAddress: string,
    verification: TokenGateVerification,
    ttlSeconds: number
  ): void {
    const cacheKey = `${channelId}:${walletAddress}`
    const expiresAt = Date.now() + ttlSeconds * 1000

    this.verificationCache.set(cacheKey, {
      verification,
      expiresAt,
    })
  }

  /**
   * Save verification to database
   */
  private async saveVerification(verification: TokenGateVerification): Promise<void> {
    // await db.tokenGateVerifications.create(verification)
  }

  /**
   * Get verification history for a user
   */
  async getVerificationHistory(
    userId: string,
    channelId?: string
  ): Promise<TokenGateVerification[]> {
    // return await db.tokenGateVerifications.find({ userId, channelId })
    return []
  }

  /**
   * Clear expired verifications from cache
   */
  clearExpiredCache(): void {
    const now = Date.now()

    for (const [key, cached] of this.verificationCache) {
      if (now > cached.expiresAt) {
        this.verificationCache.delete(key)
      }
    }
  }

  /**
   * Get all token-gated channels for a workspace
   */
  async getTokenGatedChannels(workspaceId: string): Promise<TokenGateConfig[]> {
    // return await db.tokenGates.find({ workspaceId })
    return []
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let tokenGateService: TokenGateService | null = null

export function getTokenGateService(): TokenGateService {
  if (!tokenGateService) {
    tokenGateService = new TokenGateService()

    // Clear expired cache every 5 minutes
    setInterval(
      () => {
        tokenGateService?.clearExpiredCache()
      },
      5 * 60 * 1000
    )
  }

  return tokenGateService
}
