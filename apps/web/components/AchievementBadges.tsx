'use client';

import React from 'react';
import { Footprints, Link2, Flame, Trophy, Star, Zap, Crown, Lock } from 'lucide-react';
import type { Badge } from '../lib/badges';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'first-steps': Footprints,
  'on-chain': Link2,
  'streak-3': Flame,
  'category-master': Trophy,
  'high-scorer': Star,
  recent: Zap,
  champion: Crown,
};

interface AchievementBadgesProps {
  badges: Badge[];
  earnedCount: number;
}

/**
 * Badge shelf for the dashboard.
 *
 * Earned badges are colored and labeled; unearned ones stay dim with their
 * progress hint so the shelf doubles as a to-do list rather than a wall of
 * locks.
 */
export default function AchievementBadges({ badges, earnedCount }: AchievementBadgesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-serif font-semibold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Your Badges
        </h3>
        <span className="text-[11px] font-mono text-slate-500">
          {earnedCount} / {badges.length} earned
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {badges.map((badge) => {
          const Icon = ICONS[badge.id] ?? Lock;
          const earned = badge.progress >= 1;

          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`p-3 rounded-lg border transition-all ${
                earned
                  ? 'bg-gradient-to-br from-solana-purple/15 to-emerald-500/10 border-amber-700/40'
                  : 'bg-surface-100 border-surface-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${earned ? 'text-amber-400' : 'text-slate-600'}`} />
                <span
                  className={`text-[11px] font-mono font-bold ${
                    earned ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">{badge.description}</p>
              {!earned && badge.progressHint && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-surface-200 overflow-hidden">
                    <div
                      className="h-full bg-solana-purple transition-all"
                      style={{ width: `${Math.round(badge.progress * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-600">{badge.progressHint}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
