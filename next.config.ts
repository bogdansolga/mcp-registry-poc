import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Get git commit hash at build time (fallback for local dev, Docker passes via build args)
const getGitCommit = () => {
  if (process.env.NEXT_PUBLIC_BUILD_COMMIT) return process.env.NEXT_PUBLIC_BUILD_COMMIT;
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: getGitCommit(),
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  output: "standalone",

  //cacheComponents: true,

  experimental: {
    webpackBuildWorker: true,

    // Enable concurrent features for better performance
    cpus: Math.max(1, Math.floor(require("node:os").cpus().length * 0.8)),

    // allocate workers based on the memory
    memoryBasedWorkersCount: true,

    // Optimize build performance
    optimizeServerReact: true,

    // Enable Turbopack optimizations for faster compilation
    turbopackMemoryLimit: 1024 * 1024 * 1024 * 2, // 2GB

    turbopackSourceMaps: true, // Disable for faster dev builds

    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // Enable support for `global-not-found`, which allows you to more easily define a global 404 page
    globalNotFound: true,

    // Enable persistent caching for the turbopack dev server and build
    turbopackFileSystemCacheForDev: true,
  },

  async rewrites() {
    return [
      {
        source: "/_next/static/:path*",
        destination: "/static/:path*",
      },
    ];
  },
};

export default nextConfig;
