'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Copy, Check, Play, RotateCcw, Zap } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';

interface PdaVisualizerProps {
  initialSeeds?: string[];
  initialProgramId?: string;
  title?: string;
}

const DEFAULT_PROGRAM_ID = 'A4oqd9fv4zzrFastj5VSNoe4ZdjHq3FUisSo3Dn1u6LS';

type Phase = 'idle' | 'searching' | 'found' | 'error';

/**
 * Interactive PDA derivation visualizer.
 *
 * Lets a student type seeds and watch the off-curve search happen: each bump
 * is tried in turn, the candidate pubkey is shown, and the moment one lands
 * off the Ed25519 curve it becomes the PDA. This is the single most
 * demoable 15 seconds in the whole app — most students never *see* a PDA
 * being derived, they only sign a transaction that uses one.
 */
export default function PdaVisualizer({
  initialSeeds = ['user', 'wallet-pubkey'],
  initialProgramId = DEFAULT_PROGRAM_ID,
  title = 'PDA Derivation Visualizer',
}: PdaVisualizerProps) {
  const [seedsInput, setSeedsInput] = useState(initialSeeds.join(', '));
  const [programIdInput, setProgramIdInput] = useState(initialProgramId);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bump, setBump] = useState<number | null>(null);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [onCurve, setOnCurve] = useState<boolean | null>(null);
  const [pda, setPda] = useState<string | null>(null);
  const [finalBump, setFinalBump] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reset = useCallback(() => {
    cancelRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('idle');
    setBump(null);
    setCandidate(null);
    setOnCurve(null);
    setPda(null);
    setFinalBump(null);
    setAttempts(0);
    setError(null);
    setCopied(false);
  }, []);

  const derive = useCallback(() => {
    reset();
    cancelRef.current = false;

    const seeds = seedsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (seeds.length === 0) {
      setError('Enter at least one seed (comma-separated).');
      setPhase('error');
      return;
    }

    let programKey: PublicKey;
    try {
      programKey = new PublicKey(programIdInput.trim());
    } catch {
      setError('Program ID is not a valid base58 public key.');
      setPhase('error');
      return;
    }

    const seedBuffers = seeds.map((s) => Buffer.from(s));

    setPhase('searching');

    // Solana tries bump = 255, 254, ... until createProgramAddress succeeds
    // (i.e. the result lands off the Ed25519 curve).
    const bumpsToTry = Array.from({ length: 256 }, (_, i) => 255 - i);
    let i = 0;

    const step = () => {
      if (cancelRef.current) return;
      if (i >= bumpsToTry.length) {
        setError('No off-curve address found in 0..255 — extremely unlikely.');
        setPhase('error');
        return;
      }

      const currentBump = bumpsToTry[i];
      setBump(currentBump);
      setAttempts(i + 1);

      let candidateKey: PublicKey | null = null;
      let isOnCurve = false;
      try {
        candidateKey = PublicKey.createProgramAddressSync(
          [...seedBuffers, Buffer.from([currentBump])],
          programKey
        );
        isOnCurve = PublicKey.isOnCurve(candidateKey);
      } catch {
        // createProgramAddress throws when the result is on the curve.
        isOnCurve = true;
        candidateKey = null;
      }

      setOnCurve(isOnCurve);
      setCandidate(candidateKey ? candidateKey.toBase58() : null);

      if (!isOnCurve && candidateKey) {
        // Found it.
        setPda(candidateKey.toBase58());
        setFinalBump(currentBump);
        setPhase('found');
        return;
      }

      i += 1;
      if (reduceMotion) {
        // Skip the animation entirely.
        timerRef.current = setTimeout(step, 0);
      } else {
        timerRef.current = setTimeout(step, 35);
      }
    };

    timerRef.current = setTimeout(step, reduceMotion ? 0 : 200);
  }, [seedsInput, programIdInput, reset, reduceMotion]);

  const copy = async () => {
    if (!pda) return;
    try {
      await navigator.clipboard.writeText(pda);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-surface-border bg-surface-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-solana-teal" />
          <span>{title}</span>
        </span>
        {phase === 'found' && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            PDA found
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Seeds (comma-separated)
          </span>
          <input
            type="text"
            value={seedsInput}
            onChange={(e) => setSeedsInput(e.target.value)}
            disabled={phase === 'searching'}
            className="w-full bg-surface-200 border border-surface-border rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-solana-purple transition-colors disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Program ID
          </span>
          <input
            type="text"
            value={programIdInput}
            onChange={(e) => setProgramIdInput(e.target.value)}
            disabled={phase === 'searching'}
            className="w-full bg-surface-200 border border-surface-border rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-solana-purple transition-colors disabled:opacity-60"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={derive}
          disabled={phase === 'searching'}
          className="px-3 py-1.5 rounded-md bg-solana-purple hover:bg-[#a855f7] disabled:opacity-60 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{phase === 'searching' ? 'Deriving…' : 'Derive PDA'}</span>
        </button>
        {phase !== 'idle' && (
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md p-2.5">
          {error}
        </div>
      )}

      {/* Seed chips */}
      {(phase !== 'idle' || seedsInput.trim()) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {seedsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((seed, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-solana-purple/15 text-solana-purple border border-solana-purple/30"
              >
                {seed}
              </span>
            ))}
          <span className="text-[11px] font-mono text-slate-500">+ program id + bump</span>
        </div>
      )}

      {/* Live search state */}
      {phase === 'searching' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Trying bump <span className="text-amber-400 font-bold">{bump}</span>
            </span>
            <span>{attempts} / 256 attempts</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-solana-purple to-solana-teal transition-all duration-75"
              style={{ width: `${(attempts / 256) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-surface-200 border border-surface-border">
              <div className="text-slate-500 mb-0.5">Candidate pubkey</div>
              <div className="text-slate-300 break-all">
                {candidate ?? '…'}
              </div>
            </div>
            <div className="p-2 rounded bg-surface-200 border border-surface-border">
              <div className="text-slate-500 mb-0.5">On Ed25519 curve?</div>
              <div className={onCurve ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {onCurve === null ? '…' : onCurve ? 'Yes — try next bump' : 'No — found it!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'found' && pda && (
        <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-900/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-1">
              Program Derived Address
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-emerald-300 break-all flex-1">{pda}</code>
              <button
                onClick={copy}
                className="p-1.5 rounded bg-surface-200 hover:bg-surface-50 border border-surface-border text-slate-300 transition-colors"
                aria-label="Copy PDA"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-surface-200 border border-surface-border">
              <div className="text-slate-500 mb-0.5">Bump seed</div>
              <div className="text-white font-bold">{finalBump}</div>
            </div>
            <div className="p-2 rounded bg-surface-200 border border-surface-border">
              <div className="text-slate-500 mb-0.5">Attempts</div>
              <div className="text-white font-bold">{attempts}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The bump ({finalBump}) is the nonce Solana appended so the result lands off the curve.
            PDAs have no private key — only this program can sign for them.
          </p>
          <a
            href={`/dashboard?account=${encodeURIComponent(pda)}`}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-solana-teal hover:underline"
          >
            Inspect this PDA in the account explorer →
          </a>
        </div>
      )}
    </div>
  );
}