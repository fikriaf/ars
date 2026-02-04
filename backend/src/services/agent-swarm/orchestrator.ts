import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { config } from '../../config';

export interface AgentMessage {
  type: string;
  from: string;
  to: string;
  payload: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  correlationId?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  agent: string;
  timestamp: number;
}

export interface WorkflowStep {
  agent: string;
  action: string;
  inputs: any;
  requires_approval?: string[];
  uses?: string;
}

export interface Workflow {
  description: string;
  trigger: string;
  priority?: string;
  steps: WorkflowStep[];
}

/**
 * ICB Agent Swarm Orchestrator
 * Coordinates multi-agent system for autonomous operations
 */
export class AgentOrchestrator extends EventEmitter {
  private redis: Redis;
  private agents: Map<string, AgentInfo> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();

  constructor() {
    super();
    this.redis = new Redis(config.redis.url);
    this.initializeAgents();
    this.initializeWorkflows();
    this.startMessageListener();
    console.log('✅ Agent Orchestrator initialized');
  }

  /**
   * Initialize agent registry
   */
  private initializeAgents(): void {
    const agents = [
      {
        id: 'policy-agent',
        role: 'specialist',
        capabilities: ['ili-analysis', 'policy-recommendation', 'ai-forecasting'],
        status: 'active',
      },
      {
        id: 'oracle-agent',
        role: 'specialist',
        capabilities: ['price-aggregation', 'outlier-detection', 'health-monitoring'],
        status: 'active',
      },
      {
        id: 'defi-agent',
        role: 'specialist',
        capabilities: ['swap-execution', 'yield-optimization', 'rebalancing'],
        status: 'active',
      },
      {
        id: 'governance-agent',
        role: 'specialist',
        capabilities: ['proposal-management', 'vote-aggregation', 'slashing'],
        status: 'active',
      },
      {
        id: 'risk-agent',
        role: 'specialist',
        capabilities: ['vhr-monitoring', 'circuit-breaker', 'risk-scoring'],
        status: 'active',
      },
      {
        id: 'execution-agent',
        role: 'specialist',
        capabilities: ['transaction-execution', 'er-management', 'state-commitment'],
        status: 'active',
      },
      {
        id: 'payment-agent',
        role: 'specialist',
        capabilities: ['x402-payments', 'budget-tracking', 'cost-optimization'],
        status: 'active',
      },
      {
        id: 'monitoring-agent',
        role: 'specialist',
        capabilities: ['health-checks', 'alerting', 'dashboard-updates'],
        status: 'active',
      },
      {
        id: 'learning-agent',
        role: 'specialist',
        capabilities: ['pattern-recognition', 'strategy-optimization'],
        status: 'active',
      },
    ];

    agents.forEach((agent) => {
      this.agents.set(agent.id, agent as AgentInfo);
    });
  }

  /**
   * Initialize workflow definitions
   */
  private initializeWorkflows(): void {
    this.workflows.set('ili-update', {
      description: 'Update ILI every 5 minutes',
      trigger: 'cron:*/5 * * * *',
      steps: [
        {
          agent: 'oracle-agent',
          action: 'aggregate-prices',
          inputs: { tokens: ['SOL', 'USDC', 'mSOL'] },
        },
        {
          agent: 'defi-agent',
          action: 'fetch-protocol-metrics',
          inputs: { protocols: ['jupiter', 'meteora', 'kamino'] },
        },
        {
          agent: 'policy-agent',
          action: 'calculate-ili',
          inputs: { source: 'aggregated' },
        },
        {
          agent: 'monitoring-agent',
          action: 'update-dashboard',
          inputs: { metric: 'ili' },
        },
      ],
    });

    this.workflows.set('policy-execution', {
      description: 'Execute approved policy proposal',
      trigger: 'event:proposal-passed',
      steps: [
        {
          agent: 'governance-agent',
          action: 'verify-proposal',
          inputs: {},
        },
        {
          agent: 'risk-agent',
          action: 'assess-risk',
          inputs: {},
        },
        {
          agent: 'execution-agent',
          action: 'execute-policy',
          inputs: {},
          requires_approval: ['risk-agent'],
        },
        {
          agent: 'monitoring-agent',
          action: 'log-execution',
          inputs: {},
        },
      ],
    });

    this.workflows.set('circuit-breaker', {
      description: 'Emergency circuit breaker activation',
      trigger: 'event:vhr-critical',
      priority: 'critical',
      steps: [
        {
          agent: 'risk-agent',
          action: 'assess-severity',
          inputs: {},
        },
        {
          agent: 'execution-agent',
          action: 'activate-circuit-breaker',
          inputs: {},
        },
        {
          agent: 'monitoring-agent',
          action: 'send-critical-alert',
          inputs: {},
        },
      ],
    });
  }

