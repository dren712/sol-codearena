'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, X, CheckCircle2 } from 'lucide-react';

interface CertificateCardProps {
  challengeTitle: string;
  challengeId: string;
  score: number;
  verified: boolean;
  walletAddress: string;
  onClose?: () => void;
}

/**
 * Shareable completion certificate.
 *
 * Renders an SVG so it stays crisp at any size, and offers a one-click
 * download. No canvas / html2canvas dependency — the SVG is the artifact.
 */
export default function CertificateCard({
  challengeTitle,
  challengeId,
  score,
  verified,
  walletAddress,
  onClose,
}: CertificateCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);

  const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const download = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solana-arena-${challengeId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = `I just completed "${challengeTitle}" on Solana Code Arena — ${score} pts${verified ? ' (verified on-chain)' : ''}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Solana Code Arena', text });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative max-w-lg w-full">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-surface-100 border border-surface-border text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 480 300"
          className="w-full h-auto rounded-xl shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cert-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#161821" />
              <stop offset="100%" stopColor="#0f1117" />
            </linearGradient>
            <linearGradient id="cert-accent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9945FF" />
              <stop offset="100%" stopColor="#14F195" />
            </linearGradient>
          </defs>

          <rect width="480" height="300" rx="16" fill="url(#cert-bg)" />
          <rect x="1" y="1" width="478" height="298" rx="15" fill="none" stroke="#2a2d3a" strokeWidth="1" />
          <rect x="24" y="24" width="432" height="4" rx="2" fill="url(#cert-accent)" />

          <text x="240" y="62" textAnchor="middle" fill="#9945FF" fontSize="11" fontFamily="monospace" letterSpacing="3">
            SOLANA CODE ARENA
          </text>
          <text x="240" y="92" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="700" fontFamily="sans-serif">
            Certificate of Completion
          </text>

          <text x="240" y="124" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            This certifies that
          </text>
          <text x="240" y="148" textAnchor="middle" fill="#14F195" fontSize="16" fontWeight="600" fontFamily="monospace">
            {shortWallet}
          </text>

          <text x="240" y="178" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            has completed
          </text>
          <text x="240" y="202" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="600" fontFamily="sans-serif">
            {challengeTitle}
          </text>

          <g transform="translate(240, 228)">
            <text x="-120" y="0" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Score
            </text>
            <text x="-120" y="16" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="monospace">
              {score} pts
            </text>

            <text x="0" y="0" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Challenge
            </text>
            <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="monospace">
              {challengeId}
            </text>

            <text x="120" y="0" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Verified
            </text>
            <text x="120" y="16" textAnchor="middle" fill={verified ? '#14F195' : '#f59e0b'} fontSize="14" fontWeight="700" fontFamily="monospace">
              {verified ? 'On-chain' : 'Local'}
            </text>
          </g>

          <text x="240" y="278" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">
            {date} · solana-code-arena
          </text>
        </svg>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={download}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-solana-purple hover:bg-[#a855f7] text-white text-xs font-mono font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-100 border border-surface-border hover:border-solana-purple/60 text-slate-300 text-xs font-mono font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {verified && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified against Solana Devnet</span>
          </div>
        )}
      </div>
    </div>
  );
}