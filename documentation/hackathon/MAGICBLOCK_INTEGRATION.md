# MagicBlock Ephemeral Rollups Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use Ephemeral Rollups for ultra-low latency DeFi operations

## Overview

MagicBlock's Ephemeral Rollups (ERs) provide a high-performance execution layer for real-time Solana applications. ICB agents leverage ERs for:

1. **Ultra-low latency operations** - Sub-100ms transaction execution
2. **High-frequency trading** - Execute arbitrage and market making strategies
3. **Real-time state updates** - Monitor ILI/ICR with minimal delay
4. **Cost-effective execution** - Batch operations before committing to base layer
5. **Predictable performance** - Dedicated compute resources for agents

## Why Ephemeral Rollups for ICB Agents?

| Agent Need | MagicBlock Solution | Benefit |
|------------|---------------------|---------|
| Fast arbitrage execution | Sub-100ms latency | Capture fleeting opportunities |
| High-frequency operations | Batch transactions on ER | Lower costs, higher throughput |
| Real-time monitoring | Delegate oracle accounts | Instant state updates |
| Predictable costs | Fixed pricing model | Budget-friendly for agents |
| Composability | SVM compatibility | Use existing Solana programs |

## How Ephemeral Rollups Work

### Core Concepts

**Ephemeral Rollup (ER)**: A temporary, high-performance SVM instance that processes transactions off the main Solana chain before committing state back.

**Delegation**: Temporarily transfer account ownership to an ER for fast execution.

**Commitment**: Finalize ER state changes back to Solana base layer.

**Undelegation**: Return account ownership to base layer after commitment.

### Account Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Solana Base Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Account  │  │ Account  │  │ Account  │                  │
│  │    A     │  │    B     │  │    C     │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │             │             │                          │
│       │ 1. DELEGATE │             │                          │
│       └─────────────┼─────────────┘                          │
│                     │                                         │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Ephemeral Rollup (ER)                           │
│  ┌──────────┐  ┌──────────┐                                 │
│  │ Account  │  │ Account  │                                 │
│  │    A'    │  │    B'    │  (Cloned from base layer)      │
│  └────┬─────┘  └────┬─────┘                                 │
│       │             │                                         │
│       │ 2. EXECUTE  │                                         │
│       │ (Fast, low latency)                                  │
│       │             │                                         │
│       │ 3. COMMIT   │                                         │
│       └─────────────┼─────────────────────────────────────────┘
│                     │
│                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Solana Base Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Account  │  │ Account  │  │ Account  │                  │
│  │    A*    │  │    B*    │  │    C     │  (Updated)       │
│  └────┬─────┘  └────┬─────┘  └──────────┘                  │
│       │             │                                         │
│       │ 4. UNDELEGATE                                        │
│       └─────────────┘                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Steps

1. **Delegate**: Lock accounts on base layer, clone to ER
2. **Execute**: Process transactions on ER with sub-100ms latency
3. **Commit**: Finalize state changes back to base layer
4. **Undelegate**: Unlock accounts, return full control to base layer

## Setup

### 1. Install MagicBlock SDK

```bash
npm install @magicblock-labs/ephemeral-rollups-sdk
```

### 2. Initialize ER Client

```typescript
import { EphemeralRollupClient } from '@magicblock-labs/ephemeral-rollups-sdk';
import { Connection, Keypair } from '@solana/web3.js';

const agentKeypair = Keypair.fromSecretKey(
  Buffer.from(process.env.AGENT_PRIVATE_KEY, 'base64')
);

// Connect to Magic Router (auto-routes to best ER)
const erClient = new EphemeralRollupClient({
  connection: new Connection(process.env.HELIUS_RPC_URL),
  wallet: agentKeypair,
  routerUrl: 'https://router.magicblock.gg'
});
```

### 3. Get Available ER Nodes

```typescript
async function getAvailableERs() {
  const routes = await erClient.getRoutes();
  
  console.log('Available ERs:', routes.map(r => ({
    identity: r.identity,
    region: r.region,
    latency: r.latency,
    capacity: r.capacity
  })));
  
  return routes;
}
```

## Core Integrations

### 1. High-Frequency Arbitrage Agent

**Use Case**: Execute arbitrage opportunities with minimal latency

