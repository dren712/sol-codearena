const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@packages/types': path.resolve(__dirname, 'lib/types'),
      '@packages/sdk': path.resolve(__dirname, 'lib/sdk'),
      '@packages/validator': path.resolve(__dirname, 'lib/validator'),
      '@challenges/data': path.resolve(__dirname, 'lib/challenges'),
      '@solana-mobile/wallet-adapter-mobile': false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
