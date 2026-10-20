import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

import { getConnection } from '@/lib/solana';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/**
 * Read-only account inspection for the embedded explorer.
 *
 * Students paste a pubkey and learn its anatomy: lamports, owner program,
 * data size, executable flag. Everything comes from the cluster — the server
 * never fabricates fields, and an unknown account is reported as unknown
 * rather than guessed at.
 */
const ACCOUNT_LIMIT = 30;
const ACCOUNT_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address');
    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address.trim());
    } catch {
      return NextResponse.json({ error: 'Invalid base58 public key' }, { status: 400 });
    }

    const limiter = rateLimit(clientKey(req.headers, 'account', pubkey.toBase58()), ACCOUNT_LIMIT, ACCOUNT_WINDOW_MS);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Retry in ${limiter.retryAfterSeconds}s.` },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      );
    }

    const connection = getConnection();
    const info = await connection.getAccountInfo(pubkey);

    if (!info) {
      return NextResponse.json({
        address: pubkey.toBase58(),
        exists: false,
        /** A pubkey can be checked for the curve client-side; report the flag we can compute. */
        serializedLength: 0,
      });
    }

    return NextResponse.json({
      address: pubkey.toBase58(),
      exists: true,
      lamports: info.lamports,
      owner: info.owner.toBase58(),
      space: info.data.length,
      executable: info.executable,
    });
  } catch (error) {
    console.error('Error in account explorer route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
