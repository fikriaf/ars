use anchor_lang::prelude::*;

declare_id!("EpzmAas4F7XAWeHht7Yp3wTDcTciKLmXkhqaR5JhfCHE");

pub mod state;
pub mod instructions;
pub mod errors;
pub mod constants;

use instructions::*;
use state::*;

#[program]
pub mod icb_core {
    use super::*;

    /// Initialize the ICB protocol
    pub fn initialize(
        ctx: Context<Initialize>,
        epoch_duration: i64,
        mint_burn_cap_bps: u16,
        stability_fee_bps: u16,
        vhr_threshold: u16,
    ) -> Result<()> {
        instructions::initialize::handler(
            ctx,
            epoch_duration,
            mint_burn_cap_bps,
            stability_fee_bps,
            vhr_threshold,
        )
    }

    /// Update the ILI oracle value
    pub fn update_ili(
        ctx: Context<UpdateILI>,
        ili_value: u64,
        avg_yield: u32,
        volatility: u32,
        tvl: u64,
    ) -> Result<()> {
        instructions::update_ili::handler(ctx, ili_value, avg_yield, volatility, tvl)
    }

    /// Query the current ILI value
    pub fn query_ili(ctx: Context<QueryILI>) -> Result<u64> {
        instructions::query_ili::handler(ctx)
    }

    /// Create a new policy proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        policy_type: PolicyType,
        policy_params: Vec<u8>,
        duration: i64,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, policy_type, policy_params, duration)
    }

    /// Vote on a policy proposal
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        prediction: bool,
        stake_amount: u64,
    ) -> Result<()> {
        instructions::vote_on_proposal::handler(ctx, prediction, stake_amount)
    }

    /// Execute an approved proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Activate circuit breaker
    pub fn activate_circuit_breaker(ctx: Context<ActivateCircuitBreaker>) -> Result<()> {
        instructions::circuit_breaker::handler(ctx)
    }
}
