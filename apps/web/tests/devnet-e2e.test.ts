import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';

import {
  CODE_ARENA_PROGRAM_ID,
  createInitializeUserInstruction,
  createRecordCompletionInstruction,
  getUserPda,
  getCompletionPda,
} from '@packages/sdk';
import { readStoredChallengeId } from '../lib/solana';

/**
 * Devnet end-to-end proof (opt-in: ARENA_E2E=1).
 *
 * Runs the exact flow a browser performs — one transaction that (optionally)
 * initializes the User PDA and then records a completion — then verifies it
 * against the cluster the same way the server's on-chain verifier does.
 *
 * Needs a funded local keypair (default ~/.config/solana/id.json, override
 * with ARENA_E2E_PAYER). Skipped silently without ARENA_E2E=1, so CI and the
 * plain `npm run check` never touch the network.
 */
const shouldRun = process.env.ARENA_E2E === '1';

test('devnet e2e: one-tx initialize_user + record_completion, then on-chain verify', { skip: !shouldRun }, async () => {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  );

  const payerPath = process.env.ARENA_E2E_PAYER || `${process.env.HOME}/.config/solana/id.json`;
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(payerPath, 'utf8') as string))
  );
  const student = Keypair.generate();

  // 1. Fund the "student" wallet from the CLI payer (no public faucet needed).
  const fundTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: student.publicKey,
      lamports: Math.round(0.05 * Number(LAMPORTS_PER_SOL)),
    })
  );
  fundTx.feePayer = payer.publicKey;
  const fundHash = await connection.getLatestBlockhash('confirmed');
  fundTx.recentBlockhash = fundHash.blockhash;
  fundTx.sign(payer);
  const fundSig = await connection.sendRawTransaction(fundTx.serialize());
  await connection.confirmTransaction({
    signature: fundSig,
    blockhash: fundHash.blockhash,
    lastValidBlockHeight: fundHash.lastValidBlockHeight,
  });

  // 2. One transaction: initialize_user (when missing) + record_completion.
  const challengeId = `e2e-${Date.now().toString(36)}`.slice(0, 32);
  const [userPda] = getUserPda(student.publicKey, CODE_ARENA_PROGRAM_ID);
  const [completionPda] = getCompletionPda(student.publicKey, challengeId, CODE_ARENA_PROGRAM_ID);

  const userBefore = await connection.getAccountInfo(userPda);
  const tx = new Transaction();
  if (!userBefore) {
    tx.add(createInitializeUserInstruction(student.publicKey, CODE_ARENA_PROGRAM_ID));
  }
  tx.add(
    createRecordCompletionInstruction(
      student.publicKey,
      challengeId,
      100,
      CODE_ARENA_PROGRAM_ID
    )
  );

  const mainHash = await connection.getLatestBlockhash('confirmed');
  tx.feePayer = student.publicKey;
  tx.recentBlockhash = mainHash.blockhash;
  tx.partialSign(student);

  const signature = await connection.sendRawTransaction(
    Buffer.from(tx.serialize())
  );
  const result = await connection.confirmTransaction({
    signature,
    blockhash: mainHash.blockhash,
    lastValidBlockHeight: mainHash.lastValidBlockHeight,
  });
  assert.equal(result.value.err, null, `record tx failed: ${result.value.err}`);

  // 3. The completion PDA now exists, is owned by the program, and stores the id.
  const completionInfo = await connection.getAccountInfo(completionPda);
  assert.ok(completionInfo, 'completion PDA should exist on Devnet');
  assert.ok(
    completionInfo.owner.equals(CODE_ARENA_PROGRAM_ID),
    'completion PDA is owned by the Code Arena program'
  );
  assert.equal(readStoredChallengeId(completionInfo.data), challengeId);
  // score is stored at 8 + 32 + 32 + 1 + 8 = 81, u32 LE
  assert.equal(completionInfo.data.subarray(81, 85).readUInt32LE(0), 100);

  // 4. The user profile scored up too (wallet 32B + count 4B + score 4B).
  const userAfter = await connection.getAccountInfo(userPda);
  assert.ok(userAfter, 'user PDA should exist on Devnet');
  assert.equal(userAfter.data.subarray(40, 44).readUInt32LE(0), 1); // completed_count
  assert.equal(userAfter.data.subarray(44, 48).readUInt32LE(0), 100); // score

  /* eslint-disable no-console */
  console.log(
    `[e2e] program=${CODE_ARENA_PROGRAM_ID.toBase58()}\n` +
      `[e2e] user=${userPda.toBase58()}\n` +
      `[e2e] completion=${completionPda.toBase58()}\n` +
      `[e2e] tx=${signature}`
  );
});
