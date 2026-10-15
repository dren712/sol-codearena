import { NextRequest, NextResponse } from 'next/server';
import { ChallengeValidator } from '@packages/validator';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { challengeSlug, userCode, walletAddress } = await req.json();

    if (!challengeSlug || typeof userCode !== 'string') {
      return NextResponse.json(
        { error: 'Missing challengeSlug or userCode' },
        { status: 400 }
      );
    }

    const validationResult = await ChallengeValidator.validate(
      challengeSlug,
      userCode,
      walletAddress
    );

    // Save submission to database if user is connected
    if (walletAddress) {
      try {
        const user = await prisma.user.upsert({
          where: { walletAddress },
          update: {},
          create: {
            walletAddress,
            username: `Builder_${walletAddress.slice(0, 4)}`,
          },
        });

        const challenge = await prisma.challenge.findUnique({
          where: { slug: challengeSlug },
        });

        if (challenge) {
          await prisma.submission.create({
            data: {
              userId: user.id,
              challengeId: challenge.id,
              code: userCode,
              status: validationResult.success ? 'passed' : 'failed',
              score: validationResult.score,
              executionOutput: validationResult.output,
            },
          });
        }
      } catch (dbErr) {
        console.warn('Could not record submission to DB:', dbErr);
      }
    }

    return NextResponse.json(validationResult);
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        score: 0,
        message: 'Internal validator error',
        output: error.message || 'Execution failed',
        testResults: [],
      },
      { status: 500 }
    );
  }
}
