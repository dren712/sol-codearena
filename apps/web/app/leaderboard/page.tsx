'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Trophy, ShieldCheck, ExternalLink, Flame, Users } from 'lucide-react';
import { getExplorerAddressUrl } from '@packages/sdk';

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [builders, setBuilders] = useState<any[]>([]);
  const [totals, setTotals] = useState({ totalChallenges: 0, maxScore: 0 });

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setBuilders(Array.isArray(data) ? data : data.leaderboard ?? []);
        setTotals({
          totalChallenges: data?.totalChallenges ?? 0,
          maxScore: data?.maxScore ?? 0,
        });
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      }
    }
    fetchLeaderboard();
  }, []);

  const connectedWallet = publicKey?.toBase58();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-solana-green font-semibold uppercase tracking-wider">
              Solana Developer Rankings
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Leaderboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Ranked by verified on-chain completions and challenge scores. Solved challenges are permanently recorded in Anchor Completion PDAs on Devnet.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 bg-surface-100 border border-surface-border px-4 py-2.5 rounded-lg font-mono text-xs text-slate-300">
          <Users className="w-4 h-4 text-solana-purple" />
          <span>Active Builders: {builders.length}</span>
          {totals.maxScore > 0 && (
            <>
              <span className="text-surface-border">|</span>
              <span>
                {totals.totalChallenges} challenges · {totals.maxScore} pts
              </span>
            </>
          )}
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="rounded-lg bg-surface-100 border border-surface-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-200/60 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-4 w-16 text-center">#</th>
                <th className="py-3 px-4">Builder</th>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4 text-center">Challenges</th>
                <th className="py-3 px-4 text-center">Verified Score</th>
                <th className="py-3 px-4 text-right">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {builders.map((b) => {
                const isMe = connectedWallet && b.walletAddress === connectedWallet;

                return (
                  <tr
                    key={b.id || b.walletAddress}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-solana-purple/10 border-l-2 border-l-solana-purple font-semibold'
                        : 'hover:bg-surface-200/50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      {b.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs">
                          1
                        </span>
                      ) : b.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold text-xs">
                          2
                        </span>
                      ) : b.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 font-bold text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500">{b.rank}</span>
                      )}
                    </td>

                    {/* Builder Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{b.username}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-solana-purple/30 text-solana-purple border border-solana-purple/40">
                            You
                          </span>
                        )}
                        {b.rank === 1 && (
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                    </td>

                    {/* Wallet Address */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <a
                        href={getExplorerAddressUrl(b.walletAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-solana-teal transition-colors flex items-center gap-1"
                      >
                        <span>
                          {b.walletAddress.slice(0, 6)}...{b.walletAddress.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 hover:text-solana-teal" />
                      </a>
                    </td>

                    {/* Challenges Solved */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-white font-semibold">{b.completedCount}</span>
                      <span className="text-slate-500 text-[11px]"> / 10</span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-solana-green font-bold">{b.score}</span>
                      <span className="text-slate-500 text-[11px]"> pts</span>
                    </td>

                    {/* On-chain Proof Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {b.onchainVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3 text-solana-green" />
                          <span>On-Chain</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
