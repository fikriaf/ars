# Agent Training with Gymnasium Environment

**Date**: February 4, 2026  
**Version**: 1.0  
**Framework**: Gymnasium (OpenAI Gym) + Solana

## Overview

The Internet Central Bank uses a **Gymnasium-compatible environment** for training and testing reinforcement learning agents on Solana DeFi operations. This enables agents to learn optimal strategies through trial and error in a simulated environment before deploying to devnet/mainnet.

## Gymnasium Integration

### What is Gymnasium?

Gymnasium (formerly OpenAI Gym) is the standard API for reinforcement learning environments. It provides:
- Standardized observation and action spaces
- Episode-based training loops
- Reward signal design
- Environment reset and step functions

### ICB Gym Environment

We create a custom Gymnasium environment for ICB agent training:

```python
import gymnasium as gym
from gymnasium import spaces
import numpy as np

class ICBEnvironment(gym.Env):
    """
    Custom Gymnasium environment for training ICB agents
    """
    metadata = {'render_modes': ['human']}
    
    def __init__(self):
        super(ICBEnvironment, self).__init__()
        
        # Define action space
        # Actions: 0=Hold, 1=Lend, 2=Borrow, 3=Stake, 4=ProvideLiquidity, 5=Vote
        self.action_space = spaces.Discrete(6)
        
        # Define observation space
        # Observations: [ILI, ICR, VHR, SOL_price, USDC_balance, SOL_balance]
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0, 0, 0, 0]),
            high=np.array([10000, 2000, 500, 1000, 1000000, 10000]),
            dtype=np.float32
        )
        
        # Initialize state
        self.state = None
        self.steps = 0
        self.max_steps = 1000
        
    def reset(self, seed=None, options=None):
        """Reset environment to initial state"""
        super().reset(seed=seed)
        
        # Initialize with random but realistic values
        self.state = np.array([
            np.random.uniform(5000, 8000),  # ILI
            np.random.uniform(500, 1000),   # ICR
            np.random.uniform(150, 200),    # VHR
            np.random.uniform(50, 150),     # SOL price
            10000,                          # USDC balance
            100                             # SOL balance
        ], dtype=np.float32)
        
        self.steps = 0
        return self.state, {}
    
    def step(self, action):
        """Execute action and return new state, reward, done, info"""
        # Execute action
        reward = self._execute_action(action)
        
        # Update state (simulate market dynamics)
        self._update_state()
        
        # Check if episode is done
        self.steps += 1
        done = self.steps >= self.max_steps
        truncated = False
        
        return self.state, reward, done, truncated, {}
    
    def _execute_action(self, action):
        """Execute agent action and calculate reward"""
        ili, icr, vhr, sol_price, usdc_bal, sol_bal = self.state
        reward = 0
        
        if action == 0:  # Hold
            reward = 0.01  # Small reward for patience
            
        elif action == 1:  # Lend
            if icr > 800:  # Good lending rate
                reward = (icr / 100) * 0.1  # Reward based on rate
                usdc_bal -= 1000  # Lend 1000 USDC
            else:
                reward = -0.5  # Penalty for bad timing
                
        elif action == 2:  # Borrow
            if icr < 600:  # Good borrowing rate
                reward = (1000 - icr) / 100 * 0.1
                usdc_bal += 1000  # Borrow 1000 USDC
            else:
                reward = -0.5
                
        elif action == 3:  # Stake
            if ili < 6000:  # Low liquidity, good time to stake
                reward = 0.5
                sol_bal -= 10  # Stake 10 SOL
            else:
                reward = -0.3
                
        elif action == 4:  # Provide Liquidity
            if ili > 7000:  # High liquidity, good time for LP
                reward = 0.7
                usdc_bal -= 500
                sol_bal -= 5
            else:
                reward = -0.3
                
        elif action == 5:  # Vote on Proposal
            # Reward for participation
            reward = 0.2
        
        # Update balances in state
        self.state[4] = max(0, usdc_bal)
        self.state[5] = max(0, sol_bal)
        
        return reward
    
    def _update_state(self):
        """Simulate market dynamics"""
        # ILI random walk
        self.state[0] += np.random.normal(0, 100)
        self.state[0] = np.clip(self.state[0], 0, 10000)
        
        # ICR random walk
        self.state[1] += np.random.normal(0, 20)
        self.state[1] = np.clip(self.state[1], 0, 2000)
        
        # VHR slight drift
        self.state[2] += np.random.normal(0, 5)
        self.state[2] = np.clip(self.state[2], 100, 500)
        
        # SOL price volatility
        self.state[3] *= (1 + np.random.normal(0, 0.02))
        self.state[3] = np.clip(self.state[3], 10, 1000)
    
    def render(self, mode='human'):
        """Render environment state"""
        ili, icr, vhr, sol_price, usdc_bal, sol_bal = self.state
        print(f"Step: {self.steps}")
        print(f"ILI: {ili:.2f} | ICR: {icr:.2f} | VHR: {vhr:.2f}")
        print(f"SOL: ${sol_price:.2f} | USDC: ${usdc_bal:.2f} | SOL Bal: {sol_bal:.2f}")
        print("-" * 50)
```

