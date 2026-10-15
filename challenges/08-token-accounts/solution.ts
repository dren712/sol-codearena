import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export function deriveAssociatedTokenAccount(wallet: PublicKey, mint: PublicKey): PublicKey {
  const seeds = [
    wallet.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ];

  const [ata] = PublicKey.findProgramAddressSync(seeds, ASSOCIATED_TOKEN_PROGRAM_ID);
  return ata;
}
