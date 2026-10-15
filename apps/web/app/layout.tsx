import type { Metadata } from 'next';
import './globals.css';
import { SolanaWalletProvider } from '../components/SolanaWalletProvider';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Solana Code Arena | Learn Solana by Building',
  description: 'Interactive learning platform for developers to master Solana development by solving practical coding challenges with verifiable on-chain proofs.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-slate-100 flex flex-col font-sans antialiased selection:bg-solana-purple selection:text-white">
        <SolanaWalletProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-surface-border bg-surface-200/50 py-4 px-6 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Solana Code Arena • Fall Class Demo Day</span>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Cluster: Solana Devnet</span>
                <span className="text-slate-600">|</span>
                <a
                  href="https://docs.solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-solana-green transition-colors"
                >
                  Solana Docs
                </a>
                <span className="text-slate-600">|</span>
                <a
                  href="https://anchor-lang.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-solana-purple transition-colors"
                >
                  Anchor Book
                </a>
              </div>
            </div>
          </footer>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
