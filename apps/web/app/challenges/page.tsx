'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  CheckCircle2,
  Circle,
  Search,
  Layers,
  Terminal,
  Cpu,
  Coins,
} from 'lucide-react';
import { CHALLENGES } from '@challenges/data';
import Roadmap from '../../components/Roadmap';

export default function ChallengesPage() {
  const { publicKey } = useWallet();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'roadmap' | 'grid'>('roadmap');
  const [loadingCompletions, setLoadingCompletions] = useState(false);

  useEffect(() => {
    async function fetchCompletions() {
      if (!publicKey) {
        setCompletedIds([]);
        return;
      }
      setLoadingCompletions(true);
      try {
        const res = await fetch(`/api/completions?walletAddress=${publicKey.toBase58()}`);
        const data = await res.json();
        if (data.completedChallenges) {
          setCompletedIds(data.completedChallenges);
        }
      } catch (err) {
        console.error('Failed to load user completions:', err);
      } finally {
        setLoadingCompletions(false);
      }
    }
    fetchCompletions();
  }, [publicKey]);

  const categories = [
    { id: 'all', label: 'All Challenges' },
    { id: 'foundations', label: 'Foundations (Level 1)' },
    { id: 'programs', label: 'Programs & PDAs (Level 2)' },
    { id: 'tokens', label: 'Tokens (Level 3)' },
    { id: 'advanced', label: 'Advanced (Level 4)' },
  ];

  const filteredChallenges = CHALLENGES.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryHeaders: Record<string, { title: string; desc: string; icon: any }> = {
    foundations: {
      title: 'Level 1 — Foundations',
      desc: 'Master the cryptographic primitives, transaction lifecycle, and account layout.',
      icon: Terminal,
    },
    programs: {
      title: 'Level 2 — Programs & PDAs',
      desc: 'Derive deterministic PDAs, build instruction data buffers, and implement Anchor discriminators.',
      icon: Cpu,
    },
    tokens: {
      title: 'Level 3 — Tokens',
      desc: 'Calculate token decimal bases and locate Associated Token Accounts (ATAs).',
      icon: Coins,
    },
    advanced: {
      title: 'Level 4 — Advanced Fundamentals',
      desc: 'Understand Cross-Program Invocations (CPI) and BPF Upgradeable program validation.',
      icon: Layers,
    },
  };

  const grouped = ['foundations', 'programs', 'tokens', 'advanced'].map((catKey) => ({
    key: catKey,
    ...categoryHeaders[catKey],
    items: filteredChallenges.filter((c) => c.category === catKey),
  }));

  const totalPoints = CHALLENGES.reduce((acc, c) => acc + c.points, 0);
  const earnedPoints = CHALLENGES.filter((c) => completedIds.includes(c.id)).reduce(
    (acc, c) => acc + c.points,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-solana-purple font-semibold uppercase tracking-wider">
              Solana Developer Curriculum
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Challenge Arena</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Complete coding exercises, run automated tests, and record verified achievements to your Completion PDA on Devnet.
          </p>
        </div>

        {/* Progress Card */}
        <div className="flex items-center gap-4 bg-surface-100 border border-surface-border p-3.5 rounded-lg font-mono text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Completed</div>
            <div className="text-base font-bold text-white">
              {completedIds.length} <span className="text-slate-500 font-normal">/ 10</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-surface-border" />
          <div>
            <div className="text-slate-400 text-[11px]">Score</div>
            <div className="text-base font-bold text-solana-green">
              {earnedPoints} <span className="text-slate-500 font-normal">/ {totalPoints} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-surface-50 text-white border border-surface-border'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-100/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 border border-surface-border rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solana-purple transition-colors font-mono"
          />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-surface-100 border border-surface-border w-fit">
        {(['roadmap', 'grid'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors ${
              viewMode === mode
                ? 'bg-solana-purple text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode === 'roadmap' ? '🗺️ Roadmap' : '📋 Grid'}
          </button>
        ))}
      </div>

      {viewMode === 'roadmap' ? (
        <Roadmap completedIds={completedIds} />
      ) : (
        <>
      {/* Challenge Groups */}
      <div className="space-y-10">
        {loadingCompletions && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <div className="w-3 h-3 rounded-full border-2 border-surface-border border-t-solana-purple animate-spin" />
            <span>Loading your progress…</span>
          </div>
        )}

        {grouped.map((group) => {
          if (group.items.length === 0) return null;
          const GroupIcon = group.icon;

          return (
            <div key={group.key} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-surface-border/50">
                <GroupIcon className="w-4 h-4 text-solana-purple" />
                <h2 className="text-sm font-semibold text-white tracking-wide">{group.title}</h2>
                <span className="text-xs text-slate-500 font-mono">
                  ({group.items.filter((i) => completedIds.includes(i.id)).length} / {group.items.length})
                </span>
              </div>

              {/* Challenge Items */}
              <div className="grid grid-cols-1 gap-2.5">
                {group.items.map((challenge) => {
                  const isCompleted = completedIds.includes(challenge.id);
                  const isFlagship = challenge.slug === '04-pdas';

                  return (
                    <Link
                      key={challenge.id}
                      href={`/challenge/${challenge.slug}`}
                      className={`group flex items-center justify-between p-4 rounded-lg bg-surface-100 border transition-all ${
                        isCompleted
                          ? 'border-solana-green/30 bg-solana-green/[0.02]'
                          : isFlagship
                          ? 'border-solana-purple/40 hover:border-solana-purple bg-surface-100/80'
                          : 'border-surface-border hover:border-slate-600'
                      }`}
                    >
                      {/* Left Details */}
                      <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-solana-green" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          )}
                        </div>

                        {/* Order & Title */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              #{String(challenge.order).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-semibold text-white group-hover:text-solana-green transition-colors">
                              {challenge.title}
                            </span>
                            {isFlagship && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-solana-purple/20 text-solana-purple border border-solana-purple/40">
                                Demo Day Flagship
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-2xl font-normal">
                            {challenge.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta Badges & CTA */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded capitalize ${
                            challenge.difficulty === 'beginner'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : challenge.difficulty === 'intermediate'
                              ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {challenge.difficulty}
                        </span>

                        <span className="text-xs font-mono font-medium text-slate-300">
                          {challenge.points} pts
                        </span>

                        <div className="flex items-center text-xs font-medium text-slate-400 group-hover:text-white transition-colors pl-2">
                          {isCompleted ? (
                            <span className="text-solana-green font-mono">Review →</span>
                          ) : (
                            <span className="font-mono">Start →</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}
