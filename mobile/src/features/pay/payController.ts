import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from "@solana/web3.js";
import { PriceService } from "../../utils/prices";

const DEVNET_RPC = "https://api.devnet.solana.com";

export type PayInput = {
  recipientWallet: string;
  inrAmount: number;
  senderKeypair: Keypair;
};

export type PayResult =
  | { ok: true; signature: string }
  | { ok: false; message: string };

export async function runUpiLikePayFlow(input: PayInput): Promise<PayResult> {
  try {
    const connection = new Connection(DEVNET_RPC, "confirmed");

    const recipientPubkey = new PublicKey(input.recipientWallet);

    // Convert INR to SOL using real market rates
    const solAmount = await PriceService.inrToSol(input.inrAmount);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: input.senderKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [input.senderKeypair]
    );

    return { ok: true, signature };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}
