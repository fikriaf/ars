# x402-PayAI Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use x402 protocol for seamless stablecoin payments

## Overview

x402 is an open payment protocol that brings stablecoin payments to plain HTTP using the `HTTP 402 Payment Required` status code. ICB agents leverage x402 for:

1. **Pay-per-request API access** - Agents pay for DeFi data and operations
2. **Micropayments** - USDC payments on Solana for small transactions
3. **Zero friction** - No accounts, API keys, or session management
4. **Agent-native** - AI agents can discover and pay automatically
5. **Usage-based pricing** - Pay only for what you use

## Why x402 for ICB Agents?

| Agent Need | x402 Solution | Benefit |
|------------|---------------|---------|
| Access premium DeFi data | Pay-per-request with USDC | No subscriptions needed |
| Execute cross-protocol operations | Micropayments for API calls | Cost-effective |
| Autonomous payments | HTTP 402 status code | No human approval |
| Transparent pricing | Payment instructions in response | Predictable costs |
| Fast settlement | Solana blockchain | Sub-second finality |

## How x402 Works

### High-Level Flow

```
┌─────────┐                                    ┌─────────┐
│  Agent  │                                    │  Server │
│ (Buyer) │                                    │(Seller) │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  1. GET /api/ili                             │
     │─────────────────────────────────────────────>│
     │                                              │
     │  2. 402 Payment Required                     │
     │     + Payment Instructions                   │
     │<─────────────────────────────────────────────│
     │                                              │
     │  3. Construct Payment Payload                │
     │     (Sign transaction)                       │
     │                                              │
     │  4. POST /api/ili                            │
     │     + Payment Payload                        │
     │─────────────────────────────────────────────>│
     │                                              │
     │  5. Verify & Settle Payment                  │
     │     (Via facilitator)                        │
     │                                              │
     │  6. 200 OK + Resource                        │
     │<─────────────────────────────────────────────│
     │                                              │
```

### Payment Flow Details

1. **Agent requests resource** - Standard HTTP GET/POST
2. **Server responds with 402** - Includes payment instructions (amount, recipient, network)
3. **Agent constructs payment** - Signs Solana transaction with USDC transfer
4. **Agent sends payment payload** - Includes signed transaction
5. **Server verifies payment** - Uses facilitator to verify and settle
6. **Server returns resource** - Agent receives requested data/service

## Setup

### 1. Install x402 Client SDK

```bash
npm install @payai/x402-client
```

### 2. Initialize Client

```typescript
import { X402Client } from '@payai/x402-client';
import { Keypair } from '@solana/web3.js';

const agentKeypair = Keypair.fromSecretKey(
  Buffer.from(process.env.AGENT_PRIVATE_KEY, 'base64')
);

const x402Client = new X402Client({
  keypair: agentKeypair,
  network: 'solana-mainnet', // or 'solana-devnet'
  rpcUrl: process.env.HELIUS_RPC_URL
});
```

## Core Integrations

### 1. Pay for ILI Data Access

**Use Case**: Agent needs real-time ILI data from premium oracle

```typescript
class ILIDataAgent extends ICBAgent {
  private x402: X402Client;
  
  async getILIWithPayment() {
    try {
      // Step 1: Request ILI data
      const response = await fetch('https://api.icb.network/v1/ili');
      
      // Step 2: Check if payment required
      if (response.status === 402) {
        const paymentInstructions = await response.json();
        
        console.log('Payment required:', {
          amount: paymentInstructions.amount,
          currency: paymentInstructions.currency,
          recipient: paymentInstructions.recipient
        });
        
        // Step 3: Pay and retry
        const paidResponse = await this.x402.payAndRequest({
          url: 'https://api.icb.network/v1/ili',
          method: 'GET',
          paymentInstructions
        });
        
        const ili = await paidResponse.json();
        console.log('ILI data received:', ili);
        return ili;
      }
      
      // No payment required
      return await response.json();
      
    } catch (error) {
      console.error('Failed to get ILI:', error);
      throw error;
    }
  }
  
  async monitorILIWithBudget(maxSpendUSDC: number) {
    let totalSpent = 0;
    
    while (totalSpent < maxSpendUSDC) {
      const ili = await this.getILIWithPayment();
      
      // Track spending
      totalSpent += 0.01; // Assume 0.01 USDC per request
      
      // Execute strategy
      await this.executeStrategy(ili);
      
      // Wait 5 minutes
      await new Promise(resolve => setTimeout(resolve, 300000));
    }
    
    console.log(`Budget exhausted: ${totalSpent} USDC spent`);
  }
}
```

