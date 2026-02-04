# OpenClaw Framework Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use OpenClaw framework for orchestration and automation

## Overview

OpenClaw is an agent orchestration framework that provides infrastructure for building, deploying, and managing AI agents. ICB leverages OpenClaw for:

1. **Agent orchestration** - Coordinate multiple specialized agents
2. **Automation** - Cron jobs, webhooks, and event-driven execution
3. **Multi-agent coordination** - Route tasks to specialized agents
4. **Session management** - Maintain agent state and context
5. **Skills system** - Modular capabilities for agents

## Why OpenClaw for ICB Agents?

| Agent Need | OpenClaw Solution | Benefit |
|------------|-------------------|---------|
| Orchestrate multiple agents | Multi-agent routing | Specialized agents for each task |
| Schedule operations | Cron jobs | Automated periodic execution |
| React to events | Webhooks | Event-driven architecture |
| Maintain context | Session management | Persistent agent memory |
| Modular capabilities | Skills system | Reusable agent functions |

## Architecture

### ICB Agent Ecosystem with OpenClaw

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Agent Orchestrator                       │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │Lending │  │ Yield  │  │Liquidity│ │Prediction│   │   │
│  │  │ Agent  │  │ Agent  │  │ Agent   │ │  Agent   │   │   │
│  │  └───┬────┘  └───┬────┘  └───┬─────┘ └───┬──────┘   │   │
│  │      │           │           │            │          │   │
│  └──────┼───────────┼───────────┼────────────┼──────────┘   │
│         │           │           │            │              │
│  ┌──────▼───────────▼───────────▼────────────▼──────────┐   │
│  │              Automation Layer                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Cron   │  │Webhooks │  │  Polls  │              │   │
│  │  │  Jobs   │  │         │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Skills & Tools                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │   ICB   │  │ Solana  │  │  DeFi   │              │   │
│  │  │  Skill  │  │  Skill  │  │  Skill  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Solana  │ │  Helius  │ │ Meteora  │
  │   RPC    │ │   API    │ │   API    │
  └──────────┘ └──────────┘ └──────────┘
```

## Setup

### 1. Install OpenClaw

```bash
# Install OpenClaw CLI
npm install -g openclaw

# Initialize OpenClaw gateway
openclaw setup
```

### 2. Configure OpenClaw for ICB

```yaml
# ~/.openclaw/config.yaml
gateway:
  name: icb-gateway
  port: 3000
  
agents:
  - name: lending-agent
    type: icb-lending
    model: anthropic/claude-sonnet-4
    skills:
      - icb-core
      - solana
      - defi
      
  - name: yield-agent
    type: icb-yield
    model: anthropic/claude-sonnet-4
    skills:
      - icb-core
      - solana
      - defi
      
  - name: liquidity-agent
    type: icb-liquidity
    model: anthropic/claude-sonnet-4
    skills:
      - icb-core
      - solana
      - defi
      
  - name: prediction-agent
    type: icb-prediction
    model: anthropic/claude-sonnet-4
    skills:
      - icb-core
      - solana
      - defi

automation:
  cron:
    - name: monitor-ili
      schedule: "*/5 * * * *"  # Every 5 minutes
      agent: lending-agent
      command: "Check ILI and execute strategy"
      
    - name: rebalance-portfolio
      schedule: "0 */6 * * *"  # Every 6 hours
      agent: yield-agent
      command: "Rebalance portfolio across protocols"
      
  webhooks:
    - name: proposal-created
      path: /webhooks/proposal-created
      agent: prediction-agent
      
    - name: oracle-update
      path: /webhooks/oracle-update
      agent: lending-agent
```

### 3. Create ICB Skill

```bash
# Create ICB skill directory
mkdir -p ~/.openclaw/skills/icb-core

# Create skill manifest
cat > ~/.openclaw/skills/icb-core/skill.yaml << EOF
name: icb-core
version: 1.0.0
description: Internet Central Bank core operations
author: @obscura_app

capabilities:
  - query_ili
  - query_icr
  - query_vhr
  - execute_lending
  - execute_staking
  - provide_liquidity
  - vote_on_proposal
  - create_proposal

dependencies:
  - solana
  - defi
