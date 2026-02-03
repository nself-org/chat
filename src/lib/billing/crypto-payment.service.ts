/**
 * Crypto Payment Service
 *
 * Handles cryptocurrency payment processing for subscriptions using
 * Coinbase Commerce and direct wallet transfers.
 */

import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export type CryptoProvider = 'coinbase_commerce' | 'stripe_crypto' | 'manual'
export type CryptoCurrency = 'ETH' | 'BTC' | 'USDC' | 'USDT' | 'DAI' | 'MATIC'
export type CryptoNetwork = 'ethereum' | 'bitcoin' | 'polygon' | 'arbitrum' | 'base'
export type CryptoPaymentStatus = 'pending' | 'confirming' | 'completed' | 'failed' | 'expired'

export interface CryptoPaymentConfig {
  provider: CryptoProvider
  acceptedCurrencies: CryptoCurrency[]
  acceptedNetworks: CryptoNetwork[]
  minimumConfirmations: Record<CryptoCurrency, number>
  paymentTimeout: number // seconds
}

export interface CryptoPayment {
  id: string
  workspaceId: string
  subscriptionId?: string
  invoiceId?: string
  userId: string

  // Provider details
  provider: CryptoProvider
  providerPaymentId?: string

  // Cryptocurrency details
  cryptoCurrency: CryptoCurrency
  cryptoAmount: string
  cryptoNetwork: CryptoNetwork

  // Fiat conversion
  fiatAmount: number // cents
  fiatCurrency: string
  exchangeRate: string

  // Transaction details
  transactionHash?: string
  fromAddress?: string
  toAddress?: string
  blockNumber?: string
  confirmations: number

  // Status
  status: CryptoPaymentStatus
  paymentUrl?: string
  expiresAt?: Date
  completedAt?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface CreateCryptoPaymentParams {
  workspaceId: string
  userId: string
  subscriptionId?: string
  invoiceId?: string
  fiatAmount: number // cents
  fiatCurrency?: string
  cryptoCurrency: CryptoCurrency
  cryptoNetwork: CryptoNetwork
  provider: CryptoProvider
}

export interface CryptoPaymentResult {
  success: boolean
  payment?: CryptoPayment
  error?: string
  paymentUrl?: string
}

export interface ExchangeRate {
  currency: CryptoCurrency
  usdPrice: number
  updatedAt: Date
}

// ============================================================================
// Crypto Payment Service
// ============================================================================

export class CryptoPaymentService {
  private config: CryptoPaymentConfig = {
    provider: 'coinbase_commerce',
    acceptedCurrencies: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI'],
    acceptedNetworks: ['ethereum', 'polygon', 'base'],
    minimumConfirmations: {
      ETH: 12,
      BTC: 6,
      USDC: 12,
      USDT: 12,
      DAI: 12,
      MATIC: 60,
    },
    paymentTimeout: 3600, // 1 hour
  }

  private exchangeRateCache: Map<CryptoCurrency, ExchangeRate> = new Map()
  private readonly RATE_CACHE_TTL = 60 * 1000 // 1 minute

  constructor(config?: Partial<CryptoPaymentConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Create a new crypto payment
   */
  async createPayment(params: CreateCryptoPaymentParams): Promise<CryptoPaymentResult> {
    try {
      // Validate currency and network
      if (!this.config.acceptedCurrencies.includes(params.cryptoCurrency)) {
        return {
          success: false,
          error: `${params.cryptoCurrency} is not accepted`,
        }
      }

      if (!this.config.acceptedNetworks.includes(params.cryptoNetwork)) {
        return {
          success: false,
          error: `${params.cryptoNetwork} network is not supported`,
        }
      }

      // Get exchange rate
      const rate = await this.getExchangeRate(params.cryptoCurrency)
      if (!rate) {
        return {
          success: false,
          error: 'Failed to get exchange rate',
        }
      }

      // Calculate crypto amount
      const fiatUSD = params.fiatAmount / 100 // Convert cents to dollars
      const cryptoAmount = (fiatUSD / rate.usdPrice).toFixed(8)

      // Create payment based on provider
      switch (params.provider) {
        case 'coinbase_commerce':
          return await this.createCoinbaseCommercePayment({
            ...params,
            cryptoAmount,
            exchangeRate: rate.usdPrice.toString(),
          })

        case 'manual':
          return await this.createManualPayment({
            ...params,
            cryptoAmount,
            exchangeRate: rate.usdPrice.toString(),
          })

        default:
          return {
            success: false,
            error: `Provider ${params.provider} not supported`,
          }
      }
    } catch (error) {
      logger.error('Error creating crypto payment:', error)
      return {
        success: false,
        error: 'Failed to create payment',
      }
    }
  }

  /**
   * Create payment via Coinbase Commerce
   */
  private async createCoinbaseCommercePayment(params: {
    workspaceId: string
    userId: string
    subscriptionId?: string
    invoiceId?: string
    fiatAmount: number
    fiatCurrency?: string
    cryptoCurrency: CryptoCurrency
    cryptoNetwork: CryptoNetwork
    cryptoAmount: string
    exchangeRate: string
  }): Promise<CryptoPaymentResult> {
    // In production, integrate with Coinbase Commerce API
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error: 'Coinbase Commerce not configured',
      }
    }

