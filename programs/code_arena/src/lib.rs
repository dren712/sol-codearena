use anchor_lang::prelude::*;

declare_id!("Arena111111111111111111111111111111111111111");

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
        require!(challenge_id.len() <= 32, ArenaError::ChallengeIdTooLong);

        let completion = &mut ctx.accounts.completion;
        let user_profile = &mut ctx.accounts.user_profile;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;

        completion.wallet = authority.key();
        completion.challenge_id = challenge_id.clone();
        completion.timestamp = clock.unix_timestamp;
        completion.score = score;
        completion.verified = true;
        completion.bump = ctx.bumps.completion;

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
        init,
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
    pub wallet: Pubkey,         // 32
    pub challenge_id: String,   // 4 + 32
    pub timestamp: i64,         // 8
    pub score: u32,             // 4
    pub verified: bool,         // 1
    pub bump: u8,               // 1
}

impl CompletionRecord {
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8 + 4 + 1 + 1;
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
}
