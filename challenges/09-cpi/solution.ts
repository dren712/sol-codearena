import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';

export function buildCpiTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
) {
  const instruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });

  return {
    calleeProgramId: instruction.programId.toBase58(),
    accountsCount: instruction.keys.length,
    isPayerWritable: instruction.keys[0].isWritable,
    isRecipientWritable: instruction.keys[1].isWritable,
    instruction,
  };
}