```typescript
class ArbitrageERAgent extends ICBAgent {
  private erClient: EphemeralRollupClient;
  private delegatedAccounts: Set<string> = new Set();
  
  async initialize() {
    this.erClient = new EphemeralRollupClient({
      connection: this.connection,
      wallet: this.keypair,
      routerUrl: 'https://router.magicblock.gg'
    });
  }
  
  async delegateArbitrageAccounts() {
    // Delegate agent's token accounts to ER
    const accounts = [
      this.getTokenAccount('USDC'),
      this.getTokenAccount('SOL'),
      this.getTokenAccount('ICU')
    ];
    
    for (const account of accounts) {
      await this.erClient.delegate({
        account: account.publicKey,
        commitment: 'confirmed'
      });
      
      this.delegatedAccounts.add(account.publicKey.toString());
      console.log(`Delegated ${account.mint} to ER`);
    }
  }
  
  async executeArbitrageOnER(opportunity: any) {
    // Build arbitrage transaction
    const tx = await this.buildArbitrageTx(opportunity);
    
    // Execute on ER (sub-100ms)
    const signature = await this.erClient.sendTransaction(tx, {
      skipPreflight: false,
      commitment: 'processed' // Fast confirmation on ER
    });
    
    console.log(`Arbitrage executed on ER: ${signature}`);
    
    // Transaction is now in ER state, not yet on base layer
    return signature;
  }
  
  async commitAndUndelegate() {
    // Commit all ER state changes to base layer
    const commitTx = await this.erClient.commit({
      accounts: Array.from(this.delegatedAccounts).map(a => 
        new PublicKey(a)
      )
    });
    
    console.log(`Committed ER state: ${commitTx}`);
    
    // Undelegate accounts
    for (const account of this.delegatedAccounts) {
      await this.erClient.undelegate({
        account: new PublicKey(account)
      });
    }
    
    this.delegatedAccounts.clear();
    console.log('All accounts undelegated');
  }
  
  async runArbitrageSession() {
    // 1. Delegate accounts to ER
    await this.delegateArbitrageAccounts();
    
    // 2. Execute multiple arbitrage trades on ER
    const opportunities = await this.findArbitrageOpportunities();
    
    for (const opp of opportunities) {
      await this.executeArbitrageOnER(opp);
    }
    
    // 3. Commit all changes and undelegate
    await this.commitAndUndelegate();
  }
}
```

### 2. Real-Time ILI Monitoring Agent

**Use Case**: Monitor ILI oracle with minimal latency

```typescript
class ILIMonitoringERAgent extends ICBAgent {
  private erClient: EphemeralRollupClient;
  
  async delegateILIOracle() {
    // Delegate ILI oracle account to ER for real-time monitoring
    await this.erClient.delegate({
      account: ILI_ORACLE_PUBKEY,
      commitment: 'confirmed'
    });
    
    console.log('ILI oracle delegated to ER');
  }
  
  async monitorILIOnER() {
    // Subscribe to ER account updates (sub-100ms latency)
    const subscription = await this.erClient.onAccountChange(
      ILI_ORACLE_PUBKEY,
      async (accountInfo) => {
        const ili = this.parseILIData(accountInfo.data);
        console.log(`ILI updated on ER: ${ili.value}`);
        
        // Execute strategy immediately
        await this.executeStrategyOnER(ili);
      },
      'processed' // Fastest commitment level on ER
    );
    
    return subscription;
  }
  
  async executeStrategyOnER(ili: any) {
    if (ili.value < 5000) {
      // Low liquidity - execute emergency withdrawal on ER
      await this.erClient.sendTransaction(
        await this.buildWithdrawalTx()
      );
    } else if (ili.value > 7500) {
      // High liquidity - provide LP on ER
      await this.erClient.sendTransaction(
        await this.buildLiquidityTx()
      );
    }
  }
}
```

### 3. Prediction Market Agent with ER

**Use Case**: Vote on proposals with minimal latency

```typescript
class PredictionERAgent extends ICBAgent {
  async delegateProposalAccounts(proposalId: number) {
    // Delegate proposal account to ER
    const proposalPDA = this.getProposalPDA(proposalId);
    
    await this.erClient.delegate({
      account: proposalPDA,
      commitment: 'confirmed'
    });
    
    console.log(`Proposal ${proposalId} delegated to ER`);
  }
  
  async voteOnProposalER(proposalId: number, prediction: boolean) {
    // Build vote transaction
    const voteTx = await this.buildVoteTx({
      proposalId,
      prediction,
      stakeAmount: 10000
    });
    
    // Execute vote on ER (instant)
    const signature = await this.erClient.sendTransaction(voteTx);
    
    console.log(`Vote executed on ER: ${signature}`);
    
    return signature;
  }
  
  async batchVotingSession(proposals: number[]) {
    // Delegate all proposal accounts
    for (const proposalId of proposals) {
      await this.delegateProposalAccounts(proposalId);
    }
    
    // Execute multiple votes on ER
    for (const proposalId of proposals) {
      const analysis = await this.analyzeProposal(proposalId);
      
      if (analysis.shouldVote) {
        await this.voteOnProposalER(proposalId, analysis.prediction);
      }
    }
    
    // Commit all votes to base layer
    await this.erClient.commit({
      accounts: proposals.map(id => this.getProposalPDA(id))
    });
    
    console.log('All votes committed to base layer');
  }
}
```

