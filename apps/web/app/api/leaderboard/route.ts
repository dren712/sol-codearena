import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          select: { id: true, challengeId: true, txSignature: true },
        },
      },
    });

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      walletAddress: u.walletAddress,
      username: u.username || `Builder_${u.walletAddress.slice(0, 4)}`,
      completedCount: u.completedCount,
      score: u.totalScore,
      lastActive: u.createdAt.toISOString(),
      onchainVerified: u.completions.some((c) => !!c.txSignature),
      completionsCount: u.completions.length,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json([], { status: 500 });
  }
}
