import { NextRequest, NextResponse } from 'next/server';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { getConnection } from '@/lib/solana';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/** Devnet faucets are rate limited upstream, so protect ours first. */
const AIRDROP_LIMIT = 3;
const AIRDROP_WINDOW_MS = 60_000;

/** Per-wallet cooldown: one SOL per wallet per five minutes. */
const WALLET_COOLDOWN_MS = 5 * 60_000;

const lastAirdropByWallet = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const limiter = rateLimit(clientKey(req.headers, 'airdrop', walletAddress), AIRDROP_LIMIT, AIRDROP_WINDOW_MS);
    if (!limiter.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many airdrop requests. Try again in ${limiter.retryAfterSeconds}s, or use the public faucet.`,
          faucetUrl: 'https://faucet.solana.com',
        },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      );
    }

    const key = pubkey.toBase58();
    const lastAirdrop = lastAirdropByWallet.get(key);
    const now = Date.now();

    if (lastAirdrop && now - lastAirdrop < WALLET_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((WALLET_COOLDOWN_MS - (now - lastAirdrop)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `This wallet already received an airdrop. Try again in ${waitSeconds}s, or use the public faucet.`,
          faucetUrl: 'https://faucet.solana.com',
        },
        { status: 429, headers: { 'Retry-After': String(waitSeconds) } }
      );
    }

    try {
      const connection = getConnection();
      const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });

      lastAirdropByWallet.set(key, now);

      return NextResponse.json({
        success: true,
        signature,
        message: 'Airdrop of 1 SOL confirmed on Devnet!',
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      });
    } catch (airdropErr: any) {
      console.warn('Devnet faucet airdrop error (likely rate limit):', airdropErr.message);
      return NextResponse.json({
        success: false,
        error: 'Devnet faucet is currently rate-limited. You can get Devnet SOL at faucet.solana.com',
        faucetUrl: 'https://faucet.solana.com',
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}