'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, SearchIcon, Wallet, Copy, Check, Globe } from 'lucide-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

type AccountResult =
  | {
      address: string;
      exists: false;
    }
  | {
      address: string;
      exists: true;
      lamports: number;
      owner: string;
      space: number;
      executable: boolean;
    };

interface AccountExplorerProps {
  /** Address to prefill (e.g. from the PDA visualizer via `?account=`). */
  initialAddress?: string;
  /** Inspect immediately on mount instead of waiting for the button. */
  autoInspect?: boolean;
}

/**
 * Embedded account explorer.
 *
 * Paste any pubkey and see its on-chain anatomy straight from the cluster:
 * does it exist, who owns it, how much SOL, how much data. Pairs with the PDA
 * visualizer — derive a PDA, then inspect it here and see "unknown account"
 * until a program initializes it.
 */
export default function AccountExplorer({ initialAddress = '', autoInspect = false }: AccountExplorerProps) {
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccountResult | null>(null);
  const [copied, setCopied] = useState(false);

  const inspect = useCallback(
    async (address: string) => {
      const target = address.trim();
      if (!target) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/account?address=${encodeURIComponent(target)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Lookup failed.');
          setResult(null);
        } else {
          setResult(data);
        }
      } catch {
        setError('Could not reach the RPC endpoint.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialAddress && autoInspect) {
      inspect(initialAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isOffCurve = result ? !PublicKey.isOnCurve(result.address) : false;
  const explorerUrl = result ? `https://explorer.solana.com/address/${result.address}?cluster=devnet` : null;

  return (
    <div className="rounded-lg border border-surface-border bg-surface-100 p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Wallet className="w-3.5 h-3.5 text-solana-teal" />
        <span className="text-xs font-mono font-semibold text-white">Account Explorer</span>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          inspect(addressInput);
        }}
      >
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Paste a pubkey or PDA…"
          spellCheck={false}
          className="flex-1 bg-surface-200 border border-surface-border rounded-md px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-solana-purple transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !addressInput.trim()}
          className="px-3 py-1.5 rounded-md bg-solana-purple hover:bg-[#a855f7] disabled:opacity-50 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchIcon className="w-3.5 h-3.5" />}
          <span>{loading ? '…' : 'Inspect'}</span>
        </button>
      </form>

      {error && (
        <div className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md p-2.5">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 animate-[fadeIn_0.25s_ease-out]">
          {/* Address row */}
          <div className="flex items-center gap-2 p-2.5 rounded bg-surface-200 border border-surface-border">
            <code className="text-[11px] font-mono text-solana-teal break-all flex-1">{result.address}</code>
            <button
              onClick={copy}
              className="p-1 rounded hover:bg-surface-50 text-slate-400 hover:text-white transition-colors"
              aria-label="Copy address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {result.exists ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-surface-200 border border-surface-border">
                  <div className="text-slate-500 mb-0.5">Balance</div>
                  <div className="text-white font-bold">
                    {(result.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                  </div>
                  <div className="text-[10px] text-slate-600">{result.lamports.toLocaleString()} lamports</div>
                </div>
                <div className="p-2 rounded bg-surface-200 border border-surface-border">
                  <div className="text-slate-500 mb-0.5">Data size</div>
                  <div className="text-white font-bold">{result.space} bytes</div>
                  <div className="text-[10px] text-slate-600">
                    {result.executable ? 'Executable (BPF program)' : 'Not executable'}
                  </div>
                </div>
              </div>
              <div className="p-2 rounded bg-surface-200 border border-surface-border">
                <div className="text-[10px] text-slate-500 mb-0.5">Owner program</div>
                <div className="text-[10px] font-mono text-slate-300 break-all">{result.owner}</div>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-900/60 rounded-md p-2.5 leading-relaxed">
              Unknown account — nothing has ever been written here (or it ran out of lamports and was
              closed). {isOffCurve && 'Note: this address is off the Ed25519 curve, so it behaves like a PDA.'}
            </div>
          )}

          {isOffCurve && result.exists && (
            <div className="text-[10px] font-mono text-solana-purple">
              Off-curve address — PDA-like, no private key.
            </div>
          )}

          <a
            href={explorerUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Globe className="w-3 h-3" />
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  );
}
