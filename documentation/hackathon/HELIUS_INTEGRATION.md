# Helius Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use Helius infrastructure for reliable Solana access

## Overview

Helius provides the fastest, most reliable infrastructure for Solana developers. ICB agents leverage Helius for:

1. **RPC Nodes** - High-performance blockchain data access
2. **DAS API** - NFT and token metadata queries
3. **Enhanced Transactions** - Parsed transaction history
4. **Priority Fee API** - Smart fee estimation
5. **Helius Sender** - Ultra-low latency transaction submission
6. **LaserStream** - Real-time data streaming (gRPC)
7. **Enhanced WebSockets** - Real-time account monitoring

## Why Helius for ICB Agents?

| Agent Need | Helius Solution | Benefit |
|------------|-----------------|---------|
| Fast transaction landing | Helius Sender (staked connections + Jito) | 95%+ landing rate |
| Real-time ILI updates | LaserStream gRPC | Sub-second latency |
| Complete transaction history | `getTransactionsForAddress` | Includes token accounts |
| Optimal priority fees | `getPriorityFeeEstimate` | Balance cost vs speed |
| Token/NFT metadata | DAS API | Unified interface |
| Account monitoring | Enhanced WebSockets | Advanced filtering |

## Setup

### 1. Get API Key

```bash
# Sign up at https://dashboard.helius.dev
# Free tier: 1M credits/month, 10 req/s RPC, 2 req/s DAS
```

### 2. Install SDK

```bash
npm install helius-sdk
```

### 3. Initialize Client

```typescript
import { Helius } from 'helius-sdk';

const helius = new Helius(process.env.HELIUS_API_KEY);
```

## Core Integrations

### 1. RPC Nodes for Blockchain Access

**Use Case**: All agents need reliable RPC access for reading state and sending transactions

**Configuration**:

```typescript
import { Connection } from '@solana/web3.js';

class ICBAgent {
  private connection: Connection;
  
  constructor() {
    // Use Helius RPC endpoint
    this.connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
      }
    );
  }
  
  async getAccountInfo(pubkey: PublicKey) {
    return await this.connection.getAccountInfo(pubkey);
  }
  
  async getBalance(pubkey: PublicKey) {
    return await this.connection.getBalance(pubkey);
  }
}
```

**Rate Limits**:
- Free: 10 req/s
- Developer ($49/mo): 50 req/s
- Business ($499/mo): 200 req/s
- Professional ($999/mo): 500 req/s

### 2. getTransactionsForAddress (Helius-Exclusive)

**Use Case**: Get complete transaction history including token account transactions

**Why It's Better**: Standard `getSignaturesForAddress` misses token transfers. Helius includes them.

```typescript
class TransactionHistoryAgent extends ICBAgent {
  async getCompleteHistory(address: string) {
    const transactions = await helius.rpc.getTransactionsForAddress({
      address,
      limit: 100,
      // Include token account transactions
      tokenAccounts: 'balanceChanged',
      // Filter by time
      before: Date.now() / 1000,
      // Only successful transactions
      status: 'succeeded'
    });
    
    return transactions;
  }
  
  async analyzeWalletActivity(address: string) {
    const txs = await this.getCompleteHistory(address);
    
    // Calculate metrics for ILI
    const totalVolume = txs.reduce((sum, tx) => {
      return sum + (tx.nativeTransfers?.reduce((s, t) => s + t.amount, 0) || 0);
    }, 0);
    
    const avgTxPerDay = txs.length / 7; // Last 7 days
    
    return { totalVolume, avgTxPerDay };
  }
}
```

### 3. Priority Fee API

**Use Case**: All agents need optimal priority fees for transaction landing

**Smart Fee Estimation**:

```typescript
class PriorityFeeAgent extends ICBAgent {
  async getOptimalFee(accountKeys: string[]) {
    const feeEstimate = await helius.rpc.getPriorityFeeEstimate({
      accountKeys,
      options: {
        recommended: true
      }
    });
    
    return {
      min: feeEstimate.priorityFeeEstimate.min,
      low: feeEstimate.priorityFeeEstimate.low,
      medium: feeEstimate.priorityFeeEstimate.medium,
      high: feeEstimate.priorityFeeEstimate.high,
      veryHigh: feeEstimate.priorityFeeEstimate.veryHigh,
      unsafeMax: feeEstimate.priorityFeeEstimate.unsafeMax
    };
  }
  
  async selectFeeLevel(urgency: 'low' | 'medium' | 'high') {
    const ili = await this.getILI();
    const fees = await this.getOptimalFee([]);
    
    // Adjust fee based on ILI and urgency
    if (ili.value < 5000) {
      // Low liquidity - use higher fees
      return urgency === 'high' ? fees.veryHigh : fees.high;
    } else if (ili.value > 7500) {
      // High liquidity - can use lower fees
      return urgency === 'high' ? fees.medium : fees.low;
    } else {
      // Normal conditions
      return fees[urgency];
    }
  }
}
```

