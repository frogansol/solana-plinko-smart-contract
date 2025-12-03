use crate::account::*;
use crate::errors::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [b"plinko_status"],
        bump,
        constraint = plinko_status.is_owner(&authority.key()) @ PlinkoError::OnlyOwner
    )]
    pub plinko_status: Account<'info, PlinkoStatus>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    let plinko_status = &mut ctx.accounts.plinko_status;
    plinko_status.paused = paused;

    if paused {
        msg!("Game paused");
    } else {
        msg!("Game unpaused");
    }

    Ok(())
}
