# Internet Central Bank - Implementation Guide

**Date**: February 4, 2026  
**Version**: 1.0  
**Timeline**: 10 days (Feb 3-12, 2026)

## Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.29+
- PostgreSQL 15+
- Redis 7+
- OpenClaw CLI

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/internet-capital-bank
cd internet-capital-bank

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start infrastructure
docker-compose up -d

# Initialize database
npm run db:migrate

# Build Anchor programs
cd programs
anchor build
anchor deploy --provider.cluster devnet

# Start backend
cd ../backend
npm run dev

# Start frontend (optional)
cd ../frontend
npm run dev
```

## Project Structure

```
internet-capital-bank/
├── programs/              # Solana/Anchor smart contracts
│   ├── icb_core/         # Main protocol logic
│   ├── icb_reserve/      # Reserve vault management
│   └── icb_token/        # ICU token program
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── services/     # Oracle, ILI, ICR calculators
│   │   ├── api/          # REST + WebSocket APIs
│   │   └── agents/       # Agent management
│   └── package.json
├── frontend/             # Vite + React dashboard (optional)
│   ├── src/
│   │   ├── components/   # UI components
│   │   └── pages/        # Dashboard pages
│   └── package.json
├── sdk/                  # OpenClaw agent SDK
│   ├── src/
│   │   ├── agent.ts      # ICBAgent class
│   │   └── strategies/   # Example strategies
│   └── package.json
├── documentation/        # Project documentation
│   ├── hackathon/       # Hackathon-specific docs
│   └── llms/            # LLM context files
└── .kiro/               # Kiro spec files
    └── specs/
        └── internet-central-bank/
```

## Development Workflow

### Phase 1: Setup (Days 1-2)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 1

### Phase 2: Oracle & Data (Days 2-4)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 2

### Phase 3: Smart Contracts (Days 4-6)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 3

### Phase 4: Backend API (Days 6-7)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 4

### Phase 5: Frontend (Days 7-9)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 5

### Phase 6: Agent SDK (Day 9)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 6

### Phase 7: Testing & Demo (Days 9-10)
See `.kiro/specs/internet-central-bank/tasks.md` Phase 7

## OpenClaw Integration

### Setting Up OpenClaw

```bash
# Install OpenClaw
npm install -g openclaw

# Initialize OpenClaw
openclaw setup

# Create agents
openclaw agents create backend-agent --skill typescript-express
openclaw agents create frontend-agent --skill react-vite
openclaw agents create solana-agent --skill anchor-rust
```

### Using OpenClaw for Development

```bash
# Generate code with OpenClaw
openclaw exec "Generate Express API endpoint for ILI"

# Schedule cron jobs
openclaw cron create "*/5 * * * *" "node backend/src/services/ili-calculator.ts"

# Monitor with webhooks
openclaw hooks create proposal-webhook --event blockchain
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Property-Based Tests
```bash
npm run test:pbt
```

## Deployment

### Devnet Deployment
```bash
anchor deploy --provider.cluster devnet
```

### Backend Deployment
```bash
npm run deploy:backend
```

### Frontend Deployment
```bash
npm run deploy:frontend
```

## Resources

- Full Requirements: `.kiro/specs/internet-central-bank/requirements.md`
- Technical Design: `.kiro/specs/internet-central-bank/design.md`
- Task List: `.kiro/specs/internet-central-bank/tasks.md`
- Agent Architecture: `documentation/hackathon/AGENT_FIRST_ARCHITECTURE.md`