**Fee Levels Guide**:
- `min`: Cheapest, may not land
- `low`: Budget-friendly, slower
- `medium`: Balanced (recommended)
- `high`: Fast, reliable
- `veryHigh`: Very fast, expensive
- `unsafeMax`: Fastest, very expensive

### 4. Helius Sender (Transaction Submission)

**Use Case**: All agents need reliable transaction landing

**Why It's Better**: Dual routing through staked connections + Jito = 95%+ landing rate

```typescript
class TransactionSenderAgent extends ICBAgent {
  async sendTransactionWithSender(transaction: Transaction) {
    // Get optimal priority fee
    const fee = await this.selectFeeLevel('medium');
    
    // Add priority fee to transaction
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: fee
      })
    );
    
    // Sign transaction
    transaction.sign(this.keypair);
    
    // Send via Helius Sender (dual routing)
    const signature = await helius.rpc.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    // Wait for confirmation
    const confirmation = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }
    
    return signature;
  }
  
  async executeLendingWithRetry(params: any) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const tx = await this.buildLendingTransaction(params);
        const signature = await this.sendTransactionWithSender(tx);
        console.log(`Lending transaction successful: ${signature}`);
        return signature;
      } catch (error) {
        attempt++;
        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Transaction failed after max retries');
  }
}
```

**Helius Sender Features**:
- Zero credits consumed
- 15 req/s rate limit (all plans)
- 7 global endpoints
- Automatic dual routing

### 5. DAS API for Token/NFT Data

**Use Case**: Agents need token balances and metadata

```typescript
class TokenDataAgent extends ICBAgent {
  async getWalletAssets(address: string) {
    // Get all assets (NFTs + tokens + SOL)
    const assets = await helius.rpc.getAssetsByOwner({
      ownerAddress: address,
      page: 1,
      limit: 1000,
      // Include fungible tokens
      showFungible: true,
      // Include native SOL
      showNativeBalance: true
    });
    
    return {
      nfts: assets.items.filter(a => !a.interface.includes('FungibleToken')),
      tokens: assets.items.filter(a => a.interface.includes('FungibleToken')),
      nativeBalance: assets.nativeBalance
    };
  }
  
  async calculatePortfolioValue(address: string) {
    const assets = await this.getWalletAssets(address);
    
    // Calculate total value
    let totalValue = assets.nativeBalance.lamports / 1e9; // SOL
    
    for (const token of assets.tokens) {
      // Get token price from Birdeye or Jupiter
      const price = await this.getTokenPrice(token.id);
      totalValue += (token.token_info.balance / Math.pow(10, token.token_info.decimals)) * price;
    }
    
    return totalValue;
  }
}
```

### 6. Enhanced Transactions API

**Use Case**: Parse transaction history for analytics

```typescript
class TransactionAnalyticsAgent extends ICBAgent {
  async analyzeTransactionHistory(address: string) {
    const history = await helius.rpc.getTransactionsForAddress({
      address,
      limit: 1000,
      type: ['SWAP', 'TRANSFER', 'NFT_SALE']
    });
    
    // Analyze transaction types
    const stats = {
      swaps: history.filter(tx => tx.type === 'SWAP').length,
      transfers: history.filter(tx => tx.type === 'TRANSFER').length,
      nftSales: history.filter(tx => tx.type === 'NFT_SALE').length,
      totalVolume: 0
    };
    
    // Calculate total volume
    for (const tx of history) {
      if (tx.nativeTransfers) {
        stats.totalVolume += tx.nativeTransfers.reduce((sum, t) => sum + t.amount, 0);
      }
    }
    
    return stats;
  }
  
  async identifyTradingPatterns(address: string) {
    const history = await this.analyzeTransactionHistory(address);
    
    // Determine if address is active trader
    const isActiveTrader = history.swaps > 100;
    const isNFTCollector = history.nftSales > 10;
    
    return { isActiveTrader, isNFTCollector };
  }
}
```

### 7. LaserStream gRPC (Real-Time Streaming)

**Use Case**: Real-time ILI updates and account monitoring

