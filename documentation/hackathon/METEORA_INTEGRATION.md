# Meteora Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to interact with Meteora's liquidity infrastructure

## Overview

Meteora provides multiple liquidity products that ICB agents can leverage for optimal yield and liquidity management. This guide covers integration with:

1. **DLMM** (Dynamic Liquidity Market Maker) - Concentrated liquidity with dynamic fees
2. **DAMM v2** (Dynamic Automated Market Maker) - Constant product AMM with precise concentration
3. **Dynamic Vaults** - Automated yield optimization across strategies
4. **DBC** (Dynamic Bonding Curve) - Token launch and price discovery
5. **Stake2Earn** - Fee sharing with token stakers

## Meteora Products for ICB Agents

### 1. DLMM (Dynamic Liquidity Market Maker)

**Use Case**: Liquidity agents providing concentrated liquidity with dynamic fees

**Key Features**:
- Precise liquidity concentration (like Uniswap v3)
- Dynamic fees that adjust based on market conditions
- Farming rewards for LPs
- Token 2022 support

**Agent Integration**:

```typescript
import { DLMM } from '@meteora-ag/dlmm';
import { ICBAgent } from '@icb/openclaw-skill';

class MeteoraLiquidityAgent extends ICBAgent {
  private dlmm: DLMM;
  
  async initialize() {
    this.dlmm = await DLMM.create(this.connection, this.keypair);
  }
  
  async provideLiquidity() {
    const ili = await this.getILI();
    
    // If ILI is high (>7000), provide concentrated liquidity
    if (ili.value > 7000) {
      const pair = await this.dlmm.getPair('SOL-USDC');
      
      // Add liquidity in concentrated range
      const tx = await this.dlmm.addLiquidity({
        pair: pair.address,
        amountX: 50 * 1e9,  // 50 SOL
        amountY: 5000 * 1e6, // 5000 USDC
        binRange: {
          lower: -10,  // Concentrated around current price
          upper: 10
        }
      });
      
      await this.sendTransaction(tx);
      console.log('Added concentrated liquidity to DLMM');
    }
  }
  
  async claimFees() {
    // Claim trading fees from DLMM position
    const position = await this.dlmm.getPosition(this.positionAddress);
    const fees = await this.dlmm.claimFees(position);
    
    console.log(`Claimed ${fees.amountX} SOL and ${fees.amountY} USDC in fees`);
  }
}
```

**API Endpoints**:
- `GET /dlmm/pairs` - Get all DLMM pairs
- `GET /dlmm/pair/{address}` - Get specific pair info
- `GET /dlmm/position/{address}` - Get position details
- Rate Limit: 30 RPS

### 2. DAMM v2 (Dynamic Automated Market Maker)

**Use Case**: Yield agents optimizing returns on constant product pools

**Key Features**:
- Constant product AMM (x * y = k)
- Precise liquidity concentration
- Lower gas fees than DLMM
- Integrated with Dynamic Vaults

**Agent Integration**:

```typescript
import { AmmImpl } from '@meteora-ag/amm';

class MeteoraYieldAgent extends ICBAgent {
  private amm: AmmImpl;
  
  async initialize() {
    this.amm = await AmmImpl.create(this.connection);
  }
  
  async optimizeYield() {
    const icr = await this.getICR();
    
    // Get all DAMM v2 pools
    const pools = await this.fetchMeteoraAPI('/pools');
    
    // Find highest APY pool
    const bestPool = pools
      .filter(p => p.apy > icr.rate / 100)
      .sort((a, b) => b.apy - a.apy)[0];
    
    if (bestPool) {
      // Add liquidity to best pool
      const tx = await this.amm.deposit({
        pool: bestPool.address,
        tokenAAmount: 1000 * 1e6,  // 1000 USDC
        tokenBAmount: 10 * 1e9,    // 10 SOL
        slippage: 0.01
      });
      
      await this.sendTransaction(tx);
      console.log(`Added liquidity to ${bestPool.name} with ${bestPool.apy}% APY`);
    }
  }
  
  async fetchMeteoraAPI(endpoint: string) {
    const response = await fetch(`https://api.meteora.ag${endpoint}`);
    return response.json();
  }
}
```

**API Endpoints**:
- `GET /pools` - Get all pools
- `GET /pool/{address}` - Get pool details
- `GET /pool/{address}/metrics` - Get pool metrics (APY, TVL, volume)
- Rate Limit: 10 RPS

### 3. Dynamic Vaults

**Use Case**: Treasury agents automating yield optimization across multiple strategies

**Key Features**:
- Automated rebalancing across yield strategies
- Risk management with VHR monitoring
- Operation fee calculation
- Hermes integration for optimal allocations

**Agent Integration**:

```typescript
import { VaultImpl } from '@meteora-ag/vault-sdk';

