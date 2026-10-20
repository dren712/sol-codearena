export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-surface-border border-t-solana-purple animate-spin" />
        <span className="text-xs font-mono text-slate-500">Loading…</span>
      </div>
    </div>
  );
}