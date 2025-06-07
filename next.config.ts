import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  
  turbopack: {
    // Disable font optimization in Turbopack
    resolveAlias: {
      '@vercel/turbopack-next/internal/font/google/font': require.resolve('next/dist/compiled/@next/font/google/index.js'),
    }
  },
  
  // Configure server-side fetch behavior
  serverRuntimeConfig: {
    fetchRetry: 3,
    fetchTimeout: 10000,
  }
};

export default nextConfig;
