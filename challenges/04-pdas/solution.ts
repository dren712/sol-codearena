import { PublicKey } from '@solana/web3.js';

export function deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number] {
  const seeds = [
    Buffer.from('user'),
    wallet.toBuffer(),
  ];

  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  return [pda, bump];
}
