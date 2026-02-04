# ICB Protocol - Deployment Guide

This guide covers deploying the Internet Central Bank (ICB) smart contracts to Solana devnet.

## Prerequisites

### 1. Install Solana CLI

**Linux/macOS:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

**Windows:**
```powershell
# Download and run the installer from:
# https://github.com/solana-labs/solana/releases
```

Verify installation:
```bash
solana --version
```

### 2. Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

Verify installation:
```bash
anchor --version
```

### 3. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup component add rustfmt
```

### 4. Create Solana Wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

**IMPORTANT:** Save your seed phrase securely!

## Deployment Steps

### Step 1: Configure Solana CLI

Set cluster to devnet:
```bash
solana config set --url https://api.devnet.solana.com
```

Verify configuration:
```bash
solana config get
```

### Step 2: Fund Your Wallet

Request devnet SOL airdrop:
```bash
solana airdrop 2
```

Check balance:
```bash
solana balance
```

### Step 3: Build Programs

Build all three programs:
```bash
anchor build
```

This will:
- Compile the Rust programs to BPF bytecode
- Generate IDL files in `target/idl/`
- Generate TypeScript types in `target/types/`
- Create program keypairs in `target/deploy/`

### Step 4: Deploy to Devnet

Deploy all programs:
```bash
anchor deploy --provider.cluster devnet
```

Or use the deployment script:

**Linux/macOS:**
```bash
chmod +x scripts/deploy-devnet.sh
./scripts/deploy-devnet.sh
```

**Windows:**
```powershell
.\scripts\deploy-devnet.ps1
```

### Step 5: Verify Deployment

List deployed program IDs:
```bash
anchor keys list
```

Expected output:
```
icb_core: 9H91snZVEiEZkKFNs2NC7spJG3ieJtF2oeu6SwSnvy4S
icb_reserve: gaN527TnpTBtPQVdZvVeuzKrwdV2HiarZAX8H6jTAVL
icb_token: 3KGdConvEfZnGdtAtcKDfozVDPM97gf5WkX9m1Z73i4A
```

Check program on Solana Explorer:
```
https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

## Program Initialization

After deployment, initialize each program:

### 1. Initialize ICB Core

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IcbCore } from "../target/types/icb_core";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.IcbCore as Program<IcbCore>;

// Initialize with default parameters
await program.methods
  .initialize(
    new anchor.BN(86400),  // epoch_duration: 24 hours
    200,                    // mint_burn_cap_bps: 2%
    10,                     // stability_fee_bps: 0.1%
    15000                   // vhr_threshold: 150%
  )
  .rpc();

console.log("ICB Core initialized!");
```

### 2. Initialize Reserve Vault

```typescript
import { IcbReserve } from "../target/types/icb_reserve";

const reserveProgram = anchor.workspace.IcbReserve as Program<IcbReserve>;

await reserveProgram.methods
  .initializeVault(
    1500  // rebalance_threshold_bps: 15%
  )
  .rpc();

console.log("Reserve Vault initialized!");
```

### 3. Initialize ICU Token

```typescript
import { IcbToken } from "../target/types/icb_token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const tokenProgram = anchor.workspace.IcbToken as Program<IcbToken>;

// Create mint account first
const mint = anchor.web3.Keypair.generate();

await tokenProgram.methods
  .initializeMint(
    new anchor.BN(86400),  // epoch_duration: 24 hours
    200,                    // mint_burn_cap_bps: 2%
    10                      // stability_fee_bps: 0.1%
  )
  .accounts({
    mint: mint.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([mint])
  .rpc();

console.log("ICU Token initialized!");
console.log("Mint address:", mint.publicKey.toString());
```

## Testing Deployment

### Run Integration Tests

```bash
anchor test --skip-local-validator
```

### Manual Testing

1. **Query ILI:**
```bash
anchor run query-ili
```

2. **Create Proposal:**
```bash
anchor run create-proposal
```

3. **Vote on Proposal:**
```bash
anchor run vote
```

## Troubleshooting

### Build Errors

**Error: `cargo build-sbf` not found**

Solution: Install Solana CLI tools (includes build-sbf):
```bash
solana-install init
```

**Error: Insufficient funds**

Solution: Request more devnet SOL:
```bash
solana airdrop 2
```

**Error: Program deployment failed**

Solution: Increase compute budget:
```bash
anchor deploy --provider.cluster devnet --program-name icb_core
```

### Deployment Errors

**Error: Account already exists**

Solution: Use `anchor upgrade` instead:
```bash
anchor upgrade target/deploy/icb_core.so --program-id <PROGRAM_ID>
```

**Error: Transaction too large**

Solution: Deploy programs individually:
```bash
anchor deploy --program-name icb_core --provider.cluster devnet
anchor deploy --program-name icb_reserve --provider.cluster devnet
anchor deploy --program-name icb_token --provider.cluster devnet
```

## Program Addresses

After deployment, update these addresses in your configuration:

### Devnet Addresses

```typescript
export const PROGRAM_IDS = {
  ICB_CORE: new PublicKey("9H91snZVEiEZkKFNs2NC7spJG3ieJtF2oeu6SwSnvy4S"),
  ICB_RESERVE: new PublicKey("gaN527TnpTBtPQVdZvVeuzKrwdV2HiarZAX8H6jTAVL"),
  ICB_TOKEN: new PublicKey("3KGdConvEfZnGdtAtcKDfozVDPM97gf5WkX9m1Z73i4A"),
};
```

### PDAs (Program Derived Addresses)

```typescript
// Global State PDA
const [globalState] = PublicKey.findProgramAddressSync(
  [Buffer.from("global_state")],
  PROGRAM_IDS.ICB_CORE
);

// ILI Oracle PDA
const [iliOracle] = PublicKey.findProgramAddressSync(
  [Buffer.from("ili_oracle")],
  PROGRAM_IDS.ICB_CORE
);

// Reserve Vault PDA
const [reserveVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("reserve_vault")],
  PROGRAM_IDS.ICB_RESERVE
);

// Token State PDA
const [tokenState] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_state")],
  PROGRAM_IDS.ICB_TOKEN
);
```

## Next Steps

1. ✅ Programs deployed to devnet
2. ⬜ Initialize all programs
3. ⬜ Deploy backend services
4. ⬜ Deploy frontend dashboard
5. ⬜ Set up oracle data feeds
6. ⬜ Configure monitoring and alerts

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [ICB Protocol Documentation](./README.md)

## Support

For deployment issues, check:
1. Solana status: https://status.solana.com/
2. Devnet RPC: https://api.devnet.solana.com
3. Project issues: https://github.com/your-repo/issues
