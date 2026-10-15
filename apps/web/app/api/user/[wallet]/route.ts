import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CHALLENGES } from '@challenges/data';

export async function GET(
  req: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const { wallet } = params;

    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      include: {
        completions: {
          include: { challenge: true },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    const completedIds = new Set(user?.completions.map((c) => c.challengeId) || []);

    const categoryStats = {
      foundations: {
        total: CHALLENGES.filter((c) => c.category === 'foundations').length,
        completed: CHALLENGES.filter((c) => c.category === 'foundations' && completedIds.has(c.id)).length,
      },
      programs: {
        total: CHALLENGES.filter((c) => c.category === 'programs').length,
        completed: CHALLENGES.filter((c) => c.category === 'programs' && completedIds.has(c.id)).length,
      },
      tokens: {
        total: CHALLENGES.filter((c) => c.category === 'tokens').length,
        completed: CHALLENGES.filter((c) => c.category === 'tokens' && completedIds.has(c.id)).length,
      },
      advanced: {
        total: CHALLENGES.filter((c) => c.category === 'advanced').length,
        completed: CHALLENGES.filter((c) => c.category === 'advanced' && completedIds.has(c.id)).length,
      },
    };

    return NextResponse.json({
      walletAddress: wallet,
      username: user?.username || `Builder_${wallet.slice(0, 4)}`,
      completedCount: user?.completedCount || 0,
      totalScore: user?.totalScore || 0,
      completions: user?.completions || [],
      categoryProgress: categoryStats,
    });
  } catch (error) {
    console.error('Error in user profile route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