## Training Agents

### Using Stable Baselines3

```python
from stable_baselines3 import PPO, DQN, A2C
from stable_baselines3.common.env_checker import check_env

# Create environment
env = ICBEnvironment()

# Check environment is valid
check_env(env)

# Train PPO agent
model = PPO("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=100000)

# Save model
model.save("icb_ppo_agent")

# Load and test
model = PPO.load("icb_ppo_agent")
obs, info = env.reset()
for i in range(1000):
    action, _states = model.predict(obs, deterministic=True)
    obs, reward, done, truncated, info = env.step(action)
    env.render()
    if done or truncated:
        obs, info = env.reset()
```

### Using Custom RL Algorithm

```python
import torch
import torch.nn as nn
import torch.optim as optim

class DQNAgent(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(DQNAgent, self).__init__()
        self.fc1 = nn.Linear(state_dim, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, action_dim)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# Initialize agent
agent = DQNAgent(state_dim=6, action_dim=6)
optimizer = optim.Adam(agent.parameters(), lr=0.001)

# Training loop
env = ICBEnvironment()
for episode in range(1000):
    state, _ = env.reset()
    total_reward = 0
    
    for step in range(1000):
        # Epsilon-greedy action selection
        if np.random.random() < 0.1:
            action = env.action_space.sample()
        else:
            state_tensor = torch.FloatTensor(state)
            q_values = agent(state_tensor)
            action = q_values.argmax().item()
        
        # Execute action
        next_state, reward, done, truncated, _ = env.step(action)
        total_reward += reward
        
        # Update agent (simplified)
        # ... DQN update logic ...
        
        state = next_state
        if done or truncated:
            break
    
    print(f"Episode {episode}: Total Reward = {total_reward}")
```

## Agent Types and Training Strategies

### 1. Lending Agent Training

**Objective**: Learn optimal lending/borrowing timing based on ICR

**Reward Function**:
```python
def lending_reward(action, icr, profit):
    if action == 'lend' and icr > 800:
        return profit * 2  # High reward for good timing
    elif action == 'borrow' and icr < 600:
        return profit * 2
    else:
        return -abs(profit)  # Penalty for bad timing
```

**Training Configuration**:
- Episodes: 10,000
- Algorithm: PPO (Proximal Policy Optimization)
- Learning Rate: 0.0003
- Batch Size: 64

### 2. Yield Agent Training

**Objective**: Maximize yield across protocols

**Reward Function**:
```python
def yield_reward(portfolio_value, risk_adjusted_return):
    return risk_adjusted_return * 10
```

**Training Configuration**:
- Episodes: 15,000
- Algorithm: SAC (Soft Actor-Critic)
- Learning Rate: 0.0001
- Batch Size: 128

### 3. Prediction Agent Training

**Objective**: Accurate futarchy predictions

**Reward Function**:
```python
def prediction_reward(prediction, actual_outcome, stake):
    if prediction == actual_outcome:
        return stake * 1.5  # Win stake + profit
    else:
        return -stake * 0.1  # Lose 10% (slashing)
```

**Training Configuration**:
- Episodes: 20,000
- Algorithm: DQN (Deep Q-Network)
- Learning Rate: 0.0005
- Batch Size: 32

