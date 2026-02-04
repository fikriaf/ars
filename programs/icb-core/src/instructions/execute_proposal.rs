use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Active @ ICBError::ProposalNotActive
    )]
    pub proposal: Account<'info, PolicyProposal>,
    
    pub executor: Signer<'info>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;
    
    // Check if voting period has ended
    require!(
        clock.unix_timestamp >= proposal.end_time,
        ICBError::ProposalStillActive
    );
    
    // Calculate total stake and consensus
    let total_stake = proposal.yes_stake
        .checked_add(proposal.no_stake)
        .ok_or(ICBError::ArithmeticOverflow)?;
    
    require!(total_stake > 0, ICBError::InsufficientStake);
    
    // Check if YES votes have majority (>50%)
    let yes_percentage = (proposal.yes_stake as u128)
        .checked_mul(10000)
        .ok_or(ICBError::ArithmeticOverflow)?
        .checked_div(total_stake as u128)
        .ok_or(ICBError::ArithmeticOverflow)? as u64;
    
    if yes_percentage > 5000 {
        // Proposal passed
        proposal.status = ProposalStatus::Passed;
        
        msg!("Proposal {} PASSED", proposal.id);
        msg!("YES: {} ({} bps)", proposal.yes_stake, yes_percentage);
        msg!("NO: {}", proposal.no_stake);
        
        // TODO: Execute policy based on policy_type
        // This would involve calling other programs (ICU token, reserve, etc.)
        
        proposal.status = ProposalStatus::Executed;
        msg!("Proposal executed");
    } else {
        // Proposal failed
        proposal.status = ProposalStatus::Failed;
        
        msg!("Proposal {} FAILED", proposal.id);
        msg!("YES: {} ({} bps)", proposal.yes_stake, yes_percentage);
        msg!("NO: {}", proposal.no_stake);
        
        // TODO: Implement slashing for failed predictions
    }
    
    Ok(())
}
