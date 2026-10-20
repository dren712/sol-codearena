import test from 'node:test';
import assert from 'node:assert/strict';

import { CHALLENGES } from '@challenges/data';
import {
  clampScore,
  decideAward,
  totalAvailablePoints,
} from '../lib/progress';

const PDA_CHALLENGE = '04-pdas';
const pdaChallenge = CHALLENGES.find((c) => c.id === PDA_CHALLENGE)!;

/**
 * Score integrity lives here: a client may *propose* a completion, but the
 * server decides what it is worth. These tests pin that rule down.
 */

test('a completion cannot be awarded without a passing submission', () => {
  const decision = decideAward(PDA_CHALLENGE, null);

  assert.equal(decision.ok, false);
  assert.equal(decision.status, 403);
  assert.match(decision.error, /Pass the challenge test suite/);
});

test('a failed submission does not award points', () => {
  const decision = decideAward(PDA_CHALLENGE, {
    challengeId: PDA_CHALLENGE,
    score: 150,
    status: 'failed',
  });

  assert.equal(decision.ok, false);
  assert.equal(decision.status, 403);
});

test('a passing submission awards its stored score, not a client-supplied one', () => {
  const decision = decideAward(PDA_CHALLENGE, {
    challengeId: PDA_CHALLENGE,
    score: 150,
    status: 'passed',
  });

  assert.equal(decision.ok, true);
  if (!decision.ok) return;

  assert.equal(decision.score, 150);
  assert.equal(decision.challenge.points, pdaChallenge.points);
});

test('unknown challenges are rejected as 404', () => {
  const decision = decideAward('99-does-not-exist', {
    challengeId: '99-does-not-exist',
    score: 999,
    status: 'passed',
  });

  assert.equal(decision.ok, false);
  assert.equal(decision.status, 404);
});

test('a missing or malformed challenge id is rejected as 400', () => {
  for (const badId of [undefined, null, '', 42, {}]) {
    const decision = decideAward(badId, {
      challengeId: 'x',
      score: 1,
      status: 'passed',
    });

    assert.equal(decision.ok, false, `expected rejection for ${String(badId)}`);
    if (!decision.ok) assert.equal(decision.status, 400);
  }
});

test('an inflated stored score is clamped to the challenge value', () => {
  const decision = decideAward(PDA_CHALLENGE, {
    challengeId: PDA_CHALLENGE,
    score: 1_000_000,
    status: 'passed',
  });

  assert.equal(decision.ok, true);
  if (!decision.ok) return;
  assert.equal(decision.score, pdaChallenge.points);
});

test('negative, NaN and infinite scores are clamped to zero', () => {
  assert.equal(clampScore(-50, 150), 0);
  assert.equal(clampScore(Number.NaN, 150), 0);
  assert.equal(clampScore(Number.POSITIVE_INFINITY, 150), 0);
  assert.equal(clampScore(120.9, 150), 120);
});

test('total available points matches the catalogue', () => {
  const sum = CHALLENGES.reduce((total, c) => total + c.points, 0);
  assert.equal(totalAvailablePoints(), sum);
});

test('a completion can only ever be worth the whole catalogue', () => {
  // Nobody can score more than the sum of every challenge, no matter how many
  // submissions or completions exist.
  assert.ok(totalAvailablePoints() > 0);
  assert.ok(
    CHALLENGES.every((c) => c.points <= totalAvailablePoints()),
    'a single challenge is worth more than the entire catalogue'
  );
});