import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CHALLENGES } from '@challenges/data';

export async function GET() {
  try {
    const dbChallenges = await prisma.challenge.findMany({
      orderBy: { order: 'asc' },
    });

    if (dbChallenges && dbChallenges.length > 0) {
      return NextResponse.json(dbChallenges);
    }

    return NextResponse.json(CHALLENGES);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(CHALLENGES);
  }
}