### 2. Pay for Cross-Protocol Arbitrage Data

**Use Case**: Agent needs real-time rate data from multiple protocols

```typescript
class ArbitrageAgent extends ICBAgent {
  async findArbitrageOpportunities() {
    // Pay for rate data from multiple protocols
    const [jupiterRates, meteoraRates, kaminoRates] = await Promise.all([
      this.x402.payAndRequest({
        url: 'https://api.jupiter.ag/v1/rates',
        method: 'GET'
      }),
      this.x402.payAndRequest({
        url: 'https://api.meteora.ag/v1/rates',
        method: 'GET'
      }),
      this.x402.payAndRequest({
        url: 'https://api.kamino.finance/v1/rates',
        method: 'GET'
      })
    ]);
    
    // Find arbitrage opportunities
    const opportunities = this.compareRates(
      await jupiterRates.json(),
      await meteoraRates.json(),
      await kaminoRates.json()
    );
    
    return opportunities;
  }
  
  compareRates(jupiter: any, meteora: any, kamino: any) {
    const opportunities = [];
    
    // Example: Find rate discrepancies
    if (jupiter.usdcRate > meteora.usdcRate * 1.01) {
      opportunities.push({
        type: 'arbitrage',
        buy: 'meteora',
        sell: 'jupiter',
        profit: jupiter.usdcRate - meteora.usdcRate
      });
    }
    
    return opportunities;
  }
}
```

### 3. Pay for Prediction Market Data

**Use Case**: Agent needs historical prediction market data for analysis

```typescript
class PredictionAgent extends ICBAgent {
  async analyzePredictionHistory(proposalId: number) {
    // Pay for historical prediction data
    const response = await this.x402.payAndRequest({
      url: `https://api.icb.network/v1/proposals/${proposalId}/history`,
      method: 'GET'
    });
    
    const history = await response.json();
    
    // Analyze prediction accuracy
    const accuracy = this.calculateAccuracy(history);
    
    return {
      proposalId,
      totalPredictions: history.length,
      accuracy,
      recommendation: accuracy > 0.7 ? 'vote' : 'skip'
    };
  }
  
  calculateAccuracy(history: any[]) {
    const correct = history.filter(p => p.prediction === p.outcome).length;
    return correct / history.length;
  }
  
  async voteWithConfidence(proposalId: number) {
    // Pay for analysis data
    const analysis = await this.analyzePredictionHistory(proposalId);
    
    if (analysis.recommendation === 'vote') {
      // Execute vote
      await this.voteOnProposal({
        proposalId,
        prediction: true,
        stakeAmount: 10000
      });
    }
  }
}
```

### 4. Pay for Premium Oracle Data

**Use Case**: Agent needs high-frequency price data from premium oracle

```typescript
class OracleDataAgent extends ICBAgent {
  async getHighFrequencyPrices(assets: string[]) {
    const prices = [];
    
    for (const asset of assets) {
      // Pay for premium oracle data (1-second updates)
      const response = await this.x402.payAndRequest({
        url: `https://api.premium-oracle.com/v1/price/${asset}`,
        method: 'GET',
        headers: {
          'X-Frequency': 'high' // 1-second updates
        }
      });
      
      const price = await response.json();
      prices.push({ asset, ...price });
    }
    
    return prices;
  }
  
