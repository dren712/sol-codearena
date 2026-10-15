import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export function buildTransferTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
  recentBlockhash: string
): Transaction {
  // TODO: Add SystemProgram.transfer instruction, configure feePayer and recentBlockhash
  return new Transaction();
}
