import { NextRequest, NextResponse } from 'next/server';

import { ChallengeValidator, ValidatorError } from '@packages/validator';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/**
 * Validation is CPU-bound: every request compiles and runs student code. Keep
 * the budget tight enough that one student hammering "Run tests" cannot stall
 * the room, but loose enough for an honest retry loop.
 */
const VALIDATE_LIMIT = 40;
const VALIDATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const { challengeSlug, userCode, walletAddress } = await req.json();

    if (!challengeSlug || typeof userCode !== 'string') {
      return NextResponse.json(
        { error: 'Missing challengeSlug or userCode' },
        { status: 400 }
      );
    }

    const limiter = rateLimit(clientKey(req.headers, 'validate', walletAddress ?? 'anonymous'), VALIDATE_LIMIT, VALIDATE_WINDOW_MS);
    if (!limiter.allowed) {
      return NextResponse.json(
        {
          success: false,
          score: 0,
          message: 'Rate limit reached. Wait a moment before running tests again.',
          output: '',
          testResults: [],
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfterSeconds) },
        }
      );
    }

    const validationResult = await ChallengeValidator.validate(
      challengeSlug,
      userCode,
      walletAddress
    );

    // Record the attempt so progress can be awarded from server-side evidence
    // rather than anything the browser claims.
    if (walletAddress) {
      try {
        const user = await prisma.user.upsert({
          where: { walletAddress },
          update: { updatedAt: new Date() },
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
        // A database hiccup must never lose the student's test results.
        console.warn('Could not record submission to DB:', dbErr);
      }
    }

    return NextResponse.json(validationResult);
  } catch (error: any) {
    // ValidatorError carries a student-facing message (bad input, timeout, ...).
    if (error instanceof ValidatorError) {
      return NextResponse.json(
        {
          success: false,
          score: 0,
          message: 'Submission rejected',
          output: error.message,
          testResults: [],
        },
        { status: error.status }
      );
    }

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