  async monitorPriceMovements() {
    const assets = ['SOL', 'USDC', 'BTC', 'ETH'];
    
    while (true) {
      const prices = await this.getHighFrequencyPrices(assets);
      
      // Detect significant movements
      for (const price of prices) {
        if (Math.abs(price.change24h) > 5) {
          console.log(`Alert: ${price.asset} moved ${price.change24h}%`);
          await this.executeEmergencyStrategy(price);
        }
      }
      
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### 5. Pay for AI Model Inference

**Use Case**: Agent needs ML predictions for DeFi strategies

```typescript
class MLPredictionAgent extends ICBAgent {
  async getPrediction(features: any) {
    // Pay for ML model inference
    const response = await this.x402.payAndRequest({
      url: 'https://api.ml-defi.com/v1/predict',
      method: 'POST',
      body: JSON.stringify({
        model: 'yield-optimizer-v2',
        features: {
          ili: features.ili,
          icr: features.icr,
          vhr: features.vhr,
          solPrice: features.solPrice
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const prediction = await response.json();
    
    return {
      action: prediction.action, // 'lend', 'borrow', 'stake', 'hold'
      confidence: prediction.confidence,
      expectedReturn: prediction.expectedReturn
    };
  }
  
  async executeMLStrategy() {
    // Get current market data
    const ili = await this.getILI();
    const icr = await this.getICR();
    const vhr = await this.getVHR();
    const solPrice = await this.getSOLPrice();
    
    // Pay for ML prediction
    const prediction = await this.getPrediction({
      ili: ili.value,
      icr: icr.rate,
      vhr: vhr.ratio,
      solPrice: solPrice.usd
    });
    
    // Execute if confidence is high
    if (prediction.confidence > 0.8) {
      console.log(`Executing ${prediction.action} with ${prediction.confidence} confidence`);
      await this.executeAction(prediction.action);
    }
  }
}
```

## Payment Management

### 1. Budget Tracking

```typescript
class PaymentBudgetManager {
  private totalSpent: number = 0;
  private dailyLimit: number;
  private spendingHistory: Array<{ timestamp: number; amount: number; service: string }> = [];
  
  constructor(dailyLimitUSDC: number) {
    this.dailyLimit = dailyLimitUSDC;
  }
  
  async trackPayment(amount: number, service: string) {
    this.totalSpent += amount;
    this.spendingHistory.push({
      timestamp: Date.now(),
      amount,
      service
    });
    
    // Check daily limit
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySpending = this.spendingHistory
      .filter(p => p.timestamp >= today)
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (todaySpending > this.dailyLimit) {
      throw new Error(`Daily spending limit exceeded: ${todaySpending} USDC`);
    }
  }
  
  getSpendingReport() {
    const byService = this.spendingHistory.reduce((acc, p) => {
      acc[p.service] = (acc[p.service] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSpent: this.totalSpent,
      byService,
      transactionCount: this.spendingHistory.length,
      avgPerTransaction: this.totalSpent / this.spendingHistory.length
    };
  }
}
```

### 2. Payment Retry Logic

```typescript
class ResilientX402Client {
  private x402: X402Client;
  private maxRetries: number = 3;
  
  async payAndRequestWithRetry(options: any) {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        return await this.x402.payAndRequest(options);
      } catch (error) {
        attempt++;
        
        if (error.code === 'INSUFFICIENT_BALANCE') {
          console.error('Insufficient USDC balance');
          throw error;
        }
        
        if (error.code === 'PAYMENT_FAILED') {
          console.log(`Payment failed, retrying (${attempt}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error('Payment failed after max retries');
  }
}
```

### 3. Balance Monitoring

```typescript
class BalanceMonitor {
  private connection: Connection;
  private usdcMint: PublicKey;
  private minBalance: number;
  
  constructor(minBalanceUSDC: number) {
    this.minBalance = minBalanceUSDC;
    this.usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  }
  
  async checkBalance(walletPubkey: PublicKey) {
    const tokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      walletPubkey
    );
    
    const balance = await this.connection.getTokenAccountBalance(tokenAccount);
    const usdcBalance = parseFloat(balance.value.uiAmount || '0');
    
    if (usdcBalance < this.minBalance) {
      console.warn(`Low USDC balance: ${usdcBalance} USDC`);
      await this.topUpBalance(walletPubkey);
    }
    
    return usdcBalance;
  }
  
  async topUpBalance(walletPubkey: PublicKey) {
    // Implement auto top-up logic
    // Could swap SOL for USDC via Jupiter
    console.log('Auto top-up triggered');
  }
}
```

## Complete Agent Example

### Multi-Service Payment Agent

```typescript
class X402OptimizedAgent extends ICBAgent {
  private x402: X402Client;
  private budgetManager: PaymentBudgetManager;
  private balanceMonitor: BalanceMonitor;
  
