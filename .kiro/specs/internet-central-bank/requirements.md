# Internet Central Bank (ICB) - Requirements

## Project Overview

The Internet Central Bank (ICB) is an **Agent-First DeFi Protocol** - a self-regulating monetary coordination layer built exclusively for AI agents on Solana. Unlike traditional DeFi protocols designed for human users, ICB provides machine-readable APIs, autonomous execution primitives, and agent-optimized interfaces for on-chain activities.

**Vision**: Create the first autonomous monetary policy engine where AI agents coordinate liquidity, execute DeFi strategies, and govern through prediction markets - no human intervention required.

**Agent-First Architecture**: 
- All interactions via OpenClaw agent framework
- Machine-readable APIs (no UI required for core functions)
- Agent authentication via cryptographic signatures
- Autonomous execution of lending, borrowing, staking, prediction markets, yield farming, and liquidity provision

**Hackathon Scope**: Build a minimal viable ICB demonstrating core agent primitives - the Internet Liquidity Index (ILI), agent-driven futarchy governance, and autonomous reserve management.

## Target Users

### Primary Users (AI Agents)
- **DeFi Strategy Agents**: Execute lending/borrowing strategies based on ICR signals (Kamino Finance)
- **Liquidity Management Agents**: Optimize LP positions across protocols using ILI data (Meteora Protocol)
- **Yield Farming Agents**: Automate yield optimization based on macro indicators (Kamino Multiply Vaults, Meteora Dynamic Vaults)
- **Prediction Market Agents**: Participate in futarchy governance and policy forecasting (OpenRouter AI analysis)
- **Treasury Management Agents**: Manage DAO treasuries with macro-aware strategies
- **Arbitrage Agents**: Execute cross-protocol arbitrage using ICB coordination signals (MagicBlock ERs for sub-100ms execution)
- **High-Frequency Trading Agents**: Execute rapid strategies on Ephemeral Rollups (MagicBlock)
- **AI-Powered Strategy Agents**: Use OpenRouter for multi-model decision making
- **Payment-Enabled Agents**: Pay for premium data and APIs using x402-PayAI

### Secondary Users (Agent Developers)
- **OpenClaw Agent Builders**: Developers creating agents that integrate with ICB
- **Protocol Integrators**: DeFi protocols exposing agent-friendly APIs
- **Agent Orchestrators**: Systems coordinating multiple agents for complex strategies

### Tertiary Users (Human Observers)
- **Researchers**: Monitor agent behavior and system health via dashboard
- **Protocol Governors**: Emergency intervention only (circuit breakers)
- **Auditors**: Verify agent activity and system integrity

## Core User Stories

### 1. Agent Liquidity Index Monitoring
**As an** AI agent managing DeFi positions  
**I want to** query the Internet Liquidity Index (ILI) via machine-readable API  
**So that** I can autonomously adjust my strategies based on systemic liquidity health

**Acceptance Criteria**:
- 1.1 ILI aggregates data from at least 5 Solana DeFi protocols (Jupiter, Meteora, Kamino, MarginFi, Solend)
- 1.2 ILI calculation includes: yield heat (avg APY), volatility pulse (price variance), liquidity flow (TVL growth)
- 1.3 ILI updates every 5 minutes via on-chain oracle (Helius RPC for reliable access)
- 1.4 Historical ILI data queryable via JSON-RPC for last 7 days
- 1.5 ILI formula: `ILI = κ × (avg_yield / (1 + volatility)) × log(1 + normalized_TVL)`
- 1.6 Agent-readable response format (no UI required)
- 1.7 OpenClaw agent can subscribe to ILI updates via WebSocket (Helius LaserStream)
- 1.8 Meteora DLMM and Dynamic Vault data integrated
- 1.9 Kamino lending rates and TVL included
- 1.10 Helius Priority Fee API used for optimal transaction costs

### 2. Agent-Driven Futarchy Proposals
**As an** AI agent participating in governance  
**I want to** create and vote on monetary policy proposals through prediction markets  
**So that** policy decisions are driven by agent forecasts, not human committees

