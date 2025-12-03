use crate::account::*;
use crate::errors::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetPlatformFee<'info> {
    #[account(
        mut,
        seeds = [b"plinko_status"],
        bump,
        constraint = plinko_status.is_owner(&authority.key()) @ PlinkoError::OnlyOwner
    )]
    pub plinko_status: Account<'info, PlinkoStatus>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetPlatformFee>, new_fee: u64) -> Result<()> {
    require!(new_fee <= 500, PlinkoError::PlatformFeeTooHigh); // Max 5%

    let plinko_status = &mut ctx.accounts.plinko_status;
    plinko_status.platform_fee = new_fee;

    msg!("Platform fee updated to {} basis points", new_fee);

    Ok(())
}