  async initialize() {
    this.x402 = new X402Client({
      keypair: this.keypair,
      network: 'solana-mainnet',
      rpcUrl: process.env.HELIUS_RPC_URL
    });
    
    this.budgetManager = new PaymentBudgetManager(10); // 10 USDC daily limit
    this.balanceMonitor = new BalanceMonitor(5); // Alert if < 5 USDC
  }
  
  async executeFullStrategy() {
    // Check balance
    const balance = await this.balanceMonitor.checkBalance(this.keypair.publicKey);
    console.log(`Current USDC balance: ${balance}`);
    
    // 1. Pay for ILI data
    const iliResponse = await this.x402.payAndRequest({
      url: 'https://api.icb.network/v1/ili',
      method: 'GET'
    });
    const ili = await iliResponse.json();
    await this.budgetManager.trackPayment(0.01, 'ILI Data');
    
    // 2. Pay for ICR data
    const icrResponse = await this.x402.payAndRequest({
      url: 'https://api.icb.network/v1/icr',
      method: 'GET'
    });
    const icr = await icrResponse.json();
    await this.budgetManager.trackPayment(0.01, 'ICR Data');
    
    // 3. Pay for ML prediction
    const predictionResponse = await this.x402.payAndRequest({
      url: 'https://api.ml-defi.com/v1/predict',
      method: 'POST',
      body: JSON.stringify({
        model: 'yield-optimizer-v2',
        features: { ili: ili.value, icr: icr.rate }
      })
    });
    const prediction = await predictionResponse.json();
    await this.budgetManager.trackPayment(0.05, 'ML Prediction');
    
    // 4. Execute strategy based on prediction
    if (prediction.confidence > 0.8) {
      await this.executeAction(prediction.action);
    }
    
    // 5. Generate spending report
    const report = this.budgetManager.getSpendingReport();
    console.log('Spending report:', report);
  }
  
  async runContinuously() {
    while (true) {
      try {
        await this.executeFullStrategy();
      } catch (error) {
        if (error.message.includes('Daily spending limit exceeded')) {
          console.log('Daily limit reached, pausing until tomorrow');
          await this.waitUntilTomorrow();
        } else {
          console.error('Strategy execution failed:', error);
        }
      }
      
      // Wait 5 minutes
      await new Promise(resolve => setTimeout(resolve, 300000));
    }
  }
  
  async waitUntilTomorrow() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    await new Promise(resolve => setTimeout(resolve, msUntilTomorrow));
  }
}
```

## Testing on Devnet

### Devnet Configuration

```typescript
const x402Devnet = new X402Client({
  keypair: agentKeypair,
  network: 'solana-devnet',
  rpcUrl: 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY'
});
```

### Get Devnet USDC

```bash
# Use Solana devnet faucet for SOL
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Swap SOL for devnet USDC via Jupiter
# Or use USDC devnet mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### Test Payment Flow

