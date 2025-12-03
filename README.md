# 🎰 Solana Plinko Game Smart Contract

A decentralized, provably fair Plinko game built on Solana blockchain using Anchor framework. This smart contract implements a fully on-chain gaming experience with verifiable randomness through Orao VRF (Verifiable Random Function), ensuring transparency and fairness for all players.

## ✨ Features

- 🎲 **Provably Fair Gaming**: Leverages Orao VRF for cryptographically verifiable randomness
- 💰 **Flexible Betting**: Support for multiple balls per game with configurable bet amounts
- 📊 **User Statistics**: Track player performance, total games, wagered amounts, and winnings
- 🏦 **House Management**: Secure vault system with controlled withdrawals and balance tracking
- ⚙️ **Admin Controls**: Comprehensive administrative functions for game configuration
- 🔒 **Security First**: Built with Anchor's type-safe framework and comprehensive validation
- 📈 **Scalable Architecture**: PDA-based account structure for efficient on-chain storage

## Contact
https://t.me/frogansol

## 🏗️ Architecture

### Core Components

- **PlinkoStatus**: Main game configuration and state management
- **House**: Vault management and house balance tracking
- **Game**: Individual game state and results
- **UserStats**: Player statistics and game history

### Key Instructions

| Instruction | Description |
|------------|-------------|
| `initialize` | Initialize the game contract with platform settings |
| `play_game` | Start a new Plinko game with specified balls and bet amount |
| `fulfill_random_words` | Process VRF randomness and calculate game results |
| `set_payout` | Configure bucket weights and payout multipliers |
| `lock_odds` | Lock payout configuration to prevent changes |
| `set_platform_fee` | Update platform fee percentage |
| `set_min_buy_in` | Configure minimum bet amount |
| `set_max_balls` | Set maximum number of balls per game |
| `set_paused` | Pause/unpause the game |
| `withdraw_from_vault` | Withdraw funds from the house vault |

## 📋 Prerequisites

- **Rust** (latest stable version)
- **Solana CLI** (v2.1.20 or compatible)
- **Anchor Framework** (v0.31.1)
- **Node.js** (v16 or higher)
- **Yarn** package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-plinko-smart-contract
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Build the program**
   ```bash
   anchor build
   ```

4. **Run tests**
   ```bash
   anchor test
   ```

## 💻 Usage

### Initialize the Contract

```typescript
await program.methods
  .initialize(
    new BN(300),        // platformFee (3% = 300/10000)
    new BN(100_000_000), // minBuyIn (0.1 SOL)
    60                  // maxBalls
  )
  .accounts({
    authority: authority.publicKey,
    feeTreasury: feeTreasury.publicKey,
  })
  .rpc();
```

### Play a Game

```typescript
const gameId = new BN(Date.now());
const numBalls = 5;
const betAmount = new BN(100_000_000); // 0.1 SOL per ball

await program.methods
  .playGame(
    force,           // VRF force parameter
    gameId,
    numBalls,
    betAmount
  )
  .accounts({
    player: player.publicKey,
    // ... other accounts
  })
  .rpc();
```

### Configure Payouts

```typescript
const bucketWeights = [100, 200, 300, 200, 100]; // Weight distribution
const payouts = [20000, 15000, 10000, 15000, 20000]; // Payout multipliers

await program.methods
  .setPayout(bucketWeights, payouts)
  .accounts({
    authority: authority.publicKey,
    // ... other accounts
  })
  .rpc();
```

## 📁 Project Structure

```
solana-plinko-smart-contract/
├── programs/
│   └── solana-plinko-smart-contract/
│       └── src/
│           ├── lib.rs                    # Main program entry point
│           ├── account.rs                # Account structures
│           ├── errors.rs                 # Custom error definitions
│           ├── instructions/              # Instruction handlers
│           │   ├── initialize.rs
│           │   ├── play_game.rs
│           │   ├── fulfill_random_words.rs
│           │   ├── set_payout.rs
│           │   └── ...
│           ├── utils.rs                  # Utility functions
│           └── misc.rs                   # Miscellaneous helpers
├── tests/
│   └── solana-plinko-smart-contract.ts   # Integration tests
├── migrations/
│   └── deploy.ts                         # Deployment script
├── Anchor.toml                            # Anchor configuration
└── package.json                          # Node.js dependencies
```

## 🧪 Testing

The project includes comprehensive integration tests covering:

- Contract initialization
- Game creation and execution
- VRF randomness fulfillment
- Payout calculations
- Admin functions
- Error handling

Run tests with:
```bash
anchor test
```

## 🔐 Security Considerations

- **Access Control**: All administrative functions are protected by owner checks
- **Input Validation**: Comprehensive validation for bet amounts, ball counts, and game parameters
- **Pause Mechanism**: Emergency pause functionality to halt game operations
- **Odds Locking**: Once odds are locked, payout configuration cannot be modified
- **VRF Integration**: Uses Orao VRF for provably fair randomness

## 🎯 Game Mechanics

1. **Player places a bet** with specified number of balls and bet amount per ball
2. **VRF request is initiated** to obtain verifiable random values
3. **Randomness is fulfilled** and bucket assignments are calculated
4. **Payouts are calculated** based on bucket weights and payout multipliers
5. **Winnings are transferred** to the player's account

## 📊 Account PDAs

- `plinko_status`: `[b"plinko_status"]`
- `house`: `[b"house"]`
- `game`: `[b"game", game_id]`
- `user_stats`: `[b"user_stats", player]`
- `vault`: `[b"vaultseed"]`

## 🔧 Configuration

Key configuration parameters in `Anchor.toml`:

- **Cluster**: devnet (configurable)
- **Program ID**: `7dzjQ2uoBb9dDC6S4bdAk7rynABaBWrXWaXkp4xBicuv`
- **Anchor Version**: 0.31.1
- **Solana Version**: 2.1.20

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ using Anchor and Solana**