### 4. Liquidity Provision Agent with ER

**Use Case**: Manage LP positions with high frequency

```typescript
class LiquidityERAgent extends ICBAgent {
  async delegateLPPosition(poolAddress: PublicKey) {
    // Delegate LP position account to ER
    const lpPosition = await this.getLPPositionAccount(poolAddress);
    
    await this.erClient.delegate({
      account: lpPosition,
      commitment: 'confirmed'
    });
    
    console.log('LP position delegated to ER');
  }
  
  async rebalanceLPOnER(poolAddress: PublicKey) {
    // Monitor pool state on ER
    const poolState = await this.erClient.getAccountInfo(poolAddress);
    const pool = this.parsePoolData(poolState.data);
    
    // Calculate optimal rebalance
    const rebalance = this.calculateRebalance(pool);
    
    if (rebalance.shouldRebalance) {
      // Execute rebalance on ER
      const tx = await this.buildRebalanceTx(rebalance);
      await this.erClient.sendTransaction(tx);
      
      console.log('LP rebalanced on ER');
    }
  }
  
  async runHighFrequencyLP(poolAddress: PublicKey) {
    // Delegate LP position
    await this.delegateLPPosition(poolAddress);
    
    // Monitor and rebalance every 1 second on ER
    const interval = setInterval(async () => {
      await this.rebalanceLPOnER(poolAddress);
    }, 1000);
    
    // Run for 1 hour
    await new Promise(resolve => setTimeout(resolve, 3600000));
    clearInterval(interval);
    
    // Commit final state and undelegate
    await this.erClient.commit({
      accounts: [await this.getLPPositionAccount(poolAddress)]
    });
    
    await this.erClient.undelegate({
      account: await this.getLPPositionAccount(poolAddress)
    });
  }
}
```

### 5. Market Making Agent with ER

**Use Case**: Provide liquidity with tight spreads and high frequency

```typescript
class MarketMakingERAgent extends ICBAgent {
  async delegateOrderbookAccounts(market: PublicKey) {
    // Delegate orderbook accounts to ER
    const accounts = await this.getOrderbookAccounts(market);
    
    for (const account of accounts) {
      await this.erClient.delegate({
        account,
        commitment: 'confirmed'
      });
    }
    
    console.log('Orderbook accounts delegated to ER');
  }
  
  async placeOrdersOnER(market: PublicKey) {
    // Get current market state from ER
    const marketState = await this.erClient.getAccountInfo(market);
    const midPrice = this.calculateMidPrice(marketState);
    
    // Place bid and ask orders with tight spread
    const spread = 0.001; // 0.1%
    
    const bidTx = await this.buildOrderTx({
      side: 'buy',
      price: midPrice * (1 - spread),
      size: 100
    });
    
    const askTx = await this.buildOrderTx({
      side: 'sell',
      price: midPrice * (1 + spread),
      size: 100
    });
    
    // Execute both orders on ER (instant)
    await Promise.all([
      this.erClient.sendTransaction(bidTx),
      this.erClient.sendTransaction(askTx)
    ]);
    
    console.log('Orders placed on ER');
  }
  
  async runMarketMakingSession(market: PublicKey, durationMs: number) {
    // Delegate orderbook
    await this.delegateOrderbookAccounts(market);
    
    // Update orders every 100ms on ER
    const interval = setInterval(async () => {
      await this.cancelAllOrdersOnER(market);
      await this.placeOrdersOnER(market);
    }, 100);
    
    // Run for specified duration
    await new Promise(resolve => setTimeout(resolve, durationMs));
    clearInterval(interval);
    
    // Commit final state
    await this.erClient.commit({
      accounts: await this.getOrderbookAccounts(market)
    });
  }
}
```

## Magic Router Integration

### Automatic ER Selection

Magic Router automatically routes transactions to the optimal ER based on:
- Account delegation status
- ER node latency
- ER node capacity
- Geographic proximity

