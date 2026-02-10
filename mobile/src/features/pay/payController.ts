import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  sendAndConfirmTransaction,
  Keypair
} from "@solana/web3.js";
import type { ApiClient } from "../../api/client";
import { validatePin } from "../pin/pinPolicy";
import { PriceService } from "../../utils/prices";

const DEVNET_RPC = "https://api.devnet.solana.com";

export type PayInput = {
  recipientHandle: string; 
  inrAmount: number;
  pin: string;
  senderKeypair: Keypair;
};

export type PayResult =
  | {
      ok: true;
      signature: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function runUpiLikePayFlow(client: ApiClient, input: PayInput): Promise<PayResult> {
  try {
    const connection = new Connection(DEVNET_RPC, "confirmed");
    
    // 1. Resolve Recipient
    let recipientPubkey: PublicKey;
    if (input.recipientHandle.startsWith("@")) {
      // Demo resolution
      recipientPubkey = new PublicKey("7xKXbeUMB98UrSNo4Mw2s5at9tv9pTADsaW59N1m5Vn9");
    } else {
      recipientPubkey = new PublicKey(input.recipientHandle);
    }

    // 2. Convert INR to SOL using real market rates
    const solAmount = await PriceService.inrToSol(input.inrAmount);

    // 3. Build Transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: input.senderKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
      })
    );

    // 4. Sign and Send
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
