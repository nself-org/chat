# Crypto Wallet Integration

Complete Web3 wallet integration for nself-chat with support for MetaMask, Coinbase Wallet, and WalletConnect.

## Features

- **Wallet Connection**: MetaMask, Coinbase Wallet, WalletConnect support
- **Multi-Chain**: Ethereum, Polygon, Arbitrum, Base, and more
- **Token Management**: View ERC-20 token balances and transfer
- **NFT Gallery**: Display owned NFTs with metadata
- **Transaction History**: Track pending and confirmed transactions
- **Token Gating**: Restrict channel/content access based on token ownership
- **Crypto Tipping**: Send tips to message authors
- **Wallet Login**: Sign-in with Ethereum (SIWE)

## Architecture

### Core Infrastructure (`src/lib/wallet/`)
- **wallet-connector.ts** (850 lines): Wallet connection, chain switching, signing
- **token-manager.ts** (877 lines): ERC-20/NFT operations, balance checking
- **transaction-manager.ts** (950 lines): Transaction building, gas estimation, receipts

### State Management (`src/stores/`)
- **wallet-store.ts**: Zustand store for wallet state, tokens, NFTs, transactions

### Hooks (`src/hooks/`)
- **use-wallet.ts**: Wallet connection/disconnection, chain switching
- **use-tokens.ts**: Token balance fetching, transfers, token gating
- **use-nfts.ts**: NFT fetching, ownership verification, NFT gating
- **use-transactions.ts**: Send transactions, estimate gas, track history

### Components (`src/components/wallet/`)
- **WalletConnectButton**: Connect wallet button
- **WalletModal**: Wallet selection and details modal
- **WalletStatus**: Connected wallet dropdown
- **TransactionModal**: Send/receive crypto modal
- **TokenList**: Display token balances
- **NFTGallery**: Display NFT collection
- **TransactionHistory**: Transaction list with status
- **TokenGate**: Component for token-gated content
- **TipButton**: Send crypto tips

## Quick Start

### 1. Connect Wallet

```tsx
import { WalletConnectButton, WalletModal } from '@/components/wallet';

export function MyComponent() {
  return (
    <>
      <WalletConnectButton />
      <WalletModal />
    </>
  );
}
```

### 2. Use Wallet State

```tsx
import { useWallet } from '@/hooks/use-wallet';

export function MyComponent() {
  const { isConnected, address, balance, connect, disconnect } = useWallet();

  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={() => connect()}>Connect</button>
      )}
    </div>
  );
}
```

### 3. Send Transactions

```tsx
import { useTransactions } from '@/hooks/use-transactions';
import { toast } from 'sonner';

export function SendButton() {
  const { sendETH } = useTransactions();

  const handleSend = async () => {
    const result = await sendETH(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      '0.01'
    );

    if (result.success) {
      toast.success('Transaction sent!');
    } else {
      toast.error(result.error);
    }
  };

  return <button onClick={handleSend}>Send 0.01 ETH</button>;
}
```

### 4. Display Tokens

```tsx
import { TokenList } from '@/components/wallet';

export function MyTokens() {
  return <TokenList />;
}
```

### 5. Display NFTs

```tsx
import { NFTGallery } from '@/components/wallet';

export function MyNFTs() {
  return (
    <NFTGallery
      contractAddresses={[
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
        '0x60E4d786628Fea6478F785A6d7e704777c86a7c6', // MAYC
      ]}
    />
  );
}
```

## Token Gating

### Basic Token Gating

```tsx
import { TokenGate } from '@/components/wallet';

export function ExclusiveChannel() {
  return (
    <TokenGate
      config={{
        type: 'token',
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        minimumBalance: '1000000', // 1 USDC (6 decimals)
      }}
    >
      <div>Exclusive content for USDC holders</div>
    </TokenGate>
  );
}
```

### NFT Gating

```tsx
import { TokenGate } from '@/components/wallet';

export function NFTChannel() {
  return (
    <TokenGate
      config={{
        type: 'nft',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
      }}
    >
      <div>Exclusive content for BAYC holders</div>
    </TokenGate>
  );
}
```

### Custom Fallback

```tsx
<TokenGate
  config={{ type: 'token', contractAddress: '0x...', minimumBalance: '1000' }}
  fallback={
    <div>
      <h3>Access Denied</h3>
      <p>You need 1000 tokens to access this channel</p>
    </div>
  }
>
  <div>Gated content</div>
</TokenGate>
```