```typescript
class MagicRouterAgent extends ICBAgent {
  async sendTransactionViaRouter(tx: Transaction) {
    // Magic Router automatically determines execution environment
    // - If accounts delegated → Route to ER
    // - If accounts undelegated → Route to base layer
    // - If mixed → Error (must be all delegated or all undelegated)
    
    const signature = await this.erClient.sendTransaction(tx);
    
    return signature;
  }
  
  async checkDelegationStatus(account: PublicKey) {
    // Query Magic Router for delegation status
    const status = await this.erClient.getDelegationStatus(account);
    
    return {
      isDelegated: status.delegated,
      erIdentity: status.erIdentity,
      delegatedAt: status.delegatedAt
    };
  }
}
```

## Session Management

### Long-Running ER Sessions

```typescript
class ERSessionManager {
  private activeSessions: Map<string, ERSession> = new Map();
  
  async createSession(sessionId: string, accounts: PublicKey[]) {
    // Delegate accounts
    for (const account of accounts) {
      await this.erClient.delegate({ account });
    }
    
    // Track session
    this.activeSessions.set(sessionId, {
      id: sessionId,
      accounts,
      startTime: Date.now(),
      transactionCount: 0
    });
    
    console.log(`ER session ${sessionId} created`);
  }
  
  async executeInSession(sessionId: string, tx: Transaction) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Execute on ER
    const signature = await this.erClient.sendTransaction(tx);
    session.transactionCount++;
    
    return signature;
  }
  
  async closeSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Commit and undelegate
    await this.erClient.commit({ accounts: session.accounts });
    
    for (const account of session.accounts) {
      await this.erClient.undelegate({ account });
    }
    
    // Remove session
    this.activeSessions.delete(sessionId);
    
    console.log(`ER session ${sessionId} closed`, {
      duration: Date.now() - session.startTime,
      transactions: session.transactionCount
    });
  }
  
  async closeAllSessions() {
    for (const sessionId of this.activeSessions.keys()) {
      await this.closeSession(sessionId);
    }
  }
}
```

## Cost Optimization

### Pricing Model

MagicBlock uses a predictable pricing model:

| Resource | Cost | Notes |
|----------|------|-------|
| Delegation | 0.001 SOL | One-time per account |
| ER Execution | 0.0001 SOL/tx | Much cheaper than base layer |
| Commitment | 0.002 SOL | Finalize to base layer |
| Undelegation | 0.001 SOL | Return to base layer |

### Cost Comparison

**Example: 1000 arbitrage trades**

| Approach | Cost | Latency |
|----------|------|---------|
| Base Layer Only | 1000 × 0.005 SOL = 5 SOL | ~400ms/tx |
| ER Session | 0.001 + (1000 × 0.0001) + 0.002 + 0.001 = 0.104 SOL | ~50ms/tx |
| **Savings** | **4.896 SOL (97.9%)** | **8x faster** |

### Optimization Strategies

1. **Batch operations** - Execute multiple transactions in one ER session
2. **Long sessions** - Keep accounts delegated for extended periods
3. **Selective delegation** - Only delegate hot accounts
4. **Commit strategically** - Commit when necessary, not after every tx
5. **Reuse sessions** - Don't create new sessions unnecessarily

## Complete Agent Example

### Multi-Strategy ER Agent

```typescript
class EROptimizedAgent extends ICBAgent {
  private erClient: EphemeralRollupClient;
  private sessionManager: ERSessionManager;
  
  async initialize() {
    this.erClient = new EphemeralRollupClient({
      connection: this.connection,
      wallet: this.keypair,
      routerUrl: 'https://router.magicblock.gg'
    });
    
    this.sessionManager = new ERSessionManager(this.erClient);
  }
  
  async runFullStrategy() {
    // Create ER session for all agent accounts
    const accounts = [
      this.getTokenAccount('USDC'),
      this.getTokenAccount('SOL'),
      this.getTokenAccount('ICU'),
      ILI_ORACLE_PUBKEY,
      ICR_ORACLE_PUBKEY
    ];
    
    await this.sessionManager.createSession('main', accounts);
    
    try {
      // 1. Monitor ILI on ER (real-time)
      const iliSubscription = await this.monitorILIOnER();
      
      // 2. Execute arbitrage on ER (high frequency)
      const arbitrageInterval = setInterval(async () => {
        const opportunities = await this.findArbitrageOpportunities();
        
        for (const opp of opportunities) {
          const tx = await this.buildArbitrageTx(opp);
          await this.sessionManager.executeInSession('main', tx);
        }
      }, 1000); // Every 1 second
      
      // 3. Rebalance LP on ER (medium frequency)
      const rebalanceInterval = setInterval(async () => {
        const tx = await this.buildRebalanceTx();
        await this.sessionManager.executeInSession('main', tx);
      }, 60000); // Every 1 minute
      
      // Run for 1 hour
      await new Promise(resolve => setTimeout(resolve, 3600000));
      
      // Cleanup
      clearInterval(arbitrageInterval);
      clearInterval(rebalanceInterval);
      iliSubscription.unsubscribe();
      
    } finally {
      // Always close session (commit and undelegate)
      await this.sessionManager.closeSession('main');
    }
  }
  
  async getPerformanceMetrics() {
    const session = this.sessionManager.getSession('main');
    
    return {
      duration: Date.now() - session.startTime,
      transactions: session.transactionCount,
      avgLatency: 50, // ms (ER average)
      totalCost: 0.001 + (session.transactionCount * 0.0001) + 0.002 + 0.001,
      costPerTx: (0.001 + (session.transactionCount * 0.0001) + 0.002 + 0.001) / session.transactionCount
    };
  }
}
```

