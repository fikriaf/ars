use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
#[instruction(policy_type: PolicyType, policy_params: Vec<u8>, duration: i64)]
pub struct CreateProposal<'info> {
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        constraint = !global_state.circuit_breaker_active @ ICBError::CircuitBreakerActive
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(
        init,
        payer = proposer,
        space = PolicyProposal::LEN,
        seeds = [PROPOSAL_SEED, &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, PolicyProposal>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    policy_type: PolicyType,
    policy_params: Vec<u8>,
    duration: i64,
) -> Result<()> {
    require!(
        duration >= MIN_VOTING_PERIOD && duration <= MAX_VOTING_PERIOD,
        ICBError::InvalidVotingPeriod
    );
    
    require!(
        policy_params.len() <= PolicyProposal::MAX_PARAMS_LEN,
        ICBError::InvalidStakeAmount
    );
    
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;
    
    // Generate proposal ID from timestamp
    let proposal_id = clock.unix_timestamp as u64;
    
    proposal.id = proposal_id;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.policy_type = policy_type.clone();
    proposal.policy_params = policy_params.clone();
    proposal.start_time = clock.unix_timestamp;
    proposal.end_time = clock.unix_timestamp + duration;
    proposal.yes_stake = 0;
    proposal.no_stake = 0;
    proposal.status = ProposalStatus::Active;
    proposal.execution_tx = None;
    proposal.bump = ctx.bumps.proposal;
    
    msg!("Proposal created: {}", proposal_id);
    msg!("Policy type: {:?}", policy_type);
    msg!("Duration: {} seconds", duration);
    msg!("End time: {}", proposal.end_time);
    
    Ok(())
}
