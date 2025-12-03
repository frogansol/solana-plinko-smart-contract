use crate::account::*;
use crate::errors::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetMinBuyIn<'info> {
    #[account(
        mut,
        seeds = [b"plinko_status"],
        bump,
        constraint = plinko_status.is_owner(&authority.key()) @ PlinkoError::OnlyOwner
    )]
    pub plinko_status: Account<'info, PlinkoStatus>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetMinBuyIn>, new_min_buy_in: u64) -> Result<()> {
    require!(new_min_buy_in > 0, PlinkoError::InvalidValue);

    let plinko_status = &mut ctx.accounts.plinko_status;
    plinko_status.min_buy_in = new_min_buy_in;

    msg!("Minimum buy-in updated to {} lamports", new_min_buy_in);

    Ok(())
}
