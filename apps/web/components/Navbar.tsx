'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Terminal, Award, Trophy, Code2, Droplets } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    async function fetchBalance() {
      if (publicKey && connected) {
        try {
          const bal = await connection.getBalance(publicKey);
          if (isSubscribed) setBalance(bal / LAMPORTS_PER_SOL);
        } catch {
          if (isSubscribed) setBalance(null);
        }
      } else {
        if (isSubscribed) setBalance(null);
      }
    }
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [publicKey, connected, connection]);

  const handleAirdrop = async () => {
    if (!publicKey || isAirdropping) return;
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      const res = await fetch('/api/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setAirdropMsg('Airdropped 1 SOL!');
        setTimeout(() => setAirdropMsg(null), 4000);
        // refresh balance
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } else {
        setAirdropMsg(data.error || 'Airdrop rate-limited');
        setTimeout(() => setAirdropMsg(null), 4000);
      }
    } catch {
      setAirdropMsg('Airdrop failed');
      setTimeout(() => setAirdropMsg(null), 4000);
    } finally {
      setIsAirdropping(false);
    }
  };

  const navLinks = [
    { label: 'Challenges', href: '/challenges', icon: Code2 },
    { label: 'Dashboard', href: '/dashboard', icon: Award },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-solana-purple to-solana-green p-[1px] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-background rounded flex items-center justify-center">
                <Terminal className="w-4 h-4 text-solana-green" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                SOLANA CODE ARENA
                <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-solana-purple/20 text-solana-purple border border-solana-purple/30">
                  DEMO DAY
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-100 text-white border border-surface-border'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Network, Balance, Airdrop, Wallet */}
        <div className="flex items-center gap-3">
          {/* Devnet Cluster Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 border border-surface-border text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solana-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-solana-green"></span>
            </span>
            <span>Devnet</span>
          </div>

          {/* Connected Balance & Airdrop */}
          {connected && publicKey && (
            <div className="flex items-center gap-2">
              {balance !== null && (
                <div className="hidden lg:flex items-center px-2 py-1 rounded bg-surface-200 border border-surface-border text-xs font-mono text-slate-300">
                  <span className="text-solana-green font-semibold mr-1">{balance.toFixed(3)}</span> SOL
                </div>
              )}
              <button
                onClick={handleAirdrop}
                disabled={isAirdropping}
                title="Request 1 Devnet SOL airdrop"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-50 border border-surface-border text-xs text-slate-300 transition-colors"
              >
                <Droplets className={`w-3 h-3 text-solana-teal ${isAirdropping ? 'animate-spin' : ''}`} />
                <span>{isAirdropping ? 'Airdropping...' : 'Airdrop'}</span>
              </button>
              {airdropMsg && (
                <span className="text-[11px] text-solana-green font-mono animate-fade-in">
                  {airdropMsg}
                </span>
              )}
            </div>
          )}

          {/* Wallet Multi Button */}
          {mounted ? (
            <WalletMultiButton className="!h-8 !text-xs !bg-surface-100 !border !border-surface-border hover:!border-solana-purple !rounded !px-3" />
          ) : (
            <div className="h-8 px-3 text-xs bg-surface-100 border border-surface-border rounded flex items-center justify-center font-mono text-slate-400">
              Select Wallet
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
