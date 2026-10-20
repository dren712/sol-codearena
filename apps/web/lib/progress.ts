import { CHALLENGES } from './challenges';
import type { Challenge } from './types';

/**
 * Server-authoritative rules for awarding progress.
 *
 * Everything in this module is pure so it can be unit tested without a
 * database or RPC. The guiding rule: **a client may propose a completion, but
 * the server decides what it is worth.** Scores are only ever derived from a
 * submission that actually passed the validator.
 */

/** Minimal shape of a stored submission needed to award progress. */
export type PassedSubmission = {
  challengeId: string;
  score: number;
  status: string;
  createdAt?: Date;
};

/**
 * Outcome of a completion request.
 *
 * Shaped as a single object rather than a discriminated union because the
 * project runs with `strict: false`, where TypeScript does not narrow unions on
 * a boolean discriminant — every caller would lose its error type.
 */
export type AwardDecision = {
  ok: boolean;
  challenge: Challenge | null;
  /** Server-derived score. Never taken from the request body. */
  score: number;
  /** HTTP status to return when `ok` is false. */
  status: number;
  /** Student-facing explanation when `ok` is false. */
  error: string | null;
};

const REJECTED = (status: number, error: string): AwardDecision => ({
  ok: false,
  challenge: null,
  score: 0,
  status,
  error,
});

/**
 * Decides whether a completion may be recorded, and for how many points.
 *
 * @param challengeId    Challenge id claimed by the client
 * @param latestPassed   Most recent *passed* submission for (wallet, challengeId)
 */
export function decideAward(
  challengeId: unknown,
  latestPassed: PassedSubmission | null | undefined
): AwardDecision {
  if (typeof challengeId !== 'string' || challengeId.length === 0) {
    return REJECTED(400, 'Missing challengeId');
  }

  const challenge = CHALLENGES.find((c) => c.id === challengeId || c.slug === challengeId);

  if (!challenge) {
    return REJECTED(404, `Unknown challenge '${challengeId}'`);
  }

  if (!latestPassed || latestPassed.status !== 'passed') {
    return REJECTED(
      403,
      'Pass the challenge test suite before recording a completion. Run the tests first.'
    );
  }

  return {
    ok: true,
    challenge,
    score: clampScore(latestPassed.score, challenge.points),
    status: 200,
    error: null,
  };
}

/** A stored score can never exceed the challenge's own point value. */
export function clampScore(score: number, maxPoints: number): number {
  if (!Number.isFinite(score) || score < 0) return 0;
  return Math.min(Math.floor(score), maxPoints);
}

/** Total points on offer across the whole curriculum. */
export function totalAvailablePoints(): number {
  return CHALLENGES.reduce((total, c) => total + c.points, 0);
}

/**
 * When true, only on-chain verified completions may be recorded.
 *
 * Off by default so a classroom demo still works before the program is deployed
 * to Devnet. Set `REQUIRE_ONCHAIN_VERIFICATION=true` for a real deployment.
 */
export function requiresOnChainVerification(): boolean {
  return (
    process.env.REQUIRE_ONCHAIN_VERIFICATION?.toLowerCase() === 'true'
  );
}