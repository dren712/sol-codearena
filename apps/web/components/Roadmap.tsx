'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Lock, Sparkles, Terminal, Cpu, Coins, Layers } from 'lucide-react';
import { CHALLENGES } from '@challenges/data';

interface RoadmapProps {
  completedIds: string[];
}

const CATEGORY_META: Record<string, { title: string; desc: string; icon: any; color: string }> = {
  foundations: {
    title: 'Level 1 — Foundations',
    desc: 'Cryptographic primitives, transaction lifecycle, account layout.',
    icon: Terminal,
    color: 'solana-purple',
  },
  programs: {
    title: 'Level 2 — Programs & PDAs',
    desc: 'Deterministic PDAs, instruction data, Anchor discriminators.',
    icon: Cpu,
    color: 'solana-teal',
  },
  tokens: {
    title: 'Level 3 — Tokens',
    desc: 'Token decimals and Associated Token Accounts.',
    icon: Coins,
    color: 'solana-green',
  },
  advanced: {
    title: 'Level 4 — Advanced',
    desc: 'Cross-program invocation and deployment checks.',
    icon: Layers,
    color: 'amber-400',
  },
};

/**
 * Visual skill roadmap.
 *
 * Replaces the flat challenge grid with a guided path: categories stack
 * vertically, each challenge is a node on a timeline, and the next uncompleted
 * challenge is highlighted as "you are here". Nothing is hard-locked — students
 * can still jump around — but the path makes the curriculum legible at a glance.
 */
export default function Roadmap({ completedIds }: RoadmapProps) {
  const completed = new Set(completedIds);

  // The "next up" challenge is the first incomplete one in catalogue order.
  const nextUp = CHALLENGES.find((c) => !completed.has(c.id));

  const categories = ['foundations', 'programs', 'tokens', 'advanced'];

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div
        className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-solana-purple via-solana-teal to-solana-green opacity-40"
        aria-hidden="true"
      />

      <div className="space-y-8">
        {categories.map((cat) => {
          const items = CHALLENGES.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const doneInCat = items.filter((c) => completed.has(c.id)).length;

          return (
            <section key={cat} className="relative pl-10">
              {/* Category marker on the spine */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface-200 border-2 border-surface-border flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-slate-300" />
              </div>

              <header className="mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-mono font-bold text-white">{meta.title}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 border border-surface-border text-slate-400">
                    {doneInCat}/{items.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</p>
              </header>

              <div className="space-y-2">
                {items.map((challenge) => {
                  const isDone = completed.has(challenge.id);
                  const isNext = nextUp?.id === challenge.id;
                  const isLocked = !isDone && !isNext && nextUp !== undefined && CHALLENGES.indexOf(challenge) > CHALLENGES.indexOf(nextUp);

                  return (
                    <Link
                      key={challenge.id}
                      href={`/challenge/${challenge.slug}`}
                      className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-900/60 hover:border-emerald-700'
                          : isNext
                          ? 'bg-solana-purple/10 border-solana-purple/60 hover:border-solana-purple shadow-[0_0_0_1px_rgba(153,69,255,0.25)]'
                          : 'bg-surface-100 border-surface-border hover:border-slate-500'
                      }`}
                    >
                      {/* Node dot */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : isNext
                            ? 'bg-solana-purple/20 border-solana-purple text-solana-purple animate-pulse'
                            : 'bg-surface-200 border-surface-border text-slate-600'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-white truncate">
                            {challenge.id} · {challenge.title}
                          </span>
                          {isNext && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-solana-purple text-white font-bold">
                              YOU ARE HERE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            {challenge.difficulty} · {challenge.points} pts · ~{challenge.estimatedMinutes} min
                          </span>
                        </div>
                      </div>

                      {isDone && (
                        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}