EOF
```

## Core Integrations

### 1. Multi-Agent Orchestration

**Use Case**: Coordinate specialized agents for complex strategies

```typescript
import { OpenClawClient } from 'openclaw-sdk';

class ICBOrchestrator {
  private openclaw: OpenClawClient;
  
  async initialize() {
    this.openclaw = new OpenClawClient({
      gatewayUrl: 'http://localhost:3000',
      apiKey: process.env.OPENCLAW_API_KEY
    });
  }
  
  async executeBalancedStrategy() {
    // Route tasks to specialized agents
    const [iliData, yieldOpportunities, proposals] = await Promise.all([
      // Lending agent monitors ILI
      this.openclaw.sendToAgent({
        agent: 'lending-agent',
        message: 'Get current ILI and ICR data'
      }),
      
      // Yield agent finds opportunities
      this.openclaw.sendToAgent({
        agent: 'yield-agent',
        message: 'Find top 3 yield opportunities across protocols'
      }),
      
      // Prediction agent analyzes proposals
      this.openclaw.sendToAgent({
        agent: 'prediction-agent',
        message: 'Analyze active proposals and recommend votes'
      })
    ]);
    
    // Coordinate execution based on results
    if (iliData.ili < 5000) {
      // Low liquidity - lending agent withdraws
      await this.openclaw.sendToAgent({
        agent: 'lending-agent',
        message: 'Execute emergency withdrawal strategy'
      });
    } else if (iliData.ili > 7500) {
      // High liquidity - liquidity agent provides LP
      await this.openclaw.sendToAgent({
        agent: 'liquidity-agent',
        message: `Provide liquidity to ${yieldOpportunities.topPool}`
      });
    }
    
    // Prediction agent votes on proposals
    for (const proposal of proposals.recommendations) {
      if (proposal.shouldVote) {
        await this.openclaw.sendToAgent({
          agent: 'prediction-agent',
          message: `Vote ${proposal.prediction} on proposal ${proposal.id}`
        });
      }
    }
  }
}
```

### 2. Cron Jobs for Scheduled Operations

**Use Case**: Automate periodic agent operations

```bash
# Create cron job for ILI monitoring
openclaw cron create \
  --name "monitor-ili" \
  --schedule "*/5 * * * *" \
  --agent "lending-agent" \
  --command "Check ILI and execute strategy if needed"

# Create cron job for portfolio rebalancing
openclaw cron create \
  --name "rebalance-portfolio" \
  --schedule "0 */6 * * *" \
  --agent "yield-agent" \
  --command "Rebalance portfolio to maximize yield"

# Create cron job for proposal monitoring
openclaw cron create \
  --name "monitor-proposals" \
  --schedule "*/1 * * * *" \
  --agent "prediction-agent" \
  --command "Check for new proposals and vote if confidence > 0.8"

# List all cron jobs
openclaw cron list

# View cron job logs
openclaw cron logs monitor-ili
```

**Programmatic Cron Management**:

```typescript
class CronManager {
  private openclaw: OpenClawClient;
  
  async setupAutomation() {
    // Create ILI monitoring cron
    await this.openclaw.createCron({
      name: 'monitor-ili',
      schedule: '*/5 * * * *',
      agent: 'lending-agent',
      command: 'Check ILI and execute strategy',
      enabled: true
    });
    
    // Create rebalancing cron
    await this.openclaw.createCron({
      name: 'rebalance-portfolio',
      schedule: '0 */6 * * *',
      agent: 'yield-agent',
      command: 'Rebalance portfolio',
      enabled: true
    });
    
    console.log('Automation configured');
  }
  
  async pauseAutomation() {
    // Pause all cron jobs
    await this.openclaw.updateCron('monitor-ili', { enabled: false });
    await this.openclaw.updateCron('rebalance-portfolio', { enabled: false });
  }
  
  async resumeAutomation() {
    // Resume all cron jobs
    await this.openclaw.updateCron('monitor-ili', { enabled: true });
    await this.openclaw.updateCron('rebalance-portfolio', { enabled: true });
  }
}
```

### 3. Webhooks for Event-Driven Execution

**Use Case**: React to on-chain events in real-time

```typescript
class WebhookManager {
  private openclaw: OpenClawClient;
  
