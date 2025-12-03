import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaPlinkoSmartContract } from "../target/types/solana_plinko_smart_contract";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { assert, expect } from "chai";
import {
  networkStateAccountAddress,
  Orao,
  randomnessAccountAddress,
  RANDOMNESS_ACCOUNT_SEED,
} from "@orao-network/solana-vrf";
let cluster = "devnet";

const connection =
  cluster == "localnet"
    ? new Connection("http://localhost:8899", "confirmed")
    : new Connection("https://api.devnet.solana.com", "confirmed");

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace
  .SolanaPlinkoSmartContract as Program<SolanaPlinkoSmartContract>;

let gamePda: PublicKey;
let userStatsPda: PublicKey;
let authority: Keypair;
let feeTreasury: Keypair;
let player: Keypair;

authority = Keypair.fromSecretKey(
  new Uint8Array([
    89, 192, 68, 99, 223, 164, 90, 67, 4, 131, 102, 203, 248, 188, 139, 130, 21,
    215, 46, 128, 68, 28, 78, 213, 80, 87, 243, 16, 149, 90, 168, 50, 159, 143,
    127, 65, 3, 40, 50, 168, 108, 84, 147, 171, 135, 254, 206, 176, 134, 67, 35,
    204, 182, 238, 129, 93, 205, 224, 97, 119, 19, 40, 132, 163,
  ])
);
feeTreasury = Keypair.fromSecretKey(
  new Uint8Array([
    9, 2, 57, 87, 251, 160, 151, 163, 116, 69, 84, 212, 73, 121, 146, 200, 175,
    31, 157, 48, 218, 214, 51, 167, 76, 87, 215, 218, 74, 55, 195, 197, 37, 61,
    36, 137, 168, 82, 113, 239, 208, 148, 170, 7, 30, 46, 169, 63, 149, 25, 237,
    28, 61, 125, 79, 28, 58, 207, 175, 14, 249, 26, 31, 140,
  ])
);
player = Keypair.fromSecretKey(
  new Uint8Array([
    137, 218, 121, 153, 176, 226, 2, 208, 109, 170, 55, 217, 179, 55, 35, 119,
    249, 102, 94, 95, 213, 187, 222, 241, 51, 106, 190, 38, 204, 103, 195, 31,
    29, 112, 136, 204, 99, 174, 61, 239, 135, 196, 154, 36, 0, 20, 150, 112,
    120, 68, 188, 179, 190, 59, 245, 131, 95, 70, 57, 174, 145, 70, 111, 240,
  ])
);

console.log("🏢 Authority:", authority.publicKey.toString());
console.log("🏦 Fee Treasury:", feeTreasury.publicKey.toString());
console.log("👤 Player Public Key:", player.publicKey.toBase58());

const vrf = new Orao(provider);