```typescript
import { LaserStreamClient } from '@helius-labs/laserstream';

class RealTimeMonitoringAgent extends ICBAgent {
  private laserStream: LaserStreamClient;
  
  async initialize() {
    this.laserStream = new LaserStreamClient({
      apiKey: process.env.HELIUS_API_KEY,
      network: 'mainnet'
    });
    
    await this.laserStream.connect();
  }
  
  async monitorILIOracle() {
    // Subscribe to ILI oracle account updates
    await this.laserStream.subscribe({
      accounts: [ILI_ORACLE_PUBKEY],
      commitment: 'confirmed'
    });
    
    this.laserStream.on('accountUpdate', async (update) => {
      if (update.account === ILI_ORACLE_PUBKEY) {
        const ili = this.parseILIData(update.data);
        console.log(`ILI updated: ${ili.value}`);
        
        // Execute strategy based on new ILI
        await this.onILIUpdate(ili);
      }
    });
  }
  
  async monitorProposals() {
    // Subscribe to proposal account updates
    await this.laserStream.subscribe({
      accounts: [PROPOSAL_PROGRAM_ID],
      commitment: 'confirmed'
    });
    
    this.laserStream.on('accountUpdate', async (update) => {
      const proposal = this.parseProposalData(update.data);
      
      if (proposal.status === 'Active') {
        // Analyze and vote on proposal
        await this.analyzeAndVote(proposal);
      }
    });
  }
  
  async handleDisconnection() {
    // LaserStream has automatic reconnection with historical replay
    this.laserStream.on('reconnect', async (slot) => {
      console.log(`Reconnected, replaying from slot ${slot}`);
      // No data loss - historical replay fills gaps
    });
  }
}
```

**LaserStream Features**:
- Sub-second latency
- Historical replay after disconnection
- Automatic reconnection
- Multi-node architecture
- Professional plan required for mainnet

### 8. Enhanced WebSockets

**Use Case**: Real-time account monitoring (simpler than gRPC)

```typescript
class WebSocketMonitoringAgent extends ICBAgent {
  private ws: WebSocket;
  
  async connectWebSocket() {
    this.ws = new WebSocket(
      `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    );
    
    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.subscribeToAccounts();
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleAccountUpdate(message);
    });
  }
  
  subscribeToAccounts() {
    // Subscribe to ILI oracle
    this.ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'accountSubscribe',
      params: [
        ILI_ORACLE_PUBKEY,
        {
          encoding: 'base64',
          commitment: 'confirmed'
        }
      ]
    }));
    
    // Subscribe to reserve vault
    this.ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'accountSubscribe',
      params: [
        RESERVE_VAULT_PUBKEY,
        {
          encoding: 'base64',
          commitment: 'confirmed'
        }
      ]
    }));
  }
  
  handleAccountUpdate(message: any) {
    if (message.method === 'accountNotification') {
      const { account, pubkey } = message.params.result.value;
      
      if (pubkey === ILI_ORACLE_PUBKEY) {
        const ili = this.parseILIData(account.data);
        this.onILIUpdate(ili);
      } else if (pubkey === RESERVE_VAULT_PUBKEY) {
        const vault = this.parseVaultData(account.data);
        this.onVaultUpdate(vault);
      }
    }
  }
}
```

## Rate Limiting Strategy

### Credit Costs

| Endpoint | Credits | Notes |
|----------|---------|-------|
| Standard RPC | 1-10 | Most methods 1 credit |
| `getProgramAccounts` | 100 | Expensive, avoid if possible |
| DAS API | 10-100 | `getAssetsByOwner`: 100 credits |
| Enhanced Transactions | 10-50 | `parseTransactions`: 10 credits |
| Priority Fee API | 1 | Very cheap |
| Helius Sender | 0 | Free! |

### Rate Limit Management

```typescript
class RateLimitManager {
  private requestCounts: Map<string, number> = new Map();
  private limits = {
    rpc: 50,  // req/s (Developer plan)
    das: 10   // req/s (Developer plan)
  };
  
  async request(type: 'rpc' | 'das', fn: () => Promise<any>) {
    const count = this.requestCounts.get(type) || 0;
    
    if (count >= this.limits[type]) {
      // Wait 1 second for rate limit reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.requestCounts.set(type, 0);
    }
    
    this.requestCounts.set(type, count + 1);
    return await fn();
  }
}

// Usage
const rateLimiter = new RateLimitManager();

await rateLimiter.request('rpc', async () => {
  return await connection.getAccountInfo(pubkey);
});