## Testing on Devnet

### Devnet Configuration

```typescript
const erClientDevnet = new EphemeralRollupClient({
  connection: new Connection('https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY'),
  wallet: testKeypair,
  routerUrl: 'https://router-devnet.magicblock.gg'
});
```

### Test ER Session

```typescript
async function testERSession() {
  // 1. Delegate test account
  const testAccount = Keypair.generate();
  
  await erClientDevnet.delegate({
    account: testAccount.publicKey,
    commitment: 'confirmed'
  });
  
  console.log('Account delegated to ER');
  
  // 2. Execute transactions on ER
  for (let i = 0; i < 10; i++) {
    const tx = new Transaction().add(
      // Your instruction here
    );
    
    const signature = await erClientDevnet.sendTransaction(tx);
    console.log(`TX ${i + 1} executed on ER: ${signature}`);
  }
  
  // 3. Commit to base layer
  await erClientDevnet.commit({
    accounts: [testAccount.publicKey]
  });
  
  console.log('State committed to base layer');
  
  // 4. Undelegate
  await erClientDevnet.undelegate({
    account: testAccount.publicKey
  });
  
  console.log('Account undelegated');
}
```

## Best Practices

### 1. Session Management
- Create sessions for related operations
- Close sessions promptly to free resources
- Handle errors gracefully (always undelegate)

### 2. Commitment Strategy
- Commit periodically (every 5-10 minutes)
- Commit before critical operations
- Commit before undelegating

### 3. Error Handling
- Always undelegate in finally blocks
- Handle delegation failures
- Retry commitment failures

### 4. Performance Optimization
- Batch related transactions
- Use long-running sessions for high-frequency operations
- Monitor ER node health

### 5. Security
- Verify delegation status before executing
- Use fraud-proof mechanism for disputes
- Monitor for abnormal ER behavior

## Integration with ICB Operations

### 1. ILI Calculation with ER

```typescript
async function calculateILIOnER() {
  // Delegate oracle accounts to ER
  await erClient.delegate({ account: PYTH_ORACLE });
  await erClient.delegate({ account: SWITCHBOARD_ORACLE });
  await erClient.delegate({ account: BIRDEYE_ORACLE });
  
  // Calculate ILI on ER (real-time)
  const ili = await calculateILI();
  
  // Commit ILI to base layer
  await erClient.commit({ accounts: [ILI_ORACLE_PUBKEY] });
  
  return ili;
}
```

### 2. Futarchy Voting with ER

```typescript
async function batchVotingOnER(proposals: number[]) {
  // Delegate all proposal accounts
  for (const proposalId of proposals) {
    await erClient.delegate({
      account: getProposalPDA(proposalId)
    });
  }
  
  // Execute votes on ER (instant)
  for (const proposalId of proposals) {
    await voteOnProposalER(proposalId);
  }
  
  // Commit all votes
  await erClient.commit({
    accounts: proposals.map(id => getProposalPDA(id))
  });
}
```

## Resources

- [MagicBlock Documentation](https://docs.magicblock.gg/)
- [Ephemeral Rollups Whitepaper](https://arxiv.org/abs/2311.02650)
- [MagicBlock Discord](https://discord.com/invite/zHFtdVMA6e)
- [MagicBlock GitHub](https://github.com/magicblock-labs)
- [Magic Router](https://www.magicblock.xyz/blog/magic-router)
- [Security Audits](https://docs.magicblock.gg/pages/overview/additional-information/security-and-audits)

## Next Steps

1. Install @magicblock-labs/ephemeral-rollups-sdk
2. Set up Magic Router connection
3. Test delegation on devnet
4. Implement ER sessions for high-frequency operations
5. Monitor performance and costs
6. Deploy to mainnet

---

**Status**: Integration Guide Complete  
**Next**: Implement ER-powered agents  
**Last Updated**: February 4, 2026
