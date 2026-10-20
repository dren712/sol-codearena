import test from 'node:test';
import assert from 'node:assert/strict';

import { CHALLENGES } from '@challenges/data';
import { deriveBadges, longestStreakDays, type CompletionLite } from '../lib/badges';

const ALL_CHALLENGE_COUNT = CHALLENGES.length;
const CHALLENGE_IDS = CHALLENGES.map((c) => c.id);

const fresh = (): CompletionLite => ({
  challengeId: CHALLENGES[0].id,
  verified: false,
  completedAt: '2026-10-19T10:00:00.000Z',
});

function completion(
  challengeId: string,
  overrides: Partial<CompletionLite> = {}
): CompletionLite {
  return { ...fresh(), challengeId, ...overrides };
}

test('a wallet with no completions earns nothing', () => {
  const report = deriveBadges([]);

  assert.equal(report.earnedCount, 0);
  assert.equal(report.derivedScore, 0);
  assert.equal(report.bestStreakDays, 0);
  for (const badge of report.badges) {
    assert.equal(badge.progress, 0);
  }
});

test('first completion earns first-steps only', () => {
  const report = deriveBadges([fresh()]);

  const firstSteps = report.badges.find((b) => b.id === 'first-steps')!;
  assert.equal(firstSteps.progress, 1);
  assert.equal(report.derivedScore > 0, true);
  assert.deepEqual(
    report.badges.filter((b) => b.progress >= 1).map((b) => b.id),
    ['first-steps', 'recent']
  );
});

test('on-chain badge needs verified completions, not just any completion', () => {
  const horizon = new Date('2026-10-19T10:00:00.000Z');
  const unverifiedReport = deriveBadges(
    [completion('01-crypto-basics'), completion('02-transactions')],
    horizon
  );
  assert.equal(
    unverifiedReport.badges.find((b) => b.id === 'on-chain')!.progress,
    0
  );

  const verifiedReport = deriveBadges(
    [
      completion('01-crypto-basics', { verified: true }),
      completion('02-transactions', { verified: true }),
      completion('03-accounts', { verified: true }),
    ],
    horizon
  );
  assert.equal(
    verifiedReport.badges.find((b) => b.id === 'on-chain')!.progress,
    1
  );
  assert.equal(verifiedReport.verifiedCount, 3);
});

test('streak counts distinct consecutive days once', () => {
  const days = [
    '2026-10-15T09:00:00Z',
    '2026-10-15T23:00:00Z',
    '2026-10-16T08:00:00Z',
    '2026-10-18T08:00:00Z',
  ];
  assert.equal(longestStreakDays(days), 2);
});

test('three consecutive calendar days earn the streak badge', () => {
  const completions = [
    '2026-10-17T09:00:00Z',
    '2026-10-18T09:00:00Z',
    '2026-10-19T09:00:00Z',
  ].map((at, i) => completion(`0${i + 1}-challenge`, { completedAt: at }));
  const report = deriveBadges(completions, new Date('2026-10-19T12:00:00Z'));

  const streakBadge = report.badges.find((b) => b.id === 'streak-3')!;
  assert.equal(streakBadge.progress, 1);
});

test("completed-at within a week earns the sharpening badge, older doesn't", () => {
  const recent = deriveBadges([fresh()], new Date('2026-10-19T10:00:00.000Z'));
  const stale = deriveBadges([fresh()], new Date('2026-12-01T10:00:00.000Z'));

  assert.equal(recent.badges.find((b) => b.id === 'recent')!.progress, 1);
  assert.equal(stale.badges.find((b) => b.id === 'recent')!.progress, 0);
});

test('arena champion needs the full catalogue', () => {
  const horizon = new Date('2026-10-19T10:00:00.000Z');
  const partial = deriveBadges(
    CHALLENGE_IDS.slice(0, ALL_CHALLENGE_COUNT - 1).map((id) => completion(id, { verified: true })),
    horizon
  );
  assert.equal(partial.badges.find((b) => b.id === 'champion')!.progress, 9 / ALL_CHALLENGE_COUNT);

  const full = deriveBadges(
    CHALLENGE_IDS.map((id) => completion(id, { verified: true })),
    horizon
  );
  assert.equal(full.badges.find((b) => b.id === 'champion')!.progress, 1);
  assert.equal(full.badges.find((b) => b.id === 'champion')!.progressHint, null);
});
