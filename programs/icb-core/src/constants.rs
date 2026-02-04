/// Seed for global state PDA
pub const GLOBAL_STATE_SEED: &[u8] = b"global_state";

/// Seed for ILI oracle PDA
pub const ILI_ORACLE_SEED: &[u8] = b"ili_oracle";

/// Seed for policy proposal PDA
pub const PROPOSAL_SEED: &[u8] = b"proposal";

/// Seed for vote record PDA
pub const VOTE_SEED: &[u8] = b"vote";

/// Seed for agent registry PDA
pub const AGENT_SEED: &[u8] = b"agent";

/// Basis points denominator (10000 = 100%)
pub const BPS_DENOMINATOR: u16 = 10000;

/// Default epoch duration (24 hours in seconds)
pub const DEFAULT_EPOCH_DURATION: i64 = 86400;

/// Default ILI update interval (5 minutes in seconds)
pub const DEFAULT_ILI_UPDATE_INTERVAL: i64 = 300;

/// Minimum voting period (1 hour in seconds)
pub const MIN_VOTING_PERIOD: i64 = 3600;

/// Maximum voting period (7 days in seconds)
pub const MAX_VOTING_PERIOD: i64 = 604800;

/// Slashing penalty for failed predictions (10%)
pub const SLASHING_PENALTY_BPS: u16 = 1000;
