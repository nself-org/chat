/**
 * Type declarations for WalletConnect Ethereum Provider
 *
 * These types provide TypeScript support for dynamic imports of WalletConnect.
 * The actual package is optional and will be loaded dynamically if available.
 */

declare module '@walletconnect/ethereum-provider' {
  export interface EthereumProviderOptions {
    projectId: string
    metadata?: {
      name: string
      description: string
      url: string
      icons: string[]
    }
    chains?: number[]
    optionalChains?: number[]
    showQrModal?: boolean
    qrModalOptions?: {
      themeMode?: 'light' | 'dark'
      themeVariables?: Record<string, string>
    }
    rpcMap?: Record<number, string>
    methods?: string[]
    optionalMethods?: string[]
    events?: string[]
    optionalEvents?: string[]
  }

  export interface SessionTypes {
    struct: {
      topic: string
      pairingTopic?: string
      relay: { protocol: string }
      expiry: number
      acknowledged: boolean
      controller: string
      namespaces: Record<string, {
        chains?: string[]
        accounts: string[]
        methods: string[]
        events: string[]
      }>
      requiredNamespaces: Record<string, {
        chains?: string[]
        accounts: string[]
        methods: string[]
        events: string[]
      }>
      optionalNamespaces: Record<string, {
        chains?: string[]
        accounts: string[]
        methods: string[]
        events: string[]
      }>
      sessionProperties?: Record<string, string>
    }
  }

  export class EthereumProvider {
    static init(options: EthereumProviderOptions): Promise<EthereumProvider>

    accounts: string[]
    chainId: number
    session: SessionTypes['struct'] | null

    connect(params?: { chains?: number[] }): Promise<void>
    disconnect(): Promise<void>
    request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>
    on(event: string, handler: (...args: unknown[]) => void): void
    removeListener(event: string, handler: (...args: unknown[]) => void): void
    enable(): Promise<string[]>
  }
}

declare module '@walletconnect/modal' {
  export interface WalletConnectModalOptions {
    projectId: string
    chains?: number[]
    themeMode?: 'light' | 'dark'
    themeVariables?: Record<string, string>
  }

  export class WalletConnectModal {
    constructor(options: WalletConnectModalOptions)
    openModal(options?: { uri?: string }): void
    closeModal(): void
    subscribeModal(callback: (state: { open: boolean }) => void): () => void
  }
}