  /**
   * Start listening for agent messages
   */
  private startMessageListener(): void {
    this.redis.subscribe('icb:orchestrator', (err) => {
      if (err) {
        console.error('Failed to subscribe to orchestrator channel:', err);
      }
    });

    this.redis.on('message', async (channel, message) => {
      try {
        const msg: AgentMessage = JSON.parse(message);
        await this.handleMessage(msg);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
  }

  /**
   * Handle incoming agent message
   */
  private async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`📨 Message from ${message.from}: ${message.type}`);

    switch (message.type) {
      case 'workflow-request':
        await this.executeWorkflow(message.payload.workflow, message.payload.inputs);
        break;
      case 'agent-response':
        await this.handleAgentResponse(message);
        break;
      case 'consensus-request':
        await this.requestConsensus(message.payload);
        break;
      case 'alert':
        await this.handleAlert(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputs: any = {}
  ): Promise<{ success: boolean; executionId: string }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `${workflowId}-${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflow: workflowId,
      status: 'running',
      currentStep: 0,
      results: [],
      startedAt: Date.now(),
    };

    this.activeWorkflows.set(executionId, execution);

    console.log(`🚀 Starting workflow: ${workflowId} (${executionId})`);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        execution.currentStep = i;

        console.log(`  Step ${i + 1}/${workflow.steps.length}: ${step.agent}.${step.action}`);

        // Check if approval required
        if (step.requires_approval) {
          const approved = await this.requestApproval(step.requires_approval, step);
          if (!approved) {
            throw new Error(`Step ${i + 1} not approved`);
          }
        }

        // Execute step
        const result = await this.executeStep(step, inputs);
        execution.results.push(result);

        if (!result.success) {
          throw new Error(`Step ${i + 1} failed: ${result.error}`);
        }

        // Pass result to next step
        inputs = { ...inputs, ...result.data };
      }

      execution.status = 'completed';
      execution.completedAt = Date.now();

      console.log(`✅ Workflow completed: ${workflowId}`);

      return { success: true, executionId };
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = Date.now();

      console.error(`❌ Workflow failed: ${workflowId}`, error);

      return { success: false, executionId };
    }
  }

  /**
   * Execute workflow step
   */
  private async executeStep(step: WorkflowStep, inputs: any): Promise<AgentResponse> {
    const message: AgentMessage = {
      type: 'action-request',
      from: 'icb-orchestrator',
      to: step.agent,
      payload: {
        action: step.action,
        inputs: { ...step.inputs, ...inputs },
      },
      timestamp: Date.now(),
      priority: 'normal',
    };

    // Publish message to agent channel
    await this.sendMessage(step.agent, message);

    // Wait for response (with timeout)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'Agent response timeout',
          agent: step.agent,
          timestamp: Date.now(),
        });
      }, 30000); // 30s timeout

      const handler = (response: AgentResponse) => {
        if (response.agent === step.agent) {
          clearTimeout(timeout);
          this.removeListener('agent-response', handler);
          resolve(response);
        }
      };

      this.on('agent-response', handler);
    });
  }

  /**
   * Send message to agent
   */
  async sendMessage(agentId: string, message: AgentMessage): Promise<void> {
    const channel = `icb:${agentId.replace('-agent', '')}`;
    await this.redis.publish(channel, JSON.stringify(message));
  }

  /**
   * Handle agent response
   */
  private async handleAgentResponse(message: AgentMessage): Promise<void> {
    const response: AgentResponse = message.payload;
    this.emit('agent-response', response);
  }

  /**
   * Request approval from agents
   */
  private async requestApproval(
    approvers: string[],
    step: WorkflowStep
  ): Promise<boolean> {
    const approvals: boolean[] = [];

    for (const approver of approvers) {
      const message: AgentMessage = {
        type: 'approval-request',
        from: 'icb-orchestrator',
        to: approver,
        payload: { step },
        timestamp: Date.now(),
        priority: 'high',
      };

      await this.sendMessage(approver, message);

      // Wait for approval response
      const approved = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000);

        const handler = (response: AgentResponse) => {
          if (response.agent === approver) {
            clearTimeout(timeout);
            this.removeListener('agent-response', handler);
            resolve(response.success && response.data?.approved === true);
          }
        };

        this.on('agent-response', handler);
      });

      approvals.push(approved);
    }

    // All approvers must approve
    return approvals.every((a) => a);
  }

  /**
   * Request consensus from agents
   */
  private async requestConsensus(payload: any): Promise<void> {
    console.log('🗳️  Requesting consensus:', payload.topic);

    const votes: Map<string, boolean> = new Map();
    const weights = {
      'policy-agent': 3,
      'risk-agent': 3,
      'oracle-agent': 2,
      'defi-agent': 2,
      'governance-agent': 2,
      'execution-agent': 1,
      'payment-agent': 1,
      'monitoring-agent': 1,
      'learning-agent': 1,
    };

    // Request votes from all agents
    for (const [agentId] of this.agents) {
      const message: AgentMessage = {
        type: 'consensus-vote',
        from: 'icb-orchestrator',
        to: agentId,
        payload,
        timestamp: Date.now(),
        priority: 'high',
      };

      await this.sendMessage(agentId, message);
    }

    // Collect votes (with timeout)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Calculate weighted consensus
    let totalWeight = 0;
    let approvalWeight = 0;

    for (const [agentId, vote] of votes) {
      const weight = weights[agentId as keyof typeof weights] || 1;
      totalWeight += weight;
      if (vote) approvalWeight += weight;
    }

    const consensus = approvalWeight / totalWeight >= 0.6;

    console.log(
      `📊 Consensus result: ${consensus ? 'APPROVED' : 'REJECTED'} (${approvalWeight}/${totalWeight})`
    );

    this.emit('consensus-result', { topic: payload.topic, approved: consensus });
  }

  /**
   * Handle alert from agent
   */
  private async handleAlert(message: AgentMessage): Promise<void> {
    const { severity, title, description } = message.payload;

    console.log(`🚨 ALERT [${severity}] from ${message.from}: ${title}`);

    // Store alert in Redis
    await this.redis.lpush(
      'icb:alerts',
      JSON.stringify({
        from: message.from,
        severity,
        title,
        description,
        timestamp: message.timestamp,
      })
    );

    // Trigger alert workflow if critical
    if (severity === 'critical') {
      await this.executeWorkflow('circuit-breaker', message.payload);
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeWorkflows.get(executionId);
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values()).filter((w) => w.status === 'running');
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down orchestrator...');
    await this.redis.quit();
  }
}

interface AgentInfo {
  id: string;
  role: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
}

interface WorkflowExecution {
  id: string;
  workflow: string;
  status: 'running' | 'completed' | 'failed';
  currentStep: number;
  results: AgentResponse[];
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// Singleton instance
let orchestrator: AgentOrchestrator | null = null;

/**
 * Get or create orchestrator instance
 */
export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}