  async setupWebhooks() {
    // Webhook for proposal creation
    await this.openclaw.createWebhook({
      name: 'proposal-created',
      path: '/webhooks/proposal-created',
      agent: 'prediction-agent',
      handler: async (event) => {
        const proposal = event.data;
        
        return {
          message: `Analyze proposal ${proposal.id} and vote if confidence > 0.8`,
          context: { proposalId: proposal.id }
        };
      }
    });
    
    // Webhook for oracle updates
    await this.openclaw.createWebhook({
      name: 'oracle-update',
      path: '/webhooks/oracle-update',
      agent: 'lending-agent',
      handler: async (event) => {
        const { ili, icr } = event.data;
        
        if (ili < 5000) {
          return {
            message: 'ILI dropped below 5000, execute emergency strategy',
            context: { ili, icr }
          };
        }
        
        return null; // No action needed
      }
    });
    
    // Webhook for arbitrage opportunities
    await this.openclaw.createWebhook({
      name: 'arbitrage-opportunity',
      path: '/webhooks/arbitrage',
      agent: 'arbitrage-agent',
      handler: async (event) => {
        const opportunity = event.data;
        
        if (opportunity.profit > 100) {
          return {
            message: `Execute arbitrage: buy ${opportunity.buyProtocol}, sell ${opportunity.sellProtocol}`,
            context: opportunity
          };
        }
        
        return null;
      }
    });
  }
  
  async triggerWebhook(name: string, data: any) {
    // Manually trigger webhook (for testing)
    await this.openclaw.triggerWebhook(name, data);
  }
}
```

**Webhook Integration with Solana Events**:

```typescript
import { Connection } from '@solana/web3.js';

class SolanaWebhookBridge {
  private connection: Connection;
  private openclaw: OpenClawClient;
  
  async monitorProposalCreation() {
    // Subscribe to proposal program logs
    this.connection.onLogs(
      PROPOSAL_PROGRAM_ID,
      async (logs) => {
        if (logs.logs.some(log => log.includes('ProposalCreated'))) {
          // Parse proposal data
          const proposal = this.parseProposalFromLogs(logs);
          
          // Trigger OpenClaw webhook
          await this.openclaw.triggerWebhook('proposal-created', {
            proposalId: proposal.id,
            policyType: proposal.policyType,
            timestamp: Date.now()
          });
        }
      }
    );
  }
  
  async monitorOracleUpdates() {
    // Subscribe to ILI oracle account changes
    this.connection.onAccountChange(
      ILI_ORACLE_PUBKEY,
      async (accountInfo) => {
        const ili = this.parseILIData(accountInfo.data);
        
        // Trigger OpenClaw webhook
        await this.openclaw.triggerWebhook('oracle-update', {
          ili: ili.value,
          icr: ili.icr,
          timestamp: Date.now()
        });
      }
    );
  }
}
```

### 4. Session Management

**Use Case**: Maintain agent context across operations

```typescript
class SessionManager {
  private openclaw: OpenClawClient;
  
  async createAgentSession(agentName: string) {
    // Create persistent session for agent
    const session = await this.openclaw.createSession({
      agent: agentName,
      context: {
        strategy: 'balanced',
        riskTolerance: 'medium',
        maxPositionSize: 10000
      },
      memory: {
        recentTrades: [],
        performanceMetrics: {}
      }
    });
    
    return session.id;
  }
  
  async sendToSession(sessionId: string, message: string) {
    // Send message to existing session (maintains context)
    const response = await this.openclaw.sendToSession({
      sessionId,
      message
    });
    
    return response;
  }
  
  async updateSessionContext(sessionId: string, updates: any) {
    // Update session context
    await this.openclaw.updateSession(sessionId, {
      context: updates
    });
  }
  
  async getSessionHistory(sessionId: string) {
    // Get session message history
    const history = await this.openclaw.getSessionHistory(sessionId);
    
    return history;
  }
}
```

### 5. Skills System

**Use Case**: Modular agent capabilities

**ICB Core Skill Implementation**:

```typescript
// ~/.openclaw/skills/icb-core/index.ts
import { Skill, Tool } from 'openclaw-sdk';

