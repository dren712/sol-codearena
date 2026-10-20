'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Lightbulb, Lock, Sparkles } from 'lucide-react';

interface HintLadderProps {
  hints: string[];
  slug: string;
  /** Number of failed validation runs for this challenge. */
  failedRuns?: number;
  className?: string;
}

/**
 * Progressive hint ladder.
 *
 * Hints unlock one at a time so a student has to think before each reveal,
 * instead of reading the whole answer up front. Progress persists per
 * challenge in localStorage so a refresh does not reset it.
 */
export default function HintLadder({ hints, slug, failedRuns = 0, className = '' }: HintLadderProps) {
  const storageKey = `arena:hints:${slug}`;
  const [revealed, setRevealed] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const n = Number(stored);
        if (Number.isFinite(n) && n >= 0 && n <= hints.length) setRevealed(n);
      }
    } catch {
      // localStorage may be unavailable (private mode) — degrade gracefully.
    }
    setHydrated(true);
  }, [storageKey, hints.length]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, String(revealed));
    } catch {
      // ignore
    }
  }, [revealed, storageKey, hydrated]);

  const allRevealed = revealed >= hints.length;
  const revealNext = () => setRevealed((r) => Math.min(r + 1, hints.length));
  const reset = () => setRevealed(0);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Hints ({revealed}/{hints.length})
        </span>
        {revealed > 0 && (
          <button
            onClick={reset}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            reset
          </button>
        )}
      </div>

      {/* Stuck banner — only when there is more to reveal */}
      {failedRuns >= 2 && !allRevealed && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-950/40 border border-amber-900/60 text-[11px] text-amber-200/90 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
          <span>
            Two runs in a row failed. Stuck? Reveal the next hint — it narrows the
            problem without giving away the answer.
          </span>
        </div>
      )}

      <div className="space-y-2">
        {hints.map((hint, idx) => {
          const isRevealed = idx < revealed;
          return (
            <div
              key={idx}
              className={`rounded-md border p-3 transition-all ${
                isRevealed
                  ? 'bg-surface-100 border-surface-border'
                  : 'bg-surface-200/40 border-surface-border/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isRevealed
                      ? 'bg-amber-950 text-amber-400 border border-amber-900'
                      : 'bg-surface-200 text-slate-600 border border-surface-border'
                  }`}
                >
                  {isRevealed ? `Hint ${idx + 1}` : `Hint ${idx + 1} · locked`}
                </span>
                {!isRevealed && (
                  <Lock className="w-3 h-3 text-slate-600" aria-hidden="true" />
                )}
              </div>
              {isRevealed ? (
                <p className="text-xs text-slate-300 leading-relaxed">{hint}</p>
              ) : (
                <p className="text-xs text-slate-600 italic">Reveal to see this hint.</p>
              )}
            </div>
          );
        })}
      </div>

      {!allRevealed && (
        <button
          onClick={revealNext}
          className="w-full px-3 py-2 rounded-md bg-amber-950/60 hover:bg-amber-900/60 border border-amber-900/60 text-amber-300 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Reveal hint {revealed + 1} of {hints.length}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {allRevealed && hints.length > 0 && (
        <p className="text-[11px] font-mono text-slate-500 text-center">
          All hints revealed — try the solution, or ask the AI tutor to go deeper.
        </p>
      )}
    </div>
  );
}