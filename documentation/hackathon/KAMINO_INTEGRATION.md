# Kamino Finance Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use Kamino Finance for lending, borrowing, and yield optimization

## Overview

Kamino Finance is the largest borrowing and lending protocol on Solana, offering capital-efficient DeFi operations. ICB agents leverage Kamino for:

1. **Lending & borrowing** - Earn interest and access leverage
2. **Multiply vaults** - Boosted yields with automated leverage
3. **Liquidity vaults** - Automated CLMM liquidity provision
4. **Long/short positions** - Directional exposure with leverage
5. **kToken collateral** - Use LP tokens as collateral

## Why Kamino for ICB Agents?

| Agent Need | Kamino Solution | Benefit |
|------------|-----------------|---------|
| Earn yield on deposits | Kamino Lend | Competitive interest rates |
| Access leverage | Unified liquidity market | Capital efficiency |
| Automated strategies | Multiply/Liquidity vaults | Set-and-forget yield |
| Use LP as collateral | kTokens | Leverage LP positions |
| Risk management | eMode, auto-deleverage | Safety mechanisms |

## Setup

### 1. Install Kamino SDK

```bash
# Install klend-sdk
npm install @kamino-finance/klend-sdk

# Install dependencies
npm install @solana/web3.js @solana/spl-token
```

### 2. Initialize Kamino Client

```typescript
import { KaminoMarket, KaminoAction } from '@kamino-finance/klend-sdk';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

const connection = new Connection(process.env.HELIUS_RPC_URL);
const agentKeypair = Keypair.fromSecretKey(
  Buffer.from(process.env.AGENT_PRIVATE_KEY, 'base64')
);

// Initialize Kamino market
const market = await KaminoMarket.load(
  connection,
  new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF') // Main market
);
```

## Core Integrations

### 1. Lending Agent (Supply Assets)

**Use Case**: Earn interest on idle capital