class MeteoraVaultAgent extends ICBAgent {
  private vault: VaultImpl;
  
  async initialize() {
    this.vault = await VaultImpl.create(this.connection);
  }
  
  async depositToVault() {
    const ili = await this.getILI();
    const vhr = await this.getVaultState();
    
    // Only deposit if system is healthy
    if (vhr.vhr > 175 && ili.value > 6000) {
      // Get vault with best risk-adjusted return
      const vaults = await this.fetchMeteoraAPI('/vaults');
      const bestVault = this.selectOptimalVault(vaults);
      
      // Deposit to Dynamic Vault
      const tx = await this.vault.deposit({
        vault: bestVault.address,
        tokenMint: 'USDC',
        amount: 10000 * 1e6  // 10,000 USDC
      });
      
      await this.sendTransaction(tx);
      console.log(`Deposited to ${bestVault.name} vault`);
    }
  }
  
  selectOptimalVault(vaults: any[]) {
    // Use Hermes algorithm to find optimal allocation
    return vaults
      .map(v => ({
        ...v,
        score: v.apy / (1 + v.volatility)  // Risk-adjusted return
      }))
      .sort((a, b) => b.score - a.score)[0];
  }
  
  async withdrawFromVault() {
    // Withdraw when ILI drops (liquidity crisis)
    const ili = await this.getILI();
    
    if (ili.value < 5000) {
      const position = await this.vault.getPosition(this.vaultAddress);
      const tx = await this.vault.withdraw({
        vault: this.vaultAddress,
        shares: position.shares
      });
      
      await this.sendTransaction(tx);
      console.log('Withdrew from vault due to low ILI');
    }
  }
}
```

**API Endpoints**:
- `GET /vaults` - Get all vaults
- `GET /vault/{mint}` - Get vault by token mint
- `GET /vault/{mint}/state` - Get vault state
- `GET /apy/state?mint={mint}` - Get APY information
- Rate Limit: No limit

### 4. DBC (Dynamic Bonding Curve)

**Use Case**: Arbitrage agents exploiting bonding curve inefficiencies

**Key Features**:
- Universal virtual curve for token launches
- Configurable price dynamics
- Anti-sniper protection
- Fee market cap scheduler

**Agent Integration**:

```typescript
import { DBC } from '@meteora-ag/dbc-sdk';

class MeteoraArbitrageAgent extends ICBAgent {
  private dbc: DBC;
  
  async initialize() {
    this.dbc = await DBC.create(this.connection);
  }
  
  async monitorBondingCurves() {
    // Monitor new token launches
    const curves = await this.fetchMeteoraAPI('/dbc/curves');
    
    for (const curve of curves) {
      const opportunity = await this.analyzeArbitrage(curve);
      
      if (opportunity.profitable) {
        await this.executeBondingCurveArbitrage(curve, opportunity);
      }
    }
  }
  
  async analyzeArbitrage(curve: any) {
    // Calculate if bonding curve price differs from market price
    const curvePrice = curve.currentPrice;
    const marketPrice = await this.getMarketPrice(curve.tokenMint);
    
    const priceDiff = Math.abs(curvePrice - marketPrice) / marketPrice;
    
    return {
      profitable: priceDiff > 0.02,  // 2% arbitrage opportunity
      action: curvePrice > marketPrice ? 'sell' : 'buy',
      expectedProfit: priceDiff * 1000  // Estimate profit
    };
  }
  
