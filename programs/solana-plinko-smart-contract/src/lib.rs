use anchor_lang::prelude::*;

declare_id!("7dzjQ2uoBb9dDC6S4bdAk7rynABaBWrXWaXkp4xBicuv");

pub mod account;
pub mod errors;
pub mod instructions;
pub mod misc;
pub mod utils;

use crate::instructions::*;

#[program]
pub mod solana_plinko_smart_contract {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee: u64,
        min_buy_in: u64,
        max_balls: u8
    ) -> Result<()> {
        initialize::handler(ctx, platform_fee, min_buy_in, max_balls)
    }

    pub fn set_payout(
        ctx: Context<SetPayout>,
        bucket_weights: Vec<u64>,
        payouts: Vec<u64>
    ) -> Result<()> {
        set_payout::handler(ctx, bucket_weights, payouts)
    }

    pub fn lock_odds(ctx: Context<LockOdds>) -> Result<()> {
        lock_odds::handler(ctx)
    }

    pub fn play_game(
        ctx: Context<PlayGame>,
        force: [u8; 32],
        game_id: u64,
        num_balls: u8,
        user_bet_amount: u64
    ) -> Result<()> {
        play_game::handler(ctx, force, game_id, num_balls, user_bet_amount)
    }

    pub fn fulfill_random_words(
        ctx: Context<FulFillRandomWords>,
        force: [u8; 32],
        game_id: u64,
        request_id: u64
    ) -> Result<()> {
        fulfill_random_words::handler(ctx, force, game_id, request_id)
    }

    pub fn set_platform_fee(ctx: Context<SetPlatformFee>, new_fee: u64) -> Result<()> {
        set_platform_fee::handler(ctx, new_fee)
    }

    pub fn set_min_buy_in(ctx: Context<SetMinBuyIn>, new_min_buy_in: u64) -> Result<()> {
        set_min_buy_in::handler(ctx, new_min_buy_in)
    }

    pub fn set_max_balls(ctx: Context<SetMaxBalls>, new_max_balls: u8) -> Result<()> {
        set_max_balls::handler(ctx, new_max_balls)
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        set_paused::handler(ctx, paused)
    }

    pub fn withdraw_from_vault(ctx: Context<WithdrawFromVault>, amount: u64) -> Result<()> {
        withdraw_from_vault::handler(ctx, amount)
    }
}
