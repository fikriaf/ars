# OpenRouter Integration for ICB Agents

**Date**: February 4, 2026  
**Version**: 1.0  
**Purpose**: Enable ICB agents to use OpenRouter for AI model access and inference

## Overview

OpenRouter provides unified access to multiple AI models through a single API. ICB agents leverage OpenRouter for:

1. **Multi-model access** - Access 200+ AI models through one API
2. **Cost optimization** - Choose optimal model for each task
3. **Fallback routing** - Automatic failover if primary model unavailable
4. **Performance tracking** - Monitor model usage and costs
5. **Streaming support** - Real-time responses for agent interactions

## Why OpenRouter for ICB Agents?

| Agent Need | OpenRouter Solution | Benefit |
|------------|---------------------|---------|
| AI-powered decision making | 200+ models available | Choose best model for task |
| Cost control | Pay-per-use pricing | Optimize costs per operation |
| Reliability | Automatic failover | High availability |
| Performance | Streaming responses | Real-time agent interactions |
| Flexibility | Model switching | Adapt to changing needs |

## Setup

### 1. Install OpenRouter SDK

```bash
npm install @openrouter/sdk
```

### 2. Get API Key

```bash
# Sign up at https://openrouter.ai
# Get API key from dashboard
export OPENROUTER_API_KEY="sk-or-v1-..."
```

### 3. Initialize Client

```typescript
import { callModel } from '@openrouter/sdk';

// Simple usage
const response = await callModel({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    { role: 'user', content: 'Analyze this DeFi opportunity' }
  ]
});
```

## Core Integrations

### 1. Strategy Analysis Agent

**Use Case**: Use AI to analyze DeFi strategies

```typescript
class StrategyAnalysisAgent extends ICBAgent {
  async analyzeStrategy(ili: number, icr: number, vhr: number) {
    const response = await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'system',
          content: `You are a DeFi strategy analyst for Internet Central Bank. 
          Analyze market conditions and recommend optimal strategy.`
        },
        {
          role: 'user',
          content: `Current market conditions:
          - ILI (Internet Liquidity Index): ${ili}
          - ICR (Internet Credit Rate): ${icr} bps
          - VHR (Vault Health Ratio): ${vhr}%
          
          What strategy should I execute?`
        }
      ]
    });
    
    const strategy = this.parseStrategy(response.choices[0].message.content);
    
    return strategy;
  }
  
  parseStrategy(content: string) {
    // Parse AI response into actionable strategy
    return {
      action: 'lend', // or 'borrow', 'stake', 'provide_liquidity', 'hold'
      protocol: 'kamino',
      asset: 'USDC',
      amount: 10000,
      reasoning: content
    };
  }
  
  async executeAIStrategy() {
    // Get current market data
    const ili = await this.getILI();
    const icr = await this.getICR();
    const vhr = await this.getVHR();
    
    // Get AI recommendation
    const strategy = await this.analyzeStrategy(ili.value, icr.rate, vhr.ratio);
    
    console.log('AI Strategy:', strategy);
    
    // Execute strategy
    if (strategy.action === 'lend') {
      await this.executeLending({
        protocol: strategy.protocol,
        asset: strategy.asset,
        amount: strategy.amount
      });
    }
  }
}
```

### 2. Proposal Analysis Agent

**Use Case**: Use AI to analyze futarchy proposals

```typescript
class ProposalAnalysisAgent extends ICBAgent {
  async analyzeProposal(proposalId: number) {
    // Get proposal details
    const proposal = await this.getProposal(proposalId);
    
    // Get historical data
    const history = await this.getProposalHistory();
    
    // Use AI to analyze
    const response = await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'system',
          content: `You are a futarchy governance analyst for Internet Central Bank.
          Analyze proposals and predict outcomes based on historical data.`
        },
        {
          role: 'user',
          content: `Proposal ${proposalId}:
          - Type: ${proposal.policyType}
          - Parameters: ${JSON.stringify(proposal.params)}
          - Current ILI: ${proposal.currentILI}
          - Reason: ${proposal.reason}
          
          Historical data:
          ${JSON.stringify(history, null, 2)}
          
          Should I vote for or against this proposal? What is your confidence level?`
        }
      ]
    });
    
    const analysis = this.parseAnalysis(response.choices[0].message.content);
    
    return analysis;
  }
  
  parseAnalysis(content: string) {
    // Parse AI response
    return {
      recommendation: 'approve', // or 'reject'
      confidence: 0.85,
      reasoning: content,
      expectedOutcome: 'positive'
    };
  }
  
  async voteWithAI(proposalId: number) {
    // Get AI analysis
    const analysis = await this.analyzeProposal(proposalId);
    
    // Vote if confidence is high
    if (analysis.confidence > 0.8) {
      await this.voteOnProposal({
        proposalId,
        prediction: analysis.recommendation === 'approve',
        stakeAmount: 10000 * analysis.confidence // Stake proportional to confidence
      });
      
      console.log(`Voted ${analysis.recommendation} with ${analysis.confidence} confidence`);
    } else {
      console.log(`Skipped vote - confidence too low (${analysis.confidence})`);
    }
  }
}
```