## Integration with Solana

### Connecting Gym Environment to Solana Devnet

```python
from solana.rpc.api import Client
from solders.keypair import Keypair

class SolanaICBEnvironment(ICBEnvironment):
    """
    Extended environment that connects to Solana devnet
    """
    def __init__(self, rpc_url="https://api.devnet.solana.com"):
        super().__init__()
        self.client = Client(rpc_url)
        self.agent_keypair = Keypair()
        
    def _execute_action(self, action):
        """Execute action on actual Solana devnet"""
        if action == 1:  # Lend
            # Execute actual Solana transaction
            tx = self._build_lending_tx()
            signature = self.client.send_transaction(tx)
            # Wait for confirmation
            self.client.confirm_transaction(signature)
            
        # ... other actions ...
        
        return self._calculate_reward()
    
    def _get_real_state(self):
        """Fetch real ILI, ICR, VHR from Solana"""
        # Query on-chain accounts
        ili_account = self.client.get_account_info(ILI_ORACLE_PUBKEY)
        # Parse and return state
        return parsed_state
```

## Evaluation Metrics

### Performance Metrics

```python
def evaluate_agent(agent, env, num_episodes=100):
    """Evaluate trained agent"""
    total_rewards = []
    success_rate = 0
    
    for episode in range(num_episodes):
        state, _ = env.reset()
        episode_reward = 0
        
        for step in range(1000):
            action, _ = agent.predict(state, deterministic=True)
            state, reward, done, truncated, _ = env.step(action)
            episode_reward += reward
            
            if done or truncated:
                break
        
        total_rewards.append(episode_reward)
        if episode_reward > 0:
            success_rate += 1
    
    return {
        'mean_reward': np.mean(total_rewards),
        'std_reward': np.std(total_rewards),
        'success_rate': success_rate / num_episodes,
        'max_reward': np.max(total_rewards),
        'min_reward': np.min(total_rewards)
    }
```

### Benchmarking

```python
# Compare different algorithms
algorithms = {
    'PPO': PPO("MlpPolicy", env),
    'DQN': DQN("MlpPolicy", env),
    'A2C': A2C("MlpPolicy", env)
}

results = {}
for name, model in algorithms.items():
    model.learn(total_timesteps=50000)
    results[name] = evaluate_agent(model, env)
    print(f"{name}: {results[name]}")
```

## Deployment Pipeline

### 1. Train in Simulation
```bash
python train_agent.py --env icb --algorithm ppo --episodes 10000
```

### 2. Test on Devnet
```bash
python test_agent.py --env icb-devnet --model ppo_agent.zip --episodes 100
```

### 3. Deploy to Production
```bash
python deploy_agent.py --model ppo_agent.zip --network mainnet
```

## OpenClaw Integration

### Wrapping Trained Agents in OpenClaw

```typescript
import { ICBAgent } from '@icb/openclaw-skill';
import { loadPyTorchModel } from './ml-utils';

class TrainedLendingAgent extends ICBAgent {
  private model: any;
  
  async initialize() {
    // Load trained RL model
    this.model = await loadPyTorchModel('ppo_lending_agent.pt');
  }
  
  async run() {
    this.onILIUpdate(async (ili) => {
      const icr = await this.getICR();
      
      // Get state vector
      const state = [ili.value, icr.rate, ...];
      
      // Predict action using trained model
      const action = this.model.predict(state);
      
      // Execute action
      if (action === 1) {
        await this.lend({ protocol: 'kamino', asset: 'USDC', amount: 10000 });
      }
    });
  }
}
```

## Resources

- [Gymnasium Documentation](https://gymnasium.farama.org/)
- [Stable Baselines3](https://stable-baselines3.readthedocs.io/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [PyTorch](https://pytorch.org/)

## Next Steps

1. Implement ICBEnvironment class
2. Train baseline agents (PPO, DQN, A2C)
3. Evaluate on simulated environment
4. Test on Solana devnet
5. Deploy best-performing agents
6. Monitor and retrain based on performance

---

**Status**: Training Framework Ready  
**Next**: Implement custom Gymnasium environment  
**Last Updated**: February 4, 2026
