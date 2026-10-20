import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { CHALLENGES } from '@challenges/data';
import { totalAvailablePoints } from '@/lib/progress';

// A pure-GET handler would otherwise be prerendered at build time and serve a
// frozen leaderboard forever.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { totalScore: 'desc' },
        { completedCount: 'desc' },
      ],
      take: 50,
      include: {
        completions: {
          select: { id: true, challengeId: true, txSignature: true, verified: true },
        },
      },
    });

    const maxScore = totalAvailablePoints();

    const leaderboard = users.map((u, index) => {
      // "Verified" means an account that was actually checked against the
      // cluster — a stored signature string alone proves nothing.
      const verifiedCompletions = u.completions.filter((c) => c.verified).length;

      return {
        rank: index + 1,
        id: u.id,
        walletAddress: u.walletAddress,
        username: u.username || `Builder_${u.walletAddress.slice(0, 4)}`,
        completedCount: u.completedCount,
        score: u.totalScore,
        lastActive: u.updatedAt.toISOString(),
        onchainVerified: verifiedCompletions > 0,
        verifiedCompletions,
        completionsCount: u.completions.length,
        progressPercent: maxScore > 0 ? Math.round((u.totalScore / maxScore) * 100) : 0,
      };
    });

    return NextResponse.json({
      leaderboard,
      totalChallenges: CHALLENGES.length,
      maxScore,
    });
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json({ leaderboard: [], totalChallenges: 0, maxScore: 0 }, { status: 500 });
  }
}