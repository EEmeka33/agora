import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching are the Next.js 16 defaults and will be
  // mandatory in Next.js 17. Every page reads the session behind a <Suspense>
  // boundary (see src/app/(app)/layout.tsx and loading.tsx).
  cacheComponents: true,
  partialPrefetching: true,
  // Native SQLite driver must stay a Node.js dependency.
  serverExternalPackages: ["better-sqlite3"],
  // Allow opening the dev server from other devices on your network (phone, laptop…).
  // Add your machine's LAN IP or hostname here if needed, e.g. "192.168.1.20".
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
