import test from 'node:test';
import assert from 'node:assert/strict';

import { CHALLENGES } from '@challenges/data';
import { ChallengeValidator } from '@packages/validator';

const TIMEOUT = { timeoutMs: 10_000 };

/**
 * These are the regression guards that matter most for this project.
 *
 * The validator, the challenge catalogue and the reference solutions live in
 * three places that must agree. When they drift, students hit false negatives
 * ("my code is right but it says failed") and there is nothing to catch it —
 * so every solution is executed against the validator here.
 */
test('every reference solution passes its own challenge', async () => {
  assert.ok(CHALLENGES.length > 0, 'catalogue is empty');

  for (const challenge of CHALLENGES) {
    const result = await ChallengeValidator.validate(
      challenge.slug,
      challenge.solutionCode,
      undefined,
      TIMEOUT
    );

    assert.equal(
      result.success,
      true,
      `${challenge.slug}: reference solution failed\n${result.output}`
    );
    assert.ok(
      result.testResults.every((t) => t.passed),
      `${challenge.slug}: not every test passed`
    );
    assert.equal(
      result.score,
      challenge.points,
      `${challenge.slug}: full marks should award the challenge's points`
    );
    assert.equal(
      result.testResults.length,
      challenge.testCases.length,
      `${challenge.slug}: test result count must match the declared test cases`
    );
  }
});

test('every starter template fails validation', async () => {
  for (const challenge of CHALLENGES) {
    const result = await ChallengeValidator.validate(
      challenge.slug,
      challenge.starterCode,
      undefined,
      TIMEOUT
    );

    assert.equal(
      result.success,
      false,
      `${challenge.slug}: starter code should not pass out of the box`
    );
    assert.equal(result.score, 0, `${challenge.slug}: starter code must score zero`);
  }
});

test('challenge slugs and ids are unique', () => {
  const slugs = CHALLENGES.map((c) => c.slug);
  const ids = CHALLENGES.map((c) => c.id);

  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slug');
  assert.equal(new Set(ids).size, ids.length, 'duplicate id');
});

test('every challenge declares hints, tests and concepts', () => {
  for (const challenge of CHALLENGES) {
    assert.ok(challenge.task?.length > 0, `${challenge.slug}: missing task`);
    assert.ok(challenge.testCases.length > 0, `${challenge.slug}: missing test cases`);
    assert.ok(challenge.hints.length > 0, `${challenge.slug}: missing hints`);
    assert.ok(challenge.concepts.length > 0, `${challenge.slug}: missing concepts`);
    assert.ok(challenge.points > 0, `${challenge.slug}: missing points`);
  }
});

test('unknown challenge slugs return a failure, not a crash', async () => {
  const result = await ChallengeValidator.validate('99-nope', 'export const x = 1;');
  assert.equal(result.success, false);
  assert.match(result.output, /does not exist|not found/);
});

test('a function declared without `export` is still discovered', async () => {
  // Students routinely forget the export keyword; this must not cost them a fail.
  const noExport = `function uiAmountToRawUnits(amountUi: number, decimals: number): bigint {
    return BigInt(Math.round(amountUi * (10 ** decimals)));
  }
  function rawUnitsToUi(rawUnits: bigint, decimals: number): number {
    return Number(rawUnits) / (10 ** decimals);
  }`;

  const result = await ChallengeValidator.validate('07-spl-tokens', noExport, undefined, TIMEOUT);
  assert.equal(result.success, true, result.output);
});

test('an infinite loop is terminated instead of hanging the server', async () => {
  const runaway = `export function deriveUserPda(wallet: any, programId: any): [any, number] {
    while (true) {}
  }`;

  const result = await ChallengeValidator.validate('04-pdas', runaway, undefined, {
    timeoutMs: 300,
  });

  assert.equal(result.success, false);
  assert.match(result.output, /timed out/i);
});

test('the sandbox does not expose the host process', async () => {
  const probe = `export function deriveUserPda(): [any, number] {
    const globals = typeof process === 'undefined' && typeof globalThis.process === 'undefined';
    throw new Error(globals ? 'SANDBOXED' : 'PROCESS-LEAKED');
  }`;

  const result = await ChallengeValidator.validate('04-pdas', probe, undefined, TIMEOUT);

  assert.match(result.output, /SANDBOXED/);
  assert.doesNotMatch(result.output, /PROCESS-LEAKED/);
});

test('oversized submissions are rejected before execution', async () => {
  await assert.rejects(
    () =>
      ChallengeValidator.validate(
        '01-wallets',
        `export const pad = "${'x'.repeat(120_000)}";`,
        undefined,
        TIMEOUT
      ),
    /exceeds/
  );
});

test('empty submissions are rejected', async () => {
  await assert.rejects(
    () => ChallengeValidator.validate('01-wallets', '', undefined, TIMEOUT),
    /empty/i
  );
});

test('non-string submissions are rejected', async () => {
  await assert.rejects(
    () => ChallengeValidator.validate('01-wallets', { evil: true } as any, undefined, TIMEOUT),
    /string/i
  );
});

test('a throwing solution surfaces the student error message', async () => {
  const broken = `export function deriveUserPda(): [any, number] {
    throw new Error('seeds must be Buffers');
  }`;

  const result = await ChallengeValidator.validate('04-pdas', broken, undefined, TIMEOUT);

  assert.equal(result.success, false);
  assert.match(result.output, /seeds must be Buffers/);
});

test('partial solutions receive partial credit, never full marks', async () => {
  // Correct seed, but the bump is wrong: tests 1 and 3 should fail, 2 may pass.
  const partial = `import { PublicKey } from '@solana/web3.js';
  export function deriveUserPda(wallet: PublicKey, programId: PublicKey): [PublicKey, number] {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('user'), wallet.toBuffer()], programId);
    return [pda, 0];
  }`;

  const result = await ChallengeValidator.validate('04-pdas', partial, undefined, TIMEOUT);

  assert.equal(result.success, false);
  assert.ok(result.score < 150, 'partial work must not earn full points');
});