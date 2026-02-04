use anchor_lang::prelude::*;

#[error_code]
pub enum ICBError {
    #[msg("Circuit breaker is active")]
    CircuitBreakerActive,
    
    #[msg("Invalid epoch duration")]
    InvalidEpochDuration,
    
    #[msg("Invalid mint/burn cap")]
    InvalidMintBurnCap,
    
    #[msg("Invalid VHR threshold")]
    InvalidVHRThreshold,
    
    #[msg("ILI update too soon")]
    ILIUpdateTooSoon,
    
    #[msg("Invalid ILI value")]
    InvalidILIValue,
    
    #[msg("Proposal already exists")]
    ProposalAlreadyExists,
    
    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    
    #[msg("Proposal not active")]
    ProposalNotActive,
    
    #[msg("Proposal still active")]
    ProposalStillActive,
    
    #[msg("Proposal not passed")]
    ProposalNotPassed,
    
    #[msg("Already voted")]
    AlreadyVoted,
    
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[msg("Insufficient stake")]
    InsufficientStake,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Invalid agent signature")]
    InvalidAgentSignature,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
}
