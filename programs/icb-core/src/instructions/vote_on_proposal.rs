use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ICBError;

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Active @ ICBError::ProposalNotActive
    )]
    pub proposal: Account<'info, PolicyProposal>,
    
    #[account(
        init,
        payer = agent,
        space = VoteRecord::LEN,
        seeds = [VOTE_SEED, proposal.key().as_ref(), agent.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub agent: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VoteOnProposal>,
    prediction: bool,
    stake_amount: u64,
) -> Result<()> {
    require!(stake_amount > 0, ICBError::InvalidStakeAmount);
    
    let proposal = &mut ctx.accounts.proposal;
    let vote_record = &mut ctx.accounts.vote_record;
    let clock = Clock::get()?;
    
    // Check if voting period is still active
    require!(
        clock.unix_timestamp < proposal.end_time,
        ICBError::ProposalNotActive
    );
    
    // Update proposal stakes with quadratic staking
    // For simplicity, using linear staking in MVP
    // TODO: Implement quadratic staking formula
    if prediction {
        proposal.yes_stake = proposal.yes_stake
            .checked_add(stake_amount)
            .ok_or(ICBError::ArithmeticOverflow)?;
    } else {
        proposal.no_stake = proposal.no_stake
            .checked_add(stake_amount)
            .ok_or(ICBError::ArithmeticOverflow)?;
    }
    
    // Record vote
    vote_record.proposal = proposal.key();
    vote_record.agent = ctx.accounts.agent.key();
    vote_record.stake_amount = stake_amount;
    vote_record.prediction = prediction;
    vote_record.timestamp = clock.unix_timestamp;
    vote_record.claimed = false;
    vote_record.agent_signature = [0u8; 64]; // TODO: Verify agent signature
    vote_record.bump = ctx.bumps.vote_record;
    
    msg!("Vote recorded for proposal: {}", proposal.id);
    msg!("Agent: {}", ctx.accounts.agent.key());
    msg!("Prediction: {}", if prediction { "YES" } else { "NO" });
    msg!("Stake: {}", stake_amount);
    msg!("Total YES stake: {}", proposal.yes_stake);
    msg!("Total NO stake: {}", proposal.no_stake);
    
    Ok(())
}
