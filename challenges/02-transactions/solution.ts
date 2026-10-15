import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export function buildTransferTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
  recentBlockhash: string
): Transaction {
  const tx = new Transaction();
  tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
  tx.feePayer = fromPubkey;
  tx.recentBlockhash = recentBlockhash;
  return tx;
}
