/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0b0e',
        surface: {
          50: '#1e2230',
          100: '#161923',
          200: '#12141c',
          300: '#0d0e14',
          border: '#242a3a',
          'border-subtle': '#1c202d',
        },
        solana: {
          purple: '#9945FF',
          green: '#14F195',
          teal: '#00C2FF',
          glow: 'rgba(153, 69, 255, 0.15)',
        },
      },
      fontFamily: {
        // First entries are the CSS variables set by next/font in app/layout.tsx.
        mono: ['var(--font-mono)', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
