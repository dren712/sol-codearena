import { PublicKey } from '@solana/web3.js';

export function deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number] {
  // TODO: Derive off-curve PDA with seeds: ["user", wallet.toBuffer()]
  return [PublicKey.default, 0];
}
