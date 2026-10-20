'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Route-level error boundary.
 *
 * Without this, any thrown error in a server component renders Next's blank
 * production error page — useless during a live demo.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-900 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Something broke on our side</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            This page could not finish loading. The database or the Devnet RPC may
            be briefly unavailable.
          </p>
        </div>

        {error.digest && (
          <p className="text-[11px] font-mono text-slate-600">Reference: {error.digest}</p>
        )}

        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-solana-purple hover:bg-[#a855f7] text-white font-semibold text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-surface-100 border border-surface-border hover:border-solana-purple/60 text-slate-300 font-medium text-xs font-mono transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}