**Acceptance Criteria**:
- 2.1 Agents can create policy proposals via Solana instruction (e.g., "Expand $ICU supply by 2%")
- 2.2 Each proposal has a prediction market: "Will ILI stabilize if we execute this?"
- 2.3 Agents stake $ICB tokens to vote YES/NO via cryptographic signatures
- 2.4 Proposals have 24-hour voting period (configurable by agents)
- 2.5 Winning prediction (>50% stake) triggers automatic policy execution
- 2.6 Quadratic staking prevents single-agent dominance (diminishing voting power)
- 2.7 Failed predictions result in stake slashing (10% penalty)
- 2.8 All proposal data accessible via JSON-RPC (no web UI required)
- 2.9 OpenClaw agents can monitor proposals via event subscriptions (Helius LaserStream)
- 2.10 OpenRouter AI can analyze proposals and provide voting recommendations
- 2.11 Agents can pay for premium proposal analysis via x402-PayAI
- 2.12 High-frequency voting via MagicBlock ERs for rapid consensus

### 3. Autonomous Reserve Vault Management
**As an** AI agent managing the ICB protocol  
**I want to** execute multi-asset reserve rebalancing algorithmically  
**So that** the system maintains collateral backing without human intervention

**Acceptance Criteria**:
- 3.1 Reserve vault accepts USDC, SOL, mSOL (Marinade staked SOL), and other LSTs
- 3.2 Vault calculates Vault Health Ratio (VHR) = reserves / liabilities
- 3.3 VHR must stay above 150% (circuit breaker triggers below)
- 3.4 Agents can trigger rebalancing when asset volatility exceeds thresholds
- 3.5 Rebalancing logic: high volatility → shift to stables, low volatility → shift to yield assets
- 3.6 All vault operations emit Solana events for agent monitoring (Helius LaserStream)
- 3.7 Agents can query vault state via on-chain account reads (Helius RPC)
- 3.8 Kamino Finance integration for lending/borrowing operations
- 3.9 Meteora Protocol integration for liquidity provision
- 3.10 Jupiter aggregator for optimal swap execution
- 3.11 MagicBlock ERs for high-frequency rebalancing (sub-100ms)
- 3.12 OpenClaw webhooks trigger rebalancing on volatility events
- 3.13 Helius Sender ensures 95%+ transaction landing rate

### 4. Agent-Accessible Credit Rate Oracle
**As an** lending/borrowing agent  
**I want to** query the Internet Credit Rate (ICR) as a reference rate  
**So that** I can set competitive and coordinated interest rates autonomously

**Acceptance Criteria**:
- 4.1 ICR is calculated from weighted average of top 5 Solana lending protocols (Kamino, Solend, MarginFi, Port, Mango)
- 4.2 ICR updates every 10 minutes via Helius RPC
- 4.3 ICR is published on-chain via Pyth-compatible oracle format
- 4.4 Agents can query ICR with single Solana account read
- 4.5 ICR includes confidence interval (±X basis points)
- 4.6 OpenClaw agents can subscribe to ICR updates via Helius LaserStream
- 4.7 Machine-readable response format (JSON-RPC)
- 4.8 Kamino lending rates prioritized (largest TVL)
- 4.9 Real-time updates via Helius LaserStream gRPC

### 5. Agent-Controlled Mint/Burn Mechanism
**As an** policy execution agent  
**I want to** mint or burn synthetic $ICU tokens based on futarchy decisions  
**So that** I can expand or contract liquidity algorithmically

**Acceptance Criteria**:
- 5.1 $ICU is an SPL token with controlled mint authority
- 5.2 Mint operations are capped at ±2% of total supply per epoch (24 hours)
- 5.3 Mint/burn requires successful futarchy vote (agent consensus)
- 5.4 Each operation collects 0.1% stability fee → Insurance Fund
- 5.5 Circuit breaker pauses minting if VHR < 150%
- 5.6 All mint/burn events are logged on-chain with reasoning hash
- 5.7 Agents can execute mint/burn via Solana instructions
- 5.8 OpenClaw agents receive execution confirmations

### 6. Agent-Verified Oracle Aggregation
**As an** oracle monitoring agent  
**I want to** verify price/yield data from multiple oracle sources  
**So that** I can detect manipulation and ensure data integrity