  async executeBondingCurveArbitrage(curve: any, opportunity: any) {
    if (opportunity.action === 'buy') {
      // Buy from bonding curve, sell on market
      const buyTx = await this.dbc.buy({
        curve: curve.address,
        amount: 1000 * 1e6,
        slippage: 0.01
      });
      
      await this.sendTransaction(buyTx);
      
      // Sell on Jupiter
      await this.swapOnJupiter(curve.tokenMint, 'USDC', 1000);
    }
  }
}
```

**API Endpoints**:
- `GET /dbc/curves` - Get all bonding curves
- `GET /dbc/curve/{address}` - Get curve details
- Rate Limit: 10 RPS

### 5. Stake2Earn

**Use Case**: Prediction agents earning fees through token staking

**Key Features**:
- Fee sharing from DAMM v1 pools
- Stake tokens to earn trading fees
- Proportional distribution based on stake

**Agent Integration**:

```typescript
import { Stake2Earn } from '@meteora-ag/stake2earn-sdk';

class MeteoraStakingAgent extends ICBAgent {
  private stake2earn: Stake2Earn;
  
  async initialize() {
    this.stake2earn = await Stake2Earn.create(this.connection);
  }
  
  async stakeForFees() {
    const ili = await this.getILI();
    
    // Stake when ILI is stable (good time to earn passive fees)
    if (ili.value > 6500 && ili.value < 7500) {
      const pools = await this.fetchMeteoraAPI('/stake2earn/pools');
      const bestPool = pools.sort((a, b) => b.feeAPY - a.feeAPY)[0];
      
      // Stake tokens to earn fees
      const tx = await this.stake2earn.stake({
        pool: bestPool.address,
        amount: 10000 * 1e9  // 10,000 tokens
      });
      
      await this.sendTransaction(tx);
      console.log(`Staked in ${bestPool.name} to earn ${bestPool.feeAPY}% fee APY`);
    }
  }
  
  async claimStakingRewards() {
    const rewards = await this.stake2earn.getClaimableRewards(this.stakeAddress);
    
    if (rewards.amount > 0) {
      const tx = await this.stake2earn.claim({
        stake: this.stakeAddress
      });
      
      await this.sendTransaction(tx);
      console.log(`Claimed ${rewards.amount} in staking rewards`);
    }
  }
}
```

**API Endpoints**:
- `GET /stake2earn/pools` - Get all stake2earn pools
- `GET /stake2earn/pool/{address}` - Get pool details
- Rate Limit: No limit

## ILI Calculation with Meteora Data

### Fetching Meteora Metrics for ILI

```typescript
class MeteoraILICalculator {
  async calculateMeteoraComponent() {
    // Fetch all pool metrics
    const pools = await this.fetchMeteoraAPI('/pools/metrics');
    
    // Calculate aggregate metrics
    const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
    const avgAPY = pools.reduce((sum, p) => sum + p.apy * p.tvl, 0) / totalTVL;
    const avgVolatility = this.calculateVolatility(pools);
    
    return {
      tvl: totalTVL,
      avgYield: avgAPY,
      volatility: avgVolatility
    };
  }
  
  calculateVolatility(pools: any[]) {
    // Calculate 24h price variance across pools
    const priceChanges = pools.map(p => p.priceChange24h);
    const variance = this.calculateVariance(priceChanges);
    return Math.sqrt(variance);
  }
  
  async fetchMeteoraAPI(endpoint: string) {
    const response = await fetch(`https://api.meteora.ag${endpoint}`);
    return response.json();
  }
}
```

## Rate Limiting Strategy

Meteora APIs have different rate limits:

| API | Rate Limit | Strategy |
|-----|------------|----------|
| DLMM | 30 RPS | Use for real-time trading |
| DAMM v1 | 10 RPS | Cache pool data (5 min TTL) |
| DAMM v2 | 10 RPS | Cache pool data (5 min TTL) |
| Dynamic Vault | No limit | Query frequently for rebalancing |
| Stake2Earn | No limit | Query frequently for rewards |

**Implementation**:

```typescript
class MeteoraRateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();
  
  async request(api: string, endpoint: string) {
    const limit = this.getLimitForAPI(api);
    const count = this.requestCounts.get(api) || 0;
    
    if (count >= limit) {
      // Wait until rate limit resets
      await this.waitForReset(api);
    }
    
    // Make request
    const response = await fetch(`https://api.meteora.ag${endpoint}`);
    
    // Increment counter
    this.requestCounts.set(api, count + 1);
    
    // Set reset timer (1 second)
    if (!this.resetTimers.has(api)) {
      this.resetTimers.set(api, setTimeout(() => {
        this.requestCounts.set(api, 0);
        this.resetTimers.delete(api);
      }, 1000));
    }
    
    return response.json();
  }
  
  getLimitForAPI(api: string): number {
    const limits = {
      'dlmm': 30,
      'damm-v1': 10,
      'damm-v2': 10,
      'vault': Infinity,
      'stake2earn': Infinity
    };
    return limits[api] || 10;
  }
}
```

## Complete Agent Strategy Example

### Multi-Protocol Yield Optimizer

```typescript
class MeteoraYieldOptimizer extends ICBAgent {
  private dlmm: DLMM;
  private amm: AmmImpl;
  private vault: VaultImpl;
  private rateLimiter: MeteoraRateLimiter;
  
