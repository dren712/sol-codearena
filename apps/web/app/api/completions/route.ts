import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        completions: {
          include: { challenge: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        walletAddress,
        completedCount: 0,
        totalScore: 0,
        completedChallenges: [],
        completions: [],
      });
    }

    return NextResponse.json({
      walletAddress: user.walletAddress,
      username: user.username,
      completedCount: user.completedCount,
      totalScore: user.totalScore,
      completedChallenges: user.completions.map((c) => c.challengeId),
      completions: user.completions,
    });
  } catch (error) {
    console.error('Error fetching completions:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, challengeId, txSignature, score } = await req.json();

    if (!walletAddress || !challengeId) {
      return NextResponse.json(
        { error: 'Missing walletAddress or challengeId' },
        { status: 400 }
      );
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: {
        walletAddress,
        username: `Builder_${walletAddress.slice(0, 4)}`,
      },
    });

    // Check if completion already exists
    const existing = await prisma.completion.findUnique({
      where: {
        userId_challengeId: {
          userId: user.id,
          challengeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Challenge already recorded on-chain',
        completion: existing,
        user,
      });
    }

    // Record new completion
    const pointsToAdd = typeof score === 'number' ? score : 100;
    const completion = await prisma.completion.create({
      data: {
        userId: user.id,
        challengeId,
        txSignature: txSignature || null,
        verified: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        completedCount: { increment: 1 },
        totalScore: { increment: pointsToAdd },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Challenge completion recorded on-chain',
      completion,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error recording completion:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