await rateLimiter.request('das', async () => {
  return await helius.rpc.getAssetsByOwner({ ownerAddress: address });
});
```

## Complete Agent Example

### Multi-Strategy Agent with Helius

```typescript
class HeliusOptimizedAgent extends ICBAgent {
  private helius: Helius;
  private laserStream: LaserStreamClient;
  private rateLimiter: RateLimitManager;
  
  async initialize() {
    this.helius = new Helius(process.env.HELIUS_API_KEY);
    this.laserStream = new LaserStreamClient({
      apiKey: process.env.HELIUS_API_KEY,
      network: 'mainnet'
    });
    this.rateLimiter = new RateLimitManager();
    
    await this.laserStream.connect();
    await this.setupRealTimeMonitoring();
  }
  
  async setupRealTimeMonitoring() {
    // Monitor ILI oracle with LaserStream
    await this.laserStream.subscribe({
      accounts: [ILI_ORACLE_PUBKEY],
      commitment: 'confirmed'
    });
    
    this.laserStream.on('accountUpdate', async (update) => {
      const ili = this.parseILIData(update.data);
      await this.executeStrategy(ili);
    });
  }
  
  async executeStrategy(ili: any) {
    // Get optimal priority fee
    const fee = await this.rateLimiter.request('rpc', async () => {
      return await this.helius.rpc.getPriorityFeeEstimate({
        accountKeys: [],
        options: { recommended: true }
      });
    });
    
    if (ili.value < 5000) {
      // Low liquidity - withdraw positions
      await this.withdrawAll(fee.priorityFeeEstimate.high);
    } else if (ili.value > 7500) {
      // High liquidity - provide LP
      await this.provideLiquidity(fee.priorityFeeEstimate.medium);
    } else {
      // Normal - maintain positions
      await this.rebalance(fee.priorityFeeEstimate.low);
    }
  }
  
  async provideLiquidity(priorityFee: number) {
    const tx = await this.buildLiquidityTransaction();
    
    // Add priority fee
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee
      })
    );
    
    // Send via Helius Sender
    const signature = await this.helius.rpc.sendTransaction(tx);
    console.log(`Liquidity added: ${signature}`);
  }
  
  async analyzeWalletActivity() {
    // Get complete transaction history
    const history = await this.rateLimiter.request('rpc', async () => {
      return await this.helius.rpc.getTransactionsForAddress({
        address: this.keypair.publicKey.toString(),
        limit: 1000,
        tokenAccounts: 'balanceChanged'
      });
    });
    
    // Calculate metrics
    const metrics = {
      totalTxs: history.length,
      swaps: history.filter(tx => tx.type === 'SWAP').length,
      avgTxPerDay: history.length / 30
    };
    
    return metrics;
  }
}
```

## Testing on Devnet

### Devnet Configuration

```typescript
const heliusDevnet = new Helius(process.env.HELIUS_API_KEY, 'devnet');

const connectionDevnet = new Connection(
  `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
);
```

### Get Devnet SOL

```bash
# Use Helius devnet faucet
curl -X POST https://api.helius.dev/v0/airdrop/devnet \
  -H "Content-Type: application/json" \
  -d '{
    "address": "YOUR_WALLET_ADDRESS",
    "amount": 2
  }'
```

## Best Practices

### 1. Use Helius Sender for All Transactions
- Zero credits
- 95%+ landing rate
- Dual routing (staked + Jito)

### 2. Cache DAS API Responses
- DAS calls are expensive (100 credits)
- Cache for 5-10 minutes
- Use Redis for shared cache

### 3. Use LaserStream for Real-Time Data
- Sub-second latency
- Historical replay
- No polling needed

### 4. Optimize Priority Fees
- Use `getPriorityFeeEstimate`
- Adjust based on ILI
- Balance cost vs speed

### 5. Monitor Rate Limits
- Track requests per second
- Implement backoff strategy
- Upgrade plan if needed

## Resources

- [Helius Documentation](https://docs.helius.dev/)
- [Helius Dashboard](https://dashboard.helius.dev/)
- [Helius Discord](https://discord.com/invite/6GXdee3gBj)
- [Node.js SDK](https://github.com/helius-labs/helius-sdk)
- [Rust SDK](https://github.com/helius-labs/helius-rust-sdk)
- [Status Page](https://helius.statuspage.io/)

## Next Steps

1. Sign up for Helius account
2. Get API key from dashboard
3. Install helius-sdk
4. Test on devnet
5. Deploy to mainnet
6. Monitor usage and upgrade plan as needed

---

**Status**: Integration Guide Complete  
**Next**: Implement Helius-powered agents  
**Last Updated**: February 4, 2026