  async run() {
    // Subscribe to ILI updates
    this.onILIUpdate(async (ili) => {
      const icr = await this.getICR();
      
      // Decide strategy based on macro conditions
      if (ili.value > 7500) {
        // High liquidity - provide concentrated LP
        await this.provideDLMMLiquidity();
      } else if (ili.value > 6000 && ili.value < 7500) {
        // Stable - deposit to vaults for passive yield
        await this.depositToVaults();
      } else if (ili.value < 6000) {
        // Low liquidity - withdraw and wait
        await this.withdrawAll();
      }
      
      // Always claim rewards
      await this.claimAllRewards();
    });
  }
  
  async provideDLMMLiquidity() {
    const pools = await this.rateLimiter.request('dlmm', '/dlmm/pairs');
    const bestPool = pools
      .filter(p => p.apy > 20)
      .sort((a, b) => b.apy - a.apy)[0];
    
    if (bestPool) {
      await this.dlmm.addLiquidity({
        pair: bestPool.address,
        amountX: 50 * 1e9,
        amountY: 5000 * 1e6,
        binRange: { lower: -10, upper: 10 }
      });
    }
  }
  
  async depositToVaults() {
    const vaults = await this.rateLimiter.request('vault', '/vaults');
    const bestVault = vaults
      .filter(v => v.apy > 15)
      .sort((a, b) => b.apy / (1 + b.volatility) - a.apy / (1 + a.volatility))[0];
    
    if (bestVault) {
      await this.vault.deposit({
        vault: bestVault.address,
        tokenMint: 'USDC',
        amount: 10000 * 1e6
      });
    }
  }
  
  async withdrawAll() {
    // Withdraw from all positions
    await this.dlmm.removeLiquidity(this.dlmmPosition);
    await this.vault.withdraw({ vault: this.vaultAddress, shares: 'all' });
  }
  
  async claimAllRewards() {
    await this.dlmm.claimFees(this.dlmmPosition);
    await this.vault.claimRewards(this.vaultAddress);
  }
}
```

## Testing on Devnet

### Meteora Devnet Resources

- **Faucet**: https://faucet.raccoons.dev/
- **Devnet Pools**: Available via API with `?network=devnet` parameter
- **Test Tokens**: SOL, USDC, USDT available from faucet

### Testing Script

```typescript
async function testMeteoraIntegration() {
  const agent = new MeteoraYieldOptimizer({
    keypair: testKeypair,
    rpcUrl: 'https://api.devnet.solana.com',
    network: 'devnet'
  });
  
  await agent.initialize();
  
  // Test DLMM
  console.log('Testing DLMM integration...');
  await agent.provideDLMMLiquidity();
  
  // Test Vaults
  console.log('Testing Dynamic Vault integration...');
  await agent.depositToVaults();
  
  // Test rewards
  console.log('Testing reward claims...');
  await agent.claimAllRewards();
  
  console.log('All tests passed!');
}
```

## Resources

- [Meteora Documentation](https://docs.meteora.ag/)
- [Meteora GitHub](https://github.com/MeteoraAg)
- [Meteora Discord](https://discord.com/invite/meteora)
- [Developer Updates](https://t.me/meteora_dev)
- [API Status](https://t.me/meteora_dev)

## Next Steps

1. Install Meteora SDKs: `npm install @meteora-ag/dlmm @meteora-ag/amm @meteora-ag/vault-sdk`
2. Test on devnet with faucet tokens
3. Implement rate limiting for API calls
4. Deploy agents to production
5. Monitor performance and optimize strategies

---

**Status**: Integration Guide Complete  
**Next**: Implement Meteora agent strategies  
**Last Updated**: February 4, 2026
