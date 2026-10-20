import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

import { prisma } from '@/lib/prisma';
import { decideAward, requiresOnChainVerification } from '@/lib/progress';
import { verifyCompletionOnChain } from '@/lib/solana';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/** Generous enough for a classroom, tight enough to stop scripted abuse. */
const AWARD_LIMIT = 20;
const AWARD_WINDOW_MS = 60_000;

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
    const { walletAddress, challengeId, txSignature } = await req.json();

    if (!walletAddress || !challengeId) {
      return NextResponse.json(
        { error: 'Missing walletAddress or challengeId' },
        { status: 400 }
      );
    }

    if (typeof walletAddress !== 'string' || !isValidWallet(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const limiter = rateLimit(
      clientKey(req.headers, 'completions', walletAddress),
      AWARD_LIMIT,
      AWARD_WINDOW_MS
    );
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many completion attempts. Please wait a moment and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfterSeconds) },
        }
      );
    }

    // The score is *never* taken from the request body. A client may propose a
    // completion, but the server awards points only from a submission that
    // actually passed the validator.
    //
    // Read first, decide second: an incomplete or rejected request must never
    // create a User row (a scripted spammer could otherwise mint users).
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        submissions: {
          where: { challengeId, status: 'passed' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const award = decideAward(challengeId, existingUser?.submissions[0] ?? null);
    if (!award.ok) {
      return NextResponse.json({ error: award.error }, { status: award.status });
    }

    // The request is now proven legitimate, so the user can safely exist.
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { updatedAt: new Date() },
      create: {
        walletAddress,
        username: `Builder_${walletAddress.slice(0, 4)}`,
      },
    });

    // Already recorded — return what we stored the first time.
    const existing = await prisma.completion.findUnique({
      where: {
        userId_challengeId: { userId: user.id, challengeId },
      },
    });

    if (existing) {
      // An unverified local record can be *upgraded*: once the student actually
      // signs and the transient lands on-chain, verify the new signature and
      // flip the stored row (and aggregate counters) honestly.
      let upgradeSignature: string | null = null;
      if (typeof txSignature === 'string' && !existing.verified) {
        upgradeSignature = txSignature;
      }

      if (upgradeSignature) {
        const upgradeProof = await verifyCompletionOnChain(
          walletAddress,
          award.challenge.id,
          upgradeSignature
        );
        if (upgradeProof.verified) {
          const upgraded = await prisma.completion.update({
            where: { id: existing.id },
            data: {
              verified: true,
              txSignature: upgradeProof.signatureConfirmed
                ? String(upgradeSignature).trim()
                : existing.txSignature,
            },
          });
          const upgradedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              completedCount: { increment: 1 },
              totalScore: { increment: award.score },
              updatedAt: new Date(),
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Completion upgraded: now verified on-chain',
            scoreAwarded: award.score,
            verification: upgradeProof,
            completion: upgraded,
            user: upgradedUser,
          });
        }
        // Verification failed — fall through and report the stored verdict so
        // the UI stays truthful about the local-only state.
      }

      // Replay: report the stored verdict so the UI shows the same state it
      // would show on a fresh page load.
      return NextResponse.json({
        success: true,
        message: 'Challenge already recorded',
        scoreAwarded: 0,
        verification: {
          verified: existing.verified,
          signatureConfirmed: !!existing.txSignature,
          reason: existing.verified
            ? 'Verified on-chain.'
            : 'Recorded locally — not verified against the cluster.',
        },
        completion: existing,
        user,
      });
    }

    const proof = await verifyCompletionOnChain(
      walletAddress,
      award.challenge.id,
      txSignature
    );

    if (requiresOnChainVerification() && !proof.verified) {
      return NextResponse.json(
        {
          error:
            'On-chain verification is required but did not succeed. ' +
            (proof.reason || 'Unknown reason.'),
          verification: proof,
        },
        { status: 409 }
      );
    }

    const completion = await prisma.completion.create({
      data: {
        userId: user.id,
        challengeId,
        // Only a signature that actually landed on-chain is stored.
        txSignature: proof.signatureConfirmed ? String(txSignature).trim() : null,
        verified: proof.verified,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        completedCount: { increment: 1 },
        totalScore: { increment: award.score },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: proof.verified
        ? 'Completion recorded and verified on-chain'
        : 'Completion recorded (not verified on-chain)',
      scoreAwarded: award.score,
      verification: proof,
      completion,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error recording completion:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

function isValidWallet(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}