**Acceptance Criteria**:
- 6.1 Price data comes from 3 sources: Pyth, Switchboard, Birdeye
- 6.2 System uses median value (not average) to resist outliers
- 6.3 Outlier detection: flag values >2σ from median
- 6.4 Time-weighted averaging (EMA) over 1-hour window
- 6.5 Oracle health monitoring: pause if 2+ sources fail
- 6.6 Each oracle update includes provenance metadata
- 6.7 Agents can query oracle health status via JSON-RPC
- 6.8 OpenClaw agents can subscribe to oracle health alerts

### 7. Agent Monitoring Dashboard (Optional)
**As a** human observer or researcher  
**I want to** see a real-time "macro brain" dashboard  
**So that** I can understand agent activity and system state

**Acceptance Criteria**:
- 7.1 Dashboard shows: ILI (with heartbeat animation), ICR, VHR, active proposals
- 7.2 Live chart of ILI over 24 hours
- 7.3 Reserve composition pie chart (USDC/SOL/mSOL percentages)
- 7.4 Active futarchy proposals with current vote distribution
- 7.5 Recent policy execution history (last 10 actions)
- 7.6 System health indicators (oracle status, circuit breaker state)
- 7.7 Agent activity metrics (number of active agents, transaction volume)
- 7.8 Read-only interface (no wallet connection required)

### 8. OpenClaw Agent SDK
**As an** agent developer  
**I want to** integrate ICB data feeds with minimal code  
**So that** my OpenClaw agents can use ICR and ILI in their strategies

**Acceptance Criteria**:
- 8.1 OpenClaw skill published for ICB integration
- 8.2 Single function to query ILI: `agent.icb.getILI()`
- 8.3 Single function to query ICR: `agent.icb.getICR()`
- 8.4 Subscribe to real-time updates via agent event system (Helius LaserStream)
- 8.5 Agent can create proposals: `agent.icb.createProposal(params)`
- 8.6 Agent can vote on proposals: `agent.icb.vote(proposalId, prediction, stake)`
- 8.7 Agent can execute DeFi operations: `agent.icb.lend()`, `agent.icb.stake()`, etc.
- 8.8 SDK includes 6 example agent strategies
- 8.9 Documentation with agent integration patterns
- 8.10 Kamino Finance integration: `agent.kamino.supply()`, `agent.kamino.borrow()`, `agent.kamino.enterMultiplyVault()`
- 8.11 Meteora Protocol integration: `agent.meteora.addLiquidity()`, `agent.meteora.enterDynamicVault()`
- 8.12 MagicBlock ER integration: `agent.magicblock.createSession()`, `agent.magicblock.executeOnER()`
- 8.13 OpenRouter AI integration: `agent.openrouter.analyze()` for strategy decisions
- 8.14 x402-PayAI integration: `agent.x402.payForData()` for premium APIs
- 8.15 Helius integration: `agent.helius.sendTransaction()`, `agent.helius.subscribeToAccount()`

## Non-Functional Requirements

### Performance
- ILI calculation completes in <2 seconds
- Oracle updates process in <5 seconds
- Dashboard loads in <3 seconds
- Support 100 concurrent users

### Security
- All smart contracts audited (self-audit for hackathon)
- Multi-sig admin controls for emergency functions
- Rate limiting on oracle updates (prevent spam)
- Formal verification of mint/burn invariants

### Scalability
- System handles 1000 futarchy proposals
- Reserve vault supports 10+ asset types (extensible)
- Oracle aggregation scales to 10+ sources

### Usability
- Dashboard requires no wallet connection to view data
- Clear error messages for failed transactions
- Tooltips explain all technical terms
- Mobile-friendly interface

## Technical Constraints

### Blockchain
- **Platform**: Solana (mainnet-beta or devnet for demo)
- **Framework**: Anchor for smart contracts
- **Language**: Rust for on-chain, TypeScript for off-chain

### Data Sources
- **Oracles**: Pyth, Switchboard, Birdeye API
- **DeFi Protocols**: Jupiter (swaps), Meteora (liquidity), Kamino/MarginFi (lending)
- **RPC**: Helius for reliable Solana RPC access

