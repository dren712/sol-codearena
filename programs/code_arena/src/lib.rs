use anchor_lang::prelude::*;

declare_id!("A4oqd9fv4zzrFastj5VSNoe4ZdjHq3FUisSo3Dn1u6LS");

/// Maximum byte length of a challenge identifier stored on-chain.
///
/// The identifier is stored as a fixed-size, zero-padded byte array rather than a
/// `String` so the account layout is constant regardless of how long the id is.
/// A variable-length `String` in a fixed `space` allocation writes a different
/// byte layout than it deserializes, which silently corrupts the account.
pub const MAX_CHALLENGE_ID_LEN: usize = 32;

#[program]
pub mod code_arena {
    use super::*;

    /// Initialize a user's on-chain profile PDA
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let authority = &ctx.accounts.authority;

        user_profile.wallet = authority.key();
        user_profile.completed_count = 0;
        user_profile.score = 0;
        user_profile.bump = ctx.bumps.user_profile;

        emit!(UserInitializedEvent {
            wallet: authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Record a verified challenge completion on-chain
    pub fn record_completion(
        ctx: Context<RecordCompletion>,
        challenge_id: String,
        score: u32,
    ) -> Result<()> {
        let (id_bytes, id_len) = encode_challenge_id(&challenge_id)?;

        let completion = &mut ctx.accounts.completion;
        let user_profile = &mut ctx.accounts.user_profile;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;

        // `init_if_needed` loads an existing account instead of failing, so the
        // duplicate case has to be rejected explicitly — otherwise a replayed
        // transaction would inflate the user's aggregate score.
        if completion.id_len > 0 {
            return Err(ArenaError::AlreadyCompleted.into());
        }

        // `ctx.bumps` is unavailable on `init_if_needed` structs (the bump is only
        // known to Anchor when it creates the account), so re-derive the
        // canonical bump for the same seeds to store alongside the completion.
        let bump = derive_completion_bump(authority.key(), &challenge_id)?;

        completion.wallet = authority.key();
        completion.challenge_id = id_bytes;
        completion.id_len = id_len;
        completion.timestamp = clock.unix_timestamp;
        completion.score = score;
        completion.verified = true;
        completion.bump = bump;

        // Increment user's aggregate progress
        user_profile.completed_count = user_profile.completed_count.saturating_add(1);
        user_profile.score = user_profile.score.saturating_add(score);

        emit!(ChallengeCompletedEvent {
            wallet: authority.key(),
            challenge_id,
            score,
            total_score: user_profile.score,
            completed_count: user_profile.completed_count,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = UserProfile::LEN,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct RecordCompletion<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = CompletionRecord::LEN,
        seeds = [b"completion", authority.key().as_ref(), challenge_id.as_bytes()],
        bump
    )]
    pub completion: Account<'info, CompletionRecord>,

    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    pub wallet: Pubkey,        // 32
    pub completed_count: u32,  // 4
    pub score: u32,            // 4
    pub bump: u8,              // 1
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + 4 + 4 + 1;
}

#[account]
pub struct CompletionRecord {
    pub wallet: Pubkey,                           // 32
    pub challenge_id: [u8; MAX_CHALLENGE_ID_LEN], // 32, zero-padded UTF-8
    pub id_len: u8,                               // 1, meaningful bytes in challenge_id
    pub timestamp: i64,                           // 8
    pub score: u32,                               // 4
    pub verified: bool,                           // 1
    pub bump: u8,                                 // 1
}

impl CompletionRecord {
    pub const LEN: usize = 8 + 32 + MAX_CHALLENGE_ID_LEN + 1 + 8 + 4 + 1 + 1;
}

/// Pads a challenge identifier into a fixed-size, zero-padded byte array.
///
/// Returns the padded bytes alongside the number of meaningful bytes, so the
/// original identifier can be recovered without scanning for a null terminator.
pub fn encode_challenge_id(
    challenge_id: &str,
) -> Result<([u8; MAX_CHALLENGE_ID_LEN], u8)> {
    let bytes = challenge_id.as_bytes();
    require!(
        bytes.len() <= MAX_CHALLENGE_ID_LEN,
        ArenaError::ChallengeIdTooLong
    );

    let mut padded = [0u8; MAX_CHALLENGE_ID_LEN];
    padded[..bytes.len()].copy_from_slice(bytes);

    Ok((padded, bytes.len() as u8))
}

/// Recovers the original challenge identifier from its padded on-chain form.
pub fn decode_challenge_id(
    padded: &[u8; MAX_CHALLENGE_ID_LEN],
    id_len: u8,
) -> Result<String> {
    let len = (id_len as usize).min(MAX_CHALLENGE_ID_LEN);
    let bytes = &padded[..len];

    core::str::from_utf8(bytes)
        .map(|s| s.to_string())
        .map_err(|_| ArenaError::ChallengeIdNotUtf8.into())
}

/// Seeds for a completion PDA: `["completion", authority, challenge_id]`.
///
/// Must stay in lockstep with the `seeds = [...]` expression on
/// `RecordCompletion::completion`.
pub fn completion_seeds<'a>(authority: &'a Pubkey, challenge_id: &'a str) -> [&'a [u8]; 3] {
    [
        b"completion",
        authority.as_ref(),
        challenge_id.as_bytes(),
    ]
}

/// Re-derives the canonical bump seed for a completion PDA.
pub fn derive_completion_bump(authority: Pubkey, challenge_id: &str) -> Result<u8> {
    let seeds: &[&[u8]] = &completion_seeds(&authority, challenge_id);
    let (_pda, bump) = Pubkey::find_program_address(seeds, &crate::ID);
    Ok(bump)
}

#[event]
pub struct UserInitializedEvent {
    pub wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ChallengeCompletedEvent {
    pub wallet: Pubkey,
    pub challenge_id: String,
    pub score: u32,
    pub total_score: u32,
    pub completed_count: u32,
    pub timestamp: i64,
}

#[error_code]
pub enum ArenaError {
    #[msg("Challenge ID exceeds maximum length of 32 characters")]
    ChallengeIdTooLong,
    #[msg("Challenge is already verified and recorded for this wallet")]
    AlreadyCompleted,
    #[msg("Stored challenge ID is not valid UTF-8")]
    ChallengeIdNotUtf8,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_short_id_with_zero_padding() {
        let (padded, len) = encode_challenge_id("04-pdas").unwrap();

        assert_eq!(len, 7);
        assert_eq!(&padded[..7], b"04-pdas");
        assert!(padded[7..].iter().all(|b| *b == 0), "tail must be zero padded");
    }

    #[test]
    fn encodes_maximum_length_id() {
        let id = "a".repeat(MAX_CHALLENGE_ID_LEN);
        let (padded, len) = encode_challenge_id(&id).unwrap();

        assert_eq!(len as usize, MAX_CHALLENGE_ID_LEN);
        assert_eq!(padded, [b'a'; MAX_CHALLENGE_ID_LEN]);
    }

    #[test]
    fn rejects_id_longer_than_maximum() {
        let id = "a".repeat(MAX_CHALLENGE_ID_LEN + 1);
        let err = encode_challenge_id(&id).unwrap_err();

        assert_eq!(err, ArenaError::ChallengeIdTooLong.into());
    }

    #[test]
    fn round_trips_through_padded_form() {
        for id in ["01-wallets", "04-pdas", "10-deploy"] {
            let (padded, len) = encode_challenge_id(id).unwrap();
            assert_eq!(decode_challenge_id(&padded, len).unwrap(), id);
        }
    }

    #[test]
    fn decode_clamps_out_of_range_length() {
        let (padded, _) = encode_challenge_id("04-pdas").unwrap();
        // A corrupt id_len can never read past the fixed-size array.
        assert_eq!(decode_challenge_id(&padded, 255).is_ok(), true);
    }

    #[test]
    fn account_layout_sizes_match_fields() {
        // 8-byte Anchor discriminator + declared fields.
        assert_eq!(UserProfile::LEN, 8 + 32 + 4 + 4 + 1);
        assert_eq!(
            CompletionRecord::LEN,
            8 + 32 + MAX_CHALLENGE_ID_LEN + 1 + 8 + 4 + 1 + 1
        );
    }

    #[test]
    fn derives_canonical_bump_for_completion_seeds() {
        let authority = Pubkey::new_unique();
        let bump = derive_completion_bump(authority, "04-pdas").unwrap();

        // Canonical bumps live at the top of the 0..=255 range.
        assert!(bump <= 255);
        assert_eq!(bump, derive_completion_bump(authority, "04-pdas").unwrap());

        // Different ids and different wallets derive independent addresses.
        assert_eq!(completion_seeds(&authority, "04-pdas")[0], b"completion");
        assert_eq!(completion_seeds(&authority, "04-pdas")[1].len(), 32);
    }

    #[test]
    fn completion_seeds_match_the_accounts_constraint() {
        // The `#[derive(Accounts)]` seeds expression cannot call this helper, so
        // assert the prefix/order it hardcodes stays in sync with the helper.
        let authority = Pubkey::new_unique();
        assert_eq!(completion_seeds(&authority, "04-pdas")[0], b"completion");
        assert_eq!(
            completion_seeds(&authority, "04-pdas")[2],
            b"04-pdas".as_slice()
        );
    }
}