### 3. Market Sentiment Agent

**Use Case**: Analyze market sentiment from multiple sources

```typescript
class MarketSentimentAgent extends ICBAgent {
  async analyzeSentiment(sources: string[]) {
    // Collect data from sources
    const data = await Promise.all(
      sources.map(source => this.fetchData(source))
    );
    
    // Use AI to analyze sentiment
    const response = await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'system',
          content: `You are a market sentiment analyst for DeFi protocols.
          Analyze data and provide sentiment score (-1 to 1).`
        },
        {
          role: 'user',
          content: `Analyze market sentiment from these sources:
          ${data.map((d, i) => `Source ${i + 1}: ${d}`).join('\n\n')}
          
          Provide:
          1. Overall sentiment score (-1 to 1)
          2. Key factors influencing sentiment
          3. Recommended action`
        }
      ]
    });
    
    const sentiment = this.parseSentiment(response.choices[0].message.content);
    
    return sentiment;
  }
  
  parseSentiment(content: string) {
    return {
      score: 0.65, // -1 to 1
      factors: ['High TVL growth', 'Positive social sentiment'],
      action: 'increase_exposure',
      reasoning: content
    };
  }
  
  async adjustStrategyBySentiment() {
    const sources = [
      'twitter_defi',
      'discord_solana',
      'telegram_crypto'
    ];
    
    const sentiment = await this.analyzeSentiment(sources);
    
    if (sentiment.score > 0.5) {
      // Bullish - increase exposure
      await this.increaseLiquidity();
    } else if (sentiment.score < -0.5) {
      // Bearish - reduce exposure
      await this.reduceLiquidity();
    }
  }
}
```

### 4. Multi-Model Strategy

**Use Case**: Use different models for different tasks

```typescript
class MultiModelAgent extends ICBAgent {
  // Fast model for quick decisions
  async quickAnalysis(data: any) {
    return await callModel({
      model: 'openai/gpt-4o-mini', // Fast, cheap
      messages: [
        {
          role: 'user',
          content: `Quick analysis: ${JSON.stringify(data)}`
        }
      ]
    });
  }
  
  // Powerful model for complex analysis
  async deepAnalysis(data: any) {
    return await callModel({
      model: 'anthropic/claude-sonnet-4', // Powerful, expensive
      messages: [
        {
          role: 'user',
          content: `Deep analysis: ${JSON.stringify(data)}`
        }
      ]
    });
  }
  
  // Specialized model for code generation
  async generateCode(prompt: string) {
    return await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: `Generate TypeScript code: ${prompt}`
        }
      ]
    });
  }
  
  async executeAdaptiveStrategy() {
    // Use fast model for routine checks
    const quickCheck = await this.quickAnalysis({
      ili: await this.getILI(),
      icr: await this.getICR()
    });
    
    // If quick check indicates significant change, use powerful model
    if (quickCheck.choices[0].message.content.includes('significant')) {
      const deepAnalysis = await this.deepAnalysis({
        ili: await this.getILI(),
        icr: await this.getICR(),
        vhr: await this.getVHR(),
        history: await this.getHistory()
      });
      
      // Execute strategy based on deep analysis
      await this.executeStrategy(deepAnalysis);
    }
  }
}
```

### 5. Streaming Responses

**Use Case**: Real-time agent interactions

```typescript
class StreamingAgent extends ICBAgent {
  async analyzeWithStreaming(data: any) {
    const stream = await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: `Analyze this data: ${JSON.stringify(data)}`
        }
      ],
      stream: true
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      fullResponse += content;
      
      // Process partial response in real-time
      process.stdout.write(content);
    }
    
    return fullResponse;
  }
  
  async interactiveStrategy() {
    console.log('Starting interactive strategy analysis...\n');
    
    const analysis = await this.analyzeWithStreaming({
      ili: await this.getILI(),
      icr: await this.getICR(),
      vhr: await this.getVHR()
    });
    
    console.log('\n\nAnalysis complete!');
    
    return analysis;
  }
}
```

### 6. Cost Optimization

**Use Case**: Optimize AI costs across operations

```typescript
class CostOptimizedAgent extends ICBAgent {
  private modelCosts = {
    'openai/gpt-4o-mini': 0.00015, // per 1K tokens
    'anthropic/claude-sonnet-4': 0.003,
    'anthropic/claude-opus-4': 0.015
  };
  
  selectModel(taskComplexity: 'low' | 'medium' | 'high') {
    switch (taskComplexity) {
      case 'low':
        return 'openai/gpt-4o-mini';
      case 'medium':
        return 'anthropic/claude-sonnet-4';
      case 'high':
        return 'anthropic/claude-opus-4';
    }
  }
  
  async analyzeWithBudget(data: any, maxCost: number) {
    // Estimate tokens
    const estimatedTokens = JSON.stringify(data).length * 1.3;
    
    // Select model based on budget
    let model = 'openai/gpt-4o-mini';
    
    if (maxCost > 0.01) {
      model = 'anthropic/claude-sonnet-4';
    }
    
    if (maxCost > 0.05) {
      model = 'anthropic/claude-opus-4';
    }
    
    const response = await callModel({
      model,
      messages: [
        {
          role: 'user',
          content: `Analyze: ${JSON.stringify(data)}`
        }
      ]
    });
    
    // Track actual cost
    const actualCost = (response.usage.total_tokens / 1000) * this.modelCosts[model];
    
    console.log(`Model: ${model}, Cost: $${actualCost.toFixed(4)}`);
    
    return response;
  }
}
```

