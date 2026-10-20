import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/** Shown for unknown routes and unknown challenge slugs. */
export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-surface-100 border border-surface-border flex items-center justify-center">
            <FileQuestion className="w-6 h-6 text-solana-purple" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Page not found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            That route does not exist. If you were looking for a challenge, it may
            have been renamed.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-solana-purple hover:bg-[#a855f7] text-white font-semibold text-xs font-mono transition-colors"
          >
            <span>Browse challenges</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-surface-100 border border-surface-border hover:border-solana-purple/60 text-slate-300 font-medium text-xs font-mono transition-colors"
          >
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}