describe("Initialize", async () => {
  let plinkoStatusPda: PublicKey;
  let housePda: PublicKey;

  [plinkoStatusPda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("plinko_status")],
    program.programId
  );
  [housePda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("house")],
    program.programId
  );

  console.log("🚀 ~ describe ~ plinkoStatusPda:", plinkoStatusPda);
  console.log("🚀 ~ describe ~ housePda:", housePda);

  it("should initialize the contract", async () => {
    try {
      const ix = await program.methods
        .initialize(
          new BN(300), // platformFee (u64)
          new BN(100_000_000), // minBuyIn (u64)
          60 // maxBalls (u8)
        )
        .accounts({
          authority: authority.publicKey,
          feeTreasury: feeTreasury.publicKey,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.feePayer = authority.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(authority);

      console.log(await connection.simulateTransaction(tx));

      const sig = await sendAndConfirmTransaction(connection, tx, [authority]);

      console.log("✅ Success! Initialize transaction signature:", sig);
    } catch (err) {
      console.log("Initialize Error: ", err.message);
    }

    const plinko_status = await program.account.plinkoStatus.fetch(
      plinkoStatusPda
    );
    const house = await program.account.house.fetch(housePda);

    console.log("\n📊 Plinko Status Account:");
    console.log("- Owner:", plinko_status.owner.toString());
    console.log(
      "- Platform Fee:",
      (Number(plinko_status.platformFee.toString()) /
        Number(plinko_status.feeDenominator.toString())) *
        100,
      "(%)"
    );
    console.log(
      "- Min Buy-In:",
      Number(plinko_status.minBuyIn.toString()) / LAMPORTS_PER_SOL,
      "SOL"
    );
    console.log("- Max Balls:", plinko_status.maxBalls);
    console.log("- Paused:", plinko_status.paused);

    console.log("\n🏠 House Account:");
    console.log("- House Owner:", house.owner.toString());
    console.log("- House Balance:", house.balance.toString(), "lamports");
    console.log("- House Pending Requests:", house.pendingRequest);

    console.log("\nInitialization completed successfully!");
  });

  it("Set payout per bucket", async () => {
    const payouts = [400, 200, 150, 100, 50, 10, 50, 100, 150, 200, 400].map(
      (n) => new BN(n)
    );

    const weights = [1, 2, 3, 5, 8, 12, 16, 19, 21, 22, 23].map(
      (n) => new BN(n)
    );
    console.log("🚀 ~ it ~ payouts:", payouts);
    console.log("🚀 ~ it ~ weights:", weights);

    try {
      const ix = await program.methods
        .setPayout(payouts, weights)
        .accounts({
          authority: authority.publicKey,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.feePayer = authority.publicKey;
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.sign(authority);
      console.log(await connection.simulateTransaction(tx));

      const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
      console.log("✅ Set Payout Transaction signature:", sig);
    } catch (err) {
      console.log("Set Payout Error: ", err.message);
    }
    const plinko_status = await program.account.plinkoStatus.fetch(
      plinkoStatusPda
    );
    console.log("Plinko Set payouts status:", plinko_status.oddsLocked);
    console.log(
      "Payouts set successfully:",
      plinko_status.payouts.map((p) => p.toString())
    );
    console.log(
      "Bucket IDs set successfully:",
      plinko_status.bucketWeights.map((b) => b.toString())
    );
  });

  it("should lock the odds", async () => {
    const ix = await program.methods
      .lockOdds()
      .accounts({
        authority: authority.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = authority.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    tx.sign(authority);

    const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
    console.log("✅ Lock Odds Transaction signature: ", sig);
    console.log("🚫 No further changes to payouts allowed!");

    const plinko_status = await program.account.plinkoStatus.fetch(
      plinkoStatusPda
    );
    console.log("Plinko Set payouts status:", plinko_status.oddsLocked);
  });

  const forceKeypair = anchor.web3.Keypair.generate();
  const forceBytes = forceKeypair.publicKey.toBuffer();
  const gameId = new BN(1);

  it("should allow a player to start a game", async () => {
    let vaultPda: PublicKey;

    const ORAO_VRF_PROGRAM_ID = vrf.programId;
    console.log("🚀 ~ describe ~ ORAO_VRF_PROGRAM_ID:", ORAO_VRF_PROGRAM_ID);

    const treasury = new PublicKey(
      "9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR"
    );
    [gamePda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [userStatsPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), player.publicKey.toBuffer()],
      program.programId
    );
    [vaultPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vaultseed")],
      program.programId
    );
    console.log("🚀 ~ it ~ gamePda:", gamePda);
    console.log("🚀 ~ it ~ userStatsPda:", userStatsPda);
    console.log("🚀 ~ it ~ vaultPda:", vaultPda);

    const randomPda = randomnessAccountAddress(forceBytes);
    const configPda = networkStateAccountAddress();
    console.log("🚀 ~ describe ~ force:", forceKeypair.publicKey);
    console.log("🚀 ~ describe ~ forceBytes:", forceBytes);

    let numBalls = 1;
    let betBn = new BN(1_000_000_000);

    console.log("seed:", bs58.encode(forceBytes));
    console.log("randomPda (JS):", randomPda.toBase58());
    try {
      const tx = await program.methods
        .playGame([...forceBytes], gameId, numBalls, betBn)
        .accountsStrict({
          plinkoStatus: plinkoStatusPda,
          game: gamePda,
          house: housePda,
          userStats: userStatsPda,
          vault: vaultPda,
          player: player.publicKey,
          treasury: treasury,
          random: randomPda,
          config: configPda,
          vrf: vrf.programId,
          feeTreasury: feeTreasury.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      console.log("PlayGame + VRF tx:", tx);

      const { randomness } = await vrf.waitFulfilled(forceBytes);
      console.log("Your plinko randomness:", randomness);

      console.log("✅ playGame transaction signature:", tx);
    } catch (err) {
      console.log("Play Game error: ", err.message);
    }

    const game = await program.account.game.fetch(gamePda);

    console.log("Game created successfully:", game);
    console.log("Game ID:", game.gameId.toString());
    console.log("Player:", game.player.toBase58());
    console.log("Total Amount Bet of User:", game.betAmount.toNumber());
    console.log("Amount for house:", game.amountForHouse.toNumber());
    console.log("Bet Amount per ball:", game.betAmountPerBall.toNumber());
    console.log("Number of Balls:", game.numBalls);
    console.log("Has Ended:", game.hasEnded);

    const user_stats = await program.account.userStats.fetch(userStatsPda);

    console.log("User public key: ", user_stats.user.toBase58());
    console.log("User total games played: ", user_stats.totalGames.toNumber());
    console.log("User total bet amount: ", user_stats.totalWagered.toNumber());
    console.log("User total won: ", user_stats.totalWon.toNumber());
    console.log(
      "User games ids: ",
      user_stats.gameIds.map((id) => id.toString())
    );

    const plinko_status = await program.account.plinkoStatus.fetch(
      plinkoStatusPda
    );
    console.log(
      "Plinko total game count: ",
      plinko_status.totalGames.toNumber()
    );
    console.log("Plinko total volume: ", plinko_status.totalVolume.toNumber());
    console.log(
      "Plinko Game Force: ",
      plinko_status.force.map((f) => f.toString())
    );
    console.log("Plinko Game Status: ", plinko_status.status);

    const house = await program.account.house.fetch(housePda);

    console.log("House balance:", house.balance.toNumber());
    console.log("House pending requests:", house.pendingRequest);
  });

  it("should fulfill the game:", async () => {
    let vaultPda: PublicKey;

    const randomPda = randomnessAccountAddress(forceBytes);
    [gamePda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [userStatsPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), player.publicKey.toBuffer()],
      program.programId
    );
    [vaultPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vaultseed")],
      program.programId
    );
    const game = await program.account.game.fetch(gamePda);

    const requestId = new BN(game.requestId);
    console.log("Request ID:", requestId.toString());
    console.log("Player Public Key: ", player.publicKey);
    try {
      const ix = await program.methods
        .fulfillRandomWords([...forceBytes], gameId, requestId)
        .accountsStrict({
          player: player.publicKey,
          game: gamePda,
          house: housePda,
          plinkoStatus: plinkoStatusPda,
          vault: vaultPda,
          random: randomPda,
          systemProgram: SystemProgram.programId,
          userStats: userStatsPda,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.feePayer = player.publicKey;
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.sign(player);
      const sig = await sendAndConfirmTransaction(connection, tx, [player]);

      console.log("✅ Fulfill Random Words transaction signature:", sig);
    } catch (err) {
      console.log("Fulfill random words error: ", err.message);
    }

    const plinko_status = await program.account.plinkoStatus.fetch(
      plinkoStatusPda
    );
    console.log("Plinko Total Payout: ", plinko_status.totalPayouts.toNumber());

    const plinko_game = await program.account.game.fetch(gamePda);

    console.log("Game Buckets Index Array: ", Array.from(plinko_game.buckets));
    console.log("After bet Game Total Payout: ", plinko_game.payout.toString());

    const house = await program.account.house.fetch(housePda);
    console.log("House pending request: ", house.pendingRequest);
    console.log("Current House balance: ", house.balance.toString());

    console.log("Game has ended: ", game.hasEnded);

    const user_stats = await program.account.userStats.fetch(userStatsPda);
    console.log("User total won: ", user_stats.totalWon.toNumber());
    console.log("User's TotalGame Count: ", user_stats.totalGames.toNumber()),
      console.log(
        "User's GameIds: ",
        user_stats.gameIds.map((g) => g.toString())
      );
  });

  it("Withdraw from vault pda to admin wallet", async () => {
    const ix = await program.methods
      .withdrawFromVault(BN[10_000])
      .accounts({
        authority: authority.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = authority.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    tx.sign(authority);
    const sig = await sendAndConfirmTransaction(connection, tx, [authority]);

    console.log("✅ Success! Withdraw fees transaction sig: ", sig);
  });
});