export class ICBCoreSkill extends Skill {
  name = 'icb-core';
  version = '1.0.0';
  
  tools: Tool[] = [
    {
      name: 'query_ili',
      description: 'Query current Internet Liquidity Index',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const ili = await this.getILI();
        return { ili: ili.value, timestamp: ili.timestamp };
      }
    },
    
    {
      name: 'query_icr',
      description: 'Query current Internet Credit Rate',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const icr = await this.getICR();
        return { rate: icr.rate, confidence: icr.confidence };
      }
    },
    
    {
      name: 'execute_lending',
      description: 'Execute lending operation',
      parameters: {
        type: 'object',
        properties: {
          protocol: { type: 'string' },
          asset: { type: 'string' },
          amount: { type: 'number' }
        },
        required: ['protocol', 'asset', 'amount']
      },
      handler: async (params) => {
        const signature = await this.executeLending(params);
        return { signature, status: 'success' };
      }
    },
    
    {
      name: 'vote_on_proposal',
      description: 'Vote on futarchy proposal',
      parameters: {
        type: 'object',
        properties: {
          proposalId: { type: 'number' },
          prediction: { type: 'boolean' },
          stakeAmount: { type: 'number' }
        },
        required: ['proposalId', 'prediction', 'stakeAmount']
      },
      handler: async (params) => {
        const signature = await this.voteOnProposal(params);
        return { signature, status: 'success' };
      }
    }
  ];
  
  private async getILI() {
    // Implementation
  }
  
  private async getICR() {
    // Implementation
  }
  
  private async executeLending(params: any) {
    // Implementation
  }
  
  private async voteOnProposal(params: any) {
    // Implementation
  }
}
```

**Install Skill**:

```bash
# Install ICB skill
openclaw skills install icb-core

# List installed skills
openclaw skills list

# Enable skill for agent
openclaw agents update lending-agent --add-skill icb-core
```

## Complete Agent Example

### Multi-Agent ICB System with OpenClaw

```typescript
class ICBOpenClawSystem {
  private openclaw: OpenClawClient;
  private sessionManager: SessionManager;
  private cronManager: CronManager;
  private webhookManager: WebhookManager;
  
  async initialize() {
    // Initialize OpenClaw client
    this.openclaw = new OpenClawClient({
      gatewayUrl: process.env.OPENCLAW_GATEWAY_URL,
      apiKey: process.env.OPENCLAW_API_KEY
    });
    
    // Initialize managers
    this.sessionManager = new SessionManager(this.openclaw);
    this.cronManager = new CronManager(this.openclaw);
    this.webhookManager = new WebhookManager(this.openclaw);
    
    // Setup automation
    await this.cronManager.setupAutomation();
    await this.webhookManager.setupWebhooks();
    
    console.log('ICB OpenClaw system initialized');
  }
  
  async deployAgents() {
    // Deploy specialized agents
    const agents = [
      {
        name: 'lending-agent',
        type: 'icb-lending',
        skills: ['icb-core', 'solana', 'defi'],
        systemPrompt: 'You are a lending optimization agent for ICB. Monitor ILI/ICR and execute optimal lending strategies.'
      },
      {
        name: 'yield-agent',
        type: 'icb-yield',
        skills: ['icb-core', 'solana', 'defi'],
        systemPrompt: 'You are a yield optimization agent for ICB. Find and execute highest yield opportunities across protocols.'
      },
      {
        name: 'liquidity-agent',
        type: 'icb-liquidity',
        skills: ['icb-core', 'solana', 'defi'],
        systemPrompt: 'You are a liquidity provision agent for ICB. Provide LP based on ILI signals and market conditions.'
      },
      {
        name: 'prediction-agent',
        type: 'icb-prediction',
        skills: ['icb-core', 'solana', 'defi'],
        systemPrompt: 'You are a prediction market agent for ICB. Analyze proposals and vote based on predicted outcomes.'
      }
    ];
    
    for (const agent of agents) {
      await this.openclaw.createAgent(agent);
      console.log(`Deployed ${agent.name}`);
    }
  }
  
