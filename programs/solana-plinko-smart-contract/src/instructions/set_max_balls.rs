use crate::account::*;
use crate::errors::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetMaxBalls<'info> {
    #[account(
        mut,
        seeds = [b"plinko_status"],
        bump,
        constraint = plinko_status.is_owner(&authority.key()) @ PlinkoError::OnlyOwner
    )]
    pub plinko_status: Account<'info, PlinkoStatus>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetMaxBalls>, new_max_balls: u8) -> Result<()> {
    require!(new_max_balls <= 100, PlinkoError::MaxBallsTooHigh);

    let plinko_status = &mut ctx.accounts.plinko_status;
    plinko_status.max_balls = new_max_balls;

    msg!("Maximum balls updated to {}", new_max_balls);

    Ok(())
}
