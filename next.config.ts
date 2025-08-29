import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings in development
  reactStrictMode: true,

  // Experimental features to help with hydration
  experimental: {
    // Reduce hydration mismatches
    optimizePackageImports: ["@radix-ui/react-icons"],
  },

  // Webpack configuration to handle hydration issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suppress hydration warnings in development
      config.infrastructureLogging = {
        level: "warn",
      };
    }
    return config;
  },
};

export default nextConfig;
