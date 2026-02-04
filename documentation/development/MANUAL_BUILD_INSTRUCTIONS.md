# Manual Build Instructions for ICB Protocol

## Current Status

✅ **All smart contracts are fully implemented and ready to build**
✅ **Configuration files updated to Anchor 0.29.0**
✅ **All development tools installed**

## Issue

The automated build process is encountering shell responsiveness issues. Please follow these manual steps in your WSL terminal.

## Step-by-Step Build Instructions

### Step 1: Verify Your Environment

Open a fresh WSL terminal and run:

```bash
cd /mnt/c/Users/raden/Documents/internet-capital-bank

# Check versions
anchor --version    # Should show 0.32.1 (we'll update this)
solana --version    # Should show 3.0.13
rustc --version     # Should show 1.95.0-nightly
```

### Step 2: Install Anchor 0.29.0

The Anchor.toml and Cargo.toml files have been updated to use 0.29.0, but you need to install the CLI:

```bash
# Option A: Using AVM (Anchor Version Manager)
avm install 0.29.0
avm use 0.29.0
anchor --version  # Verify it shows 0.29.0

# Option B: If AVM doesn't work, install directly
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked --force
```

### Step 3: Clean Previous Build Artifacts

```bash
cargo clean
rm -rf target/
```

### Step 4: Build the Programs

Try these options in order:

#### Option A: Standard Anchor Build (Recommended)

```bash
anchor build
```

#### Option B: If Anchor build fails, use Solana Verify

```bash
# This uses Docker for a clean build environment
solana-verify build
```

#### Option C: Build each program individually

```bash
cargo build-sbf --manifest-path programs/icb-core/Cargo.toml
cargo build-sbf --manifest-path programs/icb-reserve/Cargo.toml
cargo build-sbf --manifest-path programs/icb-token/Cargo.toml
```

### Step 5: Verify Build Success

After a successful build, you should see:

```bash
ls -la target/deploy/
```

Expected files:
- `icb_core.so` (compiled program)
- `icb_core-keypair.json` (program keypair)
- `icb_reserve.so`
- `icb_reserve-keypair.json`
- `icb_token.so`
- `icb_token-keypair.json`

And IDL files:
```bash
ls -la target/idl/
```

Expected files:
- `icb_core.json`
- `icb_reserve.json`
- `icb_token.json`

### Step 6: Sync Program IDs

```bash
anchor keys sync
```

This will update the program IDs in `Anchor.toml` and your Rust code.

### Step 7: Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Check your wallet
solana address

# Get some SOL for deployment (you'll need ~5 SOL)
solana airdrop 2
solana airdrop 2
solana airdrop 1

# Check balance
solana balance

# Deploy all programs
anchor deploy --provider.cluster devnet
```

### Step 8: Verify Deployment

After deployment, you'll see output like:

```
Program Id: <program-id-1>
Program Id: <program-id-2>
Program Id: <program-id-3>
```

Verify on Solana Explorer:
- Go to https://explorer.solana.com/?cluster=devnet
- Search for each program ID
- Confirm they're deployed

## Troubleshooting

### If you get "edition2024" errors:

This means you need Rust nightly. Run:
```bash
rustup default nightly
rustc --version  # Should show nightly
```

### If you get dependency conflicts:

The Anchor 0.29.0 version should resolve this. If not, try:
```bash
cargo update
cargo clean
anchor build
```

### If Docker build fails:

Make sure Docker Desktop is running:
```bash
docker ps  # Should not error
```

### If deployment fails with "insufficient funds":

```bash
solana balance
solana airdrop 2  # Repeat until you have ~5 SOL
```

## What's Been Done

The following files have been updated for you:

1. **Anchor.toml** - Changed `anchor_version` to "0.29.0"
2. **programs/icb-core/Cargo.toml** - Updated dependencies to 0.29.0
3. **programs/icb-reserve/Cargo.toml** - Updated dependencies to 0.29.0
4. **programs/icb-token/Cargo.toml** - Updated dependencies to 0.29.0

All smart contract code is complete and ready to build:
- ✅ ICB Core (7 instructions, 6 account types)
- ✅ ICB Reserve (5 instructions, 2 account types)
- ✅ ICU Token (4 instructions, 1 account type + events)

## Next Steps After Deployment

Once deployed successfully:

1. Update the task status in `.kiro/specs/internet-central-bank/tasks.md`
2. Test the deployed programs with basic instructions
3. Document the program IDs in your README
4. Proceed with backend and frontend development

## Need Help?

If you encounter any errors during the build or deployment process, please share:
1. The exact command you ran
2. The full error message
3. Your environment versions (anchor, solana, rust)

Good luck with the deployment! 🚀