```typescript
async function testX402Payment() {
  const x402 = new X402Client({
    keypair: testKeypair,
    network: 'solana-devnet',
    rpcUrl: process.env.HELIUS_DEVNET_RPC
  });
  
  try {
    // Test payment for ILI data
    const response = await x402.payAndRequest({
      url: 'https://api-devnet.icb.network/v1/ili',
      method: 'GET'
    });
    
    const ili = await response.json();
    console.log('Payment successful! ILI:', ili);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

## Best Practices

### 1. Set Daily Spending Limits
- Prevent runaway costs
- Monitor spending per service
- Alert when approaching limit

### 2. Cache Paid Responses
- Avoid paying for same data multiple times
- Use Redis for shared cache
- Set appropriate TTL (5-10 minutes)

### 3. Batch Requests When Possible
- Combine multiple data requests
- Reduce total payment count
- Lower transaction fees

### 4. Monitor USDC Balance
- Auto top-up when low
- Alert if balance critical
- Track spending trends

### 5. Implement Retry Logic
- Handle payment failures gracefully
- Exponential backoff
- Max retry limit

### 6. Use Payment Receipts
- Store payment proofs
- Audit spending
- Dispute resolution

## Cost Optimization

### Pricing Examples

| Service | Cost per Request | Requests/Day | Daily Cost |
|---------|------------------|--------------|------------|
| ILI Data | 0.01 USDC | 288 (5 min) | 2.88 USDC |
| ICR Data | 0.01 USDC | 288 (5 min) | 2.88 USDC |
| ML Prediction | 0.05 USDC | 48 (30 min) | 2.40 USDC |
| Oracle Data | 0.02 USDC | 144 (10 min) | 2.88 USDC |
| **Total** | | | **11.04 USDC/day** |

### Cost Reduction Strategies

1. **Increase polling intervals** - 5 min → 10 min = 50% savings
2. **Cache responses** - Reuse data for 5 minutes
3. **Conditional requests** - Only fetch if data changed
4. **Batch operations** - Combine multiple requests
5. **Use free tiers** - Fallback to free APIs when possible

## Integration with ICB Operations

### 1. ILI Calculation with Paid Data

```typescript
async function calculateILIWithPremiumData() {
  // Pay for premium protocol data
  const [jupiterData, meteoraData, kaminoData] = await Promise.all([
    x402.payAndRequest({ url: 'https://api.jupiter.ag/v1/premium/tvl' }),
    x402.payAndRequest({ url: 'https://api.meteora.ag/v1/premium/tvl' }),
    x402.payAndRequest({ url: 'https://api.kamino.finance/v1/premium/tvl' })
  ]);
  
  // Calculate ILI with premium data
  const ili = calculateILI({
    jupiter: await jupiterData.json(),
    meteora: await meteoraData.json(),
    kamino: await kaminoData.json()
  });
  
  return ili;
}
```

### 2. Futarchy Voting with Paid Analysis

```typescript
async function voteWithPaidAnalysis(proposalId: number) {
  // Pay for historical analysis
  const analysis = await x402.payAndRequest({
    url: `https://api.icb.network/v1/proposals/${proposalId}/analysis`,
    method: 'GET'
  });
  
  const data = await analysis.json();
  
  // Vote based on paid analysis
  if (data.recommendation === 'approve' && data.confidence > 0.8) {
    await voteOnProposal({
      proposalId,
      prediction: true,
      stakeAmount: 10000
    });
  }
}
```

## Resources

- [x402 Documentation](https://docs.payai.network/v1/x402/introduction)
- [x402 GitHub](https://github.com/PayAINetwork)
- [x402 Discord](https://discord.gg/eWJRwMpebQ)
- [x402.org](https://x402.org/)
- [Solana USDC](https://spl.solana.com/token)

## Next Steps

1. Install @payai/x402-client
2. Set up agent keypair
3. Fund wallet with USDC
4. Test on devnet
5. Implement budget tracking
6. Deploy to mainnet
7. Monitor spending

---

**Status**: Integration Guide Complete  
**Next**: Implement x402-powered agents  
**Last Updated**: February 4, 2026