```typescript
class KaminoLendingAgent extends ICBAgent {
  private market: KaminoMarket;
  
  async initialize() {
    this.market = await KaminoMarket.load(
      this.connection,
      new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF')
    );
  }
  
  async supplyAsset(asset: string, amount: number) {
    // Get reserve for asset
    const reserve = this.market.getReserveBySymbol(asset);
    
    if (!reserve) {
      throw new Error(`Reserve not found for ${asset}`);
    }
    
    // Build deposit instruction
    const depositAction = await KaminoAction.buildDepositTxns(
      this.market,
      amount.toString(),
      reserve.address,
      this.agentKeypair.publicKey,
      new PublicKey('So11111111111111111111111111111111111111112') // Referrer (optional)
    );
    
    // Send transaction
    const signature = await depositAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Supplied ${amount} ${asset} to Kamino: ${signature}`);
    
    return {
      asset,
      amount,
      signature,
      reserve: reserve.address.toString()
    };
  }
  
  async getSupplyAPY(asset: string) {
    const reserve = this.market.getReserveBySymbol(asset);
    
    if (!reserve) {
      throw new Error(`Reserve not found for ${asset}`);
    }
    
    // Get supply APY
    const supplyAPY = reserve.stats.supplyInterestAPY;
    
    return {
      asset,
      supplyAPY: supplyAPY * 100, // Convert to percentage
      utilization: reserve.stats.utilizationRate * 100
    };
  }
  
  async withdrawAsset(asset: string, amount: number) {
    const reserve = this.market.getReserveBySymbol(asset);
    
    if (!reserve) {
      throw new Error(`Reserve not found for ${asset}`);
    }
    
    // Build withdraw instruction
    const withdrawAction = await KaminoAction.buildWithdrawTxns(
      this.market,
      amount.toString(),
      reserve.address,
      this.agentKeypair.publicKey
    );
    
    // Send transaction
    const signature = await withdrawAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Withdrew ${amount} ${asset} from Kamino: ${signature}`);
    
    return {
      asset,
      amount,
      signature
    };
  }
  
  async optimizeYield() {
    // Get all available reserves
    const reserves = this.market.reserves;
    
    // Find highest APY
    let bestReserve = null;
    let bestAPY = 0;
    
    for (const reserve of reserves) {
      const apy = reserve.stats.supplyInterestAPY;
      
      if (apy > bestAPY) {
        bestAPY = apy;
        bestReserve = reserve;
      }
    }
    
    if (bestReserve) {
      console.log(`Best yield: ${bestReserve.symbol} at ${(bestAPY * 100).toFixed(2)}% APY`);
      
      // Supply to best reserve
      await this.supplyAsset(bestReserve.symbol, 10000);
    }
    
    return {
      asset: bestReserve?.symbol,
      apy: bestAPY * 100
    };
  }
}
```

### 2. Borrowing Agent

**Use Case**: Access leverage for trading or yield strategies

```typescript
class KaminoBorrowingAgent extends ICBAgent {
  private market: KaminoMarket;
  
  async borrowAsset(
    collateralAsset: string,
    collateralAmount: number,
    borrowAsset: string,
    borrowAmount: number
  ) {
    // 1. Supply collateral
    const collateralReserve = this.market.getReserveBySymbol(collateralAsset);
    
    const depositAction = await KaminoAction.buildDepositTxns(
      this.market,
      collateralAmount.toString(),
      collateralReserve.address,
      this.agentKeypair.publicKey
    );
    
    await depositAction.sendTransactions(this.connection, this.agentKeypair);
    
    console.log(`Supplied ${collateralAmount} ${collateralAsset} as collateral`);
    
    // 2. Borrow asset
    const borrowReserve = this.market.getReserveBySymbol(borrowAsset);
    
    const borrowAction = await KaminoAction.buildBorrowTxns(
      this.market,
      borrowAmount.toString(),
      borrowReserve.address,
      this.agentKeypair.publicKey
    );
    
    const signature = await borrowAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Borrowed ${borrowAmount} ${borrowAsset}: ${signature}`);
    
    return {
      collateral: { asset: collateralAsset, amount: collateralAmount },
      borrow: { asset: borrowAsset, amount: borrowAmount },
      signature
    };
  }
  
  async getBorrowAPY(asset: string) {
    const reserve = this.market.getReserveBySymbol(asset);
    
    if (!reserve) {
      throw new Error(`Reserve not found for ${asset}`);
    }
    
    // Get borrow APY
    const borrowAPY = reserve.stats.borrowInterestAPY;
    
    return {
      asset,
      borrowAPY: borrowAPY * 100,
      utilization: reserve.stats.utilizationRate * 100
    };
  }
  
  async repayBorrow(asset: string, amount: number) {
    const reserve = this.market.getReserveBySymbol(asset);
    
    if (!reserve) {
      throw new Error(`Reserve not found for ${asset}`);
    }
    
    // Build repay instruction
    const repayAction = await KaminoAction.buildRepayTxns(
      this.market,
      amount.toString(),
      reserve.address,
      this.agentKeypair.publicKey
    );
    
    // Send transaction
    const signature = await repayAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Repaid ${amount} ${asset}: ${signature}`);
    
    return {
      asset,
      amount,
      signature
    };
  }
  
  async getPositionHealth() {
    // Get obligation (position) for agent
    const obligation = await this.market.getObligationByWallet(
      this.agentKeypair.publicKey
    );
    
    if (!obligation) {
      return {
        hasPosition: false
      };
    }
    
    // Calculate health metrics
    const ltv = obligation.loanToValue();
    const liquidationLTV = obligation.liquidationLTV();
    const healthFactor = liquidationLTV / ltv;
    
    return {
      hasPosition: true,
      ltv: ltv * 100,
      liquidationLTV: liquidationLTV * 100,
      healthFactor,
      isHealthy: healthFactor > 1.2, // 20% buffer
      collateralValue: obligation.depositedValue,
      borrowValue: obligation.borrowedValue
    };
  }
  
  async monitorAndManagePosition() {
    const health = await this.getPositionHealth();
    
    if (!health.hasPosition) {
      console.log('No active position');
      return;
    }
    
    console.log(`Position health: ${health.healthFactor.toFixed(2)}`);
    
    // If health factor is low, repay some debt
    if (health.healthFactor < 1.3) {
      console.log('Health factor low, repaying debt...');
      
      // Repay 10% of borrowed value
      const repayAmount = health.borrowValue * 0.1;
      
      await this.repayBorrow('USDC', repayAmount);
    }
  }
}
```

### 3. Elevation Mode (eMode) Agent

**Use Case**: High leverage for correlated assets (e.g., SOL/LSTs)

```typescript
class KaminoEModeAgent extends ICBAgent {
  async leverageSOLWithLST() {
    // eMode allows up to 95% LTV for SOL/LST pairs
    
    // 1. Supply SOL as collateral
    await this.supplyAsset('SOL', 100);
    
    // 2. Borrow mSOL (correlated asset in same eMode group)
    // Can borrow up to 95% of collateral value
    await this.borrowAsset('SOL', 100, 'mSOL', 90);
    
    // 3. Swap mSOL for SOL
    const swappedSOL = await this.swapOnJupiter('mSOL', 'SOL', 90);
    
    // 4. Supply swapped SOL as additional collateral
    await this.supplyAsset('SOL', swappedSOL);
    
    // Result: ~10x leverage on SOL
    console.log('Leveraged SOL position created with eMode');
    
    return {
      initialCollateral: 100,
      finalExposure: 100 + swappedSOL,
      leverage: (100 + swappedSOL) / 100
    };
  }
  
  async leverageStablecoins() {
    // eMode for stablecoins (USDC/USDT)
    
    // 1. Supply USDC
    await this.supplyAsset('USDC', 10000);
    
    // 2. Borrow USDT (95% LTV in stablecoin eMode)
    await this.borrowAsset('USDC', 10000, 'USDT', 9000);
    
    // 3. Swap USDT for USDC
    const swappedUSDC = await this.swapOnJupiter('USDT', 'USDC', 9000);
    
    // 4. Supply swapped USDC
    await this.supplyAsset('USDC', swappedUSDC);
    
    console.log('Leveraged stablecoin position created');
    
    return {
      initialCollateral: 10000,
      finalExposure: 10000 + swappedUSDC,
      leverage: (10000 + swappedUSDC) / 10000
    };
  }
}
```

### 4. Multiply Vaults Agent

**Use Case**: Automated leveraged yield strategies

```typescript
class KaminoMultiplyAgent extends ICBAgent {
  async depositToMultiplyVault(vaultAddress: string, amount: number) {
    // Multiply vaults automatically manage leverage
    // Agent just deposits and vault handles the rest
    
    const vault = await this.market.getMultiplyVault(
      new PublicKey(vaultAddress)
    );
    
    // Build deposit instruction
    const depositAction = await KaminoAction.buildMultiplyDepositTxns(
      this.market,
      amount.toString(),
      vault.address,
      this.agentKeypair.publicKey
    );
    
    const signature = await depositAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Deposited ${amount} to Multiply vault: ${signature}`);
    
    return {
      vault: vault.address.toString(),
      amount,
      signature,
      strategy: vault.strategy
    };
  }
  
  async getMultiplyVaultAPY(vaultAddress: string) {
    const vault = await this.market.getMultiplyVault(
      new PublicKey(vaultAddress)
    );
    
    return {
      vault: vault.address.toString(),
      apy: vault.stats.apy * 100,
      leverage: vault.stats.leverage,
      tvl: vault.stats.tvl
    };
  }
  
  async findBestMultiplyVault() {
    // Get all multiply vaults
    const vaults = await this.market.getMultiplyVaults();
    
    // Find highest APY
    let bestVault = null;
    let bestAPY = 0;
    
    for (const vault of vaults) {
      const apy = vault.stats.apy;
      
      if (apy > bestAPY) {
        bestAPY = apy;
        bestVault = vault;
      }
    }
    
    if (bestVault) {
      console.log(`Best Multiply vault: ${bestVault.strategy} at ${(bestAPY * 100).toFixed(2)}% APY`);
      
      // Deposit to best vault
      await this.depositToMultiplyVault(
        bestVault.address.toString(),
        10000
      );
    }
    
    return {
      vault: bestVault?.address.toString(),
      strategy: bestVault?.strategy,
      apy: bestAPY * 100
    };
  }
}
```

### 5. kToken Collateral Agent

**Use Case**: Use LP tokens as collateral for borrowing

```typescript
class KTokenCollateralAgent extends ICBAgent {
  async supplyKTokenAsCollateral(kTokenMint: string, amount: number) {
    // kTokens are Kamino's LP tokens (fungible CLMM positions)
    
    const reserve = this.market.getReserveByMint(
      new PublicKey(kTokenMint)
    );
    
    if (!reserve) {
      throw new Error(`Reserve not found for kToken ${kTokenMint}`);
    }
    
    // Supply kToken as collateral
    const depositAction = await KaminoAction.buildDepositTxns(
      this.market,
      amount.toString(),
      reserve.address,
      this.agentKeypair.publicKey
    );
    
    const signature = await depositAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Supplied ${amount} kTokens as collateral: ${signature}`);
    
    return {
      kToken: kTokenMint,
      amount,
      signature
    };
  }
  
  async borrowAgainstKToken(
    kTokenMint: string,
    kTokenAmount: number,
    borrowAsset: string,
    borrowAmount: number
  ) {
    // 1. Supply kToken as collateral
    await this.supplyKTokenAsCollateral(kTokenMint, kTokenAmount);
    
    // 2. Borrow against kToken
    const borrowReserve = this.market.getReserveBySymbol(borrowAsset);
    
    const borrowAction = await KaminoAction.buildBorrowTxns(
      this.market,
      borrowAmount.toString(),
      borrowReserve.address,
      this.agentKeypair.publicKey
    );
    
    const signature = await borrowAction.sendTransactions(
      this.connection,
      this.agentKeypair
    );
    
    console.log(`Borrowed ${borrowAmount} ${borrowAsset} against kToken: ${signature}`);
    
    return {
      collateral: { kToken: kTokenMint, amount: kTokenAmount },
      borrow: { asset: borrowAsset, amount: borrowAmount },
      signature
    };
  }
}
```

## Complete Agent Example

### Multi-Strategy Kamino Agent

```typescript
class KaminoOptimizedAgent extends ICBAgent {
  private market: KaminoMarket;
  private lendingAgent: KaminoLendingAgent;
  private borrowingAgent: KaminoBorrowingAgent;
  private eModeAgent: KaminoEModeAgent;
  private multiplyAgent: KaminoMultiplyAgent;
  
  async initialize() {
    // Initialize Kamino market
    this.market = await KaminoMarket.load(
      this.connection,
      new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF')
    );
    
    // Initialize sub-agents
    this.lendingAgent = new KaminoLendingAgent(this.market);
    this.borrowingAgent = new KaminoBorrowingAgent(this.market);
    this.eModeAgent = new KaminoEModeAgent(this.market);
    this.multiplyAgent = new KaminoMultiplyAgent(this.market);
    
    console.log('Kamino agent initialized');
  }
  
  async executeFullStrategy() {
    // 1. Check ILI to determine strategy
    const ili = await this.getILI();
    
    if (ili.value < 5000) {
      // Low liquidity - conservative strategy
      console.log('Low ILI - using conservative lending strategy');
      
      // Just supply USDC for yield
      await this.lendingAgent.supplyAsset('USDC', 10000);
      
    } else if (ili.value > 7500) {
      // High liquidity - aggressive strategy
      console.log('High ILI - using aggressive multiply strategy');
      
      // Use multiply vault for boosted yields
      await this.multiplyAgent.findBestMultiplyVault();
      
    } else {
      // Normal liquidity - balanced strategy
      console.log('Normal ILI - using balanced leverage strategy');
      
      // Use eMode for efficient leverage
      await this.eModeAgent.leverageSOLWithLST();
    }
    
    // 2. Monitor position health
    const health = await this.borrowingAgent.getPositionHealth();
    
    if (health.hasPosition && health.healthFactor < 1.3) {
      console.log('Position health low, managing risk...');
      await this.borrowingAgent.monitorAndManagePosition();
    }
    
    // 3. Optimize yield across all positions
    await this.lendingAgent.optimizeYield();
    
    console.log('Full Kamino strategy executed');
  }
  
  async getPerformanceMetrics() {
    // Get all positions
    const obligation = await this.market.getObligationByWallet(
      this.agentKeypair.publicKey
    );
    
    if (!obligation) {
      return {
        hasPositions: false
      };
    }
    
    // Calculate metrics
    const totalDeposited = obligation.depositedValue;
    const totalBorrowed = obligation.borrowedValue;
    const netValue = totalDeposited - totalBorrowed;
    const leverage = totalDeposited / netValue;
    
    // Get APYs
    const supplyAPYs = [];
    const borrowAPYs = [];
    
    for (const deposit of obligation.deposits) {
      const reserve = this.market.getReserve(deposit.reserveAddress);
      supplyAPYs.push(reserve.stats.supplyInterestAPY);
    }
    
    for (const borrow of obligation.borrows) {
      const reserve = this.market.getReserve(borrow.reserveAddress);
      borrowAPYs.push(reserve.stats.borrowInterestAPY);
    }
    
    const avgSupplyAPY = supplyAPYs.reduce((a, b) => a + b, 0) / supplyAPYs.length;
    const avgBorrowAPY = borrowAPYs.reduce((a, b) => a + b, 0) / borrowAPYs.length;
    const netAPY = (avgSupplyAPY * leverage) - avgBorrowAPY;
    
    return {
      hasPositions: true,
      totalDeposited,
      totalBorrowed,
      netValue,
      leverage,
      avgSupplyAPY: avgSupplyAPY * 100,
      avgBorrowAPY: avgBorrowAPY * 100,
      netAPY: netAPY * 100,
      healthFactor: obligation.liquidationLTV() / obligation.loanToValue()
    };
  }
}
```

## Risk Management

### 1. Position Health Monitoring

```typescript
async function monitorPositionHealth() {
  const health = await agent.getPositionHealth();
  
  if (health.healthFactor < 1.2) {
    // Critical - repay immediately
    await agent.repayBorrow('USDC', health.borrowValue * 0.2);
  } else if (health.healthFactor < 1.5) {
    // Warning - reduce leverage
    await agent.repayBorrow('USDC', health.borrowValue * 0.1);
  }
}
```

### 2. Auto-Deleverage Protection

```typescript
async function handleAutoDeleverage(asset: string) {
  // Kamino may trigger auto-deleverage if caps are lowered
  // Agent should monitor and adjust positions proactively
  
  const reserve = market.getReserveBySymbol(asset);
  const depositCap = reserve.config.depositLimit;
  const currentDeposits = reserve.stats.totalDeposits;
  
  if (currentDeposits > depositCap * 0.9) {
    console.log(`${asset} approaching deposit cap, withdrawing...`);
    await agent.withdrawAsset(asset, currentDeposits * 0.1);
  }
}
```

### 3. Liquidation Protection

```typescript
async function protectFromLiquidation() {
  const health = await agent.getPositionHealth();
  
  // Maintain 30% buffer above liquidation threshold
  const targetHealthFactor = 1.3;
  
  if (health.healthFactor < targetHealthFactor) {
    const repayAmount = calculateRepayAmount(
      health.borrowValue,
      health.collateralValue,
      targetHealthFactor
    );
    
    await agent.repayBorrow('USDC', repayAmount);
  }
}
```

## Best Practices

### 1. Use eMode for Correlated Assets
- SOL/LST pairs: Up to 95% LTV
- Stablecoin pairs: Up to 95% LTV
- Maximize capital efficiency

### 2. Monitor Position Health
- Maintain health factor > 1.3
- Set up alerts for low health
- Auto-repay when necessary

### 3. Optimize Yield
- Compare APYs across reserves
- Use multiply vaults for automation
- Rebalance periodically

### 4. Manage Risk
- Diversify collateral
- Use protected collateral for safety
- Monitor deposit/borrow caps

### 5. Leverage Automation
- Use multiply vaults for set-and-forget
- Implement auto-rebalancing
- Monitor via webhooks

## Resources

- [Kamino Finance](https://kamino.finance/)
- [Kamino Docs](https://docs.kamino.finance/)
- [klend-sdk GitHub](https://github.com/Kamino-Finance/klend-sdk)
- [Kamino Discord](https://discord.gg/kaminofinance)
- [Risk Dashboard](https://app.kamino.finance/risk)

## Next Steps

1. Install @kamino-finance/klend-sdk
2. Initialize Kamino market
3. Test lending on devnet
4. Implement borrowing strategies
5. Use eMode for leverage
6. Monitor position health
7. Deploy to mainnet

---

**Status**: Integration Guide Complete  
**Next**: Implement Kamino-powered agents  
**Last Updated**: February 4, 2026
