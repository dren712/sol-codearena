import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createHash } from 'crypto';

export const CODE_ARENA_PROGRAM_ID = new PublicKey('Arena111111111111111111111111111111111111111');

export const CODE_ARENA_IDL = {
  version: '0.1.0',
  name: 'code_arena',
  instructions: [
    {
      name: 'initializeUser',
      accounts: [
        { name: 'userProfile', isMut: true, isSigner: false },
        { name: 'authority', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'recordCompletion',
      accounts: [
        { name: 'completion', isMut: true, isSigner: false },
        { name: 'userProfile', isMut: true, isSigner: false },
        { name: 'authority', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'challengeId', type: 'string' },
        { name: 'score', type: 'u32' },
      ],
    },
  ],
  accounts: [
    {
      name: 'UserProfile',
      type: {
        kind: 'struct',
        fields: [
          { name: 'wallet', type: 'publicKey' },
          { name: 'completedCount', type: 'u32' },
          { name: 'score', type: 'u32' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
    {
      name: 'CompletionRecord',
      type: {
        kind: 'struct',
        fields: [
          { name: 'wallet', type: 'publicKey' },
          { name: 'challengeId', type: 'string' },
          { name: 'timestamp', type: 'i64' },
          { name: 'score', type: 'u32' },
          { name: 'verified', type: 'bool' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
};

/**
 * Derives the User PDA for a given wallet address.
 * Seeds: ["user", wallet_pubkey]
 */
export function getUserPda(
  wallet: PublicKey,
  programId: PublicKey = CODE_ARENA_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user'), wallet.toBuffer()],
    programId
  );
}

/**
 * Derives the Completion PDA for a given wallet address and challenge ID.
 * Seeds: ["completion", wallet_pubkey, challenge_id]
 */
export function getCompletionPda(
  wallet: PublicKey,
  challengeId: string,
  programId: PublicKey = CODE_ARENA_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('completion'), wallet.toBuffer(), Buffer.from(challengeId)],
    programId
  );
}

/**
 * Computes 8-byte Anchor instruction discriminator: sha256("global:<name>")[0..8]
 */
export function getInstructionDiscriminator(name: string): Buffer {
  return createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

/**
 * Creates the initialize_user instruction.
 */
export function createInitializeUserInstruction(
  wallet: PublicKey,
  programId: PublicKey = CODE_ARENA_PROGRAM_ID
): TransactionInstruction {
  const [userPda] = getUserPda(wallet, programId);
  const discriminator = getInstructionDiscriminator('initialize_user');

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: userPda, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator,
  });
}

/**
 * Creates the record_completion instruction.
 * Borsh encodes: [discriminator (8B), len (4B LE), challenge_id string, score (4B LE u32)]
 */
export function createRecordCompletionInstruction(
  wallet: PublicKey,
  challengeId: string,
  score: number,
  programId: PublicKey = CODE_ARENA_PROGRAM_ID
): TransactionInstruction {
  const [completionPda] = getCompletionPda(wallet, challengeId, programId);
  const [userPda] = getUserPda(wallet, programId);
  const discriminator = getInstructionDiscriminator('record_completion');

  const strBytes = Buffer.from(challengeId, 'utf8');
  const strLenBuf = Buffer.alloc(4);
  strLenBuf.writeUInt32LE(strBytes.length, 0);

  const scoreBuf = Buffer.alloc(4);
  scoreBuf.writeUInt32LE(score, 0);

  const data = Buffer.concat([discriminator, strLenBuf, strBytes, scoreBuf]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: completionPda, isSigner: false, isWritable: true },
      { pubkey: userPda, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Returns a Solana Explorer URL for a transaction signature.
 */
export function getExplorerTxUrl(signature: string, cluster: string = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Returns a Solana Explorer URL for an account / PDA address.
 */
export function getExplorerAddressUrl(address: string, cluster: string = 'devnet'): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