  async executeCoordinatedStrategy() {
    // Create sessions for all agents
    const sessions = {
      lending: await this.sessionManager.createAgentSession('lending-agent'),
      yield: await this.sessionManager.createAgentSession('yield-agent'),
      liquidity: await this.sessionManager.createAgentSession('liquidity-agent'),
      prediction: await this.sessionManager.createAgentSession('prediction-agent')
    };
    
    // Execute coordinated strategy
    const results = await Promise.all([
      this.sessionManager.sendToSession(
        sessions.lending,
        'Analyze current ILI/ICR and recommend lending strategy'
      ),
      this.sessionManager.sendToSession(
        sessions.yield,
        'Find top 3 yield opportunities and calculate expected returns'
      ),
      this.sessionManager.sendToSession(
        sessions.liquidity,
        'Analyze liquidity needs and recommend LP positions'
      ),
      this.sessionManager.sendToSession(
        sessions.prediction,
        'Analyze active proposals and recommend votes'
      )
    ]);
    
    console.log('Coordinated strategy results:', results);
    
    return results;
  }
  
  async monitorPerformance() {
    // Get performance metrics from all agents
    const agents = ['lending-agent', 'yield-agent', 'liquidity-agent', 'prediction-agent'];
    
    const metrics = await Promise.all(
      agents.map(async (agent) => {
        const status = await this.openclaw.getAgentStatus(agent);
        const sessions = await this.openclaw.getAgentSessions(agent);
        
        return {
          agent,
          status: status.status,
          activeSessions: sessions.length,
          totalMessages: status.totalMessages,
          uptime: status.uptime
        };
      })
    );
    
    return metrics;
  }
  
  async shutdown() {
    // Gracefully shutdown all agents
    await this.cronManager.pauseAutomation();
    
    const agents = ['lending-agent', 'yield-agent', 'liquidity-agent', 'prediction-agent'];
    
    for (const agent of agents) {
      await this.openclaw.stopAgent(agent);
    }
    
    console.log('ICB OpenClaw system shutdown complete');
  }
}
```

## Testing

### Local Development

```bash
# Start OpenClaw gateway in development mode
openclaw gateway start --dev

# Test agent communication
openclaw message lending-agent "What is the current ILI?"

# Test cron job
openclaw cron trigger monitor-ili

# Test webhook
curl -X POST http://localhost:3000/webhooks/proposal-created \
  -H "Content-Type: application/json" \
  -d '{"proposalId": 42, "policyType": "MintICU"}'

# View agent logs
openclaw logs lending-agent --follow

# Check agent health
openclaw health
```

### Devnet Testing

```typescript
async function testICBAgents() {
  const system = new ICBOpenClawSystem();
  
  // Initialize
  await system.initialize();
  
  // Deploy agents
  await system.deployAgents();
  
  // Execute test strategy
  const results = await system.executeCoordinatedStrategy();
  
  console.log('Test results:', results);
  
  // Monitor performance
  const metrics = await system.monitorPerformance();
  
  console.log('Performance metrics:', metrics);
  
  // Shutdown
  await system.shutdown();
}
```

## Best Practices

### 1. Agent Specialization
- Create focused agents for specific tasks
- Use multi-agent routing for complex workflows
- Maintain clear agent responsibilities

### 2. Automation Strategy
- Use cron jobs for periodic operations
- Use webhooks for event-driven execution
- Use polls for external API monitoring

### 3. Session Management
- Create sessions for related operations
- Update context as strategy evolves
- Clean up inactive sessions

### 4. Error Handling
- Implement retry logic for failed operations
- Monitor agent health continuously
- Set up alerts for critical failures

### 5. Performance Optimization
- Batch related operations
- Use async execution where possible
- Monitor resource usage

## Resources

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Discord](https://discord.gg/openclaw)
- [Skills Repository](https://github.com/openclaw/skills)

## Next Steps

1. Install OpenClaw CLI
2. Configure gateway for ICB
3. Create ICB skill
4. Deploy specialized agents
5. Set up automation (cron + webhooks)
6. Test on devnet
7. Deploy to mainnet

---

**Status**: Integration Guide Complete  
**Next**: Implement OpenClaw-powered agents  
**Last Updated**: February 4, 2026
