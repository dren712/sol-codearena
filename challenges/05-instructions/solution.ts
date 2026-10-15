import { TransactionInstruction, PublicKey } from '@solana/web3.js';

export function buildArenaInstruction(
  programId: PublicKey,
  userWallet: PublicKey,
  pdaAccount: PublicKey,
  actionTag: number
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: userWallet, isSigner: true, isWritable: true },
      { pubkey: pdaAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: Buffer.from([actionTag]),
  });
}
