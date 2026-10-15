import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const pubkey = new PublicKey(walletAddress);
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    try {
      const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });

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
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