### Token Gate Badge

```tsx
import { TokenGateBadge } from '@/components/wallet';

export function ChannelItem() {
  return (
    <div>
      <span>Exclusive Channel</span>
      <TokenGateBadge
        config={{
          type: 'token',
          contractAddress: '0x...',
          minimumBalance: '1000',
        }}
      />
    </div>
  );
}
```

### Hook-Based Token Gating

```tsx
import { useTokenGate } from '@/components/wallet';

export function MyComponent() {
  const { hasAccess, isChecking } = useTokenGate({
    type: 'token',
    contractAddress: '0x...',
    minimumBalance: '1000',
  });

  if (isChecking) return <div>Checking access...</div>;
  if (!hasAccess) return <div>Access denied</div>;

  return <div>Exclusive content</div>;
}
```

## Crypto Tipping

### Message Tipping

```tsx
import { TipButton } from '@/components/wallet';

export function Message({ author, authorWallet }) {
  return (
    <div>
      <div>{author.name}: Great idea!</div>
      <TipButton
        recipientAddress={authorWallet}
        recipientName={author.name}
        showLabel
      />
    </div>
  );
}
```

### Custom Tip Modal

```tsx
import { useTransactions } from '@/hooks/use-transactions';

export function CustomTip({ to }) {
  const { sendETH } = useTransactions();

  const handleTip = async (amount: string) => {
    const result = await sendETH(to, amount);
    // Handle result
  };

  return (
    <button onClick={() => handleTip('0.01')}>
      Send 0.01 ETH Tip
    </button>
  );
}
```

## Advanced Usage

### Switch Networks

```tsx
import { useWallet } from '@/hooks/use-wallet';

export function NetworkSwitcher() {
  const { chainId, switchChain } = useWallet();

  const handleSwitch = async () => {
    const result = await switchChain('0x89'); // Polygon
    if (result.success) {
      console.log('Switched to Polygon');
    }
  };

  return <button onClick={handleSwitch}>Switch to Polygon</button>;
}
```

### Sign Messages

```tsx
import { useWallet } from '@/hooks/use-wallet';

export function SignButton() {
  const { signMessage } = useWallet();

  const handleSign = async () => {
    const result = await signMessage('Hello, Web3!');
    if (result.success) {
      console.log('Signature:', result.data.signature);
    }
  };

  return <button onClick={handleSign}>Sign Message</button>;
}
```

### Transfer Tokens

```tsx
import { useTokens } from '@/hooks/use-tokens';

export function TokenTransfer() {
  const { transferTokens, parseTokenAmount } = useTokens();

  const handleTransfer = async () => {
    const amount = parseTokenAmount('100', 6); // 100 USDC

    const result = await transferTokens({
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      to: '0x...',
      amount,
    });

    if (result.success) {
      console.log('Transfer successful:', result.data);
    }
  };

  return <button onClick={handleTransfer}>Send 100 USDC</button>;
}
```

### Check Token Balance

```tsx
import { useTokens } from '@/hooks/use-tokens';

export function TokenChecker() {
  const { hasMinimumTokenBalance } = useTokens();

  const checkAccess = async () => {
    const hasAccess = await hasMinimumTokenBalance(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '1000000' // 1 USDC
    );

    console.log('Has access:', hasAccess);
  };

  return <button onClick={checkAccess}>Check Balance</button>;
}
```

### Verify NFT Ownership

```tsx
import { useNFTs } from '@/hooks/use-nfts';

export function NFTChecker() {
  const { isNFTOwner } = useNFTs();

  const checkOwnership = async () => {
    const result = await isNFTOwner(
      '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
      '1234' // Token ID
    );

    if (result.success && result.data) {
      console.log('User owns this NFT');
    }
  };

  return <button onClick={checkOwnership}>Check Ownership</button>;
}
```

## Supported Chains

