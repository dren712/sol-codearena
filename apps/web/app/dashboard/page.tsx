'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Terminal,
  Cpu,
  Coins,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { CHALLENGES } from '@challenges/data';
import { getUserPda, getCompletionPda, getExplorerTxUrl, getExplorerAddressUrl } from '@packages/sdk';

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  const [userData, setUserData] = useState<{
    completedCount: number;
    totalScore: number;
    completions: any[];
    categoryProgress: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fallback demo wallet address if not connected, to demonstrate the dashboard
  const displayWallet = publicKey?.toBase58() || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const isDemo = !connected;

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${displayWallet}`);
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching dashboard user data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [displayWallet]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = userData?.completedCount || 0;
  const totalScore = userData?.totalScore || 0;
  const progressPercent = Math.round((completedCount / 10) * 100);

  const categories = [
    {
      key: 'foundations',
      label: 'Foundations',
      total: 3,
      completed: userData?.categoryProgress?.foundations?.completed || 0,
      icon: Terminal,
      color: 'bg-solana-teal',
    },
    {
      key: 'programs',
      label: 'Programs & PDAs',
      total: 3,
      completed: userData?.categoryProgress?.programs?.completed || 0,
      icon: Cpu,
      color: 'bg-solana-purple',
    },
    {
      key: 'tokens',
      label: 'Tokens',
      total: 2,
      completed: userData?.categoryProgress?.tokens?.completed || 0,
      icon: Coins,
      color: 'bg-solana-green',
    },
    {
      key: 'advanced',
      label: 'Advanced',
      total: 2,
      completed: userData?.categoryProgress?.advanced?.completed || 0,
      icon: Layers,
      color: 'bg-amber-400',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
      {/* Demo notice if disconnected */}
      {isDemo && (
        <div className="mb-6 p-4 rounded-lg bg-surface-100 border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-solana-purple animate-ping" />
            <div className="text-xs">
              <span className="font-semibold text-white">Previewing Demo Builder Profile.</span>{' '}
              <span className="text-slate-400">Connect your Solana wallet to track your personal on-chain completions.</span>
            </div>
          </div>
          <WalletMultiButton className="!h-8 !text-xs !bg-solana-purple !border-0 !rounded !px-4" />
        </div>
      )}

      {/* Profile Header */}
      <div className="p-6 rounded-lg bg-surface-100 border border-surface-border mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-mono text-solana-purple font-semibold uppercase tracking-wider mb-1">
            Builder Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>Solana Code Arena Progress</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-200 border border-surface-border text-solana-green">
              Level {Math.max(1, Math.floor(completedCount / 3) + 1)}
            </span>
          </h1>

          <div className="flex items-center gap-2 mt-2 font-mono text-xs text-slate-400">
            <span>Wallet:</span>
            <span className="text-slate-200 font-semibold">{displayWallet}</span>
            <button
              onClick={() => copyToClipboard(displayWallet)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy wallet address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-solana-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={getExplorerAddressUrl(displayWallet)}
              target="_blank"
              rel="noreferrer"
              className="text-solana-teal hover:underline flex items-center gap-0.5 ml-1"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 bg-surface-200/80 border border-surface-border p-4 rounded-lg font-mono text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Challenges</div>
            <div className="text-xl font-bold text-white">
              {completedCount} <span className="text-slate-500 text-xs font-normal">/ 10</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-surface-border" />
          <div>
            <div className="text-slate-400 text-[11px]">Verified Score</div>
            <div className="text-xl font-bold text-solana-green">{totalScore} pts</div>
          </div>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall Progress Bar */}
        <div className="md:col-span-1 p-5 rounded-lg bg-surface-100 border border-surface-border flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Curriculum Completion
            </div>
            <div className="text-3xl font-extrabold text-white mb-1 font-mono">
              {progressPercent}%
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {completedCount} of 10 challenges completed and verified on-chain.
            </p>
          </div>

          <div>
            <div className="w-full h-3 rounded-full bg-surface-200 overflow-hidden mb-2 border border-surface-border">
              <div
                className="h-full bg-gradient-to-r from-solana-purple to-solana-green rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Foundations</span>
              <span>Advanced CPI</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="md:col-span-2 p-5 rounded-lg bg-surface-100 border border-surface-border">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">
            Track Progress Breakdown
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const catPercent = Math.round((cat.completed / cat.total) * 100);
              return (
                <div key={cat.key} className="p-3.5 rounded bg-surface-200 border border-surface-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-solana-purple" />
                      <span className="text-xs font-semibold text-white">{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-300">
                      {cat.completed} / {cat.total}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-300 overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* On-Chain Activity & Verifications */}
      <div className="p-6 rounded-lg bg-surface-100 border border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-solana-green" />
              <span>Verified On-Chain Achievements</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every challenge completed creates an immutable Completion PDA on Solana Devnet.
            </p>
          </div>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1 text-xs font-mono text-solana-purple hover:underline"
          >
            <span>Solve more challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Completions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Challenge</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Devnet Tx Signature</th>
                <th className="py-2.5 px-3 text-right">Solana Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {CHALLENGES.map((ch) => {
                const completion = userData?.completions?.find(
                  (c: any) => c.challengeId === ch.id
                );
                const isComp = !!completion;

                return (
                  <tr key={ch.id} className="hover:bg-surface-200/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      <Link
                        href={`/challenge/${ch.slug}`}
                        className="hover:text-solana-green transition-colors"
                      >
                        #{String(ch.order).padStart(2, '0')} {ch.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-400">{ch.category}</td>
                    <td className="py-3 px-3">
                      {isComp ? (
                        <span className="inline-flex items-center gap-1 text-solana-green text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Unsolved</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {completion?.txSignature ? (
                        <span className="text-solana-purple">
                          {completion.txSignature.slice(0, 12)}...{completion.txSignature.slice(-6)}
                        </span>
                      ) : isComp ? (
                        <span className="text-slate-500">Recorded</span>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {completion?.txSignature ? (
                        <a
                          href={getExplorerTxUrl(completion.txSignature)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-solana-teal hover:underline"
                        >
                          <span>View Tx</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={`/challenge/${ch.slug}`}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Start →
                        </Link>
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
