import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '../components/SolanaWalletProvider';
import { Navbar } from '../components/Navbar';

/** Self-hosted through next/font: no render-blocking request to Google. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Solana Code Arena | Learn Solana by Building',
    template: '%s | Solana Code Arena',
  },
  description:
    'Interactive learning platform for developers to master Solana development by solving practical coding challenges with verifiable on-chain proofs.',
  keywords: ['Solana', 'web3', 'learning', 'anchor', 'education', 'coding challenges'],
  openGraph: {
    title: 'Solana Code Arena',
    description:
      'Master Solana development by solving practical coding challenges with verifiable on-chain proofs.',
    type: 'website',
    siteName: 'Solana Code Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Code Arena',
    description: 'Learn Solana by building — 10 graded challenges with on-chain proofs.',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
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
