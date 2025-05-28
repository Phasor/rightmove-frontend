import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      // Disable font optimization in Turbopack
      resolveAlias: {
        '@vercel/turbopack-next/internal/font/google/font': require.resolve('next/dist/compiled/@next/font/google/index.js'),
      }
    }
  }
};

export default nextConfig;
