use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
pub struct ActivateCircuitBreaker<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        constraint = global_state.authority == authority.key() @ ICBError::Unauthorized
    )]
    pub global_state: Account<'info, GlobalState>,
    
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ActivateCircuitBreaker>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    
    global_state.circuit_breaker_active = !global_state.circuit_breaker_active;
    
    msg!(
        "Circuit breaker {}",
        if global_state.circuit_breaker_active {
            "ACTIVATED"
        } else {
            "DEACTIVATED"
        }
    );
    
    Ok(())
}
