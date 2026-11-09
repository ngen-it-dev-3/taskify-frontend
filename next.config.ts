// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      // ✅ Using only your official backend now
      {
        protocol: "https",
        hostname: "orvix-backend.ngengroup.org",
        pathname: "/uploads/**",
      },
    ],
  },

  async rewrites() {
    // ✅ Using your official backend on HTTPS
    const backendOrigin = (
      process.env.NEXT_PUBLIC_API_URL ?? "https://taskify-server-5gat.onrender.com/api/v1"
    ).replace(/\/api\/v1\/?$/, "");

    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;