## Complete Agent Example

### AI-Powered ICB Agent

```typescript
class AIOptimizedICBAgent extends ICBAgent {
  private totalAICost: number = 0;
  private dailyBudget: number = 1.0; // $1 per day
  
  async executeAIStrategy() {
    // Check budget
    if (this.totalAICost >= this.dailyBudget) {
      console.log('Daily AI budget exhausted');
      return;
    }
    
    // 1. Quick market check (cheap model)
    const quickCheck = await callModel({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Quick check - ILI: ${await this.getILI()}, ICR: ${await this.getICR()}`
        }
      ]
    });
    
    this.totalAICost += 0.0001;
    
    // 2. If significant change, deep analysis (powerful model)
    if (quickCheck.choices[0].message.content.includes('significant')) {
      const deepAnalysis = await callModel({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'system',
            content: 'You are a DeFi strategy expert for Internet Central Bank.'
          },
          {
            role: 'user',
            content: `Deep analysis needed:
            - ILI: ${await this.getILI()}
            - ICR: ${await this.getICR()}
            - VHR: ${await this.getVHR()}
            - Recent history: ${await this.getHistory()}
            
            Provide detailed strategy recommendation.`
          }
        ]
      });
      
      this.totalAICost += 0.01;
      
      // 3. Execute strategy
      const strategy = this.parseStrategy(deepAnalysis.choices[0].message.content);
      await this.executeStrategy(strategy);
    }
    
    // 4. Analyze proposals (medium model)
    const proposals = await this.getActiveProposals();
    
    for (const proposal of proposals) {
      const analysis = await callModel({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: `Analyze proposal ${proposal.id}: ${JSON.stringify(proposal)}`
          }
        ]
      });
      
      this.totalAICost += 0.005;
      
      const recommendation = this.parseAnalysis(analysis.choices[0].message.content);
      
      if (recommendation.confidence > 0.8) {
        await this.voteOnProposal({
          proposalId: proposal.id,
          prediction: recommendation.recommendation === 'approve',
          stakeAmount: 10000 * recommendation.confidence
        });
      }
    }
    
    console.log(`Total AI cost today: $${this.totalAICost.toFixed(4)}`);
  }
  
  async generateReport() {
    // Use AI to generate performance report
    const report = await callModel({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: `Generate performance report:
          - Total trades: ${this.totalTrades}
          - Win rate: ${this.winRate}%
          - Total profit: ${this.totalProfit} USDC
          - AI cost: $${this.totalAICost}
          
          Provide insights and recommendations.`
        }
      ],
      stream: true
    });
    
    console.log('\n=== Performance Report ===\n');
    
    for await (const chunk of report) {
      process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
    }
    
    console.log('\n\n=== End Report ===\n');
  }
}
```

## Model Selection Guide

### Recommended Models by Task

| Task | Model | Cost | Reasoning |
|------|-------|------|-----------|
| Quick checks | gpt-4o-mini | $0.00015/1K | Fast, cheap |
| Strategy analysis | claude-sonnet-4 | $0.003/1K | Balanced |
| Complex analysis | claude-opus-4 | $0.015/1K | Most powerful |
| Code generation | claude-sonnet-4 | $0.003/1K | Best for code |
| Sentiment analysis | gpt-4o | $0.0025/1K | Good for text |

## Best Practices

### 1. Cost Management
- Use cheap models for routine tasks
- Reserve expensive models for critical decisions
- Track costs per operation
- Set daily/monthly budgets

### 2. Model Selection
- Match model to task complexity
- Use streaming for long responses
- Implement fallback models
- Test different models for each use case

### 3. Prompt Engineering
- Clear, specific prompts
- Include relevant context
- Request structured output
- Use system prompts effectively

### 4. Error Handling
- Implement retry logic
- Handle rate limits
- Validate AI responses
- Have fallback strategies

### 5. Performance Optimization
- Cache similar queries
- Batch related requests
- Use async execution
- Monitor response times

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter SDK](https://github.com/OpenRouterTeam/openrouter-sdk)
- [Agent Skills](https://github.com/OpenRouterTeam/agent-skills)

## Next Steps

1. Sign up for OpenRouter account
2. Get API key
3. Install @openrouter/sdk
4. Test different models
5. Implement AI-powered agents
6. Monitor costs and performance
7. Optimize model selection

---

**Status**: Integration Guide Complete  
**Next**: Implement AI-powered agents  
**Last Updated**: February 4, 2026