| Chain | Chain ID | RPC | Explorer |
|-------|----------|-----|----------|
| Ethereum Mainnet | 0x1 | https://mainnet.infura.io/v3/ | https://etherscan.io |
| Goerli Testnet | 0x5 | https://goerli.infura.io/v3/ | https://goerli.etherscan.io |
| Sepolia Testnet | 0xaa36a7 | https://sepolia.infura.io/v3/ | https://sepolia.etherscan.io |
| Polygon | 0x89 | https://polygon-rpc.com | https://polygonscan.com |
| Polygon Mumbai | 0x13881 | https://rpc-mumbai.maticvigil.com | https://mumbai.polygonscan.com |
| Arbitrum One | 0xa4b1 | https://arb1.arbitrum.io/rpc | https://arbiscan.io |
| Optimism | 0xa | https://mainnet.optimism.io | https://optimistic.etherscan.io |
| Base | 0x2105 | https://mainnet.base.org | https://basescan.org |
| BNB Chain | 0x38 | https://bsc-dataseed.binance.org | https://bscscan.com |

## Error Handling

```tsx
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

export function MyComponent() {
  const { connect, error } = useWallet();

  const handleConnect = async () => {
    const result = await connect({ provider: 'metamask' });

    if (!result.success) {
      if (result.error?.includes('User rejected')) {
        toast.error('Connection cancelled');
      } else if (result.error?.includes('not found')) {
        toast.error('Please install MetaMask');
      } else {
        toast.error(result.error ?? 'Failed to connect');
      }
    }
  };

  return <button onClick={handleConnect}>Connect</button>;
}
```

## Best Practices

1. **Always Check Connection**: Verify `isConnected` before performing wallet operations
2. **Handle Errors**: All hooks return error messages, always display them to users
3. **Gas Estimation**: Estimate gas before sending transactions to warn users
4. **Chain Validation**: Check current chain before executing chain-specific operations
5. **Loading States**: Show loading indicators during blockchain operations
6. **Balance Checks**: Verify sufficient balance before transactions
7. **Address Validation**: Validate addresses before sending transactions

## Example: Complete Integration

```tsx
'use client';

import {
  WalletConnectButton,
  WalletModal,
  TransactionModal,
  TokenList,
  NFTGallery,
  TransactionHistory,
} from '@/components/wallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/hooks/use-wallet';

export default function WalletPage() {
  const { isConnected } = useWallet();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1>My Wallet</h1>
        <WalletConnectButton />
      </div>

      {isConnected ? (
        <Tabs defaultValue="tokens">
          <TabsList>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens">
            <TokenList />
          </TabsContent>

          <TabsContent value="nfts">
            <NFTGallery contractAddresses={['0x...']} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-16">
          <p>Connect your wallet to get started</p>
        </div>
      )}

      <WalletModal />
      <TransactionModal />
    </div>
  );
}
```

## Testing

For testing purposes, you can use:
- **Testnet Faucets**: Get free testnet ETH
  - Goerli: https://goerlifaucet.com/
  - Sepolia: https://sepoliafaucet.com/
  - Mumbai: https://faucet.polygon.technology/
- **Test NFTs**: Deploy test NFT contracts on testnets
- **Mock Data**: Use the wallet store to set mock data during development

## Troubleshooting

### MetaMask Not Detected
```tsx
const { connect, getAvailableProviders } = useWallet();

if (!getAvailableProviders().includes('metamask')) {
  window.open('https://metamask.io/download/', '_blank');
}
```

### Wrong Network
```tsx
const { chainId, switchChain } = useWallet();

if (chainId !== '0x1') {
  await switchChain('0x1'); // Switch to Ethereum
}
```

### Insufficient Balance
```tsx
const { balance, weiToEther } = useWallet();
const balanceEth = parseFloat(weiToEther(balance ?? '0'));

if (balanceEth < 0.01) {
  alert('Insufficient balance');
}
```

## Future Enhancements

- [ ] WalletConnect v2 integration
- [ ] ENS name resolution
- [ ] Multi-wallet support (connect multiple wallets)
- [ ] Transaction simulation before sending
- [ ] Gas price recommendations (slow/standard/fast)
- [ ] Token swap integration (Uniswap, 1inch)
- [ ] NFT marketplace integration
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Social recovery
- [ ] Account abstraction (ERC-4337)

## Resources

- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [EIP-712: Typed Data Signing](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1193: Provider API](https://eips.ethereum.org/EIPS/eip-1193)
- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [ERC-721 NFT Standard](https://eips.ethereum.org/EIPS/eip-721)
- [MetaMask Documentation](https://docs.metamask.io/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
