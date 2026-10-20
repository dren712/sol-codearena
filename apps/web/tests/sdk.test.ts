import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PublicKey } from '@solana/web3.js';

import {
  CODE_ARENA_PROGRAM_ID,
  createRecordCompletionInstruction,
  getCompletionPda,
  getInstructionDiscriminator,
  getUserPda,
} from '@packages/sdk';
import { getCluster, isPlausibleSignature, readStoredChallengeId } from '../lib/solana';

const PROGRAM_SOURCE = readFileSync(
  fileURLToPath(new URL('../../../programs/code_arena/src/lib.rs', import.meta.url)),
  'utf8'
);

test('program id matches the Rust declare_id!', () => {
  const declared = PROGRAM_SOURCE.match(/declare_id!\("([^"]+)"\)/);
  assert.ok(declared, 'could not find declare_id! in lib.rs');

  assert.equal(
    CODE_ARENA_PROGRAM_ID.toBase58(),
    declared[1],
    'the TypeScript program id has drifted from the on-chain program'
  );
});

test('the Rust challenge id width matches what the client assumes', () => {
  const maxLen = PROGRAM_SOURCE.match(/MAX_CHALLENGE_ID_LEN: usize = (\d+)/);
  assert.ok(maxLen, 'could not find MAX_CHALLENGE_ID_LEN in lib.rs');
  assert.equal(Number(maxLen[1]), 32);
});

test('instruction discriminators match sha256("global:<name>")', () => {
  // The SDK caches these in a lookup table for speed; a stale entry would send
  // malformed instructions to the cluster.
  for (const name of ['initialize_user', 'record_completion']) {
    const expected = createHash('sha256')
      .update(`global:${name}`)
      .digest()
      .subarray(0, 8);

    assert.deepEqual(
      Array.from(getInstructionDiscriminator(name)),
      Array.from(expected),
      `discriminator mismatch for ${name}`
    );
  }
});

test('unknown instruction names still hash deterministically', () => {
  const a = getInstructionDiscriminator('some_new_instruction');
  const b = getInstructionDiscriminator('some_new_instruction');

  assert.equal(a.length, 8);
  assert.deepEqual(Array.from(a), Array.from(b));
});

test('user PDA derivation mirrors the on-chain seeds', () => {
  const wallet = new PublicKey('So11111111111111111111111111111111111111112');
  const [pda, bump] = getUserPda(wallet);

  // ["user", wallet] under the program id, exactly like the Rust `seeds`.
  const [expected, expectedBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('user'), wallet.toBuffer()],
    CODE_ARENA_PROGRAM_ID
  );

  assert.equal(pda.toBase58(), expected.toBase58());
  assert.equal(bump, expectedBump);
  assert.equal(PublicKey.isOnCurve(pda), false, 'a PDA must lie off the curve');
});

test('completion PDA derivation is deterministic and challenge-specific', () => {
  const wallet = new PublicKey('So11111111111111111111111111111111111111112');

  const [first, firstBump] = getCompletionPda(wallet, '04-pdas');
  const [second, secondBump] = getCompletionPda(wallet, '04-pdas');
  const [other] = getCompletionPda(wallet, '01-wallets');

  assert.equal(first.toBase58(), second.toBase58());
  assert.equal(firstBump, secondBump);
  assert.notEqual(first.toBase58(), other.toBase58());
  assert.equal(PublicKey.isOnCurve(first), false);
});

test('record_completion encodes a well-formed instruction', () => {
  const wallet = new PublicKey('So11111111111111111111111111111111111111112');
  const challengeId = '04-pdas';
  const ix = createRecordCompletionInstruction(wallet, challengeId, 150);

  // discriminator(8) + string length(4) + "04-pdas"(7) + score u32 LE(4)
  assert.equal(ix.data.length, 8 + 4 + challengeId.length + 4);
  assert.deepEqual(
    Array.from(ix.data.subarray(0, 8)),
    Array.from(getInstructionDiscriminator('record_completion'))
  );
  assert.equal(ix.data.readUInt32LE(8), challengeId.length);
  assert.equal(ix.data.subarray(12, 12 + challengeId.length).toString('utf8'), challengeId);
  assert.equal(ix.data.readUInt32LE(12 + challengeId.length), 150);

  assert.equal(ix.programId.toBase58(), CODE_ARENA_PROGRAM_ID.toBase58());
  assert.equal(ix.keys.length, 4);
  assert.equal(ix.keys[2].pubkey.toBase58(), wallet.toBase58(), 'authority must sign');
  assert.equal(ix.keys[2].isSigner, true);
  assert.equal(ix.keys[0].isSigner, false, 'PDAs cannot sign');
});

test('placeholder demo signatures are never treated as verifiable', () => {
  assert.equal(isPlausibleSignature('arena_proof_deadbeef1234'), false);
  assert.equal(isPlausibleSignature('not-a-signature'), false);
  assert.equal(isPlausibleSignature(''), false);
  assert.equal(isPlausibleSignature(null), false);
  assert.equal(isPlausibleSignature(undefined), false);
  assert.equal(isPlausibleSignature('1'.repeat(88)), true);
  assert.equal(
    isPlausibleSignature('5wHu1qwD4kMVvEsyDs7VSxHUP5QFXP2R7vHXvJDk8vVQ1bc3RrjQpQTHCG6WkYdVqD8uZb6mC7LQm1nHq2bTGa'), true
  );
});

test('reads the padded challenge id out of raw account data', () => {
  const id = '04-pdas';
  const data = Buffer.alloc(90);
  data.writeUInt8(id.length, 8 + 32 + 32);
  Buffer.from(id).copy(data, 8 + 32);

  assert.equal(readStoredChallengeId(data), id);
  assert.equal(readStoredChallengeId(Buffer.alloc(4)), null, 'short data is not a completion');
});

test('the server reads from devnet unless told otherwise', () => {
  assert.equal(getCluster(), 'devnet');
});