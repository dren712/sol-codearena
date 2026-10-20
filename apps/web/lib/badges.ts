import { CHALLENGES } from './challenges';
import type { ChallengeCategory } from './types';

/**
 * Pure badge derivation.
 *
 * Badges are *derived* from completions the server already verified — nothing
 * here is stored, so no migration is needed and the data cannot drift. A
 * client may claim results, but this module only ever recomputes from the
 * server's own completion rows.
 */

/** Shape of a completion row as delivered by the API (after JSON). */
export type CompletionLite = {
  challengeId: string;
  verified: boolean;
  completedAt: string | Date;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  /** 0..1 progress toward earning; 1 means earned. */
  progress: number;
  /** Short "N / M" progress hint or null when not countable. */
  progressHint: string | null;
};

export type BadgeReport = {
  badges: Badge[];
  earnedCount: number;
  /** Longest run of consecutive calendar days with a completion. */
  bestStreakDays: number;
  /** Sum of points across completed challenges (from the catalogue). */
  derivedScore: number;
  /** Distinct challenges completed, verified on-chain. */
  verifiedCount: number;
};

const ALL_COUNT = CHALLENGES.length;

function ymd(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Longest run of consecutive calendar days in a list of timestamps. */
export function longestStreakDays(timestamps: (string | Date)[]): number {
  const days = Array.from(new Set(timestamps.map(ymd))).sort();
  if (days.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`);
    const current = new Date(`${days[i]}T00:00:00Z`);
    const diffDays = Math.round((current.getTime() - prev.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

function badge(
  id: string,
  label: string,
  description: string,
  earned: number,
  target: number
): Badge {
  const progress = target <= 0 ? (earned > 0 ? 1 : 0) : Math.min(1, earned / target);
  return {
    id,
    label,
    description,
    progress,
    progressHint: progress >= 1 ? null : `${Math.floor(earned)} / ${target}`,
  };
}

/**
 * Derives all badges from a wallet's completion rows.
 *
 * `now` is injectable so tests can pin dates instead of relying on the clock.
 */
export function deriveBadges(
  completions: CompletionLite[],
  now: Date = new Date()
): BadgeReport {
  const completed = new Set(completions.map((c) => c.challengeId));
  const verified = completions.filter((c) => c.verified);
  const derivedScore = CHALLENGES.filter((c) => completed.has(c.id)).reduce(
    (sum, c) => sum + c.points,
    0
  );
  const streak = longestStreakDays(completions.map((c) => c.completedAt));

  const categoriesFullyDone = (['foundations', 'programs', 'tokens', 'advanced'] as const)
    .every((category: ChallengeCategory) => {
      const inCat = CHALLENGES.filter((c) => c.category === category);
      return inCat.length > 0 && inCat.every((c) => completed.has(c.id));
    });

  const recentCount = completions.filter((c) => {
    const at = typeof c.completedAt === 'string' ? new Date(c.completedAt) : c.completedAt;
    return now.getTime() - at.getTime() <= 7 * 86_400_000;
  }).length;

  const badges: Badge[] = [
    badge(
      'first-steps',
      'First Steps',
      'Pass your first challenge test suite.',
      Math.min(1, completed.size),
      1
    ),
    badge(
      'on-chain',
      'On-Chain Verified',
      'Record 3 completions as verified Devnet transactions.',
      verified.length,
      3
    ),
    badge('streak-3', 'On a Roll', 'Complete challenges on 3 consecutive days.', streak, 3),
    badge(
      'category-master',
      'Category Master',
      'Finish every challenge within a category.',
      categoriesFullyDone ? 1 : 0,
      1
    ),
    badge(
      'high-scorer',
      'High Scorer',
      'Bank 500 points from completed challenges.',
      derivedScore,
      500
    ),
    badge(
      'recent',
      'Still Sharpening',
      'Complete at least one challenge this week.',
      Math.min(1, recentCount),
      1
    ),
    badge(
      'champion',
      'Arena Champion',
      'Complete every challenge in the arena.',
      completed.size,
      ALL_COUNT
    ),
  ];

  return {
    badges,
    earnedCount: badges.filter((b) => b.progress >= 1).length,
    bestStreakDays: streak,
    derivedScore,
    verifiedCount: verified.length,
  };
}
