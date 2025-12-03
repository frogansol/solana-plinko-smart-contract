use crate::account::*;
use crate::errors::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetPayout<'info> {
    #[account(
    mut,
    seeds = [b"plinko_status"],
    bump,
    constraint = plinko_status.is_owner(&authority.key()) @ PlinkoError::OnlyOwner,
    constraint = !plinko_status.odds_locked @ PlinkoError::OddsLocked
  )]
    pub plinko_status: Account<'info, PlinkoStatus>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetPayout>, payouts: Vec<u64>, bucket_weights: Vec<u64>) -> Result<()> {
    require!(bucket_weights.len() == payouts.len(), PlinkoError::InvalidLength);
    require!(!bucket_weights.is_empty(), PlinkoError::InvalidLength);
    require!(bucket_weights.len() <= 100, PlinkoError::InvalidLength);

    for i in 1..bucket_weights.len() {
        require!(bucket_weights[i] > bucket_weights[i - 1], PlinkoError::InvalidBucketIndex);
    }

    for payout in &payouts {
        require!(*payout <= 10_000_000, PlinkoError::InvalidBucketIndex); // Max 100x
    }

    let plinko_status = &mut ctx.accounts.plinko_status;

    plinko_status.bucket_weights = bucket_weights;
    plinko_status.payouts = payouts;

    msg!("Payouts updated successfully");
    msg!("Number of buckets: {}", plinko_status.bucket_weights.len());
    msg!("Max bucket value: {}", plinko_status.max_bucket_value()?);

    Ok(())
}