    try {
      // Create charge via Coinbase Commerce API
      // const charge = await coinbaseCommerce.charges.create({
      //   name: 'nChat Subscription',
      //   description: 'Subscription payment',
      //   pricing_type: 'fixed_price',
      //   local_price: {
      //     amount: (params.fiatAmount / 100).toString(),
      //     currency: params.fiatCurrency || 'USD',
      //   },
      //   metadata: {
      //     workspaceId: params.workspaceId,
      //     userId: params.userId,
      //     subscriptionId: params.subscriptionId,
      //     invoiceId: params.invoiceId,
      //   },
      // })

      // Mock payment for now
      const payment: CryptoPayment = {
        id: `pay_${Math.random().toString(36).substring(7)}`,
        workspaceId: params.workspaceId,
        subscriptionId: params.subscriptionId,
        invoiceId: params.invoiceId,
        userId: params.userId,
        provider: 'coinbase_commerce',
        providerPaymentId: `charge_${Math.random().toString(36).substring(7)}`,
        cryptoCurrency: params.cryptoCurrency,
        cryptoAmount: params.cryptoAmount,
        cryptoNetwork: params.cryptoNetwork,
        fiatAmount: params.fiatAmount,
        fiatCurrency: params.fiatCurrency || 'USD',
        exchangeRate: params.exchangeRate,
        confirmations: 0,
        status: 'pending',
        paymentUrl: `https://commerce.coinbase.com/charges/mock-charge`,
        expiresAt: new Date(Date.now() + this.config.paymentTimeout * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Save to database
      await this.savePayment(payment)

      return {
        success: true,
        payment,
        paymentUrl: payment.paymentUrl,
      }
    } catch (error) {
      logger.error('Coinbase Commerce error:', error)
      return {
        success: false,
        error: 'Failed to create Coinbase Commerce charge',
      }
    }
  }

  /**
   * Create manual payment (direct wallet transfer)
   */
  private async createManualPayment(params: {
    workspaceId: string
    userId: string
    subscriptionId?: string
    invoiceId?: string
    fiatAmount: number
    fiatCurrency?: string
    cryptoCurrency: CryptoCurrency
    cryptoNetwork: CryptoNetwork
    cryptoAmount: string
    exchangeRate: string
  }): Promise<CryptoPaymentResult> {
    // Generate payment address (in production, use HD wallet)
    const paymentAddress = this.generatePaymentAddress(params.cryptoNetwork)

    const payment: CryptoPayment = {
      id: `pay_${Math.random().toString(36).substring(7)}`,
      workspaceId: params.workspaceId,
      subscriptionId: params.subscriptionId,
      invoiceId: params.invoiceId,
      userId: params.userId,
      provider: 'manual',
      cryptoCurrency: params.cryptoCurrency,
      cryptoAmount: params.cryptoAmount,
      cryptoNetwork: params.cryptoNetwork,
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency || 'USD',
      exchangeRate: params.exchangeRate,
      toAddress: paymentAddress,
      confirmations: 0,
      status: 'pending',
      expiresAt: new Date(Date.now() + this.config.paymentTimeout * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.savePayment(payment)

    return {
      success: true,
      payment,
    }
  }

  /**
   * Verify crypto payment by transaction hash
   */
  async verifyPayment(paymentId: string, transactionHash: string): Promise<CryptoPaymentResult> {
    const payment = await this.getPayment(paymentId)

    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    if (payment.status === 'completed') {
      return {
        success: true,
        payment,
      }
    }

    // Verify transaction on blockchain
    const verified = await this.verifyTransaction(
      transactionHash,
      payment.cryptoNetwork,
      payment.toAddress || '',
      payment.cryptoAmount
    )

    if (!verified.success) {
      return {
        success: false,
        error: verified.error || 'Transaction verification failed',
      }
    }

    // Update payment
    payment.transactionHash = transactionHash
    payment.fromAddress = verified.fromAddress
    payment.blockNumber = verified.blockNumber
    payment.confirmations = verified.confirmations || 0
    payment.status = 'confirming'
    payment.updatedAt = new Date()

    // Check if enough confirmations
    const minConfirmations = this.config.minimumConfirmations[payment.cryptoCurrency]
    if (payment.confirmations >= minConfirmations) {
      payment.status = 'completed'
      payment.completedAt = new Date()
    }

    await this.updatePayment(payment)

    return {
      success: true,
      payment,
    }
  }

  /**
   * Get exchange rate for crypto currency
   */
  async getExchangeRate(currency: CryptoCurrency): Promise<ExchangeRate | null> {
    // Check cache first
    const cached = this.exchangeRateCache.get(currency)
    if (cached && Date.now() - cached.updatedAt.getTime() < this.RATE_CACHE_TTL) {
      return cached
    }

    try {
      // Fetch from API (CoinGecko, CoinMarketCap, etc.)
      // For now, return mock rates
      const mockRates: Record<CryptoCurrency, number> = {
        ETH: 2500,
        BTC: 45000,
        USDC: 1,
        USDT: 1,
        DAI: 1,
        MATIC: 0.8,
      }

      const rate: ExchangeRate = {
        currency,
        usdPrice: mockRates[currency] || 0,
        updatedAt: new Date(),
      }

      this.exchangeRateCache.set(currency, rate)
      return rate
    } catch (error) {
      logger.error('Failed to fetch exchange rate:', error)
      return null
    }
  }

  /**
   * Verify transaction on blockchain
   */
  private async verifyTransaction(
    txHash: string,
    network: CryptoNetwork,
    toAddress: string,
    expectedAmount: string
  ): Promise<{
    success: boolean
    error?: string
    fromAddress?: string
    blockNumber?: string
    confirmations?: number
  }> {
    // In production, verify using blockchain APIs (Etherscan, Blockchain.com, etc.)
    // For now, return mock verification

    return {
      success: true,
      fromAddress: '0x' + '1'.repeat(40),
      blockNumber: '12345678',
      confirmations: 15,
    }
  }

  /**
   * Generate payment address
   */
  private generatePaymentAddress(network: CryptoNetwork): string {
    // In production, generate from HD wallet
    // For now, return mock address
    if (network === 'bitcoin') {
      return 'bc1q' + Math.random().toString(36).substring(2, 42)
    }

    return '0x' + Math.random().toString(36).substring(2, 42).padEnd(40, '0')
  }

  /**
   * Save payment to database
   */
  private async savePayment(payment: CryptoPayment): Promise<void> {
    // await db.cryptoPayments.create(payment)
  }

  /**
   * Update payment in database
   */
  private async updatePayment(payment: CryptoPayment): Promise<void> {
    // await db.cryptoPayments.update(payment.id, payment)
  }

  /**
   * Get payment by ID
   */
  private async getPayment(id: string): Promise<CryptoPayment | null> {
    // return await db.cryptoPayments.findById(id)
    return null
  }

  /**
   * Get payments for workspace
   */
  async getWorkspacePayments(workspaceId: string): Promise<CryptoPayment[]> {
    // return await db.cryptoPayments.find({ workspaceId })
    return []
  }

  /**
   * Process webhook from payment provider
   */
  async processWebhook(provider: CryptoProvider, event: any): Promise<void> {
    switch (provider) {
      case 'coinbase_commerce':
        await this.processCoinbaseWebhook(event)
        break

      default:
      // REMOVED: console.log(`Webhook from unknown provider: ${provider}`)
    }
  }

  /**
   * Process Coinbase Commerce webhook
   */
  private async processCoinbaseWebhook(event: any): Promise<void> {
    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved':
        // Payment confirmed
        await this.handlePaymentConfirmed(event.data)
        break

      case 'charge:failed':
      case 'charge:expired':
        // Payment failed
        await this.handlePaymentFailed(event.data)
        break

      default:
      // REMOVED: console.log(`Unhandled Coinbase event: ${event.type}`)
    }
  }

  /**
   * Handle payment confirmed
   */
  private async handlePaymentConfirmed(charge: any): Promise<void> {
    // Find payment by provider ID
    // const payment = await db.cryptoPayments.findOne({
    //   providerPaymentId: charge.id
    // })
    // Update payment status
    // payment.status = 'completed'
    // payment.completedAt = new Date()
    // await this.updatePayment(payment)
    // Activate subscription or update invoice
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(charge: any): Promise<void> {
    // Find payment by provider ID
    // const payment = await db.cryptoPayments.findOne({
    //   providerPaymentId: charge.id
    // })
    // Update payment status
    // payment.status = 'failed'
    // await this.updatePayment(payment)
  }

  /**
   * Get accepted currencies
   */
  getAcceptedCurrencies(): CryptoCurrency[] {
    return this.config.acceptedCurrencies
  }

  /**
   * Get accepted networks
   */
  getAcceptedNetworks(): CryptoNetwork[] {
    return this.config.acceptedNetworks
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cryptoPaymentService: CryptoPaymentService | null = null

export function getCryptoPaymentService(): CryptoPaymentService {
  if (!cryptoPaymentService) {
    cryptoPaymentService = new CryptoPaymentService()
  }
  return cryptoPaymentService
}
