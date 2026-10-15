import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CHALLENGES } from '@challenges/data';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const challenge = CHALLENGES.find((c) => c.slug === slug);

    if (challenge) {
      return NextResponse.json(challenge);
    }

    const dbChallenge = await prisma.challenge.findUnique({
      where: { slug },
    });

    if (dbChallenge) {
      return NextResponse.json(dbChallenge);
    }

    return NextResponse.json(
      { error: `Challenge '${slug}' not found` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching challenge by slug:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