### Frontend
- **Framework**: Vite + React + TypeScript (for human observer dashboard only)
- **Styling**: Tailwind CSS
- **Charts**: Recharts or Chart.js
- **Purpose**: Read-only monitoring interface (optional for MVP)

### Agent Interface
- **Framework**: OpenClaw agent framework
- **Protocol**: Solana JSON-RPC + WebSocket
- **Authentication**: Cryptographic signatures (ed25519)
- **SDK**: OpenClaw skill for ICB integration

### Backend
- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL for historical data
- **Caching**: Redis for oracle data
- **API**: REST + WebSocket

## Out of Scope (Future Work)

The following are explicitly OUT OF SCOPE for the 10-day hackathon:

- ❌ Human wallet UI (agents only for MVP)
- ❌ Cross-chain coordination (Solana-only for now)
- ❌ Advanced agent strategies (basic lending/staking only)
- ❌ Advanced futarchy features (conditional markets, multi-outcome)
- ❌ Token launch and liquidity mining
- ❌ Mobile app (agent-only interface)
- ❌ Governance token distribution
- ❌ Integration with 10+ protocols (start with 3-5)
- ❌ Formal security audit (self-audit only)
- ❌ Mainnet deployment with real funds (devnet demo)

## Success Metrics

### Hackathon Demo Goals
1. ✅ Live ILI calculation from 3+ protocols
2. ✅ At least 3 OpenClaw agents executing DeFi strategies
3. ✅ At least 1 successful agent-driven futarchy vote executed
4. ✅ Reserve vault with 3 asset types managed by agents
5. ✅ Working agent monitoring dashboard with real-time data
6. ✅ OpenClaw SDK with 2 example agent strategies
7. ✅ Video demo showing full agent workflow

### Technical Metrics
- ILI accuracy: ±5% of manual calculation
- Oracle uptime: >95%
- Transaction success rate: >90%
- Dashboard load time: <3s

### Judging Criteria Alignment
- **Technical Execution**: Novel agent-first architecture + futarchy + oracle aggregation
- **Creativity**: First agent-exclusive DeFi coordination layer
- **Real-World Utility**: Solves agent liquidity coordination problem
- **Solana Integration**: Deep integration with Jupiter, Meteora, Pyth
- **Most Agentic**: 100% autonomous - agents execute all DeFi operations without human intervention

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Oracle manipulation | Multi-source median aggregation + outlier detection |
| Smart contract bugs | Extensive testing + circuit breakers |
| Futarchy gaming | Quadratic staking + slashing penalties |
| Low adoption | Partner with 2-3 protocols for initial integration |

### Timeline Risks
| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP focus, defer advanced features |
| Integration delays | Use well-documented APIs (Pyth, Jupiter) |
| Testing time | Automated test suite from day 1 |

## Dependencies

### External Services
- Helius RPC (free tier sufficient)
- Pyth Network (free oracle data)
- Birdeye API (free tier)
- Jupiter API (free)
- Meteora API (free)

### Development Tools
- Anchor CLI
- Solana CLI
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

## Glossary

- **ILI**: Internet Liquidity Index - composite metric of DeFi health
- **ICR**: Internet Credit Rate - reference interest rate for agents
- **ICU**: Internet Currency Unit - synthetic unit of account
- **VHR**: Vault Health Ratio - reserves/liabilities ratio
- **Futarchy**: Governance by prediction markets (agent-driven)
- **LST**: Liquid Staking Token (e.g., mSOL)
- **TVL**: Total Value Locked
- **APY**: Annual Percentage Yield
- **OpenClaw Agent**: AI agent built on OpenClaw framework
- **Agent-First**: Protocol designed for AI agents, not humans
- **JSON-RPC**: Machine-readable API protocol for agents

## References

- [Futarchy Whitepaper](https://mason.gmu.edu/~rhanson/futarchy.html)
- [Pyth Network Docs](https://docs.pyth.network/)
- [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Meteora Docs](https://docs.meteora.ag/)
- [Anchor Framework](https://www.anchor-lang.com/)
