'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Terminal,
  Code2,
  ExternalLink,
  Cpu,
  Coins,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const { connected } = useWallet();

  const tracks = [
    {
      level: 'Level 1',
      title: 'Foundations',
      desc: 'Master Ed25519 cryptography, keypairs, transaction assembly, and the fundamental account model.',
      challenges: ['01 Wallets & Keypairs', '02 Transactions', '03 Accounts & State'],
      icon: Terminal,
      color: 'text-solana-teal border-solana-teal/20 bg-solana-teal/5',
    },
    {
      level: 'Level 2',
      title: 'Programs & PDAs',
      desc: 'Learn Program Derived Addresses (PDAs), custom instruction serialization, and Anchor framework discriminators.',
      challenges: ['04 PDAs (Flagship)', '05 Custom Instructions', '06 Anchor Framework'],
      icon: Cpu,
      color: 'text-solana-purple border-solana-purple/20 bg-solana-purple/5',
      flagship: true,
    },
    {
      level: 'Level 3',
      title: 'Tokens & ATAs',
      desc: 'Interact with SPL Token mints, calculate precision decimals, and derive Associated Token Accounts.',
      challenges: ['07 SPL Tokens', '08 Associated Token Accounts'],
      icon: Coins,
      color: 'text-solana-green border-solana-green/20 bg-solana-green/5',
    },
    {
      level: 'Level 4',
      title: 'Advanced Architecture',
      desc: 'Execute Cross-Program Invocations (CPI) and inspect BPF Upgradeable program deployments on Devnet.',
      challenges: ['09 Cross-Program Invocation', '10 Deploy & Verify'],
      icon: Layers,
      color: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-surface-border">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161922_1px,transparent_1px),linear-gradient(to_bottom,#161922_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 border border-surface-border text-xs font-mono text-slate-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-solana-green animate-pulse" />
            <span>SOLANA SUMMER SCHOOL / FALL CLASS DEMO DAY</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 font-sans">
            Learn Solana by{' '}
            <span className="bg-gradient-to-r from-solana-purple via-[#bd7bff] to-solana-green bg-clip-text text-transparent">
              Building on Solana.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 leading-relaxed font-normal">
            Solve real, progressively harder coding challenges. Derive PDAs, construct transactions, and prove your mastery with immutable on-chain completion records on Solana Devnet.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/challenges"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-solana-purple hover:bg-[#8637e6] text-white font-medium text-sm transition-all shadow-lg shadow-solana-purple/20"
            >
              <Code2 className="w-4 h-4" />
              <span>Start Learning (10 Challenges)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            {!connected ? (
              <div className="w-full sm:w-auto flex justify-center">
                <WalletMultiButton className="!h-11 !text-sm !bg-surface-100 !border !border-surface-border hover:!border-solana-green !rounded-md !px-5" />
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-surface-100 hover:bg-surface-50 border border-surface-border text-white font-medium text-sm transition-all"
              >
                <span>View Progress Dashboard</span>
              </Link>
            )}
          </div>

          {/* Core Loop Visual */}
          <div className="mt-14 max-w-3xl mx-auto p-4 rounded-lg bg-surface-200/80 border border-surface-border">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-3 text-left flex items-center justify-between">
              <span>The Verification Loop</span>
              <span className="text-solana-green font-semibold">Zero-Trust On-Chain Proofs</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
              {[
                { step: '01', label: 'Learn', sub: 'Interactive Docs' },
                { step: '02', label: 'Build', sub: 'Monaco IDE' },
                { step: '03', label: 'Submit', sub: 'Validator Sandbox' },
                { step: '04', label: 'Verify', sub: 'Test Suite' },
                { step: '05', label: 'Record', sub: 'Anchor Program' },
                { step: '06', label: 'Progress', sub: 'Completion PDA' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center p-2 rounded bg-surface-100/60 border border-surface-border/60 hover:border-solana-purple/50 transition-colors"
                >
                  <span className="text-[10px] text-slate-500">{item.step}</span>
                  <span className="font-semibold text-slate-200 mt-0.5">{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-mono text-solana-purple uppercase tracking-wider font-semibold">
              Structured Curriculum
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              From &quot;What is a PDA?&quot; to On-Chain Mastery
            </h2>
          </div>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1 text-xs font-mono text-solana-green hover:underline"
          >
            <span>Explore all 10 challenges</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.title}
                className="relative p-6 rounded-lg bg-surface-100/50 border border-surface-border hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      {track.level}
                    </span>
                    {track.flagship && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-solana-purple/20 text-solana-purple border border-solana-purple/40">
                        Demo Day Flagship
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded border ${track.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{track.desc}</p>
                </div>

                <div className="border-t border-surface-border/60 pt-3 mt-2">
                  <div className="text-[11px] font-mono text-slate-500 mb-2">Included Challenges:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {track.challenges.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-surface-200 border border-surface-border text-slate-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Flagship Demo Callout */}
      <section className="py-12 bg-surface-200/40 border-y border-surface-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-lg bg-surface-100 border border-surface-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-solana-purple/10 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-2xl">
              <span className="text-xs font-mono text-solana-green uppercase font-semibold">
                Demo Day Spotlight
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-3">
                Challenge 04: Program Derived Addresses (PDAs)
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Derive an off-curve PDA from seeds <code className="text-solana-teal">[&quot;user&quot;, wallet]</code>, execute client validation, sign with your wallet, and watch your Completion PDA record permanently on Solana Devnet.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/challenge/04-pdas"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-solana-green hover:bg-[#10d482] text-black font-semibold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Flagship Challenge</span>
                </Link>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>Solana Devnet Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
