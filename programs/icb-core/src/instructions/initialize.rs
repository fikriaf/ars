use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalState::LEN,
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(
        init,
        payer = authority,
        space = ILIOracle::LEN,
        seeds = [ILI_ORACLE_SEED],
        bump
    )]
    pub ili_oracle: Account<'info, ILIOracle>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    epoch_duration: i64,
    mint_burn_cap_bps: u16,
    stability_fee_bps: u16,
    vhr_threshold: u16,
) -> Result<()> {
    require!(epoch_duration > 0, ICBError::InvalidEpochDuration);
    require!(mint_burn_cap_bps <= BPS_DENOMINATOR, ICBError::InvalidMintBurnCap);
    require!(vhr_threshold >= 10000, ICBError::InvalidVHRThreshold); // At least 100%
    
    let global_state = &mut ctx.accounts.global_state;
    let ili_oracle = &mut ctx.accounts.ili_oracle;
    
    // Initialize global state
    global_state.authority = ctx.accounts.authority.key();
    global_state.ili_oracle = ili_oracle.key();
    global_state.reserve_vault = Pubkey::default(); // Set later
    global_state.icu_mint = Pubkey::default(); // Set later
    global_state.epoch_duration = epoch_duration;
    global_state.mint_burn_cap_bps = mint_burn_cap_bps;
    global_state.stability_fee_bps = stability_fee_bps;
    global_state.vhr_threshold = vhr_threshold;
    global_state.circuit_breaker_active = false;
    global_state.bump = ctx.bumps.global_state;
    
    // Initialize ILI oracle
    ili_oracle.authority = ctx.accounts.authority.key();
    ili_oracle.current_ili = 0;
    ili_oracle.last_update = 0;
    ili_oracle.update_interval = DEFAULT_ILI_UPDATE_INTERVAL;
    ili_oracle.snapshot_count = 0;
    ili_oracle.bump = ctx.bumps.ili_oracle;
    
    msg!("ICB Protocol initialized");
    msg!("Authority: {}", global_state.authority);
    msg!("Epoch duration: {} seconds", epoch_duration);
    msg!("Mint/burn cap: {} bps", mint_burn_cap_bps);
    msg!("VHR threshold: {} bps", vhr_threshold);
    
    Ok(())
}
