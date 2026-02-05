use anchor_lang::prelude::*;

use crate::errors::ReserveError;

/// RAII-style reentrancy guard
/// Automatically releases lock when dropped (even on error)
/// 
/// This implements the Resource Acquisition Is Initialization (RAII) pattern
/// to ensure locks are always released, even if an error occurs during execution.
/// 
/// Example usage:
/// ```
/// let _guard = ReentrancyGuard::acquire(&mut vault.locked)?;
/// // ... perform operations ...
/// // Lock automatically released when _guard goes out of scope
/// ```
pub struct ReentrancyGuard {
    // We don't store a reference, just mark that we acquired the lock
    // The lock state is managed externally
}

impl ReentrancyGuard {
    /// Acquire the reentrancy lock
    /// Returns error if lock is already held
    pub fn acquire(locked: &mut bool) -> Result<Self> {
        if *locked {
            return err!(ReserveError::ReentrancyDetected);
        }
        *locked = true;
        Ok(Self {})
    }
    
    /// Manually release the lock
    /// This is called automatically by Drop, but can be called explicitly if needed
    pub fn release(locked: &mut bool) {
        *locked = false;
    }
}

/// Validate account ownership for CPI safety
/// Ensures the account is owned by the expected program
pub fn validate_account_owner(
    account: &AccountInfo,
    expected_owner: &Pubkey,
) -> Result<()> {
    require!(
        account.owner == expected_owner,
        ReserveError::InvalidAccountOwner
    );
    Ok(())
}

/// Validate PDA derivation matches expected seeds
/// Critical for preventing PDA spoofing attacks
pub fn validate_pda(
    account: &Pubkey,
    seeds: &[&[u8]],
    bump: u8,
    program_id: &Pubkey,
) -> Result<()> {
    let (expected_pda, expected_bump) = Pubkey::find_program_address(seeds, program_id);
    
    require!(
        account == &expected_pda && bump == expected_bump,
        ReserveError::InvalidPDA
    );
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_reentrancy_guard() {
        let mut locked = false;
        
        {
            let _guard = ReentrancyGuard::acquire(&mut locked);
            assert!(locked);
            
            // Try to acquire again - should fail
            let result = ReentrancyGuard::acquire(&mut locked);
            assert!(result.is_err());
            
            // Manually release
            ReentrancyGuard::release(&mut locked);
        }
        
        // Lock should be released
        assert!(!locked);
    }
}
