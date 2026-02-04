use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
pub struct UpdateILI<'info> {
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(
        mut,
        seeds = [ILI_ORACLE_SEED],
        bump = ili_oracle.bump,
        constraint = ili_oracle.authority == authority.key() @ ICBError::Unauthorized
    )]
    pub ili_oracle: Account<'info, ILIOracle>,
    
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateILI>,
    ili_value: u64,
    avg_yield: u32,
    volatility: u32,
    tvl: u64,
) -> Result<()> {
    let ili_oracle = &mut ctx.accounts.ili_oracle;
    let clock = Clock::get()?;
    
    // Check if enough time has passed since last update
    let time_since_update = clock.unix_timestamp - ili_oracle.last_update;
    require!(
        time_since_update >= ili_oracle.update_interval,
        ICBError::ILIUpdateTooSoon
    );
    
    // Validate ILI value (should be positive)
    require!(ili_value > 0, ICBError::InvalidILIValue);
    
    // Update ILI oracle
    ili_oracle.current_ili = ili_value;
    ili_oracle.last_update = clock.unix_timestamp;
    ili_oracle.snapshot_count = ili_oracle.snapshot_count.saturating_add(1);
    
    msg!("ILI updated to: {}", ili_value);
    msg!("Avg yield: {} bps", avg_yield);
    msg!("Volatility: {} bps", volatility);
    msg!("TVL: ${}", tvl);
    msg!("Timestamp: {}", clock.unix_timestamp);
    
    Ok(())
}
